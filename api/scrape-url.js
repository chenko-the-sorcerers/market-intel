import { createHash } from "node:crypto";
import { insertGasUpdates } from "./_gas.js";
import { summarizeUpdate } from "./_llm.js";

export default async function handler(request, response) {
  if (request.method !== "POST") {
    return response.status(405).json({ error: "Method not allowed" });
  }

  const {
    url,
    company_id,
    company_name = "Manual company",
    source_id = "manual-url",
    source_type = "website",
  } = request.body || {};

  if (!url) return response.status(400).json({ error: "url is required" });

  try {
    const target = new URL(url);
    const page = await fetchReadablePage(target.href);
    const title = extractTag(page.text, "title") || company_name || target.href;
    const rawText =
      extractMeta(page.text, "description") ||
      cleanText(page.text).slice(0, 3200) ||
      `Manual source URL: ${target.href}`;

    const summary = await summarizeUpdate({
      title,
      rawText,
      sourceUrl: target.href,
    });

    const now = new Date().toISOString();
    const update = {
      company_id,
      source_id,
      source_type,
      source_url: target.href,
      canonical_url: target.href,
      title,
      raw_text: rawText,
      snippet: rawText.slice(0, 400),
      language: "en",
      published_at: "",
      discovered_at: now,
      content_hash: hashText(`${company_id}:${target.href}:${title}:${rawText.slice(0, 1000)}`),
      ai_summary_en: summary.summary,
      ai_importance: summary.priority,
      ai_confidence: summary.confidence,
      facts: summary.facts,
      inferences: summary.inferences,
      risk_categories: summary.risk_categories,
      labels: summary.labels,
      status: "new",
      created_at: now,
      updated_at: now,
    };

    const saved = await insertGasUpdates({ updates: [update] });
    return response.status(200).json({
      ok: true,
      inserted: saved.inserted?.length || 0,
      deduped: saved.deduped?.length || 0,
      update,
      saved,
    });
  } catch (error) {
    return response.status(500).json({ error: error.message || "Scrape failed" });
  }
}

async function fetchReadablePage(url) {
  const fetched = await fetch(url, {
    headers: {
      "User-Agent": "MarketIntelManualScraper/0.1 (+https://github.com/chenko-the-sorcerers/market-intel)",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
    redirect: "follow",
  });
  if (!fetched.ok) throw new Error(`Fetch failed: ${fetched.status}`);
  return {
    url: fetched.url,
    contentType: fetched.headers.get("content-type") || "",
    text: await fetched.text(),
  };
}

function extractTag(html, tag) {
  const match = html.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match ? decodeEntities(match[1]).trim() : "";
}

function extractMeta(html, name) {
  const patterns = [
    new RegExp(`<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']+)["'][^>]*>`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${name}["'][^>]*>`, "i"),
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
    String(html || "")
      .replace(/<!--[\s\S]*?-->/g, " ")
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " "),
  ).trim();
}

function decodeEntities(text) {
  return String(text || "")
    .replace(/&nbsp;/g, " ")
    .replace(/&copy;/g, "(c)")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function hashText(value) {
  return createHash("sha256").update(String(value || "")).digest("hex");
}
