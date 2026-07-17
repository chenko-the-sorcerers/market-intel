# Intelligence Output Templates

These templates mirror the two provided example reports:

- Persona / client intelligence example: `Emma_Sjostrom_Client_Intelligence-1.pdf`
- Company intelligence example: `Nest Pensions - June 2026-Present.pdf`

## Persona / Client Intelligence Dossier

Use this for an individual person, decision-maker, researcher, executive, or client contact.

Recommended sections:

1. Header
   - Name
   - Role and affiliation
   - Qualification
   - Recognition
   - Location
   - Prepared date

2. Career Trajectory
   - Current role
   - Recent recognition or milestones
   - Important historical positions
   - Education
   - Sources

3. Research Interests & Intellectual Focus
   - Core identity
   - Main themes
   - Distinctive intellectual lens
   - Key papers, talks, or public work
   - Sources

4. Likely Pain Points
   - Strategic pain points
   - Institutional or market pressures
   - Credibility, funding, coordination, or adoption risks
   - Sources

5. Aspirations & Vision
   - What the person appears to be trying to build
   - Long-term ambition
   - Applied goals or institutional legacy
   - Sources

6. Engagement Recommendations
   - How to approach the person
   - What to avoid
   - Evidence or proof points that will resonate
   - Discovery questions

7. Source Notes
   - LinkedIn / profile sources
   - Institutional profiles
   - Publications
   - Media / event references
   - Confidence and verification caveats

Dashboard implementation notes:

- The local UI renders this as `Personal intelligence dossier`.
- Use it when the target is a person or the output type is `Persona / client intelligence dossier`.
- Keep the tone meeting-ready and practical: profile snapshot, strategic context, likely pain points, aspirations, engagement approach, discovery questions, and source notes.
- Treat LinkedIn/social URLs as configured/manual/provider sources unless authenticated collection is available.

## Company Intelligence Report

Use this for companies, institutions, pension funds, asset managers, prospects, or existing clients.

Recommended sections:

1. Header
   - Company name
   - Timeframe focus
   - Prepared date

2. Executive Summary
   - What changed
   - Why it matters
   - Strategic context
   - Most important recent signals

3. Current State & Recent Developments
   - Recent announcements
   - Financial or operational developments
   - Governance / DEI / ESG updates
   - Member/customer/stakeholder initiatives
   - Sources

4. Deep Dive: Pain Points
   - Operational pain points
   - Strategic tensions
   - Fiduciary, regulatory, data, or execution risks
   - Reputation or stakeholder pressure

5. Deep Dive: Dreams & Future Goals
   - Strategic ambition
   - Product or market expansion
   - Institutional goals
   - Data and operating model aspirations

6. How to Use This Intel for Outreach
   - Recommended pitch angle
   - Specific value proposition
   - What to avoid
   - Practical opening questions

7. Sources and Verification Notes
   - Source list
   - Confidence
   - Items to verify before use

## Output Rules

- Always write in English.
- Separate facts from inferences.
- Include source references per section where possible.
- Make uncertainty explicit.
- Prefer concise, meeting-ready prose over generic summaries.
- Do not invent dates, titles, metrics, or quotes.
