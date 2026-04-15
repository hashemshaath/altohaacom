import { useIsAr } from "@/hooks/useIsAr";
import { useMemo, useRef, useState, memo } from "react";
import { TastingEntry, TastingCriterion, TastingScore, EvalMethod, TastingSession } from "@/hooks/useTasting";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Award, Printer, Download, Target, Lightbulb, AlertTriangle, CheckCircle2,
  Calendar, MapPin, Users, BarChart3, ChefHat, Share2, Copy, ExternalLink,
  TrendingUp, TrendingDown, Minus, FileText, Eye
} from "lucide-react";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell,
  PieChart, Pie,
} from "recharts";
import { format } from "date-fns";

interface Props {
  session: TastingSession;
  entries: TastingEntry[];
  criteria: TastingCriterion[];
  scores: TastingScore[];
  evalMethod: EvalMethod;
}

const COLORS = [
  "hsl(var(--primary))", "hsl(var(--chart-1))", "hsl(var(--chart-2))",
  "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))",
];
const PIE_COLORS = ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444"];

function getScoreColor(pct: number) {
  const isAr = useIsAr();
  if (pct >= 80) return "text-chart-5";
  if (pct >= 60) return "text-primary";
  if (pct >= 40) return "text-chart-4";
  return "text-destructive";
}

function getScoreLabel(pct: number, isAr: boolean) {
  if (pct >= 90) return isAr ? "استثنائي" : "Exceptional";
  if (pct >= 80) return isAr ? "ممتاز" : "Excellent";
  if (pct >= 70) return isAr ? "جيد جداً" : "Very Good";
  if (pct >= 60) return isAr ? "جيد" : "Good";
  if (pct >= 50) return isAr ? "مقبول" : "Acceptable";
  return isAr ? "يحتاج تحسين" : "Needs Improvement";
}

function getTrend(pct: number) {
  const isAr = useIsAr();
  if (pct >= 75) return { icon: TrendingUp, color: "text-chart-5" };
  if (pct >= 50) return { icon: Minus, color: "text-chart-4" };
  return { icon: TrendingDown, color: "text-destructive" };
}

