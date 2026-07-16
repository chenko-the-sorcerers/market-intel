# Personal Market Intelligence MVP

Static MVP dashboard and chatbot prototype for a single market researcher.

## Run locally

```bash
npm run dev
```

Open `http://127.0.0.1:8080/index.html`.

## Deploy on Vercel

Import this repository into Vercel and keep the defaults:

- Framework preset: `Other`
- Build command: `npm run build`
- Output directory: empty / project root

The MVP is a static app, so Vercel serves `index.html`, `styles.css`, and `app.js` directly.

## Current MVP

- Home dashboard for Wednesday/Friday review.
- KPI strip, latest updates, risk spotlight, and quick actions.
- Update feed with company, source, priority, status, and search filters.
- Company table and Sociovestix workspace tabs.
- People profiles for Andreas Hoepner and Damian Borth.
- Research library with local upload simulation.
- Brief generator with facts, inferences, recommendations, and sources.
- Chatbot demo that answers in English and separates facts from inferences.

## Demo data

The first demo company is Sociovestix Labs, using:

- https://sociovestix.com/
- https://www.linkedin.com/in/andreashoepner/
- https://www.linkedin.com/in/damianborth/

LinkedIn entries are treated as configured source URLs in this MVP. Production monitoring should use authenticated collection, an approved provider, or manual import fallback.
