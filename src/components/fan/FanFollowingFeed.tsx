import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Rss, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";

export function FanFollowingFeed() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { user } = useAuth();

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["fan-following-feed", user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Get followed user IDs
      const { data: follows } = await supabase
        .from("user_follows")
        .select("following_id")
        .eq("follower_id", user.id);

      const followedIds = follows?.map(f => f.following_id) || [];
      if (followedIds.length === 0) return [];

      // Get recent posts from followed users
      const { data: recentPosts } = await supabase
        .from("posts")
        .select("id, content, created_at, author_id, replies_count, image_urls")
        .in("author_id", followedIds)
        .order("created_at", { ascending: false })
        .limit(10);

      if (!recentPosts || recentPosts.length === 0) return [];

      // Get author profiles
      const authorIds = [...new Set(recentPosts.map(p => p.author_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, username, avatar_url")
        .in("user_id", authorIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      return recentPosts.map(p => ({
        ...p,
        author: profileMap.get(p.author_id),
      }));
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 2,
  });

  if (isLoading) return <div className="h-48 rounded-xl bg-muted/50 animate-pulse" />;
  if (posts.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-chart-1/10">
            <Rss className="h-3.5 w-3.5 text-chart-1" />
          </div>
          {isAr ? "آخر أخبار من تتابعهم" : "From People You Follow"}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {posts.map((post: any) => (
          <Link
            key={post.id}
            to="/community"
            className="block rounded-lg p-2.5 hover:bg-muted/40 transition-colors border border-border/20"
          >
            <div className="flex items-start gap-2.5">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarImage src={post.author?.avatar_url} />
                <AvatarFallback className="text-[10px]">{(post.author?.full_name || "?")[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-xs font-semibold truncate">{post.author?.full_name || post.author?.username}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: isAr ? ar : enUS })}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">{post.content}</p>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                    <MessageCircle className="h-2.5 w-2.5" /> {post.replies_count || 0}
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
