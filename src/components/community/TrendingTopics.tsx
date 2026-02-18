import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Hash } from "lucide-react";
import { Link } from "react-router-dom";

export function TrendingTopics() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data: trending, isLoading } = useQuery({
    queryKey: ["trending-topics"],
    queryFn: async () => {
      // Get recent posts (last 7 days) and extract hashtags
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const { data: posts } = await supabase
        .from("posts")
        .select("content, created_at")
        .gte("created_at", weekAgo.toISOString())
        .eq("visibility", "public")
        .order("created_at", { ascending: false })
        .limit(200);

      if (!posts) return [];

      // Extract and count hashtags
      const tagCounts: Record<string, number> = {};
      posts.forEach((post) => {
        const tags = post.content.match(/#[\w\u0600-\u06FF]+/g) || [];
        tags.forEach((tag) => {
          const normalized = tag.toLowerCase();
          tagCounts[normalized] = (tagCounts[normalized] || 0) + 1;
        });
      });

      // Sort by count, take top 8
      return Object.entries(tagCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([tag, count]) => ({ tag, count }));
    },
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-8 w-full rounded-lg" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!trending || trending.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <TrendingUp className="h-4 w-4 text-primary" />
          {isAr ? "المواضيع الرائجة" : "Trending Topics"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {trending.map(({ tag, count }, i) => (
          <Link
            key={tag}
            to={`/community?tag=${encodeURIComponent(tag.slice(1))}`}
            className="flex items-center gap-2.5 rounded-lg p-2 hover:bg-accent/50 transition-colors group"
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/10 text-[10px] font-bold text-primary">
              {i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                {tag}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {count} {isAr ? "منشور" : count === 1 ? "post" : "posts"}
              </p>
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
