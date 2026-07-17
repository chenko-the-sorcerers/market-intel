import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { crawlSource, summarizeDeterministic, toUpdate } from "./crawler.mjs";
import { summarizeUpdate } from "../../api/_llm.js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const args = parseArgs(process.argv.slice(2));
const configPath = resolve(root, args.config || "scripts/monitor/config.json");
const config = JSON.parse(await readFile(configPath, "utf8"));
const statePath = resolve(root, args.state || config.statePath || ".monitor-state.json");
const outputPath = resolve(root, args.output || config.outputPath || "outputs/monitor-updates.json");
const mode = args.mode || "fetch";
const saveGas = Boolean(args["save-gas"]);
const dryRun = Boolean(args["dry-run"]);
const resetState = Boolean(args["reset-state"]);
const useAi = !args["no-ai"];

const state = resetState ? { seenHashes: [] } : await readJson(statePath, { seenHashes: [] });
const seen = new Set(state.seenHashes || []);
const sources = config.sources.filter((source) =>
  ["website", "news", "rss"].includes(source.source_type) && source.monitoring_status !== "manual",
);

const discoveredUpdates = [];
const errors = [];
const sourceStats = new Map(sources.map((source) => [source.source_id, { updates: 0, error: "" }]));

for (const source of sources) {
  try {
    const pages = await crawlSource(source, {
      mode,
      maxLinksPerSource: Number(args.limit || config.maxLinksPerSource || 8),
      verbose: Boolean(args.verbose),
    });

    for (const page of pages) {
      const summary = useAi
        ? await summarizeWithFallback(page)
        : summarizeDeterministic({
            title: page.title,
            rawText: page.text,
            sourceUrl: page.url,
          });
      const update = toUpdate(source, page, summary);
      if (seen.has(update.content_hash)) continue;
      seen.add(update.content_hash);
      discoveredUpdates.push(update);
      const stats = sourceStats.get(source.source_id);
      if (stats) stats.updates += 1;
    }
  } catch (error) {
    errors.push({ source: source.url, error: error.message });
    const stats = sourceStats.get(source.source_id);
    if (stats) stats.error = error.message;
  }
}

const result = {
  ok: true,
  mode,
  checked_sources: sources.length,
  inserted: discoveredUpdates.length,
  errors,
  updates: discoveredUpdates,
  generated_at: new Date().toISOString(),
};

await writeJson(outputPath, result);

if (!dryRun) {
  await writeJson(statePath, {
    seenHashes: [...seen],
    lastRunAt: new Date().toISOString(),
  });
}

if (saveGas) {
  const {
    insertGasUpdates,
    saveGasMonitoringRun,
    saveGasMonitoringRunItem,
  } = await import("../../api/_gas.js");
  const startedAt = result.generated_at;
  const finishedAt = new Date().toISOString();
  let run = null;
  result.gas_audit = { enabled: true };
  try {
    run = await saveGasMonitoringRun({
      run_type: dryRun ? "local_dry_run" : "local_manual",
      started_at: startedAt,
      finished_at: "",
      status: "running",
      summary: "Local crawler run started.",
    });
  } catch (error) {
    result.gas_audit = { enabled: false, warning: error.message };
  }

  result.gas = await insertGasUpdates({ updates: discoveredUpdates });

  if (run) {
    await Promise.all(
      sources.map((source) => {
        const stats = sourceStats.get(source.source_id) || { updates: 0, error: "" };
        return saveGasMonitoringRunItem({
          monitoring_run_id: run.id,
          company_id: source.company_id,
          source_id: source.source_id,
          status: stats.error ? "failed" : "success",
          updates_found: stats.updates,
          error_message: stats.error,
          started_at: startedAt,
          finished_at: finishedAt,
        });
      }),
    );
    await saveGasMonitoringRun({
      id: run.id,
      finished_at: finishedAt,
      status: errors.length ? "partial_success" : "success",
      companies_checked: new Set(sources.map((source) => source.company_id)).size,
      updates_found: result.gas.inserted?.length || 0,
      errors_count: errors.length,
      summary: `Local crawler checked ${sources.length} source(s). Inserted ${result.gas.inserted?.length || 0}, deduped ${
        result.gas.deduped?.length || 0
      }.`,
    });
    result.monitoring_run_id = run.id;
  }
}

console.log(JSON.stringify(result, null, 2));

async function summarizeWithFallback(page) {
  try {
    return await summarizeUpdate({
      title: page.title,
      rawText: page.text,
      sourceUrl: page.url,
    });
  } catch {
    return summarizeDeterministic({
      title: page.title,
      rawText: page.text,
      sourceUrl: page.url,
    });
  }
}

async function readJson(path, fallback) {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch {
    return fallback;
  }
}

async function writeJson(path, value) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(value, null, 2));
}

function parseArgs(argv) {
  const parsed = {};
  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (!item.startsWith("--")) continue;
    const key = item.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      parsed[key] = true;
    } else {
      parsed[key] = next;
      index += 1;
    }
  }
  return parsed;
}
