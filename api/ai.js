import { getDashboardData, hasDatabase } from "./_db.js";
import { generateIntelligenceText } from "./_llm.js";

export default async function handler(request, response) {
  if (request.method !== "POST") {
    return response.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { task = "chat", question = "", context = {} } = request.body || {};
    const dbContext = hasDatabase() ? await getDashboardData().catch(() => ({})) : {};
    const text = await generateIntelligenceText({
      task,
      question,
      context: { ...context, database: dbContext },
    });
    return response.status(200).json({ text });
  } catch (error) {
    return response.status(500).json({ error: error.message || "AI request failed" });
  }
}
