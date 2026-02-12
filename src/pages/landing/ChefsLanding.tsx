import { Link } from "react-router-dom";
import {
  ChefHat, Trophy, Award, Users, Globe, GraduationCap, ArrowRight,
  Sparkles, Star, BarChart3, BookOpen, ShieldCheck, CheckCircle,
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/i18n/LanguageContext";
import { SEOHead } from "@/components/SEOHead";

const benefits = [
  { icon: Trophy, titleEn: "Compete Globally", titleAr: "تنافس عالمياً", descEn: "Join culinary competitions worldwide and prove your skills against the best", descAr: "انضم إلى مسابقات طهي عالمية وأثبت مهاراتك أمام الأفضل" },
  { icon: Award, titleEn: "Earn Certificates", titleAr: "احصل على شهادات", descEn: "Receive verifiable digital certificates for your achievements", descAr: "احصل على شهادات رقمية قابلة للتحقق لإنجازاتك" },
  { icon: Users, titleEn: "Professional Network", titleAr: "شبكة مهنية", descEn: "Connect with chefs, judges, and industry leaders worldwide", descAr: "تواصل مع طهاة وحكام وقادة صناعة الطعام" },
  { icon: GraduationCap, titleEn: "Masterclasses", titleAr: "دروس متقدمة", descEn: "Learn advanced techniques from world-renowned chefs", descAr: "تعلم تقنيات متقدمة من طهاة عالميين" },
  { icon: BarChart3, titleEn: "Track Progress", titleAr: "تتبع تقدمك", descEn: "Monitor your growth with detailed performance analytics", descAr: "راقب تطورك مع تحليلات أداء مفصلة" },
  { icon: BookOpen, titleEn: "Recipe Portfolio", titleAr: "ملف الوصفات", descEn: "Build your professional recipe portfolio and share it", descAr: "ابنِ ملف وصفاتك المهني وشاركه" },
];

const journey = [
  { step: "01", titleEn: "Create Profile", titleAr: "أنشئ ملفك", descEn: "Set up your professional chef profile with your specializations", descAr: "أنشئ ملفك المهني مع تخصصاتك" },
  { step: "02", titleEn: "Join Competitions", titleAr: "شارك في المسابقات", descEn: "Browse and register for culinary competitions worldwide", descAr: "تصفح وسجل في مسابقات الطهي حول العالم" },
  { step: "03", titleEn: "Get Evaluated", titleAr: "احصل على تقييم", descEn: "Receive professional evaluation from certified judges", descAr: "احصل على تقييم احترافي من حكام معتمدين" },
  { step: "04", titleEn: "Grow & Excel", titleAr: "تطور وتميز", descEn: "Build your reputation, earn certificates, and advance your career", descAr: "ابنِ سمعتك واحصل على شهادات وطور مسيرتك" },
];

export default function ChefsLanding() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SEOHead title="For Professional Chefs" description="Join the global culinary community - compete, learn, and grow your career" />
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative py-20 md:py-28 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(var(--primary)/0.08),transparent_70%)]" />
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-medium text-primary">{isAr ? "للطهاة المحترفين" : "For Professional Chefs"}</span>
              </div>
              <h1 className="font-serif text-4xl font-bold md:text-5xl lg:text-6xl">
                {isAr ? "ارتقِ بمسيرتك في الطهي" : "Elevate Your Culinary Career"}
              </h1>
              <p className="mt-4 text-lg text-muted-foreground md:text-xl">
                {isAr
                  ? "انضم إلى مجتمع عالمي من الطهاة المحترفين — تنافس، تعلم، وتطور"
                  : "Join a global community of professional chefs — compete, learn, and grow"}
              </p>
              <div className="mt-8 flex gap-3 justify-center flex-wrap">
                <Button size="lg" className="gap-2" asChild>
                  <Link to="/register">
                    {isAr ? "انضم مجاناً" : "Join Free"}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link to="/competitions">{isAr ? "تصفح المسابقات" : "Browse Competitions"}</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-14 md:py-18">
          <div className="container mx-auto px-4">
            <div className="mb-10 text-center">
              <h2 className="text-3xl font-serif font-bold">{isAr ? "لماذا الطهاة للطهاة؟" : "Why Altohaa for Chefs?"}</h2>
              <p className="mt-2 text-muted-foreground max-w-xl mx-auto">
                {isAr ? "كل الأدوات التي تحتاجها لبناء مسيرة طهوية ناجحة" : "All the tools you need to build a successful culinary career"}
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {benefits.map((b, i) => (
                <Card key={i} className="border-border/60 transition-all hover:shadow-md hover:-translate-y-0.5">
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

        {/* Journey */}
        <section className="py-14 md:py-18 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="mb-10 text-center">
              <h2 className="text-3xl font-serif font-bold">{isAr ? "رحلتك معنا" : "Your Journey"}</h2>
              <p className="mt-2 text-muted-foreground">{isAr ? "أربع خطوات نحو التميز الطهوي" : "Four steps to culinary excellence"}</p>
            </div>
            <div className="grid md:grid-cols-4 gap-4 max-w-5xl mx-auto">
              {journey.map((step, i) => (
                <div key={i} className="text-center">
                  <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/15 font-serif text-xl font-bold text-primary">
                    {step.step}
                  </div>
                  <h3 className="font-semibold mb-1">{isAr ? step.titleAr : step.titleEn}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{isAr ? step.descAr : step.descEn}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Competition Types */}
        <section className="py-14 md:py-18">
          <div className="container mx-auto px-4">
            <div className="mb-10 text-center">
              <h2 className="text-3xl font-serif font-bold">{isAr ? "أنواع المسابقات المتاحة" : "Available Competition Types"}</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 max-w-4xl mx-auto">
              {[
                { icon: "🍳", label: isAr ? "الطبخ الحي" : "Live Cooking" },
                { icon: "☕", label: isAr ? "الباريستا" : "Barista" },
                { icon: "🍰", label: isAr ? "الحلويات" : "Pastry" },
                { icon: "🎨", label: isAr ? "فن التقديم" : "Plating Art" },
                { icon: "🍷", label: isAr ? "المشروبات" : "Beverages" },
                { icon: "🌿", label: isAr ? "الأطباق المحلية" : "Local Cuisine" },
                { icon: "🌍", label: isAr ? "المعايير الدولية" : "International Standards" },
                { icon: "🍖", label: isAr ? "الشواء" : "Grilling" },
                { icon: "🥗", label: isAr ? "الأطباق النباتية" : "Vegan/Vegetarian" },
                { icon: "🏆", label: isAr ? "البطولات" : "Championships" },
              ].map((type, i) => (
                <Card key={i} className="border-border/50 text-center transition-all hover:shadow-md hover:-translate-y-0.5">
                  <CardContent className="p-4">
                    <span className="text-2xl mb-2 block">{type.icon}</span>
                    <span className="text-xs font-medium">{type.label}</span>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="relative border-t overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/3 via-background to-background" />
          <div className="container relative py-14 text-center md:py-20">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/15">
              <ChefHat className="h-7 w-7 text-primary" />
            </div>
            <h2 className="mb-3 font-serif text-2xl font-bold sm:text-3xl">
              {isAr ? "ابدأ مسيرتك في الطهي اليوم" : "Start Your Culinary Journey Today"}
            </h2>
            <p className="mx-auto mb-6 max-w-lg text-sm text-muted-foreground">
              {isAr ? "انضم إلى آلاف الطهاة المحترفين وابدأ رحلتك نحو التميز" : "Join thousands of professional chefs and begin your journey to excellence"}
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button size="lg" className="shadow-lg shadow-primary/20" asChild>
                <Link to="/register">{isAr ? "سجل مجاناً" : "Sign Up Free"}<ArrowRight className="ms-2 h-4 w-4" /></Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/competitions">{isAr ? "تصفح المسابقات" : "Browse Competitions"}</Link>
              </Button>
            </div>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-5 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4 text-primary" />{isAr ? "مجاني بالكامل" : "Completely Free"}</div>
              <div className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4 text-primary" />{isAr ? "شهادات معتمدة" : "Certified Awards"}</div>
              <div className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4 text-primary" />{isAr ? "مجتمع عالمي" : "Global Community"}</div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
