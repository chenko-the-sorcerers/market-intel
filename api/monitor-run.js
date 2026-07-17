import { sql } from "@vercel/postgres";
import { ensureSchema, hashText, hasDatabase, seedDatabase } from "./_db.js";
import {
  getGasMonitorSources,
  hasGas,
  insertGasUpdates,
  saveGasMonitoringRun,
  saveGasMonitoringRunItem,
  seedGasData,
} from "./_gas.js";
import { summarizeUpdate } from "./_llm.js";

const MAX_LINKS_PER_SOURCE = 8;

export default async function handler(request, response) {
  if (!["GET", "POST"].includes(request.method)) {
    return response.status(405).json({ error: "Method not allowed" });
  }

  try {
    if (hasGas()) {
      await seedGasData();
      const startedAt = new Date().toISOString();
      const audit = { enabled: true, warning: "" };
      let run = null;
      try {
        run = await saveGasMonitoringRun({
          run_type: request.method === "GET" ? "scheduled_or_manual_get" : "manual_post",
          scheduled_for: "",
          started_at: startedAt,
          status: "running",
          summary: "Monitoring run started.",
        });
      } catch (error) {
        audit.enabled = false;
        audit.warning = error.message;
      }
      const sources = await getGasMonitorSources();
      const discovered = await discoverUpdates(sources);
      const saved = await insertGasUpdates({ updates: discovered.updates });
      const insertedCount = saved.inserted?.length || 0;
      const dedupedCount = saved.deduped?.length || 0;
      const finishedAt = new Date().toISOString();
      const updatesBySource = discovered.updates.reduce((counts, update) => {
        counts[update.source_id] = (counts[update.source_id] || 0) + 1;
        return counts;
      }, {});
      if (run) {
        await Promise.all(
          sources.map((source) => {
            const error = discovered.errors.find((item) => item.source === source.url);
            return saveGasMonitoringRunItem({
              monitoring_run_id: run.id,
              company_id: source.company_id,
              source_id: source.source_id,
              status: error ? "failed" : "success",
              updates_found: updatesBySource[source.source_id] || 0,
              error_message: error?.error || "",
              started_at: startedAt,
              finished_at: finishedAt,
            });
          }),
        );
        await saveGasMonitoringRun({
          id: run.id,
          finished_at: finishedAt,
          status: discovered.errors.length ? "partial_success" : "success",
          companies_checked: new Set(sources.map((source) => source.company_id)).size,
          updates_found: insertedCount,
          errors_count: discovered.errors.length,
          summary: `Checked ${sources.length} source(s). Inserted ${insertedCount}, deduped ${dedupedCount}.`,
        });
      }
      return response.status(200).json({
        ok: true,
        storage: "gas",
        checked_sources: sources.length,
        inserted: insertedCount,
        deduped: dedupedCount,
        errors: discovered.errors,
        updates: saved.inserted || [],
        monitoring_run_id: run?.id || null,
        audit,
      });
    }

    if (!hasDatabase()) {
      return response.status(501).json({ error: "GAS_WEB_APP_URL or POSTGRES_URL is not configured." });
    }

    await seedDatabase();
    await ensureSchema();

    const sources = await sql`
      select
        cs.id as source_id,
        cs.url,
        cs.source_type,
        cs.fetch_strategy,
        c.id as company_id,
        c.name as company_name
      from company_sources cs
      join companies c on c.id = cs.company_id
      where c.monitoring_status = 'active'
        and cs.monitoring_status = 'active'
        and cs.source_type in ('website', 'news', 'rss')
      order by cs.created_at asc
    `;

    const discovered = await discoverUpdates(sources.rows);
    const inserted = [];
    const deduped = [];

    for (const update of discovered.updates) {
      const result = await sql`
        insert into updates (
          company_id, source_id, source_type, source_url, canonical_url,
          title, raw_text, snippet, language, published_at, discovered_at,
          content_hash, ai_summary_en, ai_importance, ai_confidence, facts,
          inferences, risk_categories, labels, status
        )
        values (
          ${update.company_id}, ${update.source_id}, ${update.source_type}, ${update.source_url},
          ${update.canonical_url}, ${update.title}, ${update.raw_text}, ${update.snippet},
          ${update.language}, null, ${update.discovered_at}, ${update.content_hash},
          ${update.ai_summary_en}, ${update.ai_importance}, ${update.ai_confidence},
          ${update.facts}, ${update.inferences}, ${JSON.stringify(update.risk_categories)}::jsonb,
          ${JSON.stringify(update.labels)}::jsonb, ${update.status}
        )
        on conflict (content_hash) do nothing
        returning id, title, source_url
      `;
      if (result.rows[0]) inserted.push(result.rows[0]);
      else deduped.push(update.source_url);
    }

    for (const source of sources.rows) {
      await sql`
        update company_sources
        set last_checked_at = now(), last_success_at = now(), last_error = null, updated_at = now()
        where id = ${source.source_id}
      `;
    }

    return response.status(200).json({
      ok: true,
      storage: "postgres",
      checked_sources: sources.rows.length,
      inserted: inserted.length,
      deduped: deduped.length,
      errors: discovered.errors,
      updates: inserted,
    });
  } catch (error) {
    return response.status(500).json({ error: error.message || "Monitor run failed" });
  }
}

