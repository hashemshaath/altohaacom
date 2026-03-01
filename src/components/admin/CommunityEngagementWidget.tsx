import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Users, MessageSquare, Heart, BookmarkPlus, TrendingUp, Flame, UserPlus, Eye } from "lucide-react";

export function CommunityEngagementWidget() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data } = useQuery({
    queryKey: ["community-engagement-widget"],
    queryFn: async () => {
      const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
      const [
        { count: totalPosts },
        { count: weekPosts },
        { count: totalComments },
        { count: weekComments },
        { count: totalReactions },
        { count: totalFollows },
        { count: weekFollows },
        { count: totalStories },
      ] = await Promise.all([
        supabase.from("posts").select("*", { count: "exact", head: true }),
        supabase.from("posts").select("*", { count: "exact", head: true }).gte("created_at", weekAgo),
        supabase.from("post_comments").select("*", { count: "exact", head: true }),
        supabase.from("post_comments").select("*", { count: "exact", head: true }).gte("created_at", weekAgo),
        supabase.from("post_reactions").select("*", { count: "exact", head: true }),
        supabase.from("user_follows").select("*", { count: "exact", head: true }),
        supabase.from("user_follows").select("*", { count: "exact", head: true }).gte("created_at", weekAgo),
        supabase.from("community_stories").select("*", { count: "exact", head: true }),
      ]);

      const engagementRate = (totalPosts || 0) > 0
        ? Math.round((((totalComments || 0) + (totalReactions || 0)) / (totalPosts || 1)) * 100) / 100
        : 0;

      return {
        totalPosts: totalPosts || 0, weekPosts: weekPosts || 0,
        totalComments: totalComments || 0, weekComments: weekComments || 0,
        totalReactions: totalReactions || 0,
        totalFollows: totalFollows || 0, weekFollows: weekFollows || 0,
        totalStories: totalStories || 0,
        engagementRate,
      };
    },
    staleTime: 60000,
  });

  if (!data) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Users className="h-4 w-4 text-chart-5" />
            {isAr ? "تفاعل المجتمع" : "Community Engagement"}
          </CardTitle>
          <Badge variant="outline" className="text-[9px]">{data.engagementRate} {isAr ? "معدل" : "avg/post"}</Badge>
        </div>
      </CardHeader>
      <CardContent className="p-3 space-y-3">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            { icon: MessageSquare, label: isAr ? "المنشورات" : "Posts", value: data.totalPosts, sub: `+${data.weekPosts} ${isAr ? "هذا الأسبوع" : "this week"}`, color: "text-chart-1" },
            { icon: Heart, label: isAr ? "التعليقات" : "Comments", value: data.totalComments, sub: `+${data.weekComments} ${isAr ? "هذا الأسبوع" : "this week"}`, color: "text-chart-2" },
            { icon: Flame, label: isAr ? "التفاعلات" : "Reactions", value: data.totalReactions, color: "text-chart-4" },
            { icon: UserPlus, label: isAr ? "المتابعات" : "Follows", value: data.totalFollows, sub: `+${data.weekFollows} ${isAr ? "جديد" : "new"}`, color: "text-chart-3" },
          ].map((m, i) => (
            <div key={i} className="p-2 rounded-xl bg-muted/30 border border-border/40">
              <div className="flex items-center gap-1.5 mb-1">
                <m.icon className={`h-3 w-3 ${m.color}`} />
                <span className="text-[9px] text-muted-foreground">{m.label}</span>
              </div>
              <p className="text-base font-bold">{m.value.toLocaleString()}</p>
              {m.sub && <p className="text-[8px] text-muted-foreground">{m.sub}</p>}
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 text-[10px]">
          <span className="flex items-center gap-1 text-chart-5"><Eye className="h-3 w-3" /> {data.totalStories} {isAr ? "قصة" : "stories"}</span>
          <span className="flex items-center gap-1 text-chart-2"><TrendingUp className="h-3 w-3" /> {data.engagementRate} {isAr ? "تفاعل/منشور" : "interactions/post"}</span>
        </div>
      </CardContent>
    </Card>
  );
}
