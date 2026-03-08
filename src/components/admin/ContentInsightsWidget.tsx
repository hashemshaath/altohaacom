import { memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useVisibleRefetchInterval } from "@/hooks/useVisibleRefetchInterval";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { FileText, Eye, TrendingUp, Calendar, Star } from "lucide-react";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { format, subDays } from "date-fns";

const COLORS = ["hsl(var(--primary))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

export const ContentInsightsWidget = memo(function ContentInsightsWidget() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data, isLoading } = useQuery({
    queryKey: ["admin-content-insights"],
    queryFn: async () => {
      const { data: articles } = await supabase
        .from("articles")
        .select("id, title, type, status, view_count, is_featured, published_at, created_at")
        .order("created_at", { ascending: false });

      if (!articles) return null;

      const published = articles.filter(a => a.status === "published");
      const drafts = articles.filter(a => a.status === "draft");
      const totalViews = articles.reduce((s, a) => s + (a.view_count || 0), 0);

      // Top articles by views
      const topArticles = [...published]
        .sort((a, b) => (b.view_count || 0) - (a.view_count || 0))
        .slice(0, 5);

      // Type distribution
      const typeMap: Record<string, number> = {};
      articles.forEach(a => { typeMap[a.type] = (typeMap[a.type] || 0) + 1; });
      const typeDistribution = Object.entries(typeMap).map(([name, value]) => ({ name, value }));

      // Weekly publishing trend (last 4 weeks)
      const now = new Date();
      const weeklyData = [];
      for (let i = 3; i >= 0; i--) {
        const weekStart = subDays(now, (i + 1) * 7);
        const weekEnd = subDays(now, i * 7);
        const count = articles.filter(a => {
          const d = new Date(a.created_at);
          return d >= weekStart && d < weekEnd;
        }).length;
        weeklyData.push({ week: `W${4 - i}`, count });
      }

      // Scheduled (future published_at)
      const scheduled = articles.filter(a => a.published_at && new Date(a.published_at) > now).length;

      return {
        total: articles.length,
        published: published.length,
        drafts: drafts.length,
        totalViews,
        featured: articles.filter(a => a.is_featured).length,
        scheduled,
        topArticles,
        typeDistribution,
        weeklyData,
      };
    },
    refetchInterval: useVisibleRefetchInterval(60000),
  });

  if (isLoading) return <Skeleton className="h-52 w-full rounded-xl" />;
  if (!data) return null;

  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
      {/* KPI row */}
      <div className="md:col-span-3 grid grid-cols-3 sm:grid-cols-6 gap-2">
        {[
          { icon: FileText, label: isAr ? "الكل" : "Total", value: data.total, color: "text-primary", bg: "bg-primary/10" },
          { icon: TrendingUp, label: isAr ? "منشور" : "Published", value: data.published, color: "text-chart-5", bg: "bg-chart-5/10" },
          { icon: FileText, label: isAr ? "مسودة" : "Drafts", value: data.drafts, color: "text-chart-4", bg: "bg-chart-4/10" },
          { icon: Eye, label: isAr ? "مشاهدات" : "Views", value: data.totalViews, color: "text-chart-3", bg: "bg-chart-3/10" },
          { icon: Star, label: isAr ? "مميز" : "Featured", value: data.featured, color: "text-primary", bg: "bg-primary/10" },
          { icon: Calendar, label: isAr ? "مجدول" : "Scheduled", value: data.scheduled, color: "text-chart-4", bg: "bg-chart-4/10" },
        ].map(kpi => (
          <Card key={kpi.label}>
            <CardContent className="flex items-center gap-2 p-2">
              <div className={`rounded-full p-1.5 ${kpi.bg}`}><kpi.icon className={`h-3 w-3 ${kpi.color}`} /></div>
              <div>
                <p className="text-[9px] text-muted-foreground">{kpi.label}</p>
                <AnimatedCounter value={typeof kpi.value === "number" ? kpi.value : parseInt(String(kpi.value).replace(/,/g, "")) || 0} className="text-sm font-bold" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Weekly Publishing */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs">{isAr ? "النشر الأسبوعي" : "Weekly Publishing"}</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={data.weeklyData}>
              <XAxis dataKey="week" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} width={20} />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
              <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Type Distribution */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs">{isAr ? "أنواع المحتوى" : "Content Types"}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center">
          <PieChart width={100} height={100}>
            <Pie data={data.typeDistribution} dataKey="value" cx={48} cy={48} innerRadius={24} outerRadius={44} strokeWidth={0}>
              {data.typeDistribution.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip contentStyle={{ fontSize: 10 }} />
          </PieChart>
          <div className="ms-3 space-y-1">
            {data.typeDistribution.map((t, i) => (
              <div key={t.name} className="flex items-center gap-1.5 text-[10px]">
                <span className="h-2 w-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                <span className="capitalize">{t.name}</span>
                <Badge variant="outline" className="text-[9px] h-4 ms-auto">{t.value}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Articles */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs flex items-center gap-1.5">
            <Eye className="h-3.5 w-3.5 text-chart-3" />
            {isAr ? "الأعلى مشاهدة" : "Top Viewed"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5">
          {data.topArticles.map((a, i) => (
            <div key={a.id} className="flex items-center gap-2 text-[10px]">
              <span className="font-bold text-muted-foreground w-4">{i + 1}</span>
              <span className="truncate flex-1">{a.title}</span>
              <Badge variant="outline" className="text-[9px] h-4 shrink-0"><AnimatedCounter value={a.view_count || 0} /></Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
});
