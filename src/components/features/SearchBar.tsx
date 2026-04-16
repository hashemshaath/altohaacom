/**
 * SearchBar — Homepage hero search with live dropdown (desktop) + bottom sheet (mobile).
 *
 * MOBILE BEHAVIOR (≤767px):
 *   • Input: height 48px, font-size 16px (prevents iOS Safari zoom-on-focus)
 *   • On focus: full-screen backdrop + bottom sheet slides up from bottom
 *   • Sheet: max-height 70vh, rounded top corners, drag handle, backdrop tap closes
 *   • Body scroll locked while sheet is open
 *   • Results capped at 6 (vs 8 on desktop)
 *   • Each result row ≥52px tall, contain:layout style for paint isolation
 *   • touch-action:manipulation on all interactive elements
 *   • -webkit-overflow-scrolling:touch on results list
 *
 * Design tokens (from src/index.css):
 *   --background, --border, --foreground, --muted-foreground, --primary, --accent
 */
import { useState, useEffect, useRef, useCallback, useMemo, memo } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { Search, X, Clock, TrendingUp, Loader2, FileQuestion, WifiOff, RefreshCw } from "lucide-react";
import { useIsAr } from "@/hooks/useIsAr";
import { useGlobalSearch } from "@/hooks/useGlobalSearch";
import { fetchTrendingTags } from "@/services/searchService";
import {
  getRecentSearches,
  addRecentSearch,
  removeRecentSearch,
  subscribeRecentSearches,
} from "@/lib/recentSearches";
import { ROUTES } from "@/config/routes";
import { cn } from "@/lib/utils";

const TRENDING_TAGS_AR = ["دجاج", "باستا", "حلويات", "شوربة", "سلطات", "مشاوي", "بيتزا"];
const TRENDING_TAGS_EN = ["Chicken", "Pasta", "Desserts", "Soup", "Salads", "Grills", "Pizza"];

const MOBILE_BREAKPOINT = 768; // <768px = mobile (matches Tailwind `md`)

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

/** Detect mobile viewport. Re-evaluates on resize. */
function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < MOBILE_BREAKPOINT : false
  );
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    setIsMobile(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return isMobile;
}

