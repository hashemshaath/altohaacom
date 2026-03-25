import { memo, useState, useMemo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell, Legend, LineChart, Line,
} from "recharts";
import {
  CHART_COLORS, TOOLTIP_STYLE, X_AXIS_PROPS, Y_AXIS_PROPS,
  GRID_PROPS, LEGEND_STYLE, BAR_RADIUS, H_BAR_RADIUS, CHART_HEIGHT, getNoDataText,
} from "@/lib/chartConfig";
import {
  Activity, Eye, MousePointerClick, Clock, Globe, Monitor, Smartphone,
  Tablet, Search, ArrowUpDown, Zap, TrendingUp, BarChart3, Users,
  FileText, Layers, Timer, MapPin, Chrome,
} from "lucide-react";
import { format, subDays, subHours, parseISO } from "date-fns";

const EXTRA_COLORS = [
  "hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))",
  "hsl(var(--chart-4))", "hsl(var(--chart-5))", "hsl(var(--primary))",
];

type TimeRange = "1h" | "24h" | "7d" | "30d";

function getTimeFilter(range: TimeRange): string {
  const now = new Date();
  switch (range) {
    case "1h": return subHours(now, 1).toISOString();
    case "24h": return subHours(now, 24).toISOString();
    case "7d": return subDays(now, 7).toISOString();
    case "30d": return subDays(now, 30).toISOString();
  }
}

