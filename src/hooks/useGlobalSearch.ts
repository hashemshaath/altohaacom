import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type CompetitionStatus = Database["public"]["Enums"]["competition_status"];

export interface SearchFilters {
  query: string;
  type: "all" | "competitions" | "articles" | "members";
  // Competition filters
  competitionStatus?: CompetitionStatus | "all";
  isVirtual?: boolean | null;
  // Article filters
  articleType?: "news" | "blog" | "exhibition" | "all";
  articleStatus?: "published" | "draft" | "all";
  // Member filters
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
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  specialization: string | null;
  experience_level: Database["public"]["Enums"]["experience_level"] | null;
  location: string | null;
  is_verified: boolean | null;
}

export interface SearchResults {
  competitions: CompetitionResult[];
  articles: ArticleResult[];
  members: MemberResult[];
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

export function useGlobalSearch() {
  const [filters, setFilters] = useState<SearchFilters>(DEFAULT_FILTERS);
  const [debouncedQuery, setDebouncedQuery] = useState("");

  const updateFilter = useCallback(<K extends keyof SearchFilters>(
    key: K,
    value: SearchFilters[K]
  ) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  // Search competitions
  const { data: competitionsData, isLoading: competitionsLoading } = useQuery({
    queryKey: ["search-competitions", filters.query, filters.competitionStatus, filters.isVirtual],
    queryFn: async () => {
      if (!filters.query && filters.type !== "competitions") return [];
      
      let query = supabase
        .from("competitions")
        .select("id, title, title_ar, description, description_ar, cover_image_url, status, competition_start, competition_end, venue, venue_ar, city, country, is_virtual")
        .neq("status", "draft");

      // Text search using ilike for flexibility
      if (filters.query) {
        query = query.or(`title.ilike.%${filters.query}%,title_ar.ilike.%${filters.query}%,description.ilike.%${filters.query}%,city.ilike.%${filters.query}%,venue.ilike.%${filters.query}%`);
      }

      // Status filter
      if (filters.competitionStatus && filters.competitionStatus !== "all") {
        query = query.eq("status", filters.competitionStatus);
      }

      // Virtual filter
      if (filters.isVirtual !== null) {
        query = query.eq("is_virtual", filters.isVirtual);
      }

      const { data, error } = await query
        .order("competition_start", { ascending: false })
        .limit(20);

      if (error) throw error;
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

      // Text search
      if (filters.query) {
        query = query.or(`title.ilike.%${filters.query}%,title_ar.ilike.%${filters.query}%,excerpt.ilike.%${filters.query}%,content.ilike.%${filters.query}%`);
      }

      // Type filter
      if (filters.articleType && filters.articleType !== "all") {
        query = query.eq("type", filters.articleType);
      }

      // Status filter
      if (filters.articleStatus && filters.articleStatus !== "all") {
        query = query.eq("status", filters.articleStatus);
      } else {
        query = query.eq("status", "published");
      }

      const { data, error } = await query
        .order("published_at", { ascending: false })
        .limit(20);

      if (error) throw error;
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
        .select("id, user_id, full_name, username, avatar_url, bio, specialization, experience_level, location, is_verified")
        .eq("account_status", "active");

      // Text search
      if (filters.query) {
        query = query.or(`full_name.ilike.%${filters.query}%,username.ilike.%${filters.query}%,bio.ilike.%${filters.query}%,specialization.ilike.%${filters.query}%,location.ilike.%${filters.query}%`);
      }

      // Experience level filter
      if (filters.experienceLevel && filters.experienceLevel !== "all") {
        query = query.eq("experience_level", filters.experienceLevel);
      }

      const { data, error } = await query.limit(20);

      if (error) throw error;

      // If role filter is set, we need to filter by user_roles
      if (filters.memberRole && filters.memberRole !== "all" && data) {
        const userIds = data.map(m => m.user_id);
        const { data: rolesData } = await supabase
          .from("user_roles")
          .select("user_id")
          .eq("role", filters.memberRole as Database["public"]["Enums"]["app_role"])
          .in("user_id", userIds);
        
        const filteredUserIds = new Set(rolesData?.map(r => r.user_id) || []);
        return data.filter(m => filteredUserIds.has(m.user_id)) as MemberResult[];
      }

      return data as MemberResult[];
    },
    enabled: filters.type === "all" || filters.type === "members",
  });

  const results: SearchResults = {
    competitions: competitionsData || [],
    articles: articlesData || [],
    members: membersData || [],
  };

  const totalResults = results.competitions.length + results.articles.length + results.members.length;
  const isLoading = competitionsLoading || articlesLoading || membersLoading;

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
