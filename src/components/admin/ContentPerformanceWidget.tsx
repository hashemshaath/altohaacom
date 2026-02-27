import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { FileText, Eye, Star, TrendingUp, BookOpen, Landmark, GraduationCap } from "lucide-react";

export function ContentPerformanceWidget() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data } = useQuery({
    queryKey: ["content-performance-widget"],
    queryFn: async () => {
      const [
        { data: articles },
        { count: totalExhibitions },
        { count: activeExhibitions },
        { count: totalMasterclasses },
        { count: totalKnowledge },
      ] = await Promise.all([
        supabase.from("articles").select("status, view_count, type, is_featured").limit(500),
        supabase.from("exhibitions").select("*", { count: "exact", head: true }),
        supabase.from("exhibitions").select("*", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("masterclasses").select("*", { count: "exact", head: true }),
        supabase.from("knowledge_articles").select("*", { count: "exact", head: true }),
      ]);

      const totalArticles = articles?.length || 0;
      const publishedArticles = articles?.filter(a => a.status === "published").length || 0;
      const draftArticles = articles?.filter(a => a.status === "draft").length || 0;
      const totalViews = articles?.reduce((sum, a) => sum + (a.view_count || 0), 0) || 0;
      const featuredCount = articles?.filter(a => a.is_featured).length || 0;

      // Type distribution
      const typeCounts: Record<string, number> = {};
      articles?.forEach(a => { typeCounts[a.type] = (typeCounts[a.type] || 0) + 1; });

      // Top viewed articles
      const topViewed = articles
        ?.filter(a => a.view_count && a.view_count > 0)
        .sort((a, b) => (b.view_count || 0) - (a.view_count || 0))
        .slice(0, 3) || [];

      return {
        totalArticles, publishedArticles, draftArticles, totalViews, featuredCount,
        typeCounts,
        topViewedCount: topViewed.length,
        avgViews: totalArticles > 0 ? Math.round(totalViews / totalArticles) : 0,
        totalExhibitions: totalExhibitions || 0,
        activeExhibitions: activeExhibitions || 0,
        totalMasterclasses: totalMasterclasses || 0,
        totalKnowledge: totalKnowledge || 0,
        publishRate: totalArticles > 0 ? Math.round((publishedArticles / totalArticles) * 100) : 0,
      };
    },
    staleTime: 60000,
  });

  if (!data) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <FileText className="h-4 w-4 text-chart-5" />
          {isAr ? "أداء المحتوى" : "Content Performance"}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 space-y-3">
        {/* Content modules grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            { icon: FileText, label: isAr ? "المقالات" : "Articles", value: data.totalArticles, sub: `${data.publishedArticles} ${isAr ? "منشور" : "published"}`, color: "text-chart-5" },
            { icon: Landmark, label: isAr ? "المعارض" : "Exhibitions", value: data.totalExhibitions, sub: `${data.activeExhibitions} ${isAr ? "نشط" : "active"}`, color: "text-chart-3" },
            { icon: GraduationCap, label: isAr ? "الدورات" : "Courses", value: data.totalMasterclasses, sub: "", color: "text-chart-2" },
            { icon: BookOpen, label: isAr ? "قاعدة المعرفة" : "Knowledge", value: data.totalKnowledge, sub: "", color: "text-chart-1" },
          ].map((m, i) => (
            <div key={i} className="p-2 rounded-lg bg-muted/30 border border-border/40">
              <div className="flex items-center gap-1.5 mb-1">
                <m.icon className={`h-3 w-3 ${m.color}`} />
                <span className="text-[9px] text-muted-foreground">{m.label}</span>
              </div>
              <p className="text-base font-bold">{m.value}</p>
              {m.sub && <p className="text-[8px] text-muted-foreground">{m.sub}</p>}
            </div>
          ))}
        </div>

        {/* Engagement stats */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Eye className="h-3 w-3 text-chart-4" />
            <span className="text-xs font-semibold">{data.totalViews.toLocaleString()}</span>
            <span className="text-[9px] text-muted-foreground">{isAr ? "مشاهدة" : "views"}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <TrendingUp className="h-3 w-3 text-chart-2" />
            <span className="text-xs font-semibold">{data.avgViews}</span>
            <span className="text-[9px] text-muted-foreground">{isAr ? "متوسط" : "avg/article"}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Star className="h-3 w-3 text-chart-4" />
            <span className="text-xs font-semibold">{data.featuredCount}</span>
            <span className="text-[9px] text-muted-foreground">{isAr ? "مميز" : "featured"}</span>
          </div>
        </div>

        {/* Publish rate */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-muted-foreground">{isAr ? "معدل النشر" : "Publish Rate"}</span>
            <span className="text-[10px] font-medium">{data.publishRate}%</span>
          </div>
          <Progress value={data.publishRate} className="h-1.5" />
        </div>

        {/* Type badges */}
        <div className="flex flex-wrap gap-1">
          {Object.entries(data.typeCounts).map(([type, count]) => (
            <Badge key={type} variant="outline" className="text-[8px] gap-0.5">
              {type}: {count}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
