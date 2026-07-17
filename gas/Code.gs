const SHEETS = {
  companies: [
    "id",
    "name",
    "company_type",
    "industry",
    "country",
    "region",
    "website_url",
    "description",
    "monitoring_status",
    "priority",
    "notes",
    "created_at",
    "updated_at",
  ],
  company_sources: [
    "id",
    "company_id",
    "source_type",
    "url",
    "display_name",
    "monitoring_status",
    "last_checked_at",
    "last_success_at",
    "last_error",
    "fetch_strategy",
    "created_at",
    "updated_at",
  ],
  updates: [
    "id",
    "company_id",
    "source_id",
    "source_type",
    "source_url",
    "canonical_url",
    "title",
    "raw_text",
    "snippet",
    "language",
    "published_at",
    "discovered_at",
    "content_hash",
    "ai_summary_en",
    "ai_importance",
    "ai_confidence",
    "facts",
    "inferences",
    "risk_categories",
    "labels",
    "status",
    "created_at",
    "updated_at",
  ],
  people: [
    "id",
    "company_id",
    "full_name",
    "role_title",
    "profile_url",
    "linkedin_url",
    "notes",
    "ai_background_summary",
    "ai_pain_points",
    "ai_aspirations",
    "ai_unique_trade",
    "ai_confidence",
    "created_at",
    "updated_at",
  ],
  uploaded_files: [
    "id",
    "company_id",
    "person_id",
    "file_name",
    "file_type",
    "storage_path",
    "upload_status",
    "extraction_status",
    "extracted_text",
    "notes",
    "tags",
    "created_at",
    "updated_at",
  ],
  document_chunks: ["id", "file_id", "chunk_index", "chunk_text", "token_estimate", "created_at"],
  briefs: ["id", "company_id", "person_id", "brief_type", "title", "body_markdown", "sources", "created_at"],
  monitoring_runs: [
    "id",
    "run_type",
    "scheduled_for",
    "started_at",
    "finished_at",
    "status",
    "companies_checked",
    "updates_found",
    "errors_count",
    "summary",
  ],
  monitoring_run_items: [
    "id",
    "monitoring_run_id",
    "company_id",
    "source_id",
    "status",
    "updates_found",
    "error_message",
    "started_at",
    "finished_at",
  ],
  chat_threads: ["id", "scope_type", "company_id", "person_id", "title", "created_at", "updated_at"],
  chat_messages: ["id", "chat_thread_id", "role", "content", "source_refs", "created_at"],
  labels: ["id", "name", "label_type", "description", "created_at"],
  update_labels: ["update_id", "label_id", "confidence", "created_at"],
};

function doGet() {
  return json({ ok: true, message: "Market Intelligence GAS storage is running." });
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents || "{}");
    const action = body.action;
    const payload = body.payload || {};

    ensureSheets();

    if (action === "init") return json(initData());
    if (action === "getData") return json(getData());
    if (action === "saveCompany") return json({ ok: true, company: saveCompany(payload) });
    if (action === "updateStatus") return json(updateStatus(payload));
    if (action === "saveFile") return json(saveFile(payload));
    if (action === "saveBrief") return json(saveBrief(payload));
    if (action === "insertUpdates") return json(insertUpdates(payload));
    if (action === "getMonitorSources") return json({ ok: true, sources: getMonitorSources() });
    if (action === "saveMonitoringRun") return json(saveMonitoringRun(payload));
    if (action === "saveMonitoringRunItem") return json(saveMonitoringRunItem(payload));
    if (action === "saveChatThread") return json(saveChatThread(payload));
    if (action === "saveChatMessage") return json(saveChatMessage(payload));
    if (action === "getChatThreads") return json(getChatThreads(payload));

    return json({ ok: false, error: "Unknown action: " + action });
  } catch (error) {
    return json({ ok: false, error: String(error && error.message ? error.message : error) });
  }
}

