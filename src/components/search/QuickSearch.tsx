import { useState, useRef, useEffect } from "react";
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
} from "lucide-react";
import { getRecentSearches, addRecentSearch, clearRecentSearches } from "@/lib/recentSearches";

interface QuickSearchProps {
  onClose?: () => void;
}

export function QuickSearch({ onClose }: QuickSearchProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debouncedQuery = useDebounce(query, 300);

  // Load recent searches on mount
  useEffect(() => {
    setRecentSearches(getRecentSearches());
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
        return { competitions: [], articles: [], members: [] };
      }

      const searchPattern = `%${debouncedQuery}%`;

      const [competitionsRes, articlesRes, membersRes] = await Promise.all([
        supabase
          .from("competitions")
          .select("id, title, title_ar, status, cover_image_url")
          .neq("status", "draft")
          .or(`title.ilike.${searchPattern},title_ar.ilike.${searchPattern}`)
          .limit(3),
        supabase
          .from("articles")
          .select("id, title, title_ar, slug, type, featured_image_url")
          .eq("status", "published")
          .or(`title.ilike.${searchPattern},title_ar.ilike.${searchPattern}`)
          .limit(3),
        supabase
          .from("profiles")
          .select("id, user_id, username, full_name, avatar_url, specialization")
          .or(`full_name.ilike.${searchPattern},username.ilike.${searchPattern},specialization.ilike.${searchPattern}`)
          .limit(3),
      ]);

      return {
        competitions: competitionsRes.data || [],
        articles: articlesRes.data || [],
        members: membersRes.data || [],
      };
    },
    enabled: debouncedQuery.length >= 2,
  });

  const hasResults = suggestions && (
    suggestions.competitions.length > 0 || 
    suggestions.articles.length > 0 || 
    suggestions.members.length > 0
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

  const handleResultClick = () => {
    if (query.trim()) {
      addRecentSearch(query.trim());
      setRecentSearches(getRecentSearches());
    }
    setIsOpen(false);
    setQuery("");
    onClose?.();
  };

  const showRecent = isOpen && query.length < 2 && recentSearches.length > 0;
  const showResults = isOpen && query.length >= 2;

  return (
    <div ref={containerRef} className="relative w-full max-w-sm">
      <form onSubmit={handleSearch}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
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
            className="pl-9 pr-8"
          />
          {query && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2"
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

      {/* Recent Searches Dropdown */}
      {showRecent && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-md border bg-popover p-2 shadow-lg">
          <div className="flex items-center justify-between px-2 mb-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase">
              {language === "ar" ? "عمليات البحث الأخيرة" : "Recent Searches"}
            </p>
            <Button variant="ghost" size="sm" className="h-6 px-1.5 text-xs text-muted-foreground" onClick={handleClearRecent}>
              <Trash2 className="h-3 w-3 me-1" />
              {language === "ar" ? "مسح" : "Clear"}
            </Button>
          </div>
          {recentSearches.map((term) => (
            <button
              key={term}
              onClick={() => handleRecentClick(term)}
              className="flex w-full items-center gap-3 rounded-md p-2 text-sm hover:bg-accent transition-colors text-start"
            >
              <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="truncate">{term}</span>
            </button>
          ))}
        </div>
      )}

      {/* Search Results Dropdown */}
      {showResults && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-md border bg-popover p-2 shadow-lg">
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
