import { getGasData, hasGas, saveGasChatMessage, saveGasChatThread } from "./_gas.js";
import { generateIntelligenceText } from "./_llm.js";

export default async function handler(request, response) {
  if (request.method !== "POST") {
    return response.status(405).json({ error: "Method not allowed" });
  }

  try {
    const {
      task = "chat",
      question = "",
      context = {},
      threadId = "",
      scopeType = "company",
      companyId = "",
      personId = "",
    } = request.body || {};
    const dbContext = await getStorageContext();
    const chatThread = await ensureChatThread({
      task,
      question,
      threadId,
      scopeType,
      companyId,
      personId,
      context,
    });
    await saveChatMessageIfPossible(chatThread?.id, "user", question);
    const result = await generateIntelligenceText({
      task,
      question,
      context: { ...context, database: dbContext },
    });
    await saveChatMessageIfPossible(chatThread?.id, "assistant", result.text, [
      { provider: result.provider || "local", fallback: Boolean(result.fallback) },
    ]);
    return response.status(200).json({ ...result, threadId: chatThread?.id || threadId || null });
  } catch (error) {
    return response.status(500).json({ error: error.message || "AI request failed" });
  }
}

async function ensureChatThread({ task, question, threadId, scopeType, companyId, personId, context }) {
  if (!hasGas() || task !== "chat") return null;

  const fallbackCompanyId = context?.companies?.[0]?.id || "";
  const title = String(question || "Market intelligence chat").slice(0, 90);
  try {
    return await saveGasChatThread({
      id: threadId || undefined,
      scope_type: scopeType || "company",
      company_id: companyId || fallbackCompanyId,
      person_id: personId || "",
      title,
    });
  } catch {
    return null;
  }
}

async function saveChatMessageIfPossible(threadId, role, content, sourceRefs = []) {
  if (!threadId || !hasGas()) return;
  try {
    await saveGasChatMessage({
      chat_thread_id: threadId,
      role,
      content,
      source_refs: sourceRefs,
    });
  } catch {
    // Chat should stay usable even before the GAS deployment has the new sheets.
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
