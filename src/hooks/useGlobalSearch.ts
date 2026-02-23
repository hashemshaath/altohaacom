import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type CompetitionStatus = Database["public"]["Enums"]["competition_status"];

export interface SearchFilters {
  query: string;
  type: "all" | "competitions" | "articles" | "members" | "posts";
  competitionStatus?: CompetitionStatus | "all";
  isVirtual?: boolean | null;
  articleType?: "news" | "blog" | "exhibition" | "all";
  articleStatus?: "published" | "draft" | "all";
  memberRole?: string | "all";
  experienceLevel?: "beginner" | "amateur" | "professional" | "all";
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
}

export interface SearchResults {
  competitions: CompetitionResult[];
  articles: ArticleResult[];
  members: MemberResult[];
  posts: PostResult[];
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
};

/**
 * Build an OR filter string for Supabase .or() that matches ALL words
 * in any of the given columns. For a single word this is a simple OR across columns.
 * For multiple words we require each word to appear in at least one column.
 * Because Supabase .or() doesn't support nested AND, we apply word-level filtering
 * client-side for multi-word queries while using the first word for the DB filter
 * to narrow results.
 */
function buildIlikeFilter(query: string, columns: string[]): string {
  // Use the full query as a single pattern – good for exact / single-word
  const parts: string[] = [];
  const escaped = query.replace(/[%_]/g, "\\$&");
  for (const col of columns) {
    parts.push(`${col}.ilike.%${escaped}%`);
  }
  return parts.join(",");
}

/** Split query into meaningful words (>=2 chars) */
function getSearchWords(query: string): string[] {
  return query
    .trim()
    .split(/\s+/)
    .filter((w) => w.length >= 2);
}

/** Check if a record's text fields contain all search words (case-insensitive) */
function matchesAllWords(words: string[], ...fields: (string | null | undefined)[]): boolean {
  if (words.length <= 1) return true; // single word already filtered by DB
  const combined = fields
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return words.every((w) => combined.includes(w.toLowerCase()));
}

