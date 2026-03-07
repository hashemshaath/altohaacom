import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type CompetitionStatus = Database["public"]["Enums"]["competition_status"];

export interface SearchFilters {
  query: string;
  type: "all" | "competitions" | "articles" | "members" | "posts" | "entities" | "recipes" | "exhibitions";
  competitionStatus?: CompetitionStatus | "all";
  isVirtual?: boolean | null;
  articleType?: "news" | "blog" | "exhibition" | "all";
  articleStatus?: "published" | "draft" | "all";
  memberRole?: string | "all";
  experienceLevel?: "beginner" | "amateur" | "professional" | "all";
  country?: string | "all";
  cuisineType?: string | "all";
}

export interface CompetitionResult {
  id: string;
  title: string;
  title_ar: string | null;
  description: string | null;
  description_ar: string | null;
  cover_image_url: string | null;
  status: CompetitionStatus;
  competition_start: string;
  competition_end: string;
  venue: string | null;
  venue_ar: string | null;
  city: string | null;
  country: string | null;
  is_virtual: boolean | null;
  _relevance?: number;
}

export interface ArticleResult {
  id: string;
  title: string;
  title_ar: string | null;
  excerpt: string | null;
  excerpt_ar: string | null;
  featured_image_url: string | null;
  type: string;
  status: string | null;
  published_at: string | null;
  slug: string;
  _relevance?: number;
}

export interface MemberResult {
  id: string;
  user_id: string;
  full_name: string | null;
  full_name_ar: string | null;
  display_name: string | null;
  display_name_ar: string | null;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  bio_ar: string | null;
  specialization: string | null;
  specialization_ar: string | null;
  experience_level: Database["public"]["Enums"]["experience_level"] | null;
  location: string | null;
  is_verified: boolean | null;
  _relevance?: number;
}

export interface PostResult {
  id: string;
  content: string;
  image_url: string | null;
  video_url: string | null;
  created_at: string;
  author_id: string;
  author_name: string | null;
  author_username: string | null;
  author_avatar: string | null;
  _relevance?: number;
}

export interface EntityResult {
  id: string;
  name: string;
  name_ar: string | null;
  type: string | null;
  description: string | null;
  description_ar: string | null;
  logo_url: string | null;
  city: string | null;
  country: string | null;
  is_verified: boolean | null;
  source: "entity" | "establishment";
  _relevance?: number;
}

export interface RecipeResult {
  id: string;
  title: string;
  title_ar: string | null;
  description: string | null;
  description_ar: string | null;
  image_url: string | null;
  prep_time: number | null;
  cook_time: number | null;
  average_rating: number | null;
  slug: string | null;
  _relevance?: number;
}

export interface ExhibitionResult {
  id: string;
  title: string;
  title_ar: string | null;
  description: string | null;
  description_ar: string | null;
  cover_image_url: string | null;
  slug: string;
  start_date: string | null;
  end_date: string | null;
  venue: string | null;
  venue_ar: string | null;
  city: string | null;
  country: string | null;
  status: string;
  _relevance?: number;
}

export interface SearchResults {
  competitions: CompetitionResult[];
  articles: ArticleResult[];
  members: MemberResult[];
  posts: PostResult[];
  entities: EntityResult[];
  recipes: RecipeResult[];
  exhibitions: ExhibitionResult[];
}

const DEFAULT_FILTERS: SearchFilters = {
  query: "",
  type: "all",
  competitionStatus: "all",
  isVirtual: null,
  articleType: "all",
  articleStatus: "published",
  memberRole: "all",
  experienceLevel: "all",
  country: "all",
  cuisineType: "all",
};

/** Split query into searchable words (>=2 chars) */
function getSearchWords(query: string): string[] {
  return query
    .trim()
    .split(/\s+/)
    .filter((w) => w.length >= 2);
}

/**
 * Build an OR filter for Supabase that matches ANY of the words in ANY column.
 * This gives broader results like Google Maps.
 */
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

/**
 * Count how many search words match in the given fields.
 * Returns a relevance score (0 to words.length).
 */
function countMatchingWords(words: string[], ...fields: (string | null | undefined)[]): number {
  if (words.length === 0) return 0;
  const combined = fields.filter(Boolean).join(" ").toLowerCase();
  return words.filter((w) => combined.includes(w.toLowerCase())).length;
}

