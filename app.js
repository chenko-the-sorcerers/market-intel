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
      "Profile source tracked as a manual/provider input. Sociovestix context emphasizes sustainable finance, financial data science, and ESG data quality.",
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
      "Profile source tracked as a manual/provider input. Public context connects him with AI, machine learning, and Sociovestix Laboratories.",
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
const CHAT_THREAD_KEY = "market-intel-active-chat-thread";

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
let sourcesState = state.sources || [];
let activeChatThreadId = localStorage.getItem(CHAT_THREAD_KEY) || "";

function persistState() {
  state = { companies, updates, people, library, briefs, sources: sourcesState };
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
  scrapeCompany: document.querySelector("#scrapeCompany"),
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
  renderScrapeCompanies();
  renderUpdates();
  renderCompanies();
  renderPeople();
  renderLibrary();
  initBriefControls();
  persistState();
}

function renderScrapeCompanies() {
  if (!selectors.scrapeCompany) return;
  selectors.scrapeCompany.innerHTML = companies
    .map((company, index) => {
      const id = company.id || company.name;
      return `<option value="${id}" ${index === 0 ? "selected" : ""}>${company.name}</option>`;
    })
    .join("");
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
  const company = companies.find((item) => item.name === "Sociovestix Labs") || companies[0];
  const companyUpdates = updates.filter((update) => update.company === company?.name);
  const companyPeople = people.filter((person) => person.company === company?.name);
  const companyFiles = library.filter((file) =>
    [file.linked, file.name, file.extractedText].join(" ").toLowerCase().includes((company?.name || "").toLowerCase()),
  );
  const companySources = sourcesState.length
    ? sourcesState.filter((source) => source.company_id === company?.id || source.url?.includes("sociovestix"))
    : [
        { source_type: "website", url: sources.sociovestix, monitoring_status: "active", fetch_strategy: "crawl" },
        { source_type: "linkedin", url: sources.andreas, monitoring_status: "manual", fetch_strategy: "manual_upload" },
        { source_type: "linkedin", url: sources.damian, monitoring_status: "manual", fetch_strategy: "manual_upload" },
      ];
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
      <div class="update-list">
        ${companySources
          .map(
            (source) => `
              <div class="summary-block">
                <h3>${titleCase(source.source_type)} · ${titleCase(source.monitoring_status)}</h3>
                <p><a href="${source.url}" target="_blank" rel="noreferrer">${source.url}</a></p>
                <div class="tag-row">${tag(source.fetch_strategy || "crawl")} ${tag(source.last_error ? "Needs attention" : "Ready")}</div>
              </div>
            `,
          )
          .join("")}
      </div>
    `,
    updates: `
      <div class="update-list">
        ${companyUpdates.slice(0, 8).map(renderUpdateCard).join("") || "<p>No company updates yet.</p>"}
      </div>
    `,
    people: `
      <div class="people-grid">
        ${companyPeople
          .map(
            (person) => `
              <article class="person-card">
                <h2>${person.name}</h2>
                <p>${person.role}</p>
                <p>${personMeetingAngles(person)}</p>
                <div class="card-actions">
                  <button type="button" data-person-dossier="${person.name}">Open personal intelligence</button>
                </div>
              </article>
            `,
          )
          .join("") || "<p>No people linked yet.</p>"}
      </div>
    `,
    files: `
      <div class="library-grid">
        ${companyFiles
          .map(
            (file) => `
              <article class="library-card">
                <h2>${file.name}</h2>
                <p>${file.type} · ${file.status}</p>
                <p>${(file.extractedText || "").slice(0, 220)}</p>
              </article>
            `,
          )
          .join("") || "<p>No files linked yet. Upload notes or exports in Research Library.</p>"}
      </div>
    `,
    briefs: `
      <div class="update-list">
        ${briefs
          .slice(0, 8)
          .map(
            (brief) => `
              <div class="summary-block">
                <h3>${brief.title || "Brief"}</h3>
                <p>${(brief.body_markdown || brief.text || "").slice(0, 360)}</p>
                ${brief.id ? `<a href="/api/export?id=${brief.id}&format=md">Export Markdown</a> · <a href="/api/export?id=${brief.id}&format=html">Export HTML/PDF</a> · <a href="/api/export?id=${brief.id}&format=docx">Export DOC</a>` : ""}
              </div>
            `,
          )
          .join("") || "<p>No briefs generated yet.</p>"}
      </div>
    `,
    chat: `
      <div class="summary-block">
        <h3>Company-scoped chat</h3>
        <p>Use the Chatbot section and select company scope. The backend sends company updates, people, files, and briefs as retrieval context.</p>
        <button class="button primary" data-view-jump="chatbot" type="button">Open company chat</button>
      </div>
    `,
  };
  selectors.workspaceContent.innerHTML = content[tab];
}

function renderPeople() {
  selectors.peopleGrid.innerHTML = people
    .map(
      (person) => renderPersonOverviewCard(person),
    )
    .join("");
}

function renderPersonOverviewCard(person) {
  const overview = getPersonalIntelligenceOverview(person);
  return `
    <article class="person-card person-overview-card">
      <div class="person-overview-head">
        <div>
          <p class="eyebrow">Personal intelligence overview</p>
          <h2>${person.name}</h2>
          <p><strong>${person.role}</strong><br>${person.company}</p>
        </div>
        <div class="tag-row">${tag(`Confidence: ${person.confidence}`)} ${tag("Meeting-ready")}</div>
      </div>

      <section class="person-readout">
        <h3>Executive readout</h3>
        <ul class="compact-list">${overview.readout.map((item) => `<li>${item}</li>`).join("")}</ul>
      </section>

      <div class="person-overview-grid">
        <section>
          <h3>Career & credibility</h3>
          <p>${overview.credibility}</p>
        </section>
        <section>
          <h3>Professional agenda</h3>
          <p>${overview.agenda}</p>
        </section>
        <section>
          <h3>Likely pain points</h3>
          <p>${overview.painPoints}</p>
        </section>
        <section>
          <h3>Aspirations & vision</h3>
          <p>${overview.aspirations}</p>
        </section>
      </div>

      <section>
        <h3>Engagement approach</h3>
        <p>${overview.engagement}</p>
      </section>

      <section>
        <h3>Discovery questions</h3>
        <ul class="compact-list">${overview.questions.map((q) => `<li>${q}</li>`).join("")}</ul>
      </section>

      <section>
        <h3>Source notes</h3>
        <p>${overview.sources}</p>
      </section>

      <div class="card-actions">
        <a href="${person.url}" target="_blank" rel="noreferrer">Open profile source</a>
        <button type="button" data-person-dossier="${person.name}">Open full personal dossier</button>
      </div>
    </article>
  `;
}

function getPersonalIntelligenceOverview(person) {
  const isDamian = /Damian Borth/i.test(person.name || "");
  const signal = personProfileSignal(person);
  const angles = personMeetingAngles(person);
  const questions = normalizePersonQuestions(person.name, person.questions);

  if (isDamian) {
    return {
      readout: [
        "AI and machine-learning contact connected to Sociovestix's financial-data science agenda.",
        "Most useful angle: model governance, production AI, and auditability in regulated financial workflows.",
        "Treat social/profile content as manual/provider-sourced until authenticated collection is configured.",
      ],
      credibility: signal,
      agenda: angles,
      painPoints:
        "Likely tension between ambitious AI automation and the need for explainability, evaluation, and stakeholder trust in financial-data environments.",
      aspirations:
        "Inference: may be focused on making advanced AI useful in real decision workflows without losing methodological rigor or auditability.",
      engagement:
        "Lead with concrete AI governance and data-quality use cases. Avoid generic AI hype; ask where production reliability and uncertainty communication are hardest.",
      questions,
      sources:
        "Configured LinkedIn/profile source, Sociovestix website context, monitored updates, and uploaded notes. Verify biographical details before outreach.",
    };
  }

  return {
    readout: [
      "Sustainable-finance contact connected to Sociovestix's ESG data quality and financial-data science positioning.",
      "Most useful angle: evidence quality, real-world ESG data defects, and how research becomes buyer-ready intelligence.",
      "Treat social/profile content as manual/provider-sourced until authenticated collection is configured.",
    ],
    credibility: signal,
    agenda: angles,
    painPoints:
      "Likely tension between ESG credibility, regulatory expectations, data-provider reliability, and the need to prove that sustainability analytics changes decisions.",
    aspirations:
      "Inference: may care about making sustainable-finance data more trustworthy, decision-useful, and defensible for institutional stakeholders.",
    engagement:
      "Lead with a source-backed observation about ESG data quality. Ask about data defects and decision workflows before pitching automation.",
    questions,
    sources:
      "Configured LinkedIn/profile source, Sociovestix website context, monitored updates, and uploaded notes. Verify biographical details before outreach.",
  };
}

function personProfileSignal(person) {
  const raw = String(person.facts || "");
  if (/LinkedIn profile configured by researcher|Configured source|production social monitoring/i.test(raw)) {
    if (/Damian Borth/i.test(person.name || "")) {
      return "Profile source is tracked as a manual/provider input. Public context connects him with AI, machine learning, and Sociovestix Laboratories.";
    }
    return "Profile source is tracked as a manual/provider input. Sociovestix context emphasizes sustainable finance, financial data science, and ESG data quality.";
  }
  return raw || "Profile source is available, but key facts should be verified before outreach.";
}

function personMeetingAngles(person) {
  const raw = String(person.inferences || "");
  if (/Initial person profile seeded/i.test(raw)) return cleanPersonInferences(person.name, raw);
  if (/Likely meeting angles:/i.test(raw)) return raw.replace(/^Likely meeting angles:\s*/i, "");
  return raw || "Use public updates, profile context, and uploaded notes to identify the strongest meeting angle.";
}

function cleanPersonFacts(name, value) {
  const raw = String(value || "");
  if (/Configured source|configured by researcher|production social monitoring/i.test(raw)) {
    if (/Damian Borth/i.test(name || "")) {
      return "Profile source is tracked as a manual/provider input. Public context connects him with AI, machine learning, and Sociovestix Laboratories.";
    }
    return "Profile source is tracked as a manual/provider input. Sociovestix context emphasizes sustainable finance, financial data science, and ESG data quality.";
  }
  return raw;
}

function cleanPersonInferences(name, value) {
  const raw = String(value || "");
  if (/Initial person profile seeded/i.test(raw)) {
    if (/Damian Borth/i.test(name || "")) {
      return "AI productization, model governance, financial time-series workflows, and explainable automation for regulated financial-data users.";
    }
    return "ESG data quality, asset-owner sustainability workflows, EU sustainable finance expectations, and climate-transition analytics.";
  }
  if (/Likely meeting angles:/i.test(raw)) return raw.replace(/^Likely meeting angles:\s*/i, "");
  return raw;
}

function normalizePersonQuestions(name, questions) {
  const generic = ["What changed recently?", "What pain point should we validate?", "Which source should be checked next?"];
  const list = Array.isArray(questions) ? questions : [];
  const isGeneric = !list.length || generic.every((question, index) => list[index] === question);
  if (!isGeneric) return list;
  if (/Damian Borth/i.test(name || "")) {
    return [
      "Which AI capabilities are most mature for financial-data production use?",
      "How do you communicate model uncertainty to nontechnical investment stakeholders?",
      "Where do clients ask for automation but still need auditability?",
    ];
  }
  return [
    "Which ESG data-quality failures are most expensive for your partners?",
    "Where do clients still need human analyst judgement in AI-assisted workflows?",
    "How are EU sustainable finance expectations changing buyer urgency?",
  ];
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
  const request = getBriefRequest();
  if (request.isPersona) {
    renderPersonalIntelligenceDossier(request, notify);
    return;
  }

  selectors.briefOutput.innerHTML = `
    <h2>${request.type}: ${request.target}</h2>
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
    <section>
      <h3>Export</h3>
      <div class="card-actions">
        <button type="button" data-export-local="md">Download Markdown</button>
        <button type="button" data-export-local="html">Download HTML / Print PDF</button>
      </div>
    </section>
  `;
  if (notify) showToast("Brief generated.");
}

function renderPersonalIntelligenceDossier(request, notify = true) {
  const person =
    people.find((item) => item.name === request.target) ||
    people.find((item) => item.company === request.target) ||
    people[0] ||
    {};
  const company = companies.find((item) => item.name === person.company) || companies[0] || {};
  const personUpdates = updates.filter((update) => update.company === person.company).slice(0, 4);
  const overview = getPersonalIntelligenceOverview(person);
  const credibilitySignals = [
    overview.credibility,
    overview.agenda,
    `Source confidence: ${person.confidence || "Medium"}. Treat profile-derived details as verification targets before external use.`,
  ];

  selectors.briefOutput.innerHTML = `
    <div class="dossier-cover">
      <p class="eyebrow">Personal intelligence dossier</p>
      <h2>${person.name || request.target}</h2>
      <p>${person.role || "Role to verify"} · ${person.company || company.name || "Affiliation to verify"}</p>
      <div class="dossier-meta">
        <span>Prepared ${new Date().toLocaleDateString("en-GB")}</span>
        <span>Confidence ${person.confidence || "Medium"}</span>
        <span>Source-backed meeting prep</span>
      </div>
    </div>

    <section class="dossier-grid">
      <div>
        <h3>Profile Snapshot</h3>
        <ul class="compact-list">
          <li><strong>Current role:</strong> ${person.role || "Needs verification from profile and institutional sources."}</li>
          <li><strong>Affiliation:</strong> ${person.company || company.name || "Unknown"}</li>
          <li><strong>Location:</strong> ${company.country || "To verify"}</li>
          <li><strong>Primary source:</strong> <a href="${person.url || "#"}" target="_blank" rel="noreferrer">Configured profile</a></li>
        </ul>
      </div>
      <div>
        <h3>Strategic Context</h3>
        <p>${overview.agenda}</p>
      </div>
    </section>

    <section>
      <h3>Career & Credibility Signals</h3>
      <ul class="compact-list">${credibilitySignals.map((item) => `<li>${item}</li>`).join("")}</ul>
    </section>

    <section>
      <h3>Likely Pain Points</h3>
      <div class="insight-columns">
        <div>
          <h4>Professional</h4>
          <p>${overview.painPoints}</p>
        </div>
        <div>
          <h4>Strategic</h4>
          <p>Needs credible evidence, clean source trails, and rapid synthesis across public signals, profile context, and historical notes.</p>
        </div>
        <div>
          <h4>Relationship</h4>
          <p>Likely responds better to precise, source-aware questions than broad product claims. Avoid overstating scraped social data.</p>
        </div>
      </div>
    </section>

    <section>
      <h3>Aspirations & Vision</h3>
      <p>${overview.aspirations}</p>
    </section>

    <section>
      <h3>Engagement Approach</h3>
      <ul class="compact-list">
        <li>${overview.engagement}</li>
        <li>Ask about current bottlenecks before introducing automation or AI claims.</li>
        <li>Show how the dashboard separates facts, inferences, and recommendations.</li>
        <li>Position manual LinkedIn/social inputs as compliant provider/manual connectors, not brittle scraping.</li>
      </ul>
    </section>

    <section>
      <h3>Discovery Questions</h3>
      <ul class="compact-list">${overview.questions.map((question) => `<li>${question}</li>`).join("")}</ul>
    </section>

    <section>
      <h3>Recent Context To Bring Into The Meeting</h3>
      ${
        personUpdates.length
          ? `<ul class="compact-list">${personUpdates
              .map((update) => `<li><strong>${update.title}</strong> - ${update.summary}</li>`)
              .join("")}</ul>`
          : "<p>No stored updates linked yet. Run monitoring or scrape a relevant URL before using this dossier externally.</p>"
      }
    </section>

    <section>
      <h3>Source Notes</h3>
      <p>${overview.sources} ${company.website ? `<a href="${company.website}" target="_blank" rel="noreferrer">${company.name || "company"} website</a>` : ""}</p>
    </section>

    <section>
      <h3>Export</h3>
      <div class="card-actions">
        <button type="button" data-export-local="md">Download Markdown</button>
        <button type="button" data-export-local="html">Download HTML / Print PDF</button>
      </div>
    </section>
  `;
  if (notify) showToast("Personal intelligence dossier generated.");
}

function openPersonalDossier(targetName) {
  switchView("briefs");
  const target = document.querySelector("#briefTarget");
  const focus = document.querySelector("#briefFocus");
  const type = document.querySelector("#briefType");
  if (target) target.value = targetName || people[0]?.name || target.value;
  if (focus) focus.value = "Personal intelligence";
  if (type) type.value = "Persona / client intelligence dossier";
  renderBrief();
}

function renderAiBrief(text, title = "AI-generated brief") {
  briefs = [
    {
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      title,
      createdAt: new Date().toISOString(),
      text,
    },
    ...briefs,
  ];
  persistState();
  selectors.briefOutput.innerHTML = `
    <h2>${title}</h2>
    <section>
      ${formatAiText(text)}
    </section>
    <section>
      <h3>Export</h3>
      <div class="card-actions">
        ${briefs[0]?.id ? `<a href="/api/export?id=${briefs[0].id}&format=md">Markdown</a><a href="/api/export?id=${briefs[0].id}&format=html">HTML / Print PDF</a><a href="/api/export?id=${briefs[0].id}&format=docx">DOC</a>` : ""}
        <button type="button" data-export-local="md">Download local Markdown</button>
      </div>
    </section>
  `;
  showToast("AI brief generated.");
}

function getBriefRequest() {
  const target = document.querySelector("#briefTarget")?.value || "Sociovestix Labs";
  const focus = document.querySelector("#briefFocus")?.value || "ESG risk and AI opportunity";
  const type = document.querySelector("#briefType")?.value || "One-page brief";
  const isPersona =
    /persona|client|personal|person/i.test(type) ||
    people.some((person) => person.name === target);
  return { target, focus, type, isPersona };
}

function buildBriefQuestion(request) {
  if (request.isPersona) {
    return [
      `Generate a personal intelligence dossier for ${request.target}.`,
      `Focus: ${request.focus}.`,
      "Mirror the Emma Sjostrom-style client intelligence structure: profile snapshot, role and affiliation, career trajectory, research/interests, credibility signals, likely pain points, aspirations, engagement recommendations, discovery questions, and source notes.",
      "Write in English. Separate facts from inferences. Include confidence caveats and source citations. Do not invent dates, titles, metrics, or quotes.",
    ].join(" ");
  }

  return [
    `Generate a ${request.type} for ${request.target}.`,
    `Focus on ${request.focus}.`,
    "Include facts, recent updates, inferences, likely pain points, suggested pitch angle, discovery questions, recommendations, and source citations.",
    "Separate facts, inferences, and recommendations.",
  ].join(" ");
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

function removeMessage(element) {
  if (element) element.remove();
}

function addPendingMessage() {
  selectors.chatMessages.insertAdjacentHTML(
    "beforeend",
    `<div class="message bot" data-pending="true"><strong>Working</strong><p>Checking stored research context and AI route...</p></div>`,
  );
  selectors.chatMessages.scrollTop = selectors.chatMessages.scrollHeight;
  return selectors.chatMessages.querySelector("[data-pending='true']:last-child");
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

function downloadText(filename, content, type = "text/plain") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function currentBriefMarkdown() {
  const text = selectors.briefOutput.innerText.trim();
  return `# Market intelligence brief\n\n${text}`;
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

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || `Request failed: ${response.status}`);
  }
  return response.json();
}

