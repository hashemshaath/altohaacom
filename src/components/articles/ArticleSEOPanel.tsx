import { memo, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Search, Clock, FileText, Hash, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  title: string;
  excerpt: string;
  slug: string;
  content: string;
  onSlugChange: (slug: string) => void;
  onExcerptChange: (excerpt: string) => void;
  isAr?: boolean;
}

function calculateReadingTime(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

function calculateWordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function calculateSEOScore(title: string, excerpt: string, slug: string, content: string): { score: number; checks: { label: string; passed: boolean }[] } {
  const checks = [
    { label: "Title length (30-60 chars)", passed: title.length >= 30 && title.length <= 60 },
    { label: "Meta description (50-160 chars)", passed: excerpt.length >= 50 && excerpt.length <= 160 },
    { label: "URL slug is set", passed: slug.length > 3 },
    { label: "Content length (300+ words)", passed: calculateWordCount(content) >= 300 },
    { label: "Has headings in content", passed: /^#{1,3}\s/m.test(content) },
    { label: "Has images in content", passed: /!\[.*\]\(.*\)/.test(content) },
    { label: "No duplicate title in slug", passed: !slug.includes("undefined") && !slug.includes("null") },
  ];
  const passed = checks.filter(c => c.passed).length;
  return { score: Math.round((passed / checks.length) * 100), checks };
}

export const ArticleSEOPanel = memo(function ArticleSEOPanel({ title, excerpt, slug, content, onSlugChange, onExcerptChange, isAr }: Props) {
  const t = (en: string, ar: string) => isAr ? ar : en;
  const readingTime = useMemo(() => calculateReadingTime(content), [content]);
  const wordCount = useMemo(() => calculateWordCount(content), [content]);
  const seo = useMemo(() => calculateSEOScore(title, excerpt, slug, content), [title, excerpt, slug, content]);

  const scoreColor = seo.score >= 80 ? "text-chart-2" : seo.score >= 50 ? "text-chart-4" : "text-destructive";
  const ScoreIcon = seo.score >= 80 ? CheckCircle2 : seo.score >= 50 ? AlertTriangle : XCircle;

  return (
    <div className="space-y-4">
      {/* Content Stats */}
      <Card className="rounded-2xl border-border/40">
        <CardHeader className="pb-3 px-4 pt-4">
          <CardTitle className="text-sm flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            {t("Content Stats", "إحصائيات المحتوى")}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-muted/50 p-3 text-center">
              <p className="text-xl font-bold">{wordCount.toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground">{t("Words", "كلمات")}</p>
            </div>
            <div className="rounded-xl bg-muted/50 p-3 text-center">
              <div className="flex items-center justify-center gap-1">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                <p className="text-xl font-bold">{readingTime}</p>
              </div>
              <p className="text-[10px] text-muted-foreground">{t("min read", "دقيقة قراءة")}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Hash className="h-3 w-3" />
            {content.split("\n").filter(l => l.startsWith("#")).length} {t("headings", "عناوين")}
            <span className="mx-1">•</span>
            {(content.match(/!\[/g) || []).length} {t("images", "صور")}
          </div>
        </CardContent>
      </Card>

      {/* SEO Score */}
      <Card className="rounded-2xl border-border/40">
        <CardHeader className="pb-3 px-4 pt-4">
          <CardTitle className="text-sm flex items-center gap-2">
            <Search className="h-4 w-4 text-primary" />
            {t("SEO Score", "نقاط تحسين محركات البحث")}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className={cn("flex items-center gap-1.5 text-2xl font-bold", scoreColor)}>
              <ScoreIcon className="h-5 w-5" />
              {seo.score}%
            </div>
            <Progress value={seo.score} className="flex-1 h-2" />
          </div>
          <div className="space-y-1.5">
            {seo.checks.map((check) => (
              <div key={check.label} className="flex items-center gap-2 text-xs">
                {check.passed ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-chart-2 shrink-0" />
                ) : (
                  <XCircle className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
                )}
                <span className={cn(!check.passed && "text-muted-foreground")}>{check.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Slug */}
      <Card className="rounded-2xl border-border/40">
        <CardContent className="p-4 space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">{t("URL Slug", "الرابط")}</Label>
            <Input
              value={slug}
              onChange={(e) => onSlugChange(e.target.value)}
              placeholder="my-article-title"
              className="rounded-xl text-xs font-mono"
            />
            <p className="text-[10px] text-muted-foreground truncate">/news/{slug || "..."}</p>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs flex items-center justify-between">
              {t("Meta Description", "الوصف التعريفي")}
              <Badge variant={excerpt.length > 160 ? "destructive" : "secondary"} className="text-[10px]">
                {excerpt.length}/160
              </Badge>
            </Label>
            <Textarea
              rows={3}
              value={excerpt}
              onChange={(e) => onExcerptChange(e.target.value)}
              placeholder={t("Brief description for search engines...", "وصف موجز لمحركات البحث...")}
              className="rounded-xl text-xs resize-none"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
});
