import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { FileText, Eye, Star, TrendingUp, Clock, BarChart3 } from "lucide-react";
import { AnimatedCounter } from "@/components/ui/animated-counter";

export function ContentStatsWidget() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data: stats } = useQuery({
    queryKey: ["content-stats-widget"],
    queryFn: async () => {
      const [totalRes, publishedRes, draftRes, featuredRes, topArticles] = await Promise.all([
        supabase.from("articles").select("id", { count: "exact", head: true }),
        supabase.from("articles").select("id", { count: "exact", head: true }).eq("status", "published"),
        supabase.from("articles").select("id", { count: "exact", head: true }).eq("status", "draft"),
        supabase.from("articles").select("id", { count: "exact", head: true }).eq("is_featured", true),
        supabase.from("articles").select("id, title, title_ar, view_count, type, status").order("view_count", { ascending: false }).limit(5),
      ]);
      return {
        total: totalRes.count || 0,
        published: publishedRes.count || 0,
        drafts: draftRes.count || 0,
        featured: featuredRes.count || 0,
        topArticles: topArticles.data || [],
      };
    },
    staleTime: 3 * 60 * 1000,
  });

  if (!stats) return null;

  const publishRate = stats.total > 0 ? Math.round((stats.published / stats.total) * 100) : 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" />
          {isAr ? "إحصائيات المحتوى" : "Content Analytics"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-4 gap-2">
          {[
            { icon: FileText, value: stats.total, label: isAr ? "الكل" : "Total", color: "text-primary" },
            { icon: Eye, value: stats.published, label: isAr ? "منشور" : "Published", color: "text-chart-2" },
            { icon: Clock, value: stats.drafts, label: isAr ? "مسودة" : "Drafts", color: "text-chart-4" },
            { icon: Star, value: stats.featured, label: isAr ? "مميز" : "Featured", color: "text-chart-3" },
          ].map((s) => (
            <div key={s.label} className="text-center p-2 rounded-xl bg-muted/50">
              <s.icon className={`h-3.5 w-3.5 mx-auto ${s.color} mb-1`} />
              <p className="text-lg font-bold">{s.value}</p>
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{isAr ? "نسبة النشر" : "Publish Rate"}</span>
            <span className="font-medium">{publishRate}%</span>
          </div>
          <Progress value={publishRate} className="h-1.5" />
        </div>

        {stats.topArticles.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              {isAr ? "الأكثر مشاهدة" : "Most Viewed"}
            </p>
            {stats.topArticles.map((a: any) => (
              <div key={a.id} className="flex items-center justify-between text-xs py-1 border-b border-border/30 last:border-0">
                <span className="truncate flex-1 me-2">{isAr ? a.title_ar || a.title : a.title}</span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Badge variant="outline" className="text-[9px] px-1 py-0">{a.type}</Badge>
                  <span className="text-muted-foreground"><AnimatedCounter value={a.view_count || 0} /></span>
                  <Eye className="h-3 w-3 text-muted-foreground" />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
