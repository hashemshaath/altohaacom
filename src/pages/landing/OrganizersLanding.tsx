import { useState } from "react";
import { Calendar, Users, BarChart3, Shield, CheckCircle, ArrowRight, Star } from "lucide-react";
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
import { Link } from "react-router-dom";

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
    quoteAr: "غيّرت التُهاء طريقة إدارتنا للفعاليات الطهوية. المنصة سهلة الاستخدام وقوية.",
  },
  {
    name: "Sarah Mitchell",
    nameAr: "سارة ميتشل",
    role: "Culinary School Director",
    roleAr: "مديرة مدرسة طهي",
    quote: "Our students love participating in competitions through Altohaa. It's professional and easy to use.",
    quoteAr: "يحب طلابنا المشاركة في المسابقات عبر التُهاء. إنها احترافية وسهلة الاستخدام.",
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
        title: language === "ar" ? "تم الإرسال بنجاح" : "Submitted Successfully",
        description: language === "ar" 
          ? "سنتواصل معك قريباً" 
          : "We'll be in touch soon",
      });

      setFormData({ organizationName: "", contactName: "", email: "", phone: "", message: "" });
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
                  ? "أنشئ مسابقات طهوية استثنائية"
                  : "Create Exceptional Culinary Competitions"}
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                {language === "ar"
                  ? "منصة متكاملة لإدارة المسابقات من التسجيل إلى الإعلان عن الفائزين"
                  : "A complete platform to manage competitions from registration to announcing winners"}
              </p>
              <div className="flex gap-4 justify-center">
                <Button size="lg" className="gap-2" asChild>
                  <Link to="/auth?tab=signup">
                    {language === "ar" ? "ابدأ مجاناً" : "Start Free"}
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link to="/competitions">
                    {language === "ar" ? "شاهد المسابقات" : "View Competitions"}
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-serif font-bold text-center mb-4">
              {language === "ar" ? "كل ما تحتاجه لتنظيم المسابقات" : "Everything You Need to Organize Competitions"}
            </h2>
            <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
              {language === "ar"
                ? "أدوات قوية وسهلة الاستخدام لإدارة جميع جوانب مسابقتك"
                : "Powerful yet easy-to-use tools to manage every aspect of your competition"}
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, i) => (
                <Card key={i}>
                  <CardContent className="pt-6">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold mb-2">
                      {language === "ar" ? feature.titleAr : feature.titleEn}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {language === "ar" ? feature.descAr : feature.descEn}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-serif font-bold text-center mb-12">
              {language === "ar" ? "ماذا يقول المنظمون" : "What Organizers Say"}
            </h2>
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {testimonials.map((testimonial, i) => (
                <Card key={i}>
                  <CardContent className="pt-6">
                    <div className="flex gap-1 mb-4">
                      {[...Array(5)].map((_, j) => (
                        <Star key={j} className="h-4 w-4 fill-primary text-primary" />
                      ))}
                    </div>
                    <p className="text-muted-foreground mb-4">
                      "{language === "ar" ? testimonial.quoteAr : testimonial.quote}"
                    </p>
                    <div>
                      <p className="font-semibold">
                        {language === "ar" ? testimonial.nameAr : testimonial.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {language === "ar" ? testimonial.roleAr : testimonial.role}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA / Contact Form */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 items-center max-w-5xl mx-auto">
              <div>
                <h2 className="text-3xl font-serif font-bold mb-4">
                  {language === "ar" ? "جاهز للبدء؟" : "Ready to Get Started?"}
                </h2>
                <p className="text-muted-foreground mb-6">
                  {language === "ar"
                    ? "انضم إلى مئات المنظمين الذين يثقون في التُهاء لإدارة مسابقاتهم"
                    : "Join hundreds of organizers who trust Altohaa to manage their competitions"}
                </p>
                <ul className="space-y-3">
                  {[
                    language === "ar" ? "إعداد مجاني بدون بطاقة ائتمان" : "Free setup, no credit card required",
                    language === "ar" ? "دعم فني على مدار الساعة" : "24/7 technical support",
                    language === "ar" ? "تدريب شخصي للفريق" : "Personal team training",
                    language === "ar" ? "استيراد البيانات من أنظمة أخرى" : "Data import from other systems",
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-primary" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <Card>
                <CardHeader>
                  <CardTitle>
                    {language === "ar" ? "احصل على عرض توضيحي" : "Get a Demo"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="organizationName">
                        {language === "ar" ? "اسم المنظمة" : "Organization Name"}
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
                        {language === "ar" ? "اسم جهة الاتصال" : "Contact Name"}
                      </Label>
                      <Input
                        id="contactName"
                        value={formData.contactName}
                        onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                        required
                      />
                    </div>
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
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading 
                        ? (language === "ar" ? "جاري الإرسال..." : "Sending...") 
                        : (language === "ar" ? "طلب عرض توضيحي" : "Request Demo")}
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
