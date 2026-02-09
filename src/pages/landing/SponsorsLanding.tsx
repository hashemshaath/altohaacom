import { useState } from "react";
import { Trophy, Users, Globe, TrendingUp, CheckCircle, ArrowRight } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";

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
    price: "$1,000",
    features: ["Logo on event materials", "Social media mentions", "Certificate of appreciation"],
    featuresAr: ["الشعار على مواد الحدث", "ذكر على وسائل التواصل", "شهادة تقدير"],
  },
  {
    name: "Silver",
    nameAr: "فضي",
    price: "$5,000",
    popular: true,
    features: ["All Bronze benefits", "Booth at events", "Featured in newsletters", "Judge meet & greet"],
    featuresAr: ["جميع مزايا البرونزي", "كشك في الفعاليات", "ظهور في النشرات", "لقاء مع الحكام"],
  },
  {
    name: "Gold",
    nameAr: "ذهبي",
    price: "$15,000",
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
        title: language === "ar" ? "تم الإرسال بنجاح" : "Submitted Successfully",
        description: language === "ar" 
          ? "سنتواصل معك قريباً" 
          : "We'll be in touch soon",
      });

      setFormData({ companyName: "", contactName: "", email: "", phone: "", message: "" });
    } catch (error) {
      toast({
        variant: "destructive",
        title: language === "ar" ? "خطأ" : "Error",
        description: language === "ar" 
          ? "حدث خطأ، يرجى المحاولة مرة أخرى" 
          : "Something went wrong, please try again",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative py-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/5 to-background" />
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="font-serif text-5xl font-bold mb-6">
                {language === "ar" 
                  ? "كن شريكاً في النجاح الطهوي"
                  : "Partner with Culinary Excellence"}
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                {language === "ar"
                  ? "انضم كراعٍ واستفد من الوصول إلى شبكة عالمية من محترفي الطهي"
                  : "Join as a sponsor and gain access to a global network of culinary professionals"}
              </p>
              <Button size="lg" className="gap-2">
                {language === "ar" ? "ابدأ الآن" : "Get Started"}
                <ArrowRight className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-serif font-bold text-center mb-12">
              {language === "ar" ? "لماذا ترعانا؟" : "Why Sponsor Us?"}
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {benefits.map((benefit, i) => (
                <Card key={i} className="text-center">
                  <CardContent className="pt-6">
                    <div className="h-12 w-12 mx-auto rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                      <benefit.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold mb-2">
                      {language === "ar" ? benefit.titleAr : benefit.titleEn}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {language === "ar" ? benefit.descAr : benefit.descEn}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Tiers */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-serif font-bold text-center mb-12">
              {language === "ar" ? "باقات الرعاية" : "Sponsorship Tiers"}
            </h2>
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {sponsorshipTiers.map((tier, i) => (
                <Card 
                  key={i} 
                  className={tier.popular ? "border-primary shadow-lg relative" : ""}
                >
                  {tier.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-medium">
                        {language === "ar" ? "الأكثر شعبية" : "Most Popular"}
                      </span>
                    </div>
                  )}
                  <CardHeader className="text-center">
                    <CardTitle className="text-xl">
                      {language === "ar" ? tier.nameAr : tier.name}
                    </CardTitle>
                    <p className="text-3xl font-bold text-primary">{tier.price}</p>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {(language === "ar" ? tier.featuresAr : tier.features).map((feature, j) => (
                        <li key={j} className="flex items-center gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <Button className="w-full mt-6" variant={tier.popular ? "default" : "outline"}>
                      {language === "ar" ? "اختر الباقة" : "Choose Plan"}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Form */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-3xl font-serif font-bold text-center mb-4">
                {language === "ar" ? "تواصل معنا" : "Get in Touch"}
              </h2>
              <p className="text-center text-muted-foreground mb-8">
                {language === "ar"
                  ? "أخبرنا عن شركتك وسنتواصل معك لمناقشة الفرص"
                  : "Tell us about your company and we'll reach out to discuss opportunities"}
              </p>
              <Card>
                <CardContent className="pt-6">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="companyName">
                          {language === "ar" ? "اسم الشركة" : "Company Name"}
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
                          {language === "ar" ? "اسم جهة الاتصال" : "Contact Name"}
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
                        <Label htmlFor="email">{language === "ar" ? "البريد الإلكتروني" : "Email"}</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">{language === "ar" ? "الهاتف" : "Phone"}</Label>
                        <Input
                          id="phone"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="message">{language === "ar" ? "رسالتك" : "Message"}</Label>
                      <Textarea
                        id="message"
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        rows={4}
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading 
                        ? (language === "ar" ? "جاري الإرسال..." : "Sending...") 
                        : (language === "ar" ? "إرسال" : "Submit")}
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