export const TastingReportPanel = memo(function TastingReportPanel({ session, entries, criteria, scores, evalMethod }: Props) {
  const isAr = useIsAr();
  const reportRef = useRef<HTMLDivElement>(null);
  const [shareUrl, setShareUrl] = useState("");

  const reportId = useMemo(() => `TST-${new Date().getFullYear()}-${session.id.slice(0, 6).toUpperCase()}`, [session.id]);

  // Calculate scores per entry
  const entryResults = useMemo(() => {
    return entries.map(entry => {
      const entryScores = scores.filter(s => s.entry_id === entry.id);
      const judgeIds = new Set(entryScores.map(s => s.judge_id));

      const criteriaResults = criteria.map(crit => {
        const critScores = entryScores.filter(s => s.criterion_id === crit.id);
        let total = 0, count = 0;
        critScores.forEach(s => {
          if (evalMethod === "numeric" && s.score != null) { total += Number(s.score); count++; }
          else if (evalMethod === "stars" && s.stars != null) { total += Number(s.stars); count++; }
          else if (evalMethod === "pass_fail" && s.passed != null) { total += s.passed ? 1 : 0; count++; }
        });
        const avg = count > 0 ? total / count : 0;
        const maxVal = evalMethod === "numeric" ? crit.max_score : evalMethod === "stars" ? 5 : 1;
        const pct = maxVal > 0 ? (avg / maxVal) * 100 : 0;
        return {
          criterionId: crit.id,
          name: isAr && crit.name_ar ? crit.name_ar : crit.name,
          avg: Math.round(avg * 10) / 10,
          maxVal,
          pct: Math.round(pct),
          weight: crit.weight,
          stage: crit.stage,
          scoreCount: critScores.length,
        };
      });

      const weightedTotal = criteriaResults.reduce((s, c) => s + c.pct * c.weight, 0);
      const totalWeight = criteriaResults.reduce((s, c) => s + c.weight, 0);
      const overallPct = totalWeight > 0 ? Math.round(weightedTotal / totalWeight) : 0;

      return {
        id: entry.id,
        name: isAr && entry.dish_name_ar ? entry.dish_name_ar : entry.dish_name,
        chef: isAr && entry.chef_name_ar ? entry.chef_name_ar : entry.chef_name,
        category: entry.category,
        criteriaResults,
        overallPct,
        judgeCount: judgeIds.size,
        totalScores: entryScores.length,
      };
    }).sort((a, b) => b.overallPct - a.overallPct);
  }, [entries, criteria, scores, evalMethod, isAr]);

  // Overall session score
  const sessionOverallPct = useMemo(() => {
    if (entryResults.length === 0) return 0;
    return Math.round(entryResults.reduce((s, e) => s + e.overallPct, 0) / entryResults.length);
  }, [entryResults]);

  // Radar data for top entry
  const radarData = useMemo(() => {
    if (entryResults.length === 0 || criteria.length < 3) return null;
    const top = entryResults[0];
    return top.criteriaResults.map(c => ({
      criterion: c.name,
      value: c.pct,
      fullMark: 100,
    }));
  }, [entryResults, criteria]);

  // Score distribution
  const scoreDistribution = useMemo(() => {
    let exc = 0, good = 0, fair = 0, poor = 0;
    entryResults.forEach(e => {
      if (e.overallPct >= 80) exc++;
      else if (e.overallPct >= 60) good++;
      else if (e.overallPct >= 40) fair++;
      else poor++;
    });
    return [
      { name: isAr ? "ممتاز" : "Excellent", value: exc, color: PIE_COLORS[0] },
      { name: isAr ? "جيد" : "Good", value: good, color: PIE_COLORS[1] },
      { name: isAr ? "مقبول" : "Fair", value: fair, color: PIE_COLORS[2] },
      { name: isAr ? "ضعيف" : "Poor", value: poor, color: PIE_COLORS[3] },
    ].filter(d => d.value > 0);
  }, [entryResults, isAr]);

  // Recommendations
  const recommendations = useMemo(() => {
    const recs: Array<{ type: "strength" | "improvement" | "warning"; title: string; text: string }> = [];
    if (entryResults.length === 0) return recs;

    const best = entryResults[0];
    const worst = entryResults[entryResults.length - 1];

    if (best.overallPct >= 80) {
      recs.push({
        type: "strength",
        title: isAr ? `أفضل أداء: ${best.name}` : `Top Performer: ${best.name}`,
        text: isAr
          ? `حقق أعلى نسبة (${best.overallPct}%) ويُعتبر مرجعاً للجودة في هذه الجلسة.`
          : `Achieved the highest score (${best.overallPct}%) and serves as the quality benchmark for this session.`,
      });
    }

    if (worst.overallPct < 60 && entryResults.length > 1) {
      recs.push({
        type: "warning",
        title: isAr ? `يحتاج تحسين: ${worst.name}` : `Needs Improvement: ${worst.name}`,
        text: isAr
          ? `سجل أدنى نسبة (${worst.overallPct}%). يُوصى بمراجعة المعايير الضعيفة وإعادة التقييم.`
          : `Scored lowest (${worst.overallPct}%). Review weak criteria areas and consider re-evaluation.`,
      });
    }

    // Criteria-level insights
    const allCritResults = entryResults.flatMap(e => e.criteriaResults);
    const critAvgs: Record<string, { name: string; total: number; count: number }> = {};
    allCritResults.forEach(c => {
      if (!critAvgs[c.name]) critAvgs[c.name] = { name: c.name, total: 0, count: 0 };
      critAvgs[c.name].total += c.pct;
      critAvgs[c.name].count++;
    });
    const critRanked = Object.values(critAvgs).map(c => ({ ...c, avg: c.total / c.count })).sort((a, b) => a.avg - b.avg);
    if (critRanked.length > 0 && critRanked[0].avg < 60) {
      recs.push({
        type: "improvement",
        title: isAr ? `معيار ضعيف: ${critRanked[0].name}` : `Weak Criterion: ${critRanked[0].name}`,
        text: isAr
          ? `متوسط الأداء في هذا المعيار (${Math.round(critRanked[0].avg)}%) أقل من المقبول عبر جميع العينات.`
          : `Average performance (${Math.round(critRanked[0].avg)}%) is below acceptable levels across all entries.`,
      });
    }

    recs.push({
      type: sessionOverallPct >= 70 ? "strength" : sessionOverallPct >= 50 ? "improvement" : "warning",
      title: isAr ? "الحكم النهائي" : "Final Verdict",
      text: sessionOverallPct >= 70
        ? (isAr ? "جلسة التقييم تشير إلى جودة عالية بشكل عام. يُوصى بالاعتماد." : "The evaluation session indicates overall high quality. Approval recommended.")
        : sessionOverallPct >= 50
        ? (isAr ? "النتائج مقبولة مع وجود نقاط تحسين واضحة يجب معالجتها." : "Results are acceptable with clear improvement areas that should be addressed.")
        : (isAr ? "النتائج أقل من المعايير المطلوبة. يُوصى بإعادة التقييم بعد التحسينات." : "Results are below required standards. Re-evaluation recommended after improvements."),
    });

    return recs;
  }, [entryResults, sessionOverallPct, isAr]);

  const uniqueJudges = useMemo(() => new Set(scores.map(s => s.judge_id)).size, [scores]);

  function handlePrint() { window.print(); }

  function handleDownload() {
  const isAr = useIsAr();
    const el = reportRef.current;
    if (!el) return;
    const title = session.title;
    const html = `<!DOCTYPE html>
<html dir="${isAr ? "rtl" : "ltr"}"><head><meta charset="utf-8"><title>${title} — Report</title>
<style>
@page{size:A4;margin:1.5cm}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:system-ui,-apple-system,sans-serif;color:#1a1a1a;padding:2rem;line-height:1.6;font-size:13px}
h1{font-size:22px;margin-bottom:4px} h2{font-size:16px;margin:1.2rem 0 0.5rem} h3{font-size:14px}
table{width:100%;border-collapse:collapse;margin:0.5rem 0}
th,td{border:1px solid #e0e0e0;padding:8px 12px;text-align:start}
th{background:#f5f5f5;font-weight:600}
.badge{display:inline-block;padding:2px 10px;border-radius:6px;font-size:11px;background:#f1f5f9;border:1px solid #e2e8f0}
.score-high{color:#22c55e} .score-mid{color:#3b82f6} .score-low{color:#f59e0b} .score-poor{color:#ef4444}
.rec-box{border:1px solid #e2e8f0;border-radius:10px;padding:14px;margin:8px 0}
.rec-strength{border-left:4px solid #22c55e} .rec-improvement{border-left:4px solid #3b82f6} .rec-warning{border-left:4px solid #f59e0b}
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
    toast.success(isAr ? "تم تحميل التقرير" : "Report downloaded");
  }

  function handleCopyLink() {
  const isAr = useIsAr();
    const url = `${window.location.origin}/tastings/${session.id}?tab=report`;
    navigator.clipboard.writeText(url).then(null, () => {});
    setShareUrl(url);
    toast.success(isAr ? "تم نسخ الرابط" : "Link copied");
  }

  if (scores.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center py-16">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted mb-3">
            <FileText className="h-7 w-7 text-muted-foreground/40" />
          </div>
          <p className="font-medium">{isAr ? "لا توجد بيانات كافية لإنشاء التقرير" : "Not enough data to generate a report"}</p>
          <p className="text-sm text-muted-foreground mt-1">{isAr ? "يجب إضافة تقييمات أولاً" : "Add scores first to generate the report"}</p>
        </CardContent>
      </Card>
    );
  }

  const barData = entryResults.map(e => ({ name: e.name, score: e.overallPct }));

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1 text-xs">
            <FileText className="h-3 w-3" />
            {reportId}
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={handleCopyLink}>
            <Share2 className="h-3.5 w-3.5" />
            {isAr ? "مشاركة" : "Share"}
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={handleDownload}>
            <Download className="h-3.5 w-3.5" />
            {isAr ? "تحميل" : "Download"}
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={handlePrint}>
            <Printer className="h-3.5 w-3.5" />
            {isAr ? "طباعة" : "Print"}
          </Button>
        </div>
      </div>

      {/* Report */}
      <div className="max-w-4xl mx-auto print:max-w-none" ref={reportRef}>
        <Card className="overflow-hidden border-border/40">
          {/* Header */}
          <div className="bg-primary/5 border-b border-border/40 p-6 print:p-8">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <Badge variant="outline" className="text-[0.625rem] uppercase tracking-widest font-bold">
                    {isAr ? "تقرير جلسة التذوق" : "Tasting Session Report"}
                  </Badge>
                  {session.evaluation_category && (
                    <Badge className="text-[0.625rem]">{session.evaluation_category}</Badge>
                  )}
                </div>
                <h1 className="text-2xl font-black leading-tight">{isAr && session.title_ar ? session.title_ar : session.title}</h1>
                {session.description && (
                  <p className="text-sm text-muted-foreground mt-1.5 max-w-xl leading-relaxed">
                    {isAr && session.description_ar ? session.description_ar : session.description}
                  </p>
                )}
              </div>
              <div className="text-end shrink-0">
                <p className="text-[0.625rem] text-muted-foreground uppercase tracking-widest font-bold mb-1">{isAr ? "النتيجة الكلية" : "Overall"}</p>
                <p className={`text-5xl font-black tabular-nums ${getScoreColor(sessionOverallPct)}`}>{sessionOverallPct}%</p>
                <Badge variant="secondary" className={`mt-1 ${getScoreColor(sessionOverallPct)} font-bold`}>
                  {getScoreLabel(sessionOverallPct, isAr)}
                </Badge>
              </div>
            </div>
          </div>

          <CardContent className="p-6 print:p-8 space-y-8">
            {/* Meta */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: Calendar, label: isAr ? "التاريخ" : "Date", value: session.session_date ? format(new Date(session.session_date), "PPP") : "—" },
                { icon: MapPin, label: isAr ? "الموقع" : "Location", value: session.venue || "—" },
                { icon: Users, label: isAr ? "المحكمين" : "Judges", value: `${uniqueJudges}` },
                { icon: BarChart3, label: isAr ? "إجمالي التقييمات" : "Total Scores", value: `${scores.length}` },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted">
                    <item.icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-[0.625rem] text-muted-foreground uppercase tracking-wider font-bold">{item.label}</p>
                    <p className="text-sm font-bold">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>

            <Separator />

            {/* Rankings */}
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2 mb-4">
                <Award className="h-4 w-4" />
                {isAr ? "ترتيب العينات" : "Entry Rankings"}
              </h2>
              <div className="space-y-3">
                {entryResults.map((e, i) => {
                  const Trend = getTrend(e.overallPct);
                  return (
                    <div key={e.id} className="flex items-center gap-4 rounded-xl border p-4">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-black text-sm ${i === 0 ? "bg-chart-4/20 text-chart-4" : i === 1 ? "bg-muted text-muted-foreground" : i === 2 ? "bg-chart-3/20 text-chart-3" : "bg-muted text-muted-foreground"}`}>
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold truncate">{e.name}</p>
                          {e.category && <Badge variant="outline" className="text-[0.625rem]">{e.category}</Badge>}
                        </div>
                        {e.chef && <p className="text-xs text-muted-foreground">{e.chef}</p>}
                        <div className="mt-2">
                          <Progress value={e.overallPct} className="h-1.5" />
                        </div>
                      </div>
                      <div className="text-end shrink-0">
                        <div className="flex items-center gap-1.5">
                          <Trend.icon className={`h-4 w-4 ${Trend.color}`} />
                          <span className={`text-2xl font-black tabular-nums ${getScoreColor(e.overallPct)}`}>{e.overallPct}%</span>
                        </div>
                        <p className="text-[0.625rem] text-muted-foreground">{e.judgeCount} {isAr ? "محكم" : "judges"} · {e.totalScores} {isAr ? "تقييم" : "scores"}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <Separator />

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Bar chart */}
              <div>
                <h3 className="text-[0.625rem] font-bold text-muted-foreground uppercase tracking-wider mb-3">
                  {isAr ? "مقارنة العينات" : "Entry Comparison"}
                </h3>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                      <Tooltip contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                      <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                        {barData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Radar chart */}
              {radarData && (
                <div>
                  <h3 className="text-[0.625rem] font-bold text-muted-foreground uppercase tracking-wider mb-3">
                    {isAr ? "التحليل الراداري — الأفضل" : "Radar Analysis — Top Entry"}
                  </h3>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={radarData}>
                        <PolarGrid stroke="hsl(var(--border))" />
                        <PolarAngleAxis dataKey="criterion" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9 }} />
                        <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 9 }} />
                        <Radar dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} strokeWidth={2} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>

            {/* Score distribution */}
            {scoreDistribution.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-[0.625rem] font-bold text-muted-foreground uppercase tracking-wider mb-3">
                    {isAr ? "توزيع النتائج" : "Score Distribution"}
                  </h3>
                  <div className="h-44">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={scoreDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={65} label={({ name, value }) => `${name}: ${value}`} fontSize={10}>
                          {scoreDistribution.map((e, i) => <Cell key={i} fill={e.color} />)}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div>
                  <h3 className="text-[0.625rem] font-bold text-muted-foreground uppercase tracking-wider mb-3">
                    {isAr ? "ملخص التوزيع" : "Distribution Summary"}
                  </h3>
                  <div className="space-y-3 mt-4">
                    {scoreDistribution.map((d, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                        <span className="text-sm flex-1">{d.name}</span>
                        <span className="text-sm font-black tabular-nums">{d.value}</span>
                        <span className="text-xs text-muted-foreground w-12 text-end">
                          {Math.round((d.value / entryResults.length) * 100)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <Separator />

            {/* Detailed per-entry breakdown */}
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2 mb-4">
                <Target className="h-4 w-4" />
                {isAr ? "التفاصيل حسب العينة" : "Detailed Breakdown by Entry"}
              </h2>
              <div className="space-y-6">
                {entryResults.map((e, ei) => (
                  <div key={e.id} className="rounded-xl border p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-black text-primary">{ei + 1}</span>
                        <h3 className="text-sm font-bold">{e.name}</h3>
                        {e.chef && <Badge variant="secondary" className="text-[0.625rem]">{e.chef}</Badge>}
                      </div>
                      <span className={`text-lg font-black tabular-nums ${getScoreColor(e.overallPct)}`}>{e.overallPct}%</span>
                    </div>
                    <div className="space-y-2">
                      {e.criteriaResults.map((c, ci) => (
                        <div key={ci} className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground flex-1 min-w-0 truncate">{c.name}</span>
                          {c.stage && <Badge variant="outline" className="text-[0.625rem] shrink-0">{c.stage}</Badge>}
                          <div className="w-28 shrink-0"><Progress value={c.pct} className="h-1.5" /></div>
                          <span className={`text-xs font-bold tabular-nums w-12 text-end ${getScoreColor(c.pct)}`}>
                            {c.avg}/{c.maxVal}
                          </span>
                          <span className="text-[0.625rem] text-muted-foreground w-8 text-end">{c.weight}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Recommendations */}
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2 mb-4">
                <Lightbulb className="h-4 w-4" />
                {isAr ? "التوصيات والتحليل" : "Recommendations & Analysis"}
              </h2>
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
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{rec.text}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Final Verdict */}
            <div className={`rounded-2xl border-2 p-6 text-center ${
              sessionOverallPct >= 70 ? "border-chart-5/30 bg-chart-5/5" :
              sessionOverallPct >= 50 ? "border-chart-4/30 bg-chart-4/5" :
              "border-destructive/30 bg-destructive/5"
            }`}>
              <Award className={`h-10 w-10 mx-auto mb-3 ${getScoreColor(sessionOverallPct)}`} />
              <p className={`text-xl font-black ${getScoreColor(sessionOverallPct)}`}>
                {sessionOverallPct >= 70
                  ? (isAr ? "موصى به — نتائج تفوق المعايير المطلوبة" : "Recommended — Results Exceed Required Standards")
                  : sessionOverallPct >= 50
                  ? (isAr ? "مقبول — يحتاج بعض التحسينات" : "Acceptable — Some Improvements Needed")
                  : (isAr ? "غير مستوفٍ — يُوصى بإعادة التقييم" : "Below Standards — Re-evaluation Recommended")}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                {isAr
                  ? `بناءً على ${scores.length} تقييم من ${uniqueJudges} محكم عبر ${criteria.length} معيار و ${entries.length} عينة`
                  : `Based on ${scores.length} scores from ${uniqueJudges} judges across ${criteria.length} criteria and ${entries.length} entries`}
              </p>
            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-border/30 flex items-center justify-between text-[0.625rem] text-muted-foreground">
              <span>Altoha — {isAr ? "تقرير جلسة التذوق" : "Tasting Session Report"}</span>
              <span>{reportId}</span>
              <span>{new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
});