function ensureSheets() {
  const ss = getSpreadsheet();
  Object.keys(SHEETS).forEach((name) => {
    let sheet = ss.getSheetByName(name);
    if (!sheet) sheet = ss.insertSheet(name);
    const headers = SHEETS[name];
    const existing = sheet.getRange(1, 1, 1, Math.max(headers.length, sheet.getLastColumn() || 1)).getValues()[0];
    if (existing.slice(0, headers.length).join("|") !== headers.join("|")) {
      sheet.clear();
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.setFrozenRows(1);
    }
  });
}

function initData() {
  const companies = rows("companies");
  let company = companies.find((row) => row.name === "Sociovestix Labs");
  if (!company) {
    company = saveCompany({
      name: "Sociovestix Labs",
      company_type: "prospect",
      industry: "Sustainable finance / financial data science",
      country: "Germany / Europe",
      region: "Europe",
      website_url: "https://sociovestix.com/",
      description:
        "Sociovestix Labs is tracked as a prospect focused on sustainable finance, financial data science, data quality testing, AI, and executive tracking.",
      monitoring_status: "active",
      priority: "high",
      notes: "Initial MVP company from user-provided source.",
    });
  }

  seedSource(company.id, "website", "https://sociovestix.com/", "Sociovestix website", "active", "crawl");
  seedSource(
    company.id,
    "linkedin",
    "https://www.linkedin.com/in/andreashoepner/",
    "Andreas Hoepner LinkedIn",
    "manual",
    "manual_upload",
  );
  seedSource(
    company.id,
    "linkedin",
    "https://www.linkedin.com/in/damianborth/",
    "Damian Borth LinkedIn",
    "manual",
    "manual_upload",
  );

  seedPerson(company.id, "Andreas Hoepner", "Sustainable finance / financial data science contact", "https://www.linkedin.com/in/andreashoepner/");
  seedPerson(company.id, "Damian Borth", "AI / machine-learning contact", "https://www.linkedin.com/in/damianborth/");
  seedDefaultLabels();

  return { ok: true, ...getData() };
}

function getData() {
  return {
    ok: true,
    companies: rows("companies"),
    sources: rows("company_sources"),
    updates: rows("updates"),
    people: rows("people"),
    library: rows("uploaded_files"),
    chunks: rows("document_chunks"),
    briefs: rows("briefs"),
    monitoring_runs: rows("monitoring_runs"),
    monitoring_run_items: rows("monitoring_run_items"),
    chat_threads: rows("chat_threads"),
    chat_messages: rows("chat_messages"),
    labels: rows("labels"),
    update_labels: rows("update_labels"),
  };
}

function saveCompany(payload) {
  const now = iso();
  const sheetName = "companies";
  const existing = findRow(sheetName, "name", payload.name);
  const row = {
    id: existing ? existing.row.id : uuid(),
    name: payload.name,
    company_type: payload.company_type || payload.type || "prospect",
    industry: payload.industry || "",
    country: payload.country || "",
    region: payload.region || "",
    website_url: payload.website_url || payload.website || "",
    description: payload.description || "",
    monitoring_status: payload.monitoring_status || "active",
    priority: payload.priority || "medium",
    notes: payload.notes || "",
    created_at: existing ? existing.row.created_at : now,
    updated_at: now,
  };
  upsertRow(sheetName, existing ? existing.index : null, row);

  if (row.website_url) seedSource(row.id, "website", row.website_url, row.name + " website", "active", "crawl");
  return row;
}

function updateStatus(payload) {
  const found = findRow("updates", "title", payload.title);
  if (!found) return { ok: true, updated: false };
  found.row.status = payload.status || "reviewed";
  found.row.updated_at = iso();
  upsertRow("updates", found.index, found.row);
  return { ok: true, updated: true };
}

function saveFile(payload) {
  const now = iso();
  const file = {
    id: uuid(),
    company_id: payload.company_id || "",
    person_id: payload.person_id || "",
    file_name: payload.file_name,
    file_type: payload.file_type || "",
    storage_path: payload.storage_path || payload.file_name,
    upload_status: "uploaded",
    extraction_status: payload.extracted_text ? "success" : "pending",
    extracted_text: payload.extracted_text || "",
    notes: payload.notes || "",
    tags: stringify(payload.tags || ["Manual upload"]),
    created_at: now,
    updated_at: now,
  };
  appendRow("uploaded_files", file);

  chunkText(file.extracted_text).forEach((chunk, index) => {
    appendRow("document_chunks", {
      id: uuid(),
      file_id: file.id,
      chunk_index: index,
      chunk_text: chunk,
      token_estimate: Math.ceil(chunk.length / 4),
      created_at: now,
    });
  });

  return { ok: true, file: file };
}

