import { useState, useEffect, useRef, memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { cn } from "@/lib/utils";
import { Search, TrendingUp, Clock, Star, Trophy, FileText, Users, UtensilsCrossed, Ticket } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getSavedSearches, addSavedSearch, removeSavedSearch } from "@/lib/recentSearches";
import { MS_PER_DAY, MS_PER_WEEK } from "@/lib/constants";
import { CACHE } from "@/lib/queryConfig";

interface SearchSuggestionsProps {
  query: string;
  isOpen: boolean;
  onSelect: (term: string) => void;
  onClose: () => void;
}

interface Suggestion {
  text: string;
  type: "autocomplete" | "trending" | "saved";
  icon?: React.ElementType;
  category?: string;
}

export const SearchSuggestions = memo(function SearchSuggestions({ query, isOpen, onSelect, onClose }: SearchSuggestionsProps) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    if (isOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen, onClose]);

  // Autocomplete from DB
  const { data: autocompleteSuggestions } = useQuery({
    queryKey: ["search-autocomplete", query],
    queryFn: async () => {
      if (!query || query.length < 2) return [];
      const escaped = query.replace(/[%_]/g, "\\$&");
      
      const [comps, articles, profiles, recipes, exhibitions] = await Promise.all([
        supabase.from("competitions").select("title, title_ar").or(`title.ilike.%${escaped}%,title_ar.ilike.%${escaped}%`).limit(3),
        supabase.from("articles").select("title, title_ar").eq("status", "published").or(`title.ilike.%${escaped}%,title_ar.ilike.%${escaped}%`).limit(3),
        supabase.from("profiles").select("full_name, full_name_ar, username").eq("account_status", "active").or(`full_name.ilike.%${escaped}%,full_name_ar.ilike.%${escaped}%,username.ilike.%${escaped}%`).limit(3),
        supabase.from("recipes").select("title, title_ar").eq("is_published", true).or(`title.ilike.%${escaped}%,title_ar.ilike.%${escaped}%`).limit(3),
        supabase.from("exhibitions").select("title, title_ar").eq("status", "published" as any).or(`title.ilike.%${escaped}%,title_ar.ilike.%${escaped}%`).limit(2),
      ]);

      const suggestions: Suggestion[] = [];

      (comps.data || []).forEach((c) => {
        suggestions.push({ text: isAr ? c.title_ar || c.title : c.title, type: "autocomplete", icon: Trophy, category: isAr ? "مسابقة" : "Competition" });
      });
      (articles.data || []).forEach((a) => {
        suggestions.push({ text: isAr ? a.title_ar || a.title : a.title, type: "autocomplete", icon: FileText, category: isAr ? "مقال" : "Article" });
      });
      (profiles.data || []).forEach((p) => {
        const name = isAr ? p.full_name_ar || p.full_name : p.full_name || p.full_name_ar;
        if (name) suggestions.push({ text: name, type: "autocomplete", icon: Users, category: isAr ? "عضو" : "Member" });
      });
      (recipes.data || []).forEach((r) => {
        suggestions.push({ text: isAr ? r.title_ar || r.title : r.title, type: "autocomplete", icon: UtensilsCrossed, category: isAr ? "وصفة" : "Recipe" });
      });
      (exhibitions.data || []).forEach((e) => {
        suggestions.push({ text: isAr ? e.title_ar || e.title : e.title, type: "autocomplete", icon: Ticket, category: isAr ? "معرض" : "Exhibition" });
      });

      return suggestions.slice(0, 8);
    },
    enabled: !!query && query.length >= 2 && isOpen,
    staleTime: CACHE.realtime.staleTime,
  });

  // Trending searches (top hashtags from recent posts)
  const { data: trendingSearches } = useQuery({
    queryKey: ["trending-searches"],
    queryFn: async () => {
      const sevenDaysAgo = new Date(Date.now() - MS_PER_WEEK).toISOString();
      const { data: posts } = await supabase
        .from("posts")
        .select("content")
        .gte("created_at", sevenDaysAgo)
        .eq("moderation_status", "approved")
        .limit(200);

      const tagCounts: Record<string, number> = {};
      (posts || []).forEach((p) => {
        p.content?.match(/#([^\s#]+)/g)?.forEach((m: string) => {
          const tag = m.replace("#", "").toLowerCase();
          if (tag.length >= 3) tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      });

      return Object.entries(tagCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 6)
        .map(([tag]) => ({ text: `#${tag}`, type: "trending" as const, icon: TrendingUp }));
    },
    staleTime: CACHE.long.staleTime,
  });

  const savedSearches = getSavedSearches().slice(0, 4).map(s => ({
    text: s, type: "saved" as const, icon: Star,
  }));

  if (!isOpen) return null;

  const hasQuery = query && query.length >= 2;
  const suggestions = hasQuery ? (autocompleteSuggestions || []) : [
    ...savedSearches,
    ...(trendingSearches || []),
  ];

  if (suggestions.length === 0) return null;

  return (
    <div ref={ref} className="absolute top-full start-0 end-0 mt-1 z-50 rounded-2xl border border-border bg-popover shadow-lg overflow-hidden backdrop-blur-sm">
      {!hasQuery && savedSearches.length > 0 && (
        <div className="px-3 pt-3 pb-1">
          <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider">
            {isAr ? "عمليات البحث المحفوظة" : "Saved Searches"}
          </p>
        </div>
      )}
      {!hasQuery && savedSearches.length > 0 && savedSearches.map((s) => (
        <button
          key={`saved-${s.text}`}
          onClick={() => onSelect(s.text)}
          className="flex items-center gap-3 w-full px-4 py-2.5 text-sm hover:bg-accent/40 active:bg-accent/60 transition-colors text-start group"
        >
          <Star className="h-3.5 w-3.5 text-chart-4 shrink-0 transition-transform group-hover:scale-110" />
          <span className="flex-1 truncate">{s.text}</span>
        </button>
      ))}

      {!hasQuery && (trendingSearches || []).length > 0 && (
        <div className="px-3 pt-3 pb-1 border-t border-border/40">
          <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider">
            {isAr ? "الأكثر رواجاً" : "Trending"}
          </p>
        </div>
      )}
      {!hasQuery && (trendingSearches || []).map((s, i) => (
        <button
          key={`trend-${s.text}`}
          onClick={() => onSelect(s.text.replace("#", ""))}
          className="flex items-center gap-3 w-full px-4 py-2.5 text-sm hover:bg-accent/40 active:bg-accent/60 transition-colors text-start group"
        >
          <TrendingUp className="h-3.5 w-3.5 text-chart-2 shrink-0 transition-transform group-hover:scale-110" />
          <span className="flex-1 truncate">{s.text}</span>
          <Badge variant="secondary" className="text-[12px] px-1.5 py-0 h-4 tabular-nums">#{i + 1}</Badge>
        </button>
      ))}

      {hasQuery && suggestions.length > 0 && (
        <div className="px-3 pt-2.5 pb-1">
          <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider">
            {isAr ? "نتائج مطابقة" : "Results"}
          </p>
        </div>
      )}
      {hasQuery && suggestions.map((s, i) => {
        const Icon = s.icon || Search;
        return (
          <button
            key={`ac-${i}-${s.text}`}
            onClick={() => onSelect(s.text)}
            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm hover:bg-accent/40 active:bg-accent/60 transition-colors text-start group"
          >
            <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0 transition-transform group-hover:scale-110" />
            <span className="flex-1 truncate">{s.text}</span>
            {s.category && (
              <Badge variant="outline" className="text-[12px] px-1.5 py-0 h-4">{s.category}</Badge>
            )}
          </button>
        );
      })}

      {hasQuery && suggestions.length === 0 && (
        <div className="px-4 py-6 text-center">
          <Search className="h-5 w-5 mx-auto mb-2 text-muted-foreground/40" />
          <p className="text-xs text-muted-foreground">{isAr ? "لا توجد نتائج" : "No results found"}</p>
        </div>
      )}
    </div>
  );
});
