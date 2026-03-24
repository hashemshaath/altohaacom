import { memo, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Search, Clock, FileText, Hash, CheckCircle2, AlertTriangle, XCircle, TrendingUp, Lightbulb, Image, Tag, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  title: string;
  excerpt: string;
  slug: string;
  content: string;
  featuredImage?: string;
  tags?: string[];
  totalTags?: number;
  onSlugChange: (slug: string) => void;
  onExcerptChange: (excerpt: string) => void;
  isAr?: boolean;
}

function calculateReadingTime(text: string): number {
  return Math.max(1, Math.ceil(text.trim().split(/\s+/).filter(Boolean).length / 200));
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

function calculateSEOScore(
  title: string, excerpt: string, slug: string, content: string,
  featuredImage?: string, tagsCount?: number
): { score: number; checks: { label: string; labelAr: string; passed: boolean; tip?: string; tipAr?: string }[] } {
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
      passed: slug.length > 3 && !slug.includes("undefined") && slug.length <= 75,
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
      tip: "Add relevant links", tipAr: "أضف روابط ذات صلة"
    },
    {
      label: "Has images with alt text", labelAr: "يحتوي صور مع نص بديل",
      passed: /!\[[^\]]+\]\(.*?\)/.test(content),
      tip: "Add descriptive alt text to images", tipAr: "أضف نص بديل وصفي للصور"
    },
    {
      label: "Featured image added", labelAr: "صورة الغلاف مضافة",
      passed: !!featuredImage,
      tip: "Add a cover image for social sharing", tipAr: "أضف صورة غلاف للمشاركة"
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
      label: "Tags assigned (2+)", labelAr: "وسوم مخصصة (2+)",
      passed: (tagsCount || 0) >= 2,
      tip: `${tagsCount || 0} tags selected`, tipAr: `${tagsCount || 0} وسوم مختارة`
    },
    {
      label: "Optimal content (600+ words)", labelAr: "محتوى مثالي (600+ كلمة)",
      passed: wordCount >= 600,
      tip: wordCount < 600 ? `Add ${600 - wordCount} more words` : "Great length!",
      tipAr: wordCount < 600 ? `أضف ${600 - wordCount} كلمة` : "طول ممتاز!"
    },
  ];
  const passed = checks.filter(c => c.passed).length;
  return { score: Math.round((passed / checks.length) * 100), checks };
}

