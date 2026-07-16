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

    const labels = inferLabels(`${title} ${description}`);
    const priority = labels.some((label) => ["ESG", "Climate", "Regulatory", "Operational Risk"].includes(label))
      ? "High"
      : "Medium";

    return response.status(200).json({
      title,
      summary: `Fact: ${description} Source: ${url.href}`,
      labels,
      priority,
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

function inferLabels(text) {
  const lower = text.toLowerCase();
  const labels = new Set(["Website"]);
  if (/esg|sustainab|impact|net.?zero/.test(lower)) labels.add("ESG");
  if (/climate|carbon|transition|emission/.test(lower)) labels.add("Climate");
  if (/regulat|compliance|sfdr|taxonomy|governance/.test(lower)) labels.add("Regulatory");
  if (/quality|defect|risk|testing|six sigma/.test(lower)) labels.add("Operational Risk");
  if (/ai|machine learning|neural|data science|nlp/.test(lower)) labels.add("AI");
  if (/market|investment|asset|finance/.test(lower)) labels.add("Market Risk");
  return [...labels];
}
