import { useMemo, memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { BarChart3, TrendingUp, Eye, Heart, MessageSquare, Users, Trophy, ChefHat, Target, Calendar, Activity, Flame } from "lucide-react";
import { AnimatedCounter } from "@/components/ui/animated-counter";

export const PersonalDashboard = memo(function PersonalDashboard() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { user } = useAuth();

  const { data: profile } = useQuery({
    queryKey: ["personal-dashboard-profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("user_id, full_name, full_name_ar, display_name, display_name_ar, username, avatar_url, bio, bio_ar, specialization, account_type, is_verified, loyalty_points, country_code, city").eq("user_id", user!.id).single();
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: stats } = useQuery({
    queryKey: ["personal-dashboard-stats", user?.id],
    queryFn: async () => {
      const [posts, followers, following, recipes, competitions, comments] = await Promise.all([
        supabase.from("posts").select("*", { count: "exact", head: true }).eq("author_id", user!.id),
        supabase.from("user_follows").select("*", { count: "exact", head: true }).eq("following_id", user!.id),
        supabase.from("user_follows").select("*", { count: "exact", head: true }).eq("follower_id", user!.id),
        supabase.from("recipes").select("*", { count: "exact", head: true }).eq("author_id", user!.id),
        supabase.from("competition_registrations").select("*", { count: "exact", head: true }).eq("participant_id", user!.id),
        supabase.from("post_comments").select("*", { count: "exact", head: true }).eq("author_id", user!.id),
      ]);
      return {
        posts: posts.count || 0,
        followers: followers.count || 0,
        following: following.count || 0,
        recipes: recipes.count || 0,
        competitions: competitions.count || 0,
        comments: comments.count || 0,
      };
    },
    enabled: !!user?.id,
  });

  // Weekly activity
  const { data: weeklyActivity = [] } = useQuery({
    queryKey: ["weekly-activity", user?.id],
    queryFn: async () => {
      const week = new Date();
      week.setDate(week.getDate() - 7);
      const { data } = await supabase
        .from("posts")
        .select("created_at")
        .eq("author_id", user!.id)
        .gte("created_at", week.toISOString());
      return data || [];
    },
    enabled: !!user?.id,
  });

  const STAT_CARDS = [
    { icon: BookOpen, label: isAr ? "المنشورات" : "Posts", value: stats?.posts || 0, color: "text-blue-500" },
    { icon: Users, label: isAr ? "المتابعون" : "Followers", value: stats?.followers || 0, color: "text-pink-500" },
    { icon: ChefHat, label: isAr ? "الوصفات" : "Recipes", value: stats?.recipes || 0, color: "text-amber-500" },
    { icon: Trophy, label: isAr ? "المسابقات" : "Competitions", value: stats?.competitions || 0, color: "text-purple-500" },
    { icon: MessageSquare, label: isAr ? "التعليقات" : "Comments", value: stats?.comments || 0, color: "text-green-500" },
    { icon: Users, label: isAr ? "أتابعهم" : "Following", value: stats?.following || 0, color: "text-teal-500" },
  ];

  // Profile completion
  const completionFields = ["full_name", "bio", "avatar_url", "country", "phone", "specialization", "job_title"];
  const { completed, completionPct } = useMemo(() => {
    const c = completionFields.filter(f => profile?.[f]).length;
    return { completed: c, completionPct: Math.round((c / completionFields.length) * 100) };
  }, [profile]);

  // Weekly goals
  const WEEKLY_GOALS = [
    { label: isAr ? "منشورات" : "Posts", current: weeklyActivity.length, target: 3, icon: BookOpen },
    { label: isAr ? "وصفات" : "Recipes", current: Math.min(stats?.recipes || 0, 1), target: 1, icon: ChefHat },
  ];

  return (
    <div className="space-y-4">
      {/* Welcome */}
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14 border-2 border-primary/20">
              <AvatarImage src={profile?.avatar_url || ""} />
              <AvatarFallback className="text-lg">{(profile?.full_name || "U")[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="font-semibold">{isAr ? "مرحباً" : "Welcome"}, {isAr ? profile?.full_name_ar || profile?.full_name : profile?.full_name || "Chef"} 👋</h3>
              <p className="text-sm text-muted-foreground">{isAr ? "إليك ملخص نشاطك" : "Here's your activity summary"}</p>
            </div>
            <Badge variant="secondary" className="gap-1">
              <Flame className="h-3 w-3 text-orange-500" />
              {profile?.loyalty_points || 0} pts
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
        {STAT_CARDS.map((s, i) => {
          const Icon = s.icon;
          return (
            <Card key={i}>
              <CardContent className="p-3 text-center">
                <Icon className={`h-5 w-5 mx-auto mb-1 ${s.color}`} />
                <AnimatedCounter value={s.value} className="text-lg font-bold" />
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Profile Completion */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              {isAr ? "اكتمال الملف الشخصي" : "Profile Completion"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 mb-2">
              <Progress value={completionPct} className="flex-1 h-2" />
              <span className="text-sm font-bold text-primary">{completionPct}%</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {completionPct < 100
                ? (isAr ? "أكمل ملفك الشخصي لزيادة الظهور" : "Complete your profile to boost visibility")
                : (isAr ? "ملفك الشخصي مكتمل! 🎉" : "Profile complete! 🎉")}
            </p>
          </CardContent>
        </Card>

        {/* Weekly Goals */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              {isAr ? "أهداف الأسبوع" : "Weekly Goals"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {WEEKLY_GOALS.map((g, i) => {
              const Icon = g.icon;
              const pct = Math.min(100, Math.round((g.current / g.target) * 100));
              return (
                <div key={i} className="flex items-center gap-3">
                  <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs">{g.label}</span>
                      <span className="text-xs text-muted-foreground">{g.current}/{g.target}</span>
                    </div>
                    <Progress value={pct} className="h-1.5" />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Activity Summary */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            {isAr ? "ملخص النشاط (7 أيام)" : "Activity Summary (7 days)"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-1">
            {Array.from({ length: 7 }, (_, i) => {
              const date = new Date();
              date.setDate(date.getDate() - (6 - i));
              const ds = date.toDateString();
              const count = weeklyActivity.filter(a => new Date(a.created_at).toDateString() === ds).length;
              return (
                <div key={i} className="flex-1 text-center">
                  <div className={`h-8 rounded-sm mx-auto w-full ${count > 2 ? "bg-primary" : count > 0 ? "bg-primary/40" : "bg-muted"}`} title={`${count} posts`} />
                  <p className="text-[9px] text-muted-foreground mt-1">{date.toLocaleDateString(isAr ? "ar" : "en", { weekday: "narrow" })}</p>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground text-center mt-2">
            {weeklyActivity.length} {isAr ? "منشور هذا الأسبوع" : "posts this week"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
});

const BookOpen = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/></svg>
);
