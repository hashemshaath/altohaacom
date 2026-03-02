import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChefHat, Building2, MapPin, Calendar, Users, Award, Printer,
  Download, Target, Lightbulb, AlertTriangle, CheckCircle2, ShieldCheck,
} from "lucide-react";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell,
} from "recharts";
import { useRef, useMemo } from "react";
import { format } from "date-fns";
import { ar as arLocale } from "date-fns/locale";

const COLORS = ["hsl(var(--primary))", "hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

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

export default function EvaluationReport() {
  const { token } = useParams<{ token: string }>();
  const { language } = useLanguage();
  const isAr = language === "ar";
  const reportRef = useRef<HTMLDivElement>(null);

  const { data: session, isLoading, error } = useQuery({
    queryKey: ["public-evaluation-report", token],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chefs_table_sessions" as any)
        .select("*")
        .eq("report_token", token)
        .eq("report_published", true)
        .single();
      if (error) throw error;
      return data as any;
    },
    enabled: !!token,
  });

  const { data: evaluations = [] } = useQuery({
    queryKey: ["public-evaluations", session?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chefs_table_evaluations" as any)
        .select("*")
        .eq("session_id", session.id)
        .eq("status", "submitted")
        .eq("allow_publish", true);
      if (error) throw error;
      
      const evals = (data || []) as any[];
      if (evals.length) {
        const chefIds = evals.map(e => e.chef_id);
        const { data: profiles } = await supabase.from("profiles").select("user_id, full_name, specialization, avatar_url").in("user_id", chefIds);
        const pm = new Map((profiles || []).map(p => [p.user_id, p]));
        evals.forEach(e => { e.profile = pm.get(e.chef_id); });
      }
      return evals;
    },
    enabled: !!session?.id,
  });

  const { data: company } = useQuery({
    queryKey: ["public-company", session?.company_id],
    queryFn: async () => {
      const { data } = await supabase.from("companies").select("name, name_ar, logo_url, country_code").eq("id", session.company_id).single();
      return data;
    },
    enabled: !!session?.company_id,
  });

  const scoreCategories = useMemo(() => {
    if (!evaluations.length) return [];
    const fields = [
      { key: "taste_score", name: "Taste & Flavor", name_ar: "المذاق والنكهة" },
      { key: "texture_score", name: "Texture", name_ar: "القوام" },
      { key: "aroma_score", name: "Aroma", name_ar: "العطر" },
      { key: "presentation_score", name: "Presentation", name_ar: "التقديم" },
      { key: "versatility_score", name: "Versatility", name_ar: "التنوع" },
      { key: "value_score", name: "Value", name_ar: "القيمة" },
    ];
    return fields.map((f, i) => {
      const scores = evaluations.map(e => e[f.key]).filter(Boolean);
      const avg = scores.length ? Math.round((scores.reduce((a: number, b: number) => a + b, 0) / scores.length) * 10) / 10 : 0;
      return { ...f, avg, color: COLORS[i % COLORS.length] };
    });
  }, [evaluations]);

  const overallScore = useMemo(() => {
    const scores = evaluations.map(e => e.overall_score).filter(Boolean);
    return scores.length ? Math.round((scores.reduce((a: number, b: number) => a + b, 0) / scores.length) * 10) / 10 : 0;
  }, [evaluations]);

  const radarData = scoreCategories.map(c => ({ category: isAr ? c.name_ar : c.name, score: c.avg, fullMark: 10 }));
  const barData = scoreCategories.map(c => ({ name: isAr ? c.name_ar : c.name, score: c.avg }));

  if (isLoading) return <div className="max-w-4xl mx-auto p-8"><Skeleton className="h-96 rounded-xl" /></div>;
  
  if (error || !session) {
    return (
      <div className="max-w-lg mx-auto p-8 text-center">
        <ShieldCheck className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
        <h1 className="text-2xl font-black mb-2">{isAr ? "التقرير غير متاح" : "Report Not Available"}</h1>
        <p className="text-muted-foreground">{isAr ? "هذا التقرير غير موجود أو لم يتم نشره بعد." : "This report doesn't exist or hasn't been published yet."}</p>
      </div>
    );
  }

  const recommendedCount = evaluations.filter(e => e.is_recommended).length;
  const recommendRate = evaluations.length ? Math.round((recommendedCount / evaluations.length) * 100) : 0;

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
      {/* Print/Download Controls */}
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-chart-5" />
          <Badge variant="outline" className="text-[10px]">{isAr ? "تقرير مُتحقق منه" : "Verified Report"}</Badge>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => window.print()}>
          <Printer className="h-3.5 w-3.5" />{isAr ? "طباعة" : "Print"}
        </Button>
      </div>

      <div ref={reportRef}>
        <Card className="border-border/40 overflow-hidden">
          {/* Header */}
          <div className="bg-primary/5 border-b border-border/40 p-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="text-[10px] uppercase">{isAr ? "تقرير تقييم المنتج" : "Product Evaluation Report"}</Badge>
                  <Badge className="text-[10px]">{session.product_category}</Badge>
                </div>
                <h1 className="text-2xl font-black">{isAr && session.title_ar ? session.title_ar : session.title}</h1>
                <p className="text-sm text-muted-foreground mt-1">{isAr && session.product_name_ar ? session.product_name_ar : session.product_name}</p>
              </div>
              <div className="text-end shrink-0">
                <p className="text-[10px] text-muted-foreground uppercase">{isAr ? "التقييم العام" : "Overall Score"}</p>
                <p className={`text-5xl font-black tabular-nums ${getScoreColor(overallScore)}`}>{overallScore}</p>
                <p className={`text-sm font-bold ${getScoreColor(overallScore)}`}>{getScoreLabel(overallScore, isAr)}</p>
              </div>
            </div>
          </div>

          <CardContent className="p-6 space-y-6">
            {/* Meta */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: Building2, label: isAr ? "الشركة" : "Company", value: company ? (isAr && company.name_ar ? company.name_ar : company.name) : "—" },
                { icon: MapPin, label: isAr ? "الموقع" : "Location", value: session.city || "—" },
                { icon: Calendar, label: isAr ? "التاريخ" : "Date", value: session.session_date ? format(new Date(session.session_date), isAr ? "d MMM yyyy" : "MMM d, yyyy", isAr ? { locale: arLocale } : undefined) : "—" },
                { icon: Users, label: isAr ? "المقيّمون" : "Evaluators", value: `${evaluations.length} ${isAr ? "طهاة" : "Chefs"}` },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted">
                    <item.icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase">{item.label}</p>
                    <p className="text-sm font-bold">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>

            <Separator />

            {/* Charts */}
            {scoreCategories.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase mb-3">{isAr ? "التحليل الراداري" : "Radar Analysis"}</p>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={radarData}>
                        <PolarGrid stroke="hsl(var(--border))" />
                        <PolarAngleAxis dataKey="category" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 10]} tick={{ fontSize: 9 }} />
                        <Radar dataKey="score" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} strokeWidth={2} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase mb-3">{isAr ? "النتائج" : "Category Scores"}</p>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={barData} layout="vertical" margin={{ left: 80 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" horizontal={false} />
                        <XAxis type="number" domain={[0, 10]} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                        <YAxis dataKey="name" type="category" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} width={75} />
                        <Tooltip />
                        <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                          {barData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            <Separator />

            {/* Evaluators */}
            <p className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1.5">
              <ChefHat className="h-3.5 w-3.5" />{isAr ? "فريق التقييم" : "Evaluation Panel"}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {evaluations.map((ev: any, i: number) => (
                <div key={i} className="rounded-xl border border-border/30 p-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    {ev.profile?.avatar_url ? (
                      <img src={ev.profile.avatar_url} className="h-10 w-10 rounded-full object-cover" alt="" />
                    ) : (
                      <ChefHat className="h-5 w-5 text-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{ev.profile?.full_name || "Chef"}</p>
                    <p className="text-[10px] text-muted-foreground">{ev.profile?.specialization || "—"}</p>
                    {ev.is_recommended && <Badge className="text-[8px] h-4 mt-0.5">{isAr ? "يوصي" : "Recommends"}</Badge>}
                  </div>
                  <p className={`text-lg font-black tabular-nums ${getScoreColor(ev.overall_score || 0)}`}>{ev.overall_score}</p>
                </div>
              ))}
            </div>

            {/* Endorsements */}
            {evaluations.some((e: any) => e.endorsement_text) && (
              <>
                <Separator />
                <p className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                  <Lightbulb className="h-3.5 w-3.5" />{isAr ? "التوصيات" : "Chef Endorsements"}
                </p>
                <div className="space-y-3">
                  {evaluations.filter((e: any) => e.endorsement_text).map((ev: any, i: number) => (
                    <div key={i} className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                      <p className="text-sm italic">"{isAr && ev.endorsement_text_ar ? ev.endorsement_text_ar : ev.endorsement_text}"</p>
                      <p className="text-xs text-muted-foreground mt-2">— {ev.profile?.full_name || "Chef"}</p>
                    </div>
                  ))}
                </div>
              </>
            )}

            <Separator />

            {/* Verdict */}
            <div className="rounded-xl border-2 border-chart-5/30 bg-chart-5/5 p-5 text-center">
              <Award className="h-8 w-8 text-chart-5 mx-auto mb-2" />
              <p className="text-lg font-black text-chart-5">
                {recommendRate >= 80 ? (isAr ? "موصى به بشدة" : "Highly Recommended") :
                 recommendRate >= 50 ? (isAr ? "موصى به" : "Recommended") :
                 (isAr ? "يحتاج مراجعة" : "Needs Review")}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {recommendRate}% {isAr ? "من الطهاة يوصون بهذا المنتج" : "of chefs recommend this product"}
              </p>
            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-border/30 flex items-center justify-between text-[10px] text-muted-foreground">
              <span>Altoha Chef's Table — {isAr ? "تقرير معتمد" : "Verified Report"}</span>
              <span>#{session.session_number || session.report_token}</span>
              <span>{session.report_published_at ? format(new Date(session.report_published_at), isAr ? "d MMMM yyyy" : "MMMM d, yyyy", isAr ? { locale: arLocale } : undefined) : ""}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
