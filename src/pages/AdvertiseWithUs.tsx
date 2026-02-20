import { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import {
  Megaphone, Target, BarChart3, Globe, Users, CheckCircle2,
  Sparkles, ArrowRight, Loader2, Eye, MousePointer, DollarSign,
  Zap, Clock, Building2,
} from "lucide-react";

const AD_FORMATS = [
  { id: "banner", en: "Banner / Display", ar: "بانر / عرض", desc: "Classic display ads across the platform" },
  { id: "video", en: "Video Ad", ar: "إعلان فيديو", desc: "Engaging video placements" },
  { id: "sponsored", en: "Sponsored Content", ar: "محتوى مدعوم", desc: "Native content integration" },
  { id: "email", en: "Email Newsletter", ar: "النشرة البريدية", desc: "Targeted email placements" },
];

const PACKAGES = [
  {
    tier: "starter",
    nameEn: "Starter",
    nameAr: "المبتدئ",
    price: 500,
    currency: "SAR",
    features: { en: ["1 Banner placement", "7-day campaign", "Basic analytics", "5,000 impressions"], ar: ["إعلان بانر واحد", "حملة لمدة 7 أيام", "تحليلات أساسية", "5,000 ظهور"] },
    highlight: false,
  },
  {
    tier: "growth",
    nameEn: "Growth",
    nameAr: "النمو",
    price: 2000,
    currency: "SAR",
    features: { en: ["3 placements", "30-day campaign", "Advanced analytics", "25,000 impressions", "AI optimization"], ar: ["3 مواضع إعلانية", "حملة لمدة 30 يوماً", "تحليلات متقدمة", "25,000 ظهور", "تحسين بالذكاء الاصطناعي"] },
    highlight: true,
  },
  {
    tier: "enterprise",
    nameEn: "Enterprise",
    nameAr: "المؤسسي",
    price: 0,
    currency: "SAR",
    features: { en: ["Unlimited placements", "Custom campaign length", "Dedicated account manager", "Real-time dashboard", "Custom integrations"], ar: ["مواضع غير محدودة", "مدة حملة مخصصة", "مدير حساب مخصص", "لوحة تحكم في الوقت الفعلي", "تكاملات مخصصة"] },
    highlight: false,
  },
];

const STATS = [
  { value: "50K+", labelEn: "Monthly Users", labelAr: "مستخدم شهرياً", icon: Users },
  { value: "120+", labelEn: "Countries", labelAr: "دولة", icon: Globe },
  { value: "8min", labelEn: "Avg. Session", labelAr: "متوسط الجلسة", icon: Clock },
  { value: "4.2%", labelEn: "Avg. CTR", labelAr: "معدل النقر", icon: MousePointer },
];

export default function AdvertiseWithUs() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const isAr = language === "ar";
  const qc = useQueryClient();

  const [form, setForm] = useState({
    title: "",
    title_ar: "",
    description: "",
    description_ar: "",
    request_type: "banner",
    budget: "",
    currency: "SAR",
    desired_start_date: "",
    desired_end_date: "",
    package_id: "",
  });

  const { data: company } = useQuery({
    queryKey: ["my-company", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("company_contacts")
        .select("company_id, companies(id, name, name_ar, logo_url)")
        .eq("user_id", user.id)
        .maybeSingle();
      return data?.companies as any;
    },
    enabled: !!user,
  });

  const { data: myRequests = [] } = useQuery({
    queryKey: ["my-ad-requests", company?.id],
    queryFn: async () => {
      if (!company?.id) return [];
      const { data } = await supabase
        .from("ad_requests")
        .select("*")
        .eq("company_id", company.id)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!company?.id,
    staleTime: 1000 * 60,
  });

  const submit = useMutation({
    mutationFn: async () => {
      if (!user || !company?.id) throw new Error("Company account required");
      const { error } = await supabase.from("ad_requests").insert({
        company_id: company.id,
        created_by: user.id,
        title: form.title,
        title_ar: form.title_ar || null,
        description: form.description || null,
        description_ar: form.description_ar || null,
        request_type: form.request_type,
        budget: form.budget ? parseFloat(form.budget) : null,
        currency: form.currency,
        desired_start_date: form.desired_start_date || null,
        desired_end_date: form.desired_end_date || null,
        package_id: form.package_id || null,
        status: "pending",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: isAr ? "تم إرسال طلب الإعلان بنجاح!" : "Ad request submitted successfully!" });
      setForm({ title: "", title_ar: "", description: "", description_ar: "", request_type: "banner", budget: "", currency: "SAR", desired_start_date: "", desired_end_date: "", package_id: "" });
      qc.invalidateQueries({ queryKey: ["my-ad-requests"] });
    },
    onError: (e: any) => toast({ title: isAr ? "حدث خطأ" : "Error", description: e.message, variant: "destructive" }),
  });

  const statusConfig: Record<string, { en: string; ar: string; cls: string }> = {
    pending: { en: "Pending Review", ar: "قيد المراجعة", cls: "bg-chart-4/15 text-chart-4" },
    approved: { en: "Approved", ar: "موافق عليه", cls: "bg-primary/15 text-primary" },
    rejected: { en: "Rejected", ar: "مرفوض", cls: "bg-destructive/15 text-destructive" },
    active: { en: "Active", ar: "نشط", cls: "bg-chart-5/15 text-chart-5" },
  };

  return (
    <div className="flex min-h-screen flex-col">
      <SEOHead
        title={isAr ? "أعلن معنا — Altoha" : "Advertise With Us — Altoha"}
        description={isAr ? "وصّل علامتك التجارية لأكثر من 50,000 محترف طهي" : "Reach 50,000+ culinary professionals with targeted advertising on Altoha"}
      />
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border/40">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(var(--primary)/0.12),transparent_60%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,hsl(var(--accent)/0.08),transparent_50%)]" />
          <div className="container relative py-14 md:py-20">
            <div className="max-w-2xl space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 ring-1 ring-primary/20">
                <Megaphone className="h-4 w-4 text-primary" />
                <span className="text-xs font-bold uppercase tracking-widest text-primary">
                  {isAr ? "أعلن معنا" : "Advertise With Us"}
                </span>
              </div>
              <h1 className="font-serif text-4xl font-bold md:text-5xl leading-tight">
                {isAr ? "صِل إلى نخبة الطهاة ومحترفي الغذاء" : "Reach the World's Culinary Elite"}
              </h1>
              <p className="text-muted-foreground text-lg leading-relaxed">
                {isAr
                  ? "منصة ألطوها تضم أكثر من 50,000 طاهٍ محترف وخبير غذائي. إعلاناتك ستصل لمن يهمك."
                  : "Altoha connects your brand with 50,000+ professional chefs, judges, and food industry experts worldwide."}
              </p>
              {!company && (
                <Button asChild className="gap-2 shadow-lg shadow-primary/20">
                  <Link to="/register-company">
                    <Building2 className="h-4 w-4" />
                    {isAr ? "سجّل شركتك أولاً" : "Register Your Company First"}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              )}
            </div>

            {/* Platform stats */}
            <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {STATS.map((s) => (
                <Card key={s.value} className="border-border/40 bg-card/60 backdrop-blur-sm">
                  <CardContent className="flex items-center gap-3 p-4">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                      <s.icon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xl font-black">{s.value}</p>
                      <p className="text-[10px] text-muted-foreground">{isAr ? s.labelAr : s.labelEn}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Packages */}
        <section className="container py-14 md:py-16">
          <div className="mb-8 text-center">
            <h2 className="font-serif text-2xl font-bold md:text-3xl mb-2">
              {isAr ? "باقات الإعلان" : "Advertising Packages"}
            </h2>
            <p className="text-muted-foreground">{isAr ? "اختر الباقة المناسبة لأهدافك" : "Choose the package that fits your goals"}</p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {PACKAGES.map((pkg) => (
              <Card
                key={pkg.tier}
                className={`relative border-2 transition-all duration-200 hover:shadow-lg ${
                  pkg.highlight ? "border-primary shadow-primary/10 shadow-md" : "border-border/50"
                }`}
              >
                {pkg.highlight && (
                  <div className="absolute -top-3 start-1/2 -translate-x-1/2">
                    <Badge className="px-3 py-1 gap-1 shadow-sm">
                      <Sparkles className="h-3 w-3" />
                      {isAr ? "الأكثر شعبية" : "Most Popular"}
                    </Badge>
                  </div>
                )}
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{isAr ? pkg.nameAr : pkg.nameEn}</CardTitle>
                  <div className="mt-1">
                    {pkg.price > 0 ? (
                      <p className="text-3xl font-black text-primary">
                        {pkg.price.toLocaleString()} <span className="text-base font-normal text-muted-foreground">{pkg.currency}</span>
                      </p>
                    ) : (
                      <p className="text-xl font-bold text-muted-foreground">{isAr ? "تواصل معنا" : "Contact Us"}</p>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <ul className="space-y-2">
                    {(isAr ? pkg.features.ar : pkg.features.en).map((f, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  {pkg.price > 0 ? (
                    <Button
                      variant={pkg.highlight ? "default" : "outline"}
                      className="w-full mt-2"
                      onClick={() => setForm(f => ({ ...f, package_id: pkg.tier }))}
                    >
                      {isAr ? "اختر هذه الباقة" : "Select Package"}
                    </Button>
                  ) : (
                    <Button variant="outline" className="w-full mt-2" asChild>
                      <Link to="/contact">{isAr ? "تواصل معنا" : "Contact Sales"}</Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <Separator />

        {/* Ad Request Form */}
        <section className="container py-14 md:py-16">
          <div className="grid gap-10 lg:grid-cols-2">
            <div>
              <h2 className="font-serif text-2xl font-bold mb-2">{isAr ? "ابدأ حملتك الإعلانية" : "Start Your Campaign"}</h2>
              <p className="text-muted-foreground mb-6">{isAr ? "أرسل طلبك وسيتواصل معك فريقنا خلال 24 ساعة." : "Submit your request and our team will reach out within 24 hours."}</p>

              {!user ? (
                <Card className="border-border/50">
                  <CardContent className="flex flex-col items-center py-10 text-center gap-3">
                    <Megaphone className="h-10 w-10 text-muted-foreground/30" />
                    <p className="font-medium">{isAr ? "يجب تسجيل الدخول أولاً" : "Sign in required"}</p>
                    <Button asChild><Link to="/login">{isAr ? "تسجيل الدخول" : "Sign In"}</Link></Button>
                  </CardContent>
                </Card>
              ) : !company ? (
                <Card className="border-border/50">
                  <CardContent className="flex flex-col items-center py-10 text-center gap-3">
                    <Building2 className="h-10 w-10 text-muted-foreground/30" />
                    <p className="font-medium">{isAr ? "يلزم وجود حساب شركة للإعلان" : "Company account required to advertise"}</p>
                    <Button asChild><Link to="/register-company">{isAr ? "تسجيل شركة" : "Register Company"}</Link></Button>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-border/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground font-normal">
                      <Building2 className="h-4 w-4" />
                      {isAr ? "الإعلان باسم:" : "Advertising as:"} <span className="font-semibold text-foreground">{isAr && (company as any).name_ar ? (company as any).name_ar : (company as any).name}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label className="text-xs">{isAr ? "عنوان الحملة (EN)" : "Campaign Title (EN)"} *</Label>
                        <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="My Campaign" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">{isAr ? "العنوان (AR)" : "Title (AR)"}</Label>
                        <Input dir="rtl" value={form.title_ar} onChange={e => setForm(f => ({ ...f, title_ar: e.target.value }))} placeholder="حملتي الإعلانية" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">{isAr ? "نوع الإعلان" : "Ad Format"} *</Label>
                      <Select value={form.request_type} onValueChange={v => setForm(f => ({ ...f, request_type: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {AD_FORMATS.map(af => (
                            <SelectItem key={af.id} value={af.id}>{isAr ? af.ar : af.en}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">{isAr ? "وصف الحملة" : "Campaign Description"}</Label>
                      <Textarea rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder={isAr ? "صف حملتك وأهدافها..." : "Describe your campaign and goals..."} className="resize-none" />
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">{isAr ? "الميزانية" : "Budget"}</Label>
                        <Input type="number" min={0} value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value }))} placeholder="5000" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">{isAr ? "تاريخ البدء" : "Start Date"}</Label>
                        <Input type="date" value={form.desired_start_date} onChange={e => setForm(f => ({ ...f, desired_start_date: e.target.value }))} />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">{isAr ? "تاريخ الانتهاء" : "End Date"}</Label>
                        <Input type="date" value={form.desired_end_date} onChange={e => setForm(f => ({ ...f, desired_end_date: e.target.value }))} />
                      </div>
                    </div>
                    <Button
                      className="w-full shadow-md shadow-primary/15"
                      onClick={() => submit.mutate()}
                      disabled={!form.title || submit.isPending}
                    >
                      {submit.isPending ? <><Loader2 className="me-2 h-4 w-4 animate-spin" />{isAr ? "جارٍ الإرسال..." : "Submitting..."}</> : <><Megaphone className="me-2 h-4 w-4" />{isAr ? "إرسال طلب الإعلان" : "Submit Ad Request"}</>}
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Why advertise + my requests */}
            <div className="space-y-6">
              <Card className="border-border/50 bg-muted/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Target className="h-4 w-4 text-primary" />
                    {isAr ? "لماذا تُعلن معنا؟" : "Why Advertise With Us?"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { icon: Users, en: "50,000+ verified culinary professionals", ar: "أكثر من 50,000 محترف طهي موثق" },
                    { icon: Globe, en: "Audience in 120+ countries", ar: "جمهور في أكثر من 120 دولة" },
                    { icon: Target, en: "Hyper-targeted by role, specialty & country", ar: "استهداف دقيق بالدور والتخصص والدولة" },
                    { icon: BarChart3, en: "Real-time campaign analytics dashboard", ar: "لوحة تحليلات حملة في الوقت الفعلي" },
                    { icon: Zap, en: "AI-powered optimization", ar: "تحسين مدعوم بالذكاء الاصطناعي" },
                    { icon: Eye, en: "Multiple formats: banner, video, sponsored", ar: "صيغ متعددة: بانر، فيديو، محتوى مدعوم" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <item.icon className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <p className="text-sm">{isAr ? item.ar : item.en}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* My previous requests */}
              {myRequests.length > 0 && (
                <Card className="border-border/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">{isAr ? "طلباتي السابقة" : "My Previous Requests"}</CardTitle>
                  </CardHeader>
                  <CardContent className="divide-y">
                    {myRequests.slice(0, 5).map((req: any) => {
                      const sc = statusConfig[req.status] || statusConfig.pending;
                      return (
                        <div key={req.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{req.title}</p>
                            <p className="text-[10px] text-muted-foreground">{new Date(req.created_at).toLocaleDateString()}</p>
                          </div>
                          <Badge className={`shrink-0 text-[10px] ${sc.cls}`}>{isAr ? sc.ar : sc.en}</Badge>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
