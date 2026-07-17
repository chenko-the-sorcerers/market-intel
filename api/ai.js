import { getGasData, hasGas } from "./_gas.js";
import { generateIntelligenceText } from "./_llm.js";

export default async function handler(request, response) {
  if (request.method !== "POST") {
    return response.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { task = "chat", question = "", context = {} } = request.body || {};
    const dbContext = await getStorageContext();
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

async function getStorageContext() {
  if (hasGas()) return getGasData().catch(() => ({}));

  try {
    const db = await import("./_db.js");
    return db.hasDatabase() ? db.getDashboardData().catch(() => ({})) : {};
  } catch {
    return {};
  }
}
