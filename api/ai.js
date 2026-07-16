const MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";

export default async function handler(request, response) {
  if (request.method !== "POST") {
    return response.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.MARKET_INTEL_API_KEY;
  if (!apiKey) {
    return response.status(501).json({
      error: "Missing GEMINI_API_KEY. Add it in Vercel Environment Variables.",
    });
  }

  try {
    const { task = "chat", question = "", context = {} } = request.body || {};
    const prompt = buildPrompt(task, question, context);
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
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
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.35,
            maxOutputTokens: 1400,
          },
        }),
      },
    );

    const data = await geminiResponse.json();
    if (!geminiResponse.ok) {
      return response.status(geminiResponse.status).json({
        error: data.error?.message || "Gemini request failed",
      });
    }

    const text =
      data.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("\n") ||
      "No model response was returned.";

    return response.status(200).json({ text });
  } catch (error) {
    return response.status(500).json({ error: error.message || "AI request failed" });
  }
}

function buildPrompt(task, question, context) {
  return [
    `Task: ${task}`,
    `User request: ${question}`,
    "Context JSON:",
    JSON.stringify(context, null, 2).slice(0, 24000),
    "",
    "Output format:",
    "Facts from sources:",
    "Inferences:",
    "Recommendations:",
    "Open questions / uncertainty:",
    "Sources:",
  ].join("\n");
}
