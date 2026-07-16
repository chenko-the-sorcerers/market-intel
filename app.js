const sources = {
  sociovestix: "https://sociovestix.com/",
  andreas: "https://www.linkedin.com/in/andreashoepner/",
  damian: "https://www.linkedin.com/in/damianborth/",
};

const seedCompanies = [
  {
    name: "Sociovestix Labs",
    type: "Prospect",
    industry: "Sustainable finance / financial data science",
    country: "Germany / Europe",
    health: "Partial",
    status: "Active",
    high: 3,
    risk: 5,
    lastChecked: "15 Jul 2026 08:00",
    website: sources.sociovestix,
  },
];

const seedUpdates = [
  {
    company: "Sociovestix Labs",
    type: "Prospect",
    source: "Website",
    published: "Current website",
    discovered: "15 Jul 2026",
    title: "Positioning: sustainable finance and financial data science",
    summary:
      "Fact: Sociovestix describes work across sustainable finance, climate transition investing, investment impact analytics, net-zero target benchmarking, and precautionary-principle estimations.",
    labels: ["ESG", "Climate", "Market Risk"],
    priority: "High",
    status: "New",
    url: sources.sociovestix,
  },
  {
    company: "Sociovestix Labs",
    type: "Prospect",
    source: "Website",
    published: "Current website",
    discovered: "15 Jul 2026",
    title: "Data quality testing is a core commercial theme",
    summary:
      "Fact: The company offers ex-ante data-provider due diligence, Six Sigma data-quality testing, and data scouting support. Inference: buyer pain may center on vendor reliability, entity matching, and defect mitigation.",
    labels: ["Data Quality", "Operational Risk", "Regulatory"],
    priority: "High",
    status: "Saved",
    url: sources.sociovestix,
  },
  {
    company: "Sociovestix Labs",
    type: "Prospect",
    source: "Website",
    published: "Current website",
    discovered: "15 Jul 2026",
    title: "AI capability connects unstructured data and financial workflows",
    summary:
      "Fact: Sociovestix says it develops deep neural networks across computer vision, NLP, and financial time-series data. Inference: AI governance, explainability, and productization are useful discovery angles.",
    labels: ["AI", "Product", "Operational Risk"],
    priority: "Medium",
    status: "New",
    url: sources.sociovestix,
  },
  {
    company: "Sociovestix Labs",
    type: "Prospect",
    source: "LinkedIn",
    published: "Configured profile",
    discovered: "15 Jul 2026",
    title: "Andreas Hoepner profile configured for monitoring",
    summary:
      "Fact: LinkedIn URL is configured by the researcher. Source health note: automated LinkedIn collection needs authenticated access or a provider before production use.",
    labels: ["Person", "Source Health"],
    priority: "Medium",
    status: "New",
    url: sources.andreas,
  },
  {
    company: "Sociovestix Labs",
    type: "Prospect",
    source: "LinkedIn",
    published: "Configured profile",
    discovered: "15 Jul 2026",
    title: "Damian Borth profile configured for monitoring",
    summary:
      "Fact: LinkedIn URL is configured by the researcher. Public sources describe Damian Borth as an AI and machine-learning professor and co-founder of Sociovestix Laboratories.",
    labels: ["Person", "AI", "Source Health"],
    priority: "High",
    status: "New",
    url: sources.damian,
  },
];

