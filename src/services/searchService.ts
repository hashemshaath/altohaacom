/**
 * Search Service — Postgres FTS (with ILIKE fallback) + SWR cache + parallel queries.
 *
 * ── Strategy ──────────────────────────────────────────────
 * Strategy A (preferred): Postgres full-text search via `.textSearch('search_vector', q, { type: 'websearch', config: 'simple' })`
 *   • requires a `search_vector tsvector` column + GIN index on the table
 *   • orders of magnitude faster than ILIKE on large tables
 *
 * Strategy B (fallback): legacy ILIKE on text columns
 *   • used automatically when FTS errors (column missing, malformed query, etc.)
 *
 * The first failure for a given table is remembered in `ftsCapability` so we
 * stop hitting Strategy A for the rest of the session.
 *
 * ── Cache ─────────────────────────────────────────────────
 *   • age <  60s : serve cached, NO network
 *   • 60s–5min   : serve stale, refresh in background (SWR)
 *   • > 5min     : fresh fetch (cache evicted)
 *
 * ── Rate limiting ─────────────────────────────────────────
 * 100ms minimum gap between Supabase round-trips. Newer queued calls
 * supersede older ones (intermediate calls discarded).
 *
 * ── Required SQL (run once in Supabase SQL editor) ────────
 *   ALTER TABLE recipes            ADD COLUMN IF NOT EXISTS search_vector tsvector;
 *   ALTER TABLE competitions       ADD COLUMN IF NOT EXISTS search_vector tsvector;
 *   ALTER TABLE articles           ADD COLUMN IF NOT EXISTS search_vector tsvector;
 *   ALTER TABLE profiles           ADD COLUMN IF NOT EXISTS search_vector tsvector;
 *   ALTER TABLE exhibitions        ADD COLUMN IF NOT EXISTS search_vector tsvector;
 *   ALTER TABLE culinary_entities  ADD COLUMN IF NOT EXISTS search_vector tsvector;
 *
 *   -- Backfill (example for recipes):
 *   UPDATE recipes SET search_vector = to_tsvector('simple',
 *     coalesce(title,'') || ' ' || coalesce(description,'') || ' ' || coalesce(category,''));
 *
 *   -- GIN indexes:
 *   CREATE INDEX IF NOT EXISTS idx_recipes_search           ON recipes           USING gin(search_vector);
 *   CREATE INDEX IF NOT EXISTS idx_competitions_search      ON competitions      USING gin(search_vector);
 *   CREATE INDEX IF NOT EXISTS idx_articles_search          ON articles          USING gin(search_vector);
 *   CREATE INDEX IF NOT EXISTS idx_profiles_search          ON profiles          USING gin(search_vector);
 *   CREATE INDEX IF NOT EXISTS idx_exhibitions_search       ON exhibitions       USING gin(search_vector);
 *   CREATE INDEX IF NOT EXISTS idx_culinary_entities_search ON culinary_entities USING gin(search_vector);
 *
 *   -- Plus an `auto-update` trigger per table to keep search_vector in sync.
 *
 *   -- Optional analytics table for trending tags:
 *   CREATE TABLE IF NOT EXISTS search_logs (
 *     id uuid primary key default gen_random_uuid(),
 *     query text not null, result_count int not null default 0,
 *     search_type text not null default 'global', user_id uuid,
 *     created_at timestamptz not null default now()
 *   );
 */
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import type {
  SearchFilters,
  SearchResults,
  CompetitionResult,
  ArticleResult,
  MemberResult,
  PostResult,
  EntityResult,
  RecipeResult,
  ExhibitionResult,
} from "@/hooks/useGlobalSearch";

// ── Cache (SWR) ──────────────────────────────────────────
const FRESH_TTL_MS = 60_000;
const STALE_TTL_MS = 5 * 60_000;
const MAX_CACHE = 50;

interface CacheEntry {
  results: SearchResults;
  timestamp: number;
  revalidating?: boolean;
}

const cache = new Map<string, CacheEntry>();
const inflight = new Map<string, Promise<SearchResults>>();

