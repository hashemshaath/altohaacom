import { useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useCreateTastingSession, useAddTastingCriteria, useCriteriaPresets, EvalMethod } from "@/hooks/useTasting";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { type EvaluationCategory, CATEGORIES } from "@/components/tasting/EvaluationCategorySelect";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  ArrowLeft, ArrowRight, Check, Trophy, Layers,
  Hash, Star, CheckCircle2, Eye, Wrench, Zap,
  ClipboardList, Info
} from "lucide-react";

type SessionMode = "standalone" | "competition";

const STEPS = [
  { key: "mode", icon: Layers },
  { key: "category", icon: ClipboardList },
  { key: "details", icon: Info },
] as const;

const EVAL_METHODS: { value: EvalMethod; icon: any; en: string; ar: string; desc_en: string; desc_ar: string }[] = [
  { value: "numeric", icon: Hash, en: "Numeric (0–10)", ar: "رقمي (0–10)", desc_en: "Professional numeric scale per criterion — used in ACF & WFC competitions", desc_ar: "مقياس رقمي احترافي لكل معيار — مستخدم في مسابقات ACF و WFC" },
  { value: "stars", icon: Star, en: "Star Rating (1–5)", ar: "تقييم بالنجوم (1–5)", desc_en: "Simple star-based rating for quick assessments", desc_ar: "تقييم نجوم بسيط للتقييمات السريعة" },
  { value: "pass_fail", icon: CheckCircle2, en: "Pass / Fail", ar: "نجاح / رسوب", desc_en: "Binary assessment with mandatory comments", desc_ar: "تقييم ثنائي مع ملاحظات إلزامية" },
];

const STAGES_INFO = [
  { icon: Eye, en: "Visual", ar: "بصري", color: "text-chart-1" },
  { icon: Wrench, en: "Technical", ar: "تقني", color: "text-chart-2" },
  { icon: Zap, en: "Performance", ar: "أداء", color: "text-chart-3" },
];

