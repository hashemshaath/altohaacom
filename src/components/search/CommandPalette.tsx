import { useState, useEffect, useCallback, useRef, memo } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Search, Trophy, FileText, Users, UtensilsCrossed, Ticket,
  Building2, ArrowRight, Command, CornerDownLeft, Loader2,
  Mic, MicOff,
} from "lucide-react";
import { addRecentSearch } from "@/lib/recentSearches";

interface Result {
  id: string;
  title: string;
  subtitle?: string;
  type: "competition" | "article" | "member" | "recipe" | "exhibition" | "entity";
  href: string;
}

const TYPE_CONFIG = {
  competition: { icon: Trophy, color: "text-primary", bg: "bg-primary/10", label: "Competition", labelAr: "مسابقة" },
  article: { icon: FileText, color: "text-chart-2", bg: "bg-chart-2/10", label: "Article", labelAr: "مقال" },
  member: { icon: Users, color: "text-chart-3", bg: "bg-chart-3/10", label: "Member", labelAr: "عضو" },
  recipe: { icon: UtensilsCrossed, color: "text-chart-4", bg: "bg-chart-4/10", label: "Recipe", labelAr: "وصفة" },
  exhibition: { icon: Ticket, color: "text-chart-5", bg: "bg-chart-5/10", label: "Exhibition", labelAr: "معرض" },
  entity: { icon: Building2, color: "text-chart-1", bg: "bg-chart-1/10", label: "Organization", labelAr: "جهة" },
};

