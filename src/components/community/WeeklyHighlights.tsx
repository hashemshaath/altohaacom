import { memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Flame, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { MS_PER_DAY, MS_PER_WEEK } from "@/lib/constants";

export const WeeklyHighlights = memo(function WeeklyHighlights() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data, isLoading } = useQuery({
    queryKey: ["community-weekly-highlights"],
    queryFn: async () => {
      const weekAgo = new Date(Date.now() - MS_PER_WEEK).toISOString();

      // Single query: top posts by engagement (replies + reposts)
      const { data: topPosts } = await supabase
        .from("posts")
        .select("id, content, author_id, replies_count, reposts_count")
        .is("reply_to_post_id", null)
        .eq("moderation_status", "approved")
        .gte("created_at", weekAgo)
        .order("replies_count", { ascending: false })
        .limit(5);

      if (!topPosts?.length) return { topPosts: [], topAuthors: [] };

      // Collect unique author IDs for batch profile fetch
      const authorIds = [...new Set(topPosts.map(p => p.author_id))];

      // Count post frequency per author from the same result set
      const authorCounts = new Map<string, number>();
      topPosts.forEach(p => {
        authorCounts.set(p.author_id, (authorCounts.get(p.author_id) || 0) + 1);
      });

      // Single batch profile query for all needed profiles
      const { data: profiles } = authorIds.length > 0
        ? await supabase
            .from("profiles")
            .select("user_id, full_name, display_name, avatar_url, username")
            .in("user_id", authorIds)
        : { data: [] };

      const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));

      return {
        topPosts: topPosts.slice(0, 3).map(p => ({
          ...p,
          profile: profileMap.get(p.author_id),
        })),
        topAuthors: [...authorCounts.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([id, count]) => ({
            userId: id,
            postCount: count,
            profile: profileMap.get(id),
          })),
      };
    },
    staleTime: 1000 * 60 * 15,
    gcTime: 1000 * 60 * 30,
  });

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border/40 bg-card p-4 space-y-3">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (!data || (data.topPosts.length === 0 && data.topAuthors.length === 0)) return null;

  return (
    <div className="rounded-2xl border border-border/40 bg-card overflow-hidden">
      <div className="px-4 pt-3 pb-2 flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-chart-4/10">
          <Trophy className="h-3.5 w-3.5 text-chart-4" />
        </div>
        <h3 className="text-sm font-bold">{isAr ? "أبرز الأحداث الأسبوعية" : "Weekly Highlights"}</h3>
      </div>

      {data.topPosts.length > 0 && (
        <div className="px-4 pb-2">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Flame className="h-3 w-3 text-destructive" />
            {isAr ? "أفضل المنشورات" : "Top Posts"}
          </p>
          <div className="space-y-2">
            {data.topPosts.map((post, idx) => (
              <div
                key={post.id}
                className="flex items-start gap-2 rounded-xl p-2 hover:bg-muted/30 transition-colors cursor-pointer group"
              >
                <span className={cn(
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[10px] font-bold mt-0.5",
                  idx === 0 ? "bg-chart-4/15 text-chart-4" : "bg-muted text-muted-foreground"
                )}>
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs leading-relaxed line-clamp-2 text-foreground/80 group-hover:text-foreground transition-colors">
                    {post.content.slice(0, 80)}{post.content.length > 80 ? "..." : ""}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Avatar className="h-4 w-4 rounded-md">
                      <AvatarImage src={post.profile?.avatar_url || undefined} className="rounded-md" />
                      <AvatarFallback className="rounded-md text-[7px] bg-muted">
                        {(post.profile?.display_name || post.profile?.full_name || "C")[0]}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-[10px] text-muted-foreground truncate">
                      {post.profile?.display_name || post.profile?.full_name || "Chef"}
                    </span>
                    <div className="flex items-center gap-1.5 ms-auto text-[10px] text-muted-foreground">
                      <span>💬 {post.replies_count}</span>
                      <span>🔄 {post.reposts_count}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.topAuthors.length > 0 && (
        <div className="px-4 pb-3 pt-1 border-t border-border/20">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5 pt-2">
            <Star className="h-3 w-3 text-primary" />
            {isAr ? "الأكثر نشاطاً" : "Most Active"}
          </p>
          <div className="flex items-center gap-1 flex-wrap">
            {data.topAuthors.map(({ userId, postCount, profile }) => (
              <Link
                key={userId}
                to={`/${profile?.username || userId}`}
                className="group/member relative"
                title={`${profile?.display_name || profile?.full_name || "Chef"} — ${postCount} ${isAr ? "منشور" : "posts"}`}
              >
                <Avatar className="h-8 w-8 rounded-lg ring-2 ring-background transition-transform group-hover/member:scale-110 group-hover/member:ring-primary/40">
                  <AvatarImage src={profile?.avatar_url || undefined} className="rounded-lg" />
                  <AvatarFallback className="rounded-lg text-[10px] font-bold bg-primary/10 text-primary">
                    {(profile?.display_name || profile?.full_name || "C")[0]}
                  </AvatarFallback>
                </Avatar>
                <Badge className="absolute -bottom-1 -end-1 h-4 min-w-4 px-1 rounded-full text-[10px] font-bold bg-primary text-primary-foreground border-2 border-background">
                  {postCount}
                </Badge>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});
