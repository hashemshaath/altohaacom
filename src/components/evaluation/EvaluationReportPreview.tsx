import { useMemo, useRef } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  ChefHat, Building2, MapPin, Calendar, Users,
  Award, Printer, Download, Target, Lightbulb, AlertTriangle, CheckCircle2,
} from "lucide-react";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell,
  PieChart, Pie,
} from "recharts";

interface TemplatePreviewProps {
  template: {
    name: string;
    name_ar: string | null;
    description: string | null;
    description_ar: string | null;
    product_category: string | null;
    template_type: string;
    criteria_snapshot: any[];
  };
  onClose: () => void;
}

const SAMPLE_COMPANY = {
  name: "Al-Marai Food Industries",
  name_ar: "صناعات المراعي الغذائية",
  country: "Saudi Arabia",
  country_ar: "المملكة العربية السعودية",
};

const SAMPLE_EVALUATORS = [
  { name: "Chef Ahmad Al-Rashid", name_ar: "الشيف أحمد الراشد", specialty: "Executive Chef", specialty_ar: "شيف تنفيذي", score: 8.7 },
  { name: "Chef Maria Santos", name_ar: "الشيف ماريا سانتوس", specialty: "Pastry Chef", specialty_ar: "شيف حلويات", score: 8.2 },
  { name: "Chef Khalid Mansour", name_ar: "الشيف خالد منصور", specialty: "Grill Master", specialty_ar: "خبير الشوي", score: 9.1 },
];

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

const PIE_COLORS = ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444"];

function getScoreColor(score: number) {
  if (score >= 9) return "text-chart-5";
  if (score >= 7.5) return "text-primary";
  if (score >= 6) return "text-chart-4";
  return "text-destructive";
}

function getScoreLabel(score: number, isAr: boolean) {
  if (score >= 9) return isAr ? "ممتاز" : "Excellent";
  if (score >= 7.5) return isAr ? "جيد جداً" : "Very Good";
  if (score >= 6) return isAr ? "جيد" : "Good";
  return isAr ? "يحتاج تحسين" : "Needs Improvement";
}

function generateRecommendations(categoryScores: any[], isAr: boolean) {
  const sorted = [...categoryScores].sort((a, b) => a.avgScore - b.avgScore);
  const weakest = sorted[0];
  const strongest = sorted[sorted.length - 1];
  
  const recs = [];
  
  if (weakest && weakest.avgScore < 8) {
    recs.push({
      type: "improvement" as const,
      title: isAr ? `تحسين: ${weakest.categoryName}` : `Improve: ${weakest.categoryName}`,
      text: isAr
        ? `سجلت هذه الفئة أدنى درجة (${weakest.avgScore}/10). يُوصى بمراجعة المعايير الفرعية وتطوير الأداء في هذا المجال.`
        : `This category scored lowest (${weakest.avgScore}/10). Review sub-criteria and focus on targeted improvements in this area.`,
    });
  }
  
  if (strongest && strongest.avgScore >= 8.5) {
    recs.push({
      type: "strength" as const,
      title: isAr ? `نقطة قوة: ${strongest.categoryName}` : `Strength: ${strongest.categoryName}`,
      text: isAr
        ? `أداء متميز في هذه الفئة (${strongest.avgScore}/10). يُمكن استخدام هذه النتيجة كمعيار مرجعي.`
        : `Outstanding performance (${strongest.avgScore}/10). This can serve as a benchmark for other categories.`,
    });
  }

  // Criteria-level recommendations
  categoryScores.forEach(cat => {
    cat.criteria.forEach((cr: any) => {
      if (cr.simulatedScore < 7 && cr.is_required) {
        recs.push({
          type: "warning" as const,
          title: isAr ? `تنبيه: ${cr.name_ar || cr.name}` : `Alert: ${cr.name}`,
          text: isAr
            ? `معيار إلزامي سجل ${cr.simulatedScore}/10. يجب تحسين هذا المعيار لاستيفاء الحد الأدنى المطلوب.`
            : `Required criterion scored ${cr.simulatedScore}/10. Must be improved to meet minimum professional standards.`,
        });
      }
    });
  });

  // Overall recommendation
  const overallAvg = categoryScores.reduce((s, c) => s + c.avgScore, 0) / (categoryScores.length || 1);
  recs.push({
    type: overallAvg >= 8 ? "strength" : overallAvg >= 6.5 ? "improvement" : "warning",
    title: isAr ? "التوصية النهائية" : "Final Recommendation",
    text: overallAvg >= 8
      ? (isAr ? "المنتج يستوفي المعايير الاحترافية ويُوصى باعتماده للاستخدام." : "Product meets professional standards and is recommended for adoption.")
      : overallAvg >= 6.5
      ? (isAr ? "المنتج مقبول مع بعض التحسينات المطلوبة قبل الاعتماد النهائي." : "Product is acceptable with some improvements needed before final approval.")
      : (isAr ? "المنتج لا يستوفي الحد الأدنى من المعايير. يُوصى بإعادة التقييم بعد التحسينات." : "Product does not meet minimum standards. Re-evaluation recommended after improvements."),
  });

  return recs;
}

