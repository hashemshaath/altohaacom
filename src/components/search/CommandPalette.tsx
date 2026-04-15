import { CACHE } from "@/lib/queryConfig";
import { useIsAr } from "@/hooks/useIsAr";
import { useState, useEffect, useCallback, useRef, memo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ROUTES } from "@/config/routes";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search, Trophy, UtensilsCrossed, FileText, Users, ArrowRight,
  Home, Briefcase, ShoppingBag, Landmark, GraduationCap,
  Building2, Star, CalendarDays, Medal, HandHeart, Newspaper,
  Settings, User, LayoutDashboard, Command,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PaletteItem {
  id: string;
  title: string;
  titleAr?: string;
  type: "page" | "competition" | "recipe" | "article" | "chef";
  href: string;
  icon?: React.ElementType;
  subtitle?: string;
}

const quickPages: PaletteItem[] = [
  { id: "home", title: "Home", titleAr: "الرئيسية", type: "page", href: "/", icon: Home },
  { id: "dashboard", title: "Dashboard", titleAr: "لوحة التحكم", type: "page", href: "/dashboard", icon: LayoutDashboard },
  { id: "competitions", title: "Competitions", titleAr: "المسابقات", type: "page", href: "/competitions", icon: Trophy },
  { id: "exhibitions", title: "Exhibitions", titleAr: "المعارض", type: "page", href: "/exhibitions", icon: Landmark },
  { id: "jobs", title: "Jobs", titleAr: "الوظائف", type: "page", href: "/jobs", icon: Briefcase },
  { id: "shop", title: "Shop", titleAr: "المتجر", type: "page", href: "/shop", icon: ShoppingBag },
  { id: "recipes", title: "Recipes", titleAr: "الوصفات", type: "page", href: "/recipes", icon: UtensilsCrossed },
  { id: "blog", title: "News & Articles", titleAr: "الأخبار والمقالات", type: "page", href: "/blog", icon: Newspaper },
  { id: "masterclasses", title: "Masterclasses", titleAr: "الدروس المتقدمة", type: "page", href: "/masterclasses", icon: GraduationCap },
  { id: "entities", title: "Entities", titleAr: "الجهات", type: "page", href: "/entities", icon: Star },
  { id: "establishments", title: "Establishments", titleAr: "المؤسسات", type: "page", href: "/establishments", icon: Building2 },
  { id: "mentorship", title: "Mentorship", titleAr: "الإرشاد", type: "page", href: "/mentorship", icon: HandHeart },
  { id: "events", title: "Events Calendar", titleAr: "الفعاليات", type: "page", href: "/events-calendar", icon: CalendarDays },
  { id: "rankings", title: "Rankings", titleAr: "التصنيفات", type: "page", href: "/rankings", icon: Medal },
  { id: "community", title: "Community", titleAr: "المجتمع", type: "page", href: "/community", icon: Users },
  { id: "profile", title: "My Profile", titleAr: "ملفي الشخصي", type: "page", href: "/profile", icon: User },
  { id: "settings", title: "Settings", titleAr: "الإعدادات", type: "page", href: "/profile", icon: Settings },
];

const typeConfig: Record<string, { icon: React.ElementType; color: string; bg: string; label: string; labelAr: string }> = {
  page: { icon: ArrowRight, color: "text-muted-foreground", bg: "bg-muted/50", label: "Page", labelAr: "صفحة" },
  competition: { icon: Trophy, color: "text-primary", bg: "bg-primary/10", label: "Competition", labelAr: "مسابقة" },
  recipe: { icon: UtensilsCrossed, color: "text-chart-4", bg: "bg-chart-4/10", label: "Recipe", labelAr: "وصفة" },
  article: { icon: FileText, color: "text-chart-2", bg: "bg-chart-2/10", label: "Article", labelAr: "مقال" },
  chef: { icon: Users, color: "text-chart-3", bg: "bg-chart-3/10", label: "Chef", labelAr: "طاهي" },
};

