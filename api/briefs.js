import { sql } from "@vercel/postgres";
import { ensureSchema, getDashboardData, hasDatabase } from "./_db.js";
import { generateIntelligenceText } from "./_llm.js";

export default async function handler(request, response) {
  if (!["GET", "POST"].includes(request.method)) {
    return response.status(405).json({ error: "Method not allowed" });
  }
  if (!hasDatabase()) {
    return response.status(501).json({ error: "POSTGRES_URL is not configured." });
  }

  try {
    await ensureSchema();

    if (request.method === "GET") {
      const briefs = await sql`select * from briefs order by created_at desc limit 50`;
      return response.status(200).json({ briefs: briefs.rows });
    }

    const { brief_type = "one-page", title = "Market intelligence brief", question = "" } = request.body || {};
    const context = await getDashboardData();
    const body = await generateIntelligenceText({
      task: "brief",
      question:
        question ||
        `Generate a ${brief_type} brief. Include facts, inferences, recommendations, discovery questions, and source citations.`,
      context,
    });

    const result = await sql`
      insert into briefs (brief_type, title, body_markdown, sources)
      values (${brief_type}, ${title}, ${body}, ${JSON.stringify(extractSources(context))}::jsonb)
      returning *
    `;

    return response.status(200).json({ brief: result.rows[0] });
  } catch (error) {
    return response.status(500).json({ error: error.message || "Brief generation failed" });
  }
}

function extractSources(context) {
  return [
    ...context.updates.map((update) => update.source_url).filter(Boolean),
    ...context.sources.map((source) => source.url).filter(Boolean),
  ].slice(0, 30);
}
