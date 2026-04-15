import { useIsAr } from "@/hooks/useIsAr";
import { memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Flame, Hash, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { MS_PER_DAY, MS_PER_WEEK, QUERY_LIMIT_MEDIUM } from "@/lib/constants";
import { CACHE } from "@/lib/queryConfig";

export const TrendingTopics = memo(function TrendingTopics() {
  const isAr = useIsAr();

  const { data: topics = [], isLoading } = useQuery({
    queryKey: ["trending-topics"],
    queryFn: async () => {
      // Get recent posts with hashtags (last 7 days)
      const weekAgo = new Date(Date.now() - MS_PER_WEEK).toISOString();
      const { data: posts } = await supabase
        .from("posts")
        .select("content, replies_count, reposts_count, created_at")
        .eq("moderation_status", "approved")
        .gte("created_at", weekAgo)
        .order("created_at", { ascending: false })
        .limit(QUERY_LIMIT_MEDIUM);

      if (!posts) return [];

      // Extract hashtags and count engagement
      const tagMap = new Map<string, { count: number; engagement: number }>();
      posts.forEach((post) => {
        const tags = (post.content || "").match(/#(\w+)/g);
        if (tags) {
          tags.forEach((tag: string) => {
            const clean = tag.toLowerCase();
            const existing = tagMap.get(clean) || { count: 0, engagement: 0 };
            existing.count++;
            existing.engagement += (post.reposts_count || 0) * 2 + (post.replies_count || 0) * 3;
            tagMap.set(clean, existing);
          });
        }
      });

      return Array.from(tagMap.entries())
        .map(([tag, data]) => ({ tag, ...data, score: data.count * 5 + data.engagement }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);
    },
    staleTime: CACHE.long.staleTime,
  });

  if (!isLoading && topics.length === 0) return null;

  return (
    <Card className="border-border/40 bg-card/60 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-chart-4/10">
            <Flame className="h-3.5 w-3.5 text-chart-4" />
          </div>
          {isAr ? "المواضيع الرائجة" : "Trending Topics"}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {isLoading ? (
          <div className="space-y-2.5">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-8 rounded-xl bg-muted/50 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-1">
            {topics.map((topic, idx) => (
              <Link
                key={topic.tag}
                to={`/community?tag=${topic.tag.replace("#", "")}`}
                className="flex items-center gap-3 rounded-xl p-2 hover:bg-muted/40 transition-all duration-200 group hover:-translate-x-0.5 rtl:hover:translate-x-0.5"
              >
                <span className="text-xs font-bold text-muted-foreground w-5 text-center tabular-nums">{idx + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold group-hover:text-primary transition-colors">{topic.tag}</p>
                  <p className="text-xs text-muted-foreground">
                    {topic.count} {isAr ? "منشور" : "posts"} · {topic.engagement} {isAr ? "تفاعل" : "engagements"}
                  </p>
                </div>
                {idx < 3 && (
                  <TrendingUp className="h-3.5 w-3.5 text-chart-4 shrink-0" />
                )}
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
});
