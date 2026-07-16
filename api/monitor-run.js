import { sql } from "@vercel/postgres";
import { ensureSchema, hashText, hasDatabase, seedDatabase } from "./_db.js";
import { summarizeUpdate } from "./_llm.js";

const MAX_LINKS_PER_SOURCE = 8;

export default async function handler(request, response) {
  if (!["GET", "POST"].includes(request.method)) {
    return response.status(405).json({ error: "Method not allowed" });
  }
  if (!hasDatabase()) {
    return response.status(501).json({ error: "POSTGRES_URL is not configured." });
  }

  try {
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

    const inserted = [];
    const skipped = [];
    const errors = [];

    for (const source of sources.rows) {
      try {
        const discovered = await crawlSource(source.url);
        for (const item of discovered.slice(0, MAX_LINKS_PER_SOURCE)) {
          const contentHash = hashText(`${source.company_id}:${item.url}:${item.title}:${item.text.slice(0, 800)}`);
          const summary = await summarizeUpdate({
            title: item.title,
            rawText: item.text,
            sourceUrl: item.url,
          });

          const result = await sql`
            insert into updates (
              company_id, source_id, source_type, source_url, canonical_url,
              title, raw_text, snippet, content_hash, ai_summary_en,
              ai_importance, ai_confidence, facts, inferences,
              risk_categories, labels, status
            )
            values (
              ${source.company_id}, ${source.source_id}, ${source.source_type}, ${item.url},
              ${item.url}, ${item.title}, ${item.text}, ${item.text.slice(0, 400)},
              ${contentHash}, ${summary.summary}, ${summary.priority}, ${summary.confidence},
              ${summary.facts}, ${summary.inferences}, ${JSON.stringify(summary.risk_categories)}::jsonb,
              ${JSON.stringify(summary.labels)}::jsonb, 'new'
            )
            on conflict (content_hash) do nothing
            returning id, title, source_url
          `;

          if (result.rows[0]) inserted.push(result.rows[0]);
          else skipped.push(item.url);
        }

        await sql`
          update company_sources
          set last_checked_at = now(), last_success_at = now(), last_error = null, updated_at = now()
          where id = ${source.source_id}
        `;
      } catch (error) {
        errors.push({ source: source.url, error: error.message });
        await sql`
          update company_sources
          set last_checked_at = now(), last_error = ${error.message}, updated_at = now()
          where id = ${source.source_id}
        `;
      }
    }

    return response.status(200).json({
      ok: true,
      checked_sources: sources.rows.length,
      inserted: inserted.length,
      deduped: skipped.length,
      errors,
      updates: inserted,
    });
  } catch (error) {
    return response.status(500).json({ error: error.message || "Monitor run failed" });
  }
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
      // Keep the crawl resilient; source health records the parent fetch.
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
        return {
          url: new URL(match[1], baseUrl).href,
          text: cleanText(match[2]),
        };
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
