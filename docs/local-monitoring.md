# Local Monitoring

This project can run source monitoring locally before pushing anything to Vercel.

## Website crawl

```bash
node scripts/monitor/local-monitor.mjs --dry-run
```

This crawls configured website/news/RSS sources, deduplicates by content hash, and writes:

```text
outputs/monitor-updates.json
```

If `GROQ_API_KEY`, `OPENAI_API_KEY`, or `GEMINI_API_KEY` is available in your shell, the monitor uses the hosted model for summarization. Otherwise it falls back to deterministic labels and summaries.

To force deterministic mode:

```bash
node scripts/monitor/local-monitor.mjs --dry-run --no-ai
```

To persist discovered hashes locally:

```bash
node scripts/monitor/local-monitor.mjs
```

To save new updates into the GAS/Google Sheet backend:

```bash
node scripts/monitor/local-monitor.mjs --save-gas
```

## GAS audit sheets

After redeploying `gas/Code.gs`, the Google Sheet should include these operational tabs:

```text
monitoring_runs
monitoring_run_items
chat_threads
chat_messages
labels
update_labels
```

Use `/api/monitor-run` to create a `monitoring_runs` row and one `monitoring_run_items` row per checked source. Use the chatbot to create or update `chat_threads` and append `chat_messages`.

The deployed Apps Script must be updated before these audit writes appear in the live spreadsheet. Until then, monitor/chat continue to work, but audit rows are skipped by the backend.

To ignore the local dedupe state during testing:

```bash
node scripts/monitor/local-monitor.mjs --dry-run --reset-state
```

## Browser scraping mode

For JavaScript-heavy sites, use browser mode:

```bash
node scripts/monitor/local-monitor.mjs --mode browser
```

Browser mode dynamically tries Playwright first, then Selenium. Install one locally if needed:

```bash
npm install -D playwright
npx playwright install chromium
```

or:

```bash
npm install -D selenium-webdriver
```

LinkedIn, Instagram, and X should remain manual/provider sources unless you have authenticated access and permission to collect the data. Use exports/manual URLs and import them with:

```bash
node scripts/monitor/manual-social-import.mjs manual-posts.json
```

## Wednesday and Friday local schedule

Example cron for 08:00 WITA every Wednesday and Friday:

```cron
0 8 * * 3,5 cd /Users/marchelandrianshevchenko/Documents/Personal-Market-Intelligence && /opt/homebrew/bin/node scripts/monitor/local-monitor.mjs --save-gas >> outputs/monitor-cron.log 2>&1
```

Keep local scheduling separate from Vercel cron while iterating.
