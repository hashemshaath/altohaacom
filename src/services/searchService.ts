/**
 * Search Service — In-memory cached, parallel Supabase queries.
 * Replaces per-category useQuery hooks with a single Promise.all call.
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

// ── Cache ────────────────────────────────────────────────
const CACHE_TTL_MS = 60_000;

interface CacheEntry {
  results: SearchResults;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();

function cacheKey(filters: SearchFilters): string {
  return JSON.stringify({
    q: filters.query,
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

function getCached(key: string): SearchResults | null {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL_MS) return entry.results;
  if (entry) cache.delete(key);
  return null;
}

function setCache(key: string, results: SearchResults) {
  // Cap cache size at 50 entries
  if (cache.size >= 50) {
    const oldest = cache.keys().next().value;
    if (oldest) cache.delete(oldest);
  }
  cache.set(key, { results, timestamp: Date.now() });
}

export function clearSearchCache() {
  cache.clear();
}

// ── Search helpers ───────────────────────────────────────
function getSearchWords(query: string): string[] {
  return query.trim().split(/\s+/).filter((w) => w.length >= 2);
}

function buildFlexibleFilter(words: string[], columns: string[]): string {
  const parts: string[] = [];
  for (const word of words) {
    const escaped = word.replace(/[%_]/g, "\\$&");
    for (const col of columns) {
      parts.push(`${col}.ilike.%${escaped}%`);
    }
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

// ── Main search function ─────────────────────────────────
type CompetitionStatus = Database["public"]["Enums"]["competition_status"];

export async function searchAll(
  filters: SearchFilters,
  signal?: AbortSignal
): Promise<SearchResults> {
  const words = getSearchWords(filters.query);
  const empty: SearchResults = {
    competitions: [],
    articles: [],
    members: [],
    posts: [],
    entities: [],
    recipes: [],
    exhibitions: [],
  };

  if (words.length === 0) return empty;

  // Check cache
  const key = cacheKey(filters);
  const cached = getCached(key);
  if (cached) return cached;

  // Check abort before starting
  if (signal?.aborted) return empty;

  // Build all queries in parallel
  const [
    competitionsRes,
    articlesRes,
    membersRes,
    postsRes,
    entitiesRes,
    recipesRes,
    exhibitionsRes,
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
      return sortByRelevance(
        (data || []).map((r) => ({
          ...r,
          _relevance: countMatchingWords(words, r.title, r.title_ar, r.description, r.description_ar, r.city, r.venue, r.venue_ar, r.country),
        }))
      ) as CompetitionResult[];
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
      return sortByRelevance(
        (data || []).map((r) => ({
          ...r,
          _relevance: countMatchingWords(words, r.title, r.title_ar, r.excerpt, r.excerpt_ar),
        }))
      ) as ArticleResult[];
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
      return sortByRelevance(
        scored.map((p) => {
          const profile = profileMap.get(p.author_id);
          return {
            id: p.id,
            content: p.content,
            image_url: p.image_url,
            video_url: p.video_url || null,
            created_at: p.created_at,
            author_id: p.author_id,
            author_name: profile?.full_name || null,
            author_username: profile?.username || null,
            author_avatar: profile?.avatar_url || null,
            _relevance: p._relevance,
          };
        })
      ) as PostResult[];
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
      return sortByRelevance(
        (data || []).map((r: any) => ({
          ...r,
          _relevance: countMatchingWords(words, r.title, r.title_ar, r.description, r.description_ar),
        }))
      ) as RecipeResult[];
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
      return sortByRelevance(
        (data || []).map((r) => ({
          ...r,
          _relevance: countMatchingWords(words, r.title, r.title_ar, r.description, r.description_ar, r.venue, r.city, r.country),
        }))
      ) as ExhibitionResult[];
    })(),
  ]);

  // Check abort after fetch
  if (signal?.aborted) return empty;

  const results: SearchResults = {
    competitions: competitionsRes,
    articles: articlesRes,
    members: membersRes,
    posts: postsRes,
    entities: entitiesRes,
    recipes: recipesRes,
    exhibitions: exhibitionsRes,
  };

  setCache(key, results);
  return results;
}
