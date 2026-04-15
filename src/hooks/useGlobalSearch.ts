/**
 * Global search orchestrator — composes focused sub-hooks for each entity type.
 * Re-exports all types for backward compatibility.
 */
import { useState, useCallback, useMemo, useEffect } from "react";
import { getSearchWords } from "./search/searchUtils";
import { DEFAULT_FILTERS, type SearchFilters, type SearchResults } from "./search/searchTypes";
import { useSearchCompetitions } from "./search/useSearchCompetitions";
import { useSearchArticles } from "./search/useSearchArticles";
import { useSearchMembers } from "./search/useSearchMembers";
import { useSearchPosts } from "./search/useSearchPosts";
import { useSearchEntities } from "./search/useSearchEntities";
import { useSearchRecipes } from "./search/useSearchRecipes";
import { useSearchExhibitions } from "./search/useSearchExhibitions";

// Re-export all types for consumers
export type {
  SearchFilters,
  SearchResults,
  CompetitionResult,
  ArticleResult,
  MemberResult,
  PostResult,
  EntityResult,
  RecipeResult,
  ExhibitionResult,
} from "./search/searchTypes";

export function useGlobalSearch() {
  const [filters, setFilters] = useState<SearchFilters>(DEFAULT_FILTERS);
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(filters.query), 300);
    return () => clearTimeout(timer);
  }, [filters.query]);

  const updateFilter = useCallback(<K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const resetFilters = useCallback(() => setFilters(DEFAULT_FILTERS), []);

  const searchWords = useMemo(() => getSearchWords(debouncedQuery), [debouncedQuery]);

  const { data: competitionsData, isLoading: competitionsLoading } = useSearchCompetitions(searchWords, debouncedQuery, filters);
  const { data: articlesData, isLoading: articlesLoading } = useSearchArticles(searchWords, debouncedQuery, filters);
  const { data: membersData, isLoading: membersLoading } = useSearchMembers(searchWords, debouncedQuery, filters);
  const { data: postsData, isLoading: postsLoading } = useSearchPosts(searchWords, debouncedQuery);
  const { data: entitiesData, isLoading: entitiesLoading } = useSearchEntities(searchWords, debouncedQuery);
  const { data: recipesData, isLoading: recipesLoading } = useSearchRecipes(searchWords, debouncedQuery);
  const { data: exhibitionsData, isLoading: exhibitionsLoading } = useSearchExhibitions(searchWords, debouncedQuery);

  const results: SearchResults = {
    competitions: competitionsData || [],
    articles: articlesData || [],
    members: membersData || [],
    posts: postsData || [],
    entities: entitiesData || [],
    recipes: recipesData || [],
    exhibitions: exhibitionsData || [],
  };

  const totalResults =
    results.competitions.length + results.articles.length + results.members.length +
    results.posts.length + results.entities.length + results.recipes.length + results.exhibitions.length;

  const isLoading =
    competitionsLoading || articlesLoading || membersLoading ||
    postsLoading || entitiesLoading || recipesLoading || exhibitionsLoading;

  return { filters, setFilters, updateFilter, resetFilters, results, totalResults, isLoading };
}
