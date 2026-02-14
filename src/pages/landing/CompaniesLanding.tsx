import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Building2, Package, Truck, BarChart3, Globe, CheckCircle, ArrowRight,
  Sparkles, ShieldCheck, Users, Star, FileText, CreditCard,
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { SEOHead } from "@/components/SEOHead";

const benefits = [
  { icon: Package, titleEn: "Product Catalog", titleAr: "كتالوج المنتجات", descEn: "Showcase your products to thousands of culinary professionals", descAr: "اعرض منتجاتك لآلاف المحترفين في مجال الطهي" },
  { icon: Truck, titleEn: "Order Management", titleAr: "إدارة الطلبات", descEn: "Complete order tracking with branch and driver management", descAr: "تتبع كامل للطلبات مع إدارة الفروع والسائقين" },
  { icon: BarChart3, titleEn: "Analytics & Reports", titleAr: "التحليلات والتقارير", descEn: "Detailed performance analytics and financial reports", descAr: "تحليلات أداء مفصلة وتقارير مالية" },
  { icon: Globe, titleEn: "Multi-Branch Support", titleAr: "دعم متعدد الفروع", descEn: "Manage branches across different countries and regions", descAr: "إدارة الفروع عبر دول ومناطق مختلفة" },
  { icon: FileText, titleEn: "Invoicing System", titleAr: "نظام الفوترة", descEn: "Professional invoicing with automated statements", descAr: "فوترة احترافية مع كشوفات آلية" },
  { icon: ShieldCheck, titleEn: "Verified Profile", titleAr: "ملف موثق", descEn: "Get verified and build trust with culinary professionals", descAr: "احصل على التوثيق وابنِ الثقة مع المحترفين" },
];

const companyTypes = [
  { nameEn: "Food Suppliers", nameAr: "موردو الأغذية", descEn: "Supply ingredients and raw materials to restaurants and events", descAr: "توريد المكونات والمواد الخام للمطاعم والفعاليات" },
  { nameEn: "Equipment Suppliers", nameAr: "موردو المعدات", descEn: "Professional kitchen equipment and culinary tools", descAr: "معدات مطابخ احترافية وأدوات طهي" },
  { nameEn: "Event Services", nameAr: "خدمات الفعاليات", descEn: "Catering, decoration, and event management services", descAr: "خدمات التموين والديكور وإدارة الفعاليات" },
  { nameEn: "Technology Partners", nameAr: "شركاء التكنولوجيا", descEn: "POS systems, kitchen management, and food tech solutions", descAr: "أنظمة نقاط البيع وإدارة المطبخ وحلول تقنية الغذاء" },
];