const seedPeople = [
  {
    name: "Andreas Hoepner",
    role: "Sustainable finance / financial data science contact",
    company: "Sociovestix Labs",
    url: sources.andreas,
    confidence: "Medium",
    facts:
      "LinkedIn profile configured by researcher. Sociovestix site links AH social profile and emphasizes sustainable finance and financial data science.",
    inferences:
      "Likely meeting angles: ESG data quality, asset-owner sustainability workflows, EU sustainable finance expectations, and climate-transition analytics.",
    questions: [
      "Which ESG data-quality failures are most expensive for your partners?",
      "Where do clients still need human analyst judgement in AI-assisted workflows?",
      "How are EU sustainable finance expectations changing buyer urgency?",
    ],
  },
  {
    name: "Damian Borth",
    role: "AI / machine-learning contact",
    company: "Sociovestix Labs",
    url: sources.damian,
    confidence: "Medium-high",
    facts:
      "LinkedIn profile configured by researcher. Public sources describe him as an AI and machine-learning professor and Sociovestix Laboratories co-founder.",
    inferences:
      "Likely meeting angles: deep-learning productization, AI governance, financial time-series modeling, and defensible AI in regulated data workflows.",
    questions: [
      "Which AI capabilities are most mature for financial-data production use?",
      "How do you communicate model uncertainty to nontechnical investment stakeholders?",
      "Where do clients ask for automation but still need auditability?",
    ],
  },
];

const seedLibrary = [
  {
    name: "Sociovestix website capture",
    type: "Web note",
    linked: "Sociovestix Labs",
    status: "Processed",
    tags: ["Website", "ESG", "AI"],
  },
  {
    name: "LinkedIn source-health note",
    type: "Manual note",
    linked: "Andreas Hoepner, Damian Borth",
    status: "Needs provider validation",
    tags: ["LinkedIn", "Source Health"],
  },
];

const riskScores = [
  ["ESG", 86],
  ["Climate", 72],
  ["Regulatory", 64],
  ["Reputation", 38],
  ["Operational Risk", 78],
  ["Market Risk", 58],
];

const STORE_KEY = "market-intel-mvp-state-v2";

const defaultState = {
  companies: seedCompanies,
  updates: seedUpdates,
  people: seedPeople,
  library: seedLibrary,
  briefs: [],
};

function loadState() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORE_KEY));
    return {
      companies: stored?.companies?.length ? stored.companies : seedCompanies,
      updates: stored?.updates?.length ? stored.updates : seedUpdates,
      people: stored?.people?.length ? stored.people : seedPeople,
      library: stored?.library?.length ? stored.library : seedLibrary,
      briefs: stored?.briefs || [],
    };
  } catch {
    return defaultState;
  }
}

let state = loadState();
let companies = state.companies;
let updates = state.updates;
let people = state.people;
let library = state.library;
let briefs = state.briefs;

function persistState() {
  state = { companies, updates, people, library, briefs };
  localStorage.setItem(STORE_KEY, JSON.stringify(state));
}

const selectors = {
  navItems: document.querySelectorAll(".nav-item"),
  views: document.querySelectorAll(".view"),
  search: document.querySelector("#globalSearch"),
  kpiGrid: document.querySelector("#kpiGrid"),
  riskList: document.querySelector("#riskList"),
  latestUpdates: document.querySelector("#latestUpdates"),
  updateFeed: document.querySelector("#updateFeed"),
  companyTable: document.querySelector("#companyTable"),
  companyFilter: document.querySelector("#companyFilter"),
  sourceFilter: document.querySelector("#sourceFilter"),
  priorityFilter: document.querySelector("#priorityFilter"),
  statusFilter: document.querySelector("#statusFilter"),
  peopleGrid: document.querySelector("#peopleGrid"),
  libraryGrid: document.querySelector("#libraryGrid"),
  workspaceContent: document.querySelector("#workspaceContent"),
  briefOutput: document.querySelector("#briefOutput"),
  chatMessages: document.querySelector("#chatMessages"),
  toast: document.querySelector("#toast"),
};

let toastTimeout;

function switchView(viewId) {
  selectors.views.forEach((view) => view.classList.toggle("active", view.id === viewId));
  selectors.navItems.forEach((item) =>
    item.classList.toggle("active", item.dataset.view === viewId),
  );
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function showToast(message) {
  selectors.toast.textContent = message;
  selectors.toast.classList.add("visible");
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => selectors.toast.classList.remove("visible"), 2400);
}

