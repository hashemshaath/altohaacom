import { memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Trophy, Award, Star, ChefHat, TrendingUp, Target, Crown, Medal, ArrowRight, Sparkles } from "lucide-react";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { cn } from "@/lib/utils";

function getCareerLevel(score: number, isAr: boolean) {
  if (score >= 90) return { level: 5, title: isAr ? "طاهٍ أسطوري" : "Legendary Chef", icon: Crown, color: "text-chart-4", bg: "bg-chart-4/10", border: "border-chart-4/20" };
  if (score >= 70) return { level: 4, title: isAr ? "طاهٍ خبير" : "Expert Chef", icon: Star, color: "text-primary", bg: "bg-primary/10", border: "border-primary/20" };
  if (score >= 50) return { level: 3, title: isAr ? "طاهٍ متقدم" : "Advanced Chef", icon: Medal, color: "text-chart-3", bg: "bg-chart-3/10", border: "border-chart-3/20" };
  if (score >= 25) return { level: 2, title: isAr ? "طاهٍ واعد" : "Rising Chef", icon: TrendingUp, color: "text-chart-2", bg: "bg-chart-2/10", border: "border-chart-2/20" };
  return { level: 1, title: isAr ? "طاهٍ مبتدئ" : "Aspiring Chef", icon: ChefHat, color: "text-muted-foreground", bg: "bg-muted/50", border: "border-border" };
}

