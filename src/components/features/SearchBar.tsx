/**
 * SearchBar — Homepage hero search with live dropdown.
 * Uses useGlobalSearch hook for results, recentSearches lib for history.
 *
 * Design tokens used (from src/index.css):
 *   bg/border/foreground: --background, --border, --foreground, --muted-foreground
 *   accent: --primary (warm orange), --primary-foreground
 *   highlight: --accent / --secondary (cream)
 */
import { useState, useEffect, useRef, useCallback, useMemo, memo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X, Clock, TrendingUp, Loader2, FileQuestion } from "lucide-react";
import { useIsAr } from "@/hooks/useIsAr";
import { useGlobalSearch } from "@/hooks/useGlobalSearch";
import { fetchTrendingTags } from "@/services/searchService";
import {
  getRecentSearches,
  addRecentSearch,
  removeRecentSearch,
} from "@/lib/recentSearches";
import { ROUTES } from "@/config/routes";
import { cn } from "@/lib/utils";

const TRENDING_TAGS_AR = ["دجاج", "باستا", "حلويات", "شوربة", "سلطات", "مشاوي", "بيتزا"];
const TRENDING_TAGS_EN = ["Chicken", "Pasta", "Desserts", "Soup", "Salads", "Grills", "Pizza"];

interface FlatResult {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl?: string;
  href: string;
  groupKey: "recipes" | "members" | "competitions" | "articles" | "exhibitions" | "entities";
  groupLabel: { en: string; ar: string };
}

export interface SearchBarProps {
  className?: string;
  autoFocus?: boolean;
  placeholder?: string;
}

