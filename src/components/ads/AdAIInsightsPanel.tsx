import { useState, memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, TrendingUp, Target, DollarSign, Clock, RefreshCw, Users, Repeat } from "lucide-react";

export const AdAIInsightsPanel = memo(function AdAIInsightsPanel() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [refreshKey, setRefreshKey] = useState(0);

  const { data: insights, isLoading, isError } = useQuery({
    queryKey: ["ai-ad-insights", refreshKey],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("ai-ad-insights");
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}><CardContent className="p-6"><Skeleton className="h-[120px]" /></CardContent></Card>
        ))}
      </div>
    );
  }

  if (isError || !insights) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          {isAr ? "تعذر تحميل الرؤى الذكية" : "Failed to load AI insights"}
          <Button variant="outline" size="sm" className="ms-2" onClick={() => setRefreshKey(k => k + 1)}>
            <RefreshCw className="h-3.5 w-3.5 me-1" />{isAr ? "إعادة المحاولة" : "Retry"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const sections = [
    {
      icon: TrendingUp,
      title: isAr ? "ملخص الأداء" : "Performance Summary",
      content: insights.summary,
      color: "text-primary",
    },
    {
      icon: Sparkles,
      title: isAr ? "توصيات التحسين" : "Optimization Recommendations",
      content: insights.recommendations,
      isList: true,
      color: "text-chart-1",
    },
    {
      icon: Target,
      title: isAr ? "اقتراحات الاستهداف" : "Targeting Suggestions",
      content: insights.targeting,
      isList: true,
      color: "text-chart-2",
    },
    {
      icon: DollarSign,
      title: isAr ? "نصائح الميزانية" : "Budget Advice",
      content: insights.budget_advice,
      color: "text-chart-3",
    },
    {
      icon: Clock,
      title: isAr ? "أفضل أوقات النشر" : "Best Timing",
      content: insights.timing,
      color: "text-chart-4",
    },
    {
      icon: Repeat,
      title: isAr ? "فرص إعادة الاستهداف" : "Retargeting Opportunities",
      content: insights.retargeting,
      color: "text-chart-5",
    },
  ];

  const rawStats = insights.raw_stats;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">{isAr ? "رؤى الذكاء الاصطناعي" : "AI-Powered Insights"}</h2>
        </div>
        <Button variant="outline" size="sm" onClick={() => setRefreshKey(k => k + 1)}>
          <RefreshCw className="h-3.5 w-3.5 me-1" />{isAr ? "تحديث" : "Refresh"}
        </Button>
      </div>

      {/* Raw stats summary */}
      {rawStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: isAr ? "المشاهدات" : "Impressions", value: rawStats.totalImpressions?.toLocaleString() },
            { label: isAr ? "النقرات" : "Clicks", value: rawStats.totalClicks?.toLocaleString() },
            { label: "CTR", value: `${rawStats.overallCTR}%` },
            { label: isAr ? "الإنفاق" : "Spent", value: `SAR ${rawStats.totalSpent?.toLocaleString()}` },
          ].map(s => (
            <div key={s.label} className="p-3 rounded-xl bg-muted/50 text-center">
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
              <p className="text-lg font-bold">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {sections.map((section) => (
          <Card key={section.title}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <section.icon className={`h-4 w-4 ${section.color}`} />
                {section.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {section.isList && Array.isArray(section.content) ? (
                <ul className="space-y-2">
                  {section.content.map((item: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Badge variant="outline" className="shrink-0 h-5 w-5 p-0 items-center justify-center text-[10px]">{i + 1}</Badge>
                      <span className="text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">{section.content || (isAr ? "لا توجد بيانات" : "No data")}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
