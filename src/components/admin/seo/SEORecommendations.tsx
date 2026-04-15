import { useState, memo } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Sparkles, Loader2, Lightbulb, TrendingUp, AlertTriangle, CheckCircle2, Target, Zap } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface Props {
  isAr: boolean;
  seoData: {
    totalViews: number;
    bounceRate: number;
    avgDuration: number;
    topPages: [string, number][];
    vitalsPass: number;
    vitalsTotal: number;
    indexedPages: number;
    totalPages: number;
    issueCount: number;
    keywords: any[];
  };
}

export const SEORecommendations = memo(function SEORecommendations({ isAr, seoData }: Props) {
  const [report, setReport] = useState<string | null>(null);

  const generate = useMutation({
    mutationFn: async () => {
      const prompt = `You are an expert SEO consultant. Analyze this website's SEO metrics and provide 8-10 actionable recommendations. Be specific and prioritize by impact.

Website: Altoha - Culinary platform (Arabic/English bilingual)
Language: ${isAr ? "Arabic" : "English"}

Current Metrics:
- Page Views (7d): ${seoData.totalViews}
- Bounce Rate: ${seoData.bounceRate}%
- Avg Session Duration: ${seoData.avgDuration}s
- Core Web Vitals Pass: ${seoData.vitalsPass}/${seoData.vitalsTotal}
- Indexed Pages: ${seoData.indexedPages}/${seoData.totalPages}
- Open Issues: ${seoData.issueCount}
- Top Pages: ${seoData.topPages.slice(0, 5).map(([p, c]) => `${p} (${c} views)`).join(", ")}
- Tracked Keywords: ${seoData.keywords.length} (${seoData.keywords.filter((k) => k.current_position).length} with positions)

Provide recommendations in this format:
## 🎯 High Priority
1. **[Action]** - Explanation
2. ...

## ⚡ Quick Wins  
1. **[Action]** - Explanation
2. ...

## 📈 Growth Opportunities
1. **[Action]** - Explanation
2. ...

Be specific with numbers, target metrics, and implementation steps. Include both technical SEO and content strategy.`;

      const { data, error } = await supabase.functions.invoke("ai-chat", {
        body: {
          messages: [{ role: "user", content: prompt }],
          model: "google/gemini-2.5-flash",
        },
      });
      if (error) throw error;
      return data?.content || data?.message || "No recommendations generated";
    },
    onSuccess: (data) => {
      setReport(data);
      toast.success(isAr ? "تم إنشاء التقرير" : "Report generated");
    },
    onError: (e: Error) => toast.error(e instanceof Error ? e.message : String(e)),
  });

  // Auto-generated static recommendations based on data
  const autoRecs = [];
  if (seoData.bounceRate > 60) autoRecs.push({
    icon: AlertTriangle, priority: "high",
    title: isAr ? "معدل ارتداد مرتفع" : "High Bounce Rate",
    desc: isAr ? `معدل الارتداد ${seoData.bounceRate}% يحتاج تحسين. أضف محتوى تفاعلي وروابط داخلية.` : `Bounce rate of ${seoData.bounceRate}% needs improvement. Add interactive content and internal links.`,
  });
  if (seoData.avgDuration < 30) autoRecs.push({
    icon: Zap, priority: "high",
    title: isAr ? "مدة جلسة قصيرة" : "Low Session Duration",
    desc: isAr ? `متوسط ${seoData.avgDuration}ث فقط. حسّن المحتوى وأضف فيديوهات ومعارض صور.` : `Average ${seoData.avgDuration}s is too low. Improve content depth, add videos and galleries.`,
  });
  if (seoData.indexedPages < seoData.totalPages) autoRecs.push({
    icon: Target, priority: "medium",
    title: isAr ? "صفحات غير مفهرسة" : "Unindexed Pages",
    desc: isAr ? `${seoData.totalPages - seoData.indexedPages} صفحة لم تتم فهرستها. أرسلها عبر GSC.` : `${seoData.totalPages - seoData.indexedPages} pages not indexed. Submit via Search Console.`,
  });
  if (seoData.vitalsPass < seoData.vitalsTotal) autoRecs.push({
    icon: AlertTriangle, priority: "high",
    title: isAr ? "Web Vitals تحتاج تحسين" : "Web Vitals Need Work",
    desc: isAr ? `${seoData.vitalsTotal - seoData.vitalsPass} مقاييس لم تجتز. ركز على LCP و CLS.` : `${seoData.vitalsTotal - seoData.vitalsPass} metrics failing. Focus on LCP and CLS optimization.`,
  });
  if (seoData.issueCount > 0) autoRecs.push({
    icon: AlertTriangle, priority: "medium",
    title: isAr ? "مشاكل SEO مفتوحة" : "Open SEO Issues",
    desc: isAr ? `${seoData.issueCount} مشكلة تحتاج إصلاح من آخر تدقيق.` : `${seoData.issueCount} issues from the latest audit need fixing.`,
  });
  if (autoRecs.length === 0) autoRecs.push({
    icon: CheckCircle2, priority: "low",
    title: isAr ? "أداء SEO ممتاز!" : "Excellent SEO Performance!",
    desc: isAr ? "جميع المقاييس الأساسية تبدو جيدة. استمر في نشر محتوى عالي الجودة." : "All core metrics look healthy. Keep publishing high-quality bilingual content.",
  });

  return (
    <div className="space-y-4">
      {/* Auto recommendations */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-chart-4" />
            {isAr ? "توصيات تلقائية" : "Auto Recommendations"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {autoRecs.map((rec, i) => (
            <div key={i} className="flex items-start gap-3 rounded-xl border border-border/30 p-3">
              <rec.icon className={`h-4 w-4 shrink-0 mt-0.5 ${rec.priority === "high" ? "text-destructive" : rec.priority === "medium" ? "text-amber-500" : "text-emerald-500"}`} />
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm font-medium">{rec.title}</p>
                  <Badge variant={rec.priority === "high" ? "destructive" : rec.priority === "medium" ? "secondary" : "default"} className="text-xs">
                    {rec.priority === "high" ? (isAr ? "عالي" : "High") : rec.priority === "medium" ? (isAr ? "متوسط" : "Medium") : (isAr ? "منخفض" : "Low")}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{rec.desc}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* AI Deep Analysis */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold">{isAr ? "تحليل SEO بالذكاء الاصطناعي" : "AI SEO Deep Analysis"}</p>
              <p className="text-xs text-muted-foreground">
                {isAr ? "تقرير مفصل مع توصيات مخصصة بناءً على بياناتك" : "Detailed report with custom recommendations based on your data"}
              </p>
            </div>
          </div>
          <Button onClick={() => generate.mutate()} disabled={generate.isPending} size="sm" className="gap-1.5 shrink-0">
            {generate.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            {generate.isPending ? (isAr ? "جارٍ التحليل..." : "Analyzing...") : (isAr ? "إنشاء تقرير" : "Generate Report")}
          </Button>
        </CardContent>
      </Card>

      {report && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              {isAr ? "تقرير التوصيات" : "AI Recommendations Report"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-base prose-p:text-muted-foreground">
              <ReactMarkdown>{report}</ReactMarkdown>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
});