export const ChefCareerWidget = memo(function ChefCareerWidget() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data } = useQuery({
    queryKey: ["chef-career-widget", user?.id],
    queryFn: async () => {
      if (!user) return null;

      const [compsRes, certsRes, badgesRes, recipesRes, postsRes, pointsRes, rankRes] = await Promise.allSettled([
        supabase.from("competition_registrations").select("status, competitions(status)").eq("participant_id", user.id),
        supabase.from("certificates").select("id, type").eq("recipient_id", user.id),
        supabase.from("user_badges").select("id").eq("user_id", user.id),
        supabase.from("recipes").select("id", { count: "exact", head: true }).eq("author_id", user.id),
        supabase.from("posts").select("id", { count: "exact", head: true }).eq("author_id", user.id),
        supabase.from("profiles").select("loyalty_points, years_of_experience").eq("user_id", user.id).single(),
        supabase.from("leaderboard_scores" as any).select("total_points, rank").eq("user_id", user.id).order("total_points", { ascending: false }).limit(1),
      ]);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const gc = (r: PromiseSettledResult<{ data: any; count: number | null }>) => r.status === "fulfilled" ? r.value : { data: null, count: 0 };

      const regs = (gc(compsRes).data || []) as Array<{ status: string; competitions: { status: string } | null }>;
      const certs = (gc(certsRes).data || []) as Array<Record<string, unknown>>;
      const badges = (gc(badgesRes).data || []) as Array<Record<string, unknown>>;
      const recipes = gc(recipesRes).count || 0;
      const posts = gc(postsRes).count || 0;
      const profileData = gc(pointsRes).data as { loyalty_points?: number; years_of_experience?: number } | null;
      const rankData = gc(rankRes).data as Array<{ rank?: number; total_points?: number }> | null;

      const totalComps = regs.length;
      const wonComps = regs.filter((r) => {
        return r.status === "approved" && r.competitions?.status === "completed";
      }).length;

      // Career score: weighted formula
      const score = Math.min(100,
        Math.min(totalComps * 8, 30) +
        Math.min(wonComps * 12, 25) +
        Math.min(certs.length * 5, 15) +
        Math.min(badges.length * 3, 10) +
        Math.min(recipes * 2, 10) +
        Math.min((profileData?.years_of_experience || 0) * 2, 10)
      );

      return {
        score,
        totalComps,
        wonComps,
        certificates: certs.length,
        badges: badges.length,
        recipes,
        posts,
        points: profileData?.loyalty_points || 0,
        experience: profileData?.years_of_experience || 0,
        rank: rankData?.[0]?.rank || null,
        rankPoints: rankData?.[0]?.total_points || 0,
      };
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });

  if (!data) return null;

  const career = getCareerLevel(data.score, isAr);
  const LevelIcon = career.icon;

  const milestones = [
    { icon: Trophy, label: isAr ? "مسابقات" : "Competitions", value: data.totalComps, color: "text-primary", bg: "bg-primary/10" },
    { icon: Medal, label: isAr ? "مكتملة" : "Completed", value: data.wonComps, color: "text-chart-2", bg: "bg-chart-2/10" },
    { icon: Award, label: isAr ? "شهادات" : "Certificates", value: data.certificates, color: "text-chart-3", bg: "bg-chart-3/10" },
    { icon: Star, label: isAr ? "شارات" : "Badges", value: data.badges, color: "text-chart-4", bg: "bg-chart-4/10" },
  ];

  // Progress to next level
  const levelThresholds = [0, 25, 50, 70, 90, 100];
  const currentThreshold = levelThresholds[career.level - 1];
  const nextThreshold = levelThresholds[career.level] || 100;
  const progressInLevel = ((data.score - currentThreshold) / (nextThreshold - currentThreshold)) * 100;

  return (
    <Card className="relative overflow-hidden border-border/40 transition-shadow hover:shadow-lg">
      <div className="pointer-events-none absolute -end-12 -top-12 h-36 w-36 rounded-full bg-primary/5 blur-[60px]" />

      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm">
            <div className={`flex h-6 w-6 items-center justify-center rounded-lg ${career.bg}`}>
              <Sparkles className={`h-3.5 w-3.5 ${career.color}`} />
            </div>
            {isAr ? "مسيرتي المهنية" : "My Career"}
          </CardTitle>
          {data.rank && (
            <Badge variant="outline" className="text-[10px] gap-1 font-bold">
              <Crown className="h-2.5 w-2.5 text-chart-4" />
              #{data.rank}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Career Level Card */}
        <div className={cn("rounded-xl border p-3", career.border, career.bg)}>
          <div className="flex items-center gap-3">
            <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl", career.bg, "border", career.border)}>
              <LevelIcon className={cn("h-6 w-6", career.color)} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={cn("text-sm font-bold", career.color)}>{career.title}</span>
                <Badge variant="secondary" className="text-[9px] px-1.5 py-0">
                  {isAr ? `المستوى ${career.level}` : `Lvl ${career.level}`}
                </Badge>
              </div>
              {/* Progress bar to next level */}
              <div className="mt-1.5 flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-background/60 rounded-full overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all duration-700", career.color.replace("text-", "bg-"))}
                    style={{ width: `${Math.min(progressInLevel, 100)}%` }}
                  />
                </div>
                <span className="text-[10px] font-bold tabular-nums">{data.score}/100</span>
              </div>
            </div>
          </div>
        </div>

        {/* Milestones Grid */}
        <div className="grid grid-cols-4 gap-1.5">
          {milestones.map((m) => {
            const Icon = m.icon;
            return (
              <div key={m.label} className="flex flex-col items-center gap-1 p-2 rounded-xl bg-muted/30 border border-border/20 hover:bg-muted/50 transition-all">
                <Icon className={cn("h-3.5 w-3.5", m.color)} />
                <span className="text-sm font-bold tabular-nums"><AnimatedCounter value={m.value} /></span>
                <span className="text-[8px] text-muted-foreground uppercase tracking-wide font-semibold leading-tight text-center">{m.label}</span>
              </div>
            );
          })}
        </div>

        {/* Quick Metrics Row */}
        <div className="flex items-center gap-2">
          {data.experience > 0 && (
            <div className="flex-1 flex items-center gap-1.5 bg-accent/10 rounded-lg px-2 py-1.5 border border-accent/10">
              <ChefHat className="h-3 w-3 text-accent-foreground/60" />
              <span className="text-[10px] font-bold">{data.experience} {isAr ? "سنة" : "yrs"}</span>
            </div>
          )}
          <div className="flex-1 flex items-center gap-1.5 bg-chart-4/10 rounded-lg px-2 py-1.5 border border-chart-4/10">
            <Star className="h-3 w-3 text-chart-4" />
            <span className="text-[10px] font-bold"><AnimatedCounter value={data.points} /> {isAr ? "نقطة" : "pts"}</span>
          </div>
          {data.recipes > 0 && (
            <div className="flex-1 flex items-center gap-1.5 bg-chart-2/10 rounded-lg px-2 py-1.5 border border-chart-2/10">
              <Target className="h-3 w-3 text-chart-2" />
              <span className="text-[10px] font-bold">{data.recipes} {isAr ? "وصفة" : "recipes"}</span>
            </div>
          )}
        </div>

        {/* CTA */}
        <Link to="/rankings">
          <Button variant="ghost" size="sm" className="w-full h-7 gap-1.5 text-[11px] font-bold text-muted-foreground hover:text-primary">
            {isAr ? "عرض التصنيف العام" : "View Leaderboard"}
            <ArrowRight className="h-3 w-3 rtl:rotate-180" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
});
