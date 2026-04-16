import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Database } from "@/integrations/supabase/types";
import { CACHE } from "@/lib/queryConfig";
import { searchAll, fetchPopularPreload } from "@/services/searchService";

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
  view_count: number | null;
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

const EMPTY: SearchResults = {
  competitions: [],
  articles: [],
  members: [],
  posts: [],
  entities: [],
  recipes: [],
  exhibitions: [],
};

export function useGlobalSearch() {
  const [filters, setFilters] = useState<SearchFilters>(DEFAULT_FILTERS);
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  const preloadedRef = useRef<SearchResults | null>(null);
  const [hasPreloaded, setHasPreloaded] = useState(false);

  // Debounce the query
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
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  // Preload popular content on input focus (call once)
  const preloadPopular = useCallback(() => {
    if (preloadedRef.current) return;
    fetchPopularPreload()
      .then((res) => {
        preloadedRef.current = res;
        setHasPreloaded(true);
      })
      .catch(() => { /* silent */ });
  }, []);

  // Stable filters snapshot for the query key (excludes the raw query, uses debounced)
  const stableFilters = useMemo(
    () => ({ ...filters, query: debouncedQuery }),
    [debouncedQuery, filters.type, filters.competitionStatus, filters.isVirtual, filters.articleType, filters.articleStatus, filters.memberRole, filters.experienceLevel, filters.country, filters.cuisineType]
  );

  const { data: results = EMPTY, isLoading, error, refetch } = useQuery({
    queryKey: ["global-search", stableFilters],
    queryFn: async () => {
      // Abort previous in-flight request
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      return searchAll(stableFilters, controller.signal);
    },
    enabled: !!debouncedQuery && debouncedQuery.trim().length >= 2,
    ...CACHE.short,
  });

  // While first real query is loading, surface preloaded popular results
  // to avoid an empty flash. Only used as placeholder when no results yet.
  const displayResults = useMemo<SearchResults>(() => {
    const hasAny =
      results.competitions.length + results.articles.length + results.members.length +
      results.posts.length + results.entities.length + results.recipes.length +
      results.exhibitions.length > 0;
    if (isLoading && !hasAny && preloadedRef.current) return preloadedRef.current;
    return results;
  }, [results, isLoading, hasPreloaded]);

  const totalResults =
    displayResults.competitions.length +
    displayResults.articles.length +
    displayResults.members.length +
    displayResults.posts.length +
    displayResults.entities.length +
    displayResults.recipes.length +
    displayResults.exhibitions.length;

  return {
    filters,
    setFilters,
    updateFilter,
    resetFilters,
    results: displayResults,
    totalResults,
    isLoading,
    preloadPopular,
  };
}