function downloadReportAsHTML(reportRef: React.RefObject<HTMLDivElement | null>, title: string) {
  const el = reportRef.current;
  if (!el) return;
  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${title}</title>
<style>
  @page{size:A4;margin:1.5cm}
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:system-ui,-apple-system,sans-serif;color:#1a1a1a;padding:2rem;line-height:1.5}
  .badge{display:inline-block;padding:2px 8px;border-radius:4px;font-size:11px;background:#f1f5f9;border:1px solid #e2e8f0}
  table{width:100%;border-collapse:collapse;margin:0.5rem 0}
  th,td{border:1px solid #e0e0e0;padding:6px 10px;text-align:start;font-size:12px}
  th{background:#f5f5f5;font-weight:600}
  tr:nth-child(even){background:#fafafa}
  h1{font-size:20px} h2{font-size:16px;margin:1rem 0 0.5rem} h3{font-size:14px}
  .score-excellent{color:#22c55e} .score-good{color:#3b82f6} .score-fair{color:#f59e0b} .score-poor{color:#ef4444}
  .rec-box{border:1px solid #e2e8f0;border-radius:8px;padding:12px;margin:6px 0}
  .rec-improvement{border-left:4px solid #3b82f6} .rec-strength{border-left:4px solid #22c55e} .rec-warning{border-left:4px solid #f59e0b}
  @media print{body{padding:0}}
</style></head><body>${el.innerHTML}</body></html>`;
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${title.replace(/\s+/g, "_")}_Report.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function EvaluationReportPreview({ template, onClose }: TemplatePreviewProps) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const snapshot = template.criteria_snapshot || [];
  const reportRef = useRef<HTMLDivElement>(null);
  const reportId = useMemo(() => `REP-2026-${String(Math.floor(Math.random() * 9000) + 1000)}`, []);

  const categoryScores = useMemo(() => snapshot.map((cat: any, idx: number) => {
    const criteria = cat.criteria || [];
    const scores = criteria.map((c: any) => ({
      ...c,
      simulatedScore: Math.round((6.5 + Math.random() * 3.5) * 10) / 10,
    }));
    const avgScore = scores.length
      ? Math.round((scores.reduce((s: number, c: any) => s + c.simulatedScore, 0) / scores.length) * 10) / 10
      : 0;
    return {
      categoryName: isAr && cat.category?.name_ar ? cat.category.name_ar : cat.category?.name,
      criteria: scores,
      avgScore,
      color: COLORS[idx % COLORS.length],
    };
  }), [snapshot, isAr]);

  const overallScore = categoryScores.length
    ? Math.round((categoryScores.reduce((s: number, c: any) => s + c.avgScore, 0) / categoryScores.length) * 10) / 10
    : 0;

  const radarData = categoryScores.map((cat: any) => ({ category: cat.categoryName, score: cat.avgScore, fullMark: 10 }));
  const barData = categoryScores.map((cat: any) => ({ name: cat.categoryName, score: cat.avgScore }));
  const totalCriteria = snapshot.reduce((sum: number, cat: any) => sum + (cat.criteria?.length || 0), 0);

  const scoreDistribution = useMemo(() => {
    let excellent = 0, good = 0, fair = 0, poor = 0;
    categoryScores.forEach(cat => cat.criteria.forEach((cr: any) => {
      if (cr.simulatedScore >= 9) excellent++;
      else if (cr.simulatedScore >= 7.5) good++;
      else if (cr.simulatedScore >= 6) fair++;
      else poor++;
    }));
    return [
      { name: isAr ? "ممتاز" : "Excellent", value: excellent, color: PIE_COLORS[0] },
      { name: isAr ? "جيد جداً" : "Very Good", value: good, color: PIE_COLORS[1] },
      { name: isAr ? "جيد" : "Good", value: fair, color: PIE_COLORS[2] },
      { name: isAr ? "يحتاج تحسين" : "Needs Improvement", value: poor, color: PIE_COLORS[3] },
    ].filter(d => d.value > 0);
  }, [categoryScores, isAr]);

  const recommendations = useMemo(() => generateRecommendations(categoryScores, isAr), [categoryScores, isAr]);

  const templateTitle = isAr && template.name_ar ? template.name_ar : template.name;

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex items-center justify-between print:hidden">
        <Button variant="ghost" size="sm" onClick={onClose}>
          ← {isAr ? "العودة" : "Back"}
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => downloadReportAsHTML(reportRef, templateTitle)}>
            <Download className="h-3.5 w-3.5" />
            {isAr ? "تحميل التقرير" : "Download Report"}
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => window.print()}>
            <Printer className="h-3.5 w-3.5" />
            {isAr ? "طباعة" : "Print"}
          </Button>
        </div>
      </div>

      {/* Report Document */}
      <div className="max-w-4xl mx-auto print:max-w-none" ref={reportRef}>
        <Card className="border-border/40 overflow-hidden">
          {/* Header */}
          <div className="bg-primary/5 border-b border-border/40 p-6 print:p-8">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
                    {isAr ? "تقرير تقييم المنتج" : "Product Evaluation Report"}
                  </Badge>
                  <Badge className="text-[10px]">{template.product_category}</Badge>
                </div>
                <h1 className="text-2xl font-black">{templateTitle}</h1>
                <p className="text-sm text-muted-foreground mt-1 max-w-xl">
                  {isAr && template.description_ar ? template.description_ar : template.description}
                </p>
              </div>
              <div className="text-end shrink-0">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{isAr ? "التقييم العام" : "Overall Score"}</p>
                <p className={`text-5xl font-black tabular-nums ${getScoreColor(overallScore)}`}>{overallScore}</p>
                <p className={`text-sm font-bold ${getScoreColor(overallScore)}`}>{getScoreLabel(overallScore, isAr)}</p>
                <p className="text-[10px] text-muted-foreground">{isAr ? "من" : "out of"} 10</p>
              </div>
            </div>
          </div>

          <CardContent className="p-6 print:p-8">
            {/* Meta Info */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[
                { icon: Building2, label: isAr ? "الشركة" : "Company", value: isAr ? SAMPLE_COMPANY.name_ar : SAMPLE_COMPANY.name },
                { icon: MapPin, label: isAr ? "الموقع" : "Location", value: isAr ? "الرياض، المملكة العربية السعودية" : "Riyadh, Saudi Arabia" },
                { icon: Calendar, label: isAr ? "التاريخ" : "Date", value: "Feb 18, 2026" },
                { icon: Users, label: isAr ? "المقيّمون" : "Evaluators", value: `${SAMPLE_EVALUATORS.length} ${isAr ? "طهاة" : "Chefs"}` },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted">
                    <item.icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{item.label}</p>
                    <p className="text-sm font-bold">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>

            <Separator className="my-6" />

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3">
                  {isAr ? "التحليل الراداري" : "Radar Analysis"}
                </p>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="hsl(var(--border))" />
                      <PolarAngleAxis dataKey="category" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 10]} tick={{ fontSize: 9 }} />
                      <Radar name={isAr ? "النتيجة" : "Score"} dataKey="score" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} strokeWidth={2} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3">
                  {isAr ? "النتائج حسب الفئة" : "Scores by Category"}
                </p>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData} layout="vertical" margin={{ left: 80 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" horizontal={false} />
                      <XAxis type="number" domain={[0, 10]} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                      <YAxis dataKey="name" type="category" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} width={75} />
                      <Tooltip contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                      <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                        {barData.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Score Distribution Pie */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3">
                  {isAr ? "توزيع الدرجات" : "Score Distribution"}
                </p>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={scoreDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, value }) => `${name}: ${value}`} labelLine={false} fontSize={10}>
                        {scoreDistribution.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3">
                  {isAr ? "ملخص الأداء" : "Performance Summary"}
                </p>
                <div className="space-y-3 mt-2">
                  {scoreDistribution.map((d, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                      <span className="text-sm flex-1">{d.name}</span>
                      <span className="text-sm font-black tabular-nums">{d.value}</span>
                      <span className="text-xs text-muted-foreground w-10 text-end">{Math.round((d.value / totalCriteria) * 100)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <Separator className="my-6" />

            {/* Detailed Criteria Scores */}
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Target className="h-3.5 w-3.5" />
              {isAr ? "النتائج التفصيلية" : "Detailed Scores"} — {totalCriteria} {isAr ? "معيار" : "criteria"}
            </p>
            <div className="space-y-5">
              {categoryScores.map((cat: any, ci: number) => (
                <div key={ci}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-bold flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                      {cat.categoryName}
                    </h3>
                    <span className={`text-sm font-black tabular-nums ${getScoreColor(cat.avgScore)}`}>{cat.avgScore}/10</span>
                  </div>
                  <div className="space-y-2">
                    {cat.criteria.map((cr: any, cri: number) => (
                      <div key={cri} className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground flex-1 min-w-0 truncate">
                          {isAr && cr.name_ar ? cr.name_ar : cr.name}
                        </span>
                        <div className="w-32 shrink-0"><Progress value={cr.simulatedScore * 10} className="h-1.5" /></div>
                        <span className={`text-xs font-bold tabular-nums w-10 text-end ${getScoreColor(cr.simulatedScore)}`}>{cr.simulatedScore}</span>
                        {cr.weight && <Badge variant="outline" className="text-[8px] shrink-0">{cr.weight}%</Badge>}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <Separator className="my-6" />

            {/* Evaluators Panel */}
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <ChefHat className="h-3.5 w-3.5" />
              {isAr ? "فريق التقييم" : "Evaluation Panel"}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {SAMPLE_EVALUATORS.map((ev, i) => (
                <div key={i} className="rounded-xl border border-border/30 p-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <ChefHat className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{isAr ? ev.name_ar : ev.name}</p>
                    <p className="text-[10px] text-muted-foreground">{isAr ? ev.specialty_ar : ev.specialty}</p>
                  </div>
                  <p className={`text-lg font-black tabular-nums ${getScoreColor(ev.score)}`}>{ev.score}</p>
                </div>
              ))}
            </div>

            <Separator className="my-6" />

            {/* Recommendations & Clarifications */}
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Lightbulb className="h-3.5 w-3.5" />
              {isAr ? "التوصيات والتوضيحات" : "Recommendations & Clarifications"}
            </p>
            <div className="space-y-3">
              {recommendations.map((rec, i) => (
                <div
                  key={i}
                  className={`rounded-xl border p-4 ${
                    rec.type === "strength" ? "border-chart-5/30 bg-chart-5/5" :
                    rec.type === "warning" ? "border-chart-4/30 bg-chart-4/5" :
                    "border-primary/30 bg-primary/5"
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    {rec.type === "strength" ? <CheckCircle2 className="h-4 w-4 text-chart-5 mt-0.5 shrink-0" /> :
                     rec.type === "warning" ? <AlertTriangle className="h-4 w-4 text-chart-4 mt-0.5 shrink-0" /> :
                     <Lightbulb className="h-4 w-4 text-primary mt-0.5 shrink-0" />}
                    <div>
                      <p className="text-sm font-bold">{rec.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{rec.text}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Separator className="my-6" />

            {/* Final Verdict */}
            <div className="rounded-xl border-2 border-chart-5/30 bg-chart-5/5 p-5 text-center">
              <Award className="h-8 w-8 text-chart-5 mx-auto mb-2" />
              <p className="text-lg font-black text-chart-5">
                {overallScore >= 8
                  ? (isAr ? "موصى به — ملائم للاستخدام الاحترافي" : "Recommended — Suitable for Professional Use")
                  : overallScore >= 6.5
                  ? (isAr ? "مقبول — يحتاج بعض التحسينات" : "Acceptable — Some Improvements Needed")
                  : (isAr ? "غير مستوفٍ — يُوصى بإعادة التقييم" : "Does Not Meet Standards — Re-evaluation Recommended")}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {isAr
                  ? `بناءً على تقييم شامل من قبل ${SAMPLE_EVALUATORS.length} طهاة محترفين عبر ${totalCriteria} معيار`
                  : `Based on comprehensive evaluation by ${SAMPLE_EVALUATORS.length} professional chefs across ${totalCriteria} criteria`}
              </p>
            </div>

            {/* Footer */}
            <div className="mt-8 pt-4 border-t border-border/30 flex items-center justify-between text-[10px] text-muted-foreground">
              <span>Altoha Chef's Table — {isAr ? "تقرير تقييم المنتج" : "Product Evaluation Report"}</span>
              <span>{reportId}</span>
              <span>{new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
