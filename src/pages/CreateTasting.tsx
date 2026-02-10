import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { useCreateTastingSession, useAddTastingCriteria, useCriteriaPresets, EvalMethod } from "@/hooks/useTasting";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { ArrowLeft, UtensilsCrossed } from "lucide-react";

export default function CreateTasting() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const navigate = useNavigate();
  const createSession = useCreateTastingSession();
  const addCriteria = useAddTastingCriteria();
  const { data: presets } = useCriteriaPresets();

  const [form, setForm] = useState({
    title: "",
    title_ar: "",
    description: "",
    description_ar: "",
    eval_method: "numeric" as EvalMethod,
    preset: "",
    session_date: "",
    venue: "",
    venue_ar: "",
    city: "",
    country: "",
    is_blind_tasting: false,
    allow_notes: true,
  });

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
        description_ar: form.description_ar || null,
        eval_method: form.eval_method,
        session_date: form.session_date || null,
        venue: form.venue || null,
        venue_ar: form.venue_ar || null,
        city: form.city || null,
        country: form.country || null,
        is_blind_tasting: form.is_blind_tasting,
        allow_notes: form.allow_notes,
        status: "draft" as any,
      });

      // Add preset criteria if selected
      if (form.preset && presets) {
        const preset = presets.find(p => p.id === form.preset);
        if (preset?.criteria) {
          const criteriaToAdd = preset.criteria.map((c, i) => ({
            session_id: session.id,
            name: c.name,
            name_ar: c.name_ar,
            description: c.description || null,
            max_score: c.max_score,
            weight: c.weight,
            sort_order: i,
          }));
          await addCriteria.mutateAsync(criteriaToAdd);
        }
      }

      toast.success(isAr ? "تم إنشاء الجلسة" : "Session created");
      navigate(`/tastings/${session.id}`);
    } catch (err) {
      toast.error(isAr ? "حدث خطأ" : "Failed to create session");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <SEOHead title={isAr ? "إنشاء جلسة تذوق" : "Create Tasting Session"} />
      <div className="min-h-screen bg-background" dir={isAr ? "rtl" : "ltr"}>
        <Header />
        <main className="container mx-auto max-w-2xl px-4 py-8">
          <Button variant="ghost" onClick={() => navigate("/tastings")} className="mb-6 gap-2">
            <ArrowLeft className="h-4 w-4" />
            {isAr ? "العودة" : "Back"}
          </Button>

          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <UtensilsCrossed className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{isAr ? "جلسة تذوق جديدة" : "New Tasting Session"}</h1>
              <p className="text-sm text-muted-foreground">{isAr ? "أنشئ جلسة تقييم طعام" : "Set up a food evaluation session"}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <Card>
              <CardHeader><CardTitle className="text-base">{isAr ? "المعلومات الأساسية" : "Basic Info"}</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>{isAr ? "العنوان (إنجليزي)" : "Title (English)"} *</Label>
                    <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>{isAr ? "العنوان (عربي)" : "Title (Arabic)"}</Label>
                    <Input value={form.title_ar} onChange={e => setForm(f => ({ ...f, title_ar: e.target.value }))} dir="rtl" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>{isAr ? "الوصف" : "Description"}</Label>
                  <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} />
                </div>
              </CardContent>
            </Card>

            {/* Evaluation Method */}
            <Card>
              <CardHeader><CardTitle className="text-base">{isAr ? "طريقة التقييم" : "Evaluation Method"}</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <RadioGroup value={form.eval_method} onValueChange={(v) => setForm(f => ({ ...f, eval_method: v as EvalMethod }))}>
                  <div className="flex items-center gap-3 rounded-lg border p-3">
                    <RadioGroupItem value="numeric" id="numeric" />
                    <Label htmlFor="numeric" className="flex-1 cursor-pointer">
                      <span className="font-medium">{isAr ? "تقييم رقمي (1-10)" : "Numeric Scoring (1-10)"}</span>
                      <p className="text-xs text-muted-foreground">{isAr ? "نقاط رقمية لكل معيار" : "Numeric points per criterion"}</p>
                    </Label>
                  </div>
                  <div className="flex items-center gap-3 rounded-lg border p-3">
                    <RadioGroupItem value="stars" id="stars" />
                    <Label htmlFor="stars" className="flex-1 cursor-pointer">
                      <span className="font-medium">{isAr ? "تقييم بالنجوم (1-5)" : "Star Rating (1-5)"}</span>
                      <p className="text-xs text-muted-foreground">{isAr ? "تقييم نجوم بسيط" : "Simple star-based rating"}</p>
                    </Label>
                  </div>
                  <div className="flex items-center gap-3 rounded-lg border p-3">
                    <RadioGroupItem value="pass_fail" id="pass_fail" />
                    <Label htmlFor="pass_fail" className="flex-1 cursor-pointer">
                      <span className="font-medium">{isAr ? "نجاح / رسوب" : "Pass / Fail"}</span>
                      <p className="text-xs text-muted-foreground">{isAr ? "تقييم ثنائي مع ملاحظات" : "Binary assessment with comments"}</p>
                    </Label>
                  </div>
                </RadioGroup>

                {/* Criteria Preset */}
                <div className="space-y-2">
                  <Label>{isAr ? "قالب المعايير" : "Criteria Preset"}</Label>
                  <Select value={form.preset} onValueChange={v => setForm(f => ({ ...f, preset: v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder={isAr ? "اختر قالب..." : "Select a preset..."} />
                    </SelectTrigger>
                    <SelectContent>
                      {presets?.map(p => (
                        <SelectItem key={p.id} value={p.id}>
                          {isAr && p.preset_name_ar ? p.preset_name_ar : p.preset_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-medium">{isAr ? "تذوق أعمى" : "Blind Tasting"}</p>
                    <p className="text-xs text-muted-foreground">{isAr ? "إخفاء أسماء الأطباق عن الحكام" : "Hide dish names from judges"}</p>
                  </div>
                  <Switch checked={form.is_blind_tasting} onCheckedChange={v => setForm(f => ({ ...f, is_blind_tasting: v }))} />
                </div>

                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-medium">{isAr ? "السماح بالملاحظات" : "Allow Notes"}</p>
                    <p className="text-xs text-muted-foreground">{isAr ? "ملاحظات نصية لكل تقييم" : "Free-text notes per evaluation"}</p>
                  </div>
                  <Switch checked={form.allow_notes} onCheckedChange={v => setForm(f => ({ ...f, allow_notes: v }))} />
                </div>
              </CardContent>
            </Card>

            {/* Date & Location */}
            <Card>
              <CardHeader><CardTitle className="text-base">{isAr ? "التاريخ والموقع" : "Date & Location"}</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>{isAr ? "تاريخ الجلسة" : "Session Date"}</Label>
                  <Input type="datetime-local" value={form.session_date} onChange={e => setForm(f => ({ ...f, session_date: e.target.value }))} />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>{isAr ? "المكان" : "Venue"}</Label>
                    <Input value={form.venue} onChange={e => setForm(f => ({ ...f, venue: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>{isAr ? "المدينة" : "City"}</Label>
                    <Input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? (isAr ? "جارٍ الإنشاء..." : "Creating...") : (isAr ? "إنشاء الجلسة" : "Create Session")}
            </Button>
          </form>
        </main>
        <Footer />
      </div>
    </>
  );
}
