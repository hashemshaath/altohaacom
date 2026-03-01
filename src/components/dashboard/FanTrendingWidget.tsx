import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TrendingUp, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";

export function FanTrendingWidget() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data: trendingPosts = [] } = useQuery({
    queryKey: ["fan-trending-posts"],
    queryFn: async () => {
      const { data } = await supabase
        .from("posts")
        .select("id, content, author_id, created_at, replies_count, reposts_count")
        .eq("visibility", "public")
        .order("reposts_count", { ascending: false })
        .limit(5);
      if (!data || data.length === 0) return [];

      const authorIds = [...new Set(data.map((p) => p.author_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url, username")
        .in("user_id", authorIds);

      const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);
      return data.map((p) => ({ ...p, author: profileMap.get(p.author_id) }));
    },
    staleTime: 1000 * 60 * 5,
  });

  if (trendingPosts.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingUp className="h-4 w-4 text-chart-4" />
          {isAr ? "المنشورات الرائجة" : "Trending Posts"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {trendingPosts.map((post) => (
          <Link key={post.id} to="/community" className="block group">
            <div className="flex items-start gap-3 rounded-xl p-2 transition-colors hover:bg-muted/50">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarImage src={post.author?.avatar_url || undefined} />
                <AvatarFallback className="text-xs">
                  {(post.author?.full_name || "U")[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground/80 truncate">
                  {post.author?.full_name || post.author?.username || (isAr ? "مستخدم" : "User")}
                </p>
                <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
                  {post.content?.slice(0, 100)}
                </p>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MessageCircle className="h-3 w-3" /> {post.replies_count || 0}
                  </span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
