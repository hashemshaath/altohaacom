import { useState } from "react";
import { Calendar, Users, BarChart3, Shield, CheckCircle, ArrowRight, Star, Sparkles } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";

const features = [
  {
    icon: Calendar,
    titleEn: "Event Management",
    titleAr: "إدارة الفعاليات",
    descEn: "Create and manage competitions with ease. Set dates, categories, and registration periods.",
    descAr: "أنشئ وأدر المسابقات بسهولة. حدد التواريخ والفئات وفترات التسجيل.",
  },
  {
    icon: Users,
    titleEn: "Participant Management",
    titleAr: "إدارة المشاركين",
    descEn: "Handle registrations, approvals, and communications with participants seamlessly.",
    descAr: "تعامل مع التسجيلات والموافقات والتواصل مع المشاركين بسلاسة.",
  },
  {
    icon: BarChart3,
    titleEn: "Judging & Scoring",
    titleAr: "التحكيم والتقييم",
    descEn: "Set custom criteria, assign judges, and collect scores digitally.",
    descAr: "حدد معايير مخصصة، وعيّن الحكام، واجمع النتائج رقمياً.",
  },
  {
    icon: Shield,
    titleEn: "Secure & Reliable",
    titleAr: "آمن وموثوق",
    descEn: "Enterprise-grade security with data protection and backup systems.",
    descAr: "أمان على مستوى المؤسسات مع حماية البيانات وأنظمة النسخ الاحتياطي.",
  },
];

const testimonials = [
  {
    name: "Chef Ahmed Al-Hassan",
    nameAr: "الشيف أحمد الحسن",
    role: "Competition Organizer",
    roleAr: "منظم مسابقات",
    quote: "Altohaa transformed how we run our culinary events. The platform is intuitive and powerful.",
    quoteAr: "غيّرت الطهاة طريقة إدارتنا لفعاليات الطهي. المنصة سهلة الاستخدام وقوية.",
    initials: "AH",
  },
  {
    name: "Sarah Mitchell",
    nameAr: "سارة ميتشل",
    role: "Culinary School Director",
    roleAr: "مديرة مدرسة طهي",
    quote: "Our students love participating in competitions through Altohaa. It's professional and easy to use.",
    quoteAr: "يحب طلابنا المشاركة في المسابقات عبر الطهاة. إنها احترافية وسهلة الاستخدام.",
    initials: "SM",
  },
];

export default function OrganizersLanding() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    organizationName: "",
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
        type: "organization",
        company_name: formData.organizationName,
        contact_name: formData.contactName,
        email: formData.email,
        phone: formData.phone,
        message: formData.message,
        source: "organizers-landing",
      });

      if (error) throw error;

      toast({
        title: isAr ? "تم الإرسال بنجاح" : "Submitted Successfully",
        description: isAr ? "سنتواصل معك قريباً" : "We'll be in touch soon",
      });

      setFormData({ organizationName: "", contactName: "", email: "", phone: "", message: "" });
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
      <SEOHead title="For Organizers" description="Create and manage exceptional culinary competitions with Altohaa" />
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="border-b border-border/40 bg-gradient-to-b from-primary/5 to-background">
          <div className="container py-10 md:py-14 text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-medium text-primary">
                {isAr ? "منصة إدارة المسابقات" : "Competition Management Platform"}
              </span>
            </div>
            <h1 className="font-serif text-3xl font-bold md:text-4xl">
              {isAr ? "أنشئ مسابقات طهوية استثنائية" : "Create Exceptional Culinary Competitions"}
            </h1>
            <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
              {isAr
                ? "منصة متكاملة لإدارة المسابقات من التسجيل إلى الإعلان عن الفائزين"
                : "A complete platform to manage competitions from registration to announcing winners"}
            </p>
            <div className="mt-6 flex gap-3 justify-center">
              <Button size="lg" className="gap-2" asChild>
                <Link to="/register">
                  {isAr ? "ابدأ مجاناً" : "Start Free"}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/competitions">
                  {isAr ? "شاهد المسابقات" : "View Competitions"}
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-12 md:py-16">
          <div className="container">
            <div className="mb-12 text-center">
              <h2 className="text-3xl font-serif font-bold">
                {isAr ? "كل ما تحتاجه لتنظيم المسابقات" : "Everything You Need to Organize Competitions"}
              </h2>
              <p className="mt-2 text-muted-foreground max-w-2xl mx-auto">
                {isAr
                  ? "أدوات قوية وسهلة الاستخدام لإدارة جميع جوانب مسابقتك"
                  : "Powerful yet easy-to-use tools to manage every aspect of your competition"}
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {features.map((feature, i) => (
                <Card key={i} className="border-border/60">
                  <CardContent className="pt-6">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold mb-1.5">
                      {isAr ? feature.titleAr : feature.titleEn}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {isAr ? feature.descAr : feature.descEn}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-12 md:py-16 bg-muted/30">
          <div className="container">
            <div className="mb-12 text-center">
              <h2 className="text-3xl font-serif font-bold">
                {isAr ? "ماذا يقول المنظمون" : "What Organizers Say"}
              </h2>
            </div>
            <div className="grid md:grid-cols-2 gap-5">
              {testimonials.map((testimonial, i) => (
                <Card key={i} className="border-border/60">
                  <CardContent className="p-6">
                    <div className="flex gap-0.5 mb-4">
                      {[...Array(5)].map((_, j) => (
                        <Star key={j} className="h-4 w-4 fill-primary text-primary" />
                      ))}
                    </div>
                    <p className="text-muted-foreground leading-relaxed mb-5">
                      "{isAr ? testimonial.quoteAr : testimonial.quote}"
                    </p>
                    <div className="flex items-center gap-3 border-t pt-4">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                          {testimonial.initials}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-semibold leading-none">
                          {isAr ? testimonial.nameAr : testimonial.name}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {isAr ? testimonial.roleAr : testimonial.role}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA / Contact Form */}
        <section className="py-12 md:py-16">
          <div className="container">
            <div className="grid lg:grid-cols-2 gap-12 items-start mx-auto">
              <div className="lg:sticky lg:top-24">
                <h2 className="text-3xl font-serif font-bold mb-3">
                  {isAr ? "جاهز للبدء؟" : "Ready to Get Started?"}
                </h2>
                <p className="text-muted-foreground mb-6">
                  {isAr
                    ? "انضم إلى مئات المنظمين الذين يثقون في الطهاة لإدارة مسابقاتهم"
                    : "Join hundreds of organizers who trust Altohaa to manage their competitions"}
                </p>
                <ul className="space-y-3">
                  {[
                    isAr ? "إعداد مجاني بدون بطاقة ائتمان" : "Free setup, no credit card required",
                    isAr ? "دعم فني على مدار الساعة" : "24/7 technical support",
                    isAr ? "تدريب شخصي للفريق" : "Personal team training",
                    isAr ? "استيراد البيانات من أنظمة أخرى" : "Data import from other systems",
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-2.5 text-sm">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10">
                        <CheckCircle className="h-3.5 w-3.5 text-primary" />
                      </div>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <Card className="border-border/60">
                <CardHeader className="border-b bg-muted/30 px-6 py-4">
                  <CardTitle className="text-base">
                    {isAr ? "احصل على عرض توضيحي" : "Get a Demo"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="organizationName">
                        {isAr ? "اسم المنظمة" : "Organization Name"}
                      </Label>
                      <Input
                        id="organizationName"
                        value={formData.organizationName}
                        onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
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
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading
                        ? (isAr ? "جاري الإرسال..." : "Sending...")
                        : (isAr ? "طلب عرض توضيحي" : "Request Demo")}
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