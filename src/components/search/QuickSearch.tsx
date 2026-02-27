import { useState, useRef, useEffect } from "react";
import { TrendingSearches } from "./TrendingSearches";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Trophy, 
  FileText, 
  User, 
  ArrowRight,
  X,
  Clock,
  Trash2,
  MessageSquare,
  Building2,
  Bookmark,
  BookmarkPlus,
} from "lucide-react";
import { getRecentSearches, addRecentSearch, clearRecentSearches, getSavedSearches, addSavedSearch, removeSavedSearch } from "@/lib/recentSearches";

interface QuickSearchProps {
  onClose?: () => void;
}

export function QuickSearch({ onClose }: QuickSearchProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [savedSearches, setSavedSearches] = useState<string[]>([]);
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debouncedQuery = useDebounce(query, 300);

  // Load recent searches on mount
  useEffect(() => {
    setRecentSearches(getRecentSearches());
    setSavedSearches(getSavedSearches());
  }, []);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close on escape
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  // Keyboard shortcut: Ctrl/Cmd+K
  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    }
    document.addEventListener("keydown", handleShortcut);
    return () => document.removeEventListener("keydown", handleShortcut);
  }, []);

  const { data: suggestions, isLoading } = useQuery({
    queryKey: ["quick-search", debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) {
        return { competitions: [], articles: [], members: [], posts: [], entities: [] };
      }

      // Use the first word for DB-level filtering (broader match), refine client-side for multi-word
      const words = debouncedQuery.trim().split(/\s+/).filter(w => w.length >= 2);
      const firstWord = words[0] || debouncedQuery;
      const searchPattern = `%${firstWord}%`;

      const [competitionsRes, articlesRes, membersRes, postsRes, entitiesRes] = await Promise.all([
        supabase
          .from("competitions")
          .select("id, title, title_ar, description, status, cover_image_url, city, venue, country")
          .neq("status", "draft")
          .or(`title.ilike.${searchPattern},title_ar.ilike.${searchPattern},description.ilike.${searchPattern},city.ilike.${searchPattern},venue.ilike.${searchPattern},country.ilike.${searchPattern}`)
          .limit(5),
        supabase
          .from("articles")
          .select("id, title, title_ar, excerpt, slug, type, featured_image_url")
          .eq("status", "published")
          .or(`title.ilike.${searchPattern},title_ar.ilike.${searchPattern},excerpt.ilike.${searchPattern},content.ilike.${searchPattern}`)
          .limit(5),
        supabase
          .from("profiles")
          .select("id, user_id, username, full_name, full_name_ar, avatar_url, specialization, specialization_ar, location, bio")
          .eq("account_status", "active")
          .or(`full_name.ilike.${searchPattern},full_name_ar.ilike.${searchPattern},username.ilike.${searchPattern},specialization.ilike.${searchPattern},specialization_ar.ilike.${searchPattern},location.ilike.${searchPattern},bio.ilike.${searchPattern}`)
          .limit(5),
        supabase
          .from("posts")
          .select("id, content, created_at, author_id")
          .eq("visibility", "public")
          .ilike("content", searchPattern)
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("entities" as any)
          .select("id, name, name_ar, type, logo_url, description")
          .or(`name.ilike.${searchPattern},name_ar.ilike.${searchPattern},description.ilike.${searchPattern}`)
          .limit(5),
      ]);

      // Client-side multi-word refinement
      const matchAll = (texts: (string | null | undefined)[]) => {
        if (words.length <= 1) return true;
        const combined = texts.filter(Boolean).join(" ").toLowerCase();
        return words.every(w => combined.includes(w.toLowerCase()));
      };

      const competitions = (competitionsRes.data || []).filter((r: any) =>
        matchAll([r.title, r.title_ar, r.description, r.city, r.venue, r.country])
      ).slice(0, 3);

      const articles = (articlesRes.data || []).filter((r: any) =>
        matchAll([r.title, r.title_ar, r.excerpt])
      ).slice(0, 3);

      const members = (membersRes.data || []).filter((r: any) =>
        matchAll([r.full_name, r.full_name_ar, r.username, r.specialization, r.specialization_ar, r.location, r.bio])
      ).slice(0, 3);

      const posts = (postsRes.data || []).filter((r: any) =>
        matchAll([r.content])
      ).slice(0, 3);

      const entities = ((entitiesRes.data as any[]) || []).filter((r: any) =>
        matchAll([r.name, r.name_ar, r.description])
      ).slice(0, 3);

      return { competitions, articles, members, posts, entities };
    },
    enabled: debouncedQuery.length >= 2,
    staleTime: 1000 * 60 * 2,
  });

  const hasResults = suggestions && (
    suggestions.competitions.length > 0 || 
    suggestions.articles.length > 0 || 
    suggestions.members.length > 0 ||
    suggestions.posts.length > 0 ||
    suggestions.entities.length > 0
  );

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (query.trim()) {
      addRecentSearch(query.trim());
      setRecentSearches(getRecentSearches());
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      setIsOpen(false);
      setQuery("");
      onClose?.();
    }
  };

  const handleRecentClick = (term: string) => {
    setQuery(term);
    addRecentSearch(term);
    setRecentSearches(getRecentSearches());
    navigate(`/search?q=${encodeURIComponent(term)}`);
    setIsOpen(false);
    setQuery("");
    onClose?.();
  };

  const handleClearRecent = () => {
    clearRecentSearches();
    setRecentSearches([]);
  };

  const handleSaveSearch = (term: string) => {
    addSavedSearch(term);
    setSavedSearches(getSavedSearches());
  };

  const handleRemoveSaved = (term: string) => {
    removeSavedSearch(term);
    setSavedSearches(getSavedSearches());
  };

  const showTrending = isOpen && query.length < 2 && recentSearches.length === 0 && savedSearches.length === 0;
  const showRecent = isOpen && query.length < 2 && (recentSearches.length > 0 || savedSearches.length > 0);
  const showResults = isOpen && query.length >= 2;

  const handleResultClick = () => {
    if (query.trim()) {
      addRecentSearch(query.trim());
      setRecentSearches(getRecentSearches());
    }
    setIsOpen(false);
    setQuery("");
    onClose?.();
  };


  return (
    <div ref={containerRef} className="relative w-full max-w-sm">
      <form onSubmit={handleSearch}>
        <div className="relative">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={inputRef}
            type="text"
            placeholder={language === "ar" ? "ابحث... (⌘K)" : "Search... (⌘K)"}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            className="ps-9 pe-8"
          />
          {query && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute end-1 top-1/2 h-6 w-6 -translate-y-1/2"
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </form>

      {/* Trending (when no recent/saved searches) */}
      {showTrending && (
        <div className="absolute top-full inset-x-0 z-50 mt-1 rounded-xl border bg-popover p-2.5 shadow-xl animate-fade-in">
          <TrendingSearches onSelect={(term) => { handleRecentClick(term); }} />
        </div>
      )}

      {/* Recent & Saved Searches Dropdown */}
      {showRecent && (
        <div className="absolute top-full inset-x-0 z-50 mt-1 rounded-xl border bg-popover p-2.5 shadow-xl animate-fade-in">
          {/* Saved Searches */}
          {savedSearches.length > 0 && (
            <>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-1">
                {language === "ar" ? "عمليات بحث محفوظة" : "Saved Searches"}
              </p>
              {savedSearches.map((term) => (
                <div key={`saved-${term}`} className="flex items-center gap-1 group">
                  <button
                    onClick={() => handleRecentClick(term)}
                    className="flex flex-1 items-center gap-3 rounded-md p-2 text-sm hover:bg-accent transition-colors text-start"
                  >
                    <Bookmark className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span className="truncate">{term}</span>
                  </button>
                  <Button
                    variant="ghost" size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleRemoveSaved(term)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              {recentSearches.length > 0 && <div className="border-t border-border/50 my-1.5" />}
            </>
          )}

          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <>
              <div className="flex items-center justify-between px-2 mb-1">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  {language === "ar" ? "عمليات البحث الأخيرة" : "Recent Searches"}
                </p>
                <Button variant="ghost" size="sm" className="h-6 px-1.5 text-xs text-muted-foreground" onClick={handleClearRecent}>
                  <Trash2 className="h-3 w-3 me-1" />
                  {language === "ar" ? "مسح" : "Clear"}
                </Button>
              </div>
              {recentSearches.map((term) => (
                <div key={term} className="flex items-center gap-1 group">
                  <button
                    onClick={() => handleRecentClick(term)}
                    className="flex flex-1 items-center gap-3 rounded-md p-2 text-sm hover:bg-accent transition-colors text-start"
                  >
                    <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="truncate">{term}</span>
                  </button>
                  <Button
                    variant="ghost" size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleSaveSearch(term)}
                    title={language === "ar" ? "حفظ" : "Save"}
                  >
                    <BookmarkPlus className="h-3 w-3 text-muted-foreground" />
                  </Button>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {/* Search Results Dropdown */}
      {showResults && (
        <div className="absolute top-full inset-x-0 z-50 mt-1 rounded-xl border bg-popover p-2.5 shadow-xl animate-fade-in">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : !hasResults ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              {language === "ar" ? "لا توجد نتائج" : "No results found"}
            </p>
          ) : (
            <div className="space-y-3">
              {/* Competitions */}
              {suggestions.competitions.length > 0 && (
                <div>
                  <p className="mb-1 px-2 text-xs font-semibold text-muted-foreground uppercase">
                    {t("competitions")}
                  </p>
                  {suggestions.competitions.map((comp) => (
                    <Link
                      key={comp.id}
                      to={`/competitions/${comp.id}`}
                      onClick={handleResultClick}
                      className="flex items-center gap-3 rounded-md p-2 hover:bg-accent transition-colors"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded bg-primary/10">
                        <Trophy className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {language === "ar" && comp.title_ar ? comp.title_ar : comp.title}
                        </p>
                        <Badge variant="outline" className="text-xs capitalize">
                          {comp.status.replace("_", " ")}
                        </Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {/* Articles */}
              {suggestions.articles.length > 0 && (
                <div>
                  <p className="mb-1 px-2 text-xs font-semibold text-muted-foreground uppercase">
                    {t("articles")}
                  </p>
                  {suggestions.articles.map((article) => (
                    <Link
                      key={article.id}
                      to={`/news/${article.slug}`}
                      onClick={handleResultClick}
                      className="flex items-center gap-3 rounded-md p-2 hover:bg-accent transition-colors"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded bg-accent/50">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {language === "ar" && article.title_ar ? article.title_ar : article.title}
                        </p>
                        <Badge variant="secondary" className="text-xs capitalize">
                          {article.type}
                        </Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {/* Members */}
              {suggestions.members.length > 0 && (
                <div>
                  <p className="mb-1 px-2 text-xs font-semibold text-muted-foreground uppercase">
                    {t("members")}
                  </p>
                  {suggestions.members.map((member) => (
                    <Link
                      key={member.id}
                      to={`/${member.username || member.user_id}`}
                      onClick={handleResultClick}
                      className="flex items-center gap-3 rounded-md p-2 hover:bg-accent transition-colors"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={member.avatar_url || undefined} />
                        <AvatarFallback className="text-xs">
                          {(member.full_name || "U")[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {member.full_name || member.username || "Unknown"}
                        </p>
                        {member.specialization && (
                          <p className="text-xs text-muted-foreground truncate">
                            {member.specialization}
                          </p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {/* Posts */}
              {suggestions.posts.length > 0 && (
                <div>
                  <p className="mb-1 px-2 text-xs font-semibold text-muted-foreground uppercase">
                    {language === "ar" ? "المنشورات" : "Posts"}
                  </p>
                  {suggestions.posts.map((post: any) => (
                    <button
                      key={post.id}
                      onClick={() => { handleResultClick(); navigate(`/community?post=${post.id}`); }}
                      className="flex items-center gap-3 rounded-md p-2 hover:bg-accent transition-colors w-full text-start"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded bg-chart-3/10">
                        <MessageSquare className="h-4 w-4 text-chart-3" />
                      </div>
                      <p className="text-sm truncate flex-1 min-w-0">
                        {post.content?.slice(0, 80)}{post.content?.length > 80 ? "..." : ""}
                      </p>
                    </button>
                  ))}
                </div>
              )}

              {/* Entities */}
              {suggestions.entities.length > 0 && (
                <div>
                  <p className="mb-1 px-2 text-xs font-semibold text-muted-foreground uppercase">
                    {language === "ar" ? "الجهات" : "Organizations"}
                  </p>
                  {suggestions.entities.map((entity: any) => (
                    <Link
                      key={entity.id}
                      to={`/entities/${entity.id}`}
                      onClick={handleResultClick}
                      className="flex items-center gap-3 rounded-md p-2 hover:bg-accent transition-colors"
                    >
                      {entity.logo_url ? (
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={entity.logo_url} />
                          <AvatarFallback><Building2 className="h-4 w-4" /></AvatarFallback>
                        </Avatar>
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded bg-chart-4/10">
                          <Building2 className="h-4 w-4 text-chart-4" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {language === "ar" && entity.name_ar ? entity.name_ar : entity.name}
                        </p>
                        {entity.type && (
                          <Badge variant="secondary" className="text-xs capitalize">{entity.type}</Badge>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {/* View All Results */}
              <div className="border-t pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-between"
                  onClick={() => handleSearch()}
                >
                  <span>{language === "ar" ? "عرض جميع النتائج" : "View all results"}</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Custom debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
