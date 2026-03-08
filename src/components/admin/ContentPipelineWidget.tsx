import { memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { FileText, Clock, CheckCircle2, Archive, Eye, TrendingUp } from "lucide-react";
import { format, subDays } from "date-fns";
import { AnimatedCounter } from "@/components/ui/animated-counter";

export const ContentPipelineWidget = memo(function ContentPipelineWidget() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data, isLoading } = useQuery({
    queryKey: ["admin-content-pipeline"],
    queryFn: async () => {
      const [articlesRes, recentRes] = await Promise.all([
        supabase.from("articles").select("status, type, view_count, created_at, published_at"),
        supabase.from("articles").select("created_at, status").gte("created_at", subDays(new Date(), 30).toISOString()),
      ]);

      const articles = articlesRes.data || [];
      const recent = recentRes.data || [];

      // Status funnel
      const drafts = articles.filter(a => a.status === "draft").length;
      const published = articles.filter(a => a.status === "published").length;
      const archived = articles.filter(a => a.status === "archived").length;
      const total = articles.length;

      // Type breakdown
      const typeCount: Record<string, number> = {};
      articles.forEach(a => { typeCount[a.type] = (typeCount[a.type] || 0) + 1; });

      // Publishing velocity (last 14 days)
      const velocityMap: Record<string, number> = {};
      for (let i = 13; i >= 0; i--) {
        velocityMap[format(subDays(new Date(), i), "MM/dd")] = 0;
      }
      recent.filter(a => a.status === "published").forEach(a => {
        const d = format(new Date(a.created_at), "MM/dd");
        if (velocityMap[d] !== undefined) velocityMap[d]++;
      });
      const velocityData = Object.entries(velocityMap).map(([day, count]) => ({ day, count }));

      // Total views
      const totalViews = articles.reduce((s, a) => s + (a.view_count || 0), 0);

      // Avg views per published article
      const avgViews = published > 0 ? Math.round(totalViews / published) : 0;

      return { drafts, published, archived, total, typeCount, velocityData, totalViews, avgViews };
    },
    staleTime: 1000 * 60 * 3,
  });

  if (isLoading) return <Skeleton className="h-48 w-full rounded-xl" />;
  if (!data) return null;

  const funnelSteps = [
    { label: isAr ? "مسودات" : "Drafts", value: data.drafts, icon: Clock, color: "text-chart-4", pct: data.total > 0 ? Math.round((data.drafts / data.total) * 100) : 0 },
    { label: isAr ? "منشورة" : "Published", value: data.published, icon: CheckCircle2, color: "text-chart-2", pct: data.total > 0 ? Math.round((data.published / data.total) * 100) : 0 },
    { label: isAr ? "مؤرشفة" : "Archived", value: data.archived, icon: Archive, color: "text-muted-foreground", pct: data.total > 0 ? Math.round((data.archived / data.total) * 100) : 0 },
  ];

  return (
    <div className="grid gap-3 grid-cols-1 lg:grid-cols-3">
      {/* Content Funnel */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <FileText className="h-4 w-4 text-chart-5" />
            {isAr ? "مسار المحتوى" : "Content Pipeline"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {funnelSteps.map((step) => (
            <div key={step.label} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5">
                  <step.icon className={`h-3 w-3 ${step.color}`} />
                  {step.label}
                </span>
                <span className="font-semibold">{step.value} ({step.pct}%)</span>
              </div>
              <Progress value={step.pct} className="h-1.5" />
            </div>
          ))}
          <div className="flex items-center justify-between pt-2 border-t text-xs">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Eye className="h-3 w-3" />
              {isAr ? "متوسط المشاهدات" : "Avg Views"}
            </span>
            <AnimatedCounter value={data.avgViews} className="font-bold" />
          </div>

          {/* Type breakdown */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {Object.entries(data.typeCount).map(([type, count]) => (
              <Badge key={type} variant="outline" className="text-[9px]">
                {type}: {count}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Publishing Velocity */}
      <Card className="lg:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-chart-2" />
            {isAr ? "سرعة النشر (14 يوم)" : "Publishing Velocity (14 days)"}
            <Badge variant="secondary" className="text-[10px] ms-auto">
              <AnimatedCounter value={data.totalViews} className="inline" /> {isAr ? "مشاهدة إجمالية" : "total views"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-2">
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={data.velocityData}>
              <XAxis dataKey="day" tick={{ fontSize: 9 }} interval={1} />
              <YAxis tick={{ fontSize: 9 }} width={20} allowDecimals={false} />
              <Tooltip contentStyle={{ fontSize: 11 }} />
              <Bar dataKey="count" fill="hsl(var(--chart-5))" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