function getKpis() {
  const highPriority = updates.filter((update) => update.priority === "High").length;
  const riskUpdates = updates.filter((update) =>
    update.labels.some((label) =>
      ["ESG", "Climate", "Regulatory", "Reputation", "Operational Risk", "Market Risk"].includes(label),
    ),
  ).length;
  const sourceFailures = updates.filter((update) => update.labels.includes("Source Health")).length;

  return [
    ["New updates", String(updates.filter((update) => update.status === "New").length)],
    ["High priority", String(highPriority)],
    ["ESG/risk updates", String(riskUpdates)],
    ["Companies checked", String(companies.length)],
    ["Source failures", String(sourceFailures)],
  ];
}

function refreshAllViews() {
  renderKpis();
  renderFilters();
  renderUpdates();
  renderCompanies();
  renderPeople();
  renderLibrary();
  persistState();
}

function openCompanyDialog() {
  const dialog = document.querySelector("#companyDialog");
  if (typeof dialog.showModal === "function") {
    dialog.showModal();
  } else {
    dialog.setAttribute("open", "");
  }
}

function closeCompanyDialog() {
  const dialog = document.querySelector("#companyDialog");
  if (typeof dialog.close === "function") {
    dialog.close();
  } else {
    dialog.removeAttribute("open");
  }
}

function tag(label, extra = "") {
  return `<span class="tag ${extra}">${label}</span>`;
}

function renderKpis() {
  selectors.kpiGrid.innerHTML = getKpis()
    .map(([label, value]) => `<div class="kpi-card"><span>${label}</span><strong>${value}</strong></div>`)
    .join("");
}

function renderRisks() {
  selectors.riskList.innerHTML = riskScores
    .map(
      ([name, score]) => `
        <div class="risk-item">
          <strong>${name}</strong>
          <span>${score}/100</span>
          <div class="risk-bar"><span style="width:${score}%"></span></div>
        </div>
      `,
    )
    .join("");
}

function renderUpdateCard(update) {
  const priorityClass = update.priority.toLowerCase();
  const updateId = encodeURIComponent(update.title);
  return `
    <article class="update-card" data-search="${[
      update.company,
      update.source,
      update.title,
      update.summary,
      update.labels.join(" "),
      update.priority,
      update.status,
    ]
      .join(" ")
      .toLowerCase()}">
      <div class="update-card-head">
        <div>${tag(update.company)} ${tag(update.source)}</div>
        ${tag(update.priority, priorityClass)}
      </div>
      <div class="update-title">${update.title}</div>
      <p>${update.summary}</p>
      <div class="tag-row">${update.labels.map((item) => tag(item)).join("")} ${tag(update.status)}</div>
      <div class="card-actions">
        <a href="${update.url}" target="_blank" rel="noreferrer">Open source</a>
        <button type="button" data-save="${updateId}">Save</button>
        <button type="button" data-review="${updateId}">Mark reviewed</button>
        <button type="button" data-brief="${update.company}">Generate brief</button>
      </div>
    </article>
  `;
}

function renderUpdates() {
  const filters = {
    company: selectors.companyFilter.value,
    source: selectors.sourceFilter.value,
    priority: selectors.priorityFilter.value,
    status: selectors.statusFilter.value,
    q: selectors.search.value.trim().toLowerCase(),
  };
  const visible = updates.filter((update) => {
    const haystack = [update.company, update.source, update.title, update.summary, update.labels.join(" ")]
      .join(" ")
      .toLowerCase();
    return (
      (!filters.company || update.company === filters.company) &&
      (!filters.source || update.source === filters.source) &&
      (!filters.priority || update.priority === filters.priority) &&
      (!filters.status || update.status === filters.status) &&
      (!filters.q || haystack.includes(filters.q))
    );
  });
  selectors.latestUpdates.innerHTML = updates.slice(0, 3).map(renderUpdateCard).join("");
  selectors.updateFeed.innerHTML = visible.length
    ? visible.map(renderUpdateCard).join("")
    : `<article class="panel"><h2>No updates match the current filters.</h2><p>Try clearing one filter or searching a broader term.</p></article>`;
}

