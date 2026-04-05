import { memo, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Eye, BarChart3 } from "lucide-react";
import { format, startOfWeek, addDays, isToday, parseISO } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { cn } from "@/lib/utils";

export const EditorialCalendarWidget = memo(function EditorialCalendarWidget() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data: articles = [] } = useQuery({
    queryKey: ["editorial-calendar"],
    queryFn: async () => {
      const now = new Date();
      const weekStart = startOfWeek(now, { weekStartsOn: 0 });
      const weekEnd = addDays(weekStart, 13); // 2 weeks

      const { data } = await supabase
        .from("articles")
        .select("id, title, title_ar, status, type, published_at, created_at")
        .or(`published_at.gte.${weekStart.toISOString()},published_at.lte.${weekEnd.toISOString()},status.eq.draft`)
        .order("published_at", { ascending: true })
        .limit(50);
      return data || [];
    },
    staleTime: 1000 * 60 * 5,
  });

  // Build 7-day calendar
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 0 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  interface ArticleRow { id: string; title: string; title_ar: string | null; status: string | null; type: string; published_at: string | null; created_at: string }

  const articlesByDay = useMemo(() => {
    const map = new Map<string, ArticleRow[]>();
    articles.forEach((a) => {
      if (a.published_at) {
        const key = format(parseISO(a.published_at), "yyyy-MM-dd");
        const list = map.get(key) || [];
        list.push(a as ArticleRow);
        map.set(key, list);
      }
    });
    return map;
  }, [articles]);

  const drafts = articles.filter((a) => a.status === "draft");
  const scheduled = articles.filter((a) => a.status === "published" && a.published_at && new Date(a.published_at) > new Date());

  const statusColor: Record<string, string> = {
    draft: "bg-chart-4/20 border-chart-4/30 text-chart-4",
    published: "bg-chart-2/20 border-chart-2/30 text-chart-2",
    archived: "bg-muted text-muted-foreground",
  };

  return (
    <Card className="rounded-2xl border-border/40">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" />
          {isAr ? "التقويم التحريري" : "Editorial Calendar"}
          <div className="ms-auto flex gap-1.5">
            <Badge variant="outline" className="text-[9px] gap-1 px-1.5">
              <Clock className="h-2 w-2" /> {drafts.length} {isAr ? "مسودة" : "drafts"}
            </Badge>
            {scheduled.length > 0 && (
              <Badge variant="outline" className="text-[9px] gap-1 px-1.5 text-chart-4 border-chart-4/30">
                <Calendar className="h-2 w-2" /> {scheduled.length} {isAr ? "مجدول" : "scheduled"}
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => {
            const key = format(day, "yyyy-MM-dd");
            const dayArticles = articlesByDay.get(key) || [];
            const today = isToday(day);
            return (
              <div
                key={key}
                className={cn(
                  "rounded-xl border p-2 min-h-[80px] text-center transition-colors",
                  today ? "border-primary/40 bg-primary/5" : "border-border/30 bg-card"
                )}
              >
                <p className={cn("text-[10px] font-medium mb-1", today ? "text-primary" : "text-muted-foreground")}>
                  {format(day, "EEE", { locale: isAr ? ar : enUS })}
                </p>
                <p className={cn("text-sm font-bold mb-1.5", today && "text-primary")}>
                  {format(day, "d")}
                </p>
                <div className="space-y-0.5">
                  {dayArticles.slice(0, 2).map((a) => (
                    <div
                      key={a.id}
                      className={cn("rounded px-1 py-0.5 text-[8px] font-medium truncate border", statusColor[a.status] || statusColor.draft)}
                      title={isAr ? a.title_ar || a.title : a.title}
                    >
                      {(isAr ? a.title_ar || a.title : a.title).slice(0, 12)}
                    </div>
                  ))}
                  {dayArticles.length > 2 && (
                    <p className="text-[8px] text-muted-foreground">+{dayArticles.length - 2}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
});

export const ArticlePerformanceWidget = memo(function ArticlePerformanceWidget() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data: topArticles = [] } = useQuery({
    queryKey: ["top-performing-articles"],
    queryFn: async () => {
      const { data } = await supabase
        .from("articles")
        .select("id, title, title_ar, slug, view_count, type, published_at, status")
        .eq("status", "published")
        .order("view_count", { ascending: false })
        .limit(5);
      return data || [];
    },
    staleTime: 1000 * 60 * 5,
  });

  if (topArticles.length === 0) return null;

  const maxViews = Math.max(...topArticles.map((a) => a.view_count || 1));

  return (
    <Card className="rounded-2xl border-border/40">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" />
          {isAr ? "أعلى المقالات أداءً" : "Top Performing Articles"}
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-4 space-y-3">
        {topArticles.map((article, i) => {
          const title = isAr ? article.title_ar || article.title : article.title;
          const pct = ((article.view_count || 0) / maxViews) * 100;
          return (
            <div key={article.id} className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-muted-foreground w-4">{i + 1}</span>
                <p className="text-xs font-medium truncate flex-1">{title}</p>
                <span className="text-xs font-mono text-muted-foreground flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  {(article.view_count || 0).toLocaleString()}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-muted/50 overflow-hidden ms-6">
                <div
                  className="h-full rounded-full bg-primary/60 transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
});