/** Sort by relevance descending */
function sortByRelevance<T extends { _relevance?: number }>(items: T[]): T[] {
  return items.sort((a, b) => (b._relevance || 0) - (a._relevance || 0));
}

export function useGlobalSearch() {
  const [filters, setFilters] = useState<SearchFilters>(DEFAULT_FILTERS);
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // Debounce the query to avoid excessive DB calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(filters.query);
    }, 300);
    return () => clearTimeout(timer);
  }, [filters.query]);

  const updateFilter = useCallback(<K extends keyof SearchFilters>(
    key: K,
    value: SearchFilters[K]
  ) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  const searchWords = useMemo(() => getSearchWords(debouncedQuery), [debouncedQuery]);

  // Search competitions
  const { data: competitionsData, isLoading: competitionsLoading } = useQuery({
    queryKey: ["search-competitions", debouncedQuery, filters.competitionStatus, filters.isVirtual],
    queryFn: async () => {
      if (!debouncedQuery || searchWords.length === 0) return [];
      
      let query = supabase
        .from("competitions")
        .select("id, title, title_ar, description, description_ar, cover_image_url, status, competition_start, competition_end, venue, venue_ar, city, country, is_virtual")
        .neq("status", "draft");

      if (debouncedQuery && searchWords.length > 0) {
        const cols = ["title", "title_ar", "description", "description_ar", "city", "venue", "venue_ar", "country"];
        query = query.or(buildFlexibleFilter(searchWords, cols));
      }

      if (filters.competitionStatus && filters.competitionStatus !== "all") {
        query = query.eq("status", filters.competitionStatus);
      }
      if (filters.isVirtual !== null) {
        query = query.eq("is_virtual", filters.isVirtual);
      }

      const { data, error } = await query
        .order("competition_start", { ascending: false })
        .limit(30);

      if (error) throw error;
      if (!data) return [];

      return sortByRelevance(
        data.map((r) => ({
          ...r,
          _relevance: countMatchingWords(searchWords, r.title, r.title_ar, r.description, r.description_ar, r.city, r.venue, r.venue_ar, r.country),
        }))
      ) as CompetitionResult[];
    },
    enabled: !!debouncedQuery && searchWords.length > 0,
    staleTime: 1000 * 60 * 2,
  });

  // Search articles
  const { data: articlesData, isLoading: articlesLoading } = useQuery({
    queryKey: ["search-articles", debouncedQuery, filters.articleType, filters.articleStatus],
    queryFn: async () => {
      if (!debouncedQuery || searchWords.length === 0) return [];
      
      let query = supabase
        .from("articles")
        .select("id, title, title_ar, excerpt, excerpt_ar, featured_image_url, type, status, published_at, slug");

      if (debouncedQuery && searchWords.length > 0) {
        const cols = ["title", "title_ar", "excerpt", "excerpt_ar", "content", "content_ar"];
        query = query.or(buildFlexibleFilter(searchWords, cols));
      }

      if (filters.articleType && filters.articleType !== "all") {
        query = query.eq("type", filters.articleType);
      }
      if (filters.articleStatus && filters.articleStatus !== "all") {
        query = query.eq("status", filters.articleStatus);
      } else {
        query = query.eq("status", "published");
      }

      const { data, error } = await query
        .order("published_at", { ascending: false })
        .limit(30);

      if (error) throw error;
      if (!data) return [];

      return sortByRelevance(
        data.map((r) => ({
          ...r,
          _relevance: countMatchingWords(searchWords, r.title, r.title_ar, r.excerpt, r.excerpt_ar),
        }))
      ) as ArticleResult[];
    },
    enabled: !!debouncedQuery && searchWords.length > 0,
    staleTime: 1000 * 60 * 2,
  });

  // Search members
  const { data: membersData, isLoading: membersLoading } = useQuery({
    queryKey: ["search-members", debouncedQuery, filters.memberRole, filters.experienceLevel],
    queryFn: async () => {
      if (!debouncedQuery || searchWords.length === 0) return [];
      
      let query = supabase
        .from("profiles")
        .select("id, user_id, full_name, full_name_ar, display_name, display_name_ar, username, avatar_url, bio, bio_ar, specialization, specialization_ar, experience_level, location, is_verified")
        .eq("account_status", "active");

      if (debouncedQuery && searchWords.length > 0) {
        const cols = [
          "full_name", "full_name_ar", "display_name", "display_name_ar",
          "username", "bio", "bio_ar", "specialization", "specialization_ar", "location"
        ];
        query = query.or(buildFlexibleFilter(searchWords, cols));
      }

      if (filters.experienceLevel && filters.experienceLevel !== "all") {
        query = query.eq("experience_level", filters.experienceLevel);
      }

      const { data, error } = await query.limit(30);
      if (error) throw error;
      
      let scored = (data || []).map((r) => ({
        ...r,
        _relevance: countMatchingWords(searchWords, r.full_name, r.full_name_ar, r.display_name, r.display_name_ar, r.username, r.bio, r.bio_ar, r.specialization, r.specialization_ar, r.location),
      }));

      if (filters.memberRole && filters.memberRole !== "all" && scored.length > 0) {
        const userIds = scored.map(m => m.user_id);
        const { data: rolesData } = await supabase
          .from("user_roles")
          .select("user_id")
          .eq("role", filters.memberRole as Database["public"]["Enums"]["app_role"])
          .in("user_id", userIds);
        
        const filteredUserIds = new Set(rolesData?.map(r => r.user_id) || []);
        scored = scored.filter(m => filteredUserIds.has(m.user_id));
      }

      return sortByRelevance(scored) as MemberResult[];
    },
    enabled: !!debouncedQuery && searchWords.length > 0,
    staleTime: 1000 * 60 * 2,
  });

  // Search posts
  const { data: postsData, isLoading: postsLoading } = useQuery({
    queryKey: ["search-posts", debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery || searchWords.length === 0) return [];
      
      const orParts = searchWords.map(w => `content.ilike.%${w.replace(/[%_]/g, "\\$&")}%`);

      const { data: posts, error } = await supabase
        .from("posts")
        .select("id, content, image_url, video_url, created_at, author_id")
        .eq("moderation_status", "approved")
        .or(orParts.join(","))
        .order("created_at", { ascending: false })
        .limit(30);

      if (error) throw error;
      if (!posts?.length) return [];

      const scored = posts.map(p => ({
        ...p,
        _relevance: countMatchingWords(searchWords, p.content),
      }));

      const authorIds = [...new Set(scored.map(p => p.author_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, username, avatar_url")
        .in("user_id", authorIds);
      
      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      return sortByRelevance(
        scored.map(p => {
          const profile = profileMap.get(p.author_id);
          return {
            id: p.id,
            content: p.content,
            image_url: p.image_url,
            video_url: (p as any).video_url || null,
            created_at: p.created_at,
            author_id: p.author_id,
            author_name: profile?.full_name || null,
            author_username: profile?.username || null,
            author_avatar: profile?.avatar_url || null,
            _relevance: p._relevance,
          };
        })
      ) as PostResult[];
    },
    enabled: !!debouncedQuery && searchWords.length > 0,
    staleTime: 1000 * 60 * 2,
  });

  // Search entities (culinary_entities + establishments + companies)
  const { data: entitiesData, isLoading: entitiesLoading } = useQuery({
    queryKey: ["search-entities", debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery || searchWords.length === 0) return [];

      const entityCols = ["name", "name_ar", "description", "description_ar", "city", "country"];
      const estabCols = ["name", "name_ar", "description", "description_ar", "city", "cuisine_type", "cuisine_type_ar"];
      const companyCols = ["name", "name_ar", "description", "description_ar", "city", "country"];

      const [entRes, estRes, compRes] = await Promise.all([
        supabase
          .from("culinary_entities")
          .select("id, name, name_ar, type, description, description_ar, logo_url, city, country, is_verified")
          .eq("is_visible", true)
          .or(buildFlexibleFilter(searchWords, entityCols))
          .limit(15),
        supabase
          .from("establishments")
          .select("id, name, name_ar, type, description, description_ar, logo_url, city, city_ar, is_verified")
          .eq("is_active", true)
          .or(buildFlexibleFilter(searchWords, estabCols))
          .limit(15),
        supabase
          .from("companies")
          .select("id, name, name_ar, type, description, description_ar, logo_url, city, country")
          .eq("status", "active")
          .or(buildFlexibleFilter(searchWords, companyCols))
          .limit(15),
      ]);

      const entities: EntityResult[] = (entRes.data || []).map((e: any) => ({
        id: e.id,
        name: e.name,
        name_ar: e.name_ar,
        type: e.type,
        description: e.description,
        description_ar: e.description_ar,
        logo_url: e.logo_url,
        city: e.city,
        country: e.country,
        is_verified: e.is_verified,
        source: "entity" as const,
        _relevance: countMatchingWords(searchWords, e.name, e.name_ar, e.description, e.description_ar, e.city, e.country),
      }));

      const establishments: EntityResult[] = (estRes.data || []).map((e: any) => ({
        id: e.id,
        name: e.name,
        name_ar: e.name_ar,
        type: e.type,
        description: e.description,
        description_ar: e.description_ar,
        logo_url: e.logo_url,
        city: e.city,
        country: null,
        is_verified: e.is_verified,
        source: "establishment" as const,
        _relevance: countMatchingWords(searchWords, e.name, e.name_ar, e.description, e.description_ar, e.city),
      }));

      const companies: EntityResult[] = (compRes.data || []).map((e: any) => ({
        id: e.id,
        name: e.name,
        name_ar: e.name_ar,
        type: e.type,
        description: e.description,
        description_ar: e.description_ar,
        logo_url: e.logo_url,
        city: e.city,
        country: e.country,
        is_verified: true,
        source: "entity" as const,
        _relevance: countMatchingWords(searchWords, e.name, e.name_ar, e.description, e.description_ar, e.city, e.country),
      }));

      return sortByRelevance([...entities, ...establishments, ...companies]);
    },
    enabled: !!debouncedQuery && searchWords.length > 0,
    staleTime: 1000 * 60 * 2,
  });

  // Search recipes
  const { data: recipesData, isLoading: recipesLoading } = useQuery({
    queryKey: ["search-recipes", debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery || searchWords.length === 0) return [];
      const cols = ["title", "title_ar", "description", "description_ar"];
      const { data, error } = await (supabase
        .from("recipes")
        .select("id, title, title_ar, description, description_ar, image_url, prep_time, cook_time, average_rating, slug") as any)
        .eq("status", "published")
        .or(buildFlexibleFilter(searchWords, cols))
        .order("created_at", { ascending: false })
        .limit(30);
      if (error) throw error;
      if (!data) return [];
      return sortByRelevance(
        data.map((r: any) => ({
          ...r,
          _relevance: countMatchingWords(searchWords, r.title, r.title_ar, r.description, r.description_ar),
        }))
      ) as RecipeResult[];
    },
    enabled: !!debouncedQuery && searchWords.length > 0,
    staleTime: 1000 * 60 * 2,
  });

  // Search exhibitions
  const { data: exhibitionsData, isLoading: exhibitionsLoading } = useQuery({
    queryKey: ["search-exhibitions", debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery || searchWords.length === 0) return [];
      const cols = ["title", "title_ar", "description", "description_ar", "venue", "venue_ar", "city", "country"];
      const { data, error } = await supabase
        .from("exhibitions")
        .select("id, title, title_ar, description, description_ar, cover_image_url, slug, start_date, end_date, venue, venue_ar, city, country, status")
        .or(buildFlexibleFilter(searchWords, cols))
        .order("start_date", { ascending: false })
        .limit(20);
      if (error) throw error;
      if (!data) return [];
      return sortByRelevance(
        data.map((r: any) => ({
          ...r,
          _relevance: countMatchingWords(searchWords, r.title, r.title_ar, r.description, r.description_ar, r.venue, r.city, r.country),
        }))
      ) as ExhibitionResult[];
    },
    enabled: !!debouncedQuery && searchWords.length > 0,
    staleTime: 1000 * 60 * 2,
  });

  const results: SearchResults = {
    competitions: competitionsData || [],
    articles: articlesData || [],
    members: membersData || [],
    posts: postsData || [],
    entities: entitiesData || [],
    recipes: recipesData || [],
    exhibitions: exhibitionsData || [],
  };

  const totalResults = results.competitions.length + results.articles.length + results.members.length + results.posts.length + results.entities.length + results.recipes.length + results.exhibitions.length;
  const isLoading = competitionsLoading || articlesLoading || membersLoading || postsLoading || entitiesLoading || recipesLoading || exhibitionsLoading;

  return {
    filters,
    setFilters,
    updateFilter,
    resetFilters,
    results,
    totalResults,
    isLoading,
  };
}
