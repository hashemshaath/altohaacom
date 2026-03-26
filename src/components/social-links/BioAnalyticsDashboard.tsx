import { memo, useState, useMemo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye, TrendingUp, Globe, Monitor, Clock, MousePointerClick, Smartphone, Users, Calendar, ArrowUpRight, ArrowDownRight, Minus, Percent, BarChart3 } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, ComposedChart, Line,
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

type Period = "7d" | "14d" | "30d";

function TrendBadge({ value, isAr }: { value: number; isAr: boolean }) {
  if (value === 0) return <Badge variant="secondary" className="text-[9px] gap-0.5"><Minus className="h-2.5 w-2.5" />0%</Badge>;
  const positive = value > 0;
  return (
    <Badge variant={positive ? "default" : "destructive"} className="text-[9px] gap-0.5">
      {positive ? <ArrowUpRight className="h-2.5 w-2.5" /> : <ArrowDownRight className="h-2.5 w-2.5" />}
      {positive ? "+" : ""}{value}%
    </Badge>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-card px-3 py-2 shadow-lg">
      <p className="text-[10px] text-muted-foreground mb-1">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className="text-xs font-semibold" style={{ color: entry.color }}>
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  );
};

export const BioAnalyticsDashboard = memo(function BioAnalyticsDashboard({ pageId }: BioAnalyticsDashboardProps) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [period, setPeriod] = useState<Period>("30d");
  const periodDays = period === "7d" ? 7 : period === "14d" ? 14 : 30;

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
      let recent14d = 0;
      let prev7d = 0;

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
        if (now - ts < 2 * week) recent14d++;
        if (ts < now - week && ts >= now - 2 * week) prev7d++;
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

      const changePercent = prev7d > 0 ? Math.round(((recent7d - prev7d) / prev7d) * 100) : recent7d > 0 ? 100 : 0;
      const uniqueSet = new Set(visits.map(v => `${v.device_type}-${v.browser}-${v.referrer || "d"}`));
      const avgDaily = visits.length > 0 ? Math.round(visits.length / Math.min(30, Math.ceil((now - new Date(visits[visits.length - 1].created_at).getTime()) / 86400000) || 1)) : 0;

      return {
        total: visits.length,
        recent7d,
        recent14d,
        changePercent,
        uniqueVisitors: uniqueSet.size,
        avgDaily,
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
      const linkClickMap: Record<string, number> = {};

      for (const c of clicks as any[]) {
        const d = new Date(c.created_at);
        hourlyAgg[d.getHours()]++;
        const dayKey = c.created_at.slice(0, 10);
        dailyClickMap[dayKey] = (dailyClickMap[dayKey] || 0) + 1;
        if (c.link_id) linkClickMap[c.link_id] = (linkClickMap[c.link_id] || 0) + 1;
      }

      const now = Date.now();
      const dailyClicks: { date: string; clicks: number }[] = [];
      for (let i = 29; i >= 0; i--) {
        const dt = new Date(now - i * 86400000);
        const key = dt.toISOString().slice(0, 10);
        dailyClicks.push({ date: key, clicks: dailyClickMap[key] || 0 });
      }

      return { total: clicks.length, hourlyAgg, dailyClicks, linkClickMap };
    },
    enabled: !!pageId,
    staleTime: 5 * 60_000,
  });

  // Link items for performance table
  const { data: linkItems } = useQuery({
    queryKey: ["bio-link-items", pageId],
    queryFn: async () => {
      const { data } = await supabase
        .from("social_link_items")
        .select("id, title, url, icon, click_count, link_type, sort_order")
        .eq("page_id", pageId)
        .eq("is_active", true)
        .order("sort_order");
      return data || [];
    },
    enabled: !!pageId,
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

  // Derived metrics
  const ctr = useMemo(() => {
    if (!visitorStats || visitorStats.total === 0 || !clickAnalytics) return 0;
    return Math.round((clickAnalytics.total / visitorStats.total) * 1000) / 10;
  }, [visitorStats, clickAnalytics]);

  const periodVisits = useMemo(() => {
    if (!visitorStats?.dailyVisits) return [];
    return visitorStats.dailyVisits.slice(-periodDays);
  }, [visitorStats, periodDays]);

  const periodClicks = useMemo(() => {
    if (!clickAnalytics?.dailyClicks) return [];
    return clickAnalytics.dailyClicks.slice(-periodDays);
  }, [clickAnalytics, periodDays]);

  // Combined chart data
  const combinedData = useMemo(() => {
    if (!periodVisits.length) return [];
    return periodVisits.map((v, i) => ({
      date: v.date.slice(5),
      [isAr ? "زيارات" : "Views"]: v.visits,
      [isAr ? "نقرات" : "Clicks"]: periodClicks[i]?.clicks || 0,
    }));
  }, [periodVisits, periodClicks, isAr]);

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

  const totalClicks = clickAnalytics?.total || 0;

  const statCards = [
    { icon: Eye, label: isAr ? "إجمالي الزيارات" : "Total Views", value: visitorStats.total, color: "text-chart-1", bg: "bg-chart-1/10" },
    { icon: TrendingUp, label: isAr ? "آخر 7 أيام" : "Last 7 Days", value: visitorStats.recent7d, color: "text-chart-2", bg: "bg-chart-2/10", trend: visitorStats.changePercent },
    { icon: MousePointerClick, label: isAr ? "النقرات" : "Clicks", value: totalClicks, color: "text-chart-4", bg: "bg-chart-4/10" },
    { icon: Percent, label: "CTR", value: ctr, color: "text-chart-3", bg: "bg-chart-3/10", suffix: "%" },
    { icon: Users, label: isAr ? "زوار فريدون" : "Unique Visitors", value: visitorStats.uniqueVisitors, color: "text-chart-5", bg: "bg-chart-5/10" },
    { icon: Calendar, label: isAr ? "متوسط يومي" : "Daily Avg", value: visitorStats.avgDaily, color: "text-primary", bg: "bg-primary/10" },
  ];

  const devicePie = Object.entries(visitorStats.devices).map(([key, val]) => ({
    name: key === "mobile" ? (isAr ? "جوال" : "Mobile") : key === "desktop" ? (isAr ? "حاسوب" : "Desktop") : key === "tablet" ? (isAr ? "تابلت" : "Tablet") : key,
    value: val,
  }));

  const referrerData = Object.entries(visitorStats.referrers)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
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
    [isAr ? "زيارات" : "Views"]: count,
  }));

  // Link performance table
  const linkPerformance = (linkItems || [])
    .map(item => ({
      ...item,
      clicks: item.click_count || 0,
      ctr: visitorStats.total > 0 ? Math.round(((item.click_count || 0) / visitorStats.total) * 1000) / 10 : 0,
      share: totalClicks > 0 ? Math.round(((item.click_count || 0) / totalClicks) * 100) : 0,
    }))
    .sort((a, b) => b.clicks - a.clicks);

  // Conversion funnel
  const funnelData = [
    { stage: isAr ? "زيارات" : "Views", value: visitorStats.total, color: CHART_COLORS[0] },
    { stage: isAr ? "نقرات" : "Clicks", value: totalClicks, color: CHART_COLORS[1] },
    ...(subscriberCount && subscriberCount > 0 ? [{ stage: isAr ? "مشتركين" : "Subscribers", value: subscriberCount, color: CHART_COLORS[2] }] : []),
  ];

  return (
    <StaggeredList className="space-y-6" stagger={80}>
      {/* Period Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-muted-foreground">
          {isAr ? "نظرة عامة" : "Overview"}
        </h2>
        <Tabs value={period} onValueChange={(v) => setPeriod(v as Period)}>
          <TabsList className="h-8">
            <TabsTrigger value="7d" className="text-[10px] px-2.5 h-6">{isAr ? "7 أيام" : "7D"}</TabsTrigger>
            <TabsTrigger value="14d" className="text-[10px] px-2.5 h-6">{isAr ? "14 يوم" : "14D"}</TabsTrigger>
            <TabsTrigger value="30d" className="text-[10px] px-2.5 h-6">{isAr ? "30 يوم" : "30D"}</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${stat.bg}`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-xl font-bold tabular-nums">
                    <AnimatedCounter value={typeof stat.value === "number" ? Math.round(stat.value) : 0} />
                    {"suffix" in stat ? stat.suffix : ""}
                  </p>
                  <p className="text-[10px] text-muted-foreground leading-tight truncate">{stat.label}</p>
                  {"trend" in stat && stat.trend !== undefined && <TrendBadge value={stat.trend as number} isAr={isAr} />}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Subscribers card */}
      {subscriberCount !== undefined && subscriberCount > 0 && (
        <Card className="border-chart-5/20 bg-gradient-to-r from-chart-5/5 to-transparent">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-chart-5/10">
              <Users className="h-5 w-5 text-chart-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{subscriberCount}</p>
              <p className="text-[10px] text-muted-foreground">{isAr ? "مشتركين نشطين" : "Active Subscribers"}</p>
            </div>
            {visitorStats.total > 0 && (
              <Badge variant="outline" className="ms-auto text-[10px]">
                {isAr ? "معدل الاشتراك" : "Sub Rate"}: {((subscriberCount / visitorStats.total) * 100).toFixed(1)}%
              </Badge>
            )}
          </CardContent>
        </Card>
      )}

      {/* Conversion Funnel */}
      {funnelData.length >= 2 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              {isAr ? "قمع التحويل" : "Conversion Funnel"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2 h-32">
              {funnelData.map((step, i) => {
                const maxVal = funnelData[0].value || 1;
                const pct = (step.value / maxVal) * 100;
                const convRate = i > 0 ? ((step.value / funnelData[i - 1].value) * 100).toFixed(1) : "100";
                return (
                  <div key={step.stage} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs font-bold tabular-nums">{step.value}</span>
                    <div className="w-full rounded-t-lg transition-all duration-500" style={{ height: `${Math.max(pct, 8)}%`, backgroundColor: step.color, opacity: 0.7 }} />
                    <span className="text-[10px] font-medium text-center">{step.stage}</span>
                    {i > 0 && <span className="text-[9px] text-muted-foreground">{convRate}%</span>}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Combined Views + Clicks Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            {isAr ? `الزيارات والنقرات (${periodDays} يوم)` : `Views & Clicks (${periodDays} days)`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={combinedData}>
                <defs>
                  <linearGradient id="bioViewsGrad2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                <XAxis dataKey="date" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey={isAr ? "زيارات" : "Views"} stroke="hsl(var(--primary))" fill="url(#bioViewsGrad2)" strokeWidth={2} />
                <Line type="monotone" dataKey={isAr ? "نقرات" : "Clicks"} stroke="hsl(var(--chart-4))" strokeWidth={2} dot={{ r: 2 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Link Performance Table */}
      {linkPerformance.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <MousePointerClick className="h-4 w-4 text-primary" />
              {isAr ? "أداء الروابط" : "Link Performance"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">#</TableHead>
                    <TableHead className="text-xs">{isAr ? "الرابط" : "Link"}</TableHead>
                    <TableHead className="text-xs text-center">{isAr ? "نقرات" : "Clicks"}</TableHead>
                    <TableHead className="text-xs text-center">CTR</TableHead>
                    <TableHead className="text-xs text-center">{isAr ? "الحصة" : "Share"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {linkPerformance.slice(0, 10).map((item, i) => (
                    <TableRow key={item.id}>
                      <TableCell className="text-xs font-bold tabular-nums w-8">
                        <span className={i < 3 ? "text-chart-2" : "text-muted-foreground"}>{i + 1}</span>
                      </TableCell>
                      <TableCell className="text-xs max-w-[200px]">
                        <div className="flex items-center gap-1.5">
                          {item.icon && <span>{item.icon}</span>}
                          <span className="truncate font-medium">{item.title}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-center font-bold tabular-nums">{item.clicks}</TableCell>
                      <TableCell className="text-xs text-center tabular-nums">{item.ctr}%</TableCell>
                      <TableCell className="text-xs text-center">
                        <div className="flex items-center gap-1.5">
                          <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                            <div className="h-full rounded-full bg-primary/60" style={{ width: `${Math.max(item.share, 2)}%` }} />
                          </div>
                          <span className="text-[10px] tabular-nums w-8">{item.share}%</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
                  <Tooltip content={<CustomTooltip />} />
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
                  <XAxis dataKey="hour" tick={{ fontSize: 8 }} interval={3} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 8 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey={isAr ? "زيارات" : "Views"} radius={[3, 3, 0, 0]}>
                    {hourlyData.map((_: any, i: number) => {
                      const max = Math.max(...visitorStats.hourlyBreakdown);
                      const val = visitorStats.hourlyBreakdown[i];
                      return <Cell key={i} fill={val === max ? "hsl(var(--chart-2))" : "hsl(var(--primary) / 0.4)"} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[10px] text-muted-foreground text-center mt-1">
              {isAr ? "أفضل وقت" : "Peak"}: {visitorStats.hourlyBreakdown.indexOf(Math.max(...visitorStats.hourlyBreakdown))}:00
            </p>
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
                {countryData.map((c, i) => {
                  const pct = Math.round((c.value / visitorStats.total) * 100);
                  return (
                    <div key={c.name} className="space-y-0.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                          <span className="text-xs">{c.name}</span>
                        </div>
                        <span className="text-xs font-bold tabular-nums">{c.value} <span className="text-muted-foreground font-normal">({pct}%)</span></span>
                      </div>
                      <div className="h-1 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                      </div>
                    </div>
                  );
                })}
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
                {(() => {
                  const browserTotal = browserData.reduce((s, x) => s + x.value, 0);
                  return browserData.map((b, i) => {
                    const pct = browserTotal > 0 ? Math.round((b.value / browserTotal) * 100) : 0;
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
                  });
                })()}
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
                {(() => {
                  const refTotal = referrerData.reduce((s, x) => s + x.value, 0);
                  return referrerData.map((r, i) => {
                    const pct = refTotal > 0 ? Math.round((r.value / refTotal) * 100) : 0;
                    return (
                      <div key={r.name} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="truncate max-w-[160px]">{r.name}</span>
                          <span className="text-muted-foreground text-xs tabular-nums">{r.value} ({pct}%)</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </StaggeredList>
  );
});
