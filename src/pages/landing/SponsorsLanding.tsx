import { useState } from "react";
import { Trophy, Users, Globe, TrendingUp, CheckCircle, ArrowRight, Sparkles } from "lucide-react";
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
  {
    icon: Globe,
    titleEn: "Global Visibility",
    titleAr: "الظهور العالمي",
    descEn: "Reach thousands of culinary professionals and food enthusiasts worldwide",
    descAr: "الوصول إلى آلاف المحترفين في مجال الطهي وعشاق الطعام حول العالم",
  },
  {
    icon: Users,
    titleEn: "Direct Engagement",
    titleAr: "التفاعل المباشر",
    descEn: "Connect directly with chefs, judges, and culinary students",
    descAr: "التواصل المباشر مع الطهاة والحكام وطلاب الطهي",
  },
  {
    icon: Trophy,
    titleEn: "Brand Association",
    titleAr: "ارتباط العلامة التجارية",
    descEn: "Associate your brand with culinary excellence and innovation",
    descAr: "ربط علامتك التجارية بالتميز الطهوي والابتكار",
  },
  {
    icon: TrendingUp,
    titleEn: "ROI Tracking",
    titleAr: "تتبع العائد على الاستثمار",
    descEn: "Comprehensive analytics and reporting on your sponsorship impact",
    descAr: "تحليلات وتقارير شاملة عن تأثير رعايتك",
  },
];

const sponsorshipTiers = [
  {
    name: "Bronze",
    nameAr: "برونزي",
    price: "SAR 1,000",
    features: ["Logo on event materials", "Social media mentions", "Certificate of appreciation"],
    featuresAr: ["الشعار على مواد الحدث", "ذكر على وسائل التواصل", "شهادة تقدير"],
  },
  {
    name: "Silver",
    nameAr: "فضي",
    price: "SAR 5,000",
    popular: true,
    features: ["All Bronze benefits", "Booth at events", "Featured in newsletters", "Judge meet & greet"],
    featuresAr: ["جميع مزايا البرونزي", "كشك في الفعاليات", "ظهور في النشرات", "لقاء مع الحكام"],
  },
  {
    name: "Gold",
    nameAr: "ذهبي",
    price: "SAR 15,000",
    features: ["All Silver benefits", "Naming rights", "VIP access", "Custom activations", "Exclusive content"],
    featuresAr: ["جميع مزايا الفضي", "حقوق التسمية", "وصول VIP", "تنشيطات مخصصة", "محتوى حصري"],
  },
];

