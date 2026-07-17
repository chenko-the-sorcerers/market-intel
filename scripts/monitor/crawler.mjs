import { createHash } from "node:crypto";

export async function crawlSource(source, options = {}) {
  const maxLinks = options.maxLinksPerSource || 8;
  const page = await fetchPage(source.url, options);

  if (looksLikeXml(page.contentType, page.text)) {
    return parseRss(page.text, source.url).slice(0, maxLinks);
  }

  const home = {
    title: extractTag(page.text, "title") || source.company_name || source.url,
    url: source.url,
    text: extractMeta(page.text, "description") || cleanText(page.text).slice(0, 3200),
    discovered_via: "homepage",
  };

  const links = extractLinks(page.text, source.url)
    .filter((link) => /news|blog|press|insight|article|rss|feed|publication|research/i.test(link.url + " " + link.text))
    .slice(0, maxLinks - 1);
  const candidateLinks = commonDiscoveryUrls(source.url).map((url) => ({ url, text: url }));
  const uniqueLinks = dedupeLinks([...links, ...candidateLinks]).slice(0, maxLinks - 1);

  const linkedPages = [];
  for (const link of uniqueLinks) {
    try {
      const linked = await fetchPage(link.url, options);
      if (looksLikeXml(linked.contentType, linked.text)) {
        linkedPages.push(...parseRss(linked.text, link.url));
        continue;
      }
      linkedPages.push({
        title: extractTag(linked.text, "title") || link.text || link.url,
        url: link.url,
        text: extractMeta(linked.text, "description") || cleanText(linked.text).slice(0, 3200),
        discovered_via: link.text || "linked page",
      });
    } catch (error) {
      if (options.verbose) console.warn(`Skipped ${link.url}: ${error.message}`);
    }
  }

  return [home, ...linkedPages].filter((item) => item.text).slice(0, maxLinks);
}

export function toUpdate(source, item, summary) {
  const now = new Date().toISOString();
  const contentHash = hashText(`${source.company_id}:${item.url}:${item.title}:${item.text.slice(0, 1000)}`);
  return {
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
    discovered_at: now,
    content_hash: contentHash,
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
}

export function summarizeDeterministic({ title, rawText, sourceUrl }) {
  const labels = inferLabels(`${title} ${rawText}`);
  return {
    summary: `Fact: ${String(rawText || "").slice(0, 520)} Source: ${sourceUrl}`,
    facts: String(rawText || "").slice(0, 900),
    inferences: "Inference should be reviewed by the researcher. This item may be relevant for company positioning, ESG risk, AI strategy, or source-health monitoring.",
    labels,
    risk_categories: labels.filter((label) =>
      ["ESG", "Climate", "Regulatory", "Reputation", "Operational Risk", "Market Risk"].includes(label),
    ),
    priority: labels.some((label) => ["ESG", "Climate", "Regulatory", "Operational Risk"].includes(label))
      ? "High"
      : "Medium",
    confidence: 0.58,
  };
}

export function hashText(value) {
  return createHash("sha256").update(String(value || "")).digest("hex");
}

async function fetchPage(url, options) {
  if (options.mode === "browser") {
    const { fetchWithBrowser } = await import("./browser-page.mjs");
    return fetchWithBrowser(url, options);
  }

  const response = await fetch(url, {
    headers: {
      "User-Agent":
        options.userAgent ||
        "MarketIntelLocalMonitor/0.1 (+https://github.com/chenko-the-sorcerers/market-intel)",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
    redirect: "follow",
  });
  if (!response.ok) throw new Error(`Fetch failed ${response.status} for ${url}`);
  return {
    url: response.url,
    contentType: response.headers.get("content-type") || "",
    text: await response.text(),
  };
}

function looksLikeXml(contentType, text) {
  return contentType.includes("xml") || text.trim().startsWith("<?xml") || text.includes("<rss");
}

function parseRss(xml, fallbackUrl) {
  const items = [...xml.matchAll(/<item[\s\S]*?<\/item>/gi)];
  return items.map((match) => {
    const item = match[0];
    return {
      title: stripXml(extractXml(item, "title")) || fallbackUrl,
      url: stripXml(extractXml(item, "link")) || fallbackUrl,
      text: stripXml(extractXml(item, "description") || extractXml(item, "content:encoded")),
      discovered_via: "rss",
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

function commonDiscoveryUrls(baseUrl) {
  const paths = [
    "/news",
    "/blog",
    "/press",
    "/insights",
    "/research",
    "/publications",
    "/feed",
    "/rss",
    "/rss.xml",
    "/feed.xml",
    "/sitemap.xml",
  ];
  return paths.map((path) => new URL(path, baseUrl).href);
}

function dedupeLinks(links) {
  const seen = new Set();
  return links.filter((link) => {
    if (seen.has(link.url)) return false;
    seen.add(link.url);
    return true;
  });
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

function stripXml(value) {
  return cleanText(String(value || "").replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1"));
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

function inferLabels(text) {
  const lower = String(text || "").toLowerCase();
  const labels = new Set(["Website"]);
  if (/esg|sustainab|impact|net.?zero/.test(lower)) labels.add("ESG");
  if (/climate|carbon|transition|emission/.test(lower)) labels.add("Climate");
  if (/regulat|compliance|sfdr|taxonomy|governance/.test(lower)) labels.add("Regulatory");
  if (/quality|defect|risk|testing|six sigma/.test(lower)) labels.add("Operational Risk");
  if (/ai|machine learning|neural|data science|nlp|deep learning/.test(lower)) labels.add("AI");
  if (/market|investment|asset|finance/.test(lower)) labels.add("Market Risk");
  if (/linkedin|instagram|twitter|x\.com/.test(lower)) labels.add("Source Health");
  return [...labels];
}
