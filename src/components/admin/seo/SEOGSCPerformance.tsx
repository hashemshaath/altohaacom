import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer,
  CartesianGrid, Cell, PieChart, Pie, Legend,
} from "recharts";
import {
  Search, TrendingUp, Eye, MousePointerClick, ArrowUp, ArrowDown, Minus,
  RefreshCw, BarChart3,
} from "lucide-react";
import { format, subDays } from "date-fns";
import { toast } from "sonner";

const CHART_COLORS = [
  "hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))",
  "hsl(var(--chart-4))", "hsl(var(--chart-5))",
];

const POSITION_BUCKETS = [
  { label: "Top 3", min: 0, max: 3, color: "hsl(var(--chart-2))" },
  { label: "4–10", min: 4, max: 10, color: "hsl(var(--chart-1))" },
  { label: "11–20", min: 11, max: 20, color: "hsl(var(--chart-4))" },
  { label: "20+", min: 21, max: Infinity, color: "hsl(var(--chart-5))" },
];

interface Props {
  isAr: boolean;
}

export function SEOGSCPerformance({ isAr }: Props) {
  const [syncing, setSyncing] = useState(false);
  const GSC_SITE_URL = "https://altoha.lovable.app";

  // Fetch tracked keywords for position distribution
  const { data: keywords, refetch: refetchKw } = useQuery({
    queryKey: ["seo-gsc-keywords"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("seo_tracked_keywords")
        .select("*")
        .eq("is_active", true)
        .order("current_position", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch keyword history for trend
  const { data: history } = useQuery({
    queryKey: ["seo-keyword-history-28d"],
    queryFn: async () => {
      const from = subDays(new Date(), 28).toISOString();
      const { data, error } = await supabase
        .from("seo_keyword_history")
        .select("keyword_id, position, recorded_at")
        .gte("recorded_at", from)
        .order("recorded_at", { ascending: true })
        .limit(1000);
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch page views for organic landing page analysis
  const { data: pageViews } = useQuery({
    queryKey: ["seo-gsc-page-views-28d"],
    queryFn: async () => {
      const from = subDays(new Date(), 28).toISOString();
      const { data, error } = await supabase
        .from("seo_page_views")
        .select("path, is_bounce, duration_seconds, session_id, created_at")
        .gte("created_at", from)
        .order("created_at", { ascending: false })
        .limit(1000);
      if (error) throw error;
      return data || [];
    },
  });

  // Previous period page views for comparison
  const { data: prevPageViews } = useQuery({
    queryKey: ["seo-gsc-page-views-prev-28d"],
    queryFn: async () => {
      const from = subDays(new Date(), 56).toISOString();
      const to = subDays(new Date(), 28).toISOString();
      const { data, error } = await supabase
        .from("seo_page_views")
        .select("path, is_bounce, session_id")
        .gte("created_at", from)
        .lte("created_at", to)
        .limit(1000);
      if (error) throw error;
      return data || [];
    },
  });

  // GSC sync
  const handleSync = async () => {
    setSyncing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");
      const end = format(new Date(), "yyyy-MM-dd");
      const start = format(subDays(new Date(), 28), "yyyy-MM-dd");
      const { data, error } = await supabase.functions.invoke("gsc-sync", {
        body: { action: "search_performance", siteUrl: GSC_SITE_URL, startDate: start, endDate: end },
      });
      if (error) throw error;
      toast.success(isAr ? `تم مزامنة ${data.total_queries} استعلام` : `Synced ${data.total_queries} queries`);
      refetchKw();
    } catch (e: unknown) {
      toast.error((e instanceof Error ? e.message : "") || "GSC sync failed");
    } finally {
      setSyncing(false);
    }
  };

  // Computed: KPIs with period comparison
  const currentViews = pageViews?.length || 0;
  const prevViews = prevPageViews?.length || 0;
  const currentSessions = new Set(pageViews?.map(v => v.session_id) || []).size;
  const prevSessions = new Set(prevPageViews?.map(v => v.session_id) || []).size;
  const currentBounces = pageViews?.filter(v => v.is_bounce)?.length || 0;
  const prevBounces = prevPageViews?.filter(v => v.is_bounce)?.length || 0;
  const currentBounceRate = currentViews > 0 ? Math.round((currentBounces / currentViews) * 100) : 0;
  const prevBounceRate = prevViews > 0 ? Math.round((prevBounces / prevViews) * 100) : 0;

  // Keywords with position
  const kwWithPos = keywords?.filter(k => k.current_position != null) || [];
  const avgPosition = kwWithPos.length > 0
    ? Math.round((kwWithPos.reduce((s, k) => s + (k.current_position || 0), 0) / kwWithPos.length) * 10) / 10
    : null;

  // Position distribution
  const positionDist = POSITION_BUCKETS.map(b => ({
    name: b.label,
    value: kwWithPos.filter(k => (k.current_position || 999) >= b.min && (k.current_position || 999) <= b.max).length,
    color: b.color,
  })).filter(b => b.value > 0);

  // Top keywords by position (best ranked)
  const topKeywords = kwWithPos.slice(0, 10);

  // Per-landing-page bounce rate
  const pageStats: Record<string, { views: number; bounces: number; totalDuration: number }> = {};
  pageViews?.forEach(v => {
    if (!pageStats[v.path]) pageStats[v.path] = { views: 0, bounces: 0, totalDuration: 0 };
    pageStats[v.path].views++;
    if (v.is_bounce) pageStats[v.path].bounces++;
    pageStats[v.path].totalDuration += (v.duration_seconds || 0);
  });
  const landingPageData = Object.entries(pageStats)
    .map(([path, s]) => ({
      path,
      views: s.views,
      bounceRate: s.views > 0 ? Math.round((s.bounces / s.views) * 100) : 0,
      avgDuration: s.views > 0 ? Math.round(s.totalDuration / s.views) : 0,
    }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 15);

  function ChangeIndicator({ current, previous, invert = false }: { current: number; previous: number; invert?: boolean }) {
    const diff = current - previous;
    const pctChange = previous > 0 ? Math.round(((current - previous) / previous) * 100) : current > 0 ? 100 : 0;
    const isPositive = invert ? diff < 0 : diff > 0;
    const isNegative = invert ? diff > 0 : diff < 0;

    if (diff === 0) return <span className="text-muted-foreground inline-flex items-center gap-0.5 text-[12px]"><Minus className="h-2.5 w-2.5" /> 0%</span>;
    return (
      <span className={`inline-flex items-center gap-0.5 text-[12px] font-medium ${isPositive ? "text-chart-2" : isNegative ? "text-destructive" : "text-muted-foreground"}`}>
        {isPositive ? <ArrowUp className="h-2.5 w-2.5" /> : <ArrowDown className="h-2.5 w-2.5" />}
        {Math.abs(pctChange)}%
      </span>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="text-base font-semibold flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            {isAr ? "أداء البحث (GSC)" : "Search Performance (GSC)"}
          </h3>
          <p className="text-xs text-muted-foreground">
            {isAr ? "آخر 28 يوم مقارنة بالفترة السابقة" : "Last 28 days vs previous 28 days"}
          </p>
        </div>
        <Button onClick={handleSync} disabled={syncing} size="sm" variant="outline" className="gap-1.5">
          <RefreshCw className={`h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`} />
          {syncing ? (isAr ? "جارٍ المزامنة..." : "Syncing...") : (isAr ? "مزامنة من GSC" : "Sync from GSC")}
        </Button>
      </div>

      {/* ROW 1: Overview KPIs with comparison */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            icon: Eye, label: isAr ? "مشاهدات الصفحة" : "Page Views",
            value: currentViews, prev: prevViews,
          },
          {
            icon: MousePointerClick, label: isAr ? "جلسات فريدة" : "Unique Sessions",
            value: currentSessions, prev: prevSessions,
          },
          {
            icon: TrendingUp, label: isAr ? "معدل الارتداد" : "Bounce Rate",
            value: currentBounceRate, prev: prevBounceRate, suffix: "%", invert: true,
          },
          {
            icon: Search, label: isAr ? "متوسط الترتيب" : "Avg Position",
            value: avgPosition ?? 0, prev: 0, suffix: avgPosition != null ? "" : undefined,
            noCompare: avgPosition == null,
          },
        ].map((kpi, i) => (
          <Card key={i} className="border-border/40 hover:border-primary/20 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1.5">
                <kpi.icon className="h-3.5 w-3.5" /> {kpi.label}
              </div>
              <div className="flex items-end gap-2">
                <p className="text-2xl font-bold tabular-nums">
                  {kpi.suffix === "%" ? <AnimatedCounter value={kpi.value} /> : kpi.value === 0 && kpi.noCompare ? "—" : <AnimatedCounter value={kpi.value} />}
                  {kpi.suffix && <span className="text-sm font-normal text-muted-foreground ms-0.5">{kpi.suffix}</span>}
                </p>
                {!kpi.noCompare && <ChangeIndicator current={kpi.value} previous={kpi.prev} invert={kpi.invert} />}
              </div>
              <p className="text-[12px] text-muted-foreground mt-0.5">{isAr ? "آخر 28 يوم" : "Last 28 days"}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ROW 2: Top Keywords + Position Distribution */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Top Keywords by Position */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{isAr ? "أفضل الكلمات المفتاحية (حسب الترتيب)" : "Top Keywords (by Position)"}</CardTitle>
          </CardHeader>
          <CardContent>
            {topKeywords.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                {isAr ? "لا كلمات مفتاحية مرتبة بعد — قم بمزامنة GSC" : "No ranked keywords yet — sync from GSC"}
              </p>
            ) : (
              <div className="space-y-1.5">
                {topKeywords.map((kw, i) => {
                  const change = kw.previous_position && kw.current_position
                    ? kw.previous_position - kw.current_position : null;
                  return (
                    <div key={kw.id} className="flex items-center gap-2 py-1.5 border-b border-border/20 last:border-0">
                      <span className="text-xs text-muted-foreground font-mono w-5 tabular-nums">{i + 1}</span>
                      <span className="text-sm flex-1 truncate font-medium">{kw.keyword}</span>
                      <span className="text-sm font-bold tabular-nums">#{kw.current_position}</span>
                      {change != null && (
                        <span className={`inline-flex items-center gap-0.5 text-[12px] font-medium ${change > 0 ? "text-chart-2" : change < 0 ? "text-destructive" : "text-muted-foreground"}`}>
                          {change > 0 ? <ArrowUp className="h-2.5 w-2.5" /> : change < 0 ? <ArrowDown className="h-2.5 w-2.5" /> : <Minus className="h-2.5 w-2.5" />}
                          {Math.abs(change)}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Position Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{isAr ? "توزيع الترتيب" : "Position Distribution"}</CardTitle>
          </CardHeader>
          <CardContent>
            {positionDist.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                {isAr ? "لا بيانات ترتيب متاحة" : "No position data available"}
              </p>
            ) : (
              <div className="space-y-4">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={positionDist} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3}>
                      {positionDist.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <RechartsTooltip contentStyle={{ fontSize: 11, borderRadius: 8, backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-2">
                  {POSITION_BUCKETS.map(b => {
                    const count = kwWithPos.filter(k => (k.current_position || 999) >= b.min && (k.current_position || 999) <= b.max).length;
                    return (
                      <div key={b.label} className="flex items-center gap-2 text-xs">
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: b.color }} />
                        <span className="text-muted-foreground">{b.label}</span>
                        <span className="font-bold tabular-nums ms-auto">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ROW 3: Landing Page Performance */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            {isAr ? "أداء صفحات الهبوط" : "Landing Page Performance"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {landingPageData.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              {isAr ? "لا بيانات زيارات بعد" : "No page view data yet"}
            </p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/40 text-xs text-muted-foreground">
                      <th className="text-start py-2 pe-3 font-medium">{isAr ? "الصفحة" : "Page"}</th>
                      <th className="text-end py-2 px-2 font-medium">{isAr ? "مشاهدات" : "Views"}</th>
                      <th className="text-end py-2 px-2 font-medium">{isAr ? "ارتداد" : "Bounce %"}</th>
                      <th className="text-end py-2 ps-2 font-medium">{isAr ? "متوسط المدة" : "Avg Time"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {landingPageData.map(page => (
                      <tr key={page.path} className="border-b border-border/20 last:border-0">
                        <td className="py-2 pe-3 font-mono text-xs truncate max-w-[220px]">{page.path}</td>
                        <td className="py-2 px-2 text-end font-bold tabular-nums">{page.views}</td>
                        <td className="py-2 px-2 text-end tabular-nums">
                          <Badge
                            variant={page.bounceRate > 60 ? "destructive" : page.bounceRate > 40 ? "secondary" : "default"}
                            className="text-[12px]"
                          >
                            {page.bounceRate}%
                          </Badge>
                        </td>
                        <td className="py-2 ps-2 text-end text-xs text-muted-foreground tabular-nums">{page.avgDuration}s</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Bounce rate bar chart */}
              <div className="mt-4">
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={landingPageData.slice(0, 10)} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                    <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis
                      type="category"
                      dataKey="path"
                      width={120}
                      tick={{ fontSize: 9 }}
                      stroke="hsl(var(--muted-foreground))"
                      tickFormatter={(v: string) => v.length > 18 ? v.slice(0, 18) + "…" : v}
                    />
                    <RechartsTooltip
                      contentStyle={{ fontSize: 11, borderRadius: 8, backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
                      formatter={(value: number) => [`${value}%`, isAr ? "معدل الارتداد" : "Bounce Rate"]}
                    />
                    <Bar dataKey="bounceRate" radius={[0, 4, 4, 0]}>
                      {landingPageData.slice(0, 10).map((entry, i) => (
                        <Cell
                          key={i}
                          fill={entry.bounceRate > 60 ? "hsl(var(--destructive))" : entry.bounceRate > 40 ? "hsl(var(--chart-4))" : "hsl(var(--chart-2))"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