function saveBrief(payload) {
  const brief = {
    id: uuid(),
    company_id: payload.company_id || "",
    person_id: payload.person_id || "",
    brief_type: payload.brief_type || "one-page",
    title: payload.title || "Market intelligence brief",
    body_markdown: payload.body_markdown || payload.body || "",
    sources: stringify(payload.sources || []),
    created_at: iso(),
  };
  appendRow("briefs", brief);
  return { ok: true, brief: brief };
}

function insertUpdates(payload) {
  const incoming = payload.updates || [];
  const inserted = [];
  const deduped = [];
  incoming.forEach((update) => {
    if (findRow("updates", "content_hash", update.content_hash)) {
      deduped.push(update.source_url);
      return;
    }
    const row = Object.assign(
      {
        id: uuid(),
        language: "en",
        discovered_at: iso(),
        status: "new",
        created_at: iso(),
        updated_at: iso(),
      },
      update,
      {
        labels: stringify(update.labels || []),
        risk_categories: stringify(update.risk_categories || []),
      },
    );
    appendRow("updates", row);
    linkUpdateLabels(row.id, update.labels || [], update.ai_confidence || 0.7);
    inserted.push(row);
  });
  return { ok: true, inserted: inserted, deduped: deduped };
}

function saveMonitoringRun(payload) {
  const now = iso();
  const existing = payload.id ? findRow("monitoring_runs", "id", payload.id) : null;
  const old = existing ? existing.row : {};
  const row = {
    id: existing ? old.id : payload.id || uuid(),
    run_type: payload.run_type || old.run_type || "manual",
    scheduled_for: payload.scheduled_for || old.scheduled_for || "",
    started_at: payload.started_at || old.started_at || now,
    finished_at: payload.finished_at || old.finished_at || "",
    status: payload.status || old.status || "running",
    companies_checked: firstDefined(payload.companies_checked, old.companies_checked, 0),
    updates_found: firstDefined(payload.updates_found, old.updates_found, 0),
    errors_count: firstDefined(payload.errors_count, old.errors_count, 0),
    summary: payload.summary || old.summary || "",
  };
  upsertRow("monitoring_runs", existing ? existing.index : null, row);
  return { ok: true, run: row };
}

function saveMonitoringRunItem(payload) {
  const existing = payload.id ? findRow("monitoring_run_items", "id", payload.id) : null;
  const old = existing ? existing.row : {};
  const row = {
    id: existing ? old.id : payload.id || uuid(),
    monitoring_run_id: payload.monitoring_run_id || old.monitoring_run_id || "",
    company_id: payload.company_id || old.company_id || "",
    source_id: payload.source_id || old.source_id || "",
    status: payload.status || old.status || "success",
    updates_found: firstDefined(payload.updates_found, old.updates_found, 0),
    error_message: payload.error_message || old.error_message || "",
    started_at: payload.started_at || old.started_at || iso(),
    finished_at: payload.finished_at || old.finished_at || iso(),
  };
  upsertRow("monitoring_run_items", existing ? existing.index : null, row);
  return { ok: true, item: row };
}

function saveChatThread(payload) {
  const now = iso();
  const existing = payload.id ? findRow("chat_threads", "id", payload.id) : null;
  const old = existing ? existing.row : {};
  const row = {
    id: existing ? old.id : payload.id || uuid(),
    scope_type: payload.scope_type || old.scope_type || "company",
    company_id: payload.company_id || old.company_id || "",
    person_id: payload.person_id || old.person_id || "",
    title: payload.title || old.title || "Market intelligence chat",
    created_at: existing ? old.created_at : payload.created_at || now,
    updated_at: now,
  };
  upsertRow("chat_threads", existing ? existing.index : null, row);
  return { ok: true, thread: row };
}

