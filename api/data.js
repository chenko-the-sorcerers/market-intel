import { sql } from "@vercel/postgres";
import { ensureSchema, getDashboardData, hasDatabase } from "./_db.js";
import { getGasData, hasGas, saveGasCompany, updateGasStatus } from "./_gas.js";

export default async function handler(request, response) {
  if (hasGas()) {
    try {
      if (request.method === "GET") {
        return response.status(200).json(await getGasData());
      }

      if (request.method === "POST") {
        const { entity, payload } = request.body || {};
        if (entity === "company") {
          return response.status(200).json({ company: await saveGasCompany(payload) });
        }
        if (entity === "update-status") {
          return response.status(200).json(await updateGasStatus(payload));
        }
        return response.status(400).json({ error: "Unsupported entity." });
      }

      return response.status(405).json({ error: "Method not allowed" });
    } catch (error) {
      return response.status(500).json({ error: error.message || "GAS data request failed" });
    }
  }

  if (!hasDatabase()) {
    return response.status(501).json({ error: "GAS_WEB_APP_URL or POSTGRES_URL is not configured." });
  }

  try {
    await ensureSchema();

    if (request.method === "GET") {
      return response.status(200).json(await getDashboardData());
    }

    if (request.method === "POST") {
      const { entity, payload } = request.body || {};
      if (entity === "company") {
        const result = await sql`
          insert into companies (
            name, company_type, industry, country, region, website_url,
            description, monitoring_status, priority, notes
          )
          values (
            ${payload.name}, ${payload.company_type || payload.type || "prospect"},
            ${payload.industry || null}, ${payload.country || null}, ${payload.region || null},
            ${payload.website_url || payload.website || null}, ${payload.description || null},
            ${payload.monitoring_status || "active"}, ${payload.priority || "medium"},
            ${payload.notes || null}
          )
          on conflict (name) do update set
            company_type = excluded.company_type,
            industry = excluded.industry,
            website_url = excluded.website_url,
            updated_at = now()
          returning *
        `;
        return response.status(200).json({ company: result.rows[0] });
      }

      if (entity === "update-status") {
        const { title, status } = payload;
        await sql`update updates set status = ${status}, updated_at = now() where title = ${title}`;
        return response.status(200).json({ ok: true });
      }

      return response.status(400).json({ error: "Unsupported entity." });
    }

    return response.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    return response.status(500).json({ error: error.message || "Data request failed" });
  }
}