export default function SponsorsLanding() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    companyName: "",
    contactName: "",
    email: "",
    phone: "",
    message: "",
  });

  const isAr = language === "ar";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from("leads").insert({
        type: "sponsor",
        company_name: formData.companyName,
        contact_name: formData.contactName,
        email: formData.email,
        phone: formData.phone,
        message: formData.message,
        source: "sponsors-landing",
      });

      if (error) throw error;

      toast({
        title: isAr ? "تم الإرسال بنجاح" : "Submitted Successfully",
        description: isAr ? "سنتواصل معك قريباً" : "We'll be in touch soon",
      });

      setFormData({ companyName: "", contactName: "", email: "", phone: "", message: "" });
    } catch (error) {
      toast({
        variant: "destructive",
        title: isAr ? "خطأ" : "Error",
        description: isAr ? "حدث خطأ، يرجى المحاولة مرة أخرى" : "Something went wrong, please try again",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SEOHead title="Become a Sponsor" description="Partner with Altohaa and reach thousands of culinary professionals worldwide" />
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="border-b border-border/40 bg-gradient-to-b from-primary/5 to-background">
          <div className="container py-10 md:py-14 max-w-4xl text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-medium text-primary">
                {isAr ? "فرص رعاية حصرية" : "Exclusive Sponsorship Opportunities"}
              </span>
            </div>
            <h1 className="font-serif text-3xl font-bold md:text-4xl">
              {isAr ? "كن شريكاً في النجاح الطهوي" : "Partner with Culinary Excellence"}
            </h1>
            <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
              {isAr
                ? "انضم كراعٍ واستفد من الوصول إلى شبكة عالمية من محترفي الطهي"
                : "Join as a sponsor and gain access to a global network of culinary professionals"}
            </p>
            <Button size="lg" className="mt-6 gap-2" onClick={() => document.getElementById("sponsor-contact")?.scrollIntoView({ behavior: "smooth" })}>
              {isAr ? "ابدأ الآن" : "Get Started"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-12 md:py-16 bg-muted/30">
          <div className="container max-w-4xl">
            <div className="mb-12 text-center">
              <h2 className="text-3xl font-serif font-bold">
                {isAr ? "لماذا ترعانا؟" : "Why Sponsor Us?"}
              </h2>
              <p className="mt-2 text-muted-foreground max-w-xl mx-auto">
                {isAr
                  ? "استثمر في مجتمع الطهي المتنامي واحصل على عوائد ملموسة"
                  : "Invest in the growing culinary community and get tangible returns"}
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {benefits.map((benefit, i) => (
                <Card key={i} className="border-border/60 text-center">
                  <CardContent className="pt-6">
                    <div className="h-12 w-12 mx-auto rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                      <benefit.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold mb-1.5">
                      {isAr ? benefit.titleAr : benefit.titleEn}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {isAr ? benefit.descAr : benefit.descEn}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Tiers */}
        <section className="py-12 md:py-16">
          <div className="container max-w-4xl">
            <div className="mb-10 text-center">
              <h2 className="text-3xl font-serif font-bold">
                {isAr ? "باقات الرعاية" : "Sponsorship Tiers"}
              </h2>
              <p className="mt-2 text-muted-foreground">
                {isAr ? "اختر الباقة التي تناسب أهدافك" : "Choose the package that fits your goals"}
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto">
              {sponsorshipTiers.map((tier, i) => (
                <Card
                  key={i}
                  className={`relative overflow-hidden ${tier.popular ? "border-primary shadow-md ring-1 ring-primary/20" : "border-border/60"}`}
                >
                  {tier.popular && (
                    <div className="absolute top-0 inset-x-0 h-1 bg-primary" />
                  )}
                  <CardHeader className="text-center pb-2">
                    {tier.popular && (
                      <Badge className="mx-auto mb-2 w-fit">
                        {isAr ? "الأكثر شعبية" : "Most Popular"}
                      </Badge>
                    )}
                    <CardTitle className="text-lg">
                      {isAr ? tier.nameAr : tier.name}
                    </CardTitle>
                    <p className="text-3xl font-bold text-primary mt-1">{tier.price}</p>
                    <p className="text-xs text-muted-foreground">
                      {isAr ? "لكل مسابقة" : "per competition"}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2.5">
                      {(isAr ? tier.featuresAr : tier.features).map((feature, j) => (
                        <li key={j} className="flex items-start gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button className="w-full mt-6" variant={tier.popular ? "default" : "outline"}>
                      {isAr ? "اختر الباقة" : "Choose Plan"}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Form */}
        <section id="sponsor-contact" className="py-12 md:py-16 bg-muted/30">
          <div className="container max-w-4xl">
            <div className="max-w-2xl mx-auto">
              <div className="mb-8 text-center">
                <h2 className="text-3xl font-serif font-bold">
                  {isAr ? "تواصل معنا" : "Get in Touch"}
                </h2>
                <p className="mt-2 text-muted-foreground">
                  {isAr
                    ? "أخبرنا عن شركتك وسنتواصل معك لمناقشة الفرص"
                    : "Tell us about your company and we'll reach out to discuss opportunities"}
                </p>
              </div>
              <Card className="border-border/60">
                <CardContent className="p-6">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="companyName">
                          {isAr ? "اسم الشركة" : "Company Name"}
                        </Label>
                        <Input
                          id="companyName"
                          value={formData.companyName}
                          onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="contactName">
                          {isAr ? "اسم جهة الاتصال" : "Contact Name"}
                        </Label>
                        <Input
                          id="contactName"
                          value={formData.contactName}
                          onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">{isAr ? "البريد الإلكتروني" : "Email"}</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">{isAr ? "الهاتف" : "Phone"}</Label>
                        <Input
                          id="phone"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="message">{isAr ? "رسالتك" : "Message"}</Label>
                      <Textarea
                        id="message"
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        rows={4}
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading
                        ? (isAr ? "جاري الإرسال..." : "Sending...")
                        : (isAr ? "إرسال" : "Submit")}
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