function useDebounce(value: string, delay: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export const CommandPalette = memo(function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIdx, setSelectedIdx] = useState(0);
  const { user } = useAuth();
  const isAr = useIsAr();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  const debouncedQuery = useDebounce(query, 250);

  // Global keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(prev => !prev);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // Reset on open
  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIdx(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  // Filter quick pages
  const filteredPages = query.length > 0
    ? quickPages.filter(p => {
        const q = query.toLowerCase();
        return p.title.toLowerCase().includes(q) || (p.titleAr && p.titleAr.includes(q));
      })
    : quickPages.slice(0, 8);

  // Search DB results
  const { data: dbResults = [] } = useQuery({
    queryKey: ["cmd-palette-search", debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) return [];
      const results: PaletteItem[] = [];
      const q = debouncedQuery;

      const [comps, recipes, articles, chefs] = await Promise.all([
        supabase.from("competitions").select("id, title, title_ar").or(`title.ilike.%${q}%,title_ar.ilike.%${q}%`).limit(3),
        supabase.from("recipes").select("id, title, title_ar, category").or(`title.ilike.%${q}%,title_ar.ilike.%${q}%`).eq("is_published", true).limit(3),
        supabase.from("articles").select("id, title, title_ar, slug").or(`title.ilike.%${q}%,title_ar.ilike.%${q}%`).eq("status", "published").limit(3),
        supabase.from("profiles").select("user_id, full_name, full_name_ar, username").or(`full_name.ilike.%${q}%,full_name_ar.ilike.%${q}%`).eq("is_chef_visible", true).limit(3),
      ]);

      comps.data?.forEach(c => results.push({ id: c.id, title: isAr && c.title_ar ? c.title_ar : c.title, type: "competition", href: ROUTES.competition(c.id) }));
      recipes.data?.forEach(r => results.push({ id: r.id, title: isAr && r.title_ar ? r.title_ar : r.title, type: "recipe", href: ROUTES.recipe(r.id), subtitle: r.category || undefined }));
      articles.data?.forEach(a => results.push({ id: a.id, title: isAr && a.title_ar ? a.title_ar : a.title, type: "article", href: ROUTES.article(a.slug) }));
      chefs.data?.forEach(c => results.push({ id: c.user_id, title: isAr && c.full_name_ar ? c.full_name_ar : c.full_name || c.username || "", type: "chef", href: ROUTES.publicProfile(c.username || "") }));

      return results;
    },
    enabled: debouncedQuery.length >= 2,
    ...CACHE.realtime,
  });

  const allItems = [...filteredPages, ...dbResults];

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIdx(i => Math.min(i + 1, allItems.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIdx(i => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && allItems[selectedIdx]) {
      e.preventDefault();
      navigate(allItems[selectedIdx].href);
      setOpen(false);
    }
  }, [allItems, selectedIdx, navigate]);

  // Reset index when results change
  useEffect(() => setSelectedIdx(0), [query]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="p-0 gap-0 max-w-lg overflow-hidden rounded-2xl border-border/40 shadow-2xl [&>button]:hidden">
        {/* Search input */}
        <div className="flex items-center gap-3 border-b border-border/30 px-4 py-3">
          <Search className="h-5 w-5 text-muted-foreground/60 shrink-0" />
          <Input
            ref={inputRef}
            placeholder={isAr ? "ابحث عن صفحة أو محتوى..." : "Search pages, content..."}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="border-0 p-0 h-auto text-base shadow-none focus-visible:ring-0 bg-transparent placeholder:text-muted-foreground/40"
          />
          <kbd className="hidden sm:inline-flex h-6 items-center gap-0.5 rounded-md border border-border/50 bg-muted/50 px-1.5 text-[0.6875rem] font-mono text-muted-foreground/60">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {filteredPages.length > 0 && query.length < 2 && (
            <p className="px-3 py-1.5 text-[0.6875rem] font-medium text-muted-foreground/50 uppercase tracking-wider">
              {isAr ? "تنقل سريع" : "Quick Navigation"}
            </p>
          )}
          {query.length >= 2 && dbResults.length > 0 && filteredPages.length > 0 && (
            <p className="px-3 py-1.5 text-[0.6875rem] font-medium text-muted-foreground/50 uppercase tracking-wider">
              {isAr ? "الصفحات" : "Pages"}
            </p>
          )}

          {allItems.map((item, idx) => {
            const config = typeConfig[item.type];
            const Icon = item.icon || config.icon;
            const isSelected = idx === selectedIdx;

            // Section separator between pages and DB results
            const showDbHeader = idx === filteredPages.length && dbResults.length > 0 && query.length >= 2;

            return (
              <div key={`${item.type}-${item.id}`}>
                {showDbHeader && (
                  <p className="px-3 py-1.5 mt-1 text-[0.6875rem] font-medium text-muted-foreground/50 uppercase tracking-wider">
                    {isAr ? "نتائج البحث" : "Search Results"}
                  </p>
                )}
                <button
                  onClick={() => { navigate(item.href); setOpen(false); }}
                  onMouseEnter={() => setSelectedIdx(idx)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-start transition-colors",
                    isSelected ? "bg-primary/8 text-foreground" : "hover:bg-muted/50"
                  )}
                >
                  <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", config.bg)}>
                    <Icon className={cn("h-4 w-4", config.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{isAr && item.titleAr ? item.titleAr : item.title}</p>
                    {item.type !== "page" && (
                      <Badge variant="secondary" className="text-[0.625rem] px-1.5 py-0 h-4 mt-0.5">
                        {isAr ? config.labelAr : config.label}
                      </Badge>
                    )}
                  </div>
                  {isSelected && <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40 rtl:rotate-180 shrink-0" />}
                </button>
              </div>
            );
          })}

          {query.length >= 2 && allItems.length === 0 && (
            <div className="py-10 text-center">
              <Search className="mx-auto h-8 w-8 text-muted-foreground/20 mb-2" />
              <p className="text-sm text-muted-foreground">{isAr ? "لا توجد نتائج" : "No results found"}</p>
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div className="flex items-center justify-between border-t border-border/20 px-4 py-2 text-[0.6875rem] text-muted-foreground/40">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1"><kbd className="rounded border border-border/40 bg-muted/30 px-1">↑↓</kbd> {isAr ? "تنقل" : "Navigate"}</span>
            <span className="flex items-center gap-1"><kbd className="rounded border border-border/40 bg-muted/30 px-1">↵</kbd> {isAr ? "فتح" : "Open"}</span>
          </div>
          <span className="flex items-center gap-1">
            <Command className="h-3 w-3" />K {isAr ? "لفتح البحث" : "to search"}
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
});
