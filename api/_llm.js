const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";
const GEMINI_FALLBACK_MODELS = (
  process.env.GEMINI_FALLBACK_MODELS || "gemini-1.5-flash-8b,gemini-1.5-flash"
)
  .split(",")
  .map((model) => model.trim())
  .filter(Boolean);
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4.1-mini";

export async function generateIntelligenceText({ task = "chat", question = "", context = {} }) {
  const prompt = buildPrompt(task, question, context);

  if (process.env.OPENAI_API_KEY) {
    try {
      return { text: await generateWithOpenAI(prompt), provider: "openai", fallback: false };
    } catch (error) {
      return {
        text: fallbackText(question, context, `OpenAI unavailable: ${cleanProviderError(error.message)}`),
        provider: "local-retrieval",
        fallback: true,
      };
    }
  }

  if (process.env.GEMINI_API_KEY || process.env.MARKET_INTEL_API_KEY) {
    try {
      const result = await generateWithGemini(prompt);
      return { text: result.text, provider: result.provider, fallback: false };
    } catch (error) {
      return {
        text: fallbackText(question, context, `Gemini unavailable: ${cleanProviderError(error.message)}`),
        provider: "local-retrieval",
        fallback: true,
      };
    }
  }

  return {
    text: fallbackText(question, context, "No hosted AI provider is configured."),
    provider: "local-retrieval",
    fallback: true,
  };
}

export async function summarizeUpdate({ title, rawText, sourceUrl }) {
  const context = { title, rawText: String(rawText || "").slice(0, 12000), sourceUrl };
  const result = await generateIntelligenceText({
    task: "summarize-update-json",
    question:
      "Summarize this update as strict JSON with keys summary, facts, inferences, labels, risk_categories, priority, confidence, citation_url.",
    context,
  });
  const text = result.text;

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
  const models = [...new Set([GEMINI_MODEL, ...GEMINI_FALLBACK_MODELS])];
  const errors = [];

  for (const model of models) {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
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
          generationConfig: { temperature: 0.35, maxOutputTokens: 900 },
        }),
      },
    );
    const data = await response.json();
    if (response.ok) {
      return {
        text: data.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("\n") || "",
        provider: `gemini:${model}`,
      };
    }
    errors.push(`${model}: ${data.error?.message || "Gemini request failed"}`);
  }

  throw new Error(errors.join(" | "));
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

function fallbackText(question, context, providerNote = "") {
  const data = context.database || context;
  const companies = data.companies || [];
  const updates = data.updates || [];
  const people = data.people || [];
  const library = data.library || [];
  const briefs = data.briefs || [];
  const relevantUpdates = updates
    .slice(0, 5)
    .map((update) => `- ${update.title || "Untitled"}: ${update.ai_summary_en || update.summary || update.snippet || ""}`)
    .join("\n");
  const relevantPeople = people
    .slice(0, 4)
    .map((person) => `- ${person.full_name || person.name}: ${person.role_title || person.role || ""}`)
    .join("\n");

  return [
    "Facts from sources:",
    `- Available context includes ${companies.length} companies, ${updates.length} updates, ${people.length} people, ${library.length} files, and ${briefs.length} briefs.`,
    companies[0]?.name ? `- Primary company in scope: ${companies[0].name}.` : "- No primary company is loaded yet.",
    relevantUpdates ? `- Recent updates:\n${relevantUpdates}` : "- No monitored updates are stored yet. Run /api/monitor-run to populate updates.",
    relevantPeople ? `- People context:\n${relevantPeople}` : "- No people profiles are stored yet.",
    "",
    "Inferences:",
    "- This answer is generated from stored research context while the hosted model is unavailable.",
    "- For Sociovestix, useful intelligence angles remain ESG data quality, financial data science, AI auditability, and source health for social profiles.",
    "",
    "Recommendations:",
    "- Run the monitoring job, review new updates, then generate a brief from the Briefs tab.",
    providerNote ? `- Provider note: ${providerNote}` : "- Add OPENAI_API_KEY or GEMINI_API_KEY in Vercel for full chatbot synthesis.",
    "- Treat LinkedIn/Instagram/X as manual/provider sources unless authenticated collection is configured.",
    "",
    "Sources:",
    "- GAS/Google Sheet dashboard context.",
    ...companies.map((company) => `- ${company.website_url || company.website || company.name}`).slice(0, 5),
  ].join("\n");
}

function cleanProviderError(message) {
  const text = String(message || "");
  if (/quota|rate|limit/i.test(text)) {
    return "quota or rate limit reached. The app is using local retrieval until quota is available.";
  }
  return text.slice(0, 180);
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
