import { useMemo, memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePointsBalance } from "@/hooks/usePoints";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Trophy, Star, TrendingUp, Award, Target } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer } from "recharts";

export const ProgressReportWidget = memo(function ProgressReportWidget() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { user } = useAuth();
  const { data: pointsBalance } = usePointsBalance();

  const { data } = useQuery({
    queryKey: ["progress-report", user?.id],
    queryFn: async () => {
      if (!user) return null;

      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

      const [pointsRes, regsRes, badgesRes, viewsRes] = await Promise.all([
        supabase.from("points_ledger").select("points, created_at").eq("user_id", user.id).gte("created_at", sixtyDaysAgo.toISOString()).order("created_at", { ascending: true }),
        (supabase as any).from("competition_registrations").select("id, status, registered_at").eq("participant_id", user.id).gte("registered_at", thirtyDaysAgo.toISOString()),
        (supabase as any).from("user_badges").select("id, created_at").eq("user_id", user.id),
        supabase.from("profile_views").select("id, created_at").eq("profile_user_id", user.id).gte("created_at", thirtyDaysAgo.toISOString()),
      ]);

      // Points trend (last 14 days)
      const pointsData: { day: string; pts: number }[] = [];
      for (let i = 13; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const key = d.toISOString().split("T")[0];
        const dayPoints = (pointsRes.data || []).filter((p: any) => p.created_at?.startsWith(key)).reduce((s: number, p: any) => s + (p.points || 0), 0);
        pointsData.push({ day: key.slice(5), pts: dayPoints });
      }

      // This month vs last month points
      const thisMonthPts = (pointsRes.data || []).filter((p: any) => new Date(p.created_at) >= thirtyDaysAgo).reduce((s: number, p: any) => s + Math.max(0, p.points || 0), 0);
      const lastMonthPts = (pointsRes.data || []).filter((p: any) => new Date(p.created_at) < thirtyDaysAgo).reduce((s: number, p: any) => s + Math.max(0, p.points || 0), 0);

      return {
        pointsData,
        thisMonthPts,
        lastMonthPts,
        competitions: regsRes.data?.length || 0,
        competitionsApproved: regsRes.data?.filter((r: any) => r.status === "approved").length || 0,
        badges: badgesRes.data?.length || 0,
        profileViews: viewsRes.data?.length || 0,
      };
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });

  if (!data) return null;

  const ptsChange = data.lastMonthPts > 0
    ? Math.round(((data.thisMonthPts - data.lastMonthPts) / data.lastMonthPts) * 100)
    : data.thisMonthPts > 0 ? 100 : 0;

  const metrics = [
    { icon: Star, label: isAr ? "نقاط الشهر" : "Monthly Pts", value: data.thisMonthPts, color: "text-chart-4" },
    { icon: Trophy, label: isAr ? "مسابقات" : "Competitions", value: data.competitions, color: "text-primary" },
    { icon: Award, label: isAr ? "شارات" : "Badges", value: data.badges, color: "text-chart-3" },
    { icon: Target, label: isAr ? "مشاهدات" : "Views", value: data.profileViews, color: "text-chart-5" },
  ];

  return (
    <Card className="overflow-hidden border-border/40">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            {isAr ? "تقرير التقدم" : "Progress Report"}
          </CardTitle>
          <Badge variant="outline" className="text-[9px]">
            {isAr ? "آخر 30 يوم" : "Last 30d"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Points Sparkline */}
        <div className="rounded-xl bg-muted/30 p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Star className="h-3.5 w-3.5 text-chart-4" />
              <span className="text-xs font-semibold">{isAr ? "اتجاه النقاط" : "Points Trend"}</span>
            </div>
            <div className="flex items-center gap-1">
              <TrendingUp className={`h-3 w-3 ${ptsChange >= 0 ? "text-chart-5" : "text-destructive"}`} />
              <span className={`text-[10px] font-bold ${ptsChange >= 0 ? "text-chart-5" : "text-destructive"}`}>
                {ptsChange >= 0 ? "+" : ""}{ptsChange}%
              </span>
            </div>
          </div>
          <div className="h-12">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.pointsData}>
                <defs>
                  <linearGradient id="ptsFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--chart-4))" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(var(--chart-4))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="pts" stroke="hsl(var(--chart-4))" strokeWidth={1.5} fill="url(#ptsFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-between text-[9px] text-muted-foreground mt-1">
            <span>{data.pointsData[0]?.day}</span>
            <span className="font-semibold text-foreground">{pointsBalance || 0} {isAr ? "إجمالي" : "total"}</span>
            <span>{data.pointsData[data.pointsData.length - 1]?.day}</span>
          </div>
        </div>

        {/* Metric Grid */}
        <div className="grid grid-cols-2 gap-2">
          {metrics.map((m) => (
            <div key={m.label} className="rounded-xl bg-muted/20 p-2.5 text-center group transition-all duration-300 hover:shadow-sm hover:-translate-y-0.5">
              <m.icon className={`h-4 w-4 mx-auto mb-1 ${m.color} transition-transform duration-300 group-hover:scale-110`} />
              <p className="text-lg font-bold tabular-nums">{m.value}</p>
              <p className="text-[9px] text-muted-foreground uppercase">{m.label}</p>
            </div>
          ))}
        </div>

        {/* Approval Rate */}
        {data.competitions > 0 && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px]">
              <span className="text-muted-foreground">{isAr ? "معدل القبول" : "Approval Rate"}</span>
              <span className="font-semibold">{Math.round((data.competitionsApproved / data.competitions) * 100)}%</span>
            </div>
            <Progress value={(data.competitionsApproved / data.competitions) * 100} className="h-1.5" />
          </div>
        )}
      </CardContent>
    </Card>
  );
});