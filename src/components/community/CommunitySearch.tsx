import { useState, useCallback, useRef, useEffect } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, Hash, User, FileText, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface SearchResult {
  type: "user" | "post" | "hashtag";
  id: string;
  title: string;
  subtitle?: string;
  avatar?: string | null;
}

export function CommunitySearch() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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

      // Search users
      const { data: users } = await supabase
        .from("profiles")
        .select("user_id, full_name, username, avatar_url")
        .or(`full_name.ilike.%${q}%,username.ilike.%${q}%`)
        .eq("account_status", "active")
        .limit(5);

      users?.forEach((u) => all.push({
        type: "user",
        id: u.user_id,
        title: u.full_name || u.username || "Chef",
        subtitle: u.username ? `@${u.username}` : undefined,
        avatar: u.avatar_url,
      }));

      // Search posts
      const { data: posts } = await supabase
        .from("posts")
        .select("id, content, author_id")
        .ilike("content", `%${q}%`)
        .eq("moderation_status", "approved")
        .is("reply_to_post_id", null)
        .order("created_at", { ascending: false })
        .limit(3);

      posts?.forEach((p) => all.push({
        type: "post",
        id: p.id,
        title: p.content.slice(0, 80) + (p.content.length > 80 ? "..." : ""),
      }));

      // Hashtag suggestion
      if (q.startsWith("#") || !q.includes(" ")) {
        const tag = q.replace("#", "");
        all.push({
          type: "hashtag",
          id: tag,
          title: `#${tag}`,
          subtitle: isAr ? "بحث بالهاشتاق" : "Search by hashtag",
        });
      }

      setResults(all);
      setOpen(all.length > 0);
    } finally {
      setSearching(false);
    }
  }, [isAr]);

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
  };

  const ICON_MAP = {
    user: User,
    post: FileText,
    hashtag: Hash,
  };

  return (
    <div ref={containerRef} className="relative">
      <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      {searching && <Loader2 className="absolute end-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground animate-spin" />}
      <Input
        placeholder={isAr ? "بحث في المجتمع..." : "Search community..."}
        className="ps-9 pe-8 rounded-full bg-muted/50 border-0 focus-visible:ring-1"
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
      />
      {open && (
        <div className="absolute top-full mt-1 inset-x-0 z-50 rounded-xl border border-border bg-popover shadow-lg overflow-hidden animate-in fade-in-50 slide-in-from-top-2 duration-200">
          {results.map((r, i) => {
            const Icon = ICON_MAP[r.type];
            return (
              <button
                key={`${r.type}-${r.id}-${i}`}
                className="flex w-full items-center gap-2.5 px-3 py-2.5 text-start hover:bg-muted/50 transition-colors"
                onClick={() => handleSelect(r)}
              >
                {r.type === "user" && r.avatar ? (
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
                  {r.type === "user" ? (isAr ? "شخص" : "Person") : r.type === "post" ? (isAr ? "منشور" : "Post") : (isAr ? "وسم" : "Tag")}
                </Badge>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
