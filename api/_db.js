import { sql } from "@vercel/postgres";
import { createHash } from "node:crypto";
import { seedData } from "./_seed.js";

export function hasDatabase() {
  return Boolean(process.env.POSTGRES_URL || process.env.POSTGRES_URL_NON_POOLING);
}

export function hashText(value) {
  return createHash("sha256").update(String(value || "")).digest("hex");
}

export async function ensureSchema() {
  if (!hasDatabase()) throw new Error("POSTGRES_URL is not configured.");

  await sql`
    create table if not exists companies (
      id uuid primary key default gen_random_uuid(),
      name text not null unique,
      company_type text not null default 'prospect',
      industry text,
      country text,
      region text,
      website_url text,
      description text,
      monitoring_status text not null default 'active',
      priority text not null default 'medium',
      notes text,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  `;

  await sql`
    create table if not exists company_sources (
      id uuid primary key default gen_random_uuid(),
      company_id uuid not null references companies(id) on delete cascade,
      source_type text not null,
      url text not null,
      display_name text,
      monitoring_status text not null default 'active',
      last_checked_at timestamptz,
      last_success_at timestamptz,
      last_error text,
      fetch_strategy text not null default 'crawl',
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      unique(company_id, url)
    )
  `;

  await sql`
    create table if not exists updates (
      id uuid primary key default gen_random_uuid(),
      company_id uuid not null references companies(id) on delete cascade,
      source_id uuid references company_sources(id) on delete set null,
      source_type text not null,
      source_url text not null,
      canonical_url text,
      external_id text,
      title text,
      raw_text text,
      snippet text,
      language text default 'en',
      published_at timestamptz,
      discovered_at timestamptz not null default now(),
      content_hash text not null unique,
      ai_summary_en text,
      ai_importance text default 'medium',
      ai_confidence numeric default 0.6,
      facts text,
      inferences text,
      risk_categories jsonb default '[]'::jsonb,
      labels jsonb default '[]'::jsonb,
      status text not null default 'new',
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  `;

  await sql`
    create table if not exists people (
      id uuid primary key default gen_random_uuid(),
      company_id uuid references companies(id) on delete set null,
      full_name text not null,
      role_title text,
      profile_url text,
      linkedin_url text,
      notes text,
      ai_background_summary text,
      ai_pain_points jsonb default '[]'::jsonb,
      ai_aspirations jsonb default '[]'::jsonb,
      ai_unique_trade text,
      ai_confidence numeric default 0.5,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      unique(company_id, full_name)
    )
  `;

  await sql`
    create table if not exists uploaded_files (
      id uuid primary key default gen_random_uuid(),
      company_id uuid references companies(id) on delete set null,
      person_id uuid references people(id) on delete set null,
      file_name text not null,
      file_type text,
      storage_path text,
      upload_status text default 'uploaded',
      extraction_status text default 'pending',
      extracted_text text,
      notes text,
      tags jsonb default '[]'::jsonb,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  `;

  await sql`
    create table if not exists document_chunks (
      id uuid primary key default gen_random_uuid(),
      file_id uuid references uploaded_files(id) on delete cascade,
      chunk_index integer not null,
      chunk_text text not null,
      token_estimate integer,
      created_at timestamptz not null default now(),
      unique(file_id, chunk_index)
    )
  `;

  await sql`
    create table if not exists briefs (
      id uuid primary key default gen_random_uuid(),
      company_id uuid references companies(id) on delete set null,
      person_id uuid references people(id) on delete set null,
      brief_type text not null,
      title text not null,
      body_markdown text not null,
      sources jsonb default '[]'::jsonb,
      created_at timestamptz not null default now()
    )
  `;
}

export async function seedDatabase() {
  await ensureSchema();

  for (const company of seedData.companies) {
    await sql`
      insert into companies (
        name, company_type, industry, country, region, website_url, description,
        monitoring_status, priority, notes
      )
      values (
        ${company.name}, ${company.company_type}, ${company.industry}, ${company.country},
        ${company.region}, ${company.website_url}, ${company.description},
        ${company.monitoring_status}, ${company.priority}, ${company.notes}
      )
      on conflict (name) do nothing
    `;
  }

  const companies = await sql`select id, name from companies`;
  const companyByName = new Map(companies.rows.map((company) => [company.name, company.id]));

  for (const source of seedData.sources) {
    const companyId = companyByName.get(source.company_name);
    if (!companyId) continue;
    await sql`
      insert into company_sources (
        company_id, source_type, url, display_name, monitoring_status, fetch_strategy
      )
      values (
        ${companyId}, ${source.source_type}, ${source.url}, ${source.display_name},
        ${source.monitoring_status}, ${source.fetch_strategy}
      )
      on conflict (company_id, url) do nothing
    `;
  }

  for (const person of seedData.people) {
    const companyId = companyByName.get(person.company_name);
    await sql`
      insert into people (
        company_id, full_name, role_title, linkedin_url, notes,
        ai_background_summary, ai_confidence
      )
      values (
        ${companyId}, ${person.full_name}, ${person.role_title}, ${person.linkedin_url},
        ${person.notes}, ${person.ai_background_summary}, ${person.ai_confidence}
      )
      on conflict (company_id, full_name) do nothing
    `;
  }
}

export async function getDashboardData() {
  await ensureSchema();
  const [companies, sources, updates, people, files, chunks, briefs] = await Promise.all([
    sql`select * from companies order by created_at desc`,
    sql`select * from company_sources order by created_at desc`,
    sql`select * from updates order by discovered_at desc limit 100`,
    sql`select * from people order by created_at desc`,
    sql`select * from uploaded_files order by created_at desc limit 100`,
    sql`select * from document_chunks order by created_at desc limit 250`,
    sql`select * from briefs order by created_at desc limit 50`,
  ]);

  return {
    companies: companies.rows,
    sources: sources.rows,
    updates: updates.rows,
    people: people.rows,
    library: files.rows,
    chunks: chunks.rows,
    briefs: briefs.rows,
  };
}

export function chunkText(text, size = 1200, overlap = 160) {
  const chunks = [];
  const normalized = String(text || "").replace(/\s+/g, " ").trim();
  if (!normalized) return chunks;
  let start = 0;
  while (start < normalized.length) {
    chunks.push(normalized.slice(start, start + size));
    start += size - overlap;
  }
  return chunks;
}
