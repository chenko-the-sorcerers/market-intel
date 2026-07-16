import { summarizeUpdate } from "./_llm.js";

export default async function handler(request, response) {
  if (request.method !== "POST") {
    return response.status(405).json({ error: "Method not allowed" });
  }

  const { company, sourceUrl } = request.body || {};
  if (!company || !sourceUrl) {
    return response.status(400).json({ error: "company and sourceUrl are required" });
  }

  try {
    const url = new URL(sourceUrl);
    const fetched = await fetch(url, {
      headers: {
        "User-Agent": "MarketIntelMVP/0.1 (+https://github.com/chenko-the-sorcerers/market-intel)",
      },
    });

    if (!fetched.ok) {
      return response.status(fetched.status).json({ error: `Fetch failed: ${fetched.status}` });
    }

    const html = await fetched.text();
    const title = extractTag(html, "title") || `Website refresh: ${company}`;
    const description =
      extractMeta(html, "description") ||
      cleanText(html).slice(0, 420) ||
      "Website was fetched successfully, but no readable description was found.";
    const summary = await summarizeUpdate({
      title,
      rawText: description,
      sourceUrl: url.href,
    });

    return response.status(200).json({
      title,
      summary: summary.summary,
      labels: summary.labels,
      risk_categories: summary.risk_categories,
      priority: summary.priority,
      published: "Fetched website",
      sourceUrl: url.href,
    });
  } catch (error) {
    return response.status(500).json({ error: error.message || "Monitor failed" });
  }
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
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " "),
  ).trim();
}

function decodeEntities(text) {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}
