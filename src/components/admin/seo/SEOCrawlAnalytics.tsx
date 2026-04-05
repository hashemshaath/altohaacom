import { memo, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, TrendingUp, Clock, Globe, Search, Share2, Cpu, Sparkles } from "lucide-react";
import { format, subDays, startOfDay } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid } from "recharts";

const COLORS = [
  "hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))",
  "hsl(var(--chart-4))", "hsl(var(--chart-5))", "hsl(var(--primary))",
];

const TYPE_ICONS: Record<string, typeof Bot> = {
  search_engine: Search,
  social: Share2,
  seo_tool: TrendingUp,
  ai: Cpu,
  ads: Sparkles,
};

export const SEOCrawlAnalytics = memo(function SEOCrawlAnalytics({ isAr, range = 30 }: { isAr: boolean; range?: number }) {
  const fromDate = startOfDay(subDays(new Date(), range)).toISOString();

  const { data: visits, isLoading } = useQuery({
    queryKey: ["seo-crawl-analytics", range],
    queryFn: async () => {
      const { data } = await supabase
        .from("seo_crawler_visits")
        .select("crawler_name, crawler_type, path, device_type, created_at")
        .gte("created_at", fromDate)
        .order("created_at", { ascending: false })
        .limit(1000);
      return data || [];
    },
  });

  const stats = useMemo(() => {
    if (!visits?.length) return null;

    // By crawler name
    const byCrawler: Record<string, number> = {};
    visits.forEach((v) => { byCrawler[v.crawler_name] = (byCrawler[v.crawler_name] || 0) + 1; });
    const crawlerChart = Object.entries(byCrawler)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([name, value]) => ({ name, value }));

    // By type
    const byType: Record<string, number> = {};
    visits.forEach((v) => { byType[v.crawler_type || "unknown"] = (byType[v.crawler_type || "unknown"] || 0) + 1; });
    const typeChart = Object.entries(byType).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

    // By day
    const byDay: Record<string, number> = {};
    visits.forEach((v) => {
      const day = format(new Date(v.created_at), "MM/dd");
      byDay[day] = (byDay[day] || 0) + 1;
    });
    const trendChart = Object.entries(byDay)
      .map(([day, count]) => ({ day, count }))
      .sort((a, b) => a.day.localeCompare(b.day));

    // Top crawled pages
    const byPath: Record<string, number> = {};
    visits.forEach((v) => { byPath[v.path] = (byPath[v.path] || 0) + 1; });
    const topPages = Object.entries(byPath)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([path, count]) => ({ path, count }));

    // Crawl budget efficiency
    const uniquePaths = new Set(visits.map((v) => v.path)).size;
    const totalCrawls = visits.length;
    const efficiency = uniquePaths > 0 ? Math.round((uniquePaths / totalCrawls) * 100) : 0;

    return { crawlerChart, typeChart, trendChart, topPages, totalCrawls, uniquePaths, efficiency, byType };
  }, [visits]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground text-sm">
          <Bot className="h-10 w-10 mx-auto mb-3 opacity-30" />
          {isAr ? "لا توجد بيانات زحف بعد" : "No crawler data collected yet"}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Bot className="h-3.5 w-3.5" />
              {isAr ? "إجمالي الزيارات" : "Total Crawls"}
            </div>
            <p className="text-2xl font-bold">{stats.totalCrawls.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Globe className="h-3.5 w-3.5" />
              {isAr ? "صفحات فريدة" : "Unique Pages"}
            </div>
            <p className="text-2xl font-bold">{stats.uniquePaths}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Search className="h-3.5 w-3.5" />
              {isAr ? "زواحف فريدة" : "Unique Crawlers"}
            </div>
            <p className="text-2xl font-bold">{stats.crawlerChart.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <TrendingUp className="h-3.5 w-3.5" />
              {isAr ? "كفاءة الزحف" : "Crawl Efficiency"}
            </div>
            <p className="text-2xl font-bold">{stats.efficiency}%</p>
            <p className="text-[10px] text-muted-foreground">{isAr ? "صفحات فريدة / إجمالي" : "Unique pages / total"}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Crawl trend */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              {isAr ? "اتجاه الزحف اليومي" : "Daily Crawl Trend"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={stats.trendChart}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="day" fontSize={10} />
                <YAxis fontSize={10} />
                <RechartsTooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name={isAr ? "زيارات" : "Crawls"} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* By type pie */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Bot className="h-4 w-4 text-primary" />
              {isAr ? "حسب النوع" : "By Crawler Type"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="50%" height={180}>
                <PieChart>
                  <Pie data={stats.typeChart} dataKey="value" nameKey="name" innerRadius={40} outerRadius={70} paddingAngle={3}>
                    {stats.typeChart.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <RechartsTooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 flex-1">
                {stats.typeChart.map((t, i) => {
                  const Icon = TYPE_ICONS[t.name] || Bot;
                  return (
                    <div key={t.name} className="flex items-center gap-2 text-xs">
                      <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <Icon className="h-3 w-3 text-muted-foreground" />
                      <span className="capitalize flex-1">{t.name.replace(/_/g, " ")}</span>
                      <span className="font-semibold tabular-nums">{t.value}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Top crawlers */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{isAr ? "أكثر الزواحف نشاطاً" : "Most Active Crawlers"}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={stats.crawlerChart} layout="vertical">
                <XAxis type="number" fontSize={10} />
                <YAxis type="category" dataKey="name" fontSize={10} width={100} />
                <RechartsTooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} name={isAr ? "زيارات" : "Visits"} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top crawled pages */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{isAr ? "أكثر الصفحات زحفاً" : "Most Crawled Pages"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[260px] overflow-y-auto">
              {stats.topPages.map((p, i) => (
                <div key={p.path} className="flex items-center gap-3 py-1.5 border-b border-border/20 last:border-0">
                  <span className="text-xs font-bold text-muted-foreground w-5 text-center">{i + 1}</span>
                  <code className="text-xs flex-1 truncate text-foreground">{p.path}</code>
                  <Badge variant="secondary" className="text-[10px] tabular-nums">{p.count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
});