function saveChatMessage(payload) {
  const row = {
    id: payload.id || uuid(),
    chat_thread_id: payload.chat_thread_id || "",
    role: payload.role || "user",
    content: payload.content || "",
    source_refs: stringify(payload.source_refs || []),
    created_at: payload.created_at || iso(),
  };
  appendRow("chat_messages", row);
  return { ok: true, message: row };
}

function getChatThreads(payload) {
  const companyId = payload.company_id || "";
  const threads = rows("chat_threads").filter((thread) => !companyId || thread.company_id === companyId);
  const messages = rows("chat_messages");
  return {
    ok: true,
    threads: threads.map((thread) => ({
      thread: thread,
      messages: messages.filter((message) => message.chat_thread_id === thread.id),
    })),
  };
}

function getMonitorSources() {
  const companies = rows("companies");
  return rows("company_sources")
    .filter((source) => source.monitoring_status === "active" && ["website", "news", "rss"].indexOf(source.source_type) >= 0)
    .map((source) => {
      const company = companies.find((item) => item.id === source.company_id) || {};
      return {
        source_id: source.id,
        company_id: source.company_id,
        company_name: company.name || "",
        source_type: source.source_type,
        fetch_strategy: source.fetch_strategy,
        url: source.url,
      };
    });
}

function seedSource(companyId, sourceType, url, displayName, status, strategy) {
  if (findRow("company_sources", "url", url)) return;
  appendRow("company_sources", {
    id: uuid(),
    company_id: companyId,
    source_type: sourceType,
    url: url,
    display_name: displayName,
    monitoring_status: status,
    last_checked_at: "",
    last_success_at: "",
    last_error: "",
    fetch_strategy: strategy,
    created_at: iso(),
    updated_at: iso(),
  });
}

function seedPerson(companyId, name, role, linkedin) {
  if (findRow("people", "full_name", name)) return;
  appendRow("people", {
    id: uuid(),
    company_id: companyId,
    full_name: name,
    role_title: role,
    profile_url: linkedin,
    linkedin_url: linkedin,
    notes: "Configured source. Use provider/manual import for production social monitoring.",
    ai_background_summary: "Initial person profile seeded for meeting intelligence.",
    ai_pain_points: "[]",
    ai_aspirations: "[]",
    ai_unique_trade: "",
    ai_confidence: 0.6,
    created_at: iso(),
    updated_at: iso(),
  });
}

function seedDefaultLabels() {
  [
    ["ESG", "risk", "Environmental, social, and governance signal"],
    ["Climate", "risk", "Climate transition or physical climate signal"],
    ["Regulatory", "risk", "Regulatory, compliance, or policy signal"],
    ["Reputation", "risk", "Brand, trust, or public perception signal"],
    ["Operational Risk", "risk", "Execution, process, or resilience risk"],
    ["Market Risk", "risk", "Market, investment, or demand-side risk"],
    ["Product Launch", "event", "New product, service, or capability"],
    ["Partnership", "event", "Partnership or ecosystem development"],
    ["Campaign", "event", "Campaign, announcement, or public communication"],
    ["Leadership Change", "event", "Executive or senior-role movement"],
    ["Expansion", "event", "Geographic, market, or team expansion"],
    ["Hiring", "event", "Hiring or talent signal"],
    ["Financial/Funding", "event", "Funding, revenue, or financial signal"],
    ["Legal", "risk", "Legal dispute, enforcement, or governance signal"],
    ["Sustainability", "topic", "Sustainability and impact topic"],
    ["Supply Chain", "risk", "Supplier, procurement, or chain-of-custody issue"],
    ["AI", "topic", "AI, ML, model, or automation signal"],
    ["Source Health", "ops", "Monitoring coverage or source quality signal"],
    ["Website", "source", "Website-sourced update"],
    ["Data Quality", "topic", "Data reliability, quality testing, or verification signal"],
  ].forEach((item) => seedLabel(item[0], item[1], item[2]));
}

function seedLabel(name, labelType, description) {
  if (!name || findRow("labels", "name", name)) return null;
  const row = { id: uuid(), name: name, label_type: labelType || "topic", description: description || "", created_at: iso() };
  appendRow("labels", row);
  return row;
}

