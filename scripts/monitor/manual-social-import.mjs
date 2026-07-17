import { readFile } from "node:fs/promises";
import { hashText, summarizeDeterministic, toUpdate } from "./crawler.mjs";

const inputPath = process.argv[2];
if (!inputPath) {
  console.error("Usage: node scripts/monitor/manual-social-import.mjs path/to/manual-posts.json");
  process.exit(1);
}

const posts = JSON.parse(await readFile(inputPath, "utf8"));
const updates = posts.map((post) => {
  const source = {
    company_id: post.company_id,
    source_id: post.source_id || `${post.source_type}-manual`,
    source_type: post.source_type || "manual",
  };
  const item = {
    title: post.title || post.url || "Manual social update",
    url: post.url || post.source_url || "",
    text: post.text || post.raw_text || post.caption || "",
  };
  const summary = summarizeDeterministic({
    title: item.title,
    rawText: item.text,
    sourceUrl: item.url,
  });
  const update = toUpdate(source, item, summary);
  update.content_hash = post.content_hash || hashText(`${source.company_id}:${item.url}:${item.text.slice(0, 1000)}`);
  return update;
});

console.log(JSON.stringify({ ok: true, updates }, null, 2));
