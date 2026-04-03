import { handleCors } from "../_shared/cors.ts";
import { authenticateAdmin, getServiceClient } from "../_shared/auth.ts";
import { jsonResponse, errorResponse } from "../_shared/response.ts";

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
  if (an.includes(bn) || bn.includes(an)) return 0.85;
  const maxLen = Math.max(an.length, bn.length);
  if (maxLen === 0) return 0;
  return 1 - levenshtein(an, bn) / maxLen;
}

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

function extractDomain(input: string | null): string | null {
  if (!input) return null;
  try {
    if (input.includes('@')) return input.split('@')[1]?.toLowerCase() || null;
    const url = new URL(input.startsWith('http') ? input : `https://${input}`);
    return url.hostname.replace(/^www\./, '').toLowerCase();
  } catch { return null; }
}

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

  const nameNorm = normalize(input.name || '');
  const candNorm = normalize(candidate.name || '');
  const nameSim = similarity(nameNorm, candNorm);
  if (nameSim >= 0.7) { score += nameSim * 50; reasons.push(`Name match: ${Math.round(nameSim * 100)}%`); }

  if (input.name_ar && candidate.name_ar) {
    const arSim = similarity(input.name_ar.trim(), candidate.name_ar.trim());
    if (arSim >= 0.7) { score += arSim * 15; reasons.push(`Arabic name match: ${Math.round(arSim * 100)}%`); }
  }

  const inputDomain = extractDomain(input.website) || extractDomain(input.email);
  const candDomain = extractDomain(candidate.website) || extractDomain(candidate.email);
  if (inputDomain && candDomain && inputDomain === candDomain) { score += 20; reasons.push(`Same domain: ${inputDomain}`); }

  if (input.email && candidate.email && input.email.toLowerCase() === candidate.email.toLowerCase()) { score += 15; reasons.push('Exact email match'); }

  if (input.phone && candidate.phone) {
    const pA = input.phone.replace(/\D/g, '').slice(-9);
    const pB = candidate.phone.replace(/\D/g, '').slice(-9);
    if (pA.length >= 7 && pA === pB) { score += 10; reasons.push('Phone match'); }
  }

  if (input.city && candidate.city) {
    if (similarity(input.city, candidate.city) >= 0.8) { score += 5; reasons.push('Same city'); }
  }

  if (score < 30) return null;
  return { record: candidate, score: Math.min(score, 100), reasons };
}

const TABLE_CONFIGS: Record<string, { table: string; fields: string; nameField: string; nameArField: string; identifierField: string }> = {
  organizers: { table: "organizers", fields: "id, name, name_ar, email, phone, website, city, country, country_code, status, logo_url, organizer_number", nameField: "name", nameArField: "name_ar", identifierField: "organizer_number" },
  companies: { table: "companies", fields: "id, name, name_ar, email, phone, website, city, country, country_code, status, logo_url, company_number", nameField: "name", nameArField: "name_ar", identifierField: "company_number" },
  culinary_entities: { table: "culinary_entities", fields: "id, name, name_ar, email, phone, website, city, country, country_code, status, logo_url, entity_number", nameField: "name", nameArField: "name_ar", identifierField: "entity_number" },
  establishments: { table: "establishments", fields: "id, name, name_ar, email, phone, website, city, country, country_code, status, logo_url, establishment_number", nameField: "name", nameArField: "name_ar", identifierField: "establishment_number" },
  exhibitions: { table: "exhibitions", fields: "id, title, title_ar, email, phone, website, city, country, country_code, status, logo_url, exhibition_number", nameField: "title", nameArField: "title_ar", identifierField: "exhibition_number" },
};

function toEntityRecord(row: any, config: typeof TABLE_CONFIGS[string], tableName: string): EntityRecord {
  return {
    id: row.id, name: row[config.nameField] || '', name_ar: row[config.nameArField] || null,
    email: row.email || null, phone: row.phone || null, website: row.website || null,
    city: row.city || null, country: row.country || null, country_code: row.country_code || null,
    table_name: tableName, identifier: row[config.identifierField.split('.').pop()!] || null,
    status: row.status || null, logo_url: row.logo_url || null,
  };
}

