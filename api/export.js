import { sql } from "@vercel/postgres";
import { ensureSchema, hasDatabase } from "./_db.js";

export default async function handler(request, response) {
  if (request.method !== "GET") {
    return response.status(405).send("Method not allowed");
  }
  if (!hasDatabase()) {
    return response.status(501).send("POSTGRES_URL is not configured.");
  }

  try {
    await ensureSchema();
    const { id, format = "md" } = request.query || {};
    const result = id
      ? await sql`select * from briefs where id = ${id} limit 1`
      : await sql`select * from briefs order by created_at desc limit 1`;

    const brief = result.rows[0];
    if (!brief) return response.status(404).send("No brief found.");

    if (format === "html" || format === "docx") {
      response.setHeader(
        "Content-Type",
        format === "docx" ? "application/msword; charset=utf-8" : "text/html; charset=utf-8",
      );
      response.setHeader("Content-Disposition", `attachment; filename="${slug(brief.title)}.${format === "docx" ? "doc" : "html"}"`);
      return response.status(200).send(toHtml(brief));
    }

    response.setHeader("Content-Type", "text/markdown; charset=utf-8");
    response.setHeader("Content-Disposition", `attachment; filename="${slug(brief.title)}.md"`);
    return response.status(200).send(`# ${brief.title}\n\n${brief.body_markdown}`);
  } catch (error) {
    return response.status(500).send(error.message || "Export failed");
  }
}

function slug(value) {
  return String(value || "brief")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function toHtml(brief) {
  const body = String(brief.body_markdown || "")
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, "<br>")}</p>`)
    .join("\n");
  return `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(
    brief.title,
  )}</title><style>body{font-family:Arial,sans-serif;max-width:780px;margin:40px auto;line-height:1.55;color:#1c2430}h1{font-size:28px}</style></head><body><h1>${escapeHtml(
    brief.title,
  )}</h1>${body}</body></html>`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