function fillSelect(select, label, values) {
  select.innerHTML = `<option value="">${label}</option>${values
    .map((value) => `<option value="${value}">${value}</option>`)
    .join("")}`;
}

function renderFilters() {
  fillSelect(selectors.companyFilter, "All companies", [...new Set(updates.map((item) => item.company))]);
  fillSelect(selectors.sourceFilter, "All sources", [...new Set(updates.map((item) => item.source))]);
  fillSelect(selectors.priorityFilter, "All priorities", ["High", "Medium", "Low"]);
  fillSelect(selectors.statusFilter, "All statuses", ["New", "Reviewed", "Saved", "Ignored"]);
}

function renderCompanies() {
  selectors.companyTable.innerHTML = companies
    .map(
      (company) => `
        <tr>
          <td><strong>${company.name}</strong><br><a href="${company.website}" target="_blank" rel="noreferrer">${company.website}</a></td>
          <td>${company.type}</td>
          <td>${company.industry}</td>
          <td>${tag(company.health, company.health === "Partial" ? "medium" : "low")}</td>
          <td>${company.high}</td>
          <td>${company.risk}</td>
          <td>${company.lastChecked}</td>
          <td>${tag(company.status, "low")}</td>
        </tr>
      `,
    )
    .join("");
}

function renderWorkspace(tab = "overview") {
  const content = {
    overview: `
      <div class="summary-columns">
        <div class="summary-block">
          <h3>Company profile</h3>
          <p>Sociovestix Labs is tracked as a prospect focused on sustainable finance, financial data science, data quality testing, AI, and executive tracking.</p>
        </div>
        <div class="summary-block">
          <h3>Open questions</h3>
          <ul class="compact-list">
            <li>Which buyer segment is the highest priority: asset owners, asset managers, data providers, or regulators?</li>
            <li>Which configured social sources require authenticated collection?</li>
            <li>Which historical research files should be indexed first?</li>
          </ul>
        </div>
      </div>
    `,
    sources: `
      <div class="summary-columns">
        <div class="summary-block"><h3>Healthy</h3><p><a href="${sources.sociovestix}" target="_blank" rel="noreferrer">Company website</a> is configured for crawl and manual refresh.</p></div>
        <div class="summary-block"><h3>Needs validation</h3><p>LinkedIn profiles for Andreas Hoepner and Damian Borth are configured, but production collection needs authenticated access, a provider, or manual import fallback.</p></div>
      </div>
    `,
    research: `
      <div class="summary-columns">
        <div class="summary-block"><h3>Meeting angle</h3><p>Lead with ESG data reliability, AI auditability, and source-backed market-monitoring workflows for sustainable finance teams.</p></div>
        <div class="summary-block"><h3>Potential pain points</h3><p>Data-provider quality drift, entity matching defects, regulated AI transparency, and difficulty turning public updates into timely client-ready briefs.</p></div>
      </div>
    `,
  };
  selectors.workspaceContent.innerHTML = content[tab];
}

function renderPeople() {
  selectors.peopleGrid.innerHTML = people
    .map(
      (person) => `
        <article class="person-card">
          <h2>${person.name}</h2>
          <p><strong>${person.role}</strong><br>${person.company}</p>
          <a class="profile-link" href="${person.url}" target="_blank" rel="noreferrer">Open configured profile</a>
          <div class="tag-row">${tag(`Confidence: ${person.confidence}`)} ${tag("Facts + inferences separated")}</div>
          <h3>Facts</h3>
          <p>${person.facts}</p>
          <h3>Inferences</h3>
          <p>${person.inferences}</p>
          <h3>Discovery questions</h3>
          <ul class="compact-list">${person.questions.map((q) => `<li>${q}</li>`).join("")}</ul>
        </article>
      `,
    )
    .join("");
}