function cacheKey(filters: SearchFilters): string {
  return JSON.stringify({
    q: filters.query.trim().toLowerCase(),
    t: filters.type,
    cs: filters.competitionStatus,
    iv: filters.isVirtual,
    at: filters.articleType,
    as: filters.articleStatus,
    mr: filters.memberRole,
    el: filters.experienceLevel,
    co: filters.country,
    ct: filters.cuisineType,
  });
}

function setCache(key: string, results: SearchResults) {
  if (cache.size >= MAX_CACHE) {
    const oldest = cache.keys().next().value;
    if (oldest) cache.delete(oldest);
  }
  cache.set(key, { results, timestamp: Date.now() });
}

export function clearSearchCache() {
  cache.clear();
  inflight.clear();
}

// ── Rate limiter (100ms min gap between fetches) ─────────
const MIN_INTERVAL_MS = 100;
let lastFetchAt = 0;
let pendingTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleFetch<T>(fn: () => Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const wait = Math.max(0, MIN_INTERVAL_MS - (Date.now() - lastFetchAt));
    if (pendingTimer) clearTimeout(pendingTimer);
    pendingTimer = setTimeout(() => {
      lastFetchAt = Date.now();
      pendingTimer = null;
      fn().then(resolve, reject);
    }, wait);
  });
}

// ── FTS capability tracking (per table) ──────────────────
// Once a table fails Strategy A we permanently fall back to ILIKE for the
// rest of the session to avoid wasted round-trips.
type FtsTable = "recipes" | "competitions" | "articles" | "profiles" | "exhibitions" | "culinary_entities";
const ftsCapability = new Map<FtsTable, boolean>();

function ftsAvailable(table: FtsTable): boolean {
  return ftsCapability.get(table) !== false; // unknown = try
}
function markFtsFailed(table: FtsTable, err?: unknown) {
  if (ftsCapability.get(table) !== false) {
    ftsCapability.set(table, false);
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.info(`[search] FTS unavailable for ${table}, falling back to ILIKE`, err);
    }
  }
}

// ── Search helpers ───────────────────────────────────────
function getSearchWords(query: string): string[] {
  return query.trim().split(/\s+/).filter((w) => w.length >= 2);
}

function buildFlexibleFilter(words: string[], columns: string[]): string {
  const parts: string[] = [];
  for (const word of words) {
    const escaped = word.replace(/[%_]/g, "\\$&");
    for (const col of columns) parts.push(`${col}.ilike.%${escaped}%`);
  }
  return parts.join(",");
}

