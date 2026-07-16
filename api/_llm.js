const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4.1-mini";

export async function generateIntelligenceText({ task = "chat", question = "", context = {} }) {
  const prompt = buildPrompt(task, question, context);

  if (process.env.OPENAI_API_KEY) {
    return generateWithOpenAI(prompt);
  }

  if (process.env.GEMINI_API_KEY || process.env.MARKET_INTEL_API_KEY) {
    return generateWithGemini(prompt);
  }

  return fallbackText(question, context);
}

export async function summarizeUpdate({ title, rawText, sourceUrl }) {
  const context = { title, rawText: String(rawText || "").slice(0, 12000), sourceUrl };
  const text = await generateIntelligenceText({
    task: "summarize-update-json",
    question:
      "Summarize this update as strict JSON with keys summary, facts, inferences, labels, risk_categories, priority, confidence, citation_url.",
    context,
  });

  const parsed = parseJson(text);
  if (parsed) {
    return {
      summary: parsed.summary || parsed.ai_summary_en || String(rawText || "").slice(0, 500),
      facts: parsed.facts || "",
      inferences: parsed.inferences || "",
      labels: Array.isArray(parsed.labels) ? parsed.labels : inferLabels(`${title} ${rawText}`),
      risk_categories: Array.isArray(parsed.risk_categories)
        ? parsed.risk_categories
        : inferRiskCategories(`${title} ${rawText}`),
      priority: parsed.priority || inferPriority(`${title} ${rawText}`),
      confidence: Number(parsed.confidence || 0.65),
      citation_url: parsed.citation_url || sourceUrl,
    };
  }

  return {
    summary: `Fact: ${String(rawText || "").slice(0, 520)} Source: ${sourceUrl}`,
    facts: String(rawText || "").slice(0, 800),
    inferences: "Inference should be reviewed by the researcher.",
    labels: inferLabels(`${title} ${rawText}`),
    risk_categories: inferRiskCategories(`${title} ${rawText}`),
    priority: inferPriority(`${title} ${rawText}`),
    confidence: 0.55,
    citation_url: sourceUrl,
  };
}

async function generateWithOpenAI(prompt) {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      input: [
        {
          role: "system",
          content:
            "You are a personal market intelligence assistant. Always answer in English. Separate facts, inferences, recommendations, and sources. Be explicit about uncertainty.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.25,
    }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || "OpenAI request failed");
  return data.output_text || data.output?.flatMap((item) => item.content || []).map((part) => part.text || "").join("\n") || "";
}

async function generateWithGemini(prompt) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.MARKET_INTEL_API_KEY;
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: {
          parts: [
            {
              text:
                "You are a personal market intelligence assistant. Always answer in English. Separate facts, inferences, recommendations, and sources. Be explicit about uncertainty.",
            },
          ],
        },
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.35, maxOutputTokens: 1400 },
      }),
    },
  );
  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || "Gemini request failed");
  return data.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("\n") || "";
}

function buildPrompt(task, question, context) {
  return [
    `Task: ${task}`,
    `User request: ${question}`,
    "Context JSON:",
    JSON.stringify(context, null, 2).slice(0, 26000),
    "",
    "Output requirements:",
    "- English only.",
    "- Separate facts from inferences.",
    "- Cite source URLs when available.",
    "- Mention uncertainty clearly.",
  ].join("\n");
}

function fallbackText(question, context) {
  return [
    "Facts from sources:",
    `- Available context includes ${context.companies?.length || 0} companies, ${context.updates?.length || 0} updates, ${context.people?.length || 0} people, and ${context.library?.length || 0} files.`,
    "",
    "Inferences:",
    "- AI provider environment variables are not configured yet, so this is a deterministic fallback.",
    "",
    "Recommendations:",
    "- Add OPENAI_API_KEY or GEMINI_API_KEY in Vercel, then retry this request.",
    "",
    "Sources:",
    "- Dashboard database context and configured source URLs.",
  ].join("\n");
}

function parseJson(text) {
  try {
    const match = String(text).match(/\{[\s\S]*\}/);
    return match ? JSON.parse(match[0]) : JSON.parse(text);
  } catch {
    return null;
  }
}

function inferLabels(text) {
  const lower = String(text || "").toLowerCase();
  const labels = new Set(["Website"]);
  if (/esg|sustainab|impact|net.?zero/.test(lower)) labels.add("ESG");
  if (/climate|carbon|transition|emission/.test(lower)) labels.add("Climate");
  if (/regulat|compliance|sfdr|taxonomy|governance/.test(lower)) labels.add("Regulatory");
  if (/quality|defect|risk|testing|six sigma/.test(lower)) labels.add("Operational Risk");
  if (/ai|machine learning|neural|data science|nlp/.test(lower)) labels.add("AI");
  if (/market|investment|asset|finance/.test(lower)) labels.add("Market Risk");
  return [...labels];
}

function inferRiskCategories(text) {
  return inferLabels(text).filter((label) =>
    ["ESG", "Climate", "Regulatory", "Reputation", "Operational Risk", "Market Risk"].includes(label),
  );
}

function inferPriority(text) {
  return inferRiskCategories(text).length >= 2 ? "High" : "Medium";
}
