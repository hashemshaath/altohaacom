import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, RefreshCw, Sparkles, TrendingUp, AlertTriangle, Lightbulb, BarChart3, History, Calendar, FileText } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { format } from "date-fns";

export default function AIInsightsPanel() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [insights, setInsights] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [selectedReport, setSelectedReport] = useState<string | null>(null);

  // Fetch saved reports
  const { data: savedReports, isLoading: reportsLoading } = useQuery({
    queryKey: ["ai-analytics-reports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_analytics_reports")
        .select("id, report_type, language, content, data_snapshot, generated_at")
        .order("generated_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
  });

  const generateInsights = useCallback(async () => {
    setIsLoading(true);
    setInsights("");
    setHasGenerated(true);

    try {
      const response = await supabase.functions.invoke("ai-analytics", {
        body: { language },
      });

      if (response.error) throw response.error;

      const reader = response.data instanceof ReadableStream
        ? response.data.getReader()
        : null;

      if (!reader) {
        const text = typeof response.data === "string"
          ? response.data
          : JSON.stringify(response.data);
        setInsights(text);
        setIsLoading(false);
        return;
      }

      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n").filter((l) => l.startsWith("data: "));

        for (const line of lines) {
          const data = line.slice(6);
          if (data === "[DONE]") continue;
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullText += content;
              setInsights(fullText);
            }
          } catch {
            // skip parse errors
          }
        }
      }
    } catch (err: any) {
      console.error("AI Insights error:", err);
      setInsights(
        isAr
          ? "⚠️ حدث خطأ أثناء توليد التحليل. يرجى المحاولة لاحقاً."
          : "⚠️ Failed to generate insights. Please try again later."
      );
    } finally {
      setIsLoading(false);
    }
  }, [language, isAr]);

  const sections = [
    { icon: BarChart3, label: isAr ? "ملخص تنفيذي" : "Executive Summary", color: "text-primary" },
    { icon: TrendingUp, label: isAr ? "اتجاهات رئيسية" : "Key Trends", color: "text-chart-2" },
    { icon: Sparkles, label: isAr ? "تنبؤات" : "Predictions", color: "text-chart-3" },
    { icon: Lightbulb, label: isAr ? "توصيات" : "Recommendations", color: "text-chart-4" },
    { icon: AlertTriangle, label: isAr ? "تحذيرات" : "Risk Alerts", color: "text-chart-5" },
  ];

  const viewingReport = selectedReport
    ? savedReports?.find((r) => r.id === selectedReport)
    : null;

  return (
    <div className="space-y-6 mt-4">
      {/* Hero CTA */}
      <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 via-background to-chart-3/5">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-chart-3/5 blur-2xl" />
        <CardContent className="relative z-10 flex flex-col items-center gap-4 py-10 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
            <Brain className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold">
              {isAr ? "تحليلات الذكاء الاصطناعي" : "AI-Powered Insights"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground max-w-md mx-auto">
              {isAr
                ? "يقوم الذكاء الاصطناعي بتحليل جميع بيانات المنصة لتقديم رؤى واتجاهات وتوقعات وتوصيات عملية"
                : "AI analyzes all platform data to deliver trends, predictions, and actionable recommendations"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={generateInsights}
              disabled={isLoading}
              size="lg"
              className="gap-2"
            >
              {isLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {isLoading
                ? isAr ? "جاري التحليل..." : "Analyzing..."
                : hasGenerated
                  ? isAr ? "إعادة التحليل" : "Re-Analyze"
                  : isAr ? "توليد التحليل" : "Generate Insights"}
            </Button>
          </div>
          <Badge variant="outline" className="text-[10px] gap-1">
            <Calendar className="h-3 w-3" />
            {isAr ? "تقرير أسبوعي تلقائي كل يوم اثنين" : "Auto-report every Monday at 6:00 AM"}
          </Badge>
        </CardContent>
      </Card>

      <Tabs defaultValue="live">
        <TabsList>
          <TabsTrigger value="live" className="gap-1.5">
            <Brain className="h-3.5 w-3.5" />
            {isAr ? "تحليل مباشر" : "Live Analysis"}
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-1.5">
            <History className="h-3.5 w-3.5" />
            {isAr ? "التقارير السابقة" : "Report History"}
            {savedReports && savedReports.length > 0 && (
              <Badge variant="secondary" className="ms-1 text-[10px] px-1.5 py-0">
                {savedReports.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="live" className="space-y-4 mt-4">
          {/* Section labels when loading */}
          {isLoading && !insights && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {sections.map((s) => (
                <Card key={s.label} className="animate-pulse">
                  <CardContent className="flex items-center gap-3 py-4">
                    <s.icon className={`h-5 w-5 ${s.color}`} />
                    <span className="text-sm font-medium text-muted-foreground">{s.label}</span>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Loading skeleton */}
          {isLoading && !insights && (
            <Card>
              <CardContent className="space-y-4 py-6">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-6 w-2/3 mt-4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          )}

          {/* AI Response */}
          {insights && (
            <Card className="border-primary/10">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                    <Brain className="h-3.5 w-3.5 text-primary" />
                  </div>
                  {isAr ? "نتائج التحليل" : "Analysis Results"}
                  {isLoading && (
                    <Badge variant="secondary" className="text-[10px] animate-pulse">
                      {isAr ? "جاري التوليد..." : "Streaming..."}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm dark:prose-invert max-w-none [&>h1]:text-lg [&>h2]:text-base [&>h2]:mt-6 [&>h2]:mb-2 [&>ul]:space-y-1 [&>ol]:space-y-1">
                  <ReactMarkdown>{insights}</ReactMarkdown>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Empty state */}
          {!hasGenerated && !isLoading && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { icon: TrendingUp, title: isAr ? "كشف الاتجاهات" : "Trend Detection", desc: isAr ? "تحليل أنماط النمو والسلوك" : "Analyze growth patterns and behavior" },
                { icon: Sparkles, title: isAr ? "تنبؤات ذكية" : "Smart Predictions", desc: isAr ? "توقعات مبنية على البيانات" : "Data-driven forecasts and projections" },
                { icon: Lightbulb, title: isAr ? "توصيات عملية" : "Actionable Steps", desc: isAr ? "خطوات محددة لتحسين الأداء" : "Specific steps to improve performance" },
              ].map((item) => (
                <Card key={item.title} className="border-dashed">
                  <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
                      <item.icon className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h3 className="font-semibold">{item.title}</h3>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4 mt-4">
          {reportsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : !savedReports?.length ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
                <FileText className="h-10 w-10 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {isAr ? "لا توجد تقارير محفوظة بعد. سيتم إنشاء أول تقرير يوم الاثنين القادم." : "No saved reports yet. The first report will be generated next Monday."}
                </p>
              </CardContent>
            </Card>
          ) : viewingReport ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => setSelectedReport(null)}>
                  ← {isAr ? "العودة" : "Back"}
                </Button>
                <Badge variant="outline" className="text-[10px]">
                  {format(new Date(viewingReport.generated_at), "PPP p")}
                </Badge>
              </div>
              <Card className="border-primary/10">
                <CardContent className="py-6">
                  <div className="prose prose-sm dark:prose-invert max-w-none [&>h1]:text-lg [&>h2]:text-base [&>h2]:mt-6 [&>h2]:mb-2 [&>ul]:space-y-1 [&>ol]:space-y-1">
                    <ReactMarkdown>{viewingReport.content}</ReactMarkdown>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="space-y-3">
              {savedReports.map((report) => (
                <Card
                  key={report.id}
                  className="cursor-pointer transition-colors hover:border-primary/30"
                  onClick={() => setSelectedReport(report.id)}
                >
                  <CardContent className="flex items-center justify-between py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                        <FileText className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {report.report_type === "weekly"
                            ? isAr ? "تقرير أسبوعي" : "Weekly Report"
                            : isAr ? "تقرير" : "Report"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(report.generated_at), "PPP p")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-[10px]">
                        {report.language === "ar" ? "عربي" : "English"}
                      </Badge>
                      {report.data_snapshot && (
                        <Badge variant="outline" className="text-[10px]">
                          {(report.data_snapshot as any)?.totalUsers || 0} {isAr ? "مستخدم" : "users"}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