/** Build a websearch FTS query: each whitespace-separated word becomes ANDed. */
function buildFtsQuery(words: string[]): string {
  // websearch syntax handles unquoted words as AND. Strip control chars.
  return words.map((w) => w.replace(/["()\\]/g, " ").trim()).filter(Boolean).join(" ");
}

function countMatchingWords(words: string[], ...fields: (string | null | undefined)[]): number {
  if (words.length === 0) return 0;
  const combined = fields.filter(Boolean).join(" ").toLowerCase();
  return words.filter((w) => combined.includes(w.toLowerCase())).length;
}

function sortByRelevance<T extends { _relevance?: number }>(items: T[]): T[] {
  return items.sort((a, b) => (b._relevance || 0) - (a._relevance || 0));
}

/**
 * Generic FTS-with-ILIKE-fallback runner.
 * Builds a base PostgREST query, tries `.textSearch('search_vector', ...)` first,
 * and on error/empty-config falls back to OR-of-ILIKE on the provided columns.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Builder = any;
async function runWithFtsFallback(
  table: FtsTable,
  baseBuilder: Builder,
  words: string[],
  ilikeColumns: string[],
): Promise<{ data: Record<string, unknown>[] | null; error: unknown }> {
  if (ftsAvailable(table)) {
    try {
      const ftsQuery = buildFtsQuery(words);
      const res = await baseBuilder.textSearch("search_vector", ftsQuery, {
        type: "websearch",
        config: "simple",
      });
      if (res.error) {
        markFtsFailed(table, res.error);
      } else {
        return { data: res.data, error: null };
      }
    } catch (err) {
      markFtsFailed(table, err);
    }
  }
  // Fallback — caller passed a fresh builder factory? No, we re-issue from same supabase client below.
  // Since PostgREST builders are not reusable after a failed call, we re-build via the columns we know.
  // The fallback path is wired at the call site (each table has its own builder factory).
  return { data: null, error: new Error("FTS_FALLBACK_REQUIRED") };
}

// ── Core fetch (parallel queries, specific columns only) ─
type CompetitionStatus = Database["public"]["Enums"]["competition_status"];

async function fetchAll(filters: SearchFilters, signal?: AbortSignal): Promise<SearchResults> {
  const words = getSearchWords(filters.query);
  const empty: SearchResults = {
    competitions: [], articles: [], members: [], posts: [],
    entities: [], recipes: [], exhibitions: [],
  };
  if (words.length === 0 || signal?.aborted) return empty;

  const ftsQ = buildFtsQuery(words);

  const [
    competitionsRes, articlesRes, membersRes, postsRes,
    entitiesRes, recipesRes, exhibitionsRes,
  ] = await Promise.all([
    // ── Competitions ──
    (async () => {
      if (filters.type !== "all" && filters.type !== "competitions") return [];
      const baseCols = "id, title, title_ar, description, description_ar, cover_image_url, status, competition_start, competition_end, venue, venue_ar, city, country, is_virtual";
      const ilikeCols = ["title", "title_ar", "description", "description_ar", "city", "venue", "venue_ar", "country"];
      const applyFilters = (q: Builder) => {
        let qq = q.neq("status", "draft");
        if (filters.competitionStatus && filters.competitionStatus !== "all")
          qq = qq.eq("status", filters.competitionStatus);
        if (filters.isVirtual !== null && filters.isVirtual !== undefined)
          qq = qq.eq("is_virtual", filters.isVirtual);
        return qq;
      };
      let data: Record<string, unknown>[] | null = null;
      if (ftsAvailable("competitions")) {
        const r = await applyFilters(
          (supabase.from("competitions").select(baseCols) as Builder)
            .textSearch("search_vector", ftsQ, { type: "websearch", config: "simple" })
        ).order("competition_start", { ascending: false }).limit(30);
        if (r.error) markFtsFailed("competitions", r.error);
        else data = r.data;
      }
      if (data === null) {
        const r = await applyFilters(
          supabase.from("competitions").select(baseCols)
            .or(buildFlexibleFilter(words, ilikeCols))
        ).order("competition_start", { ascending: false }).limit(30);
        data = r.data;
      }
      return sortByRelevance((data || []).map((r: Record<string, unknown>) => ({
        ...r,
        _relevance: countMatchingWords(words, r.title as string, r.title_ar as string, r.description as string, r.description_ar as string, r.city as string, r.venue as string, r.venue_ar as string, r.country as string),
      }))) as CompetitionResult[];
    })(),

    // ── Articles ──
    (async () => {
      if (filters.type !== "all" && filters.type !== "articles") return [];
      const baseCols = "id, title, title_ar, excerpt, excerpt_ar, featured_image_url, type, status, published_at, slug, view_count";
      const ilikeCols = ["title", "title_ar", "excerpt", "excerpt_ar", "content", "content_ar"];
      const applyFilters = (q: Builder) => {
        let qq = q;
        if (filters.articleType && filters.articleType !== "all") qq = qq.eq("type", filters.articleType);
        if (filters.articleStatus && filters.articleStatus !== "all") qq = qq.eq("status", filters.articleStatus);
        else qq = qq.eq("status", "published");
        return qq;
      };
      let data: Record<string, unknown>[] | null = null;
      if (ftsAvailable("articles")) {
        const r = await applyFilters(
          (supabase.from("articles").select(baseCols) as Builder)
            .textSearch("search_vector", ftsQ, { type: "websearch", config: "simple" })
        ).order("published_at", { ascending: false }).limit(30);
        if (r.error) markFtsFailed("articles", r.error);
        else data = r.data;
      }
      if (data === null) {
        const r = await applyFilters(
          supabase.from("articles").select(baseCols)
            .or(buildFlexibleFilter(words, ilikeCols))
        ).order("published_at", { ascending: false }).limit(30);
        data = r.data;
      }
      return sortByRelevance((data || []).map((r: Record<string, unknown>) => ({
        ...r,
        _relevance: countMatchingWords(words, r.title as string, r.title_ar as string, r.excerpt as string, r.excerpt_ar as string),
      }))) as ArticleResult[];
    })(),

    // ── Members ──
    (async () => {
      if (filters.type !== "all" && filters.type !== "members") return [];
      const baseCols = "id, user_id, full_name, full_name_ar, display_name, display_name_ar, username, avatar_url, bio, bio_ar, specialization, specialization_ar, experience_level, location, is_verified";
      const ilikeCols = ["full_name", "full_name_ar", "display_name", "display_name_ar", "username", "bio", "bio_ar", "specialization", "specialization_ar", "location"];
      const applyFilters = (q: Builder) => {
        let qq = q.eq("account_status", "active");
        if (filters.experienceLevel && filters.experienceLevel !== "all")
          qq = qq.eq("experience_level", filters.experienceLevel);
        return qq;
      };
      let data: Record<string, unknown>[] | null = null;
      if (ftsAvailable("profiles")) {
        const r = await applyFilters(
          (supabase.from("profiles").select(baseCols) as Builder)
            .textSearch("search_vector", ftsQ, { type: "websearch", config: "simple" })
        ).limit(30);
        if (r.error) markFtsFailed("profiles", r.error);
        else data = r.data;
      }
      if (data === null) {
        const r = await applyFilters(
          supabase.from("profiles").select(baseCols)
            .or(buildFlexibleFilter(words, ilikeCols))
        ).limit(30);
        data = r.data;
      }
      let scored = (data || []).map((r: Record<string, unknown>) => ({
        ...r,
        _relevance: countMatchingWords(words, r.full_name as string, r.full_name_ar as string, r.display_name as string, r.display_name_ar as string, r.username as string, r.bio as string, r.bio_ar as string, r.specialization as string, r.specialization_ar as string, r.location as string),
      })) as Array<Record<string, unknown> & { _relevance: number }>;
      if (filters.memberRole && filters.memberRole !== "all" && scored.length > 0) {
        const userIds = scored.map((m) => m.user_id as string);
        const { data: rolesData } = await supabase
          .from("user_roles")
          .select("user_id")
          .eq("role", filters.memberRole as Database["public"]["Enums"]["app_role"])
          .in("user_id", userIds);
        const filteredIds = new Set(rolesData?.map((r) => r.user_id) || []);
        scored = scored.filter((m) => filteredIds.has(m.user_id as string));
      }
      return sortByRelevance(scored) as unknown as MemberResult[];
    })(),

    // ── Posts (no search_vector column — keep ILIKE) ──
    (async () => {
      if (filters.type !== "all" && filters.type !== "posts") return [];
      const orParts = words.map((w) => `content.ilike.%${w.replace(/[%_]/g, "\\$&")}%`);
      const { data: posts } = await supabase
        .from("posts")
        .select("id, content, image_url, video_url, created_at, author_id")
        .eq("moderation_status", "approved")
        .or(orParts.join(","))
        .order("created_at", { ascending: false })
        .limit(30);
      if (!posts?.length) return [];
      const scored = posts.map((p) => ({
        ...p,
        _relevance: countMatchingWords(words, p.content),
      }));
      const authorIds = [...new Set(scored.map((p) => p.author_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, username, avatar_url")
        .in("user_id", authorIds);
      const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);
      return sortByRelevance(scored.map((p) => {
        const profile = profileMap.get(p.author_id);
        return {
          id: p.id, content: p.content, image_url: p.image_url,
          video_url: p.video_url || null, created_at: p.created_at,
          author_id: p.author_id,
          author_name: profile?.full_name || null,
          author_username: profile?.username || null,
          author_avatar: profile?.avatar_url || null,
          _relevance: p._relevance,
        };
      })) as PostResult[];
    })(),

    // ── Entities (culinary_entities + establishments + companies) ──
    (async () => {
      if (filters.type !== "all" && filters.type !== "entities") return [];
      const entityCols = ["name", "name_ar", "description", "description_ar", "city", "country"];
      const estabCols = ["name", "name_ar", "description", "description_ar", "city", "cuisine_type", "cuisine_type_ar"];
      const companyCols = ["name", "name_ar", "description", "description_ar", "city", "country"];
      const culinaryBase = "id, name, name_ar, type, description, description_ar, logo_url, city, country, is_verified";

      // culinary_entities supports FTS
      const culinaryPromise: Promise<{ data: Record<string, unknown>[] | null }> = (async () => {
        if (ftsAvailable("culinary_entities")) {
          const r = await (supabase.from("culinary_entities").select(culinaryBase) as Builder)
            .eq("is_visible", true)
            .textSearch("search_vector", ftsQ, { type: "websearch", config: "simple" })
            .limit(15);
          if (!r.error) return { data: r.data };
          markFtsFailed("culinary_entities", r.error);
        }
        const r = await supabase.from("culinary_entities").select(culinaryBase)
          .eq("is_visible", true)
          .or(buildFlexibleFilter(words, entityCols))
          .limit(15);
        return { data: r.data };
      })();

      const [entRes, estRes, compRes] = await Promise.all([
        culinaryPromise,
        supabase.from("establishments").select("id, name, name_ar, type, description, description_ar, logo_url, city, city_ar, is_verified").eq("is_active", true).or(buildFlexibleFilter(words, estabCols)).limit(15),
        supabase.from("companies").select("id, name, name_ar, type, description, description_ar, logo_url, city, country").eq("status", "active").or(buildFlexibleFilter(words, companyCols)).limit(15),
      ]);
      const entities: EntityResult[] = ((entRes.data || []) as Record<string, unknown>[]).map((e) => ({
        id: e.id as string, name: e.name as string, name_ar: e.name_ar as string, type: e.type as string, description: e.description as string, description_ar: e.description_ar as string, logo_url: e.logo_url as string, city: e.city as string, country: e.country as string, is_verified: e.is_verified as boolean, source: "entity" as const,
        _relevance: countMatchingWords(words, e.name as string, e.name_ar as string, e.description as string, e.description_ar as string, e.city as string, e.country as string),
      }));
      const establishments: EntityResult[] = (estRes.data || []).map((e) => ({
        id: e.id, name: e.name, name_ar: e.name_ar, type: e.type, description: e.description, description_ar: e.description_ar, logo_url: e.logo_url, city: e.city, country: null, is_verified: e.is_verified, source: "establishment" as const,
        _relevance: countMatchingWords(words, e.name, e.name_ar, e.description, e.description_ar, e.city),
      }));
      const companies: EntityResult[] = (compRes.data || []).map((e) => ({
        id: e.id, name: e.name, name_ar: e.name_ar, type: e.type, description: e.description, description_ar: e.description_ar, logo_url: e.logo_url, city: e.city, country: e.country, is_verified: true, source: "entity" as const,
        _relevance: countMatchingWords(words, e.name, e.name_ar, e.description, e.description_ar, e.city, e.country),
      }));
      return sortByRelevance([...entities, ...establishments, ...companies]);
    })(),

    // ── Recipes ──
    (async () => {
      if (filters.type !== "all" && filters.type !== "recipes") return [];
      const baseCols = "id, title, title_ar, description, description_ar, image_url, prep_time, cook_time, average_rating, slug";
      const ilikeCols = ["title", "title_ar", "description", "description_ar"];
      let data: Record<string, unknown>[] | null = null;
      if (ftsAvailable("recipes")) {
        const r = await ((supabase.from("recipes").select(baseCols) as Builder)
          .eq("status", "published")
          .textSearch("search_vector", ftsQ, { type: "websearch", config: "simple" })
          .order("created_at", { ascending: false })
          .limit(30));
        if (r.error) markFtsFailed("recipes", r.error);
        else data = r.data;
      }
      if (data === null) {
        const r = await ((supabase.from("recipes").select(baseCols) as Builder)
          .eq("status", "published")
          .or(buildFlexibleFilter(words, ilikeCols))
          .order("created_at", { ascending: false })
          .limit(30));
        data = r.data;
      }
      return sortByRelevance((data || []).map((r: Record<string, unknown>) => ({
        ...r,
        _relevance: countMatchingWords(words, r.title as string, r.title_ar as string, r.description as string, r.description_ar as string),
      }))) as unknown as RecipeResult[];
    })(),

    // ── Exhibitions ──
    (async () => {
      if (filters.type !== "all" && filters.type !== "exhibitions") return [];
      const baseCols = "id, title, title_ar, description, description_ar, cover_image_url, slug, start_date, end_date, venue, venue_ar, city, country, status";
      const ilikeCols = ["title", "title_ar", "description", "description_ar", "venue", "venue_ar", "city", "country"];
      let data: Record<string, unknown>[] | null = null;
      if (ftsAvailable("exhibitions")) {
        const r = await (supabase.from("exhibitions").select(baseCols) as Builder)
          .textSearch("search_vector", ftsQ, { type: "websearch", config: "simple" })
          .order("start_date", { ascending: false })
          .limit(20);
        if (r.error) markFtsFailed("exhibitions", r.error);
        else data = r.data;
      }
      if (data === null) {
        const r = await supabase.from("exhibitions").select(baseCols)
          .or(buildFlexibleFilter(words, ilikeCols))
          .order("start_date", { ascending: false })
          .limit(20);
        data = r.data;
      }
      return sortByRelevance((data || []).map((r: Record<string, unknown>) => ({
        ...r,
        _relevance: countMatchingWords(words, r.title as string, r.title_ar as string, r.description as string, r.description_ar as string, r.venue as string, r.city as string, r.country as string),
      }))) as ExhibitionResult[];
    })(),
  ]);

  if (signal?.aborted) return empty;

  return {
    competitions: competitionsRes,
    articles: articlesRes,
    members: membersRes,
    posts: postsRes,
    entities: entitiesRes,
    recipes: recipesRes,
    exhibitions: exhibitionsRes,
  };
}

// ── Public API: SWR-aware searchAll ──────────────────────
export async function searchAll(
  filters: SearchFilters,
  signal?: AbortSignal
): Promise<SearchResults> {
  const empty: SearchResults = {
    competitions: [], articles: [], members: [], posts: [],
    entities: [], recipes: [], exhibitions: [],
  };
  if (getSearchWords(filters.query).length === 0) return empty;

  const key = cacheKey(filters);
  const entry = cache.get(key);
  const now = Date.now();

  if (entry && now - entry.timestamp < FRESH_TTL_MS) return entry.results;

  if (entry && now - entry.timestamp < STALE_TTL_MS) {
    if (!entry.revalidating) {
      entry.revalidating = true;
      scheduleFetch(() => fetchAll(filters))
        .then((fresh) => {
          setCache(key, fresh);
          logSearch(filters.query, totalCount(fresh), filters.type);
        })
        .catch(() => { /* swallow background errors */ })
        .finally(() => { entry.revalidating = false; });
    }
    return entry.results;
  }

  const existing = inflight.get(key);
  if (existing) return existing;

  const promise = scheduleFetch(() => fetchAll(filters, signal))
    .then((fresh) => {
      if (!signal?.aborted) {
        setCache(key, fresh);
        logSearch(filters.query, totalCount(fresh), filters.type);
      }
      return fresh;
    })
    .finally(() => { inflight.delete(key); });

  inflight.set(key, promise);
  return promise;
}

