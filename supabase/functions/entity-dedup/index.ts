import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};
const jsonHeaders = { ...corsHeaders, 'Content-Type': 'application/json' };

// ─── Fuzzy string similarity (Levenshtein-based) ───
function levenshtein(a: string, b: string): number {
  const la = a.length, lb = b.length;
  if (la === 0) return lb;
  if (lb === 0) return la;
  const matrix: number[][] = [];
  for (let i = 0; i <= la; i++) matrix[i] = [i];
  for (let j = 0; j <= lb; j++) matrix[0][j] = j;
  for (let i = 1; i <= la; i++) {
    for (let j = 1; j <= lb; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(matrix[i - 1][j] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j - 1] + cost);
    }
  }
  return matrix[la][lb];
}

function similarity(a: string, b: string): number {
  if (!a || !b) return 0;
  const an = a.toLowerCase().trim();
  const bn = b.toLowerCase().trim();
  if (an === bn) return 1;
  // Exact containment
  if (an.includes(bn) || bn.includes(an)) return 0.85;
  const maxLen = Math.max(an.length, bn.length);
  if (maxLen === 0) return 0;
  return 1 - levenshtein(an, bn) / maxLen;
}

// Normalize: strip common suffixes, articles, etc.
function normalize(name: string): string {
  return name
    .toLowerCase()
    .replace(/[''`"""]/g, '')
    .replace(/\b(the|of|for|and|&|al|el|le|la|de|du|des|di|da|von|van)\b/gi, '')
    .replace(/\b(llc|inc|corp|co|ltd|gmbh|sa|sarl|pvt|pty)\b/gi, '')
    .replace(/\b(association|organization|federation|society|council|academy|institute|centre|center|group|company|establishment)\b/gi, '')
    .replace(/[^a-z0-9\u0600-\u06FF\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Domain from URL/email
function extractDomain(input: string | null): string | null {
  if (!input) return null;
  try {
    if (input.includes('@')) return input.split('@')[1]?.toLowerCase() || null;
    const url = new URL(input.startsWith('http') ? input : `https://${input}`);
    return url.hostname.replace(/^www\./, '').toLowerCase();
  } catch { return null; }
}

// Score two records
interface EntityRecord {
  id: string;
  name: string;
  name_ar?: string | null;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  city?: string | null;
  country?: string | null;
  country_code?: string | null;
  table_name: string;
  identifier?: string | null;
  status?: string | null;
  logo_url?: string | null;
}

interface DupCandidate {
  record: EntityRecord;
  score: number;
  reasons: string[];
}

function scorePair(input: Partial<EntityRecord>, candidate: EntityRecord): DupCandidate | null {
  let score = 0;
  const reasons: string[] = [];

  // Name similarity (weight: 50%)
  const nameNorm = normalize(input.name || '');
  const candNorm = normalize(candidate.name || '');
  const nameSim = similarity(nameNorm, candNorm);
  if (nameSim >= 0.7) {
    score += nameSim * 50;
    reasons.push(`Name match: ${Math.round(nameSim * 100)}%`);
  }

  // Arabic name (weight: 15%)
  if (input.name_ar && candidate.name_ar) {
    const arSim = similarity(input.name_ar.trim(), candidate.name_ar.trim());
    if (arSim >= 0.7) {
      score += arSim * 15;
      reasons.push(`Arabic name match: ${Math.round(arSim * 100)}%`);
    }
  }

  // Domain match (weight: 20%)
  const inputDomain = extractDomain(input.website) || extractDomain(input.email);
  const candDomain = extractDomain(candidate.website) || extractDomain(candidate.email);
  if (inputDomain && candDomain && inputDomain === candDomain) {
    score += 20;
    reasons.push(`Same domain: ${inputDomain}`);
  }

  // Email exact match (weight: 15%)
  if (input.email && candidate.email && input.email.toLowerCase() === candidate.email.toLowerCase()) {
    score += 15;
    reasons.push('Exact email match');
  }

  // Phone match (weight: 10%)
  if (input.phone && candidate.phone) {
    const pA = input.phone.replace(/\D/g, '').slice(-9);
    const pB = candidate.phone.replace(/\D/g, '').slice(-9);
    if (pA.length >= 7 && pA === pB) {
      score += 10;
      reasons.push('Phone match');
    }
  }

  // Location match (weight: 5%)
  if (input.city && candidate.city) {
    const citySim = similarity(input.city, candidate.city);
    if (citySim >= 0.8) {
      score += 5;
      reasons.push('Same city');
    }
  }

  // Minimum threshold
  if (score < 30) return null;

  return { record: candidate, score: Math.min(score, 100), reasons };
}

// ─── Auth helper ───
async function authenticate(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) throw new Error("Unauthorized");
  const client = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );
  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user) throw new Error("Unauthorized");

  // Admin check
  const { data: roles } = await client.from("user_roles").select("role").eq("user_id", user.id);
  const isAdmin = roles?.some((r: any) => r.role === "supervisor" || r.role === "organizer");
  if (!isAdmin) throw new Error("Unauthorized");

  return { client, user };
}

