import { useState, useRef, useEffect, forwardRef } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { Search, Trophy, Globe, ChefHat, Utensils, BookOpen, Store, TrendingUp, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const categories = [
  { key: "all", icon: Search, labelEn: "All", labelAr: "الكل" },
  { key: "competitions", icon: Trophy, labelEn: "Competitions", labelAr: "المسابقات" },
  { key: "exhibitions", icon: Globe, labelEn: "Exhibitions", labelAr: "المعارض" },
  { key: "chefs", icon: ChefHat, labelEn: "Chefs", labelAr: "الطهاة" },
  { key: "chefs-table", icon: Utensils, labelEn: "Chef's Table", labelAr: "طاولة الشيف" },
  { key: "masterclasses", icon: BookOpen, labelEn: "Masterclasses", labelAr: "ماستركلاس" },
  { key: "shop", icon: Store, labelEn: "Shop", labelAr: "المتجر" },
];

export const HomeSearch = forwardRef<HTMLElement>(function HomeSearch(_props, ref) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const { data: trending = [] } = useQuery({
    queryKey: ["home-search-trending"],
    queryFn: async () => {
      const { data } = await supabase
        .from("articles")
        .select("id, title, title_ar, slug, type")
        .eq("status", "published")
        .order("view_count", { ascending: false })
        .limit(4);
      return data || [];
    },
    staleTime: 1000 * 60 * 15,
  });

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuggestions(false);
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}&type=${activeCategory === "all" ? "" : activeCategory}`);
    }
  };

  return (
    <section ref={ref} className="relative z-30 px-5 sm:px-6 py-2.5 sm:py-3" aria-label={isAr ? "البحث السريع" : "Quick search"} dir={isAr ? "rtl" : "ltr"}>
      <div className="container">
        <div ref={wrapperRef} className="mx-auto max-w-2xl rounded-2xl border border-border/30 bg-card/90 backdrop-blur-xl p-3 shadow-lg shadow-primary/5 ring-1 ring-primary/5 sm:p-4">
          <div className="relative mb-2.5">
            <div className="flex gap-1.5 overflow-x-auto scrollbar-none" dir={isAr ? "rtl" : "ltr"}>
              {categories.map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => setActiveCategory(cat.key)}
                  className={cn(
                    "inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-all duration-200 touch-manipulation",
                    activeCategory === cat.key
                      ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                      : "bg-muted/30 text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <cat.icon className="h-3 w-3 shrink-0" />
                  {isAr ? cat.labelAr : cat.labelEn}
                </button>
              ))}
            </div>
            <div className="pointer-events-none absolute end-0 top-0 bottom-0 w-6 bg-gradient-to-l rtl:bg-gradient-to-r from-card/90 to-transparent" />
          </div>

          <form onSubmit={handleSearch} className="relative flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/40" />
              <Input
                ref={inputRef}
                value={query}
                onChange={(e) => { setQuery(e.target.value); setShowSuggestions(true); }}
                onFocus={() => setShowSuggestions(true)}
                placeholder={isAr ? "ابحث عن مسابقات، طهاة، معارض..." : "Search competitions, chefs, exhibitions..."}
                className="ps-9 h-10 text-[13px] rounded-lg border-border/30 bg-muted/20 focus:bg-background transition-colors"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => { setQuery(""); inputRef.current?.focus(); }}
                  className="absolute end-3 top-1/2 -translate-y-1/2 p-0.5 rounded-md hover:bg-muted transition-colors"
                >
                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              )}
            </div>
            <Button type="submit" size="default" className="h-10 px-5 shadow-sm shadow-primary/10 rounded-lg shrink-0 font-semibold text-[13px]">
              {isAr ? "بحث" : "Search"}
            </Button>
          </form>

          {showSuggestions && !query && trending.length > 0 && (
            <div className="mt-2 rounded-xl border border-border/30 bg-card p-3 shadow-lg animate-in fade-in-0 slide-in-from-top-1 duration-200">
              <div className="flex items-center gap-1.5 mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                <TrendingUp className="h-3 w-3" />
                {isAr ? "الأكثر رواجاً" : "Trending"}
              </div>
              <div className="space-y-0.5">
                {trending.map((item: any) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setShowSuggestions(false);
                      navigate(`/news/${item.slug}`);
                    }}
                    className="w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-start text-sm hover:bg-muted/60 transition-colors"
                  >
                    <Search className="h-3 w-3 text-muted-foreground/40 shrink-0" />
                    <span className="truncate text-foreground">{isAr ? item.title_ar || item.title : item.title}</span>
                    {item.type && (
                      <Badge variant="outline" className="ms-auto shrink-0 text-[9px]">
                        {item.type}
                      </Badge>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
});

HomeSearch.displayName = "HomeSearch";
