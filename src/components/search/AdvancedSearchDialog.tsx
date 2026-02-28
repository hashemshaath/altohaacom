import { useState, useEffect, useCallback, useRef } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, X, Mic, MicOff, Clock, Star, Bookmark, TrendingUp, Users, Trophy, ChefHat, BookOpen, MapPin, Hash } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigate?: (path: string) => void;
}

const SAVED_KEY = "altoha_saved_searches";
const RECENT_KEY = "altoha_recent_searches";

type SearchCategory = "all" | "users" | "recipes" | "competitions" | "posts" | "articles";

const CATEGORY_CONFIG: { key: SearchCategory; label: string; labelAr: string; icon: any }[] = [
  { key: "all", label: "All", labelAr: "الكل", icon: Search },
  { key: "users", label: "Chefs", labelAr: "الطهاة", icon: Users },
  { key: "recipes", label: "Recipes", labelAr: "وصفات", icon: ChefHat },
  { key: "competitions", label: "Competitions", labelAr: "مسابقات", icon: Trophy },
  { key: "posts", label: "Posts", labelAr: "منشورات", icon: BookOpen },
  { key: "articles", label: "Articles", labelAr: "مقالات", icon: BookOpen },
];

export function AdvancedSearchDialog({ open, onOpenChange, onNavigate }: Props) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<SearchCategory>("all");
  const [savedSearches, setSavedSearches] = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isListening, setIsListening] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(SAVED_KEY);
      const recent = localStorage.getItem(RECENT_KEY);
      if (saved) setSavedSearches(JSON.parse(saved));
      if (recent) setRecentSearches(JSON.parse(recent));
    } catch {}
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  const addRecent = useCallback((term: string) => {
    if (!term.trim()) return;
    setRecentSearches(prev => {
      const next = [term, ...prev.filter(s => s !== term)].slice(0, 10);
      localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const toggleSaved = useCallback((term: string) => {
    setSavedSearches(prev => {
      const next = prev.includes(term) ? prev.filter(s => s !== term) : [...prev, term];
      localStorage.setItem(SAVED_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const clearRecent = useCallback(() => {
    setRecentSearches([]);
    localStorage.removeItem(RECENT_KEY);
  }, []);

  // Voice search
  const toggleVoice = useCallback(() => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) return;
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SR();
    recognition.lang = isAr ? "ar-SA" : "en-US";
    recognition.continuous = false;
    recognition.onresult = (e: any) => {
      const text = e.results[0][0].transcript;
      setQuery(text);
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognition.start();
    recognitionRef.current = recognition;
    setIsListening(true);
  }, [isAr, isListening]);

  // Search queries
  const debouncedQuery = useDebounce(query, 300);

  const { data: results = { users: [], recipes: [], competitions: [], posts: [], articles: [] }, isLoading } = useQuery({
    queryKey: ["advanced-search", debouncedQuery, category],
    queryFn: async () => {
      if (debouncedQuery.length < 2) return { users: [], recipes: [], competitions: [], posts: [], articles: [] };

      const fetches: Promise<any>[] = [];
      const shouldFetch = (cat: SearchCategory) => category === "all" || category === cat;

      if (shouldFetch("users")) {
        fetches.push(
          supabase.from("profiles").select("user_id, full_name, full_name_ar, username, avatar_url, country").or(`full_name.ilike.%${debouncedQuery}%,username.ilike.%${debouncedQuery}%,full_name_ar.ilike.%${debouncedQuery}%`).limit(8).then(r => ({ key: "users", data: r.data || [] })) as Promise<any>
        );
      }
      if (shouldFetch("recipes")) {
        fetches.push(
          supabase.from("recipes").select("id, title, title_ar, cuisine_type, image_url, author_id").or(`title.ilike.%${debouncedQuery}%,title_ar.ilike.%${debouncedQuery}%`).limit(8).then(r => ({ key: "recipes", data: r.data || [] })) as Promise<any>
        );
      }
      if (shouldFetch("competitions")) {
        fetches.push(
          supabase.from("competitions").select("id, name, name_ar, status, country_code").or(`name.ilike.%${debouncedQuery}%,name_ar.ilike.%${debouncedQuery}%`).limit(8).then(r => ({ key: "competitions", data: r.data || [] })) as Promise<any>
        );
      }
      if (shouldFetch("posts")) {
        fetches.push(
          supabase.from("posts").select("id, content, author_id, created_at").ilike("content", `%${debouncedQuery}%`).limit(8).then(r => ({ key: "posts", data: r.data || [] })) as Promise<any>
        );
      }
      if (shouldFetch("articles")) {
        fetches.push(
          supabase.from("articles").select("id, title, title_ar, slug, type").or(`title.ilike.%${debouncedQuery}%,title_ar.ilike.%${debouncedQuery}%`).limit(8).then(r => ({ key: "articles", data: r.data || [] })) as Promise<any>
        );
      }

      const responses = await Promise.all(fetches);
      const result: any = { users: [], recipes: [], competitions: [], posts: [], articles: [] };
      responses.forEach(r => { result[r.key] = r.data; });
      return result;
    },
    enabled: debouncedQuery.length >= 2,
  });

  const totalResults = Object.values(results).flat().length;
  const hasQuery = debouncedQuery.length >= 2;

  const handleSelect = (term: string) => {
    setQuery(term);
    addRecent(term);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 gap-0">
        {/* Search Input */}
        <div className="flex items-center gap-2 p-4 border-b">
          <Search className="h-5 w-5 text-muted-foreground shrink-0" />
          <Input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={isAr ? "ابحث عن طهاة، وصفات، مسابقات..." : "Search chefs, recipes, competitions..."}
            className="border-0 shadow-none focus-visible:ring-0 text-base"
            onKeyDown={e => { if (e.key === "Enter" && query) addRecent(query); }}
          />
          <div className="flex items-center gap-1 shrink-0">
            {query && (
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setQuery("")}>
                <X className="h-4 w-4" />
              </Button>
            )}
            {"webkitSpeechRecognition" in window && (
              <Button variant="ghost" size="icon" className={cn("h-7 w-7", isListening && "text-destructive")} onClick={toggleVoice}>
                {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
            )}
            {query && (
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleSaved(query)}>
                <Bookmark className={cn("h-4 w-4", savedSearches.includes(query) && "fill-current text-primary")} />
              </Button>
            )}
          </div>
        </div>

        {/* Category Tabs */}
        <div className="px-4 pt-2">
          <Tabs value={category} onValueChange={v => setCategory(v as SearchCategory)}>
            <TabsList className="h-8">
              {CATEGORY_CONFIG.map(c => {
                const Icon = c.icon;
                return (
                  <TabsTrigger key={c.key} value={c.key} className="text-xs gap-1 h-7 px-2.5">
                    <Icon className="h-3 w-3" />
                    {isAr ? c.labelAr : c.label}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </Tabs>
        </div>

        <ScrollArea className="max-h-[60vh]">
          <div className="p-4 space-y-4">
            {/* No query — show saved & recent */}
            {!hasQuery && (
              <>
                {savedSearches.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1"><Star className="h-3 w-3" /> {isAr ? "عمليات بحث محفوظة" : "Saved Searches"}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {savedSearches.map(s => (
                        <Badge key={s} variant="secondary" className="cursor-pointer gap-1 text-xs" onClick={() => handleSelect(s)}>
                          <Bookmark className="h-3 w-3 fill-current" /> {s}
                          <X className="h-3 w-3 ms-1 opacity-50 hover:opacity-100" onClick={e => { e.stopPropagation(); toggleSaved(s); }} />
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {recentSearches.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-medium text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> {isAr ? "عمليات بحث حديثة" : "Recent Searches"}</p>
                      <Button variant="ghost" size="sm" className="text-xs h-6" onClick={clearRecent}>{isAr ? "مسح" : "Clear"}</Button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {recentSearches.map(s => (
                        <Badge key={s} variant="outline" className="cursor-pointer text-xs" onClick={() => handleSelect(s)}>
                          <Clock className="h-3 w-3 me-1" /> {s}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {!savedSearches.length && !recentSearches.length && (
                  <div className="text-center py-8">
                    <Search className="h-10 w-10 mx-auto text-muted-foreground/20 mb-3" />
                    <p className="text-sm text-muted-foreground">{isAr ? "ابدأ البحث..." : "Start searching..."}</p>
                    <p className="text-xs text-muted-foreground mt-1">{isAr ? "اضغط ⌘K في أي وقت للبحث السريع" : "Press ⌘K anytime for quick search"}</p>
                  </div>
                )}
              </>
            )}

            {/* Results */}
            {hasQuery && (
              <>
                <p className="text-xs text-muted-foreground">
                  {isLoading ? (isAr ? "جاري البحث..." : "Searching...") : `${totalResults} ${isAr ? "نتيجة" : "results"}`}
                </p>

                {/* Users */}
                {results.users.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1"><Users className="h-3 w-3" /> {isAr ? "الطهاة" : "Chefs"}</p>
                    <div className="space-y-1">
                      {results.users.map((u: any) => (
                        <div key={u.user_id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer" onClick={() => { addRecent(query); onNavigate?.(`/profile/${u.username || u.user_id}`); onOpenChange(false); }}>
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={u.avatar_url || ""} />
                            <AvatarFallback>{(u.full_name || "?")[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{isAr ? u.full_name_ar || u.full_name : u.full_name}</p>
                            {u.username && <p className="text-xs text-muted-foreground">@{u.username}</p>}
                          </div>
                          {u.country && <Badge variant="outline" className="text-[10px]"><MapPin className="h-2.5 w-2.5 me-0.5" />{u.country}</Badge>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recipes */}
                {results.recipes.length > 0 && (
                  <div>
                    <Separator className="my-2" />
                    <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1"><ChefHat className="h-3 w-3" /> {isAr ? "الوصفات" : "Recipes"}</p>
                    <div className="space-y-1">
                      {results.recipes.map((r: any) => (
                        <div key={r.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer" onClick={() => { addRecent(query); onOpenChange(false); }}>
                          {r.image_url ? <img src={r.image_url} className="h-8 w-8 rounded object-cover" alt="" /> : <ChefHat className="h-8 w-8 p-1.5 bg-muted rounded" />}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{isAr ? r.title_ar || r.title : r.title}</p>
                            {r.cuisine_type && <p className="text-xs text-muted-foreground">{r.cuisine_type}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Competitions */}
                {results.competitions.length > 0 && (
                  <div>
                    <Separator className="my-2" />
                    <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1"><Trophy className="h-3 w-3" /> {isAr ? "المسابقات" : "Competitions"}</p>
                    <div className="space-y-1">
                      {results.competitions.map((c: any) => (
                        <div key={c.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer" onClick={() => { addRecent(query); onOpenChange(false); }}>
                          <Trophy className="h-8 w-8 p-1.5 bg-muted rounded" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{isAr ? c.name_ar || c.name : c.name}</p>
                            <p className="text-xs text-muted-foreground">{c.status}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Posts */}
                {results.posts.length > 0 && (
                  <div>
                    <Separator className="my-2" />
                    <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1"><Hash className="h-3 w-3" /> {isAr ? "المنشورات" : "Posts"}</p>
                    <div className="space-y-1">
                      {results.posts.map((p: any) => (
                        <div key={p.id} className="p-2 rounded-lg hover:bg-muted/50 cursor-pointer" onClick={() => { addRecent(query); onOpenChange(false); }}>
                          <p className="text-sm line-clamp-2">{p.content}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Articles */}
                {results.articles.length > 0 && (
                  <div>
                    <Separator className="my-2" />
                    <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1"><BookOpen className="h-3 w-3" /> {isAr ? "المقالات" : "Articles"}</p>
                    <div className="space-y-1">
                      {results.articles.map((a: any) => (
                        <div key={a.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer" onClick={() => { addRecent(query); onOpenChange(false); }}>
                          <BookOpen className="h-8 w-8 p-1.5 bg-muted rounded shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{isAr ? a.title_ar || a.title : a.title}</p>
                            <Badge variant="outline" className="text-[10px]">{a.type}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {!isLoading && totalResults === 0 && (
                  <div className="text-center py-8">
                    <Search className="h-10 w-10 mx-auto text-muted-foreground/20 mb-3" />
                    <p className="text-sm text-muted-foreground">{isAr ? "لا توجد نتائج" : "No results found"}</p>
                  </div>
                )}
              </>
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="border-t p-2 flex items-center justify-between text-xs text-muted-foreground">
          <span>⌘K</span>
          <span>{isAr ? "اضغط Enter للبحث" : "Press Enter to search"}</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function useDebounce(value: string, delay: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}
