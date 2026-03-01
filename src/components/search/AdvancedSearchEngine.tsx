import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Search, X, Filter, Mic, MicOff, Clock, Star, TrendingUp,
  Users, Building2, Trophy, FileText, MapPin, Bookmark, BookmarkCheck, Loader2
} from "lucide-react";

interface SearchResult {
  id: string;
  type: "user" | "company" | "competition" | "article" | "establishment" | "exhibition";
  title: string;
  titleAr?: string;
  subtitle?: string;
  subtitleAr?: string;
  image?: string;
  relevance: number;
  metadata?: Record<string, any>;
}

interface SearchFilters {
  type: string;
  country: string;
  dateRange: string;
  sortBy: string;
}

const CATEGORIES = [
  { key: "all", labelEn: "All", labelAr: "الكل", icon: Search },
  { key: "user", labelEn: "Chefs", labelAr: "الطهاة", icon: Users },
  { key: "company", labelEn: "Companies", labelAr: "الشركات", icon: Building2 },
  { key: "competition", labelEn: "Competitions", labelAr: "المسابقات", icon: Trophy },
  { key: "article", labelEn: "Articles", labelAr: "المقالات", icon: FileText },
  { key: "establishment", labelEn: "Restaurants", labelAr: "المطاعم", icon: MapPin },
];

