import { memo, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  FileText, Type, Image, Link2, Hash, BookOpen, BarChart3,
  CheckCircle2, AlertTriangle, XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { handleSupabaseError } from "@/lib/supabaseErrorHandler";

interface ContentMetrics {
  id: string;
  title: string;
  slug: string;
  wordCount: number;
  hasExcerpt: boolean;
  hasImage: boolean;
  hasTitleAr: boolean;
  hasContentAr: boolean;
  titleLength: number;
  excerptLength: number;
  type: string;
  score: number;
}

function computeContentScore(m: Omit<ContentMetrics, "score">): number {
  let s = 0;
  if (m.titleLength >= 10 && m.titleLength <= 70) s += 15; else if (m.titleLength > 0) s += 5;
  if (m.hasTitleAr) s += 10;
  if (m.hasExcerpt) s += 15; else s += 0;
  if (m.excerptLength >= 50 && m.excerptLength <= 160) s += 5;
  if (m.hasContentAr) s += 10;
  if (m.hasImage) s += 15;
  if (m.wordCount >= 300) s += 15; else if (m.wordCount >= 100) s += 8;
  if (m.wordCount >= 600) s += 5;
  if (m.wordCount >= 1000) s += 5;
  // Bonus for bilingual completeness
  if (m.hasTitleAr && m.hasContentAr) s += 5;
  return Math.min(s, 100);
}

export const SEOContentAnalysis = memo(function SEOContentAnalysis({ isAr }: { isAr: boolean }) {
  const { data: articles = [], isLoading } = useQuery({
    queryKey: ["seo-content-analysis"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("articles")
        .select("id, title, title_ar, slug, content, content_ar, excerpt, excerpt_ar, featured_image_url, type, status")
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(100);
      if (error) throw handleSupabaseError(error);
      return data || [];
    },
  });

  const metrics: ContentMetrics[] = useMemo(() => {
    return articles.map((a) => {
      const wordCount = (a.content || "").split(/\s+/).filter(Boolean).length;
      const m = {
        id: a.id,
        title: a.title,
        slug: a.slug,
        wordCount,
        hasExcerpt: !!(a.excerpt?.trim()),
        hasImage: !!a.featured_image_url,
        hasTitleAr: !!(a.title_ar?.trim()),
        hasContentAr: !!(a.content_ar?.trim()),
        titleLength: (a.title || "").length,
        excerptLength: (a.excerpt || "").length,
        type: a.type,
      };
      return { ...m, score: computeContentScore(m) };
    });
  }, [articles]);

  const avgScore = metrics.length > 0 ? Math.round(metrics.reduce((s, m) => s + m.score, 0) / metrics.length) : 0;
  const excellent = metrics.filter(m => m.score >= 80).length;
  const good = metrics.filter(m => m.score >= 50 && m.score < 80).length;
  const poor = metrics.filter(m => m.score < 50).length;

  const missingImage = metrics.filter(m => !m.hasImage).length;
  const missingExcerpt = metrics.filter(m => !m.hasExcerpt).length;
  const missingAr = metrics.filter(m => !m.hasTitleAr || !m.hasContentAr).length;
  const shortContent = metrics.filter(m => m.wordCount < 300).length;

  const sorted = [...metrics].sort((a, b) => a.score - b.score);

  if (isLoading) return <p className="text-sm text-muted-foreground text-center py-8">{isAr ? "جارٍ التحليل..." : "Analyzing..."}</p>;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <p className={cn("text-2xl font-bold", avgScore >= 70 ? "text-emerald-500" : avgScore >= 50 ? "text-amber-500" : "text-destructive")}>{avgScore}</p>
            <p className="text-xs text-muted-foreground">{isAr ? "متوسط الجودة" : "Avg Quality"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-emerald-500">{excellent}</p>
            <p className="text-xs text-muted-foreground">{isAr ? "ممتاز (80+)" : "Excellent (80+)"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-amber-500">{good}</p>
            <p className="text-xs text-muted-foreground">{isAr ? "جيد (50-79)" : "Good (50-79)"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-destructive">{poor}</p>
            <p className="text-xs text-muted-foreground">{isAr ? "ضعيف (<50)" : "Poor (<50)"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{metrics.length}</p>
            <p className="text-xs text-muted-foreground">{isAr ? "إجمالي المقالات" : "Total Articles"}</p>
          </CardContent>
        </Card>
      </div>

      {/* Issue Breakdown */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{isAr ? "ملخص المشاكل" : "Issue Breakdown"}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { icon: Image, label: isAr ? "بدون صورة" : "No Image", count: missingImage, color: "text-amber-500" },
              { icon: Type, label: isAr ? "بدون وصف" : "No Excerpt", count: missingExcerpt, color: "text-amber-500" },
              { icon: Hash, label: isAr ? "بدون ترجمة" : "Missing AR", count: missingAr, color: "text-destructive" },
              { icon: BookOpen, label: isAr ? "محتوى قصير" : "Short (<300w)", count: shortContent, color: "text-amber-500" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2.5 rounded-xl border border-border/30 p-3">
                <item.icon className={cn("h-4 w-4 shrink-0", item.count > 0 ? item.color : "text-emerald-500")} />
                <div>
                  <p className="text-sm font-bold tabular-nums">{item.count}</p>
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Per-article list */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            {isAr ? "تحليل المحتوى بالتفصيل" : "Content Analysis Details"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/40 text-xs text-muted-foreground">
                  <th className="text-start py-2 pe-3 font-medium">{isAr ? "المقال" : "Article"}</th>
                  <th className="text-center py-2 px-2 font-medium">{isAr ? "النتيجة" : "Score"}</th>
                  <th className="text-center py-2 px-2 font-medium">{isAr ? "كلمات" : "Words"}</th>
                  <th className="text-center py-2 px-2 font-medium">{isAr ? "صورة" : "Img"}</th>
                  <th className="text-center py-2 px-2 font-medium">{isAr ? "وصف" : "Desc"}</th>
                  <th className="text-center py-2 px-2 font-medium">AR</th>
                </tr>
              </thead>
              <tbody>
                {sorted.slice(0, 30).map((m) => (
                  <tr key={m.id} className="border-b border-border/20 last:border-0">
                    <td className="py-2 pe-3 max-w-[200px]">
                      <p className="text-xs font-medium truncate">{m.title}</p>
                      <p className="text-xs text-muted-foreground font-mono truncate">/news/{m.slug}</p>
                    </td>
                    <td className="py-2 px-2 text-center">
                      <div className="flex items-center gap-1.5 justify-center">
                        <Progress value={m.score} className="w-12 h-1.5" />
                        <span className={cn("text-xs font-bold tabular-nums",
                          m.score >= 80 ? "text-emerald-500" : m.score >= 50 ? "text-amber-500" : "text-destructive"
                        )}>{m.score}</span>
                      </div>
                    </td>
                    <td className="py-2 px-2 text-center text-xs tabular-nums">
                      <span className={m.wordCount < 300 ? "text-amber-500" : ""}>{m.wordCount}</span>
                    </td>
                    <td className="py-2 px-2 text-center">
                      {m.hasImage ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 mx-auto" /> : <XCircle className="h-3.5 w-3.5 text-muted-foreground/40 mx-auto" />}
                    </td>
                    <td className="py-2 px-2 text-center">
                      {m.hasExcerpt ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 mx-auto" /> : <XCircle className="h-3.5 w-3.5 text-muted-foreground/40 mx-auto" />}
                    </td>
                    <td className="py-2 px-2 text-center">
                      {m.hasTitleAr && m.hasContentAr ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 mx-auto" />
                      ) : m.hasTitleAr || m.hasContentAr ? (
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-500 mx-auto" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5 text-muted-foreground/40 mx-auto" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});
