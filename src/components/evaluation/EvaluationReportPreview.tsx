import { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  ChefHat, Building2, MapPin, Calendar, Clock, Star, Users,
  Award, Printer, Download, Eye, Package, FileText, Target
} from "lucide-react";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell,
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
  logo: null,
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

export function EvaluationReportPreview({ template, onClose }: TemplatePreviewProps) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const snapshot = template.criteria_snapshot || [];

  // Generate simulated scores for each criterion
  const categoryScores = snapshot.map((cat: any, idx: number) => {
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
  });

  const overallScore = categoryScores.length
    ? Math.round((categoryScores.reduce((s: number, c: any) => s + c.avgScore, 0) / categoryScores.length) * 10) / 10
    : 0;

  const radarData = categoryScores.map((cat: any) => ({
    category: cat.categoryName,
    score: cat.avgScore,
    fullMark: 10,
  }));

  const barData = categoryScores.map((cat: any) => ({
    name: cat.categoryName,
    score: cat.avgScore,
  }));

  const totalCriteria = snapshot.reduce((sum: number, cat: any) => sum + (cat.criteria?.length || 0), 0);

  const getScoreColor = (score: number) => {
    if (score >= 9) return "text-chart-5";
    if (score >= 7.5) return "text-primary";
    if (score >= 6) return "text-chart-4";
    return "text-destructive";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 9) return isAr ? "ممتاز" : "Excellent";
    if (score >= 7.5) return isAr ? "جيد جداً" : "Very Good";
    if (score >= 6) return isAr ? "جيد" : "Good";
    return isAr ? "يحتاج تحسين" : "Needs Improvement";
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex items-center justify-between print:hidden">
        <Button variant="ghost" size="sm" onClick={onClose}>
          ← {isAr ? "العودة" : "Back"}
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => window.print()}>
            <Printer className="h-3.5 w-3.5" />
            {isAr ? "طباعة" : "Print"}
          </Button>
        </div>
      </div>

      {/* ─── Report Document ─── */}
      <div className="max-w-4xl mx-auto print:max-w-none">
        {/* Report Header */}
        <Card className="border-border/40 overflow-hidden">
          <div className="bg-primary/5 border-b border-border/40 p-6 print:p-8">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
                    {isAr ? "تقرير تقييم المنتج" : "Product Evaluation Report"}
                  </Badge>
                  <Badge className="text-[10px]">{template.product_category}</Badge>
                </div>
                <h1 className="text-2xl font-black">
                  {isAr && template.name_ar ? template.name_ar : template.name}
                </h1>
                <p className="text-sm text-muted-foreground mt-1 max-w-xl">
                  {isAr && template.description_ar ? template.description_ar : template.description}
                </p>
              </div>
              <div className="text-end shrink-0">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{isAr ? "التقييم العام" : "Overall Score"}</p>
                <p className={`text-5xl font-black tabular-nums ${getScoreColor(overallScore)}`}>{overallScore}</p>
                <p className={`text-sm font-bold ${getScoreColor(overallScore)}`}>{getScoreLabel(overallScore)}</p>
                <p className="text-[10px] text-muted-foreground">{isAr ? "من" : "out of"} 10</p>
              </div>
            </div>
          </div>

          <CardContent className="p-6 print:p-8">
            {/* Meta Info Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{isAr ? "الشركة" : "Company"}</p>
                  <p className="text-sm font-bold">{isAr ? SAMPLE_COMPANY.name_ar : SAMPLE_COMPANY.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{isAr ? "الموقع" : "Location"}</p>
                  <p className="text-sm font-bold">{isAr ? "الرياض، المملكة العربية السعودية" : "Riyadh, Saudi Arabia"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{isAr ? "التاريخ" : "Date"}</p>
                  <p className="text-sm font-bold">Feb 18, 2026</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <Users className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{isAr ? "المقيّمون" : "Evaluators"}</p>
                  <p className="text-sm font-bold">{SAMPLE_EVALUATORS.length} {isAr ? "طهاة" : "Chefs"}</p>
                </div>
              </div>
            </div>

            <Separator className="my-6" />

            {/* Charts Side by Side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3">
                  {isAr ? "التحليل الرادراي" : "Radar Analysis"}
                </p>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="hsl(var(--border))" />
                      <PolarAngleAxis
                        dataKey="category"
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                      />
                      <PolarRadiusAxis angle={30} domain={[0, 10]} tick={{ fontSize: 9 }} />
                      <Radar
                        name={isAr ? "النتيجة" : "Score"}
                        dataKey="score"
                        stroke="hsl(var(--primary))"
                        fill="hsl(var(--primary))"
                        fillOpacity={0.2}
                        strokeWidth={2}
                      />
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
                      <Tooltip
                        contentStyle={{
                          background: 'hsl(var(--popover))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: '12px',
                        }}
                      />
                      <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                        {barData.map((_: any, i: number) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
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
                    <span className={`text-sm font-black tabular-nums ${getScoreColor(cat.avgScore)}`}>
                      {cat.avgScore}/10
                    </span>
                  </div>
                  <div className="space-y-2">
                    {cat.criteria.map((cr: any, cri: number) => (
                      <div key={cri} className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground flex-1 min-w-0 truncate">
                          {isAr && cr.name_ar ? cr.name_ar : cr.name}
                        </span>
                        <div className="w-32 shrink-0">
                          <Progress value={cr.simulatedScore * 10} className="h-1.5" />
                        </div>
                        <span className={`text-xs font-bold tabular-nums w-10 text-end ${getScoreColor(cr.simulatedScore)}`}>
                          {cr.simulatedScore}
                        </span>
                        {cr.weight && (
                          <Badge variant="outline" className="text-[8px] shrink-0">{cr.weight}%</Badge>
                        )}
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
                <div key={i} className="rounded-lg border border-border/30 p-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <ChefHat className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{isAr ? ev.name_ar : ev.name}</p>
                    <p className="text-[10px] text-muted-foreground">{isAr ? ev.specialty_ar : ev.specialty}</p>
                  </div>
                  <div className="text-end shrink-0">
                    <p className={`text-lg font-black tabular-nums ${getScoreColor(ev.score)}`}>{ev.score}</p>
                  </div>
                </div>
              ))}
            </div>

            <Separator className="my-6" />

            {/* Recommendation */}
            <div className="rounded-xl border-2 border-chart-5/30 bg-chart-5/5 p-5 text-center">
              <Award className="h-8 w-8 text-chart-5 mx-auto mb-2" />
              <p className="text-lg font-black text-chart-5">
                {isAr ? "موصى به — ملائم للاستخدام الاحترافي" : "Recommended — Suitable for Professional Use"}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {isAr
                  ? "بناءً على تقييم شامل من قبل 3 طهاة محترفين عبر " + totalCriteria + " معيار"
                  : `Based on comprehensive evaluation by 3 professional chefs across ${totalCriteria} criteria`}
              </p>
            </div>

            {/* Footer */}
            <div className="mt-8 pt-4 border-t border-border/30 flex items-center justify-between text-[10px] text-muted-foreground">
              <span>Altohaa Chef's Table — {isAr ? "تقرير تقييم المنتج" : "Product Evaluation Report"}</span>
              <span>REP-2026-{String(Math.floor(Math.random() * 9000) + 1000)}</span>
              <span>{new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
