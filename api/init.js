import { seedDatabase } from "./_db.js";

export default async function handler(request, response) {
  if (!["GET", "POST"].includes(request.method)) {
    return response.status(405).json({ error: "Method not allowed" });
  }

  try {
    await seedDatabase();
    return response.status(200).json({ ok: true, message: "Database schema ready and seed data loaded." });
  } catch (error) {
    return response.status(500).json({ error: error.message || "Initialization failed" });
  }
}
