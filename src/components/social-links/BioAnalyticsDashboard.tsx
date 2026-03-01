import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, TrendingUp, Globe, Monitor, Clock, MousePointerClick, Smartphone, Users, Calendar } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar,
} from "recharts";
import { StaggeredList } from "@/components/ui/staggered-list";
import { EmptyState } from "@/components/ui/empty-state";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AnimatedCounter } from "@/components/ui/animated-counter";

interface BioAnalyticsDashboardProps {
  pageId: string;
}

const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export function BioAnalyticsDashboard({ pageId }: BioAnalyticsDashboardProps) {
  const { language } = useLanguage();
  const isAr = language === "ar";

  // Visitor analytics
  const { data: visitorStats, isLoading } = useQuery({
    queryKey: ["bio-analytics-full", pageId],
    queryFn: async () => {
      const { data: visits } = await supabase
        .from("social_link_visits")
        .select("country, device_type, browser, referrer, created_at")
        .eq("page_id", pageId)
        .order("created_at", { ascending: false })
        .limit(1000);

      if (!visits) return null;

      const now = Date.now();
      const week = 7 * 24 * 60 * 60 * 1000;
      const countries: Record<string, number> = {};
      const devices: Record<string, number> = {};
      const browsers: Record<string, number> = {};
      const referrers: Record<string, number> = {};
      const dailyMap: Record<string, number> = {};
      const hourlyBreakdown = new Array(24).fill(0);
      let recent7d = 0;

      for (const v of visits) {
        if (v.country) countries[v.country] = (countries[v.country] || 0) + 1;
        if (v.device_type) devices[v.device_type] = (devices[v.device_type] || 0) + 1;
        if (v.browser) browsers[v.browser] = (browsers[v.browser] || 0) + 1;
        try {
          const ref = v.referrer ? new URL(v.referrer).hostname.replace("www.", "") : "direct";
          referrers[ref] = (referrers[ref] || 0) + 1;
        } catch { referrers["direct"] = (referrers["direct"] || 0) + 1; }
        const ts = new Date(v.created_at).getTime();
        if (now - ts < week) recent7d++;
        const day = v.created_at.slice(0, 10);
        dailyMap[day] = (dailyMap[day] || 0) + 1;
        hourlyBreakdown[new Date(v.created_at).getHours()]++;
      }

      // Build last 30 days chart data
      const dailyVisits: { date: string; visits: number }[] = [];
      for (let i = 29; i >= 0; i--) {
        const d = new Date(now - i * 86400000);
        const key = d.toISOString().slice(0, 10);
        dailyVisits.push({ date: key, visits: dailyMap[key] || 0 });
      }

      // Previous 7 days for comparison
      const prev7 = visits.filter(v => {
        const ts = new Date(v.created_at).getTime();
        return ts < now - week && ts >= now - 2 * week;
      }).length;
      const changePercent = prev7 > 0 ? Math.round(((recent7d - prev7) / prev7) * 100) : recent7d > 0 ? 100 : 0;

      // Unique visitors estimation (by combining referrer + device + browser as fingerprint)
      const uniqueSet = new Set(visits.map(v => `${v.device_type}-${v.browser}-${v.referrer || "d"}`));

      return {
        total: visits.length,
        recent7d,
        changePercent,
        uniqueVisitors: uniqueSet.size,
        countries,
        devices,
        browsers,
        referrers,
        dailyVisits,
        hourlyBreakdown,
      };
    },
    enabled: !!pageId,
    staleTime: 5 * 60_000,
  });

  // Click analytics
  const { data: clickAnalytics } = useQuery({
    queryKey: ["bio-click-analytics-full", pageId],
    queryFn: async () => {
      const { data: clicks } = await supabase
        .from("social_link_clicks" as any)
        .select("link_id, device_type, browser, created_at")
        .eq("page_id", pageId)
        .order("created_at", { ascending: false })
        .limit(2000);

      if (!clicks || !Array.isArray(clicks) || clicks.length === 0) return null;

      const hourlyAgg = Array(24).fill(0);
      const dailyClickMap: Record<string, number> = {};
      for (const c of clicks as any[]) {
        const d = new Date(c.created_at);
        hourlyAgg[d.getHours()]++;
        const dayKey = c.created_at.slice(0, 10);
        dailyClickMap[dayKey] = (dailyClickMap[dayKey] || 0) + 1;
      }

      const now = Date.now();
      const dailyClicks: { date: string; clicks: number }[] = [];
      for (let i = 29; i >= 0; i--) {
        const dt = new Date(now - i * 86400000);
        const key = dt.toISOString().slice(0, 10);
        dailyClicks.push({ date: key, clicks: dailyClickMap[key] || 0 });
      }

      return { total: clicks.length, hourlyAgg, dailyClicks };
    },
    enabled: !!pageId,
    staleTime: 5 * 60_000,
  });

  // Subscriber count
  const { data: subscriberCount } = useQuery({
    queryKey: ["bio-subscribers-count", pageId],
    queryFn: async () => {
      const { count } = await supabase.from("bio_subscribers").select("id", { count: "exact", head: true }).eq("page_id", pageId).eq("is_active", true);
      return count || 0;
    },
    enabled: !!pageId,
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

  if (!visitorStats || visitorStats.total === 0) {
    return (
      <EmptyState
        icon={Eye}
        title={isAr ? "لا توجد بيانات بعد" : "No analytics data yet"}
        description={isAr ? "ستظهر الإحصائيات عند زيارة صفحتك" : "Analytics will appear when your bio page gets visits"}
      />
    );
  }

  const statCards = [
    { icon: Eye, label: isAr ? "إجمالي الزيارات" : "Total Views", value: visitorStats.total, color: "text-chart-1", bg: "bg-chart-1/10" },
    { icon: TrendingUp, label: isAr ? "آخر 7 أيام" : "Last 7 Days", value: visitorStats.recent7d, color: "text-chart-2", bg: "bg-chart-2/10", trend: visitorStats.changePercent },
    { icon: Users, label: isAr ? "زوار فريدون" : "Unique Visitors", value: visitorStats.uniqueVisitors, color: "text-chart-3", bg: "bg-chart-3/10" },
    { icon: MousePointerClick, label: isAr ? "النقرات" : "Clicks", value: clickAnalytics?.total || 0, color: "text-chart-4", bg: "bg-chart-4/10" },
  ];

  const devicePie = Object.entries(visitorStats.devices).map(([key, val]) => ({
    name: key === "mobile" ? (isAr ? "جوال" : "Mobile") : key === "desktop" ? (isAr ? "حاسوب" : "Desktop") : key === "tablet" ? (isAr ? "تابلت" : "Tablet") : key,
    value: val,
  }));

  const referrerData = Object.entries(visitorStats.referrers)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, value]) => ({ name, value }));

  const browserData = Object.entries(visitorStats.browsers)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value }));

  const countryData = Object.entries(visitorStats.countries)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, value]) => ({ name, value }));

  const hourlyData = visitorStats.hourlyBreakdown.map((count: number, hour: number) => ({
    hour: `${hour.toString().padStart(2, "0")}:00`,
    views: count,
  }));

  return (
    <StaggeredList className="space-y-6" stagger={80}>
      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${stat.bg}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold"><AnimatedCounter value={typeof stat.value === "number" ? stat.value : 0} /></p>
                  <p className="text-[10px] text-muted-foreground leading-tight">{stat.label}</p>
                  {"trend" in stat && stat.trend !== undefined && stat.trend !== 0 && (
                    <p className={`text-[10px] font-medium ${(stat.trend as number) > 0 ? "text-chart-5" : "text-destructive"}`}>
                      {(stat.trend as number) > 0 ? "+" : ""}{stat.trend}%
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Subscribers card */}
      {subscriberCount !== undefined && subscriberCount > 0 && (
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-chart-5/10">
              <Users className="h-5 w-5 text-chart-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{subscriberCount}</p>
              <p className="text-[10px] text-muted-foreground">{isAr ? "مشتركين نشطين" : "Active Subscribers"}</p>
            </div>
          </CardContent>
        </Card>
      )}

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
              <AreaChart data={visitorStats.dailyVisits}>
                <defs>
                  <linearGradient id="bioViewsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ borderRadius: "0.75rem", border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
                <Area type="monotone" dataKey="visits" stroke="hsl(var(--primary))" fill="url(#bioViewsGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Click trends (if available) */}
      {clickAnalytics && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <MousePointerClick className="h-4 w-4 text-primary" />
              {isAr ? "النقرات خلال 30 يوم" : "Clicks Over 30 Days"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={clickAnalytics.dailyClicks}>
                  <defs>
                    <linearGradient id="bioClicksGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-4))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--chart-4))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ borderRadius: "0.75rem", border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
                  <Area type="monotone" dataKey="clicks" stroke="hsl(var(--chart-4))" fill="url(#bioClicksGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts Row */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* Device Breakdown */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-primary" />
              {isAr ? "الأجهزة" : "Devices"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={devicePie} cx="50%" cy="50%" innerRadius={35} outerRadius={60} paddingAngle={4} dataKey="value">
                    {devicePie.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-3 mt-2">
              {devicePie.map((entry, i) => (
                <div key={entry.name} className="flex items-center gap-1.5 text-xs">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
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

        {/* Countries */}
        {countryData.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Globe className="h-4 w-4 text-primary" />
                {isAr ? "الدول" : "Countries"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {countryData.map((c, i) => (
                  <div key={c.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                      <span className="text-sm">{c.name}</span>
                    </div>
                    <Badge variant="secondary" className="text-xs">{c.value}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Browser & Referrer Row */}
      <div className="grid md:grid-cols-2 gap-4">
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
                      <span className="text-sm truncate max-w-[150px]">{r.name}</span>
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
