import { sql } from "@vercel/postgres";
import { chunkText, ensureSchema, hasDatabase } from "./_db.js";

export default async function handler(request, response) {
  if (request.method !== "POST") {
    return response.status(405).json({ error: "Method not allowed" });
  }
  if (!hasDatabase()) {
    return response.status(501).json({ error: "POSTGRES_URL is not configured." });
  }

  try {
    await ensureSchema();
    const {
      file_name,
      file_type,
      extracted_text = "",
      tags = ["Manual upload"],
      notes = null,
      company_id = null,
      person_id = null,
    } = request.body || {};

    if (!file_name) return response.status(400).json({ error: "file_name is required" });

    const fileResult = await sql`
      insert into uploaded_files (
        company_id, person_id, file_name, file_type, storage_path, upload_status,
        extraction_status, extracted_text, notes, tags
      )
      values (
        ${company_id}, ${person_id}, ${file_name}, ${file_type}, ${file_name},
        'uploaded', ${extracted_text ? "success" : "pending"}, ${extracted_text},
        ${notes}, ${JSON.stringify(tags)}::jsonb
      )
      returning *
    `;

    const chunks = chunkText(extracted_text);
    for (const [index, chunk] of chunks.entries()) {
      await sql`
        insert into document_chunks (file_id, chunk_index, chunk_text, token_estimate)
        values (${fileResult.rows[0].id}, ${index}, ${chunk}, ${Math.ceil(chunk.length / 4)})
      `;
    }

    return response.status(200).json({
      file: fileResult.rows[0],
      chunks: chunks.length,
      note:
        "PDF/DOCX/XLSX binary extraction should be handled by a dedicated parser service. This endpoint stores extracted text and chunks it for RAG.",
    });
  } catch (error) {
    return response.status(500).json({ error: error.message || "File indexing failed" });
  }
}
