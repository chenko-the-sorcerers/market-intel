export const seedData = {
  companies: [
    {
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
    },
  ],
  sources: [
    {
      company_name: "Sociovestix Labs",
      source_type: "website",
      url: "https://sociovestix.com/",
      display_name: "Sociovestix website",
      monitoring_status: "active",
      fetch_strategy: "crawl",
    },
    {
      company_name: "Sociovestix Labs",
      source_type: "linkedin",
      url: "https://www.linkedin.com/in/andreashoepner/",
      display_name: "Andreas Hoepner LinkedIn",
      monitoring_status: "manual",
      fetch_strategy: "manual_upload",
    },
    {
      company_name: "Sociovestix Labs",
      source_type: "linkedin",
      url: "https://www.linkedin.com/in/damianborth/",
      display_name: "Damian Borth LinkedIn",
      monitoring_status: "manual",
      fetch_strategy: "manual_upload",
    },
  ],
  people: [
    {
      company_name: "Sociovestix Labs",
      full_name: "Andreas Hoepner",
      role_title: "Sustainable finance / financial data science contact",
      linkedin_url: "https://www.linkedin.com/in/andreashoepner/",
      notes:
        "Configured LinkedIn profile. Use provider/manual import for production monitoring.",
      ai_background_summary:
        "Likely meeting context: ESG data quality, asset-owner sustainability workflows, EU sustainable finance expectations, and climate-transition analytics.",
      ai_confidence: 0.62,
    },
    {
      company_name: "Sociovestix Labs",
      full_name: "Damian Borth",
      role_title: "AI / machine-learning contact",
      linkedin_url: "https://www.linkedin.com/in/damianborth/",
      notes:
        "Configured LinkedIn profile. Use provider/manual import for production monitoring.",
      ai_background_summary:
        "Likely meeting context: deep-learning productization, AI governance, financial time-series modeling, and defensible AI in regulated workflows.",
      ai_confidence: 0.72,
    },
  ],
};
