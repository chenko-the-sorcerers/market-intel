import { sql } from "@vercel/postgres";
import { ensureSchema, getDashboardData, hasDatabase } from "./_db.js";
import { getGasData, hasGas, saveGasBrief } from "./_gas.js";
import { generateIntelligenceText } from "./_llm.js";
import { getBriefTemplate } from "./_templates.js";

export default async function handler(request, response) {
  if (!["GET", "POST"].includes(request.method)) {
    return response.status(405).json({ error: "Method not allowed" });
  }
  if (hasGas()) {
    try {
      if (request.method === "GET") {
        const data = await getGasData();
        return response.status(200).json({ briefs: data.briefs });
      }

      const { brief_type = "one-page", title = "Market intelligence brief", question = "" } = request.body || {};
      const context = await getGasData();
      const generated = await generateIntelligenceText({
        task: "brief",
        question:
          `${question || `Generate a ${brief_type} brief. Include facts, inferences, recommendations, discovery questions, and source citations.`}\n\n${getBriefTemplate(brief_type)}`,
        context,
      });
      const saved = await saveGasBrief({
        brief_type,
        title,
        body_markdown: generated.text,
        sources: extractSources(context),
      });
      return response.status(200).json({ brief: saved.brief });
    } catch (error) {
      return response.status(500).json({ error: error.message || "GAS brief generation failed" });
    }
  }
  if (!hasDatabase()) {
    return response.status(501).json({ error: "GAS_WEB_APP_URL or POSTGRES_URL is not configured." });
  }

  try {
    await ensureSchema();

    if (request.method === "GET") {
      const briefs = await sql`select * from briefs order by created_at desc limit 50`;
      return response.status(200).json({ briefs: briefs.rows });
    }

    const { brief_type = "one-page", title = "Market intelligence brief", question = "" } = request.body || {};
    const context = await getDashboardData();
    const generated = await generateIntelligenceText({
      task: "brief",
      question:
        `${question || `Generate a ${brief_type} brief. Include facts, inferences, recommendations, discovery questions, and source citations.`}\n\n${getBriefTemplate(brief_type)}`,
      context,
    });

    const result = await sql`
      insert into briefs (brief_type, title, body_markdown, sources)
      values (${brief_type}, ${title}, ${generated.text}, ${JSON.stringify(extractSources(context))}::jsonb)
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
