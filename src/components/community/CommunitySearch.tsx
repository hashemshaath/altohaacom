import { useState, useCallback, useRef, useEffect, memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, Hash, User, FileText, Loader2, UtensilsCrossed, UsersRound, CalendarDays } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

type ResultType = "user" | "post" | "hashtag" | "recipe" | "group" | "event";

interface SearchResult {
  type: ResultType;
  id: string;
  title: string;
  subtitle?: string;
  avatar?: string | null;
}

type SearchFilter = "all" | "users" | "posts" | "recipes" | "groups";

export const CommunitySearch = memo(function CommunitySearch() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<SearchFilter>("all");
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); setOpen(false); return; }
    setSearching(true);
    try {
      const all: SearchResult[] = [];
      const pattern = `%${q}%`;

      const searches = await Promise.all([
        // Users
        (activeFilter === "all" || activeFilter === "users") ?
          supabase.from("profiles").select("user_id, full_name, display_name, display_name_ar, username, avatar_url, specialization")
            .or(`full_name.ilike.${pattern},username.ilike.${pattern},display_name.ilike.${pattern}`)
            .eq("account_status", "active").limit(5) : { data: [] },
        // Posts
        (activeFilter === "all" || activeFilter === "posts") ?
          supabase.from("posts").select("id, content, author_id")
            .ilike("content", pattern).eq("moderation_status", "approved")
            .is("reply_to_post_id", null).order("created_at", { ascending: false }).limit(3) : { data: [] },
        // Recipes
        (activeFilter === "all" || activeFilter === "recipes") ?
          supabase.from("recipes").select("id, title, title_ar, image_url")
            .eq("is_published", true)
            .or(`title.ilike.${pattern},title_ar.ilike.${pattern}`).limit(3) : { data: [] },
        // Groups
        (activeFilter === "all" || activeFilter === "groups") ?
          supabase.from("groups").select("id, name, name_ar, avatar_url")
            .or(`name.ilike.${pattern},name_ar.ilike.${pattern}`).limit(3) : { data: [] },
      ]);

      const [usersRes, postsRes, recipesRes, groupsRes] = searches;

      (usersRes.data || []).forEach((u: any) => all.push({
        type: "user", id: u.user_id,
        title: (isAr ? (u.display_name_ar || u.display_name) : u.display_name) || u.full_name || u.username || "Chef",
        subtitle: u.specialization || (u.username ? `@${u.username}` : undefined),
        avatar: u.avatar_url,
      }));

      (postsRes.data || []).forEach((p: any) => all.push({
        type: "post", id: p.id,
        title: p.content.slice(0, 80) + (p.content.length > 80 ? "..." : ""),
      }));

      (recipesRes.data || []).forEach((r: any) => all.push({
        type: "recipe", id: r.id,
        title: (isAr && r.title_ar) ? r.title_ar : r.title,
        avatar: r.image_url,
      }));

      (groupsRes.data || []).forEach((g: any) => all.push({
        type: "group", id: g.id,
        title: (isAr && g.name_ar) ? g.name_ar : g.name,
        avatar: g.avatar_url,
      }));

      // Hashtag suggestion
      if (q.startsWith("#") || !q.includes(" ")) {
        const tag = q.replace("#", "");
        all.push({ type: "hashtag", id: tag, title: `#${tag}`, subtitle: isAr ? "بحث بالهاشتاق" : "Search by hashtag" });
      }

      setResults(all);
      setSelectedIndex(-1);
      setOpen(all.length > 0);
    } finally {
      setSearching(false);
    }
  }, [isAr, activeFilter]);

  const handleChange = (val: string) => {
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val), 300);
  };

  const handleSelect = (result: SearchResult) => {
    setOpen(false);
    setQuery("");
    if (result.type === "user") navigate(`/${result.id}`);
    else if (result.type === "post") navigate(`/community?post=${result.id}`);
    else if (result.type === "hashtag") navigate(`/community?tag=${result.id}`);
    else if (result.type === "recipe") navigate(`/recipes/${result.id}`);
    else if (result.type === "group") navigate(`/community?tab=groups&group=${result.id}`);
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault();
      handleSelect(results[selectedIndex]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const ICON_MAP: Record<ResultType, any> = {
    user: User,
    post: FileText,
    hashtag: Hash,
    recipe: UtensilsCrossed,
    group: UsersRound,
    event: CalendarDays,
  };

  const TYPE_LABELS: Record<ResultType, string> = {
    user: isAr ? "شخص" : "Person",
    post: isAr ? "منشور" : "Post",
    hashtag: isAr ? "وسم" : "Tag",
    recipe: isAr ? "وصفة" : "Recipe",
    group: isAr ? "مجموعة" : "Group",
    event: isAr ? "فعالية" : "Event",
  };

  const filters: { id: SearchFilter; label: string }[] = [
    { id: "all", label: isAr ? "الكل" : "All" },
    { id: "users", label: isAr ? "أشخاص" : "People" },
    { id: "posts", label: isAr ? "منشورات" : "Posts" },
    { id: "recipes", label: isAr ? "وصفات" : "Recipes" },
    { id: "groups", label: isAr ? "مجموعات" : "Groups" },
  ];

  return (
    <div ref={containerRef} className="relative">
      <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      {searching && <Loader2 className="absolute end-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground animate-spin" />}
      <Input
        ref={inputRef}
        placeholder={isAr ? "بحث في المجتمع..." : "Search community..."}
        className="ps-9 pe-8 rounded-full bg-muted/50 border-0 focus-visible:ring-1"
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
        onKeyDown={handleKeyDown}
      />
      {open && (
        <div className="absolute top-full mt-1 inset-x-0 z-50 rounded-xl border border-border bg-popover shadow-lg overflow-hidden animate-in fade-in-50 slide-in-from-top-2 duration-200">
          {/* Filter pills */}
          <div className="flex gap-1 px-2 pt-2 pb-1 overflow-x-auto scrollbar-none">
            {filters.map((f) => (
              <button
                key={f.id}
                onClick={() => { setActiveFilter(f.id); if (query.length >= 2) search(query); }}
                className={cn(
                  "shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold transition-colors",
                  activeFilter === f.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
          {results.map((r, i) => {
            const Icon = ICON_MAP[r.type];
            return (
              <button
                key={`${r.type}-${r.id}-${i}`}
                className={cn(
                  "flex w-full items-center gap-2.5 px-3 py-2.5 text-start transition-colors",
                  selectedIndex === i ? "bg-accent" : "hover:bg-muted/50"
                )}
                onClick={() => handleSelect(r)}
                onMouseEnter={() => setSelectedIndex(i)}
              >
                {(r.type === "user" || r.type === "recipe" || r.type === "group") && r.avatar ? (
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={r.avatar} />
                    <AvatarFallback className="text-[10px]">{r.title[0]}</AvatarFallback>
                  </Avatar>
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                    <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{r.title}</p>
                  {r.subtitle && <p className="text-[10px] text-muted-foreground truncate">{r.subtitle}</p>}
                </div>
                <Badge variant="outline" className="text-[9px] shrink-0">
                  {TYPE_LABELS[r.type]}
                </Badge>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
});
