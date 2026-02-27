import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, Trophy, Landmark, TrendingUp, ChefHat, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

export function FanWeeklyDigest() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data: digest, isLoading } = useQuery({
    queryKey: ["fan-weekly-digest", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      // Get followed user IDs
      const { data: follows } = await supabase
        .from("user_follows")
        .select("following_id")
        .eq("follower_id", user.id);
      const followedIds = follows?.map(f => f.following_id) || [];

      // Parallel fetch
      const [postsRes, compsRes, exhsRes, newFollowersRes] = await Promise.all([
        followedIds.length > 0
          ? supabase.from("posts").select("id, content, author_id, created_at").in("author_id", followedIds).gte("created_at", weekAgo).order("created_at", { ascending: false }).limit(5)
          : { data: [] },
        supabase.from("competitions").select("id, title, title_ar, start_date, slug, country_code").gte("start_date", new Date().toISOString()).order("start_date").limit(3),
        supabase.from("exhibitions").select("id, title, title_ar, start_date, slug, city").gte("start_date", new Date().toISOString()).order("start_date").limit(3),
        supabase.from("user_follows").select("follower_id").eq("following_id", user.id).gte("created_at", weekAgo),
      ]);

      // Get author profiles for posts
      const authorIds = [...new Set((postsRes.data || []).map((p: any) => p.author_id))];
      let profiles: any[] = [];
      if (authorIds.length > 0) {
        const { data } = await supabase.from("profiles").select("user_id, full_name, avatar_url, username").in("user_id", authorIds);
        profiles = data || [];
      }
      const profileMap = new Map(profiles.map(p => [p.user_id, p]));

      return {
        posts: (postsRes.data || []).map((p: any) => ({ ...p, author: profileMap.get(p.author_id) })),
        upcomingComps: compsRes.data || [],
        upcomingExhs: exhsRes.data || [],
        newFollowers: newFollowersRes.data?.length || 0,
        followingCount: followedIds.length,
      };
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 10,
  });

  if (isLoading) return <div className="h-48 rounded-xl bg-muted/50 animate-pulse" />;
  if (!digest) return null;

  const hasContent = digest.posts.length > 0 || digest.upcomingComps.length > 0 || digest.upcomingExhs.length > 0;
  if (!hasContent && digest.newFollowers === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
          </div>
          {isAr ? "ملخصك الأسبوعي" : "Your Weekly Digest"}
          <Badge variant="secondary" className="text-[10px] h-4 px-1.5">{isAr ? "هذا الأسبوع" : "This Week"}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-4">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg bg-muted/50 p-2.5 text-center">
            <p className="text-lg font-bold">{digest.followingCount}</p>
            <p className="text-[10px] text-muted-foreground">{isAr ? "متابَع" : "Following"}</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-2.5 text-center">
            <p className="text-lg font-bold">{digest.posts.length}</p>
            <p className="text-[10px] text-muted-foreground">{isAr ? "منشورات جديدة" : "New Posts"}</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-2.5 text-center">
            <p className="text-lg font-bold text-primary">+{digest.newFollowers}</p>
            <p className="text-[10px] text-muted-foreground">{isAr ? "متابعون جدد" : "New Followers"}</p>
          </div>
        </div>

        {/* Recent posts from followed chefs */}
        {digest.posts.length > 0 && (
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground mb-2 flex items-center gap-1">
              <ChefHat className="h-3 w-3" /> {isAr ? "من طهاتك المفضلين" : "From Your Chefs"}
            </p>
            <div className="space-y-1.5">
              {digest.posts.slice(0, 3).map((post: any) => (
                <Link key={post.id} to="/community" className="flex items-center gap-2 rounded-lg p-2 hover:bg-muted/40 transition-colors">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={post.author?.avatar_url} />
                    <AvatarFallback className="text-[9px]">{(post.author?.full_name || "?")[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-medium truncate">{post.author?.full_name}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{post.content}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Upcoming events */}
        {(digest.upcomingComps.length > 0 || digest.upcomingExhs.length > 0) && (
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground mb-2 flex items-center gap-1">
              <Calendar className="h-3 w-3" /> {isAr ? "أحداث قادمة" : "Upcoming Events"}
            </p>
            <div className="space-y-1">
              {digest.upcomingComps.map((c: any) => (
                <Link key={c.id} to={`/competitions/${c.slug}`} className="flex items-center gap-2 rounded-lg p-2 hover:bg-muted/40 transition-colors">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-primary/10">
                    <Trophy className="h-3 w-3 text-primary" />
                  </div>
                  <p className="text-[11px] font-medium truncate flex-1">{isAr ? c.title_ar || c.title : c.title}</p>
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    {new Date(c.start_date).toLocaleDateString(isAr ? "ar" : "en", { month: "short", day: "numeric" })}
                  </span>
                </Link>
              ))}
              {digest.upcomingExhs.map((e: any) => (
                <Link key={e.id} to={`/exhibitions/${e.slug}`} className="flex items-center gap-2 rounded-lg p-2 hover:bg-muted/40 transition-colors">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-chart-5/10">
                    <Landmark className="h-3 w-3 text-chart-5" />
                  </div>
                  <p className="text-[11px] font-medium truncate flex-1">{isAr ? e.title_ar || e.title : e.title}</p>
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    {new Date(e.start_date).toLocaleDateString(isAr ? "ar" : "en", { month: "short", day: "numeric" })}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