export const ArticleSEOPanel = memo(function ArticleSEOPanel({
  title, excerpt, slug, content, featuredImage, tags, totalTags, onSlugChange, onExcerptChange, isAr
}: Props) {
  const t = (en: string, ar: string) => isAr ? ar : en;
  const readingTime = useMemo(() => calculateReadingTime(content), [content]);
  const wordCount = useMemo(() => calculateWordCount(content), [content]);
  const seo = useMemo(() => calculateSEOScore(title, excerpt, slug, content, featuredImage, tags?.length), [title, excerpt, slug, content, featuredImage, tags?.length]);
  const keywords = useMemo(() => getKeywordDensity(content, title), [content, title]);

  const scoreColor = seo.score >= 80 ? "text-chart-2" : seo.score >= 50 ? "text-chart-4" : "text-destructive";
  const scoreBg = seo.score >= 80 ? "bg-chart-2/10" : seo.score >= 50 ? "bg-chart-4/10" : "bg-destructive/10";
  const ScoreIcon = seo.score >= 80 ? CheckCircle2 : seo.score >= 50 ? AlertTriangle : XCircle;
  const scoreLabel = seo.score >= 80 ? t("Good", "جيد") : seo.score >= 50 ? t("Needs Work", "يحتاج تحسين") : t("Poor", "ضعيف");

  return (
    <div className="space-y-3">
      {/* SEO Score - Hero */}
      <Card className="rounded-2xl border-border/40 overflow-hidden">
        <div className={cn("px-4 py-3 flex items-center gap-3", scoreBg)}>
          <div className={cn("flex items-center gap-1.5 text-2xl font-bold tabular-nums", scoreColor)}>
            <ScoreIcon className="h-5 w-5" />
            {seo.score}
          </div>
          <div className="flex-1">
            <Progress value={seo.score} className="h-2" />
          </div>
          <Badge variant="secondary" className={cn("text-[9px] rounded-lg", scoreBg, scoreColor)}>
            {scoreLabel}
          </Badge>
        </div>
        <CardContent className="p-3 space-y-0.5">
          {seo.checks.map((check) => (
            <div key={check.label} className="group">
              <div className="flex items-center gap-2 text-[11px] py-0.5">
                {check.passed ? (
                  <CheckCircle2 className="h-3 w-3 text-chart-2 shrink-0" />
                ) : (
                  <XCircle className="h-3 w-3 text-muted-foreground/40 shrink-0" />
                )}
                <span className={cn("flex-1", !check.passed && "text-muted-foreground")}>
                  {isAr ? check.labelAr : check.label}
                </span>
              </div>
              {!check.passed && (check.tip || check.tipAr) && (
                <p className="text-[9px] text-muted-foreground/60 ps-5 pb-0.5 italic">
                  💡 {isAr ? (check.tipAr || check.tip) : check.tip}
                </p>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Content Stats */}
      <Card className="rounded-2xl border-border/40">
        <CardContent className="p-3">
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl bg-muted/40 p-2 text-center">
              <p className="text-lg font-bold tabular-nums">{wordCount.toLocaleString()}</p>
              <p className="text-[9px] text-muted-foreground">{t("Words", "كلمات")}</p>
            </div>
            <div className="rounded-xl bg-muted/40 p-2 text-center">
              <p className="text-lg font-bold tabular-nums flex items-center justify-center gap-0.5">
                <Clock className="h-3 w-3 text-muted-foreground" />{readingTime}
              </p>
              <p className="text-[9px] text-muted-foreground">{t("min", "دقيقة")}</p>
            </div>
            <div className="rounded-xl bg-muted/40 p-2 text-center">
              <p className="text-lg font-bold tabular-nums">{content.split("\n").filter(l => /^#{1,6}\s/.test(l)).length}</p>
              <p className="text-[9px] text-muted-foreground">{t("Headings", "عناوين")}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-2 pt-2 border-t border-border/30">
            <span className="flex items-center gap-0.5"><Image className="h-2.5 w-2.5" /> {(content.match(/!\[/g) || []).length}</span>
            <span className="flex items-center gap-0.5"><Link2 className="h-2.5 w-2.5" /> {(content.match(/\[.*?\]\(.*?\)/g) || []).length}</span>
            <span className="flex items-center gap-0.5"><Tag className="h-2.5 w-2.5" /> {tags?.length || 0}</span>
          </div>
        </CardContent>
      </Card>

      {/* Keyword Density */}
      {keywords.length > 0 && (
        <Card className="rounded-2xl border-border/40">
          <CardHeader className="pb-2 px-3 pt-3">
            <CardTitle className="text-xs flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-primary" />
              {t("Keywords", "الكلمات المفتاحية")}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="space-y-1.5">
              {keywords.map(kw => (
                <div key={kw.keyword} className="flex items-center gap-2 text-[11px]">
                  <span className="font-mono bg-muted/50 px-1.5 py-0.5 rounded text-[10px] shrink-0">{kw.keyword}</span>
                  <Progress value={Math.min(kw.density * 20, 100)} className="flex-1 h-1" />
                  <span className={cn("text-[9px] font-medium tabular-nums w-7 text-end", kw.density >= 1 && kw.density <= 3 ? "text-chart-2" : "text-muted-foreground")}>
                    {kw.density}%
                  </span>
                </div>
              ))}
              <p className="text-[8px] text-muted-foreground flex items-center gap-1 mt-1">
                <Lightbulb className="h-2 w-2" />
                {t("Target 1-3% density per keyword", "استهدف 1-3% لكل كلمة")}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
});