function renderLibrary() {
  selectors.libraryGrid.innerHTML = library
    .map(
      (file) => `
        <article class="library-card">
          <h2>${file.name}</h2>
          <p>${file.type} · Linked to ${file.linked}</p>
          ${file.extractedText ? `<p>${file.extractedText.slice(0, 220)}${file.extractedText.length > 220 ? "..." : ""}</p>` : ""}
          <div class="tag-row">${tag(file.status)} ${file.tags.map((item) => tag(item)).join("")}</div>
        </article>
      `,
    )
    .join("");
}

function renderBrief({ notify = true } = {}) {
  selectors.briefOutput.innerHTML = `
    <h2>One-page meeting brief: Sociovestix Labs</h2>
    <p><strong>Purpose:</strong> Prepare a source-backed discovery conversation on ESG data quality and AI-enabled financial research workflows.</p>
    <section>
      <h3>Facts from sources</h3>
      <ul class="compact-list">
        <li>Sociovestix publicly positions around sustainable finance, financial data science, data quality testing, AI, and executive tracking.</li>
        <li>The website mentions climate transition investing, impact analytics, net-zero target benchmarking, and data-provider due diligence.</li>
        <li>LinkedIn URLs for Andreas Hoepner and Damian Borth are configured as monitored person sources.</li>
      </ul>
    </section>
    <section>
      <h3>Inferences</h3>
      <p>Likely pain points include ESG data reliability, regulatory expectation changes, vendor data defects, and explainable AI adoption in investment workflows.</p>
    </section>
    <section>
      <h3>Suggested pitch angle</h3>
      <p>Position the dashboard as a lightweight research cockpit that turns public changes, social/profile signals, and uploaded historical notes into Wednesday/Friday meeting-ready intelligence.</p>
    </section>
    <section>
      <h3>Sources</h3>
      <p><a href="${sources.sociovestix}" target="_blank" rel="noreferrer">Sociovestix website</a>, configured LinkedIn profile URLs, and uploaded research notes.</p>
    </section>
  `;
  if (notify) showToast("Brief generated.");
}

function renderAiBrief(text) {
  briefs = [
    {
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      title: "AI-generated Sociovestix brief",
      createdAt: new Date().toISOString(),
      text,
    },
    ...briefs,
  ];
  persistState();
  selectors.briefOutput.innerHTML = `
    <h2>AI-generated brief</h2>
    <section>
      ${formatAiText(text)}
    </section>
  `;
  showToast("AI brief generated.");
}

