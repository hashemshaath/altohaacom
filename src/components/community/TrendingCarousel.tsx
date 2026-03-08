import { memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Flame, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRef } from "react";
import { cn } from "@/lib/utils";

interface TrendingPost {
  id: string;
  content: string;
  author_name: string | null;
  author_avatar: string | null;
  likes_count: number;
  comments_count: number;
}

export function TrendingCarousel() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: trending = [], isLoading } = useQuery({
    queryKey: ["trending-posts"],
    queryFn: async () => {
      // Get posts from last 48 hours with most likes
      const since = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
      const { data: posts } = await supabase
        .from("posts")
        .select("id, content, author_id, created_at")
        .is("reply_to_post_id", null)
        .eq("moderation_status", "approved")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(50);

      if (!posts?.length) return [];

      const postIds = posts.map((p) => p.id);
      const authorIds = [...new Set(posts.map((p) => p.author_id))];

      const [likesRes, commentsRes, profilesRes] = await Promise.all([
        supabase.from("post_likes").select("post_id").in("post_id", postIds),
        supabase.from("post_comments").select("post_id").in("post_id", postIds),
        supabase.from("profiles").select("user_id, full_name, full_name_ar, display_name, display_name_ar, avatar_url").in("user_id", authorIds),
      ]);

      const likesMap = new Map<string, number>();
      const commentsMap = new Map<string, number>();
      const profileMap = new Map(profilesRes.data?.map((p) => [p.user_id, p]) || []);

      likesRes.data?.forEach((l) => likesMap.set(l.post_id, (likesMap.get(l.post_id) || 0) + 1));
      commentsRes.data?.forEach((c) => commentsMap.set(c.post_id, (commentsMap.get(c.post_id) || 0) + 1));

      const scored = posts.map((p) => ({
        ...p,
        score: (likesMap.get(p.id) || 0) * 2 + (commentsMap.get(p.id) || 0) * 3,
        likes_count: likesMap.get(p.id) || 0,
        comments_count: commentsMap.get(p.id) || 0,
        author_name: profileMap.get(p.author_id)?.display_name || profileMap.get(p.author_id)?.full_name || null,
        author_avatar: profileMap.get(p.author_id)?.avatar_url || null,
      }));

      return scored
        .filter((p) => p.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 10) as TrendingPost[];
    },
    staleTime: 1000 * 60 * 10,
  });

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = dir === "left" ? -240 : 240;
    scrollRef.current.scrollBy({ left: isAr ? -amount : amount, behavior: "smooth" });
  };

  if (isLoading || trending.length === 0) return null;

  return (
    <div className="border-b border-border px-4 py-3">
      <div className="flex items-center justify-between mb-2.5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Flame className="h-3.5 w-3.5 text-destructive" />
          {isAr ? "الأكثر تفاعلاً" : "Trending Now"}
        </h3>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" onClick={() => scroll("left")}>
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" onClick={() => scroll("right")}>
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      <div ref={scrollRef} className="flex gap-2.5 overflow-x-auto scrollbar-none">
        {trending.map((post) => (
          <button
            key={post.id}
            onClick={() => navigate(`/community?post=${post.id}`)}
            className="shrink-0 w-[200px] rounded-xl border border-border bg-card p-3 text-start hover:bg-muted/30 transition-colors group"
          >
            <div className="flex items-center gap-2 mb-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={post.author_avatar || undefined} />
                <AvatarFallback className="text-[8px] bg-primary/10 text-primary">
                  {(post.author_name || "C")[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-[11px] font-semibold truncate group-hover:text-primary transition-colors">
                {post.author_name || "Chef"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mb-2">
              {post.content.slice(0, 100)}
            </p>
            <div className="flex gap-3 text-[10px] text-muted-foreground">
              <span>❤️ {post.likes_count}</span>
              <span>💬 {post.comments_count}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
