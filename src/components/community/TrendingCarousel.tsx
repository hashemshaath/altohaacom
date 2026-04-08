import { memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Flame, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRef, useCallback } from "react";
import { cn } from "@/lib/utils";

interface TrendingPost {
  id: string;
  content: string;
  author_name: string | null;
  author_avatar: string | null;
  replies_count: number;
  reposts_count: number;
  score: number;
}

export const TrendingCarousel = memo(function TrendingCarousel() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: trending = [], isLoading } = useQuery({
    queryKey: ["trending-posts-v2"],
    queryFn: async () => {
      const since = new Date(Date.now() - 48 * 3600000).toISOString();

      // Single query: get posts with their built-in counters
      const { data: posts } = await supabase
        .from("posts")
        .select("id, content, author_id, replies_count, reposts_count")
        .is("reply_to_post_id", null)
        .eq("moderation_status", "approved")
        .gte("created_at", since)
        .order("replies_count", { ascending: false })
        .limit(30);

      if (!posts?.length) return [];

      // Score using built-in counters (no extra queries needed!)
      const scored = posts
        .map(p => ({
          ...p,
          score: (p.replies_count || 0) * 3 + (p.reposts_count || 0) * 2,
        }))
        .filter(p => p.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);

      if (scored.length === 0) return [];

      // Single batch profile fetch
      const authorIds = [...new Set(scored.map(p => p.author_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, display_name, avatar_url")
        .in("user_id", authorIds);

      const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));

      return scored.map((p): TrendingPost => ({
        id: p.id,
        content: p.content,
        author_name: profileMap.get(p.author_id)?.display_name || profileMap.get(p.author_id)?.full_name || null,
        author_avatar: profileMap.get(p.author_id)?.avatar_url || null,
        replies_count: p.replies_count,
        reposts_count: p.reposts_count,
        score: p.score,
      }));
    },
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 20,
  });

  const scroll = useCallback((dir: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = dir === "left" ? -240 : 240;
    scrollRef.current.scrollBy({ left: isAr ? -amount : amount, behavior: "smooth" });
  }, [isAr]);

  if (isLoading || trending.length === 0) return null;

  return (
    <div className="border-b border-border px-4 py-3">
      <div className="flex items-center justify-between mb-2.5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Flame className="h-3.5 w-3.5 text-destructive" />
          {isAr ? "الأكثر تفاعلاً" : "Trending Now"}
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-bold tabular-nums">{trending.length}</Badge>
        </h3>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full hover:bg-muted/50" onClick={() => scroll("left")}>
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full hover:bg-muted/50" onClick={() => scroll("right")}>
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      <div ref={scrollRef} className="flex gap-2.5 overflow-x-auto scrollbar-none scroll-smooth snap-x snap-mandatory">
        {trending.map((post, idx) => (
          <button
            key={post.id}
            onClick={() => navigate(`/community?post=${post.id}`)}
            className="shrink-0 w-[200px] snap-start rounded-xl border border-border/60 bg-card p-3 text-start hover:bg-muted/30 hover:border-primary/20 hover:shadow-md transition-all duration-200 group active:scale-[0.98] touch-manipulation"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="relative">
                <Avatar className="h-6 w-6 ring-1 ring-border/20">
                  <AvatarImage src={post.author_avatar || undefined} />
                  <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-bold">
                    {(post.author_name || "C")[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {idx < 3 && <span className="absolute -top-0.5 -end-0.5 h-2 w-2 rounded-full bg-chart-4 ring-1 ring-card" />}
              </div>
              <span className="text-[12px] font-semibold truncate group-hover:text-primary transition-colors">
                {post.author_name || "Chef"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mb-2">
              {post.content.slice(0, 100)}
            </p>
            <div className="flex gap-3 text-[11px] text-muted-foreground font-medium">
              <span className="flex items-center gap-0.5">💬 {post.replies_count}</span>
              <span className="flex items-center gap-0.5">🔄 {post.reposts_count}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
});