function normalizeRemoteData(data) {
  companies = (data.companies || companies).map((company) => ({
    id: company.id,
    name: company.name,
    type: titleCase(company.company_type || company.type || "prospect"),
    industry: company.industry || "Unclassified",
    country: company.country || company.region || "TBD",
    health: company.monitoring_status === "active" ? "Healthy" : "Partial",
    status: titleCase(company.monitoring_status || "active"),
    high: updates.filter((update) => update.company === company.name && update.priority === "High").length,
    risk: updates.filter((update) => update.company === company.name && hasRisk(update.labels)).length,
    lastChecked: company.updated_at ? new Date(company.updated_at).toLocaleString("en-GB") : "Not checked",
    website: company.website_url || company.website || "#",
  }));

  sourcesState = data.sources || sourcesState;

  updates = (data.updates || updates).map((update) => ({
    id: update.id,
    company:
      data.companies?.find((company) => company.id === update.company_id)?.name ||
      update.company ||
      "Unknown company",
    type: "Prospect",
    source: titleCase(update.source_type || update.source || "website"),
    published: update.published_at ? new Date(update.published_at).toLocaleDateString("en-GB") : "Discovered",
    discovered: update.discovered_at ? new Date(update.discovered_at).toLocaleDateString("en-GB") : update.discovered,
    title: update.title || "Untitled update",
    summary: update.ai_summary_en || update.summary || update.snippet || "",
    labels: Array.isArray(update.labels) ? update.labels : JSON.parse(update.labels || "[]"),
    priority: titleCase(update.ai_importance || update.priority || "medium"),
    status: titleCase(update.status || "new"),
    url: update.source_url || update.url || "#",
  }));

  people = (data.people || people).map((person) => ({
    id: person.id,
    name: person.full_name || person.name,
    role: person.role_title || person.role,
    company:
      data.companies?.find((company) => company.id === person.company_id)?.name ||
      person.company ||
      "Unlinked",
    url: person.linkedin_url || person.profile_url || person.url || "#",
    confidence: person.ai_confidence ? `${Math.round(Number(person.ai_confidence) * 100)}%` : person.confidence || "Medium",
    facts: cleanPersonFacts(person.full_name || person.name, person.notes || person.facts || ""),
    inferences: cleanPersonInferences(person.full_name || person.name, person.ai_background_summary || person.inferences || ""),
    questions: normalizePersonQuestions(person.full_name || person.name, person.questions),
  }));

  library = (data.library || library).map((file) => ({
    id: file.id,
    name: file.file_name || file.name,
    type: file.file_type || file.type,
    linked: file.company_id || file.linked || "General research library",
    status: titleCase(file.extraction_status || file.status || "uploaded"),
    tags: Array.isArray(file.tags) ? file.tags : JSON.parse(file.tags || "[]"),
    extractedText: file.extracted_text || file.extractedText || "",
  }));

  briefs = data.briefs || briefs;
}