export const SearchBar = memo(function SearchBar({
  className,
  autoFocus = false,
  placeholder,
}: SearchBarProps) {
  const isAr = useIsAr();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [recents, setRecents] = useState<string[]>([]);

  const { filters, updateFilter, results, isLoading, preloadPopular } = useGlobalSearch();
  const query = filters.query;
  const trimmed = query.trim();

  // ── Hydrate recents on mount ──
  useEffect(() => {
    setRecents(getRecentSearches());
  }, []);

  // ── Click outside closes dropdown ──
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // ── Auto-focus ──
  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  // ── Flatten results into one list (for keyboard nav) ──
  const flatResults = useMemo<FlatResult[]>(() => {
    if (trimmed.length < 2) return [];
    const out: FlatResult[] = [];
    const labels = {
      recipes: { en: "RECIPES", ar: "وصفات" },
      members: { en: "PEOPLE", ar: "أشخاص" },
      competitions: { en: "COMPETITIONS", ar: "مسابقات" },
      exhibitions: { en: "EXHIBITIONS", ar: "معارض" },
      articles: { en: "ARTICLES", ar: "مقالات" },
      entities: { en: "ORGANIZATIONS", ar: "جهات" },
    } as const;

    for (const r of results.recipes.slice(0, 3)) {
      out.push({
        id: `recipe-${r.id}`,
        title: (isAr && r.title_ar) || r.title,
        subtitle: (isAr && r.description_ar) || r.description || undefined,
        imageUrl: r.image_url || undefined,
        href: r.slug ? ROUTES.recipe(r.slug) : `/recipes/${r.id}`,
        groupKey: "recipes",
        groupLabel: labels.recipes,
      });
    }
    for (const m of results.members.slice(0, 3)) {
      const name = (isAr && (m.full_name_ar || m.display_name_ar)) || m.display_name || m.full_name || m.username || "—";
      out.push({
        id: `member-${m.user_id}`,
        title: name,
        subtitle: (isAr && m.specialization_ar) || m.specialization || m.location || undefined,
        imageUrl: m.avatar_url || undefined,
        href: m.username ? ROUTES.profile(m.username) : `/profile/${m.user_id}`,
        groupKey: "members",
        groupLabel: labels.members,
      });
    }
    for (const c of results.competitions.slice(0, 2)) {
      out.push({
        id: `comp-${c.id}`,
        title: (isAr && c.title_ar) || c.title,
        subtitle: c.city || c.country || undefined,
        imageUrl: c.cover_image_url || undefined,
        href: ROUTES.competition(c.id),
        groupKey: "competitions",
        groupLabel: labels.competitions,
      });
    }
    for (const ex of results.exhibitions.slice(0, 2)) {
      out.push({
        id: `exh-${ex.id}`,
        title: (isAr && ex.title_ar) || ex.title,
        subtitle: ex.city || ex.country || undefined,
        imageUrl: ex.cover_image_url || undefined,
        href: ROUTES.exhibition(ex.slug),
        groupKey: "exhibitions",
        groupLabel: labels.exhibitions,
      });
    }
    for (const a of results.articles.slice(0, 2)) {
      out.push({
        id: `art-${a.id}`,
        title: (isAr && a.title_ar) || a.title,
        subtitle: (isAr && a.excerpt_ar) || a.excerpt || undefined,
        imageUrl: a.featured_image_url || undefined,
        href: ROUTES.article(a.slug),
        groupKey: "articles",
        groupLabel: labels.articles,
      });
    }
    return out;
  }, [results, isAr, trimmed]);

  // ── Reset selection when results change ──
  useEffect(() => {
    setSelectedIndex(-1);
  }, [flatResults.length]);

  const showRecents = trimmed.length < 2;
  const showResults = trimmed.length >= 2;
  const hasResults = flatResults.length > 0;
  const showEmpty = showResults && !isLoading && !hasResults;

  // ── Handlers ──
  const handleClear = useCallback(() => {
    updateFilter("query", "");
    inputRef.current?.focus();
  }, [updateFilter]);

  const submitQuery = useCallback(
    (q: string) => {
      const t = q.trim();
      if (!t) return;
      addRecentSearch(t);
      setRecents(getRecentSearches());
      setOpen(false);
      navigate(`${ROUTES.search}?q=${encodeURIComponent(t)}`);
    },
    [navigate]
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      submitQuery(query);
    },
    [query, submitQuery]
  );

  const navigateToResult = useCallback(
    (r: FlatResult) => {
      addRecentSearch(trimmed);
      setRecents(getRecentSearches());
      setOpen(false);
      navigate(r.href);
    },
    [navigate, trimmed]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!open) return;
      if (e.key === "Escape") {
        setOpen(false);
        inputRef.current?.blur();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, flatResults.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, -1));
      } else if (e.key === "Enter") {
        if (selectedIndex >= 0 && flatResults[selectedIndex]) {
          e.preventDefault();
          navigateToResult(flatResults[selectedIndex]);
        }
      }
    },
    [open, flatResults, selectedIndex, navigateToResult]
  );

  const dropdownVisible = open && (isLoading || showRecents || hasResults || showEmpty);
  const [dynamicTrending, setDynamicTrending] = useState<string[] | null>(null);
  useEffect(() => {
    if (!open || dynamicTrending) return;
    fetchTrendingTags(7).then(setDynamicTrending).catch(() => { /* fallback handled in service */ });
  }, [open, dynamicTrending]);
  const fallbackTags = isAr ? TRENDING_TAGS_AR : TRENDING_TAGS_EN;
  const trendingTags = dynamicTrending && dynamicTrending.length > 0 ? dynamicTrending : fallbackTags;
  const placeholderText =
    placeholder ?? (isAr ? "ابحث عن وصفة، طاهٍ، أو مسابقة..." : "Search recipes, chefs, competitions...");

  // Highlight matching text within a string
  const highlight = useCallback(
    (text: string) => {
      if (!trimmed || trimmed.length < 2) return text;
      const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const parts = text.split(new RegExp(`(${escaped})`, "gi"));
      return parts.map((part, i) =>
        part.toLowerCase() === trimmed.toLowerCase() ? (
          <mark key={i} className="bg-accent/60 text-accent-foreground rounded px-0.5">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      );
    },
    [trimmed]
  );

  return (
    <div
      ref={containerRef}
      className={cn("relative w-full max-w-[680px] mx-auto", className)}
      dir={isAr ? "rtl" : "ltr"}
    >
      {/* ── Container ── */}
      <form
        onSubmit={handleSubmit}
        className={cn(
          "flex items-center gap-2 px-4",
          "h-12 sm:h-14 w-full",
          "bg-background border-[1.5px] border-border/60 rounded-2xl",
          "transition-all duration-200",
          "focus-within:border-primary focus-within:shadow-[0_0_0_4px_hsl(var(--primary)/0.1)]",
          dropdownVisible && "rounded-b-none focus-within:shadow-none"
        )}
      >
        <Search className="h-5 w-5 text-muted-foreground/70 shrink-0" aria-hidden="true" />

        <input
          ref={inputRef}
          type="search"
          role="combobox"
          aria-expanded={dropdownVisible}
          aria-controls="searchbar-dropdown"
          aria-autocomplete="list"
          value={query}
          onChange={(e) => updateFilter("query", e.target.value)}
          onFocus={() => { setOpen(true); preloadPopular(); }}
          onKeyDown={handleKeyDown}
          placeholder={placeholderText}
          className={cn(
            "flex-1 bg-transparent border-0 outline-none",
            "text-base placeholder:text-muted-foreground/60",
            "min-w-0"
          )}
          dir={isAr ? "rtl" : "ltr"}
        />

        {/* Clear button */}
        <button
          type="button"
          onClick={handleClear}
          aria-label={isAr ? "مسح" : "Clear"}
          className={cn(
            "h-8 w-8 flex items-center justify-center rounded-full shrink-0",
            "text-muted-foreground hover:bg-muted/60 transition-opacity duration-200",
            query ? "opacity-100" : "opacity-0 pointer-events-none"
          )}
        >
          <X className="h-4 w-4" />
        </button>

        {/* Submit button — desktop: text, mobile: icon */}
        <button
          type="submit"
          aria-label={isAr ? "بحث" : "Search"}
          className={cn(
            "h-10 shrink-0 rounded-xl bg-primary text-primary-foreground font-semibold",
            "transition-colors hover:bg-primary/90 active:scale-95",
            "flex items-center justify-center",
            "w-10 sm:w-auto sm:px-5 text-sm"
          )}
        >
          <Search className="h-4 w-4 sm:hidden" />
          <span className="hidden sm:inline">{isAr ? "بحث" : "Search"}</span>
        </button>
      </form>

      {/* ── Dropdown ── */}
      {dropdownVisible && (
        <div
          id="searchbar-dropdown"
          role="listbox"
          className={cn(
            "absolute inset-x-0 top-full z-[100]",
            "bg-background border-[1.5px] border-primary border-t-0",
            "rounded-b-2xl overflow-hidden",
            "shadow-[0_16px_40px_-12px_hsl(var(--foreground)/0.12)]",
            "max-h-[60vh] sm:max-h-[480px] overflow-y-auto",
            "animate-in fade-in-0 slide-in-from-top-2 duration-150"
          )}
        >
          {/* LOADING */}
          {isLoading && (
            <div className="p-3 space-y-1">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-12 rounded-lg bg-gradient-to-r from-muted/30 via-muted/50 to-muted/30 animate-pulse"
                />
              ))}
            </div>
          )}

          {/* RECENTS + TRENDING (when query empty) */}
          {!isLoading && showRecents && (
            <>
              {recents.length > 0 && (
                <div>
                  <div className="px-4 pt-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70">
                    {isAr ? "عمليات البحث الأخيرة" : "Recent Searches"}
                  </div>
                  {recents.map((r) => (
                    <div
                      key={r}
                      className="group flex items-center gap-3 h-11 px-4 hover:bg-muted/40 cursor-pointer transition-colors"
                      onClick={() => {
                        updateFilter("query", r);
                        submitQuery(r);
                      }}
                    >
                      <Clock className="h-4 w-4 text-muted-foreground/60 shrink-0" />
                      <span className="flex-1 text-sm text-foreground truncate">{r}</span>
                      <button
                        type="button"
                        aria-label={isAr ? "حذف" : "Remove"}
                        onClick={(e) => {
                          e.stopPropagation();
                          removeRecentSearch(r);
                          setRecents(getRecentSearches());
                        }}
                        className="h-7 w-7 flex items-center justify-center rounded-full text-muted-foreground/60 hover:bg-muted/80 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div>
                <div className="flex items-center gap-1.5 px-4 pt-4 pb-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70">
                  <TrendingUp className="h-3 w-3" />
                  {isAr ? "الأكثر بحثاً" : "Trending"}
                </div>
                <div className="px-4 pb-4 flex flex-wrap gap-2">
                  {trendingTags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => {
                        updateFilter("query", tag);
                        submitQuery(tag);
                      }}
                      className="px-3 py-1.5 rounded-full bg-accent/40 text-accent-foreground text-[13px] font-medium hover:bg-accent/60 transition-colors"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* RESULTS */}
          {!isLoading && showResults && hasResults && (
            <div>
              {(() => {
                let lastGroup: string | null = null;
                return flatResults.map((r, idx) => {
                  const showLabel = r.groupKey !== lastGroup;
                  lastGroup = r.groupKey;
                  const selected = idx === selectedIndex;
                  return (
                    <div key={r.id}>
                      {showLabel && (
                        <div className="px-4 pt-3 pb-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70">
                          {isAr ? r.groupLabel.ar : r.groupLabel.en}
                        </div>
                      )}
                      <div
                        role="option"
                        aria-selected={selected}
                        onClick={() => navigateToResult(r)}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        className={cn(
                          "flex items-center gap-3 h-12 px-4 cursor-pointer transition-colors",
                          "hover:bg-muted/40",
                          selected && "bg-primary/8 border-e-[3px] border-primary"
                        )}
                      >
                        <div className="h-9 w-9 rounded-lg overflow-hidden bg-muted shrink-0 flex items-center justify-center">
                          {r.imageUrl ? (
                            <img
                              src={r.imageUrl}
                              alt=""
                              className="h-full w-full object-cover"
                              loading="lazy"
                              decoding="async"
                            />
                          ) : (
                            <Search className="h-4 w-4 text-muted-foreground/40" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[15px] font-medium text-foreground truncate">
                            {highlight(r.title)}
                          </div>
                          {r.subtitle && (
                            <div className="text-[13px] text-muted-foreground truncate">
                              {r.subtitle}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          )}

          {/* EMPTY STATE */}
          {showEmpty && (
            <div className="py-10 px-6 text-center">
              <FileQuestion className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm font-semibold text-foreground mb-1">
                {isAr ? "لا توجد نتائج" : "No results"}
              </p>
              <p className="text-xs text-muted-foreground">
                {isAr
                  ? "جرّب كلمات مختلفة أو تحقق من الإملاء"
                  : "Try different keywords or check spelling"}
              </p>
            </div>
          )}

          {/* FOOTER — view all results */}
          {!isLoading && showResults && hasResults && (
            <button
              type="button"
              onClick={() => submitQuery(query)}
              className={cn(
                "w-full h-12 flex items-center justify-center",
                "bg-muted/40 text-primary font-semibold text-sm",
                "hover:bg-muted/60 transition-colors border-t border-border/40"
              )}
            >
              {isAr ? `عرض كل النتائج لـ "${trimmed}"` : `View all results for "${trimmed}"`}
            </button>
          )}
        </div>
      )}

      {/* Loading indicator inline */}
      {isLoading && open && (
        <Loader2
          className="absolute top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground"
          style={{ [isAr ? "left" : "right"]: 100 }}
          aria-hidden="true"
        />
      )}
    </div>
  );
});