function totalCount(r: SearchResults): number {
  return r.competitions.length + r.articles.length + r.members.length +
    r.posts.length + r.entities.length + r.recipes.length + r.exhibitions.length;
}

// ── Search analytics: log queries (fire-and-forget) ──────
const recentlyLogged = new Map<string, number>(); // dedupe within 30s
const LOG_DEDUPE_MS = 30_000;

function logSearch(query: string, resultCount: number, searchType: string) {
  const q = query.trim();
  if (q.length < 2) return;
  const key = `${q.toLowerCase()}|${searchType}`;
  const now = Date.now();
  const last = recentlyLogged.get(key);
  if (last && now - last < LOG_DEDUPE_MS) return;
  recentlyLogged.set(key, now);
  // Best-effort cleanup
  if (recentlyLogged.size > 200) {
    for (const [k, ts] of recentlyLogged) {
      if (now - ts > LOG_DEDUPE_MS) recentlyLogged.delete(k);
    }
  }

  // Fire and forget — never await, never throw
  void (async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from("search_logs" as any) as any).insert({
        query: q,
        result_count: resultCount,
        search_type: searchType || "global",
        user_id: user?.id ?? null,
      });
    } catch {
      // table may not exist or RLS may reject — ignore silently
    }
  })();
}

// ── Trending tags (last 7 days, hybrid: logs + hardcoded) ─
const HARDCODED_TRENDING = ["دجاج", "باستا", "حلويات", "شوربة", "سلطات", "مشاوي", "بيتزا"];
let trendingCache: { tags: string[]; timestamp: number } | null = null;
const TRENDING_TTL_MS = 10 * 60_000;
let trendingDisabled = false;