async function discoverUpdates(sources) {
  const updates = [];
  const errors = [];

  for (const source of sources) {
    try {
      const discovered = await crawlSource(source.url);
      for (const item of discovered.slice(0, MAX_LINKS_PER_SOURCE)) {
        const summary = await summarizeUpdate({
          title: item.title,
          rawText: item.text,
          sourceUrl: item.url,
        });
        updates.push({
          company_id: source.company_id,
          source_id: source.source_id,
          source_type: source.source_type,
          source_url: item.url,
          canonical_url: item.url,
          title: item.title,
          raw_text: item.text,
          snippet: item.text.slice(0, 400),
          language: "en",
          published_at: "",
          discovered_at: new Date().toISOString(),
          content_hash: hashText(`${source.company_id}:${item.url}:${item.title}:${item.text.slice(0, 800)}`),
          ai_summary_en: summary.summary,
          ai_importance: summary.priority,
          ai_confidence: summary.confidence,
          facts: summary.facts,
          inferences: summary.inferences,
          risk_categories: summary.risk_categories,
          labels: summary.labels,
          status: "new",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
    } catch (error) {
      errors.push({ source: source.url, error: error.message });
    }
  }

  return { updates, errors };
}

async function crawlSource(startUrl) {
  const response = await fetch(startUrl, {
    headers: {
      "User-Agent": "MarketIntelMVP/0.1 (+https://github.com/chenko-the-sorcerers/market-intel)",
    },
  });
  if (!response.ok) throw new Error(`Fetch failed ${response.status} for ${startUrl}`);

  const contentType = response.headers.get("content-type") || "";
  const text = await response.text();
  if (contentType.includes("xml") || text.trim().startsWith("<?xml")) {
    return parseRss(text, startUrl);
  }

  const home = {
    title: extractTag(text, "title") || startUrl,
    url: startUrl,
    text: extractMeta(text, "description") || cleanText(text).slice(0, 2500),
  };

  const links = extractLinks(text, startUrl)
    .filter((link) => /news|blog|press|insight|article|rss|feed/i.test(link.url + " " + link.text))
    .slice(0, MAX_LINKS_PER_SOURCE - 1);

  const linkedPages = [];
  for (const link of links) {
    try {
      const linked = await fetch(link.url, {
        headers: { "User-Agent": "MarketIntelMVP/0.1" },
      });
      if (!linked.ok) continue;
      const body = await linked.text();
      linkedPages.push({
        title: extractTag(body, "title") || link.text || link.url,
        url: link.url,
        text: extractMeta(body, "description") || cleanText(body).slice(0, 2500),
      });
    } catch {
      // Keep the crawl resilient.
    }
  }

  return [home, ...linkedPages].filter((item) => item.text);
}

function parseRss(xml, fallbackUrl) {
  const items = [...xml.matchAll(/<item[\s\S]*?<\/item>/gi)].slice(0, MAX_LINKS_PER_SOURCE);
  return items.map((match) => {
    const item = match[0];
    return {
      title: stripXml(extractXml(item, "title")) || fallbackUrl,
      url: stripXml(extractXml(item, "link")) || fallbackUrl,
      text: stripXml(extractXml(item, "description") || extractXml(item, "content:encoded")),
    };
  });
}

function extractLinks(html, baseUrl) {
  return [...html.matchAll(/<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)]
    .map((match) => {
      try {
        return { url: new URL(match[1], baseUrl).href, text: cleanText(match[2]) };
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

function extractTag(html, tag) {
  const match = html.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match ? decodeEntities(match[1]).trim() : "";
}

function extractXml(xml, tag) {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match ? match[1] : "";
}

function extractMeta(html, name) {
  const patterns = [
    new RegExp(`<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']+)["'][^>]*>`, "i"),
    new RegExp(`<meta[^>]+property=["']og:${name}["'][^>]+content=["']([^"']+)["'][^>]*>`, "i"),
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) return decodeEntities(match[1]).trim();
  }
  return "";
}

function cleanText(html) {
  return decodeEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " "),
  ).trim();
}

function stripXml(value) {
  return cleanText(String(value || "").replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1"));
}

function decodeEntities(text) {
  return String(text || "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}
