import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, Medal, Star, Flame, Award, Crown, Target, Zap, Shield, Heart, BookOpen, ChefHat } from "lucide-react";
import { cn } from "@/lib/utils";

const BADGE_DEFINITIONS = [
  { id: "first_post", icon: BookOpen, name: "First Post", nameAr: "أول منشور", desc: "Share your first post", descAr: "شارك أول منشور", action: "post_created", target: 1, color: "text-blue-500 bg-blue-100" },
  { id: "popular_chef", icon: Heart, name: "Popular Chef", nameAr: "طاهٍ محبوب", desc: "Get 10 followers", descAr: "احصل على 10 متابعين", action: "follower_gained", target: 10, color: "text-pink-500 bg-pink-100" },
  { id: "recipe_master", icon: ChefHat, name: "Recipe Master", nameAr: "خبير وصفات", desc: "Share 5 recipes", descAr: "شارك 5 وصفات", action: "recipe_created", target: 5, color: "text-amber-500 bg-amber-100" },
  { id: "competitor", icon: Trophy, name: "Competitor", nameAr: "متسابق", desc: "Join a competition", descAr: "شارك في مسابقة", action: "competition_joined", target: 1, color: "text-yellow-500 bg-yellow-100" },
  { id: "winner", icon: Crown, name: "Champion", nameAr: "بطل", desc: "Win a competition", descAr: "فز في مسابقة", action: "competition_won", target: 1, color: "text-purple-500 bg-purple-100" },
  { id: "streak_7", icon: Flame, name: "On Fire", nameAr: "ملتهب", desc: "7-day login streak", descAr: "تسجيل دخول 7 أيام متتالية", action: "login_streak", target: 7, color: "text-orange-500 bg-orange-100" },
  { id: "helper", icon: Shield, name: "Helper", nameAr: "مساعد", desc: "Help 5 community members", descAr: "ساعد 5 أعضاء", action: "comment_created", target: 20, color: "text-green-500 bg-green-100" },
  { id: "sharpshooter", icon: Target, name: "Sharpshooter", nameAr: "قنّاص", desc: "Score 90+ in competition", descAr: "حقق 90+ في مسابقة", action: "high_score", target: 1, color: "text-red-500 bg-red-100" },
  { id: "influencer", icon: Star, name: "Influencer", nameAr: "مؤثر", desc: "Get 50 followers", descAr: "احصل على 50 متابع", action: "follower_gained", target: 50, color: "text-indigo-500 bg-indigo-100" },
  { id: "mentor", icon: Award, name: "Mentor", nameAr: "مرشد", desc: "Complete mentorship", descAr: "أكمل إرشاد", action: "mentorship_completed", target: 1, color: "text-teal-500 bg-teal-100" },
  { id: "lightning", icon: Zap, name: "Lightning Fast", nameAr: "سريع البرق", desc: "Submit in under 5 min", descAr: "قدّم في أقل من 5 دقائق", action: "fast_submission", target: 1, color: "text-yellow-600 bg-yellow-100" },
  { id: "veteran", icon: Medal, name: "Veteran", nameAr: "محترف", desc: "Active for 1 year", descAr: "نشط لمدة سنة", action: "account_age", target: 365, color: "text-slate-500 bg-slate-100" },
];

interface Props {
  userId?: string;
}