export const EventsMonitoring = memo(function EventsMonitoring() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [timeRange, setTimeRange] = useState<TimeRange>("7d");
  const [searchQuery, setSearchQuery] = useState("");
  const [subTab, setSubTab] = useState("overview");

  const since = useMemo(() => getTimeFilter(timeRange), [timeRange]);

  // Fetch page views
  const { data: pageViews } = useQuery({
    queryKey: ["events-pageviews", timeRange],
    queryFn: async () => {
      const { data } = await supabase
        .from("seo_page_views")
        .select("path, device_type, is_bounce, duration_seconds, created_at, session_id, country, referrer, title")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(1000);
      return data || [];
    },
    staleTime: 30_000,
  });

  // Fetch behavioral events
  const { data: behaviorEvents } = useQuery({
    queryKey: ["events-behaviors", timeRange],
    queryFn: async () => {
      const { data } = await supabase
        .from("ad_user_behaviors")
        .select("event_type, page_url, page_category, device_type, browser, country, duration_seconds, created_at, session_id, entity_type")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(1000);
      return data || [];
    },
    staleTime: 30_000,
  });

  // Fetch ad clicks
  const { data: adClicks } = useQuery({
    queryKey: ["events-adclicks", timeRange],
    queryFn: async () => {
      const { data } = await supabase
        .from("ad_clicks")
        .select("id, device_type, browser, country, created_at, page_url")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(500);
      return data || [];
    },
    staleTime: 30_000,
  });

  // Fetch ad impressions
  const { data: adImpressions } = useQuery({
    queryKey: ["events-adimpressions", timeRange],
    queryFn: async () => {
      const { data } = await supabase
        .from("ad_impressions")
        .select("id, device_type, browser, country, created_at, page_url")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(500);
      return data || [];
    },
    staleTime: 30_000,
  });

  // ── Computed metrics ──
  const metrics = useMemo(() => {
    const pv = pageViews || [];
    const bv = behaviorEvents || [];
    const clicks = adClicks || [];
    const impressions = adImpressions || [];

    const totalPageViews = pv.length;
    const totalEvents = bv.length;
    const totalClicks = clicks.length;
    const totalImpressions = impressions.length;
    const uniqueSessions = new Set([...pv.map(p => p.session_id), ...bv.map(b => b.session_id)].filter(Boolean)).size;
    const bounceCount = pv.filter(p => p.is_bounce).length;
    const bounceRate = totalPageViews > 0 ? Math.round((bounceCount / totalPageViews) * 100) : 0;
    const avgDuration = pv.length > 0
      ? Math.round(pv.reduce((s, p) => s + (p.duration_seconds || 0), 0) / pv.length)
      : 0;

    return { totalPageViews, totalEvents, totalClicks, totalImpressions, uniqueSessions, bounceRate, avgDuration };
  }, [pageViews, behaviorEvents, adClicks, adImpressions]);

  // ── Timeline chart data ──
  const timelineData = useMemo(() => {
    const pv = pageViews || [];
    const bv = behaviorEvents || [];
    const buckets: Record<string, { date: string; pageViews: number; events: number }> = {};

    const fmt = timeRange === "1h" ? "HH:mm" : timeRange === "24h" ? "HH:00" : "MM/dd";

    [...pv].forEach(p => {
      const key = format(parseISO(p.created_at), fmt);
      if (!buckets[key]) buckets[key] = { date: key, pageViews: 0, events: 0 };
      buckets[key].pageViews++;
    });
    [...bv].forEach(b => {
      const key = format(parseISO(b.created_at), fmt);
      if (!buckets[key]) buckets[key] = { date: key, pageViews: 0, events: 0 };
      buckets[key].events++;
    });

    return Object.values(buckets).sort((a, b) => a.date.localeCompare(b.date));
  }, [pageViews, behaviorEvents, timeRange]);

  // ── Event type distribution ──
  const eventTypeData = useMemo(() => {
    const map: Record<string, number> = {};
    (behaviorEvents || []).forEach(e => {
      map[e.event_type] = (map[e.event_type] || 0) + 1;
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [behaviorEvents]);

  // ── Top pages ──
  const topPages = useMemo(() => {
    const map: Record<string, { path: string; views: number; avgDuration: number; bounces: number }> = {};
    (pageViews || []).forEach(p => {
      if (!map[p.path]) map[p.path] = { path: p.path, views: 0, avgDuration: 0, bounces: 0 };
      map[p.path].views++;
      map[p.path].avgDuration += p.duration_seconds || 0;
      if (p.is_bounce) map[p.path].bounces++;
    });
    return Object.values(map)
      .map(p => ({ ...p, avgDuration: p.views > 0 ? Math.round(p.avgDuration / p.views) : 0, bounceRate: p.views > 0 ? Math.round((p.bounces / p.views) * 100) : 0 }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 15);
  }, [pageViews]);

  // ── Device breakdown ──
  const deviceData = useMemo(() => {
    const map: Record<string, number> = {};
    (pageViews || []).forEach(p => {
      const d = p.device_type || "unknown";
      map[d] = (map[d] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [pageViews]);

  // ── Country breakdown ──
  const countryData = useMemo(() => {
    const map: Record<string, number> = {};
    (pageViews || []).forEach(p => {
      if (p.country) map[p.country] = (map[p.country] || 0) + 1;
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [pageViews]);

  // ── Referrer breakdown ──
  const referrerData = useMemo(() => {
    const map: Record<string, number> = {};
    (pageViews || []).forEach(p => {
      const ref = p.referrer ? new URL(p.referrer, "https://x.com").hostname.replace("www.", "") : "direct";
      map[ref] = (map[ref] || 0) + 1;
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [pageViews]);

  // ── Live event feed (filtered) ──
  const eventFeed = useMemo(() => {
    const all = [
      ...(pageViews || []).map(p => ({ type: "page_view", label: p.path, time: p.created_at, device: p.device_type })),
      ...(behaviorEvents || []).map(b => ({ type: b.event_type, label: b.page_url || b.entity_type || "", time: b.created_at, device: b.device_type })),
      ...(adClicks || []).map(c => ({ type: "ad_click", label: c.page_url || "", time: c.created_at, device: c.device_type })),
    ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return all.filter(e => e.type.toLowerCase().includes(q) || e.label.toLowerCase().includes(q));
    }
    return all.slice(0, 50);
  }, [pageViews, behaviorEvents, adClicks, searchQuery]);

  const deviceIcon = (d: string | null) => {
    if (d === "mobile") return <Smartphone className="h-3 w-3" />;
    if (d === "tablet") return <Tablet className="h-3 w-3" />;
    return <Monitor className="h-3 w-3" />;
  };

  const kpis = [
    { label: isAr ? "مشاهدات الصفحات" : "Page Views", value: metrics.totalPageViews, icon: Eye, color: "text-primary" },
    { label: isAr ? "أحداث سلوكية" : "Behavioral Events", value: metrics.totalEvents, icon: Zap, color: "text-chart-2" },
    { label: isAr ? "جلسات فريدة" : "Unique Sessions", value: metrics.uniqueSessions, icon: Users, color: "text-chart-3" },
    { label: isAr ? "نقرات إعلانية" : "Ad Clicks", value: metrics.totalClicks, icon: MousePointerClick, color: "text-chart-4" },
    { label: isAr ? "ظهور الإعلانات" : "Ad Impressions", value: metrics.totalImpressions, icon: Layers, color: "text-chart-5" },
    { label: isAr ? "معدل الارتداد" : "Bounce Rate", value: metrics.bounceRate, icon: TrendingUp, color: "text-destructive", suffix: "%" },
    { label: isAr ? "متوسط المدة" : "Avg Duration", value: metrics.avgDuration, icon: Timer, color: "text-chart-1", suffix: "s" },
  ];

  return (
    <div className="space-y-5">
      {/* Time range + search */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
          <SelectTrigger className="w-[140px] h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1h">{isAr ? "آخر ساعة" : "Last 1 hour"}</SelectItem>
            <SelectItem value="24h">{isAr ? "آخر 24 ساعة" : "Last 24 hours"}</SelectItem>
            <SelectItem value="7d">{isAr ? "آخر 7 أيام" : "Last 7 days"}</SelectItem>
            <SelectItem value="30d">{isAr ? "آخر 30 يوم" : "Last 30 days"}</SelectItem>
          </SelectContent>
        </Select>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute start-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder={isAr ? "بحث في الأحداث..." : "Search events..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="ps-8 h-8 text-xs"
          />
        </div>
        <Badge variant="outline" className="gap-1 text-[10px]">
          <Activity className="h-3 w-3 text-chart-2 animate-pulse" />
          {isAr ? "مباشر" : "Live"}
        </Badge>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {kpis.map((kpi, i) => (
          <Card key={i} className="group hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
            <CardContent className="p-3 text-center">
              <kpi.icon className={`h-4 w-4 mx-auto mb-1 ${kpi.color} transition-transform duration-300 group-hover:scale-110`} />
              <div className="text-lg font-bold">
                <AnimatedCounter value={kpi.value} />
                {kpi.suffix && <span className="text-xs text-muted-foreground ms-0.5">{kpi.suffix}</span>}
              </div>
              <div className="text-[10px] text-muted-foreground leading-tight">{kpi.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Sub-tabs */}
      <Tabs value={subTab} onValueChange={setSubTab}>
        <TabsList className="bg-card border border-border p-0.5 h-auto rounded-lg">
          <TabsTrigger value="overview" className="gap-1 text-xs px-3 py-1.5 rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <BarChart3 className="h-3 w-3" />{isAr ? "نظرة عامة" : "Overview"}
          </TabsTrigger>
          <TabsTrigger value="pages" className="gap-1 text-xs px-3 py-1.5 rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <FileText className="h-3 w-3" />{isAr ? "الصفحات" : "Pages"}
          </TabsTrigger>
          <TabsTrigger value="audience" className="gap-1 text-xs px-3 py-1.5 rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Globe className="h-3 w-3" />{isAr ? "الجمهور" : "Audience"}
          </TabsTrigger>
          <TabsTrigger value="feed" className="gap-1 text-xs px-3 py-1.5 rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Activity className="h-3 w-3" />{isAr ? "البث المباشر" : "Live Feed"}
          </TabsTrigger>
        </TabsList>

        {/* ── Overview Tab ── */}
        <TabsContent value="overview" className="space-y-4 mt-4">
          {/* Timeline */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                {isAr ? "نشاط الأحداث بمرور الوقت" : "Event Activity Over Time"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {timelineData.length > 0 ? (
                <ResponsiveContainer width="100%" height={CHART_HEIGHT.md}>
                  <AreaChart data={timelineData}>
                    <CartesianGrid {...GRID_PROPS} />
                    <XAxis dataKey="date" {...X_AXIS_PROPS} />
                    <YAxis {...Y_AXIS_PROPS} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                    <Legend wrapperStyle={LEGEND_STYLE} />
                    <Area type="monotone" dataKey="pageViews" stroke={CHART_COLORS[0]} fill={CHART_COLORS[0]} fillOpacity={0.15} strokeWidth={2} name={isAr ? "مشاهدات" : "Page Views"} />
                    <Area type="monotone" dataKey="events" stroke={CHART_COLORS[2]} fill={CHART_COLORS[2]} fillOpacity={0.1} strokeWidth={2} name={isAr ? "أحداث" : "Events"} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : <p className="py-12 text-center text-muted-foreground text-sm">{getNoDataText(isAr)}</p>}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Event Type Distribution */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Zap className="h-4 w-4 text-chart-2" />
                  {isAr ? "توزيع أنواع الأحداث" : "Event Type Distribution"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {eventTypeData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={CHART_HEIGHT.md}>
                    <BarChart data={eventTypeData} layout="vertical">
                      <CartesianGrid {...GRID_PROPS} />
                      <XAxis type="number" allowDecimals={false} tick={X_AXIS_PROPS.tick} axisLine={X_AXIS_PROPS.axisLine} tickLine={false} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={100} />
                      <Tooltip contentStyle={TOOLTIP_STYLE} />
                      <Bar dataKey="value" radius={H_BAR_RADIUS} name={isAr ? "العدد" : "Count"}>
                        {eventTypeData.map((_, i) => <Cell key={i} fill={EXTRA_COLORS[i % EXTRA_COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : <p className="py-12 text-center text-muted-foreground text-sm">{getNoDataText(isAr)}</p>}
              </CardContent>
            </Card>

            {/* Device Breakdown */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Monitor className="h-4 w-4 text-chart-3" />
                  {isAr ? "الأجهزة" : "Device Breakdown"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {deviceData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={CHART_HEIGHT.md}>
                    <PieChart>
                      <Pie data={deviceData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={50} paddingAngle={3} strokeWidth={0}>
                        {deviceData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={TOOLTIP_STYLE} />
                      <Legend wrapperStyle={LEGEND_STYLE} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <p className="py-12 text-center text-muted-foreground text-sm">{getNoDataText(isAr)}</p>}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Pages Tab ── */}
        <TabsContent value="pages" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                {isAr ? "أفضل الصفحات" : "Top Pages"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {topPages.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground">
                        <th className="text-start py-2 px-2 font-medium">{isAr ? "الصفحة" : "Page"}</th>
                        <th className="text-center py-2 px-2 font-medium">{isAr ? "المشاهدات" : "Views"}</th>
                        <th className="text-center py-2 px-2 font-medium">{isAr ? "متوسط المدة" : "Avg Duration"}</th>
                        <th className="text-center py-2 px-2 font-medium">{isAr ? "الارتداد" : "Bounce"}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topPages.map((page, i) => (
                        <tr key={i} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                          <td className="py-2 px-2 font-mono text-foreground max-w-[300px] truncate">{page.path}</td>
                          <td className="py-2 px-2 text-center">
                            <Badge variant="secondary" className="text-[10px]">{page.views}</Badge>
                          </td>
                          <td className="py-2 px-2 text-center text-muted-foreground">{page.avgDuration}s</td>
                          <td className="py-2 px-2 text-center">
                            <span className={page.bounceRate > 70 ? "text-destructive font-medium" : "text-muted-foreground"}>
                              {page.bounceRate}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : <p className="py-12 text-center text-muted-foreground text-sm">{getNoDataText(isAr)}</p>}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Audience Tab ── */}
        <TabsContent value="audience" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Countries */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-chart-4" />
                  {isAr ? "أبرز الدول" : "Top Countries"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {countryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={CHART_HEIGHT.md}>
                    <BarChart data={countryData} layout="vertical">
                      <CartesianGrid {...GRID_PROPS} />
                      <XAxis type="number" allowDecimals={false} tick={X_AXIS_PROPS.tick} axisLine={X_AXIS_PROPS.axisLine} tickLine={false} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={50} />
                      <Tooltip contentStyle={TOOLTIP_STYLE} />
                      <Bar dataKey="value" radius={H_BAR_RADIUS} fill={CHART_COLORS[3]} name={isAr ? "الزيارات" : "Visits"} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <p className="py-12 text-center text-muted-foreground text-sm">{getNoDataText(isAr)}</p>}
              </CardContent>
            </Card>

            {/* Referrers / Traffic Sources */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Chrome className="h-4 w-4 text-chart-1" />
                  {isAr ? "مصادر الزيارات" : "Traffic Sources"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {referrerData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={CHART_HEIGHT.md}>
                    <PieChart>
                      <Pie data={referrerData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={45} paddingAngle={2} strokeWidth={0}>
                        {referrerData.map((_, i) => <Cell key={i} fill={EXTRA_COLORS[i % EXTRA_COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={TOOLTIP_STYLE} />
                      <Legend wrapperStyle={LEGEND_STYLE} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <p className="py-12 text-center text-muted-foreground text-sm">{getNoDataText(isAr)}</p>}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Live Feed Tab ── */}
        <TabsContent value="feed" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Activity className="h-4 w-4 text-chart-2" />
                {isAr ? "بث الأحداث المباشر" : "Live Event Stream"}
                <Badge variant="outline" className="text-[10px] ms-auto">{eventFeed.length} {isAr ? "حدث" : "events"}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {eventFeed.length > 0 ? (
                <div className="space-y-1 max-h-[500px] overflow-y-auto">
                  {eventFeed.map((ev, i) => (
                    <div key={i} className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-muted/50 transition-colors text-xs group">
                      <span className="text-muted-foreground w-14 shrink-0 text-[10px]">
                        {format(parseISO(ev.time), "HH:mm:ss")}
                      </span>
                      {deviceIcon(ev.device)}
                      <Badge variant={ev.type === "page_view" ? "secondary" : ev.type === "ad_click" ? "destructive" : "outline"} className="text-[9px] px-1.5 py-0">
                        {ev.type}
                      </Badge>
                      <span className="text-muted-foreground truncate max-w-[400px] font-mono text-[10px]">{ev.label}</span>
                    </div>
                  ))}
                </div>
              ) : <p className="py-12 text-center text-muted-foreground text-sm">{getNoDataText(isAr)}</p>}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
});
