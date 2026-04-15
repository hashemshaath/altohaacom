import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer,
  CartesianGrid, Cell,
} from "recharts";
import {
  FileText, AlertTriangle, CheckCircle2, TrendingUp, Search,
  FileWarning, Copy, Sparkles, BarChart3, Eye,
} from "lucide-react";
import { toast } from "sonner";
import { QUERY_LIMIT_MEDIUM } from "@/lib/constants";

const CHART_COLORS = [
  "hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))",
  "hsl(var(--chart-4))", "hsl(var(--chart-5))",
];

const MIN_TITLE_LENGTH = 30;
const MAX_TITLE_LENGTH = 60;
const MIN_DESC_LENGTH = 120;
const MAX_DESC_LENGTH = 160;
const MIN_CONTENT_WORDS = 300;

interface Props {
  isAr: boolean;
}

export function SEOContentGapAnalyzer({ isAr }: Props) {
  const [generating, setGenerating] = useState(false);
  const [aiRecommendations, setAiRecommendations] = useState<string | null>(null);

  // Fetch articles for content analysis
  const { data: articles } = useQuery({
    queryKey: ["seo-content-gap-articles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("articles")
        .select("id, title, title_ar, slug, excerpt, excerpt_ar, content, content_ar, type, status, view_count, published_at, metadata")
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(QUERY_LIMIT_MEDIUM);
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch page views for identifying popular vs underserved pages
  const { data: pageViews } = useQuery({
    queryKey: ["seo-content-gap-views"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("seo_page_views")
        .select("path")
        .limit(1000);
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch tracked keywords
  const { data: keywords } = useQuery({
    queryKey: ["seo-content-gap-keywords"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("seo_tracked_keywords")
        .select("keyword, keyword_ar, current_position, target_page")
        .eq("is_active", true);
      if (error) throw error;
      return data || [];
    },
  });

  // Analysis
  const analysis = useMemo(() => {
    if (!articles?.length) return null;

    const thinContent: typeof articles = [];
    const missingTitle: typeof articles = [];
    const longTitle: typeof articles = [];
    const missingDesc: typeof articles = [];
    const shortDesc: typeof articles = [];
    const duplicateTitles: Record<string, typeof articles> = {};
    const duplicateDescs: Record<string, typeof articles> = {};
    const noArContent: typeof articles = [];
    const noImages: typeof articles = [];

    articles.forEach(a => {
      const wordCount = (a.content || "").split(/\s+/).filter(Boolean).length;
      const titleLen = (a.title || "").length;
      const descLen = (a.excerpt || "").length;

      // Thin content
      if (wordCount < MIN_CONTENT_WORDS) thinContent.push(a);

      // Title issues
      if (!a.title || titleLen < MIN_TITLE_LENGTH) missingTitle.push(a);
      if (titleLen > MAX_TITLE_LENGTH) longTitle.push(a);

      // Description issues
      if (!a.excerpt || descLen < 10) missingDesc.push(a);
      else if (descLen < MIN_DESC_LENGTH) shortDesc.push(a);

      // Duplicate check
      const normalTitle = (a.title || "").toLowerCase().trim();
      if (normalTitle) {
        if (!duplicateTitles[normalTitle]) duplicateTitles[normalTitle] = [];
        duplicateTitles[normalTitle].push(a);
      }

      const normalDesc = (a.excerpt || "").toLowerCase().trim().slice(0, 100);
      if (normalDesc.length > 20) {
        if (!duplicateDescs[normalDesc]) duplicateDescs[normalDesc] = [];
        duplicateDescs[normalDesc].push(a);
      }

      // Missing Arabic
      if (!a.title_ar && !a.content_ar) noArContent.push(a);

      // Check for images in content
      if (a.content && !a.content.includes("<img") && !a.content.includes("![")) {
        noImages.push(a);
      }
    });

    const dupTitles = Object.entries(duplicateTitles).filter(([, v]) => v.length > 1);
    const dupDescs = Object.entries(duplicateDescs).filter(([, v]) => v.length > 1);

    // Content type distribution
    const typeCount: Record<string, number> = {};
    articles.forEach(a => { typeCount[a.type] = (typeCount[a.type] || 0) + 1; });
    const typeDistribution = Object.entries(typeCount)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // Word count distribution
    const wordBuckets = [
      { label: "< 300", min: 0, max: 299, count: 0 },
      { label: "300–600", min: 300, max: 600, count: 0 },
      { label: "600–1000", min: 601, max: 1000, count: 0 },
      { label: "1000–2000", min: 1001, max: 2000, count: 0 },
      { label: "2000+", min: 2001, max: Infinity, count: 0 },
    ];
    articles.forEach(a => {
      const wc = (a.content || "").split(/\s+/).filter(Boolean).length;
      for (const b of wordBuckets) {
        if (wc >= b.min && wc <= b.max) { b.count++; break; }
      }
    });

    // Page view distribution — find content with 0 views
    const viewedPaths = new Set(pageViews?.map(v => v.path) || []);
    const zeroViews = articles.filter(a => !viewedPaths.has(`/blog/${a.slug}`) && !viewedPaths.has(`/articles/${a.slug}`));

    // Score
    const totalIssues = thinContent.length + missingTitle.length + longTitle.length + missingDesc.length + shortDesc.length + dupTitles.length + noArContent.length + noImages.length;
    const score = Math.max(0, Math.min(100, Math.round(100 - (totalIssues / Math.max(articles.length, 1)) * 100)));

    return {
      total: articles.length,
      score,
      thinContent,
      missingTitle,
      longTitle,
      missingDesc,
      shortDesc,
      dupTitles,
      dupDescs,
      noArContent,
      noImages,
      typeDistribution,
      wordBuckets,
      zeroViews,
      totalIssues,
    };
  }, [articles, pageViews]);

  // AI recommendations
  const generateRecommendations = async () => {
    if (!analysis) return;
    setGenerating(true);
    try {
      const prompt = `Analyze this website's content SEO health and provide actionable recommendations in ${isAr ? "Arabic" : "English"}:

Content Stats:
- Total published articles: ${analysis.total}
- Thin content (<300 words): ${analysis.thinContent.length}
- Missing titles: ${analysis.missingTitle.length}
- Titles too long (>60 chars): ${analysis.longTitle.length}
- Missing descriptions: ${analysis.missingDesc.length}
- Short descriptions: ${analysis.shortDesc.length}
- Duplicate titles: ${analysis.dupTitles.length}
- No Arabic translation: ${analysis.noArContent.length}
- No images in content: ${analysis.noImages.length}
- Zero-view pages: ${analysis.zeroViews.length}
- Content types: ${analysis.typeDistribution.map(t => `${t.name}: ${t.value}`).join(", ")}
- Tracked keywords: ${keywords?.length || 0}

Top thin content pages: ${analysis.thinContent.slice(0, 5).map(a => `"${a.title}" (${(a.content || "").split(/\s+/).length} words)`).join(", ")}

Provide:
1. Top 5 priority fixes (most impactful)
2. Content gaps — what topics should be covered based on the content types
3. Quick wins that can be done immediately
4. Long-term content strategy recommendations

Keep it concise and actionable. Use bullet points.`;

      const { data, error } = await supabase.functions.invoke("ai-gateway", {
        body: {
          model: "google/gemini-2.5-flash-lite",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 1500,
        },
      });
      if (error) throw error;
      setAiRecommendations(data?.choices?.[0]?.message?.content || data?.content || "No recommendations generated");
    } catch (e: unknown) {
      toast.error((e instanceof Error ? e.message : "") || "Failed to generate recommendations");
    } finally {
      setGenerating(false);
    }
  };

  if (!analysis) {
    return (
      <Card className="border-dashed border-2">
        <CardContent className="p-8 text-center">
          <FileText className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">{isAr ? "جارٍ تحليل المحتوى..." : "Analyzing content..."}</p>
        </CardContent>
      </Card>
    );
  }

  const issues = [
    { icon: FileWarning, label: isAr ? "محتوى رقيق (<300 كلمة)" : "Thin content (<300 words)", count: analysis.thinContent.length, severity: "high", items: analysis.thinContent },
    { icon: FileText, label: isAr ? "عناوين مفقودة/قصيرة" : "Missing/short titles", count: analysis.missingTitle.length, severity: "high", items: analysis.missingTitle },
    { icon: FileText, label: isAr ? "عناوين طويلة (>60 حرف)" : "Titles too long (>60 chars)", count: analysis.longTitle.length, severity: "medium", items: analysis.longTitle },
    { icon: Search, label: isAr ? "أوصاف مفقودة" : "Missing descriptions", count: analysis.missingDesc.length, severity: "high", items: analysis.missingDesc },
    { icon: Search, label: isAr ? "أوصاف قصيرة" : "Short descriptions (<120 chars)", count: analysis.shortDesc.length, severity: "medium", items: analysis.shortDesc },
    { icon: Copy, label: isAr ? "عناوين مكررة" : "Duplicate titles", count: analysis.dupTitles.length, severity: "high", items: [] },
    { icon: FileText, label: isAr ? "بدون ترجمة عربية" : "No Arabic translation", count: analysis.noArContent.length, severity: "medium", items: analysis.noArContent },
    { icon: Eye, label: isAr ? "صفحات بدون زيارات" : "Zero-view pages", count: analysis.zeroViews.length, severity: "low", items: analysis.zeroViews },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="text-base font-semibold flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            {isAr ? "تحليل فجوات المحتوى" : "Content Gap Analysis"}
          </h3>
          <p className="text-xs text-muted-foreground">
            {isAr ? `تحليل ${analysis.total} مقال منشور` : `Analyzing ${analysis.total} published articles`}
          </p>
        </div>
        <Button onClick={generateRecommendations} disabled={generating} size="sm" className="gap-1.5">
          <Sparkles className="h-3.5 w-3.5" />
          {generating ? (isAr ? "جارٍ التحليل..." : "Analyzing...") : (isAr ? "توصيات AI" : "AI Recommendations")}
        </Button>
      </div>

      {/* Score + KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Card className={`border-2 ${analysis.score >= 80 ? "border-chart-2/30" : analysis.score >= 50 ? "border-chart-4/30" : "border-destructive/30"}`}>
          <CardContent className="p-4 text-center">
            <p className="text-[12px] uppercase tracking-wider text-muted-foreground font-semibold">{isAr ? "نقاط المحتوى" : "Content Score"}</p>
            <p className={`text-3xl font-bold tabular-nums mt-1 ${analysis.score >= 80 ? "text-chart-2" : analysis.score >= 50 ? "text-chart-4" : "text-destructive"}`}>
              <AnimatedCounter value={analysis.score} />
              <span className="text-sm font-normal text-muted-foreground">/100</span>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-[12px] uppercase tracking-wider text-muted-foreground font-semibold">{isAr ? "إجمالي المقالات" : "Total Articles"}</p>
            <p className="text-2xl font-bold tabular-nums mt-1"><AnimatedCounter value={analysis.total} /></p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-[12px] uppercase tracking-wider text-muted-foreground font-semibold">{isAr ? "مشاكل" : "Issues"}</p>
            <p className="text-2xl font-bold tabular-nums mt-1 text-destructive"><AnimatedCounter value={analysis.totalIssues} /></p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-[12px] uppercase tracking-wider text-muted-foreground font-semibold">{isAr ? "كلمات مفتاحية" : "Keywords"}</p>
            <p className="text-2xl font-bold tabular-nums mt-1"><AnimatedCounter value={keywords?.length || 0} /></p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-[12px] uppercase tracking-wider text-muted-foreground font-semibold">{isAr ? "بدون زيارات" : "Zero Views"}</p>
            <p className="text-2xl font-bold tabular-nums mt-1 text-chart-4"><AnimatedCounter value={analysis.zeroViews.length} /></p>
          </CardContent>
        </Card>
      </div>

      {/* Issues List */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{isAr ? "مشاكل المحتوى" : "Content Issues"}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {issues.map((issue, i) => (
              <div key={i} className="flex items-center gap-3 py-2 border-b border-border/20 last:border-0">
                {issue.count === 0 ? (
                  <CheckCircle2 className="h-4 w-4 text-chart-2 shrink-0" />
                ) : issue.severity === "high" ? (
                  <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-chart-4 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{issue.label}</p>
                  {issue.count > 0 && issue.items.length > 0 && (
                    <p className="text-[12px] text-muted-foreground truncate">
                      {issue.items.slice(0, 3).map(a => a.title).join(", ")}
                      {issue.items.length > 3 && ` +${issue.items.length - 3}`}
                    </p>
                  )}
                </div>
                <Badge
                  variant={issue.count === 0 ? "default" : issue.severity === "high" ? "destructive" : "secondary"}
                  className="text-[12px] tabular-nums"
                >
                  {issue.count}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Charts Row */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Content Type Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{isAr ? "توزيع أنواع المحتوى" : "Content Type Distribution"}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={analysis.typeDistribution} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <RechartsTooltip contentStyle={{ fontSize: 11, borderRadius: 8, backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {analysis.typeDistribution.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Word Count Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{isAr ? "توزيع عدد الكلمات" : "Word Count Distribution"}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={analysis.wordBuckets} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <RechartsTooltip contentStyle={{ fontSize: 11, borderRadius: 8, backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {analysis.wordBuckets.map((b, i) => (
                    <Cell key={i} fill={b.min < MIN_CONTENT_WORDS ? "hsl(var(--destructive))" : CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Thin Content Details */}
      {analysis.thinContent.length > 0 && (
        <Card className="border-destructive/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileWarning className="h-4 w-4 text-destructive" />
              {isAr ? "محتوى رقيق يحتاج تحسين" : "Thin Content Needing Improvement"}
              <Badge variant="destructive" className="text-[12px] ms-auto">{analysis.thinContent.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/40 text-xs text-muted-foreground">
                    <th className="text-start py-2 pe-3 font-medium">{isAr ? "العنوان" : "Title"}</th>
                    <th className="text-end py-2 px-2 font-medium">{isAr ? "الكلمات" : "Words"}</th>
                    <th className="text-end py-2 px-2 font-medium">{isAr ? "المشاهدات" : "Views"}</th>
                    <th className="text-start py-2 ps-2 font-medium">{isAr ? "النوع" : "Type"}</th>
                  </tr>
                </thead>
                <tbody>
                  {analysis.thinContent.slice(0, 15).map(a => (
                    <tr key={a.id} className="border-b border-border/20 last:border-0">
                      <td className="py-2 pe-3 text-xs truncate max-w-[220px] font-medium">{a.title}</td>
                      <td className="py-2 px-2 text-end tabular-nums text-destructive font-bold">
                        {(a.content || "").split(/\s+/).filter(Boolean).length}
                      </td>
                      <td className="py-2 px-2 text-end tabular-nums text-muted-foreground">{a.view_count || 0}</td>
                      <td className="py-2 ps-2"><Badge variant="outline" className="text-[12px]">{a.type}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Recommendations */}
      {aiRecommendations && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              {isAr ? "توصيات AI" : "AI Recommendations"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap text-xs leading-relaxed" dir={isAr ? "rtl" : "ltr"}>
              {aiRecommendations}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
