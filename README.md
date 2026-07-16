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
- Output directory: `public`

The MVP is a static app. The build step validates `app.js`, then copies `index.html`, `styles.css`, and `app.js` into `public` for Vercel.

Add these Environment Variables in Vercel:

- `GEMINI_API_KEY`: your Gemini API key
- `GEMINI_MODEL`: optional, defaults to `gemini-2.0-flash`

The API key must not be committed to Git. The browser calls `/api/ai`, and the Vercel function reads the key from the server-side environment.

## Current MVP

- Home dashboard for Wednesday/Friday review.
- KPI strip, latest updates, risk spotlight, and quick actions.
- Update feed with company, source, priority, status, and search filters.
- Company table and Sociovestix workspace tabs.
- People profiles for Andreas Hoepner and Damian Borth.
- Research library with local upload simulation.
- Brief generator with facts, inferences, recommendations, and sources.
- Chatbot demo that answers in English and separates facts from inferences.
- Serverless `/api/ai` route for Gemini-backed chat and brief generation.
- Serverless `/api/monitor` route for website monitoring refreshes.
- Browser localStorage persistence for companies, updates, people, files, and generated briefs.
- Client-side text extraction for `.txt`, `.md`, `.csv`, and `.json` uploads.

## Demo data

The first demo company is Sociovestix Labs, using:

- https://sociovestix.com/
- https://www.linkedin.com/in/andreashoepner/
- https://www.linkedin.com/in/damianborth/

LinkedIn entries are treated as configured source URLs in this MVP. Production monitoring should use authenticated collection, an approved provider, or manual import fallback.