function ensureLabel(name) {
  const clean = String(name || "").trim();
  if (!clean) return null;
  const existing = findRow("labels", "name", clean);
  if (existing) return existing.row;
  return seedLabel(clean, inferLabelType(clean), "Auto-created from update label.");
}

function inferLabelType(name) {
  if (["ESG", "Climate", "Regulatory", "Reputation", "Operational Risk", "Market Risk", "Legal", "Supply Chain"].indexOf(name) >= 0) return "risk";
  if (["Product Launch", "Partnership", "Campaign", "Leadership Change", "Expansion", "Hiring", "Financial/Funding"].indexOf(name) >= 0) return "event";
  if (["Website", "LinkedIn", "Instagram", "X"].indexOf(name) >= 0) return "source";
  return "topic";
}

function linkUpdateLabels(updateId, labels, confidence) {
  (labels || []).forEach((name) => {
    const label = ensureLabel(name);
    if (!label) return;
    const exists = rows("update_labels").some((row) => row.update_id === updateId && row.label_id === label.id);
    if (exists) return;
    appendRow("update_labels", {
      update_id: updateId,
      label_id: label.id,
      confidence: confidence || 0.7,
      created_at: iso(),
    });
  });
}

function rows(sheetName) {
  const sheet = getSpreadsheet().getSheetByName(sheetName);
  const values = sheet.getDataRange().getValues();
  const headers = values.shift() || [];
  return values
    .filter((row) => row.some((cell) => cell !== ""))
    .map((row) =>
      headers.reduce((item, header, index) => {
        item[header] = parseCell(row[index]);
        return item;
      }, {}),
    );
}

function findRow(sheetName, key, value) {
  const all = rows(sheetName);
  const index = all.findIndex((row) => String(row[key]) === String(value));
  return index >= 0 ? { index: index + 2, row: all[index] } : null;
}

function appendRow(sheetName, object) {
  const sheet = getSpreadsheet().getSheetByName(sheetName);
  const headers = SHEETS[sheetName];
  sheet.appendRow(headers.map((key) => serialize(object[key])));
}

function upsertRow(sheetName, rowIndex, object) {
  const sheet = getSpreadsheet().getSheetByName(sheetName);
  const headers = SHEETS[sheetName];
  const row = headers.map((key) => serialize(object[key]));
  if (rowIndex) sheet.getRange(rowIndex, 1, 1, headers.length).setValues([row]);
  else sheet.appendRow(row);
}

function firstDefined() {
  for (let index = 0; index < arguments.length; index += 1) {
    if (arguments[index] !== undefined && arguments[index] !== null) return arguments[index];
  }
  return "";
}

function chunkText(text) {
  const normalized = String(text || "").replace(/\s+/g, " ").trim();
  const chunks = [];
  let start = 0;
  while (start < normalized.length) {
    chunks.push(normalized.slice(start, start + 1200));
    start += 1040;
  }
  return chunks;
}

function parseCell(value) {
  if (typeof value !== "string") return value;
  if ((value.startsWith("[") && value.endsWith("]")) || (value.startsWith("{") && value.endsWith("}"))) {
    try {
      return JSON.parse(value);
    } catch (error) {
      return value;
    }
  }
  return value;
}

function serialize(value) {
  if (Array.isArray(value) || (value && typeof value === "object")) return JSON.stringify(value);
  return value == null ? "" : value;
}

function stringify(value) {
  return typeof value === "string" ? value : JSON.stringify(value || []);
}

function uuid() {
  return Utilities.getUuid();
}

function iso() {
  return new Date().toISOString();
}

function json(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
}

function getSpreadsheet() {
  const configuredId = PropertiesService.getScriptProperties().getProperty("SPREADSHEET_ID");
  if (configuredId) return SpreadsheetApp.openById(configuredId);
  const active = SpreadsheetApp.getActiveSpreadsheet();
  if (active) return active;
  throw new Error("No active spreadsheet. Bind this script to a Google Sheet or set Script Property SPREADSHEET_ID.");
}
