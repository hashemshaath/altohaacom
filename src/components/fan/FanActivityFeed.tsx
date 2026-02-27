import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Rss, Heart, MessageCircle, Repeat2, Image as ImageIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";

export function FanActivityFeed() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["fan-activity-feed", user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Get followed user IDs
      const { data: follows } = await supabase
        .from("user_follows")
        .select("following_id")
        .eq("follower_id", user.id);

      if (!follows || follows.length === 0) return [];
      const followedIds = follows.map((f) => f.following_id);

      // Get recent posts from followed users
      const { data: feedPosts } = await supabase
        .from("posts")
        .select("id, content, image_urls, created_at, author_id, replies_count, reposts_count, visibility")
        .in("author_id", followedIds)
        .eq("visibility", "public")
        .order("created_at", { ascending: false })
        .limit(20);

      if (!feedPosts || feedPosts.length === 0) return [];

      // Get author profiles
      const authorIds = [...new Set(feedPosts.map((p) => p.author_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url, username, specialization")
        .in("user_id", authorIds);

      const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);

      return feedPosts.map((post) => ({
        ...post,
        author: profileMap.get(post.author_id),
      }));
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 2,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-sm">{isAr ? "آخر أخبار المتابَعين" : "Following Feed"}</CardTitle></CardHeader>
        <CardContent><div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />)}</div></CardContent>
      </Card>
    );
  }

  if (posts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Rss className="h-4 w-4 text-chart-2" />
            {isAr ? "آخر أخبار المتابَعين" : "Following Feed"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center py-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-3">
              <Rss className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">{isAr ? "لا توجد منشورات بعد" : "No posts yet"}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {isAr ? "تابع طهاة لرؤية منشوراتهم هنا" : "Follow chefs to see their posts here"}
            </p>
            <Link to="/community" className="mt-3 text-xs font-medium text-primary hover:underline">
              {isAr ? "تصفح المجتمع" : "Browse Community"} →
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Rss className="h-4 w-4 text-chart-2" />
            {isAr ? "آخر أخبار المتابَعين" : "Following Feed"}
          </CardTitle>
          <Link to="/community" className="text-xs text-primary hover:underline">
            {isAr ? "عرض الكل" : "View all"}
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {posts.slice(0, 8).map((post: any) => (
          <Link
            key={post.id}
            to="/community"
            className="flex gap-3 p-2.5 rounded-xl border border-border/30 hover:bg-muted/40 transition-colors"
          >
            <Avatar className="h-9 w-9 shrink-0">
              <AvatarImage src={post.author?.avatar_url || undefined} />
              <AvatarFallback className="text-xs">{(post.author?.full_name || "U")[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-xs font-semibold truncate">{post.author?.full_name || post.author?.username}</p>
                {post.author?.specialization && (
                  <Badge variant="secondary" className="text-[9px] shrink-0">{post.author.specialization}</Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{post.content}</p>
              {post.image_urls && post.image_urls.length > 0 && (
                <div className="flex items-center gap-1 mt-1">
                  <ImageIcon className="h-3 w-3 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground">{post.image_urls.length} {isAr ? "صورة" : "media"}</span>
                </div>
              )}
              <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-0.5"><MessageCircle className="h-2.5 w-2.5" />{post.replies_count || 0}</span>
                <span className="flex items-center gap-0.5"><Repeat2 className="h-2.5 w-2.5" />{post.reposts_count || 0}</span>
                <span className="ms-auto">
                  {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: isAr ? ar : enUS })}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
