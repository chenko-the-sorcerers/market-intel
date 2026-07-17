import { getGasData, hasGas } from "./_gas.js";

export default async function handler(request, response) {
  if (request.method !== "GET") {
    return response.status(405).json({ error: "Method not allowed" });
  }

  const db = await getDbModule();
  const storage = hasGas() ? "gas" : db?.hasDatabase?.() ? "postgres" : "local-fallback";
  const data = hasGas()
    ? await getGasData().catch((error) => ({ error: error.message }))
    : db?.hasDatabase?.()
      ? await db.getDashboardData().catch((error) => ({ error: error.message }))
      : {};

  return response.status(200).json({
    ok: !data.error,
    storage,
    ai_provider: process.env.OPENAI_API_KEY
      ? "openai"
      : process.env.GEMINI_API_KEY || process.env.MARKET_INTEL_API_KEY
        ? "gemini"
        : "fallback",
    error: data.error,
    counts: {
      companies: data.companies?.length || 0,
      sources: data.sources?.length || 0,
      updates: data.updates?.length || 0,
      people: data.people?.length || 0,
      files: data.library?.length || 0,
      chunks: data.chunks?.length || 0,
      briefs: data.briefs?.length || 0,
    },
  });
}

async function getDbModule() {
  try {
    return await import("./_db.js");
  } catch {
    return null;
  }
}