export async function fetchTrendingTags(limit = 7): Promise<string[]> {
  if (trendingCache && Date.now() - trendingCache.timestamp < TRENDING_TTL_MS) {
    return trendingCache.tags;
  }
  if (trendingDisabled) return HARDCODED_TRENDING.slice(0, limit);

  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from("search_logs" as any) as any)
      .select("query")
      .gte("created_at", sevenDaysAgo)
      .gt("result_count", 0)
      .limit(500);
    if (error || !data) {
      trendingDisabled = true; // table missing or RLS blocks reads → never retry this session
      return HARDCODED_TRENDING.slice(0, limit);
    }
    // Count frequencies
    const counts = new Map<string, number>();
    for (const row of data as { query: string }[]) {
      const q = row.query?.trim().toLowerCase();
      if (!q || q.length < 2) continue;
      counts.set(q, (counts.get(q) || 0) + 1);
    }
    const sorted = [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([q]) => q);
    const dynamic = sorted.slice(0, limit);
    // Hybrid: pad with hardcoded if not enough real data
    const merged: string[] = [...dynamic];
    for (const t of HARDCODED_TRENDING) {
      if (merged.length >= limit) break;
      if (!merged.includes(t)) merged.push(t);
    }
    trendingCache = { tags: merged, timestamp: Date.now() };
    return merged;
  } catch {
    trendingDisabled = true;
    return HARDCODED_TRENDING.slice(0, limit);
  }
}