/** Lock body scroll while a value is true (mobile sheet). */
function useBodyScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return;
    const original = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;
    // Compensate for scrollbar width to avoid layout shift
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`;
    return () => {
      document.body.style.overflow = original;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, [locked]);
}

export const SearchBar = memo(function SearchBar({
  className,
  autoFocus = false,
  placeholder,
}: SearchBarProps) {
  const isAr = useIsAr();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const sheetInputRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [recents, setRecents] = useState<string[]>([]);

  const { filters, updateFilter, results, isLoading, error, refetch, preloadPopular } = useGlobalSearch();
  const query = filters.query;
  const trimmed = query.trim();

  // ── Mobile: lock body scroll while sheet is open ──
  useBodyScrollLock(isMobile && open);

  // ── Hydrate recents on mount + subscribe to changes (so "Recent Searches" stays in sync after navigate→back) ──
  useEffect(() => {
    setRecents(getRecentSearches());
    return subscribeRecentSearches(() => setRecents(getRecentSearches()));
  }, []);

  // ── Click outside closes dropdown (desktop only — mobile uses backdrop) ──
  useEffect(() => {
    if (!open || isMobile) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, isMobile]);

  // ── Auto-focus ──
  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  // ── Mobile: focus the sheet input when it opens ──
  useEffect(() => {
    if (isMobile && open) {
      // Slight delay so the sheet is in the DOM before focusing
      const t = setTimeout(() => sheetInputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [isMobile, open]);

  // ── Flatten results into one list (mobile capped at 6, desktop at ~12) ──
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

    // Per-group caps — slightly tighter on mobile
    const cap = isMobile
      ? { recipes: 2, members: 2, competitions: 1, exhibitions: 1, articles: 1 }
      : { recipes: 3, members: 3, competitions: 2, exhibitions: 2, articles: 2 };
    const max = isMobile ? 6 : 12;

    for (const r of results.recipes.slice(0, cap.recipes)) {
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
    for (const m of results.members.slice(0, cap.members)) {
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
    for (const c of results.competitions.slice(0, cap.competitions)) {
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
    for (const ex of results.exhibitions.slice(0, cap.exhibitions)) {
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
    for (const a of results.articles.slice(0, cap.articles)) {
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
    return out.slice(0, max);
  }, [results, isAr, trimmed, isMobile]);

  // ── Reset selection when results change ──
  useEffect(() => {
    setSelectedIndex(-1);
  }, [flatResults.length]);

  const showRecents = trimmed.length < 2;
  const showResults = trimmed.length >= 2;
  const hasResults = flatResults.length > 0;
  const showError = showResults && !isLoading && !!error;
  const showEmpty = showResults && !isLoading && !hasResults && !error;

  // ── Handlers ──
  const handleClear = useCallback(() => {
    updateFilter("query", "");
    (isMobile ? sheetInputRef : inputRef).current?.focus();
  }, [updateFilter, isMobile]);

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
        sheetInputRef.current?.blur();
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

  // ── Shared dropdown body (used by both desktop dropdown and mobile sheet) ──
  const dropdownBody = (
    <>
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

      {/* RECENTS + TRENDING */}
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
                  style={{ touchAction: "manipulation", contain: "layout style" }}
                  className={cn(
                    "group flex items-center gap-3 px-4 hover:bg-muted/40 cursor-pointer transition-colors",
                    isMobile ? "min-h-[52px]" : "h-11"
                  )}
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
                    style={{ touchAction: "manipulation" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      removeRecentSearch(r);
                      setRecents(getRecentSearches());
                    }}
                    className={cn(
                      "flex items-center justify-center rounded-full text-muted-foreground/60 hover:bg-muted/80 transition-opacity",
                      // ≥44px touch target on mobile per Apple HIG / WCAG AA
                      isMobile ? "h-11 w-11 opacity-100" : "h-7 w-7 opacity-0 group-hover:opacity-100"
                    )}
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
                  style={{ touchAction: "manipulation" }}
                  onClick={() => {
                    updateFilter("query", tag);
                    submitQuery(tag);
                  }}
                  className={cn(
                    "rounded-full bg-accent/40 text-accent-foreground font-medium hover:bg-accent/60 transition-colors",
                    isMobile ? "px-4 py-2 text-sm min-h-[36px]" : "px-3 py-1.5 text-[13px]"
                  )}
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
                    style={{ touchAction: "manipulation", contain: "layout style" }}
                    className={cn(
                      "flex items-center gap-3 px-4 cursor-pointer transition-colors",
                      "hover:bg-muted/40",
                      isMobile ? "min-h-[52px] py-2" : "h-12",
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
            {isAr ? "جرّب كلمات مختلفة أو تحقق من الإملاء" : "Try different keywords or check spelling"}
          </p>
        </div>
      )}

      {/* FOOTER — view all results */}
      {!isLoading && showResults && hasResults && (
        <button
          type="button"
          onClick={() => submitQuery(query)}
          style={{ touchAction: "manipulation" }}
          className={cn(
            "w-full flex items-center justify-center",
            "bg-muted/40 text-primary font-semibold text-sm",
            "hover:bg-muted/60 transition-colors border-t border-border/40",
            isMobile ? "min-h-[52px] py-3" : "h-12"
          )}
        >
          {isAr ? `عرض كل النتائج لـ "${trimmed}"` : `View all results for "${trimmed}"`}
        </button>
      )}
    </>
  );

  return (
    <div
      ref={containerRef}
      className={cn("relative w-full max-w-[680px] mx-auto", className)}
      dir={isAr ? "rtl" : "ltr"}
    >
      {/* ── Trigger input (always visible). On mobile this opens the sheet. ── */}
      <form
        onSubmit={handleSubmit}
        className={cn(
          "flex items-center gap-2",
          // Mobile: 48px tall, 12px radius, 16px side margins via mx-4
          // Desktop: 56px tall, 16px radius (rounded-2xl)
          "h-12 md:h-14 rounded-xl md:rounded-2xl",
          "px-3 md:px-4 mx-4 md:mx-0 w-[calc(100%-32px)] md:w-full",
          "bg-background border-[1.5px] border-border/60",
          "transition-all duration-200",
          "focus-within:border-primary focus-within:shadow-[0_0_0_4px_hsl(var(--primary)/0.1)]",
          // Desktop dropdown flush look
          !isMobile && dropdownVisible && "rounded-b-none focus-within:shadow-none"
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
          // CRITICAL: 16px font-size on mobile to prevent iOS Safari zoom-on-focus
          style={{ fontSize: "1rem", touchAction: "manipulation" }}
          className={cn(
            "flex-1 bg-transparent border-0 outline-none",
            "placeholder:text-muted-foreground/60 min-w-0"
          )}
          dir={isAr ? "rtl" : "ltr"}
          // Read-only on mobile while sheet is open avoids double keyboard flicker
          readOnly={isMobile && open}
        />

        {/* Clear button — 44px on mobile (a11y touch target), 32px on desktop */}
        <button
          type="button"
          onClick={handleClear}
          aria-label={isAr ? "مسح" : "Clear"}
          style={{ touchAction: "manipulation" }}
          className={cn(
            "flex items-center justify-center rounded-full shrink-0",
            "h-11 w-11 md:h-8 md:w-8",
            "text-muted-foreground hover:bg-muted/60 transition-opacity duration-200",
            query ? "opacity-100" : "opacity-0 pointer-events-none"
          )}
        >
          <X className="h-4 w-4" />
        </button>

        {/* Submit — icon on mobile (44px), text on desktop */}
        <button
          type="submit"
          aria-label={isAr ? "بحث" : "Search"}
          style={{ touchAction: "manipulation" }}
          className={cn(
            "shrink-0 rounded-lg md:rounded-xl bg-primary text-primary-foreground font-semibold",
            "h-11 w-11 md:h-10 md:w-auto md:px-5 text-sm",
            "transition-colors hover:bg-primary/90 active:scale-95",
            "flex items-center justify-center"
          )}
        >
          <Search className="h-4 w-4 md:hidden" />
          <span className="hidden md:inline">{isAr ? "بحث" : "Search"}</span>
        </button>
      </form>

      {/* ── DESKTOP DROPDOWN ── */}
      {!isMobile && dropdownVisible && (
        <div
          id="searchbar-dropdown"
          role="listbox"
          className={cn(
            "absolute inset-x-0 top-full z-[100]",
            "bg-background border-[1.5px] border-primary border-t-0",
            "rounded-b-2xl overflow-hidden",
            "shadow-[0_16px_40px_-12px_hsl(var(--foreground)/0.12)]",
            "max-h-[480px] overflow-y-auto",
            "animate-in fade-in-0 slide-in-from-top-2 duration-150"
          )}
        >
          {dropdownBody}
        </div>
      )}

      {/* ── MOBILE BOTTOM SHEET (portal) ── */}
      {isMobile && open && typeof document !== "undefined" && createPortal(
        <div
          className="fixed inset-0 z-[200]"
          role="dialog"
          aria-modal="true"
          aria-label={isAr ? "بحث" : "Search"}
          dir={isAr ? "rtl" : "ltr"}
        >
          {/* Backdrop — rgba(28,28,26,0.4) ≈ foreground/40 */}
          <button
            type="button"
            aria-label={isAr ? "إغلاق البحث" : "Close search"}
            onClick={() => setOpen(false)}
            style={{ touchAction: "manipulation" }}
            className={cn(
              "absolute inset-0 bg-foreground/40",
              "animate-in fade-in-0 duration-200"
            )}
          />

          {/* Sheet */}
          <div
            id="searchbar-dropdown"
            role="listbox"
            className={cn(
              "absolute inset-x-0 bottom-0",
              "bg-background rounded-t-[20px]",
              "shadow-[0_-12px_40px_-8px_hsl(var(--foreground)/0.25)]",
              "flex flex-col max-h-[70vh]",
              "animate-in slide-in-from-bottom duration-300 ease-out"
            )}
            style={{ contain: "layout style" }}
          >
            {/* Drag handle */}
            <div className="pt-3 pb-2 flex justify-center shrink-0">
              <div className="h-1 w-10 rounded-full bg-foreground/15" />
            </div>

            {/* Sheet input — 40px tall, 16px font-size */}
            <form
              onSubmit={handleSubmit}
              className="px-4 pb-3 shrink-0"
            >
              <div
                className={cn(
                  "flex items-center gap-2 px-3",
                  "h-10 rounded-lg",
                  "bg-muted/50 border border-border/60",
                  "focus-within:border-primary focus-within:bg-background"
                )}
              >
                <Search className="h-4 w-4 text-muted-foreground/70 shrink-0" aria-hidden="true" />
                <input
                  ref={sheetInputRef}
                  type="search"
                  value={query}
                  onChange={(e) => updateFilter("query", e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={placeholderText}
                  style={{ fontSize: "1rem", touchAction: "manipulation" }}
                  className="flex-1 bg-transparent border-0 outline-none placeholder:text-muted-foreground/60 min-w-0"
                  dir={isAr ? "rtl" : "ltr"}
                  autoComplete="off"
                />
                {query && (
                  <button
                    type="button"
                    onClick={handleClear}
                    aria-label={isAr ? "مسح" : "Clear"}
                    style={{ touchAction: "manipulation" }}
                    className="h-7 w-7 flex items-center justify-center rounded-full shrink-0 text-muted-foreground hover:bg-muted"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label={isAr ? "إلغاء" : "Cancel"}
                  style={{ touchAction: "manipulation" }}
                  className="text-sm font-semibold text-primary shrink-0 ps-1"
                >
                  {isAr ? "إلغاء" : "Cancel"}
                </button>
              </div>
            </form>

            {/* Scrollable results region */}
            <div
              className="flex-1 overflow-y-auto overscroll-contain"
              style={{ WebkitOverflowScrolling: "touch" }}
            >
              {dropdownBody}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Loading indicator inline (desktop only) */}
      {!isMobile && isLoading && open && (
        <Loader2
          className="absolute top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground"
          style={{ [isAr ? "left" : "right"]: 100 }}
          aria-hidden="true"
        />
      )}
    </div>
  );
});