async function syncDatabase({ silent = false } = {}) {
  try {
    const data = await fetchJson("/api/data");
    normalizeRemoteData(data);
    refreshAllViews();
    if (!silent) showToast("Database synced.");
    return true;
  } catch (error) {
    if (!silent) showToast(`Database not configured yet: ${error.message}`);
    return false;
  }
}

function titleCase(value) {
  return String(value || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function hasRisk(labels = []) {
  return labels.some((label) =>
    ["ESG", "Climate", "Regulatory", "Reputation", "Operational Risk", "Market Risk"].includes(label),
  );
}

async function askAi(task, question) {
  const scopeType = document.querySelector("input[name='scope']:checked")?.value || "global";
  const primaryCompany = companies[0] || {};
  const primaryPerson = people.find((person) => person.company === primaryCompany.name) || people[0] || {};
  const result = await postJson("/api/ai", {
    task,
    question,
    threadId: task === "chat" ? activeChatThreadId : "",
    scopeType,
    companyId: scopeType === "global" ? "" : primaryCompany.id || "",
    personId: scopeType === "person" ? primaryPerson.id || "" : "",
    context: compactContext(),
  });
  if (task === "chat" && result.threadId) {
    activeChatThreadId = result.threadId;
    localStorage.setItem(CHAT_THREAD_KEY, activeChatThreadId);
  }
  return result;
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

async function runBackendMonitor() {
  const result = await postJson("/api/monitor-run", {});
  await syncDatabase({ silent: true });
  return result;
}

async function scrapeUrlFromForm(form) {
  const formData = new FormData(form);
  const selectedCompany = companies.find(
    (company) => String(company.id || company.name) === String(formData.get("company")),
  ) || companies[0];
  const url = String(formData.get("url") || "").trim();
  const sourceType = String(formData.get("sourceType") || "website");
  if (!url) return;

  showToast("Scraping URL...");
  const result = await postJson("/api/scrape-url", {
    url,
    company_id: selectedCompany?.id || "manual-company",
    company_name: selectedCompany?.name || "Manual company",
    source_id: `${sourceType}-manual-url`,
    source_type: sourceType,
  });
  await syncDatabase({ silent: true });
  showToast(result.inserted ? "URL scraped and saved." : "URL already exists. No duplicate saved.");
}

function bindEvents() {
  selectors.navItems.forEach((item) => item.addEventListener("click", () => switchView(item.dataset.view)));
  document.querySelectorAll("input[name='scope']").forEach((input) =>
    input.addEventListener("change", () => {
      activeChatThreadId = "";
      localStorage.removeItem(CHAT_THREAD_KEY);
    }),
  );
  document.querySelectorAll("[data-view-jump]").forEach((button) =>
    button.addEventListener("click", () => {
      switchView(button.dataset.viewJump);
      if (button.dataset.viewJump === "briefs") renderBrief();
      if (button.dataset.viewJump === "library") {
        setTimeout(() => document.querySelector("#fileInput").click(), 150);
      }
    }),
  );
  document.querySelector("#syncButton").addEventListener("click", () => syncDatabase());
  document.querySelector("#scrapeForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      await scrapeUrlFromForm(event.currentTarget);
      event.currentTarget.reset();
      renderScrapeCompanies();
    } catch (error) {
      showToast(`Scrape failed: ${error.message}`);
    }
  });
  [selectors.companyFilter, selectors.sourceFilter, selectors.priorityFilter, selectors.statusFilter].forEach((select) =>
    select.addEventListener("change", renderUpdates),
  );
  selectors.search.addEventListener("input", renderUpdates);
  document.querySelector("#refreshButton").addEventListener("click", async () => {
    showToast("Refreshing configured website sources...");
    try {
      const backendResult = await runBackendMonitor();
      addMessage(
        "bot",
        `<strong>Refresh complete</strong><p>Checked ${backendResult.checked_sources} configured source(s). Added ${backendResult.inserted} new update(s), deduped ${backendResult.deduped}. LinkedIn/Instagram/X remain manual/provider sources.</p>`,
      );
      showToast(`Refresh complete. ${backendResult.inserted} update(s) added.`);
    } catch (error) {
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
        `<strong>Refresh fallback complete</strong><p>Database monitor was unavailable, so ${companies.length} local source(s) were checked and ${added} local update(s) were added. ${error.message}</p>`,
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
    postJson("/api/data", {
      entity: "company",
      payload: {
        name: form.get("name"),
        company_type: form.get("type"),
        industry: form.get("industry") || "Unclassified",
        website_url: form.get("website") || null,
      },
    })
      .then(() => syncDatabase({ silent: true }))
      .catch(() => {});
    refreshAllViews();
    showToast(`${form.get("name")} added to monitoring.`);
    event.currentTarget.reset();
    closeCompanyDialog();
  });
  document.addEventListener("click", (event) => {
    const viewButton = event.target.closest("[data-view-jump]");
    const saveButton = event.target.closest("[data-save]");
    const reviewButton = event.target.closest("[data-review]");
    const briefButton = event.target.closest("[data-brief]");
    const personDossierButton = event.target.closest("[data-person-dossier]");
    const exportButton = event.target.closest("[data-export-local]");

    if (viewButton) {
      switchView(viewButton.dataset.viewJump);
      return;
    }

    if (saveButton) {
      const title = decodeURIComponent(saveButton.dataset.save);
      updates = updates.map((update) =>
        update.title === title ? { ...update, status: "Saved" } : update,
      );
      postJson("/api/data", {
        entity: "update-status",
        payload: { title, status: "saved" },
      }).catch(() => {});
      refreshAllViews();
      showToast("Update saved.");
      return;
    }

    if (reviewButton) {
      const title = decodeURIComponent(reviewButton.dataset.review);
      updates = updates.map((update) =>
        update.title === title ? { ...update, status: "Reviewed" } : update,
      );
      postJson("/api/data", {
        entity: "update-status",
        payload: { title, status: "reviewed" },
      }).catch(() => {});
      refreshAllViews();
      showToast("Update marked reviewed.");
      return;
    }

    if (briefButton) {
      switchView("briefs");
      renderBrief();
      return;
    }

    if (personDossierButton) {
      openPersonalDossier(personDossierButton.dataset.personDossier);
      return;
    }

    if (exportButton) {
      const format = exportButton.dataset.exportLocal;
      const markdown = currentBriefMarkdown();
      if (format === "html") {
        downloadText("market-intelligence-brief.html", `<html><body><pre>${markdown}</pre></body></html>`, "text/html");
      } else {
        downloadText("market-intelligence-brief.md", markdown, "text/markdown");
      }
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
    files.forEach((file) => {
      postJson("/api/files", {
        file_name: file.name,
        file_type: file.type,
        extracted_text: file.extractedText,
        tags: file.tags,
      }).catch(() => {});
    });
    refreshAllViews();
    if (files.length) showToast(`${files.length} file(s) added to research library.`);
  });
  document.querySelector("#generateBrief").addEventListener("click", async () => {
    const request = getBriefRequest();
    const question = buildBriefQuestion(request);
    const title = `${request.type}: ${request.target}`;
    renderBrief();
    try {
      const result = await postJson("/api/briefs", {
        brief_type: request.type,
        title,
        question,
      });
      briefs = [result.brief, ...briefs];
      renderAiBrief(result.brief.body_markdown, title);
    } catch (error) {
      try {
        const result = await askAi("brief", question);
        renderAiBrief(result.text, title);
      } catch {
        showToast("AI/DB env not configured yet. Showing local brief.");
      }
    }
  });
  document.querySelector("#chatForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const input = document.querySelector("#chatInput");
    const question = input.value.trim();
    if (!question) return;
    addMessage("user", `<strong>You</strong><p>${question}</p>`);
    input.value = "";
    const pending = addPendingMessage();
    try {
      const result = await askAi("chat", question);
      removeMessage(pending);
      const label = result.fallback
        ? "Local retrieval answer"
        : result.provider?.startsWith("groq")
          ? "Groq answer"
        : result.provider?.startsWith("gemini")
          ? "Gemini answer"
          : result.provider?.startsWith("openai")
            ? "OpenAI answer"
            : "Research answer";
      addMessage("bot", `<strong>${label}</strong>${formatAiText(result.text)}`);
    } catch (error) {
      removeMessage(pending);
      addMessage(
        "bot",
        `<strong>Local fallback</strong><p>${error.message || "AI route unavailable."}</p>${answerQuestion(question)}`,
      );
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
  const companyOptions = companies.map((company) => `<option>${company.name}</option>`).join("");
  const peopleOptions = people.map((person) => `<option>${person.name}</option>`).join("");
  document.querySelector("#briefTarget").innerHTML = `
    ${companyOptions}
    ${peopleOptions}
  `;
  document.querySelector("#briefFocus").innerHTML = `
    <option>ESG risk and AI opportunity</option>
    <option>Company background</option>
    <option>Personal intelligence</option>
    <option>Career and credibility signals</option>
    <option>Person pain points</option>
    <option>Discovery questions</option>
  `;
  document.querySelector("#briefType").innerHTML = `
    <option>One-page brief</option>
    <option>Persona / client intelligence dossier</option>
    <option>Company intelligence report</option>
    <option>Full research brief</option>
    <option>ESG/risk memo</option>
    <option>Meeting prep note</option>
  `;
}

renderKpis();
renderRisks();
renderFilters();
renderScrapeCompanies();
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
syncDatabase({ silent: true });