// ── Popular preload (focus-fetch, no query) ──────────────
let popularCache: { results: SearchResults; timestamp: number } | null = null;
const POPULAR_TTL_MS = 5 * 60_000;

export async function fetchPopularPreload(signal?: AbortSignal): Promise<SearchResults> {
  const empty: SearchResults = {
    competitions: [], articles: [], members: [], posts: [],
    entities: [], recipes: [], exhibitions: [],
  };
  if (popularCache && Date.now() - popularCache.timestamp < POPULAR_TTL_MS) {
    return popularCache.results;
  }
  if (signal?.aborted) return empty;

  const [recipesRes, competitionsRes, membersRes] = await Promise.all([
    (supabase
      .from("recipes")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .select("id, title, title_ar, description, description_ar, image_url, prep_time, cook_time, average_rating, slug") as any)
      .eq("status", "published")
      .order("average_rating", { ascending: false, nullsFirst: false })
      .limit(4),
    supabase
      .from("competitions")
      .select("id, title, title_ar, description, description_ar, cover_image_url, status, competition_start, competition_end, venue, venue_ar, city, country, is_virtual")
      .in("status", ["registration_open", "upcoming"] as CompetitionStatus[])
      .order("competition_start", { ascending: true })
      .limit(2),
    supabase
      .from("profiles")
      .select("id, user_id, full_name, full_name_ar, display_name, display_name_ar, username, avatar_url, bio, bio_ar, specialization, specialization_ar, experience_level, location, is_verified")
      .eq("account_status", "active")
      .eq("is_verified", true)
      .limit(2),
  ]);

  if (signal?.aborted) return empty;

  const results: SearchResults = {
    ...empty,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recipes: ((recipesRes as any).data || []) as RecipeResult[],
    competitions: (competitionsRes.data || []) as CompetitionResult[],
    members: (membersRes.data || []) as MemberResult[],
  };
  popularCache = { results, timestamp: Date.now() };
  return results;
}
