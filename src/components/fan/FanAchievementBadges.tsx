import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Award, Heart, Users, MessageCircle, Eye, Star, Trophy, Flame } from "lucide-react";

interface FanBadge {
  id: string;
  icon: any;
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  threshold: number;
  current: number;
  earned: boolean;
  color: string;
}

export function FanAchievementBadges() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data: badges = [] } = useQuery({
    queryKey: ["fan-achievement-badges", user?.id],
    queryFn: async (): Promise<FanBadge[]> => {
      if (!user) return [];

      const followingRes = await supabase.from("user_follows").select("id").eq("follower_id", user.id);
      const favoritesRes = await supabase.from("fan_favorites").select("id").eq("user_id", user.id);
      const commentsRes = await supabase.from("post_comments").select("id").eq("author_id", user.id);

      const followingCount = followingRes.data?.length ?? 0;
      const favoritesCount = favoritesRes.data?.length ?? 0;
      const commentsCount = commentsRes.data?.length ?? 0;

      return [
        {
          id: "first-follow", icon: Users, title: "First Follow", titleAr: "أول متابعة",
          description: "Follow your first chef", descriptionAr: "تابع أول طاهٍ",
          threshold: 1, current: followingCount, earned: followingCount >= 1, color: "text-chart-2",
        },
        {
          id: "social-butterfly", icon: Users, title: "Social Butterfly", titleAr: "فراشة اجتماعية",
          description: "Follow 10 chefs", descriptionAr: "تابع 10 طهاة",
          threshold: 10, current: followingCount, earned: followingCount >= 10, color: "text-chart-2",
        },
        {
          id: "superfan", icon: Star, title: "Superfan", titleAr: "معجب خارق",
          description: "Follow 50 chefs", descriptionAr: "تابع 50 طاهياً",
          threshold: 50, current: followingCount, earned: followingCount >= 50, color: "text-chart-4",
        },
        {
          id: "first-fav", icon: Heart, title: "First Favorite", titleAr: "أول مفضلة",
          description: "Save your first favorite", descriptionAr: "احفظ أول مفضلة",
          threshold: 1, current: favoritesCount, earned: favoritesCount >= 1, color: "text-destructive",
        },
        {
          id: "collector", icon: Heart, title: "Collector", titleAr: "جامع",
          description: "Save 20 favorites", descriptionAr: "احفظ 20 مفضلة",
          threshold: 20, current: favoritesCount, earned: favoritesCount >= 20, color: "text-destructive",
        },
        {
          id: "first-comment", icon: MessageCircle, title: "First Comment", titleAr: "أول تعليق",
          description: "Leave your first comment", descriptionAr: "اترك أول تعليق",
          threshold: 1, current: commentsCount, earned: commentsCount >= 1, color: "text-chart-3",
        },
        {
          id: "conversationalist", icon: MessageCircle, title: "Conversationalist", titleAr: "محاور",
          description: "Leave 25 comments", descriptionAr: "اترك 25 تعليقاً",
          threshold: 25, current: commentsCount, earned: commentsCount >= 25, color: "text-chart-3",
        },
        {
          id: "engaged", icon: Flame, title: "Engaged Fan", titleAr: "معجب نشط",
          description: "Follow 5 chefs & save 5 favorites", descriptionAr: "تابع 5 طهاة واحفظ 5 مفضلات",
          threshold: 1, current: (followingCount >= 5 && favoritesCount >= 5) ? 1 : 0,
          earned: followingCount >= 5 && favoritesCount >= 5, color: "text-primary",
        },
      ];
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 10,
  });

  const earnedCount = badges.filter(b => b.earned).length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Award className="h-4 w-4 text-chart-4" />
            {isAr ? "إنجازاتي" : "My Achievements"}
          </CardTitle>
          <Badge variant="secondary" className="text-[10px]">
            {earnedCount}/{badges.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {badges.map((badge) => {
            const Icon = badge.icon;
            const progress = Math.min((badge.current / badge.threshold) * 100, 100);
            return (
              <div
                key={badge.id}
                className={`relative flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${
                  badge.earned
                    ? "border-primary/30 bg-primary/5 shadow-sm"
                    : "border-border/30 bg-muted/20 opacity-60"
                }`}
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                  badge.earned ? "bg-primary/10" : "bg-muted"
                }`}>
                  <Icon className={`h-5 w-5 ${badge.earned ? badge.color : "text-muted-foreground"}`} />
                </div>
                <p className="text-[10px] font-semibold text-center leading-tight">
                  {isAr ? badge.titleAr : badge.title}
                </p>
                <p className="text-[9px] text-muted-foreground text-center leading-tight">
                  {isAr ? badge.descriptionAr : badge.description}
                </p>
                {!badge.earned && (
                  <div className="w-full mt-1">
                    <div className="h-1 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-primary/60 transition-all" style={{ width: `${progress}%` }} />
                    </div>
                    <p className="text-[8px] text-muted-foreground text-center mt-0.5">
                      {badge.current}/{badge.threshold}
                    </p>
                  </div>
                )}
                {badge.earned && (
                  <div className="absolute -top-1 -end-1 h-4 w-4 rounded-full bg-primary flex items-center justify-center">
                    <Trophy className="h-2.5 w-2.5 text-primary-foreground" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
