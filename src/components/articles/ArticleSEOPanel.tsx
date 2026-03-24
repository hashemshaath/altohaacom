import { memo, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Search, Clock, FileText, Hash, CheckCircle2, AlertTriangle, XCircle, TrendingUp, Lightbulb } from "lucide-react";
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

function getKeywordDensity(content: string, title: string): { keyword: string; density: number; count: number }[] {
  if (!content || !title) return [];
  const words = title.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  const contentLower = content.toLowerCase();
  const totalWords = calculateWordCount(content);
  if (totalWords === 0) return [];
  
  return words.slice(0, 5).map(word => {
    const regex = new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), "gi");
    const matches = contentLower.match(regex);
    const count = matches ? matches.length : 0;
    return { keyword: word, density: Math.round((count / totalWords) * 1000) / 10, count };
  }).filter(k => k.count > 0).sort((a, b) => b.count - a.count);
}

function calculateSEOScore(title: string, excerpt: string, slug: string, content: string): { score: number; checks: { label: string; labelAr: string; passed: boolean; tip?: string; tipAr?: string }[] } {
  const wordCount = calculateWordCount(content);
  const checks = [
    { 
      label: "Title length (30-60 chars)", labelAr: "طول العنوان (30-60 حرف)",
      passed: title.length >= 30 && title.length <= 60,
      tip: `Currently ${title.length} chars`, tipAr: `حالياً ${title.length} حرف`
    },
    { 
      label: "Meta description (50-160 chars)", labelAr: "الوصف التعريفي (50-160 حرف)",
      passed: excerpt.length >= 50 && excerpt.length <= 160,
      tip: excerpt.length === 0 ? "Missing — add one!" : `Currently ${excerpt.length} chars`,
      tipAr: excerpt.length === 0 ? "مفقود — أضف واحداً!" : `حالياً ${excerpt.length} حرف`
    },
    { 
      label: "URL slug is clean", labelAr: "الرابط نظيف",
      passed: slug.length > 3 && !slug.includes("undefined") && !slug.includes("null") && slug.length <= 75,
      tip: slug.length > 75 ? "Too long — keep under 75 chars" : undefined,
      tipAr: slug.length > 75 ? "طويل — اجعله أقل من 75 حرف" : undefined
    },
    { 
      label: "Content 300+ words", labelAr: "المحتوى 300+ كلمة",
      passed: wordCount >= 300,
      tip: `${wordCount} words`, tipAr: `${wordCount} كلمة`
    },
    { 
      label: "Has H2/H3 headings", labelAr: "يحتوي عناوين فرعية",
      passed: /^#{2,3}\s/m.test(content),
      tip: "Structure with headings for readability", tipAr: "نظّم بالعناوين للقراءة"
    },
    { 
      label: "Has internal/external links", labelAr: "يحتوي روابط",
      passed: /\[.*?\]\(.*?\)/.test(content),
    },
    { 
      label: "Has images with alt text", labelAr: "يحتوي صور مع نص بديل",
      passed: /!\[[^\]]+\]\(.*?\)/.test(content),
      tip: "Add descriptive alt text to all images", tipAr: "أضف نص بديل وصفي لكل صورة"
    },
    { 
      label: "Title keywords in slug", labelAr: "كلمات العنوان في الرابط",
      passed: (() => {
        if (!title || !slug) return false;
        const titleWords = title.toLowerCase().split(/\s+/).filter(w => w.length > 3);
        return titleWords.some(w => slug.includes(w));
      })(),
    },
    { 
      label: "Optimal content length (600+)", labelAr: "طول محتوى مثالي (600+)",
      passed: wordCount >= 600,
      tip: wordCount < 600 ? `Add ${600 - wordCount} more words for better ranking` : "Great length!",
      tipAr: wordCount < 600 ? `أضف ${600 - wordCount} كلمة إضافية` : "طول ممتاز!"
    },
  ];
  const passed = checks.filter(c => c.passed).length;
  return { score: Math.round((passed / checks.length) * 100), checks };
}

