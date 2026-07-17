export function getBriefTemplate(briefType = "") {
  const normalized = String(briefType).toLowerCase();

  if (normalized.includes("persona") || normalized.includes("person") || normalized.includes("client")) {
    return [
      "Use the Persona / Client Intelligence Dossier format, modeled on a consultant-style client intelligence report.",
      "Sections:",
      "1. Dossier header: name, role, affiliation, location, prepared date, confidence level.",
      "2. Executive readout: the 3-5 most useful things to know before meeting this person.",
      "3. Profile snapshot: current role, affiliation, qualification/recognition where sourced, and source links.",
      "4. Career trajectory: current role, milestones, earlier roles, education, and what is verified vs inferred.",
      "5. Intellectual focus / professional agenda: themes, distinctive lens, publications or public work if present in sources.",
      "6. Likely pain points: strategic, institutional, credibility, funding, coordination, adoption, or stakeholder pressures.",
      "7. Aspirations & vision: what the person appears to be trying to build, with uncertainty marked.",
      "8. Engagement recommendations: how to approach, what to avoid, resonant proof points, first meeting angle.",
      "9. Discovery questions: practical questions the user can ask in a meeting.",
      "10. Source notes: profile links, institutional sources, uploaded notes, confidence caveats, and verification gaps.",
      "Rules: write in English, separate facts from inferences, cite sources per section, and do not invent titles, dates, awards, numbers, or quotes.",
    ].join("\n");
  }

  if (normalized.includes("company") || normalized.includes("institution") || normalized.includes("market")) {
    return [
      "Use the Company Intelligence Report format.",
      "Sections:",
      "1. Header: company name, timeframe focus, prepared date.",
      "2. Executive Summary: what changed, why it matters, strategic context, key signals.",
      "3. Current State & Recent Developments: announcements, financial/operational updates, ESG/governance/member initiatives, sources.",
      "4. Deep Dive: Pain Points: operational, fiduciary, regulatory, data, execution, reputation, stakeholder pressures.",
      "5. Deep Dive: Dreams & Future Goals: strategic ambition, market expansion, institutional goals, data/operating model aspirations.",
      "6. How to Use This Intel for Outreach: pitch angle, value proposition, what to avoid, opening questions.",
      "7. Sources and Verification Notes: source list, confidence, items to verify.",
    ].join("\n");
  }

  if (normalized.includes("esg")) {
    return [
      "Use an ESG / Risk Memo format.",
      "Sections:",
      "1. Executive risk summary.",
      "2. Facts from sources.",
      "3. ESG, climate, regulatory, reputation, operational, and market risk signals.",
      "4. Inferences and confidence.",
      "5. Recommended follow-up questions.",
      "6. Sources.",
    ].join("\n");
  }

  return [
    "Use a concise one-page meeting brief format.",
    "Sections: Facts from sources, Recent updates, Inferences, Likely pain points, Suggested pitch angle, Discovery questions, Sources.",
  ].join("\n");
}
