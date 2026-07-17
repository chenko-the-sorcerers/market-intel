const DEFAULT_GAS_URL =
  "https://script.google.com/macros/s/AKfycby4MUNIae7mcj6Lh_o91UMbydup-7s3T8Piv0y1bYjTx5AY5G3yGxQRcOd9He-Zp_Qs/exec";
const GAS_URL = process.env.GAS_WEB_APP_URL || process.env.GOOGLE_APPS_SCRIPT_URL || DEFAULT_GAS_URL;
const GAS_URLS = [...new Set([GAS_URL, DEFAULT_GAS_URL].filter(Boolean))];

export function hasGas() {
  return Boolean(GAS_URL);
}

export async function gasRequest(action, payload = {}) {
  if (!hasGas()) throw new Error("GAS_WEB_APP_URL is not configured.");

  const errors = [];
  for (const url of GAS_URLS) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action, payload }),
        redirect: "follow",
      });

      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(`Invalid GAS response: ${text.slice(0, 160)}`);
      }

      if (!response.ok || data.ok === false) {
        throw new Error(data.error || `GAS request failed: ${response.status}`);
      }

      return data;
    } catch (error) {
      errors.push(`${url}: ${error.message}`);
    }
  }

  throw new Error(errors.join(" | "));
}

export async function getGasData() {
  const data = await gasRequest("getData");
  return normalizeGasData(data);
}

export async function seedGasData() {
  return gasRequest("init");
}

export async function saveGasCompany(payload) {
  const data = await gasRequest("saveCompany", payload);
  return data.company;
}

export async function updateGasStatus(payload) {
  return gasRequest("updateStatus", payload);
}

export async function saveGasFile(payload) {
  return gasRequest("saveFile", payload);
}

export async function saveGasBrief(payload) {
  return gasRequest("saveBrief", payload);
}

export async function insertGasUpdates(payload) {
  return gasRequest("insertUpdates", payload);
}

export async function getGasMonitorSources() {
  const data = await gasRequest("getMonitorSources");
  return data.sources || [];
}

export async function saveGasMonitoringRun(payload) {
  const data = await gasRequest("saveMonitoringRun", payload);
  return data.run;
}

export async function saveGasMonitoringRunItem(payload) {
  const data = await gasRequest("saveMonitoringRunItem", payload);
  return data.item;
}

export async function saveGasChatThread(payload) {
  const data = await gasRequest("saveChatThread", payload);
  return data.thread;
}

export async function saveGasChatMessage(payload) {
  const data = await gasRequest("saveChatMessage", payload);
  return data.message;
}

export async function getGasChatThreads(payload = {}) {
  const data = await gasRequest("getChatThreads", payload);
  return data.threads || [];
}

export function normalizeGasData(data) {
  return {
    companies: data.companies || [],
    sources: data.sources || [],
    updates: data.updates || [],
    people: data.people || [],
    library: data.library || data.files || [],
    chunks: data.chunks || [],
    briefs: data.briefs || [],
    monitoring_runs: data.monitoring_runs || [],
    monitoring_run_items: data.monitoring_run_items || [],
    chat_threads: data.chat_threads || [],
    chat_messages: data.chat_messages || [],
    labels: data.labels || [],
    update_labels: data.update_labels || [],
  };
}
