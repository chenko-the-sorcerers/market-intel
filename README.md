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

- `GAS_WEB_APP_URL`: optional; defaults to the provided Apps Script web app URL
- `GEMINI_API_KEY`: your Gemini API key
- `GEMINI_MODEL`: optional, defaults to `gemini-2.0-flash`
- `OPENAI_API_KEY`: optional; when present, RAG chat and brief generation use OpenAI first
- `OPENAI_MODEL`: optional, defaults to `gpt-4.1-mini`
- `POSTGRES_URL`: optional fallback if you later want Vercel Postgres / Neon

The API key must not be committed to Git. The browser calls `/api/ai`, and the Vercel function reads the key from the server-side environment.

Open `/api/init` once after deploying. With GAS enabled, this creates the required Google Sheet tabs and seeds Sociovestix demo records.

## Google Apps Script storage

This project now uses Google Apps Script as the primary storage layer. The Vercel API routes call the GAS web app and the GAS script writes into Google Sheet tabs:

- `companies`
- `company_sources`
- `updates`
- `people`
- `uploaded_files`
- `document_chunks`
- `briefs`

Use `gas/Code.gs` as the Apps Script code. If the script is not bound to a spreadsheet, set Script Property `SPREADSHEET_ID` to the target Google Sheet ID. Deploy the script as a Web App with access allowed for the Vercel backend.

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
- Serverless `/api/ai` route for OpenAI-backed RAG chat when `OPENAI_API_KEY` exists, with Gemini fallback.
- Serverless `/api/monitor` route for single website refreshes.
- Serverless `/api/monitor-run` route for scheduled Wednesday/Friday monitoring.
- Vercel cron configured for Wednesday and Friday at 00:00 UTC.
- GAS-backed Google Sheet tables for companies, sources, updates, people, uploaded files, chunks, and briefs.
- Optional Postgres adapter remains available as a fallback.
- Browser localStorage fallback when Postgres is not configured.
- Client-side text extraction for `.txt`, `.md`, `.csv`, and `.json` uploads.
- `/api/files` indexes uploaded text into chunks for chatbot retrieval context.
- `/api/briefs` stores generated briefs.
- `/api/export` exports briefs as Markdown, HTML/print-to-PDF, or Word-compatible `.doc`.

## Monitoring and connectors

Website/news/RSS monitoring is implemented for configured website sources. The monitor crawls the source URL, checks likely newsroom/blog/RSS links, deduplicates updates by content hash, and runs AI summarization for summary, labels, priority, risk categories, facts, inferences, and source citation.

LinkedIn, Instagram, and X are intentionally treated as manual/provider sources in this MVP. Production collection should use authenticated access, an approved social data provider, or manual import/export workflows.

## Demo data

The first demo company is Sociovestix Labs, using:

- https://sociovestix.com/
- https://www.linkedin.com/in/andreashoepner/
- https://www.linkedin.com/in/damianborth/

LinkedIn entries are treated as configured source URLs in this MVP. Production monitoring should use authenticated collection, an approved provider, or manual import fallback.