// ─── Table configs ───
const TABLE_CONFIGS: Record<string, { table: string; fields: string; nameField: string; nameArField: string; identifierField: string }> = {
  organizers: { table: "organizers", fields: "id, name, name_ar, email, phone, website, city, country, country_code, status, logo_url, organizer_number", nameField: "name", nameArField: "name_ar", identifierField: "organizer_number" },
  companies: { table: "companies", fields: "id, name, name_ar, email, phone, website, city, country, country_code, status, logo_url, company_number", nameField: "name", nameArField: "name_ar", identifierField: "company_number" },
  culinary_entities: { table: "culinary_entities", fields: "id, name, name_ar, email, phone, website, city, country, country_code, status, logo_url, entity_number", nameField: "name", nameArField: "name_ar", identifierField: "entity_number" },
  establishments: { table: "establishments", fields: "id, name, name_ar, email, phone, website, city, country, country_code, status, logo_url, establishment_number", nameField: "name", nameArField: "name_ar", identifierField: "establishment_number" },
  exhibitions: { table: "exhibitions", fields: "id, title, title_ar, email, phone, website, city, country, country_code, status, logo_url, exhibition_number", nameField: "title", nameArField: "title_ar", identifierField: "exhibition_number" },
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { client } = await authenticate(req);
    const body = await req.json();
    const { mode } = body;

    // ─── Mode 1: Check single entity for duplicates ───
    if (mode === "check") {
      const { entity, tables, exclude_id } = body;
      // entity: { name, name_ar, email, phone, website, city, country }
      // tables: string[] e.g. ["organizers", "companies"]
      const targetTables = (tables || Object.keys(TABLE_CONFIGS)) as string[];
      const candidates: (DupCandidate & { table_name: string })[] = [];

      for (const tbl of targetTables) {
        const config = TABLE_CONFIGS[tbl];
        if (!config) continue;

        let query = client.from(config.table).select(config.fields).limit(500);
        if (exclude_id) query = query.neq("id", exclude_id);

        const { data, error } = await query;
        if (error || !data) continue;

        for (const row of data) {
          const record: EntityRecord = {
            id: row.id,
            name: row[config.nameField] || '',
            name_ar: row[config.nameArField] || null,
            email: row.email || null,
            phone: row.phone || null,
            website: row.website || null,
            city: row.city || null,
            country: row.country || null,
            country_code: row.country_code || null,
            table_name: tbl,
            identifier: row[config.identifierField.split('.').pop()!] || null,
            status: row.status || null,
            logo_url: row.logo_url || null,
          };

          const result = scorePair(entity, record);
          if (result) {
            candidates.push({ ...result, table_name: tbl });
          }
        }
      }

      // Sort by score desc
      candidates.sort((a, b) => b.score - a.score);

      return new Response(JSON.stringify({
        success: true,
        duplicates: candidates.slice(0, 10),
        total_checked: targetTables.length,
      }), { headers: jsonHeaders });
    }

    // ─── Mode 2: Batch scan for duplicates across a table ───
    if (mode === "batch_scan") {
      const { table, cross_tables } = body;
      const config = TABLE_CONFIGS[table];
      if (!config) throw new Error("Invalid table");

      const { data: records, error } = await client.from(config.table).select(config.fields).limit(1000);
      if (error) throw error;
      if (!records?.length) return new Response(JSON.stringify({ success: true, groups: [] }), { headers: jsonHeaders });

      // Cross-table records
      const crossRecords: EntityRecord[] = [];
      const crossTables = (cross_tables || []) as string[];
      for (const ct of crossTables) {
        const cc = TABLE_CONFIGS[ct];
        if (!cc || ct === table) continue;
        const { data: cData } = await client.from(cc.table).select(cc.fields).limit(500);
        if (cData) {
          for (const row of cData) {
            crossRecords.push({
              id: row.id,
              name: row[cc.nameField] || '',
              name_ar: row[cc.nameArField] || null,
              email: row.email || null,
              phone: row.phone || null,
              website: row.website || null,
              city: row.city || null,
              country: row.country || null,
              country_code: row.country_code || null,
              table_name: ct,
              identifier: row[cc.identifierField.split('.').pop()!] || null,
              status: row.status || null,
              logo_url: row.logo_url || null,
            });
          }
        }
      }

      // Find duplicate groups within same table
      const groups: { primary: EntityRecord; matches: DupCandidate[] }[] = [];
      const processed = new Set<string>();

      for (let i = 0; i < records.length; i++) {
        if (processed.has(records[i].id)) continue;

        const primary: EntityRecord = {
          id: records[i].id,
          name: records[i][config.nameField] || '',
          name_ar: records[i][config.nameArField] || null,
          email: records[i].email || null,
          phone: records[i].phone || null,
          website: records[i].website || null,
          city: records[i].city || null,
          country: records[i].country || null,
          country_code: records[i].country_code || null,
          table_name: table,
          identifier: records[i][config.identifierField.split('.').pop()!] || null,
          status: records[i].status || null,
          logo_url: records[i].logo_url || null,
        };

        const matches: DupCandidate[] = [];

        // Compare within same table
        for (let j = i + 1; j < records.length; j++) {
          if (processed.has(records[j].id)) continue;
          const cand: EntityRecord = {
            id: records[j].id,
            name: records[j][config.nameField] || '',
            name_ar: records[j][config.nameArField] || null,
            email: records[j].email || null,
            phone: records[j].phone || null,
            website: records[j].website || null,
            city: records[j].city || null,
            country: records[j].country || null,
            country_code: records[j].country_code || null,
            table_name: table,
            identifier: records[j][config.identifierField.split('.').pop()!] || null,
            status: records[j].status || null,
            logo_url: records[j].logo_url || null,
          };
          const result = scorePair(primary, cand);
          if (result) matches.push(result);
        }

        // Cross-table matches
        for (const cr of crossRecords) {
          const result = scorePair(primary, cr);
          if (result) matches.push({ ...result });
        }

        if (matches.length > 0) {
          matches.sort((a, b) => b.score - a.score);
          groups.push({ primary, matches: matches.slice(0, 5) });
          matches.forEach(m => { if (m.record.table_name === table) processed.add(m.record.id); });
          processed.add(primary.id);
        }
      }

      groups.sort((a, b) => b.matches[0].score - a.matches[0].score);

      return new Response(JSON.stringify({
        success: true,
        groups: groups.slice(0, 50),
        total_records: records.length,
      }), { headers: jsonHeaders });
    }

    // ─── Mode 3: Merge entities ───
    if (mode === "merge") {
      const { primary_id, merge_ids, table } = body;
      const config = TABLE_CONFIGS[table];
      if (!config || !primary_id || !merge_ids?.length) throw new Error("Invalid merge parameters");

      // For organizers: reassign exhibition_organizers links
      if (table === "organizers") {
        for (const mid of merge_ids) {
          // Move exhibition links
          await client.from("exhibition_organizers").update({ organizer_id: primary_id }).eq("organizer_id", mid);
          // Delete the duplicate
          await client.from("organizers").delete().eq("id", mid);
        }
        // Refresh stats
        try {
          await client.rpc("refresh_organizer_stats", { p_organizer_id: primary_id });
        } catch { /* ignore */ }
      }
      // For companies
      else if (table === "companies") {
        for (const mid of merge_ids) {
          await client.from("company_contacts").update({ company_id: primary_id }).eq("company_id", mid);
          await client.from("ad_campaigns").update({ company_id: primary_id }).eq("company_id", mid);
          await client.from("companies").delete().eq("id", mid);
        }
      }
      // For establishments
      else if (table === "establishments") {
        for (const mid of merge_ids) {
          await client.from("bookings").update({ establishment_id: primary_id }).eq("establishment_id", mid);
          await client.from("establishments").delete().eq("id", mid);
        }
      }
      // For culinary_entities
      else if (table === "culinary_entities") {
        for (const mid of merge_ids) {
          await client.from("culinary_entities").delete().eq("id", mid);
        }
      }

      return new Response(JSON.stringify({
        success: true,
        merged: merge_ids.length,
        primary_id,
      }), { headers: jsonHeaders });
    }

    throw new Error("Invalid mode. Use: check, batch_scan, or merge");
  } catch (error) {
    const msg = (error as Error).message;
    console.error("entity-dedup error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: msg === "Unauthorized" ? 401 : 400,
      headers: jsonHeaders,
    });
  }
});
