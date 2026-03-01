import { useQuery } from "@tanstack/react-query";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Activity,
  Target,
  Zap,
  TrendingUp,
  TrendingDown,
  Minus,
  Clock,
  Users,
  Award,
  MessageSquare,
} from "lucide-react";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

export default function EngagementMetrics() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data, isLoading } = useQuery({
    queryKey: ["engagementMetrics"],
    queryFn: async () => {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString();

      const [
        { count: totalUsers },
        { count: recentSignups },
        { count: prevSignups },
        { data: recentRegs },
        { data: prevRegs },
        { count: recentMessages },
        { count: prevMessages },
        { count: recentCerts },
        { count: prevCerts },
        { data: recentScores },
        { data: allProfiles },
        { count: recentArticles },
        { count: prevArticles },
      ] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", thirtyDaysAgo),
        supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", sixtyDaysAgo).lt("created_at", thirtyDaysAgo),
        supabase.from("competition_registrations").select("created_at").gte("created_at", thirtyDaysAgo),
        supabase.from("competition_registrations").select("created_at").gte("created_at", sixtyDaysAgo).lt("created_at", thirtyDaysAgo),
        supabase.from("messages").select("*", { count: "exact", head: true }).gte("created_at", thirtyDaysAgo),
        supabase.from("messages").select("*", { count: "exact", head: true }).gte("created_at", sixtyDaysAgo).lt("created_at", thirtyDaysAgo),
        supabase.from("certificates").select("*", { count: "exact", head: true }).gte("created_at", thirtyDaysAgo),
        supabase.from("certificates").select("*", { count: "exact", head: true }).gte("created_at", sixtyDaysAgo).lt("created_at", thirtyDaysAgo),
        supabase.from("competition_scores").select("score, created_at").gte("created_at", thirtyDaysAgo),
        supabase.from("profiles").select("created_at").order("created_at", { ascending: true }).limit(500),
        supabase.from("articles").select("*", { count: "exact", head: true }).gte("created_at", thirtyDaysAgo),
        supabase.from("articles").select("*", { count: "exact", head: true }).gte("created_at", sixtyDaysAgo).lt("created_at", thirtyDaysAgo),
      ]);

      // Calculate trends (percentage change)
      const calcTrend = (current: number, previous: number) => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return Math.round(((current - previous) / previous) * 100);
      };

      const signupTrend = calcTrend(recentSignups || 0, prevSignups || 0);
      const regTrend = calcTrend((recentRegs || []).length, (prevRegs || []).length);
      const messageTrend = calcTrend(recentMessages || 0, prevMessages || 0);
      const certTrend = calcTrend(recentCerts || 0, prevCerts || 0);
      const postTrend = calcTrend(recentArticles || 0, prevArticles || 0);

      // Radar chart data for engagement dimensions
      const maxScale = 100;
      const normalize = (val: number, max: number) => Math.min(Math.round((val / Math.max(max, 1)) * 100), 100);
      const radarData = [
        { dimension: isAr ? "التسجيلات" : "Registrations", value: normalize((recentRegs || []).length, 50) },
        { dimension: isAr ? "الرسائل" : "Messaging", value: normalize(recentMessages || 0, 100) },
        { dimension: isAr ? "الشهادات" : "Certificates", value: normalize(recentCerts || 0, 30) },
        { dimension: isAr ? "التقييمات" : "Scoring", value: normalize((recentScores || []).length, 50) },
        { dimension: isAr ? "المقالات" : "Content", value: normalize(recentArticles || 0, 50) },
        { dimension: isAr ? "المستخدمين" : "Signups", value: normalize(recentSignups || 0, 30) },
      ];

      // Weekly activity trend (last 8 weeks)
      const weeklyData: { week: string; activity: number }[] = [];
      for (let i = 7; i >= 0; i--) {
        const weekStart = new Date(now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000);
        const weekEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
        const weekLabel = `W${8 - i}`;

        const weekActivity = (allProfiles || []).filter((p: any) => {
          const d = new Date(p.created_at);
          return d >= weekStart && d < weekEnd;
        }).length;

        weeklyData.push({ week: weekLabel, activity: weekActivity });
      }

      // Engagement score (composite)
      const engagementScore = Math.min(
        Math.round(
          (normalize(recentSignups || 0, 20) * 0.2) +
          (normalize((recentRegs || []).length, 30) * 0.25) +
          (normalize(recentMessages || 0, 50) * 0.2) +
          (normalize(recentArticles || 0, 30) * 0.2) +
          (normalize(recentCerts || 0, 15) * 0.15)
        ),
        100
      );

      return {
        signups: { current: recentSignups || 0, trend: signupTrend },
        registrations: { current: (recentRegs || []).length, trend: regTrend },
        messages: { current: recentMessages || 0, trend: messageTrend },
        certificates: { current: recentCerts || 0, trend: certTrend },
        posts: { current: recentArticles || 0, trend: postTrend },
        engagementScore,
        radarData,
        weeklyData,
        totalUsers: totalUsers || 0,
      };
    },
    staleTime: 1000 * 60 * 2,
  });

  const TrendIndicator = ({ trend }: { trend: number }) => {
    if (trend > 0)
      return (
        <span className="flex items-center gap-0.5 text-xs text-chart-2">
          <TrendingUp className="h-3 w-3" /> +{trend}%
        </span>
      );
    if (trend < 0)
      return (
        <span className="flex items-center gap-0.5 text-xs text-destructive">
          <TrendingDown className="h-3 w-3" /> {trend}%
        </span>
      );
    return (
      <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
        <Minus className="h-3 w-3" /> 0%
      </span>
    );
  };

  const metricCards = [
    { icon: Users, label: isAr ? "تسجيلات جديدة" : "New Signups", value: data?.signups.current, trend: data?.signups.trend, color: "border-s-primary" },
    { icon: Target, label: isAr ? "تسجيل بمسابقات" : "Competition Regs", value: data?.registrations.current, trend: data?.registrations.trend, color: "border-s-chart-2" },
    { icon: MessageSquare, label: isAr ? "الرسائل" : "Messages Sent", value: data?.messages.current, trend: data?.messages.trend, color: "border-s-chart-3" },
    { icon: Award, label: isAr ? "شهادات صدرت" : "Certificates Issued", value: data?.certificates.current, trend: data?.certificates.trend, color: "border-s-chart-4" },
    { icon: Activity, label: isAr ? "منشورات مجتمعية" : "Community Posts", value: data?.posts.current, trend: data?.posts.trend, color: "border-s-chart-5" },
  ];

  return (
    <div className="space-y-6 mt-4">
      {/* Engagement Score Hero */}
      <Card className="relative overflow-hidden">
        <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/5 blur-3xl" />
        <CardContent className="flex items-center gap-6 py-6">
          <div className="relative flex h-24 w-24 shrink-0 items-center justify-center">
            <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
              <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${(data?.engagementScore || 0) * 2.64} 264`}
                className="transition-all duration-1000"
              />
            </svg>
            <span className="absolute text-2xl font-bold">{isLoading ? "..." : <AnimatedCounter value={data?.engagementScore || 0} />}</span>
          </div>
          <div>
            <h3 className="text-lg font-bold">{isAr ? "مؤشر التفاعل" : "Engagement Score"}</h3>
            <p className="text-sm text-muted-foreground">
              {isAr ? "مركب من 5 أبعاد تفاعل خلال آخر 30 يوم" : "Composite of 5 engagement dimensions over the last 30 days"}
            </p>
            <Badge variant="outline" className="mt-2">
              <Clock className="h-3 w-3 me-1" />
              {isAr ? "آخر 30 يوم" : "Last 30 days"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Metric Cards with Trends */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {metricCards.map((card) => (
          <Card key={card.label} className={`border-s-[3px] ${card.color}`}>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{card.label}</p>
                  {isLoading ? (
                    <Skeleton className="mt-1 h-7 w-12" />
                  ) : (
                    <AnimatedCounter value={card.value || 0} className="text-2xl mt-1" />
                  )}
                </div>
                <card.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              {!isLoading && card.trend !== undefined && (
                <div className="mt-2">
                  <TrendIndicator trend={card.trend} />
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {isAr ? "مقارنة بالفترة السابقة" : "vs previous 30 days"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Engagement Radar */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Zap className="h-4 w-4 text-primary" />
              {isAr ? "أبعاد التفاعل" : "Engagement Dimensions"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[280px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={data?.radarData || []}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar
                    dataKey="value"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                </RadarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Weekly Activity Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-4 w-4 text-chart-2" />
              {isAr ? "النشاط الأسبوعي" : "Weekly Activity Trend"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[280px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={data?.weeklyData || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: 12,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="activity"
                    stroke="hsl(var(--chart-2))"
                    fill="hsl(var(--chart-2))"
                    fillOpacity={0.15}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