export function useGlobalSearch() {
  const [filters, setFilters] = useState<SearchFilters>(DEFAULT_FILTERS);

  const updateFilter = useCallback(<K extends keyof SearchFilters>(
    key: K,
    value: SearchFilters[K]
  ) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  const searchWords = getSearchWords(filters.query);

  // Search competitions
  const { data: competitionsData, isLoading: competitionsLoading } = useQuery({
    queryKey: ["search-competitions", filters.query, filters.competitionStatus, filters.isVirtual],
    queryFn: async () => {
      if (!filters.query && filters.type !== "competitions") return [];
      
      let query = supabase
        .from("competitions")
        .select("id, title, title_ar, description, description_ar, cover_image_url, status, competition_start, competition_end, venue, venue_ar, city, country, is_virtual")
        .neq("status", "draft");

      if (filters.query) {
        // Use first word for DB-level filter to get a broad set, then refine client-side
        const filterWord = searchWords[0] || filters.query;
        query = query.or(buildIlikeFilter(filterWord, ["title", "title_ar", "description", "description_ar", "city", "venue", "venue_ar", "country"]));
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

      // Client-side multi-word refinement
      if (searchWords.length > 1 && data) {
        return data.filter((r) =>
          matchesAllWords(searchWords, r.title, r.title_ar, r.description, r.description_ar, r.city, r.venue, r.venue_ar, r.country)
        ) as CompetitionResult[];
      }

      return data as CompetitionResult[];
    },
    enabled: filters.type === "all" || filters.type === "competitions",
  });

  // Search articles
  const { data: articlesData, isLoading: articlesLoading } = useQuery({
    queryKey: ["search-articles", filters.query, filters.articleType, filters.articleStatus],
    queryFn: async () => {
      if (!filters.query && filters.type !== "articles") return [];
      
      let query = supabase
        .from("articles")
        .select("id, title, title_ar, excerpt, excerpt_ar, featured_image_url, type, status, published_at, slug");

      if (filters.query) {
        const filterWord = searchWords[0] || filters.query;
        query = query.or(buildIlikeFilter(filterWord, ["title", "title_ar", "excerpt", "excerpt_ar", "content", "content_ar"]));
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

      if (searchWords.length > 1 && data) {
        return data.filter((r) =>
          matchesAllWords(searchWords, r.title, r.title_ar, r.excerpt, r.excerpt_ar)
        ) as ArticleResult[];
      }

      return data as ArticleResult[];
    },
    enabled: filters.type === "all" || filters.type === "articles",
  });

  // Search members
  const { data: membersData, isLoading: membersLoading } = useQuery({
    queryKey: ["search-members", filters.query, filters.memberRole, filters.experienceLevel],
    queryFn: async () => {
      if (!filters.query && filters.type !== "members") return [];
      
      let query = supabase
        .from("profiles")
        .select("id, user_id, full_name, full_name_ar, display_name, display_name_ar, username, avatar_url, bio, bio_ar, specialization, specialization_ar, experience_level, location, is_verified")
        .eq("account_status", "active");

      if (filters.query) {
        const filterWord = searchWords[0] || filters.query;
        query = query.or(buildIlikeFilter(filterWord, [
          "full_name", "full_name_ar", "display_name", "display_name_ar",
          "username", "bio", "bio_ar", "specialization", "specialization_ar", "location"
        ]));
      }

      if (filters.experienceLevel && filters.experienceLevel !== "all") {
        query = query.eq("experience_level", filters.experienceLevel);
      }

      const { data, error } = await query.limit(30);

      if (error) throw error;

      let results = data || [];

      // Multi-word client-side refinement
      if (searchWords.length > 1) {
        results = results.filter((r) =>
          matchesAllWords(searchWords, r.full_name, r.full_name_ar, r.display_name, r.display_name_ar, r.username, r.bio, r.bio_ar, r.specialization, r.specialization_ar, r.location)
        );
      }

      // Role filter
      if (filters.memberRole && filters.memberRole !== "all" && results.length > 0) {
        const userIds = results.map(m => m.user_id);
        const { data: rolesData } = await supabase
          .from("user_roles")
          .select("user_id")
          .eq("role", filters.memberRole as Database["public"]["Enums"]["app_role"])
          .in("user_id", userIds);
        
        const filteredUserIds = new Set(rolesData?.map(r => r.user_id) || []);
        return results.filter(m => filteredUserIds.has(m.user_id)) as MemberResult[];
      }

      return results as MemberResult[];
    },
    enabled: filters.type === "all" || filters.type === "members",
  });

  // Search posts
  const { data: postsData, isLoading: postsLoading } = useQuery({
    queryKey: ["search-posts", filters.query],
    queryFn: async () => {
      if (!filters.query) return [];
      
      const filterWord = searchWords[0] || filters.query;

      const { data: posts, error } = await supabase
        .from("posts")
        .select("id, content, image_url, video_url, created_at, author_id")
        .eq("moderation_status", "approved")
        .ilike("content", `%${filterWord}%`)
        .order("created_at", { ascending: false })
        .limit(30);

      if (error) throw error;
      if (!posts?.length) return [];

      // Multi-word refinement
      let filtered = posts;
      if (searchWords.length > 1) {
        filtered = posts.filter((p) => matchesAllWords(searchWords, p.content));
      }
      if (!filtered.length) return [];

      const authorIds = [...new Set(filtered.map(p => p.author_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, username, avatar_url")
        .in("user_id", authorIds);
      
      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      return filtered.map(p => {
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
        };
      }) as PostResult[];
    },
    enabled: filters.type === "all" || filters.type === "posts",
  });

  const results: SearchResults = {
    competitions: competitionsData || [],
    articles: articlesData || [],
    members: membersData || [],
    posts: postsData || [],
  };

  const totalResults = results.competitions.length + results.articles.length + results.members.length + results.posts.length;
  const isLoading = competitionsLoading || articlesLoading || membersLoading || postsLoading;

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