Deno.serve(async (req) => {
  const corsRes = handleCors(req);
  if (corsRes) return corsRes;

  try {
    const { userClient } = await authenticateAdmin(req);
    const body = await req.json();
    const { mode } = body;

    if (mode === "check") {
      const { entity, tables, exclude_id } = body;
      const targetTables = (tables || Object.keys(TABLE_CONFIGS)) as string[];
      const candidates: (DupCandidate & { table_name: string })[] = [];

      for (const tbl of targetTables) {
        const config = TABLE_CONFIGS[tbl];
        if (!config) continue;
        let query = userClient.from(config.table).select(config.fields).limit(500);
        if (exclude_id) query = query.neq("id", exclude_id);
        const { data, error } = await query;
        if (error || !data) continue;
        for (const row of data) {
          const result = scorePair(entity, toEntityRecord(row, config, tbl));
          if (result) candidates.push({ ...result, table_name: tbl });
        }
      }

      candidates.sort((a, b) => b.score - a.score);
      return jsonResponse({ success: true, duplicates: candidates.slice(0, 10), total_checked: targetTables.length });
    }

    if (mode === "batch_scan") {
      const { table, cross_tables } = body;
      const config = TABLE_CONFIGS[table];
      if (!config) throw new Error("Invalid table");

      const { data: records, error } = await userClient.from(config.table).select(config.fields).limit(1000);
      if (error) throw error;
      if (!records?.length) return jsonResponse({ success: true, groups: [] });

      const crossRecords: EntityRecord[] = [];
      for (const ct of (cross_tables || []) as string[]) {
        const cc = TABLE_CONFIGS[ct];
        if (!cc || ct === table) continue;
        const { data: cData } = await userClient.from(cc.table).select(cc.fields).limit(500);
        if (cData) for (const row of cData) crossRecords.push(toEntityRecord(row, cc, ct));
      }

      const groups: { primary: EntityRecord; matches: DupCandidate[] }[] = [];
      const processed = new Set<string>();

      for (let i = 0; i < records.length; i++) {
        if (processed.has(records[i].id)) continue;
        const primary = toEntityRecord(records[i], config, table);
        const matches: DupCandidate[] = [];

        for (let j = i + 1; j < records.length; j++) {
          if (processed.has(records[j].id)) continue;
          const result = scorePair(primary, toEntityRecord(records[j], config, table));
          if (result) matches.push(result);
        }
        for (const cr of crossRecords) {
          const result = scorePair(primary, cr);
          if (result) matches.push(result);
        }

        if (matches.length > 0) {
          matches.sort((a, b) => b.score - a.score);
          groups.push({ primary, matches: matches.slice(0, 5) });
          matches.forEach(m => { if (m.record.table_name === table) processed.add(m.record.id); });
          processed.add(primary.id);
        }
      }

      groups.sort((a, b) => b.matches[0].score - a.matches[0].score);
      return jsonResponse({ success: true, groups: groups.slice(0, 50), total_records: records.length });
    }

    if (mode === "merge") {
      const { primary_id, merge_ids, table } = body;
      const config = TABLE_CONFIGS[table];
      if (!config || !primary_id || !merge_ids?.length) throw new Error("Invalid merge parameters");

      if (table === "organizers") {
        for (const mid of merge_ids) {
          await userClient.from("exhibition_organizers").update({ organizer_id: primary_id }).eq("organizer_id", mid);
          await userClient.from("organizers").delete().eq("id", mid);
        }
        try { await userClient.rpc("refresh_organizer_stats", { p_organizer_id: primary_id }); } catch { /* ignore */ }
      } else if (table === "companies") {
        for (const mid of merge_ids) {
          await userClient.from("company_contacts").update({ company_id: primary_id }).eq("company_id", mid);
          await userClient.from("ad_campaigns").update({ company_id: primary_id }).eq("company_id", mid);
          await userClient.from("companies").delete().eq("id", mid);
        }
      } else if (table === "establishments") {
        for (const mid of merge_ids) {
          await userClient.from("bookings").update({ establishment_id: primary_id }).eq("establishment_id", mid);
          await userClient.from("establishments").delete().eq("id", mid);
        }
      } else if (table === "culinary_entities") {
        for (const mid of merge_ids) {
          await userClient.from("culinary_entities").delete().eq("id", mid);
        }
      }

      return jsonResponse({ success: true, merged: merge_ids.length, primary_id });
    }

    throw new Error("Invalid mode. Use: check, batch_scan, or merge");
  } catch (error) {
    console.error("entity-dedup error:", error);
    return errorResponse(error);
  }
});
