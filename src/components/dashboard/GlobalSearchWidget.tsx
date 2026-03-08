import { useState, useCallback, useRef, useEffect, memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { Search, Trophy, UtensilsCrossed, FileText, Users, ArrowRight, X, Loader2 } from "lucide-react";

interface SearchResult {
  id: string;
  title: string;
  type: "competition" | "recipe" | "article" | "chef";
  href: string;
  subtitle?: string;
}

const typeConfig = {
  competition: { icon: Trophy, color: "text-primary", bg: "bg-primary/10", label: "Competition", labelAr: "مسابقة" },
  recipe: { icon: UtensilsCrossed, color: "text-chart-4", bg: "bg-chart-4/10", label: "Recipe", labelAr: "وصفة" },
  article: { icon: FileText, color: "text-chart-2", bg: "bg-chart-2/10", label: "Article", labelAr: "مقال" },
  chef: { icon: Users, color: "text-chart-3", bg: "bg-chart-3/10", label: "Chef", labelAr: "طاهي" },
};

export function GlobalSearchWidget() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const debouncedQuery = useDebounce(query, 300);

  const { data: results = [], isFetching } = useQuery({
    queryKey: ["global-search", debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) return [];
      const searchResults: SearchResult[] = [];

      const [comps, recipes, articles, chefs] = await Promise.all([
        supabase.from("competitions").select("id, title, title_ar, country_code").or(`title.ilike.%${debouncedQuery}%,title_ar.ilike.%${debouncedQuery}%`).limit(3),
        supabase.from("recipes").select("id, title, title_ar, category").or(`title.ilike.%${debouncedQuery}%,title_ar.ilike.%${debouncedQuery}%`).eq("is_published", true).limit(3),
        supabase.from("articles").select("id, title, title_ar, slug, type").or(`title.ilike.%${debouncedQuery}%,title_ar.ilike.%${debouncedQuery}%`).eq("status", "published").limit(3),
        supabase.from("profiles").select("user_id, full_name, full_name_ar, username, specialization").or(`full_name.ilike.%${debouncedQuery}%,full_name_ar.ilike.%${debouncedQuery}%,username.ilike.%${debouncedQuery}%`).eq("account_type", "professional").limit(3),
      ]);

      comps.data?.forEach(c => searchResults.push({
        id: c.id, title: isAr && c.title_ar ? c.title_ar : c.title, type: "competition", href: `/competitions/${c.id}`, subtitle: c.country_code || undefined,
      }));
      recipes.data?.forEach(r => searchResults.push({
        id: r.id, title: isAr && r.title_ar ? r.title_ar : r.title, type: "recipe", href: `/recipes/${r.id}`, subtitle: r.category || undefined,
      }));
      articles.data?.forEach(a => searchResults.push({
        id: a.id, title: isAr && a.title_ar ? a.title_ar : a.title, type: "article", href: `/articles/${a.slug}`, subtitle: a.type,
      }));
      chefs.data?.forEach(c => searchResults.push({
        id: c.user_id, title: isAr && c.full_name_ar ? c.full_name_ar : c.full_name || c.username || "", type: "chef", href: `/u/${c.username}`, subtitle: c.specialization || undefined,
      }));

      return searchResults;
    },
    enabled: debouncedQuery.length >= 2,
    staleTime: 30000,
  });

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setFocused(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const showResults = focused && query.length >= 2;

  return (
    <div ref={containerRef} className="relative mb-6">
      <div className="relative">
        <Search className="absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
        <Input
          ref={inputRef}
          placeholder={isAr ? "ابحث عن مسابقات، وصفات، طهاة، مقالات..." : "Search competitions, recipes, chefs, articles..."}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          className="h-12 border-border/40 bg-muted/20 ps-11 pe-10 text-sm transition-all focus:bg-background focus:ring-2 focus:ring-primary/20 rounded-2xl shadow-sm"
        />
        {query && (
          <button onClick={() => { setQuery(""); inputRef.current?.focus(); }} className="absolute end-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-muted transition-colors">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
        {isFetching && (
          <Loader2 className="absolute end-10 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-primary" />
        )}
      </div>

      {showResults && (
        <Card className="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border-border/40 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
          <CardContent className="p-2">
            {results.length === 0 && !isFetching ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                {isAr ? "لا توجد نتائج" : "No results found"}
              </div>
            ) : (
              <div className="space-y-0.5">
                {results.map((result) => {
                  const config = typeConfig[result.type];
                  return (
                    <Link
                      key={`${result.type}-${result.id}`}
                      to={result.href}
                      onClick={() => { setFocused(false); setQuery(""); }}
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-muted/60 group"
                    >
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${config.bg}`}>
                        <config.icon className={`h-4 w-4 ${config.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{result.title}</p>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4">
                            {isAr ? config.labelAr : config.label}
                          </Badge>
                          {result.subtitle && (
                            <span className="text-[10px] text-muted-foreground truncate">{result.subtitle}</span>
                          )}
                        </div>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity rtl:rotate-180 shrink-0" />
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function useDebounce(value: string, delay: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}