export const ArticleSEOPanel = memo(function ArticleSEOPanel({ title, excerpt, slug, content, onSlugChange, onExcerptChange, isAr }: Props) {
  const t = (en: string, ar: string) => isAr ? ar : en;
  const readingTime = useMemo(() => calculateReadingTime(content), [content]);
  const wordCount = useMemo(() => calculateWordCount(content), [content]);
  const seo = useMemo(() => calculateSEOScore(title, excerpt, slug, content), [title, excerpt, slug, content]);
  const keywords = useMemo(() => getKeywordDensity(content, title), [content, title]);

  const scoreColor = seo.score >= 80 ? "text-chart-2" : seo.score >= 50 ? "text-chart-4" : "text-destructive";
  const scoreBg = seo.score >= 80 ? "bg-chart-2/10" : seo.score >= 50 ? "bg-chart-4/10" : "bg-destructive/10";
  const ScoreIcon = seo.score >= 80 ? CheckCircle2 : seo.score >= 50 ? AlertTriangle : XCircle;
  const scoreLabel = seo.score >= 80 ? t("Good", "جيد") : seo.score >= 50 ? t("Needs Work", "يحتاج تحسين") : t("Poor", "ضعيف");

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
            {content.split("\n").filter(l => /^#{1,6}\s/.test(l)).length} {t("headings", "عناوين")}
            <span className="mx-1">•</span>
            {(content.match(/!\[/g) || []).length} {t("images", "صور")}
            <span className="mx-1">•</span>
            {(content.match(/\[.*?\]\(.*?\)/g) || []).length} {t("links", "روابط")}
          </div>
        </CardContent>
      </Card>

      {/* SEO Score */}
      <Card className="rounded-2xl border-border/40">
        <CardHeader className="pb-3 px-4 pt-4">
          <CardTitle className="text-sm flex items-center gap-2">
            <Search className="h-4 w-4 text-primary" />
            {t("SEO Analysis", "تحليل السيو")}
            <Badge variant="secondary" className={cn("text-[9px] ms-auto rounded-lg", scoreBg, scoreColor)}>
              {scoreLabel}
            </Badge>
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
          <div className="space-y-1">
            {seo.checks.map((check) => (
              <div key={check.label} className="group">
                <div className="flex items-center gap-2 text-xs py-0.5">
                  {check.passed ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-chart-2 shrink-0" />
                  ) : (
                    <XCircle className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
                  )}
                  <span className={cn("flex-1", !check.passed && "text-muted-foreground")}>
                    {isAr ? check.labelAr : check.label}
                  </span>
                </div>
                {!check.passed && (check.tip || check.tipAr) && (
                  <p className="text-[10px] text-muted-foreground/70 ps-6 pb-0.5 italic">
                    💡 {isAr ? (check.tipAr || check.tip) : check.tip}
                  </p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Keyword Density */}
      {keywords.length > 0 && (
        <Card className="rounded-2xl border-border/40">
          <CardHeader className="pb-2 px-4 pt-4">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              {t("Keyword Density", "كثافة الكلمات المفتاحية")}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="space-y-2">
              {keywords.map(kw => (
                <div key={kw.keyword} className="flex items-center gap-2 text-xs">
                  <span className="font-mono bg-muted/50 px-1.5 py-0.5 rounded text-[10px]">{kw.keyword}</span>
                  <Progress value={Math.min(kw.density * 20, 100)} className="flex-1 h-1.5" />
                  <span className={cn("text-[10px] font-medium tabular-nums", kw.density >= 1 && kw.density <= 3 ? "text-chart-2" : "text-muted-foreground")}>
                    {kw.density}%
                  </span>
                </div>
              ))}
              <p className="text-[9px] text-muted-foreground flex items-center gap-1 mt-1">
                <Lightbulb className="h-2.5 w-2.5" />
                {t("Aim for 1-3% density per keyword", "استهدف 1-3% كثافة لكل كلمة")}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
});
