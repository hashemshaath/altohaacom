import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, PieChart, Pie, Cell } from "recharts";
import { FileText, Eye, TrendingUp, Star, Calendar } from "lucide-react";
import { format, subDays } from "date-fns";
import { cn } from "@/lib/utils";
import { AnimatedCounter } from "@/components/ui/animated-counter";

export function ContentAnalyticsWidget() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data: analytics } = useQuery({
    queryKey: ["content-analytics"],
    queryFn: async () => {
      const [articlesRes, scheduledRes] = await Promise.all([
        supabase.from("articles").select("id, status, type, view_count, is_featured, created_at, published_at"),
        supabase.from("articles").select("id, title, title_ar, published_at, status")
          .eq("status", "draft")
          .not("published_at", "is", null)
          .gt("published_at", new Date().toISOString())
          .order("published_at", { ascending: true })
          .limit(5),
      ]);

      const articles = articlesRes.data || [];
      const scheduled = scheduledRes.data || [];

      // Type distribution
      const typeMap: Record<string, number> = {};
      articles.forEach(a => {
        typeMap[a.type] = (typeMap[a.type] || 0) + 1;
      });
      const typeDistribution = Object.entries(typeMap).map(([name, value]) => ({ name, value }));

      // Daily publishing (last 14 days)
      const dailyPublishing: { day: string; count: number }[] = [];
      for (let i = 13; i >= 0; i--) {
        const d = subDays(new Date(), i);
        const dayStr = format(d, "MM/dd");
        const start = new Date(d); start.setHours(0, 0, 0, 0);
        const end = new Date(d); end.setHours(23, 59, 59, 999);
        const count = articles.filter(a =>
          a.published_at && a.published_at >= start.toISOString() && a.published_at <= end.toISOString()
        ).length;
        dailyPublishing.push({ day: dayStr, count });
      }

      // Stats
      const totalViews = articles.reduce((sum, a) => sum + (a.view_count || 0), 0);
      const published = articles.filter(a => a.status === "published").length;
      const drafts = articles.filter(a => a.status === "draft").length;
      const featured = articles.filter(a => a.is_featured).length;
      const avgViews = published > 0 ? Math.round(totalViews / published) : 0;

      // Top performing (by views)
      const topArticles = [...articles]
        .filter(a => a.status === "published")
        .sort((a, b) => (b.view_count || 0) - (a.view_count || 0))
        .slice(0, 5);

      return {
        totalViews, published, drafts, featured, avgViews,
        typeDistribution, dailyPublishing, scheduled,
        topArticles, total: articles.length,
      };
    },
    staleTime: 1000 * 60 * 3,
  });

  const COLORS = [
    "hsl(var(--primary))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
  ];

  if (!analytics) return null;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Publishing Activity Chart */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            {isAr ? "نشاط النشر (14 يوم)" : "Publishing Activity (14d)"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-3 mb-4">
            {[
              { label: isAr ? "إجمالي" : "Total", value: analytics.total, color: "text-foreground" },
              { label: isAr ? "منشور" : "Published", value: analytics.published, color: "text-primary" },
              { label: isAr ? "مسودة" : "Drafts", value: analytics.drafts, color: "text-chart-4" },
              { label: isAr ? "متوسط المشاهدات" : "Avg Views", value: analytics.avgViews, color: "text-chart-2" },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <AnimatedCounter value={s.value} className={cn("text-lg font-bold", s.color)} />
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={analytics.dailyPublishing}>
              <XAxis dataKey="day" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Content Distribution + Scheduled */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Calendar className="h-4 w-4 text-chart-3" />
            {isAr ? "التوزيع والمجدول" : "Distribution & Scheduled"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-center mb-4">
            <ResponsiveContainer width={100} height={100}>
              <PieChart>
                <Pie data={analytics.typeDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={25} outerRadius={45} paddingAngle={3}>
                  {analytics.typeDistribution.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-1.5">
              {analytics.typeDistribution.map((item, i) => (
                <div key={item.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="capitalize">{item.name}</span>
                  </div>
                  <span className="font-medium">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {analytics.scheduled.length > 0 && (
            <div className="border-t pt-3">
              <p className="text-xs font-medium mb-2 flex items-center gap-1.5">
                <Calendar className="h-3 w-3" />
                {isAr ? "مقالات مجدولة" : "Scheduled Articles"}
              </p>
              <div className="space-y-1.5">
                {analytics.scheduled.map((a: any) => (
                  <div key={a.id} className="flex items-center justify-between rounded-xl border border-border/40 px-2.5 py-1.5">
                    <span className="text-xs truncate max-w-[180px]">
                      {isAr ? a.title_ar || a.title : a.title}
                    </span>
                    <Badge variant="outline" className="text-[9px]">
                      {format(new Date(a.published_at), "MMM d, HH:mm")}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
