/**
 * Search Service — Stale-while-revalidate cache + parallel Supabase queries.
 *
 * Cache strategy:
 *   • age <  60s  → return cached, NO network
 *   • 60s–5min   → return stale immediately, refresh in background (SWR)
 *   • > 5min     → fresh fetch (cache evicted)
 *
 * Rate limiting: 100ms minimum gap between Supabase round-trips. Newer calls
 * supersede older queued calls (intermediate calls discarded).
 *
 * Recommended Postgres indexes for trigram-accelerated ILIKE:
 *   CREATE EXTENSION IF NOT EXISTS pg_trgm;
 *   CREATE INDEX CONCURRENTLY idx_recipes_title_trgm        ON recipes        USING gin(title        gin_trgm_ops);
 *   CREATE INDEX CONCURRENTLY idx_recipes_title_ar_trgm     ON recipes        USING gin(title_ar     gin_trgm_ops);
 *   CREATE INDEX CONCURRENTLY idx_competitions_title_trgm   ON competitions   USING gin(title        gin_trgm_ops);
 *   CREATE INDEX CONCURRENTLY idx_articles_title_trgm       ON articles       USING gin(title        gin_trgm_ops);
 *   CREATE INDEX CONCURRENTLY idx_profiles_full_name_trgm   ON profiles       USING gin(full_name    gin_trgm_ops);
 *   CREATE INDEX CONCURRENTLY idx_profiles_username_trgm    ON profiles       USING gin(username     gin_trgm_ops);
 *   CREATE INDEX CONCURRENTLY idx_exhibitions_title_trgm    ON exhibitions    USING gin(title        gin_trgm_ops);
 *   CREATE INDEX CONCURRENTLY idx_culinary_entities_name_trgm ON culinary_entities USING gin(name gin_trgm_ops);
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
const FRESH_TTL_MS = 60_000;       // < 60s   : serve cache, no network
const STALE_TTL_MS = 5 * 60_000;   // < 5min  : serve cache + revalidate in background
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

function countMatchingWords(words: string[], ...fields: (string | null | undefined)[]): number {
  if (words.length === 0) return 0;
  const combined = fields.filter(Boolean).join(" ").toLowerCase();
  return words.filter((w) => combined.includes(w.toLowerCase())).length;
}

function sortByRelevance<T extends { _relevance?: number }>(items: T[]): T[] {
  return items.sort((a, b) => (b._relevance || 0) - (a._relevance || 0));
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

  const [
    competitionsRes, articlesRes, membersRes, postsRes,
    entitiesRes, recipesRes, exhibitionsRes,
  ] = await Promise.all([
    // ── Competitions ──
    (async () => {
      if (filters.type !== "all" && filters.type !== "competitions") return [];
      let q = supabase
        .from("competitions")
        .select("id, title, title_ar, description, description_ar, cover_image_url, status, competition_start, competition_end, venue, venue_ar, city, country, is_virtual")
        .neq("status", "draft")
        .or(buildFlexibleFilter(words, ["title", "title_ar", "description", "description_ar", "city", "venue", "venue_ar", "country"]));
      if (filters.competitionStatus && filters.competitionStatus !== "all")
        q = q.eq("status", filters.competitionStatus);
      if (filters.isVirtual !== null && filters.isVirtual !== undefined)
        q = q.eq("is_virtual", filters.isVirtual);
      const { data } = await q.order("competition_start", { ascending: false }).limit(30);
      return sortByRelevance((data || []).map((r) => ({
        ...r,
        _relevance: countMatchingWords(words, r.title, r.title_ar, r.description, r.description_ar, r.city, r.venue, r.venue_ar, r.country),
      }))) as CompetitionResult[];
    })(),

    // ── Articles ──
    (async () => {
      if (filters.type !== "all" && filters.type !== "articles") return [];
      let q = supabase
        .from("articles")
        .select("id, title, title_ar, excerpt, excerpt_ar, featured_image_url, type, status, published_at, slug, view_count")
        .or(buildFlexibleFilter(words, ["title", "title_ar", "excerpt", "excerpt_ar", "content", "content_ar"]));
      if (filters.articleType && filters.articleType !== "all") q = q.eq("type", filters.articleType);
      if (filters.articleStatus && filters.articleStatus !== "all") q = q.eq("status", filters.articleStatus);
      else q = q.eq("status", "published");
      const { data } = await q.order("published_at", { ascending: false }).limit(30);
      return sortByRelevance((data || []).map((r) => ({
        ...r,
        _relevance: countMatchingWords(words, r.title, r.title_ar, r.excerpt, r.excerpt_ar),
      }))) as ArticleResult[];
    })(),

    // ── Members ──
    (async () => {
      if (filters.type !== "all" && filters.type !== "members") return [];
      const cols = ["full_name", "full_name_ar", "display_name", "display_name_ar", "username", "bio", "bio_ar", "specialization", "specialization_ar", "location"];
      let q = supabase
        .from("profiles")
        .select("id, user_id, full_name, full_name_ar, display_name, display_name_ar, username, avatar_url, bio, bio_ar, specialization, specialization_ar, experience_level, location, is_verified")
        .eq("account_status", "active")
        .or(buildFlexibleFilter(words, cols));
      if (filters.experienceLevel && filters.experienceLevel !== "all")
        q = q.eq("experience_level", filters.experienceLevel);
      const { data } = await q.limit(30);
      let scored = (data || []).map((r) => ({
        ...r,
        _relevance: countMatchingWords(words, r.full_name, r.full_name_ar, r.display_name, r.display_name_ar, r.username, r.bio, r.bio_ar, r.specialization, r.specialization_ar, r.location),
      }));
      if (filters.memberRole && filters.memberRole !== "all" && scored.length > 0) {
        const userIds = scored.map((m) => m.user_id);
        const { data: rolesData } = await supabase
          .from("user_roles")
          .select("user_id")
          .eq("role", filters.memberRole as Database["public"]["Enums"]["app_role"])
          .in("user_id", userIds);
        const filteredIds = new Set(rolesData?.map((r) => r.user_id) || []);
        scored = scored.filter((m) => filteredIds.has(m.user_id));
      }
      return sortByRelevance(scored) as MemberResult[];
    })(),

    // ── Posts ──
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
      const [entRes, estRes, compRes] = await Promise.all([
        supabase.from("culinary_entities").select("id, name, name_ar, type, description, description_ar, logo_url, city, country, is_verified").eq("is_visible", true).or(buildFlexibleFilter(words, entityCols)).limit(15),
        supabase.from("establishments").select("id, name, name_ar, type, description, description_ar, logo_url, city, city_ar, is_verified").eq("is_active", true).or(buildFlexibleFilter(words, estabCols)).limit(15),
        supabase.from("companies").select("id, name, name_ar, type, description, description_ar, logo_url, city, country").eq("status", "active").or(buildFlexibleFilter(words, companyCols)).limit(15),
      ]);
      const entities: EntityResult[] = (entRes.data || []).map((e) => ({
        id: e.id, name: e.name, name_ar: e.name_ar, type: e.type, description: e.description, description_ar: e.description_ar, logo_url: e.logo_url, city: e.city, country: e.country, is_verified: e.is_verified, source: "entity" as const,
        _relevance: countMatchingWords(words, e.name, e.name_ar, e.description, e.description_ar, e.city, e.country),
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
      const cols = ["title", "title_ar", "description", "description_ar"];
      const { data } = await (supabase
        .from("recipes")
        .select("id, title, title_ar, description, description_ar, image_url, prep_time, cook_time, average_rating, slug") as any)
        .eq("status", "published")
        .or(buildFlexibleFilter(words, cols))
        .order("created_at", { ascending: false })
        .limit(30);
      return sortByRelevance((data || []).map((r: any) => ({
        ...r,
        _relevance: countMatchingWords(words, r.title, r.title_ar, r.description, r.description_ar),
      }))) as RecipeResult[];
    })(),

    // ── Exhibitions ──
    (async () => {
      if (filters.type !== "all" && filters.type !== "exhibitions") return [];
      const cols = ["title", "title_ar", "description", "description_ar", "venue", "venue_ar", "city", "country"];
      const { data } = await supabase
        .from("exhibitions")
        .select("id, title, title_ar, description, description_ar, cover_image_url, slug, start_date, end_date, venue, venue_ar, city, country, status")
        .or(buildFlexibleFilter(words, cols))
        .order("start_date", { ascending: false })
        .limit(20);
      return sortByRelevance((data || []).map((r) => ({
        ...r,
        _relevance: countMatchingWords(words, r.title, r.title_ar, r.description, r.description_ar, r.venue, r.city, r.country),
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

  // Fresh: serve cache, no network
  if (entry && now - entry.timestamp < FRESH_TTL_MS) {
    return entry.results;
  }

  // Stale (60s–5min): serve cache + revalidate in background (SWR)
  if (entry && now - entry.timestamp < STALE_TTL_MS) {
    if (!entry.revalidating) {
      entry.revalidating = true;
      // Fire-and-forget — cannot use the caller's signal (background)
      scheduleFetch(() => fetchAll(filters))
        .then((fresh) => setCache(key, fresh))
        .catch(() => { /* swallow background errors */ })
        .finally(() => { entry.revalidating = false; });
    }
    return entry.results;
  }

  // Expired or missing: dedupe in-flight, then fresh fetch through rate limiter
  const existing = inflight.get(key);
  if (existing) return existing;

  const promise = scheduleFetch(() => fetchAll(filters, signal))
    .then((fresh) => {
      if (!signal?.aborted) setCache(key, fresh);
      return fresh;
    })
    .finally(() => { inflight.delete(key); });

  inflight.set(key, promise);
  return promise;
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
    supabase
      .from("recipes")
      .select("id, title, title_ar, description, description_ar, image_url, prep_time, cook_time, average_rating, slug")
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
    recipes: (recipesRes.data || []) as RecipeResult[],
    competitions: (competitionsRes.data || []) as CompetitionResult[],
    members: (membersRes.data || []) as MemberResult[],
  };
  popularCache = { results, timestamp: Date.now() };
  return results;
}