export default function CompaniesLanding() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ companyName: "", contactName: "", email: "", phone: "", message: "" });
  const isAr = language === "ar";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.from("leads").insert({
        type: "company",
        company_name: form.companyName,
        contact_name: form.contactName,
        email: form.email,
        phone: form.phone,
        message: form.message,
        source: "companies-landing",
      });
      if (error) throw error;
      toast({ title: isAr ? "تم الإرسال!" : "Submitted!", description: isAr ? "سنتواصل معك قريباً" : "We'll be in touch soon" });
      setForm({ companyName: "", contactName: "", email: "", phone: "", message: "" });
    } catch {
      toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: isAr ? "حدث خطأ" : "Something went wrong" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SEOHead title="For Companies" description="Complete business solutions for food companies on the Altohaa platform" />
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="border-b border-border/40 bg-gradient-to-b from-primary/5 to-background">
          <div className="container py-10 md:py-14 max-w-4xl text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-medium text-primary">{isAr ? "حلول الأعمال" : "Business Solutions"}</span>
            </div>
            <h1 className="font-serif text-3xl font-bold md:text-4xl">
              {isAr ? "طوّر أعمالك في صناعة الطهي" : "Grow Your Culinary Business"}
            </h1>
            <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
              {isAr ? "منصة متكاملة لإدارة شركتك والوصول إلى آلاف المحترفين" : "A complete platform to manage your company and reach thousands of professionals"}
            </p>
            <div className="mt-6 flex gap-3 justify-center">
              <Button size="lg" className="gap-2" asChild>
                <Link to="/register-company">{isAr ? "سجل شركتك" : "Register Your Company"}<ArrowRight className="h-4 w-4" /></Link>
              </Button>
              <Button size="lg" variant="outline" onClick={() => document.getElementById("company-contact")?.scrollIntoView({ behavior: "smooth" })}>
                {isAr ? "تواصل معنا" : "Contact Us"}
              </Button>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="border-y bg-card/80">
          <div className="container max-w-4xl grid grid-cols-3 py-8">
            {[
              { value: "500+", label: isAr ? "شركة مسجلة" : "Registered Companies", icon: Building2 },
              { value: "10K+", label: isAr ? "محترف طهي" : "Culinary Professionals", icon: Users },
              { value: "50+", label: isAr ? "دولة" : "Countries", icon: Globe },
            ].map((stat, i) => (
              <div key={i} className={`flex flex-col items-center gap-1.5 ${i > 0 ? "border-s border-border/50" : ""}`}>
                <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <stat.icon className="h-5 w-5 text-primary" />
                </div>
                <p className="text-2xl font-bold sm:text-3xl">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Benefits */}
        <section className="py-12 md:py-16">
          <div className="container max-w-4xl">
            <div className="mb-10 text-center">
              <h2 className="text-3xl font-serif font-bold">{isAr ? "مميزات بوابة الشركات" : "Company Portal Features"}</h2>
              <p className="mt-2 text-muted-foreground max-w-xl mx-auto">{isAr ? "كل ما تحتاجه لإدارة أعمالك في مكان واحد" : "Everything you need to manage your business in one place"}</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {benefits.map((b, i) => (
                <Card key={i} className="border-border/60">
                  <CardContent className="pt-6">
                    <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                      <b.icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-semibold mb-1">{isAr ? b.titleAr : b.titleEn}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{isAr ? b.descAr : b.descEn}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Company Types */}
        <section className="py-12 md:py-16 bg-muted/30">
          <div className="container max-w-4xl">
            <div className="mb-10 text-center">
              <h2 className="text-3xl font-serif font-bold">{isAr ? "أنواع الشركات" : "Company Types"}</h2>
              <p className="mt-2 text-muted-foreground">{isAr ? "نخدم جميع أنواع شركات صناعة الطهي" : "We serve all types of culinary industry companies"}</p>
            </div>
            <div className="grid md:grid-cols-2 gap-4 max-w-4xl mx-auto">
              {companyTypes.map((type, i) => (
                <Card key={i} className="border-border/60">
                  <CardContent className="p-5">
                    <h3 className="font-semibold mb-1">{isAr ? type.nameAr : type.nameEn}</h3>
                    <p className="text-sm text-muted-foreground">{isAr ? type.descAr : type.descEn}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="py-12 md:py-16">
          <div className="container max-w-4xl">
            <div className="mb-10 text-center">
              <h2 className="text-3xl font-serif font-bold">{isAr ? "الباقات" : "Plans"}</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto">
              {[
                { name: isAr ? "أساسي" : "Starter", price: isAr ? "مجاني" : "Free", features: [isAr ? "ملف شركة أساسي" : "Basic company profile", isAr ? "كتالوج محدود" : "Limited catalog", isAr ? "لوحة تحكم" : "Dashboard"] },
                { name: isAr ? "احترافي" : "Professional", price: "SAR 99/mo", popular: true, features: [isAr ? "جميع مميزات الأساسي" : "All Starter features", isAr ? "فروع متعددة" : "Multiple branches", isAr ? "تحليلات متقدمة" : "Advanced analytics", isAr ? "فوترة تلقائية" : "Auto invoicing"] },
                { name: isAr ? "مؤسسي" : "Enterprise", price: isAr ? "مخصص" : "Custom", features: [isAr ? "جميع مميزات الاحترافي" : "All Pro features", isAr ? "API مخصص" : "Custom API", isAr ? "مدير حساب مخصص" : "Dedicated account manager", isAr ? "تكامل مخصص" : "Custom integrations"] },
              ].map((plan, i) => (
                <Card key={i} className={`relative ${plan.popular ? "border-primary shadow-md ring-1 ring-primary/20" : "border-border/60"}`}>
                  {plan.popular && <div className="absolute top-0 inset-x-0 h-1 bg-primary" />}
                  <CardHeader className="text-center pb-2">
                    {plan.popular && <Badge className="mx-auto mb-2 w-fit">{isAr ? "الأكثر شعبية" : "Most Popular"}</Badge>}
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                    <p className="text-3xl font-bold text-primary mt-1">{plan.price}</p>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {plan.features.map((f, j) => (
                        <li key={j} className="flex items-start gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" /><span>{f}</span>
                        </li>
                      ))}
                    </ul>
                    <Button className="w-full mt-5" variant={plan.popular ? "default" : "outline"} asChild>
                      <Link to="/register-company">{isAr ? "ابدأ الآن" : "Get Started"}</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Form */}
        <section id="company-contact" className="py-12 md:py-16 bg-muted/30">
          <div className="container max-w-4xl">
            <div className="max-w-2xl mx-auto">
              <div className="mb-8 text-center">
                <h2 className="text-3xl font-serif font-bold">{isAr ? "تواصل معنا" : "Get in Touch"}</h2>
                <p className="mt-2 text-muted-foreground">{isAr ? "أخبرنا عن شركتك وسنساعدك في البدء" : "Tell us about your company and we'll help you get started"}</p>
              </div>
              <Card className="border-border/60">
                <CardContent className="p-6">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>{isAr ? "اسم الشركة" : "Company Name"}</Label>
                        <Input value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} required />
                      </div>
                      <div className="space-y-2">
                        <Label>{isAr ? "اسم جهة الاتصال" : "Contact Name"}</Label>
                        <Input value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} required />
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>{isAr ? "البريد الإلكتروني" : "Email"}</Label>
                        <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                      </div>
                      <div className="space-y-2">
                        <Label>{isAr ? "الهاتف" : "Phone"}</Label>
                        <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>{isAr ? "رسالتك" : "Message"}</Label>
                      <Textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={3} />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? (isAr ? "جاري الإرسال..." : "Sending...") : (isAr ? "إرسال" : "Submit")}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
