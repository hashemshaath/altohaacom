import { useState } from "react";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FlaskConical, Plus, TrendingUp, CheckCircle2, XCircle, Clock, BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface Experiment {
  id: string;
  name: string;
  nameAr: string;
  status: "running" | "concluded" | "draft";
  metric: string;
  variants: { name: string; visitors: number; conversions: number }[];
  startDate: string;
  endDate?: string;
  winner?: string;
  confidence: number;
}

// Mock experiments data - in production this would come from a database table
const MOCK_EXPERIMENTS: Experiment[] = [
  {
    id: "1",
    name: "CTA Button Color",
    nameAr: "لون زر الإجراء",
    status: "concluded",
    metric: "click_rate",
    variants: [
      { name: "Control (Blue)", visitors: 4520, conversions: 362 },
      { name: "Variant A (Green)", visitors: 4480, conversions: 425 },
    ],
    startDate: "2026-01-15",
    endDate: "2026-02-10",
    winner: "Variant A (Green)",
    confidence: 96.2,
  },
  {
    id: "2",
    name: "Landing Page Hero",
    nameAr: "صفحة الهبوط الرئيسية",
    status: "running",
    metric: "signup_rate",
    variants: [
      { name: "Control", visitors: 2100, conversions: 189 },
      { name: "Video Hero", visitors: 2050, conversions: 213 },
      { name: "Testimonial Hero", visitors: 2080, conversions: 198 },
    ],
    startDate: "2026-02-05",
    confidence: 78.4,
  },
  {
    id: "3",
    name: "Pricing Page Layout",
    nameAr: "تصميم صفحة الأسعار",
    status: "draft",
    metric: "purchase_rate",
    variants: [
      { name: "Control", visitors: 0, conversions: 0 },
      { name: "Comparison Table", visitors: 0, conversions: 0 },
    ],
    startDate: "2026-02-20",
    confidence: 0,
  },
];