export function CommandPalette() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // ⌘K / Ctrl+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // Reset on open
  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      stopListening();
    }
  }, [open]);

  // Voice search
  const startListening = useCallback(() => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = isAr ? "ar-SA" : "en-US";
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((r: any) => r[0].transcript)
        .join("");
      setQuery(transcript);
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognition.start();
    recognitionRef.current = recognition;
    setIsListening(true);
  }, [isAr]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  // Debounced search
  const [debouncedQuery, setDebouncedQuery] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 250);
    return () => clearTimeout(timer);
  }, [query]);

  const { data: results = [], isFetching } = useQuery({
    queryKey: ["cmd-palette", debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) return [];
      const escaped = debouncedQuery.replace(/[%_]/g, "\\$&");
      const searchResults: Result[] = [];

      const [comps, articles, members, recipes, exhibitions, entities] = await Promise.all([
        supabase.from("competitions").select("id, title, title_ar, country_code").or(`title.ilike.%${escaped}%,title_ar.ilike.%${escaped}%`).neq("status", "draft").limit(3),
        supabase.from("articles").select("id, title, title_ar, slug, type").or(`title.ilike.%${escaped}%,title_ar.ilike.%${escaped}%`).eq("status", "published").limit(3),
        supabase.from("profiles").select("user_id, full_name, full_name_ar, username, specialization").or(`full_name.ilike.%${escaped}%,full_name_ar.ilike.%${escaped}%,username.ilike.%${escaped}%`).eq("account_status", "active").limit(3),
        supabase.from("recipes").select("id, title, title_ar, slug").or(`title.ilike.%${escaped}%,title_ar.ilike.%${escaped}%`).eq("is_published", true).limit(3),
        supabase.from("exhibitions").select("id, title, title_ar, slug").or(`title.ilike.%${escaped}%,title_ar.ilike.%${escaped}%`).limit(3),
        supabase.from("culinary_entities").select("id, name, name_ar, type").or(`name.ilike.%${escaped}%,name_ar.ilike.%${escaped}%`).eq("is_visible", true).limit(2),
      ]);

      comps.data?.forEach((c) => searchResults.push({ id: c.id, title: isAr && c.title_ar ? c.title_ar : c.title, type: "competition", href: `/competitions/${c.id}`, subtitle: c.country_code || undefined }));
      articles.data?.forEach((a) => searchResults.push({ id: a.id, title: isAr && a.title_ar ? a.title_ar : a.title, type: "article", href: `/news/${a.slug}`, subtitle: a.type }));
      members.data?.forEach((m) => searchResults.push({ id: m.user_id, title: isAr && m.full_name_ar ? m.full_name_ar : m.full_name || m.username || "", type: "member", href: `/u/${m.username}`, subtitle: m.specialization || undefined }));
      recipes.data?.forEach((r) => searchResults.push({ id: r.id, title: isAr && r.title_ar ? r.title_ar : r.title, type: "recipe", href: `/recipes/${r.slug || r.id}` }));
      exhibitions.data?.forEach((e) => searchResults.push({ id: e.id, title: isAr && e.title_ar ? e.title_ar : e.title, type: "exhibition", href: `/exhibitions/${e.slug || e.id}` }));
      entities.data?.forEach((e) => searchResults.push({ id: e.id, title: isAr && e.name_ar ? e.name_ar : e.name, type: "entity", href: `/entities/${e.id}`, subtitle: e.type || undefined }));

      return searchResults;
    },
    enabled: debouncedQuery.length >= 2,
    staleTime: 30000,
  });

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, results.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex === 0 && query.trim()) {
        // Go to full search page
        addRecentSearch(query.trim());
        navigate(`/search?q=${encodeURIComponent(query.trim())}`);
        setOpen(false);
      } else if (results[selectedIndex - 1]) {
        const result = results[selectedIndex - 1];
        addRecentSearch(result.title);
        navigate(result.href);
        setOpen(false);
      }
    }
  }, [results, selectedIndex, query, navigate]);

  useEffect(() => setSelectedIndex(0), [results]);

  const handleSelect = (result: Result) => {
    addRecentSearch(result.title);
    navigate(result.href);
    setOpen(false);
  };

  const goToFullSearch = () => {
    if (query.trim()) {
      addRecentSearch(query.trim());
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    }
    setOpen(false);
  };

  const hasVoiceSupport = typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="overflow-hidden p-0 sm:max-w-lg rounded-2xl border-border/60 shadow-2xl [&>button]:hidden">
        <div className="flex items-center border-b border-border/40 px-4">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isAr ? "ابحث في كل المحتوى..." : "Search everything..."}
            className="h-12 border-0 bg-transparent text-base shadow-none focus-visible:ring-0 px-3"
          />
          {isFetching && <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />}
          {hasVoiceSupport && (
            <button
              onClick={isListening ? stopListening : startListening}
              className={`p-1.5 rounded-full shrink-0 transition-colors ${isListening ? "bg-destructive/10 text-destructive" : "hover:bg-muted text-muted-foreground"}`}
            >
              {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </button>
          )}
        </div>

        <ScrollArea className="max-h-80">
          <div className="p-2">
            {/* Go to full search */}
            {query.trim().length >= 2 && (
              <button
                onClick={goToFullSearch}
                className={`flex items-center gap-3 w-full rounded-xl px-3 py-2.5 text-sm transition-colors ${selectedIndex === 0 ? "bg-accent" : "hover:bg-muted/60"}`}
              >
                <Search className="h-4 w-4 text-primary shrink-0" />
                <span className="flex-1 text-start truncate">
                  {isAr ? `بحث شامل عن "${query}"` : `Search all for "${query}"`}
                </span>
                <CornerDownLeft className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              </button>
            )}

            {/* Results */}
            {results.map((result, idx) => {
              const config = TYPE_CONFIG[result.type];
              const Icon = config.icon;
              const isSelected = selectedIndex === idx + 1;
              return (
                <button
                  key={`${result.type}-${result.id}`}
                  onClick={() => handleSelect(result)}
                  className={`flex items-center gap-3 w-full rounded-xl px-3 py-2.5 text-sm transition-colors group ${isSelected ? "bg-accent" : "hover:bg-muted/60"}`}
                >
                  <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${config.bg}`}>
                    <Icon className={`h-3.5 w-3.5 ${config.color}`} />
                  </div>
                  <div className="flex-1 min-w-0 text-start">
                    <p className="font-medium truncate">{result.title}</p>
                    <div className="flex items-center gap-1.5">
                      <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4">
                        {isAr ? config.labelAr : config.label}
                      </Badge>
                      {result.subtitle && (
                        <span className="text-[10px] text-muted-foreground truncate">{result.subtitle}</span>
                      )}
                    </div>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity rtl:rotate-180 shrink-0" />
                </button>
              );
            })}

            {/* Empty state */}
            {query.length >= 2 && !isFetching && results.length === 0 && (
              <div className="py-8 text-center text-sm text-muted-foreground">
                {isAr ? "لا توجد نتائج" : "No results found"}
              </div>
            )}

            {/* Initial state */}
            {query.length < 2 && (
              <div className="py-8 text-center text-muted-foreground">
                <Search className="h-8 w-8 mx-auto mb-2 opacity-20" />
                <p className="text-xs">{isAr ? "اكتب للبحث..." : "Type to search..."}</p>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer with shortcuts */}
        <div className="flex items-center justify-between border-t border-border/40 px-4 py-2 text-[10px] text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-border bg-muted px-1 py-0.5 text-[9px] font-mono">↑↓</kbd>
              {isAr ? "تنقل" : "Navigate"}
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-border bg-muted px-1 py-0.5 text-[9px] font-mono">↵</kbd>
              {isAr ? "اختيار" : "Select"}
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-border bg-muted px-1 py-0.5 text-[9px] font-mono">esc</kbd>
              {isAr ? "إغلاق" : "Close"}
            </span>
          </div>
          <span className="flex items-center gap-1">
            <Command className="h-3 w-3" />K
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