export default function CreateTasting() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedCompetitionId = searchParams.get("competition_id");

  const createSession = useCreateTastingSession();
  const addCriteria = useAddTastingCriteria();
  const { data: presets } = useCriteriaPresets();

  const [step, setStep] = useState(0);
  const [mode, setMode] = useState<SessionMode>(preselectedCompetitionId ? "competition" : "standalone");

  const { data: competitions } = useQuery({
    queryKey: ["active-competitions-for-tasting"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("competitions")
        .select("id, title, title_ar, status, competition_start")
        .in("status", ["draft", "registration_open", "registration_closed", "in_progress", "judging"])
        .order("competition_start", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
    enabled: mode === "competition",
  });

  const [form, setForm] = useState({
    title: "",
    title_ar: "",
    description: "",
    eval_method: "numeric" as EvalMethod,
    evaluation_category: "culinary" as EvaluationCategory,
    preset: "",
    session_date: "",
    venue: "",
    city: "",
    is_blind_tasting: false,
    allow_notes: true,
    competition_id: preselectedCompetitionId || "",
  });

  const [submitting, setSubmitting] = useState(false);

  const selectedCategory = CATEGORIES.find(c => c.value === form.evaluation_category);
  const filteredPresets = useMemo(() =>
    presets?.filter(p => p.category === form.evaluation_category || p.category === "classic" || p.category === "professional") || [],
    [presets, form.evaluation_category]
  );
  const selectedPreset = filteredPresets.find(p => p.id === form.preset);

  const canProceed = () => {
    if (step === 0) return mode === "standalone" || !!form.competition_id;
    if (step === 1) return !!form.evaluation_category;
    if (step === 2) return !!form.title.trim();
    return true;
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      toast.error(isAr ? "يرجى إدخال العنوان" : "Please enter a title");
      return;
    }
    setSubmitting(true);
    try {
      const session = await createSession.mutateAsync({
        title: form.title,
        title_ar: form.title_ar || null,
        description: form.description || null,
        eval_method: form.eval_method,
        evaluation_category: form.evaluation_category,
        session_date: form.session_date || null,
        venue: form.venue || null,
        city: form.city || null,
        is_blind_tasting: form.is_blind_tasting,
        allow_notes: form.allow_notes,
        competition_id: mode === "competition" ? form.competition_id : null,
        status: "draft" as any,
      });

      if (form.preset && presets) {
        const preset = presets.find(p => p.id === form.preset);
        if (preset?.criteria) {
          await addCriteria.mutateAsync(
            preset.criteria.map((c, i) => ({
              session_id: session.id,
              name: c.name,
              name_ar: c.name_ar,
              description: c.description || null,
              max_score: c.max_score,
              weight: c.weight,
              sort_order: i,
            }))
          );
        }
      }

      toast.success(isAr ? "تم إنشاء الجلسة بنجاح" : "Session created successfully");
      navigate(`/tastings/${session.id}`);
    } catch {
      toast.error(isAr ? "حدث خطأ" : "Failed to create session");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Step Renderers ──────────────────────────────

  const renderStepMode = () => (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">{isAr ? "ما نوع الجلسة؟" : "What type of session?"}</h2>
      <p className="text-sm text-muted-foreground">{isAr ? "اختر نوع التقييم الذي تريد إنشاءه" : "Choose the evaluation type you want to create"}</p>

      <div className="grid gap-3 sm:grid-cols-2">
        {([
          { value: "competition" as SessionMode, icon: Trophy, en: "Competition Evaluation", ar: "تقييم مسابقة", desc_en: "Linked to a specific competition. Scores affect rankings, certificates, and results.", desc_ar: "مرتبط بمسابقة محددة. النتائج تؤثر على الترتيب والشهادات." },
          { value: "standalone" as SessionMode, icon: Layers, en: "Product Tasting", ar: "تذوق منتجات", desc_en: "Independent session for evaluating products, recipes, or dishes without competition.", desc_ar: "جلسة مستقلة لتقييم المنتجات أو الوصفات بدون مسابقة." },
        ]).map(opt => {
          const Icon = opt.icon;
          const active = mode === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => setMode(opt.value)}
              className={`relative flex flex-col items-start gap-3 rounded-xl border-2 p-5 text-start transition-all ${active ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:border-primary/30 hover:bg-muted/30"}`}
            >
              {active && <div className="absolute end-3 top-3"><Check className="h-5 w-5 text-primary" /></div>}
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold">{isAr ? opt.ar : opt.en}</p>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{isAr ? opt.desc_ar : opt.desc_en}</p>
              </div>
            </button>
          );
        })}
      </div>

      {mode === "competition" && (
        <div className="space-y-2 pt-2">
          <Label className="text-sm font-medium">{isAr ? "اختر المسابقة" : "Select Competition"}</Label>
          <Select value={form.competition_id} onValueChange={v => setForm(f => ({ ...f, competition_id: v }))}>
            <SelectTrigger>
              <SelectValue placeholder={isAr ? "اختر المسابقة..." : "Choose competition..."} />
            </SelectTrigger>
            <SelectContent>
              {competitions?.map(c => (
                <SelectItem key={c.id} value={c.id}>
                  <span>{isAr && c.title_ar ? c.title_ar : c.title}</span>
                  <Badge variant="outline" className="ms-2 text-[10px]">{c.status.replace("_", " ")}</Badge>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );

  const renderStepCategory = () => (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">{isAr ? "فئة التقييم" : "Evaluation Category"}</h2>
      <p className="text-sm text-muted-foreground">{isAr ? "كل فئة تحمل معايير تقييم مختلفة مصممة وفق المعايير الدولية" : "Each category has unique criteria designed to international standards (ACF, WFC, WLAC)"}</p>

      <div className="grid gap-2 sm:grid-cols-2">
        {CATEGORIES.map(cat => {
          const Icon = cat.icon;
          const active = form.evaluation_category === cat.value;
          return (
            <button
              key={cat.value}
              type="button"
              onClick={() => setForm(f => ({ ...f, evaluation_category: cat.value, preset: "" }))}
              className={`flex items-start gap-3 rounded-xl border-2 p-4 text-start transition-all ${active ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:border-primary/30 hover:bg-muted/30"}`}
            >
              <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-sm">{isAr ? cat.ar : cat.en}</p>
                <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{isAr ? cat.desc_ar : cat.desc_en}</p>
              </div>
              {active && <Check className="ms-auto mt-1 h-4 w-4 shrink-0 text-primary" />}
            </button>
          );
        })}
      </div>

      {/* Evaluation stages diagram */}
      {selectedCategory && (
        <Card className="bg-muted/30 border-dashed">
          <CardContent className="py-4">
            <p className="text-xs font-medium text-muted-foreground mb-3">{isAr ? "مراحل التقييم المعتمدة" : "Evaluation Stages"}</p>
            <div className="flex items-center justify-center gap-2">
              {STAGES_INFO.map((s, i) => {
                const SIcon = s.icon;
                return (
                  <div key={s.en} className="flex items-center gap-2">
                    {i > 0 && <ArrowRight className="h-3 w-3 text-muted-foreground/50" />}
                    <div className="flex items-center gap-1.5 rounded-lg bg-background px-3 py-2 shadow-sm border">
                      <SIcon className={`h-3.5 w-3.5 ${s.color}`} />
                      <span className="text-xs font-medium">{isAr ? s.ar : s.en}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-[11px] text-muted-foreground text-center mt-2">
              {isAr ? "يتم تقييم كل مرحلة بشكل مستقل مع دعم الصور والملاحظات" : "Each stage is evaluated independently with image evidence & notes support"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderStepDetails = () => (
    <div className="space-y-5">
      <h2 className="text-lg font-semibold">{isAr ? "تفاصيل الجلسة" : "Session Details"}</h2>

      {/* Title */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-xs">{isAr ? "العنوان (إنجليزي)" : "Title (English)"} *</Label>
          <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder={isAr ? "مثال: تقييم لاتيه آرت 2026" : "e.g. Latte Art Evaluation 2026"} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">{isAr ? "العنوان (عربي)" : "Title (Arabic)"}</Label>
          <Input value={form.title_ar} onChange={e => setForm(f => ({ ...f, title_ar: e.target.value }))} dir="rtl" />
        </div>
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <Label className="text-xs">{isAr ? "وصف مختصر" : "Brief Description"}</Label>
        <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} placeholder={isAr ? "وصف اختياري للجلسة..." : "Optional session description..."} />
      </div>

      <Separator />

      {/* Scoring Method */}
      <div className="space-y-3">
        <Label className="text-xs font-medium">{isAr ? "طريقة التقييم" : "Scoring Method"}</Label>
        <div className="grid gap-2 sm:grid-cols-3">
          {EVAL_METHODS.map(m => {
            const MIcon = m.icon;
            const active = form.eval_method === m.value;
            return (
              <button
                key={m.value}
                type="button"
                onClick={() => setForm(f => ({ ...f, eval_method: m.value }))}
                className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-center transition-all ${active ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}
              >
                <MIcon className={`h-5 w-5 ${active ? "text-primary" : "text-muted-foreground"}`} />
                <span className="text-sm font-medium">{isAr ? m.ar : m.en}</span>
                <span className="text-[10px] text-muted-foreground leading-tight">{isAr ? m.desc_ar : m.desc_en}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Criteria Preset */}
      {filteredPresets.length > 0 && (
        <div className="space-y-2">
          <Label className="text-xs font-medium">{isAr ? "قالب المعايير الجاهز" : "Criteria Template"}</Label>
          <Select value={form.preset} onValueChange={v => setForm(f => ({ ...f, preset: v }))}>
            <SelectTrigger>
              <SelectValue placeholder={isAr ? "اختر قالباً جاهزاً (اختياري)..." : "Choose a preset (optional)..."} />
            </SelectTrigger>
            <SelectContent>
              {filteredPresets.map(p => (
                <SelectItem key={p.id} value={p.id}>
                  {isAr && p.preset_name_ar ? p.preset_name_ar : p.preset_name}
                  <Badge variant="outline" className="ms-2 text-[10px]">{p.category}</Badge>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Preview selected preset criteria */}
          {selectedPreset?.criteria && (
            <Card className="bg-muted/30 border-dashed">
              <CardContent className="py-3">
                <p className="text-xs font-medium text-muted-foreground mb-2">{isAr ? "المعايير المضمنة" : "Included Criteria"}</p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedPreset.criteria.map((c, i) => (
                    <Badge key={i} variant="secondary" className="text-[10px] font-normal">
                      {isAr ? c.name_ar : c.name} ({c.weight}%)
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <Separator />

      {/* Options */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex items-center justify-between rounded-xl border p-3">
          <div>
            <p className="text-sm font-medium">{isAr ? "تذوق أعمى" : "Blind Tasting"}</p>
            <p className="text-[10px] text-muted-foreground">{isAr ? "إخفاء الأسماء عن الحكام" : "Hide contestant names from judges"}</p>
          </div>
          <Switch checked={form.is_blind_tasting} onCheckedChange={v => setForm(f => ({ ...f, is_blind_tasting: v }))} />
        </div>
        <div className="flex items-center justify-between rounded-xl border p-3">
          <div>
            <p className="text-sm font-medium">{isAr ? "الملاحظات" : "Judge Notes"}</p>
            <p className="text-[10px] text-muted-foreground">{isAr ? "ملاحظات نصية لكل تقييم" : "Free-text notes per evaluation"}</p>
          </div>
          <Switch checked={form.allow_notes} onCheckedChange={v => setForm(f => ({ ...f, allow_notes: v }))} />
        </div>
      </div>

      {/* Date & venue */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label className="text-xs">{isAr ? "التاريخ" : "Date"}</Label>
          <Input type="datetime-local" value={form.session_date} onChange={e => setForm(f => ({ ...f, session_date: e.target.value }))} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">{isAr ? "المكان" : "Venue"}</Label>
          <Input value={form.venue} onChange={e => setForm(f => ({ ...f, venue: e.target.value }))} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">{isAr ? "المدينة" : "City"}</Label>
          <Input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
        </div>
      </div>
    </div>
  );

  const stepRenderers = [renderStepMode, renderStepCategory, renderStepDetails];

  return (
    <>
      <SEOHead title={isAr ? "إنشاء جلسة تقييم" : "Create Evaluation Session"} />
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto max-w-2xl px-4 py-8">
          {/* Back */}
          <Button variant="ghost" size="sm" onClick={() => navigate("/tastings")} className="mb-4 gap-1.5 text-muted-foreground">
            <ArrowLeft className="h-4 w-4" />
            {isAr ? "العودة" : "Back"}
          </Button>

          {/* Page Title */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight">{isAr ? "جلسة تقييم جديدة" : "New Evaluation Session"}</h1>
            <p className="text-sm text-muted-foreground mt-1">{isAr ? "أنشئ جلسة تقييم احترافية بمعايير دولية" : "Create a professional evaluation session with international standards"}</p>
          </div>

          {/* Stepper */}
          <div className="mb-8 flex items-center justify-center gap-1">
            {STEPS.map((s, i) => {
              const SIcon = s.icon;
              const done = i < step;
              const current = i === step;
              return (
                <div key={s.key} className="flex items-center gap-1">
                  {i > 0 && <div className={`h-px w-8 ${done ? "bg-primary" : "bg-border"}`} />}
                  <button
                    type="button"
                    onClick={() => i < step && setStep(i)}
                    disabled={i > step}
                    className={`flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all ${done ? "border-primary bg-primary text-primary-foreground" : current ? "border-primary text-primary" : "border-border text-muted-foreground"}`}
                  >
                    {done ? <Check className="h-4 w-4" /> : <SIcon className="h-4 w-4" />}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Step Content */}
          <Card className="border shadow-sm">
            <CardContent className="p-6">
              {stepRenderers[step]()}
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="mt-6 flex items-center justify-between">
            <Button variant="outline" onClick={() => setStep(s => s - 1)} disabled={step === 0} className="gap-1.5">
              <ArrowLeft className="h-4 w-4" />
              {isAr ? "السابق" : "Previous"}
            </Button>

            {step < STEPS.length - 1 ? (
              <Button onClick={() => setStep(s => s + 1)} disabled={!canProceed()} className="gap-1.5">
                {isAr ? "التالي" : "Next"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={submitting || !canProceed()} className="gap-1.5">
                {submitting ? (isAr ? "جارٍ الإنشاء..." : "Creating...") : (isAr ? "إنشاء الجلسة" : "Create Session")}
                <Check className="h-4 w-4" />
              </Button>
            )}
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}