export function ABTestingDashboard() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [experiments] = useState<Experiment[]>(MOCK_EXPERIMENTS);
  const [selectedExp, setSelectedExp] = useState<Experiment | null>(null);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "running": return <Badge className="bg-chart-2/10 text-chart-2 border-chart-2/20">{isAr ? "جارٍ" : "Running"}</Badge>;
      case "concluded": return <Badge className="bg-chart-5/10 text-chart-5 border-chart-5/20">{isAr ? "منتهي" : "Concluded"}</Badge>;
      default: return <Badge variant="outline">{isAr ? "مسودة" : "Draft"}</Badge>;
    }
  };

  const conversionRate = (conversions: number, visitors: number) =>
    visitors > 0 ? ((conversions / visitors) * 100).toFixed(2) : "0.00";

  const getConfidenceColor = (c: number) => {
    if (c >= 95) return "text-chart-5";
    if (c >= 80) return "text-chart-2";
    if (c >= 50) return "text-chart-3";
    return "text-muted-foreground";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{isAr ? "لوحة اختبار A/B" : "A/B Testing Dashboard"}</h3>
          <p className="text-sm text-muted-foreground">
            {isAr ? "تتبع التجارب والمتغيرات والأهمية الإحصائية" : "Track experiments, variants, and statistical significance"}
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" />
              {isAr ? "تجربة جديدة" : "New Experiment"}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{isAr ? "إنشاء تجربة جديدة" : "Create New Experiment"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <Label>{isAr ? "اسم التجربة" : "Experiment Name"}</Label>
                <Input placeholder={isAr ? "مثال: لون زر الشراء" : "e.g., Purchase Button Color"} />
              </div>
              <div>
                <Label>{isAr ? "المقياس المستهدف" : "Target Metric"}</Label>
                <Select>
                  <SelectTrigger><SelectValue placeholder={isAr ? "اختر مقياس" : "Select metric"} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="click_rate">{isAr ? "معدل النقر" : "Click Rate"}</SelectItem>
                    <SelectItem value="signup_rate">{isAr ? "معدل التسجيل" : "Signup Rate"}</SelectItem>
                    <SelectItem value="purchase_rate">{isAr ? "معدل الشراء" : "Purchase Rate"}</SelectItem>
                    <SelectItem value="engagement">{isAr ? "التفاعل" : "Engagement"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full">{isAr ? "إنشاء" : "Create"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-4 pb-4 flex items-center gap-3">
            <div className="rounded-xl bg-chart-2/10 p-2.5"><FlaskConical className="h-5 w-5 text-chart-2" /></div>
            <div>
              <AnimatedCounter value={experiments.filter(e => e.status === "running").length} className="text-2xl" />
              <p className="text-xs text-muted-foreground">{isAr ? "تجارب جارية" : "Running"}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 flex items-center gap-3">
            <div className="rounded-xl bg-chart-5/10 p-2.5"><CheckCircle2 className="h-5 w-5 text-chart-5" /></div>
            <div>
              <AnimatedCounter value={experiments.filter(e => e.status === "concluded").length} className="text-2xl" />
              <p className="text-xs text-muted-foreground">{isAr ? "منتهية" : "Concluded"}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 flex items-center gap-3">
            <div className="rounded-xl bg-primary/10 p-2.5"><BarChart3 className="h-5 w-5 text-primary" /></div>
            <div>
              <AnimatedCounter value={experiments.reduce((sum, e) => sum + e.variants.reduce((s, v) => s + v.visitors, 0), 0)} className="text-2xl" />
              <p className="text-xs text-muted-foreground">{isAr ? "إجمالي الزوار" : "Total Visitors"}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Experiments Table */}
      <Card>
        <CardContent className="pt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{isAr ? "التجربة" : "Experiment"}</TableHead>
                <TableHead>{isAr ? "الحالة" : "Status"}</TableHead>
                <TableHead>{isAr ? "المتغيرات" : "Variants"}</TableHead>
                <TableHead>{isAr ? "الثقة" : "Confidence"}</TableHead>
                <TableHead>{isAr ? "الفائز" : "Winner"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {experiments.map(exp => (
                <TableRow key={exp.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedExp(exp)}>
                  <TableCell className="font-medium">{isAr ? exp.nameAr : exp.name}</TableCell>
                  <TableCell>{getStatusBadge(exp.status)}</TableCell>
                  <TableCell>{exp.variants.length}</TableCell>
                  <TableCell>
                    <span className={`font-medium ${getConfidenceColor(exp.confidence)}`}>
                      {exp.confidence > 0 ? `${exp.confidence}%` : "—"}
                    </span>
                  </TableCell>
                  <TableCell>
                    {exp.winner ? (
                      <Badge className="bg-chart-5/10 text-chart-5 border-chart-5/20 gap-1">
                        <CheckCircle2 className="h-3 w-3" />{exp.winner}
                      </Badge>
                    ) : exp.status === "running" ? (
                      <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />{isAr ? "قيد التقييم" : "Evaluating"}</span>
                    ) : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Selected Experiment Detail */}
      {selectedExp && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <FlaskConical className="h-4 w-4 text-primary" />
              {isAr ? selectedExp.nameAr : selectedExp.name}
              {getStatusBadge(selectedExp.status)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={selectedExp.variants.map(v => ({
                  name: v.name,
                  rate: parseFloat(conversionRate(v.conversions, v.visitors)),
                }))}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => `${v}%`} />
                  <Bar dataKey="rate" radius={[6, 6, 0, 0]}>
                    {selectedExp.variants.map((v, i) => (
                      <Cell key={i} fill={v.name === selectedExp.winner ? "hsl(var(--chart-5))" : "hsl(var(--primary))"} opacity={0.8} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              {selectedExp.variants.map((v, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-xl border">
                  <span className="text-sm font-medium">{v.name}</span>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-muted-foreground">{v.visitors.toLocaleString()} {isAr ? "زائر" : "visitors"}</span>
                    <span className="text-muted-foreground">{v.conversions.toLocaleString()} {isAr ? "تحويل" : "conversions"}</span>
                    <span className="font-bold">{conversionRate(v.conversions, v.visitors)}%</span>
                  </div>
                </div>
              ))}
            </div>
            {selectedExp.confidence >= 95 && (
              <div className="mt-3 p-2 rounded-xl bg-chart-5/5 border border-chart-5/20 text-sm text-chart-5 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                {isAr ? "أهمية إحصائية مؤكدة (≥95%)" : "Statistically significant result (≥95%)"}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