function formatAiText(text) {
  return text
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${paragraph.trim().replace(/\n/g, "<br>")}</p>`)
    .join("");
}

function addMessage(role, html) {
  selectors.chatMessages.insertAdjacentHTML("beforeend", `<div class="message ${role}">${html}</div>`);
  selectors.chatMessages.scrollTop = selectors.chatMessages.scrollHeight;
}

function answerQuestion(question) {
  const lower = question.toLowerCase();
  if (lower.includes("brief") || lower.includes("meeting")) {
    return `<strong>Meeting prep note</strong><p>Facts: Sociovestix focuses on sustainable finance, financial data science, data quality testing, AI, and executive tracking. Inferences: useful discovery themes are ESG data reliability, AI auditability, and regulatory pressure. Recommendations: ask where source-backed monitoring would save analyst time before client meetings.</p><p>Sources: <a href="${sources.sociovestix}" target="_blank" rel="noreferrer">Sociovestix website</a>, configured LinkedIn URLs.</p>`;
  }
  if (lower.includes("risk") || lower.includes("esg") || lower.includes("climate")) {
    return `<strong>ESG / risk readout</strong><p>Facts: public positioning includes climate transition investing, investment impact analytics, net-zero target benchmarking, data quality testing, and executive tracking. Inferences: regulatory, operational, and market-risk signals should be prioritized for this company.</p><p>Source: <a href="${sources.sociovestix}" target="_blank" rel="noreferrer">Sociovestix website</a>.</p>`;
  }
  return `<strong>Research answer</strong><p>Facts: I can currently use the configured Sociovestix website, LinkedIn profile URLs, and demo research notes. Inferences: the strongest commercial angle is source-backed market monitoring for ESG and AI-heavy financial research. Recommendation: upload previous meeting notes next so the assistant can connect public updates to your relationship history.</p>`;
}

function compactContext() {
  return {
    companies,
    updates: updates.slice(0, 20),
    people,
    library: library.slice(0, 20),
    briefs: briefs.slice(0, 10),
  };
}

async function postJson(url, payload) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || `Request failed: ${response.status}`);
  }

  return response.json();
}

async function askAi(task, question) {
  const result = await postJson("/api/ai", {
    task,
    question,
    context: compactContext(),
  });
  return result.text;
}

async function monitorCompany(company) {
  const result = await postJson("/api/monitor", {
    company: company.name,
    sourceUrl: company.website,
  });

  const update = {
    company: company.name,
    type: company.type,
    source: "Website",
    published: result.published || "Fetched website",
    discovered: new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
    title: result.title || `Website refresh: ${company.name}`,
    summary: result.summary,
    labels: result.labels,
    priority: result.priority,
    status: "New",
    url: company.website,
  };

  const exists = updates.some(
    (item) => item.company === update.company && item.title === update.title && item.url === update.url,
  );
  if (!exists) updates = [update, ...updates];

  return { update, exists };
}

function bindEvents() {
  selectors.navItems.forEach((item) => item.addEventListener("click", () => switchView(item.dataset.view)));
  document.querySelectorAll("[data-view-jump]").forEach((button) =>
    button.addEventListener("click", () => {
      switchView(button.dataset.viewJump);
      if (button.dataset.viewJump === "briefs") renderBrief();
      if (button.dataset.viewJump === "library") {
        setTimeout(() => document.querySelector("#fileInput").click(), 150);
      }
    }),
  );
  [selectors.companyFilter, selectors.sourceFilter, selectors.priorityFilter, selectors.statusFilter].forEach((select) =>
    select.addEventListener("change", renderUpdates),
  );
  selectors.search.addEventListener("input", renderUpdates);
  document.querySelector("#refreshButton").addEventListener("click", async () => {
    showToast("Refreshing configured website sources...");
    try {
      const results = await Promise.all(companies.map((company) => monitorCompany(company)));
      companies = companies.map((company) => ({
        ...company,
        lastChecked: new Date().toLocaleString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        health: "Healthy",
      }));
      refreshAllViews();
      const added = results.filter((result) => !result.exists).length;
      addMessage(
        "bot",
        `<strong>Refresh complete</strong><p>Checked ${companies.length} company source(s). Added ${added} new website update(s). LinkedIn/Instagram/X still require provider or authenticated collection.</p>`,
      );
      showToast(`Refresh complete. ${added} update(s) added.`);
    } catch (error) {
      updates[0].status = "Reviewed";
      refreshAllViews();
      addMessage(
        "bot",
        `<strong>Refresh fallback complete</strong><p>The website monitor endpoint was unavailable, so the local demo state was updated instead. ${error.message}</p>`,
      );
      showToast("Refresh fallback applied.");
    }
  });
  document.querySelector("#markReviewed").addEventListener("click", () => {
    updates = updates.map((update) => ({ ...update, status: "Reviewed" }));
    refreshAllViews();
    showToast("All visible updates marked reviewed.");
  });
  document.querySelector("#openCompanyForm").addEventListener("click", openCompanyDialog);
  document.querySelector("[data-action='addCompany']").addEventListener("click", openCompanyDialog);
  document.querySelector("#closeCompanyDialog").addEventListener("click", closeCompanyDialog);
  document.querySelector("#companyForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    if (!form.get("name")) return;
    companies.push({
      name: form.get("name"),
      type: form.get("type"),
      industry: form.get("industry") || "Unclassified",
      country: "TBD",
      health: "Pending",
      status: "Active",
      high: 0,
      risk: 0,
      lastChecked: "Not checked",
      website: form.get("website") || "#",
    });
    refreshAllViews();
    showToast(`${form.get("name")} added to monitoring.`);
    event.currentTarget.reset();
    closeCompanyDialog();
  });
  document.addEventListener("click", (event) => {
    const saveButton = event.target.closest("[data-save]");
    const reviewButton = event.target.closest("[data-review]");
    const briefButton = event.target.closest("[data-brief]");

    if (saveButton) {
      const title = decodeURIComponent(saveButton.dataset.save);
      updates = updates.map((update) =>
        update.title === title ? { ...update, status: "Saved" } : update,
      );
      refreshAllViews();
      showToast("Update saved.");
      return;
    }

    if (reviewButton) {
      const title = decodeURIComponent(reviewButton.dataset.review);
      updates = updates.map((update) =>
        update.title === title ? { ...update, status: "Reviewed" } : update,
      );
      refreshAllViews();
      showToast("Update marked reviewed.");
      return;
    }

    if (briefButton) {
      switchView("briefs");
      renderBrief();
    }
  });
  document.querySelectorAll("[data-workspace-tab]").forEach((button) =>
    button.addEventListener("click", () => {
      document.querySelectorAll("[data-workspace-tab]").forEach((tab) => tab.classList.remove("active"));
      button.classList.add("active");
      renderWorkspace(button.dataset.workspaceTab);
      showToast(`${button.textContent} tab opened.`);
    }),
  );
  document.querySelector("#fileInput").addEventListener("change", async (event) => {
    const files = await Promise.all([...event.target.files].map(async (file) => ({
      name: file.name,
      type: file.name.split(".").pop()?.toUpperCase() || "File",
      linked: "General research library",
      status: "Uploaded",
      tags: ["Manual upload"],
      extractedText: await extractFileText(file),
    })));
    library = [...files, ...library];
    refreshAllViews();
    if (files.length) showToast(`${files.length} file(s) added to research library.`);
  });
  document.querySelector("#generateBrief").addEventListener("click", async () => {
    renderBrief();
    try {
      const text = await askAi(
        "brief",
        "Generate a one-page meeting brief for Sociovestix Labs. Focus on ESG risk, AI opportunity, recent updates, likely pain points, suggested pitch angle, discovery questions, and sources. Separate facts, inferences, and recommendations.",
      );
      renderAiBrief(text);
    } catch (error) {
      showToast("AI env not configured yet. Showing local brief.");
    }
  });
  document.querySelector("#chatForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const input = document.querySelector("#chatInput");
    const question = input.value.trim();
    if (!question) return;
    addMessage("user", `<strong>You</strong><p>${question}</p>`);
    input.value = "";
    try {
      const text = await askAi("chat", question);
      addMessage("bot", `<strong>AI answer</strong>${formatAiText(text)}`);
    } catch {
      addMessage("bot", answerQuestion(question));
    }
  });
}

async function extractFileText(file) {
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (!["txt", "md", "csv", "json"].includes(extension)) {
    return "Uploaded. Text extraction for this file type should run on the backend in the production version.";
  }

  const text = await file.text();
  return text.slice(0, 8000);
}

function initBriefControls() {
  document.querySelector("#briefTarget").innerHTML = `
    <option>Sociovestix Labs</option>
    <option>Andreas Hoepner</option>
    <option>Damian Borth</option>
  `;
  document.querySelector("#briefFocus").innerHTML = `
    <option>ESG risk and AI opportunity</option>
    <option>Company background</option>
    <option>Person pain points</option>
    <option>Discovery questions</option>
  `;
  document.querySelector("#briefType").innerHTML = `
    <option>One-page brief</option>
    <option>Full research brief</option>
    <option>ESG/risk memo</option>
    <option>Meeting prep note</option>
  `;
}

renderKpis();
renderRisks();
renderFilters();
renderUpdates();
renderCompanies();
renderWorkspace();
renderPeople();
renderLibrary();
initBriefControls();
renderBrief({ notify: false });
bindEvents();
addMessage(
  "bot",
  `<strong>Research assistant ready</strong><p>Ask me for a Sociovestix meeting brief, ESG risk summary, source gaps, or suggested discovery questions. I will separate facts, inferences, and recommendations.</p>`,
);