export default function AchievementsBadges({ userId }: Props) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { user } = useAuth();
  const targetUserId = userId || user?.id;

  // Fetch user stats to calculate progress
  const { data: stats } = useQuery({
    queryKey: ["user-achievement-stats", targetUserId],
    queryFn: async () => {
      const [posts, followers, recipes, registrations, comments] = await Promise.all([
        supabase.from("posts").select("*", { count: "exact", head: true }).eq("author_id", targetUserId!),
        supabase.from("user_follows").select("*", { count: "exact", head: true }).eq("following_id", targetUserId!),
        supabase.from("recipes").select("*", { count: "exact", head: true }).eq("author_id", targetUserId!),
        supabase.from("competition_registrations").select("*", { count: "exact", head: true }).eq("participant_id", targetUserId!),
        supabase.from("post_comments").select("*", { count: "exact", head: true }).eq("author_id", targetUserId!),
      ]);

      const { data: profile } = await supabase.from("profiles").select("created_at").eq("user_id", targetUserId!).single();
      const accountDays = profile?.created_at ? Math.floor((Date.now() - new Date(profile.created_at).getTime()) / 86400000) : 0;

      return {
        post_created: posts.count || 0,
        follower_gained: followers.count || 0,
        recipe_created: recipes.count || 0,
        competition_joined: registrations.count || 0,
        comment_created: comments.count || 0,
        login_streak: 0,
        account_age: accountDays,
        competition_won: 0,
        high_score: 0,
        mentorship_completed: 0,
        fast_submission: 0,
      };
    },
    enabled: !!targetUserId,
  });

  // Fetch leaderboard
  const { data: leaderboard = [] } = useQuery({
    queryKey: ["achievements-leaderboard"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("user_id, full_name, full_name_ar, avatar_url, username, loyalty_points")
        .order("loyalty_points", { ascending: false })
        .limit(10);
      return data || [];
    },
    staleTime: 300000,
  });

  const getBadgeProgress = (badge: typeof BADGE_DEFINITIONS[0]) => {
    if (!stats) return 0;
    const current = (stats as any)[badge.action] || 0;
    return Math.min(100, Math.round((current / badge.target) * 100));
  };

  const earnedCount = BADGE_DEFINITIONS.filter(b => getBadgeProgress(b) >= 100).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            {isAr ? "الإنجازات والشارات" : "Achievements & Badges"}
          </h3>
          <p className="text-sm text-muted-foreground">
            {earnedCount}/{BADGE_DEFINITIONS.length} {isAr ? "مكتسبة" : "earned"}
          </p>
        </div>
        <Badge variant="outline" className="gap-1">
          <Flame className="h-3.5 w-3.5 text-orange-500" />
          {stats?.login_streak || 0} {isAr ? "يوم متتالي" : "day streak"}
        </Badge>
      </div>

      {/* Badges Grid */}
      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {BADGE_DEFINITIONS.map(badge => {
          const progress = getBadgeProgress(badge);
          const earned = progress >= 100;
          const Icon = badge.icon;

          return (
            <Card key={badge.id} className={cn("text-center transition-all", earned ? "border-amber-200 shadow-sm" : "opacity-60 border-dashed")}>
              <CardContent className="p-3">
                <div className={cn("mx-auto h-12 w-12 rounded-full flex items-center justify-center mb-2", earned ? badge.color : "bg-muted text-muted-foreground")}>
                  <Icon className="h-6 w-6" />
                </div>
                <p className="text-xs font-medium line-clamp-1">{isAr ? badge.nameAr : badge.name}</p>
                <p className="text-[10px] text-muted-foreground line-clamp-2 mt-0.5">{isAr ? badge.descAr : badge.desc}</p>
                {!earned && <Progress value={progress} className="h-1 mt-2" />}
                {earned && <Badge variant="outline" className="text-[9px] mt-1.5 text-amber-600 border-amber-200">✓</Badge>}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Leaderboard */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Crown className="h-4 w-4 text-amber-500" />
            {isAr ? "لوحة المتصدرين" : "Leaderboard"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {leaderboard.map((u: any, i: number) => (
            <div key={u.user_id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
              <span className={cn("text-sm font-bold w-5 text-center", i === 0 ? "text-amber-500" : i === 1 ? "text-slate-400" : i === 2 ? "text-amber-700" : "text-muted-foreground")}>
                {i + 1}
              </span>
              <Avatar className="h-8 w-8">
                <AvatarImage src={u.avatar_url || ""} />
                <AvatarFallback>{(u.full_name || "?")[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{isAr && u.full_name_ar ? u.full_name_ar : u.full_name || u.username || "—"}</p>
              </div>
              <Badge variant="secondary" className="text-xs">{(u.loyalty_points || 0).toLocaleString()} pts</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