export default function AdvancedSearchEngine({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const isAr = language === "ar";
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeCategory, setActiveCategory] = useState("all");
  const [isListening, setIsListening] = useState(false);
  const [savedSearches, setSavedSearches] = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [filters, setFilters] = useState<SearchFilters>({
    type: "all", country: "", dateRange: "all", sortBy: "relevance"
  });

  // Load saved/recent searches
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("altoha_saved_searches") || "[]");
    const recent = JSON.parse(localStorage.getItem("altoha_recent_searches") || "[]");
    setSavedSearches(saved);
    setRecentSearches(recent);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  // Calculate relevance score
  const calcRelevance = useCallback((text: string, q: string): number => {
    if (!text || !q) return 0;
    const lower = text.toLowerCase();
    const qLower = q.toLowerCase();
    if (lower === qLower) return 100;
    if (lower.startsWith(qLower)) return 90;
    if (lower.includes(qLower)) return 70;
    const words = qLower.split(/\s+/);
    const matched = words.filter(w => lower.includes(w)).length;
    return Math.round((matched / words.length) * 60);
  }, []);

  // Debounced search
  useEffect(() => {
    if (!query.trim() || query.length < 2) { setResults([]); return; }
    const timer = setTimeout(() => performSearch(query), 300);
    return () => clearTimeout(timer);
  }, [query, activeCategory, filters]);

  const performSearch = async (q: string) => {
    setIsSearching(true);
    const searchResults: SearchResult[] = [];
    const cat = activeCategory;

    try {
      const searches: Promise<void>[] = [];

      if (cat === "all" || cat === "user") {
        searches.push((async () => {
          const { data } = await supabase.from("profiles").select("user_id, full_name, username, avatar_url, country_code, specialization")
            .or(`full_name.ilike.%${q}%,username.ilike.%${q}%,specialization.ilike.%${q}%`)
            .limit(20);
          data?.forEach(p => {
            const rel = Math.max(calcRelevance(p.full_name || "", q), calcRelevance(p.username || "", q));
            if (rel > 0) searchResults.push({
              id: p.user_id, type: "user", title: p.full_name || p.username || "",
              subtitle: p.specialization || p.country_code || "", image: p.avatar_url || "", relevance: rel,
              metadata: { country: p.country_code }
            });
          });
        })());
      }

      if (cat === "all" || cat === "company") {
        searches.push((async () => {
          const { data } = await supabase.from("companies").select("id, name, name_ar, logo_url, type, country_code")
            .or(`name.ilike.%${q}%,name_ar.ilike.%${q}%`)
            .limit(20);
          data?.forEach(c => {
            const rel = Math.max(calcRelevance(c.name || "", q), calcRelevance(c.name_ar || "", q));
            if (rel > 0) searchResults.push({
              id: c.id, type: "company", title: c.name || "", titleAr: c.name_ar || "",
              subtitle: c.type || "", image: c.logo_url || "", relevance: rel,
              metadata: { country: c.country_code }
            });
          });
        })());
      }

      if (cat === "all" || cat === "competition") {
        searches.push((async () => {
          const { data } = await supabase.from("competitions").select("id, title, title_ar, country_code, status, edition_year")
            .or(`title.ilike.%${q}%,title_ar.ilike.%${q}%`)
            .limit(20);
          data?.forEach(c => {
            const rel = Math.max(calcRelevance(c.title || "", q), calcRelevance(c.title_ar || "", q));
            if (rel > 0) searchResults.push({
              id: c.id, type: "competition", title: c.title || "", titleAr: c.title_ar || "",
              subtitle: `${c.edition_year || ""} · ${c.status || ""}`, relevance: rel,
              metadata: { country: c.country_code, status: c.status }
            });
          });
        })());
      }

      if (cat === "all" || cat === "article") {
        searches.push((async () => {
          const { data } = await supabase.from("articles").select("id, title, title_ar, excerpt, excerpt_ar, slug, type, status")
            .or(`title.ilike.%${q}%,title_ar.ilike.%${q}%`)
            .eq("status", "published")
            .limit(20);
          data?.forEach(a => {
            const rel = Math.max(calcRelevance(a.title || "", q), calcRelevance(a.title_ar || "", q));
            if (rel > 0) searchResults.push({
              id: a.id, type: "article", title: a.title || "", titleAr: a.title_ar || "",
              subtitle: isAr ? a.excerpt_ar || a.excerpt || "" : a.excerpt || "", relevance: rel,
              metadata: { slug: a.slug, articleType: a.type }
            });
          });
        })());
      }

      if (cat === "all" || cat === "establishment") {
        searches.push((async () => {
          const { data } = await supabase.from("establishments").select("id, name, name_ar, city, country_code, type, logo_url")
            .or(`name.ilike.%${q}%,name_ar.ilike.%${q}%,city.ilike.%${q}%`)
            .limit(20);
          data?.forEach(e => {
            const rel = Math.max(calcRelevance(e.name || "", q), calcRelevance(e.name_ar || "", q));
            if (rel > 0) searchResults.push({
              id: e.id, type: "establishment", title: e.name || "", titleAr: e.name_ar || "",
              subtitle: `${e.city || ""} · ${e.type || ""}`, image: e.logo_url || "", relevance: rel,
              metadata: { country: e.country_code }
            });
          });
        })());
      }

      await Promise.all(searches);
    } catch (err) {
      console.error("Search error:", err);
    }

    // Sort by relevance
    searchResults.sort((a, b) => b.relevance - a.relevance);

    // Apply country filter
    let filtered = searchResults;
    if (filters.country) {
      filtered = filtered.filter(r => r.metadata?.country === filters.country);
    }

    setResults(filtered);
    setIsSearching(false);
  };

  // Voice search
  const toggleVoice = () => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) return;
    if (isListening) { setIsListening(false); return; }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = isAr ? "ar-SA" : "en-US";
    recognition.continuous = false;
    recognition.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      setQuery(transcript);
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognition.start();
    setIsListening(true);
  };

  // Save recent
  const addToRecent = (q: string) => {
    const updated = [q, ...recentSearches.filter(s => s !== q)].slice(0, 10);
    setRecentSearches(updated);
    localStorage.setItem("altoha_recent_searches", JSON.stringify(updated));
  };

  const toggleSaved = (q: string) => {
    const exists = savedSearches.includes(q);
    const updated = exists ? savedSearches.filter(s => s !== q) : [...savedSearches, q];
    setSavedSearches(updated);
    localStorage.setItem("altoha_saved_searches", JSON.stringify(updated));
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "user": return <Users className="h-4 w-4" />;
      case "company": return <Building2 className="h-4 w-4" />;
      case "competition": return <Trophy className="h-4 w-4" />;
      case "article": return <FileText className="h-4 w-4" />;
      case "establishment": return <MapPin className="h-4 w-4" />;
      default: return <Search className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    const cat = CATEGORIES.find(c => c.key === type);
    return isAr ? cat?.labelAr || type : cat?.labelEn || type;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] p-0 gap-0">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle className="sr-only">{isAr ? "البحث المتقدم" : "Advanced Search"}</DialogTitle>
          <div className="flex items-center gap-2">
            <Search className="h-5 w-5 text-muted-foreground shrink-0" />
            <Input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && query.trim()) addToRecent(query); }}
              placeholder={isAr ? "ابحث عن طهاة، شركات، مسابقات..." : "Search chefs, companies, competitions..."}
              className="border-0 shadow-none focus-visible:ring-0 text-base"
            />
            {isSearching && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            <Button variant="ghost" size="icon" onClick={toggleVoice} className="shrink-0">
              {isListening ? <MicOff className="h-4 w-4 text-destructive" /> : <Mic className="h-4 w-4" />}
            </Button>
            {query && (
              <Button variant="ghost" size="icon" onClick={() => setQuery("")} className="shrink-0">
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </DialogHeader>

        {/* Category tabs */}
        <div className="px-4 pt-2">
          <div className="flex gap-1.5 overflow-x-auto pb-2">
            {CATEGORIES.map(cat => (
              <Button
                key={cat.key}
                variant={activeCategory === cat.key ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveCategory(cat.key)}
                className="shrink-0 gap-1.5 text-xs"
              >
                <cat.icon className="h-3.5 w-3.5" />
                {isAr ? cat.labelAr : cat.labelEn}
              </Button>
            ))}
          </div>
        </div>

        {/* Filters row */}
        {query.length >= 2 && (
          <div className="px-4 flex gap-2 items-center">
            <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <Select value={filters.sortBy} onValueChange={v => setFilters(p => ({ ...p, sortBy: v }))}>
              <SelectTrigger className="h-7 text-xs w-auto min-w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance">{isAr ? "الأكثر صلة" : "Most Relevant"}</SelectItem>
                <SelectItem value="recent">{isAr ? "الأحدث" : "Most Recent"}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        <ScrollArea className="flex-1 max-h-[55vh]">
          {/* Empty state - show recent/saved */}
          {!query.trim() && (
            <div className="p-4 space-y-4">
              {savedSearches.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
                    <Star className="h-3.5 w-3.5" />
                    {isAr ? "عمليات البحث المحفوظة" : "Saved Searches"}
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {savedSearches.map(s => (
                      <Badge
                        key={s}
                        variant="secondary"
                        className="cursor-pointer hover:bg-primary/10"
                        onClick={() => { setQuery(s); addToRecent(s); }}
                      >
                        <BookmarkCheck className="h-3 w-3 mr-1" />
                        {s}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {recentSearches.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    {isAr ? "عمليات البحث الأخيرة" : "Recent Searches"}
                  </h4>
                  <div className="space-y-1">
                    {recentSearches.map(s => (
                      <div
                        key={s}
                        className="flex items-center gap-2 p-1.5 rounded-md hover:bg-muted cursor-pointer text-sm"
                        onClick={() => { setQuery(s); addToRecent(s); }}
                      >
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="flex-1">{s}</span>
                        <Button
                          variant="ghost" size="icon" className="h-6 w-6"
                          onClick={e => { e.stopPropagation(); toggleSaved(s); }}
                        >
                          {savedSearches.includes(s) ?
                            <BookmarkCheck className="h-3.5 w-3.5 text-primary" /> :
                            <Bookmark className="h-3.5 w-3.5" />
                          }
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {savedSearches.length === 0 && recentSearches.length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  <Search className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p>{isAr ? "ابدأ الكتابة للبحث" : "Start typing to search"}</p>
                  <p className="text-xs mt-1">{isAr ? "استخدم ⌘K للوصول السريع" : "Use ⌘K for quick access"}</p>
                </div>
              )}
            </div>
          )}

          {/* Results */}
          {query.trim().length >= 2 && (
            <div className="p-2">
              {results.length === 0 && !isSearching && (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  <Search className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p>{isAr ? "لا توجد نتائج" : "No results found"}</p>
                </div>
              )}

              {results.map(r => (
                <div
                  key={`${r.type}-${r.id}`}
                  className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted cursor-pointer transition-colors"
                >
                  <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                    {r.image ? (
                      <img src={r.image} alt="" className="h-full w-full object-cover" />
                    ) : (
                      getTypeIcon(r.type)
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {isAr && r.titleAr ? r.titleAr : r.title}
                    </p>
                    {(r.subtitle || r.subtitleAr) && (
                      <p className="text-xs text-muted-foreground truncate">
                        {isAr && r.subtitleAr ? r.subtitleAr : r.subtitle}
                      </p>
                    )}
                  </div>
                  <Badge variant="outline" className="text-[10px] shrink-0">
                    {getTypeLabel(r.type)}
                  </Badge>
                  <Button
                    variant="ghost" size="icon" className="h-7 w-7 shrink-0"
                    onClick={e => { e.stopPropagation(); toggleSaved(isAr && r.titleAr ? r.titleAr : r.title); }}
                  >
                    <Bookmark className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}

              {results.length > 0 && (
                <div className="text-center py-2">
                  <p className="text-xs text-muted-foreground">
                    {isAr ? `${results.length} نتيجة` : `${results.length} results`}
                  </p>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="border-t p-2 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">↑↓</kbd>
            <span>{isAr ? "تنقل" : "Navigate"}</span>
            <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">↵</kbd>
            <span>{isAr ? "فتح" : "Open"}</span>
            <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">esc</kbd>
            <span>{isAr ? "إغلاق" : "Close"}</span>
          </div>
          <div className="flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            <span>{isAr ? "بحث ذكي" : "Smart Search"}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
