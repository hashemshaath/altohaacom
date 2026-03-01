import { useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { EvaluationRadarChart } from "./EvaluationRadarChart";
import { EvaluationBarChart } from "./EvaluationBarChart";
import {
  Printer, Download, Award, ChefHat, Star, ThumbsUp, ThumbsDown,
  CheckCircle2, AlertTriangle, Lightbulb, Calendar, MapPin, Package, Users,
  FileText, TrendingUp, Shield,
} from "lucide-react";
import { format } from "date-fns";

interface EvaluationReportProps {
  session: {
    title: string;
    title_ar?: string;
    product_name: string;
    product_name_ar?: string;
    product_category: string;
    description?: string;
    description_ar?: string;
    session_date?: string;
    venue?: string;
    venue_ar?: string;
    cover_image_url?: string;
  };
  evaluations: Array<{
    id: string;
    overall_score?: number | null;
    taste_score?: number | null;
    texture_score?: number | null;
    aroma_score?: number | null;
    versatility_score?: number | null;
    value_score?: number | null;
    presentation_score?: number | null;
    is_recommended?: boolean;
    review_title?: string;
    review_text?: string;
    pros?: string;
    cons?: string;
    endorsement_text?: string;
    cooking_experience?: string;
    dishes_prepared?: string;
    usage_suggestions?: string;
    submitted_at?: string;
  }>;
  media: Array<{ id: string; media_url: string; media_type: string; title?: string }>;
  invitationCount: number;
  isAr: boolean;
}

const scoreLabels = [
  { key: "taste_score", en: "Taste & Flavor", ar: "المذاق والنكهة" },
  { key: "texture_score", en: "Texture", ar: "القوام" },
  { key: "aroma_score", en: "Aroma", ar: "الرائحة" },
  { key: "versatility_score", en: "Versatility", ar: "تعدد الاستخدامات" },
  { key: "value_score", en: "Value for Money", ar: "القيمة" },
  { key: "presentation_score", en: "Presentation", ar: "التقديم" },
];

function getScoreLabel(score: number, isAr: boolean): string {
  if (score >= 9) return isAr ? "استثنائي" : "Exceptional";
  if (score >= 8) return isAr ? "ممتاز" : "Excellent";
  if (score >= 7) return isAr ? "جيد جداً" : "Very Good";
  if (score >= 6) return isAr ? "جيد" : "Good";
  if (score >= 5) return isAr ? "مقبول" : "Acceptable";
  return isAr ? "يحتاج تحسين" : "Needs Improvement";
}

function getScoreColor(score: number): string {
  if (score >= 8) return "text-chart-5";
  if (score >= 6) return "text-chart-4";
  if (score >= 4) return "text-primary";
  return "text-destructive";
}

export function EvaluationReport({ session, evaluations, media, invitationCount, isAr }: EvaluationReportProps) {
  const reportRef = useRef<HTMLDivElement>(null);
  const submitted = evaluations.filter(e => (e as any).status === "submitted" || e.overall_score != null);

  if (submitted.length === 0) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground/30" />
          <p className="mt-4 font-bold text-lg">{isAr ? "التقرير غير جاهز بعد" : "Report Not Ready Yet"}</p>
          <p className="text-sm text-muted-foreground mt-1">
            {isAr ? "تحتاج إلى تقييم واحد مكتمل على الأقل لإنشاء التقرير" : "Need at least one completed evaluation to generate the report"}
          </p>
        </CardContent>
      </Card>
    );
  }

  // Compute averages
  const avgScores = scoreLabels.map(s => {
    const scores = submitted.map(e => (e as any)[s.key]).filter((v: any) => v != null);
    return { ...s, avg: scores.length ? scores.reduce((a: number, b: number) => a + b, 0) / scores.length : 0 };
  });
  const overallAvg = avgScores.filter(s => s.avg > 0).length
    ? avgScores.filter(s => s.avg > 0).reduce((s, c) => s + c.avg, 0) / avgScores.filter(s => s.avg > 0).length
    : 0;
  const recommendedCount = submitted.filter(e => e.is_recommended).length;
  const recRate = submitted.length > 0 ? Math.round((recommendedCount / submitted.length) * 100) : 0;

  // Collect strengths, weaknesses, suggestions
  const allPros = submitted.map(e => e.pros).filter(Boolean) as string[];
  const allCons = submitted.map(e => e.cons).filter(Boolean) as string[];
  const allSuggestions = submitted.map(e => e.usage_suggestions).filter(Boolean) as string[];
  const allEndorsements = submitted.map(e => e.endorsement_text).filter(Boolean) as string[];

  // Chart data
  const radarData = avgScores.map(s => ({
    name: isAr ? s.ar : s.en,
    score: parseFloat(s.avg.toFixed(1)),
    maxScore: 10,
    fullMark: 10,
  }));
  const barData = avgScores.map(s => ({
    name: isAr ? s.ar : s.en,
    score: parseFloat(s.avg.toFixed(1)),
    maxScore: 10,
  }));

  // Top & bottom criteria
  const sorted = [...avgScores].filter(s => s.avg > 0).sort((a, b) => b.avg - a.avg);
  const topCriteria = sorted.slice(0, 3);
  const bottomCriteria = [...sorted].reverse().slice(0, 3);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            {isAr ? "التقرير المهني الكامل" : "Complete Professional Report"}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isAr ? "تقرير شامل عن نتائج التقييم" : "Comprehensive evaluation results report"}
          </p>
        </div>
        <Button onClick={handlePrint} variant="outline" className="gap-2">
          <Printer className="h-4 w-4" />
          {isAr ? "طباعة" : "Print Report"}
        </Button>
      </div>

      <div ref={reportRef} className="space-y-6 print:space-y-4">
        {/* Report Header */}
        <Card className="overflow-hidden border-primary/20">
          {session.cover_image_url && (
            <div className="aspect-[4/1] overflow-hidden">
              <img src={session.cover_image_url} alt="" className="h-full w-full object-cover" />
            </div>
          )}
          <CardContent className="p-6 md:p-8">
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="outline" className="gap-1 text-xs font-bold uppercase tracking-wider">
                <Shield className="h-3 w-3" />
                {isAr ? "تقرير تقييم رسمي" : "Official Evaluation Report"}
              </Badge>
              <Badge variant="secondary" className="text-xs gap-1">
                <Package className="h-3 w-3" />
                {session.product_category}
              </Badge>
            </div>
            <h1 className="text-2xl md:text-3xl font-black mb-2">
              {isAr && session.title_ar ? session.title_ar : session.title}
            </h1>
            <p className="text-lg font-semibold text-primary/80 mb-4">
              {isAr && session.product_name_ar ? session.product_name_ar : session.product_name}
            </p>
            <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
              {session.session_date && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-primary" />
                  {format(new Date(session.session_date), "PPP")}
                </span>
              )}
              {session.venue && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-chart-4" />
                  {isAr && session.venue_ar ? session.venue_ar : session.venue}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Users className="h-4 w-4" />
                {submitted.length} / {invitationCount} {isAr ? "طاهٍ" : "chefs"}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Executive Summary */}
        <Card className="border-s-4 border-s-primary">
          <CardContent className="p-6 md:p-8">
            <h2 className="text-lg font-black mb-5 flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              {isAr ? "الملخص التنفيذي" : "Executive Summary"}
            </h2>
            <div className="grid md:grid-cols-4 gap-6">
              {/* Overall Score */}
              <div className="flex flex-col items-center text-center">
                <div className="relative flex h-28 w-28 items-center justify-center">
                  <svg className="h-28 w-28 -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--muted))" strokeWidth="7" />
                    <circle
                      cx="50" cy="50" r="42"
                      fill="none"
                      stroke="hsl(var(--primary))"
                      strokeWidth="7"
                      strokeLinecap="round"
                      strokeDasharray={`${(overallAvg / 10) * 264} 264`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-3xl font-black ${getScoreColor(overallAvg)}`}>{overallAvg.toFixed(1)}</span>
                    <span className="text-[10px] text-muted-foreground">/10</span>
                  </div>
                </div>
                <Badge className="mt-2 font-bold">{getScoreLabel(overallAvg, isAr)}</Badge>
              </div>

              {/* Stats Grid */}
              <div className="md:col-span-3 grid grid-cols-3 gap-4">
                <div className="rounded-xl bg-muted/30 p-4 text-center">
                  <ChefHat className="mx-auto h-6 w-6 text-primary mb-1" />
                  <span className="text-2xl font-black">{submitted.length}</span>
                  <p className="text-[11px] text-muted-foreground">{isAr ? "طاهٍ مقيّم" : "Chef Evaluators"}</p>
                </div>
                <div className="rounded-xl bg-chart-5/10 p-4 text-center">
                  <ThumbsUp className="mx-auto h-6 w-6 text-chart-5 mb-1" />
                  <span className="text-2xl font-black text-chart-5">{recRate}%</span>
                  <p className="text-[11px] text-muted-foreground">{isAr ? "نسبة التوصية" : "Recommendation Rate"}</p>
                </div>
                <div className="rounded-xl bg-muted/30 p-4 text-center">
                  <Star className="mx-auto h-6 w-6 text-chart-4 mb-1" />
                  <span className="text-2xl font-black">{scoreLabels.length}</span>
                  <p className="text-[11px] text-muted-foreground">{isAr ? "معيار تقييم" : "Evaluation Criteria"}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Score Breakdown */}
        <div className="grid lg:grid-cols-2 gap-6 print:grid-cols-2">
          <EvaluationRadarChart
            title={isAr ? "تحليل متعدد الأبعاد" : "Multi-Dimensional Analysis"}
            data={radarData}
            isAr={isAr}
          />
          <EvaluationBarChart
            title={isAr ? "الدرجات حسب المعيار" : "Scores by Criterion"}
            data={barData}
            isAr={isAr}
          />
        </div>

        {/* Detailed Score Table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              {isAr ? "تفاصيل الدرجات" : "Score Details"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {avgScores.map(s => (
                <div key={s.key} className="flex items-center gap-4">
                  <span className="text-sm font-medium w-40 shrink-0">{isAr ? s.ar : s.en}</span>
                  <Progress value={s.avg * 10} className="h-3 flex-1" />
                  <span className={`text-sm font-black tabular-nums w-12 text-end ${getScoreColor(s.avg)}`}>
                    {s.avg.toFixed(1)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Strengths & Weaknesses */}
        <div className="grid md:grid-cols-2 gap-6 print:grid-cols-2">
          {/* Top Performers */}
          <Card className="border-chart-5/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2 text-chart-5">
                <CheckCircle2 className="h-4 w-4" />
                {isAr ? "أعلى المعايير أداءً" : "Top Performing Criteria"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {topCriteria.map((c, i) => (
                <div key={c.key} className="flex items-center gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-chart-5/10 text-xs font-black text-chart-5">
                    {i + 1}
                  </span>
                  <span className="text-sm flex-1">{isAr ? c.ar : c.en}</span>
                  <Badge variant="secondary" className="text-chart-5 font-black">{c.avg.toFixed(1)}</Badge>
                </div>
              ))}
              {allPros.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs font-bold text-chart-5 mb-2">{isAr ? "نقاط القوة من الطهاة" : "Chef-Reported Strengths"}</p>
                    {allPros.map((p, i) => (
                      <p key={i} className="text-sm text-muted-foreground mb-1.5">• {p}</p>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Needs Improvement */}
          <Card className="border-destructive/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-4 w-4" />
                {isAr ? "معايير تحتاج تحسين" : "Areas for Improvement"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {bottomCriteria.map((c, i) => (
                <div key={c.key} className="flex items-center gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-xs font-black text-destructive">
                    {i + 1}
                  </span>
                  <span className="text-sm flex-1">{isAr ? c.ar : c.en}</span>
                  <Badge variant="secondary" className="text-destructive font-black">{c.avg.toFixed(1)}</Badge>
                </div>
              ))}
              {allCons.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs font-bold text-destructive mb-2">{isAr ? "ملاحظات الطهاة" : "Chef-Reported Improvements"}</p>
                    {allCons.map((c, i) => (
                      <p key={i} className="text-sm text-muted-foreground mb-1.5">• {c}</p>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recommendations & Usage */}
        {allSuggestions.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-chart-4" />
                {isAr ? "توصيات واقتراحات الاستخدام" : "Usage Recommendations"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {allSuggestions.map((s, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-muted/30">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-chart-4/10 text-[10px] font-black text-chart-4 mt-0.5">
                      {i + 1}
                    </span>
                    <p className="text-sm">{s}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Chef Endorsements */}
        {allEndorsements.length > 0 && (
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ChefHat className="h-4 w-4 text-primary" />
                {isAr ? "مصادقات الطهاة" : "Chef Endorsements"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {allEndorsements.map((e, i) => (
                <blockquote key={i} className="border-s-2 border-primary ps-4 py-1">
                  <p className="text-sm italic text-primary/90 font-medium">"{e}"</p>
                  <footer className="text-xs text-muted-foreground mt-1">
                    — {isAr ? `طاهٍ مقيّم ${i + 1}` : `Chef Evaluator ${i + 1}`}
                  </footer>
                </blockquote>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Media Gallery in Report */}
        {media.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{isAr ? "معرض الصور والوسائط" : "Photo & Media Gallery"}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {media.slice(0, 8).map(m => (
                  <div key={m.id} className="aspect-square overflow-hidden rounded-xl border border-border/40">
                    {m.media_type === "image" ? (
                      <img src={m.media_url} alt={m.title || ""} className="h-full w-full object-cover" />
                    ) : (
                      <video src={m.media_url} className="h-full w-full object-cover" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center py-6 text-xs text-muted-foreground border-t border-border/30">
          <p className="font-bold mb-1">
            {isAr ? "تقرير صادر من منصة طاولة الشيف" : "Report Generated by Chef's Table Platform"}
          </p>
          <p>{isAr ? "معايير التقييم متوافقة مع WACS و ACF الدولية" : "Evaluation standards aligned with WACS & ACF international frameworks"}</p>
          <p className="mt-1">{format(new Date(), "PPP")}</p>
        </div>
      </div>
    </div>
  );
}
