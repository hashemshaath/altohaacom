import { useLanguage } from "@/i18n/LanguageContext";
import { useProfileAnalytics } from "@/hooks/useProfileViews";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, Users, Monitor, Smartphone, TrendingUp, Globe, Clock, UserPlus, Calendar } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, LineChart, Line,
} from "recharts";
import { StaggeredList } from "@/components/ui/staggered-list";
import { EmptyState } from "@/components/ui/empty-state";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ProfileAnalyticsDashboardProps {
  userId: string;
}

const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export function ProfileAnalyticsDashboard({ userId }: ProfileAnalyticsDashboardProps) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { data: analytics, isLoading } = useProfileAnalytics(userId);

  // Follower growth data (last 30 days)
  const { data: followerData } = useQuery({
    queryKey: ["follower-growth", userId],
    queryFn: async () => {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

      const [followersRes, followingRes, recentFollowersRes] = await Promise.all([
        supabase.from("user_follows").select("id").eq("following_id", userId),
        supabase.from("user_follows").select("id").eq("follower_id", userId),
        supabase.from("user_follows").select("created_at").eq("following_id", userId).gte("created_at", thirtyDaysAgo).order("created_at", { ascending: true }),
      ]);

      const totalFollowers = followersRes.data?.length || 0;
      const totalFollowing = followingRes.data?.length || 0;
      const recentFollowers = recentFollowersRes.data || [];

      // Daily follower growth chart
      const dayMap = new Map<string, number>();
      recentFollowers.forEach(f => {
        const day = f.created_at.split("T")[0];
        dayMap.set(day, (dayMap.get(day) || 0) + 1);
      });

      const dailyGrowth: { date: string; newFollowers: number; cumulative: number }[] = [];
      let cumulative = totalFollowers - recentFollowers.length;
      for (let i = 29; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const key = d.toISOString().split("T")[0];
        const newF = dayMap.get(key) || 0;
        cumulative += newF;
        dailyGrowth.push({ date: key, newFollowers: newF, cumulative });
      }

      // Week-over-week comparison
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const last7 = recentFollowers.filter(f => f.created_at >= sevenDaysAgo).length;
      const prev7 = recentFollowers.filter(f => f.created_at < sevenDaysAgo && f.created_at >= new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString()).length;
      const growthPercent = prev7 > 0 ? Math.round(((last7 - prev7) / prev7) * 100) : last7 > 0 ? 100 : 0;

      // Best day for new followers
      let bestDay = "";
      let bestCount = 0;
      dayMap.forEach((count, day) => {
        if (count > bestCount) { bestCount = count; bestDay = day; }
      });

      return { totalFollowers, totalFollowing, dailyGrowth, last7NewFollowers: last7, growthPercent, newFollowers30d: recentFollowers.length, bestDay, bestCount };
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map(i => (
          <Card key={i}><CardContent className="p-4"><div className="h-16 animate-pulse bg-muted rounded" /></CardContent></Card>
        ))}
      </div>
    );
  }

  if (!analytics || analytics.totalViews === 0) {
    return (
      <EmptyState
        icon={Eye}
        title={isAr ? "لا توجد بيانات بعد" : "No analytics data yet"}
        description={isAr ? "ستظهر الإحصائيات عند زيارة ملفك الشخصي" : "Analytics will appear when your profile gets views"}
      />
    );
  }

  const statCards = [
    { icon: Eye, label: isAr ? "إجمالي الزيارات" : "Total Views", value: analytics.totalViews, sub: isAr ? "آخر 30 يوم" : "Last 30 days", color: "text-chart-1", bg: "bg-chart-1/10" },
    { icon: TrendingUp, label: isAr ? "آخر 7 أيام" : "Last 7 Days", value: analytics.last7Days, sub: isAr ? "زيارة" : "views", color: "text-chart-2", bg: "bg-chart-2/10" },
    { icon: Users, label: isAr ? "زوار فريدون" : "Unique Visitors", value: analytics.uniqueVisitors, sub: isAr ? "آخر 30 يوم" : "Last 30 days", color: "text-chart-3", bg: "bg-chart-3/10" },
    { icon: Globe, label: isAr ? "الشركات" : "Companies", value: analytics.viewerTypeBreakdown["company"] || 0, sub: isAr ? "زيارة من شركات" : "Company visits", color: "text-chart-4", bg: "bg-chart-4/10" },
  ];

  const followerCards = followerData ? [
    { icon: Users, label: isAr ? "المتابعون" : "Followers", value: followerData.totalFollowers, color: "text-chart-1", bg: "bg-chart-1/10" },
    { icon: UserPlus, label: isAr ? "متابعون جدد" : "New (30d)", value: followerData.newFollowers30d, color: "text-chart-2", bg: "bg-chart-2/10", trend: followerData.growthPercent },
    { icon: Users, label: isAr ? "أتابعهم" : "Following", value: followerData.totalFollowing, color: "text-chart-3", bg: "bg-chart-3/10" },
    { icon: Calendar, label: isAr ? "أفضل يوم" : "Best Day", value: followerData.bestCount || "-", sub: followerData.bestDay ? followerData.bestDay.slice(5) : "", color: "text-chart-5", bg: "bg-chart-5/10" },
  ] : [];

  const visitorTypePie = Object.entries(analytics.viewerTypeBreakdown).map(([key, val]) => ({
    name: key === "company" ? (isAr ? "شركات" : "Companies") : (isAr ? "أفراد" : "Individuals"),
    value: val,
  }));

  const devicePie = Object.entries(analytics.deviceBreakdown).map(([key, val]) => ({
    name: key === "mobile" ? (isAr ? "جوال" : "Mobile") : key === "desktop" ? (isAr ? "حاسوب" : "Desktop") : key,
    value: val,
  }));

  const referrerData = Object.entries(analytics.referrerBreakdown)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, value]) => ({ name, value }));

  const hourlyData = analytics.hourlyBreakdown.map((count: number, hour: number) => ({
    hour: `${hour.toString().padStart(2, "0")}:00`,
    views: count,
  }));

  // Browser breakdown
  const browserData = Object.entries(analytics.browserBreakdown)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value }));

  return (
    <StaggeredList className="space-y-6" stagger={80}>
      {/* Views Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${stat.bg}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-[10px] text-muted-foreground leading-tight">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Views Over Time */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            {isAr ? "الزيارات خلال 30 يوم" : "Views Over 30 Days"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.dailyViews}>
                <defs>
                  <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} className="text-muted-foreground" />
                <YAxis tick={{ fontSize: 10 }} className="text-muted-foreground" />
                <Tooltip
                  contentStyle={{ borderRadius: "0.75rem", border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }}
                  labelFormatter={(v) => v}
                />
                <Area type="monotone" dataKey="views" stroke="hsl(var(--primary))" fill="url(#viewsGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Follower Growth Section */}
      {followerData && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {followerCards.map((stat) => (
              <Card key={stat.label}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${stat.bg}`}>
                      <stat.icon className={`h-5 w-5 ${stat.color}`} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stat.value}</p>
                      <p className="text-[10px] text-muted-foreground leading-tight">{stat.label}</p>
                      {"trend" in stat && stat.trend !== undefined && stat.trend !== 0 && (
                        <p className={`text-[10px] font-medium ${(stat.trend as number) > 0 ? "text-chart-5" : "text-destructive"}`}>
                          {(stat.trend as number) > 0 ? "+" : ""}{stat.trend}%
                        </p>
                      )}
                      {"sub" in stat && stat.sub && (
                        <p className="text-[10px] text-muted-foreground">{stat.sub}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-primary" />
                {isAr ? "نمو المتابعين (30 يوم)" : "Follower Growth (30 Days)"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={followerData.dailyGrowth}>
                    <defs>
                      <linearGradient id="followerGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{ borderRadius: "0.75rem", border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }}
                    />
                    <Area type="monotone" dataKey="cumulative" stroke="hsl(var(--chart-2))" fill="url(#followerGrad)" strokeWidth={2} name={isAr ? "إجمالي المتابعين" : "Total Followers"} />
                    <Line type="monotone" dataKey="newFollowers" stroke="hsl(var(--chart-5))" strokeWidth={1.5} dot={false} name={isAr ? "متابعون جدد" : "New Followers"} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Charts Row */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* Visitor Type Pie */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              {isAr ? "نوع الزوار" : "Visitor Type"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={visitorTypePie} cx="50%" cy="50%" innerRadius={35} outerRadius={60} paddingAngle={4} dataKey="value">
                    {visitorTypePie.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-3 mt-2">
              {visitorTypePie.map((entry, i) => (
                <div key={entry.name} className="flex items-center gap-1.5 text-xs">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                  {entry.name} ({entry.value})
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Device Breakdown */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Monitor className="h-4 w-4 text-primary" />
              {isAr ? "الأجهزة" : "Devices"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={devicePie} cx="50%" cy="50%" innerRadius={35} outerRadius={60} paddingAngle={4} dataKey="value">
                    {devicePie.map((_, i) => <Cell key={i} fill={CHART_COLORS[(i + 2) % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-3 mt-2">
              {devicePie.map((entry, i) => (
                <div key={entry.name} className="flex items-center gap-1.5 text-xs">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[(i + 2) % CHART_COLORS.length] }} />
                  {entry.name} ({entry.value})
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Visit Times */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              {isAr ? "أوقات الزيارة" : "Visit Times"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourlyData}>
                  <XAxis dataKey="hour" tick={{ fontSize: 8 }} interval={3} />
                  <YAxis tick={{ fontSize: 8 }} />
                  <Tooltip />
                  <Bar dataKey="views" fill="hsl(var(--chart-3))" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Browser & Referrer Row */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Browser Breakdown */}
        {browserData.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Monitor className="h-4 w-4 text-primary" />
                {isAr ? "المتصفحات" : "Browsers"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {browserData.map((b, i) => {
                  const total = browserData.reduce((s, x) => s + x.value, 0);
                  const pct = total > 0 ? Math.round((b.value / total) * 100) : 0;
                  return (
                    <div key={b.name} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span>{b.name}</span>
                        <span className="text-muted-foreground text-xs">{b.value} ({pct}%)</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Referrers */}
        {referrerData.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Globe className="h-4 w-4 text-primary" />
                {isAr ? "مصادر الزيارات" : "Traffic Sources"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {referrerData.map((r, i) => (
                  <div key={r.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                      <span className="text-sm">{r.name}</span>
                    </div>
                    <Badge variant="secondary" className="text-xs">{r.value}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </StaggeredList>
  );
}
