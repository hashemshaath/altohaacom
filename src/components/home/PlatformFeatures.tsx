import { memo } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users, Trophy, GraduationCap, ShoppingBag, Building2,
  Globe, Scale, Award, ShieldCheck, ArrowRight, CheckCircle, ChefHat, Star,
  Coffee, BookOpen, Sparkles,
} from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { cn } from "@/lib/utils";
import { SectionReveal } from "@/components/ui/section-reveal";

export const PlatformFeatures = memo(function PlatformFeatures() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const isAr = language === "ar";

  const services = [
    { icon: Trophy, title: isAr ? "مسابقات الطهي" : "Culinary Competitions", desc: isAr ? "تحدَّ نفسك في مسابقات عالمية ومحلية مع نظام تحكيم رقمي احترافي." : "Challenge yourself in global & local competitions with a professional digital judging system.", href: "/competitions", color: "text-chart-1", bg: "bg-chart-1/10" },
    { icon: Coffee, title: isAr ? "طاولة الشيف" : "Chef's Table", desc: isAr ? "خدمة تقييم المنتجات الغذائية من قبل طهاة محترفين للشركات." : "Professional food product evaluation by expert chefs for B2B companies.", href: "/chefs-table", color: "text-chart-2", bg: "bg-chart-2/10" },
    { icon: Globe, title: isAr ? "المعارض والفعاليات" : "Exhibitions & Events", desc: isAr ? "اكتشف أبرز معارض وفعاليات الطهي محلياً ودولياً." : "Discover top culinary exhibitions & events locally and internationally.", href: "/exhibitions", color: "text-chart-3", bg: "bg-chart-3/10" },
    { icon: GraduationCap, title: isAr ? "الدروس المتقدمة" : "Masterclasses", desc: isAr ? "تعلّم أسرار المهنة من أمهر الطهاة عبر دروس حصرية." : "Learn the secrets of the craft from master chefs through exclusive lessons.", href: "/masterclasses", color: "text-chart-4", bg: "bg-chart-4/10" },
    { icon: Users, title: isAr ? "المجتمع المهني" : "Professional Network", desc: isAr ? "تواصل مع طهاة ومحترفين من مختلف أنحاء العالم وابنِ شبكتك." : "Connect with chefs & professionals worldwide and build your network.", href: "/community", color: "text-chart-5", bg: "bg-chart-5/10" },
    { icon: ShoppingBag, title: isAr ? "متجر الطهي" : "Culinary Shop", desc: isAr ? "أدوات طهي فاخرة، كتب متخصصة، وخدمات مهنية في مكان واحد." : "Premium tools, specialized books & professional services all in one place.", href: "/shop", color: "text-primary", bg: "bg-primary/10" },
  ];

  const roles = [
    { icon: ChefHat, title: isAr ? "الطهاة" : "Chefs", desc: isAr ? "أبرز مهاراتك وتنافس مع الأفضل" : "Showcase your skills & compete with the best", href: "/for-chefs" },
    { icon: Scale, title: isAr ? "الحكام" : "Judges", desc: isAr ? "قيّم بأدوات احترافية ومعايير دقيقة" : "Evaluate with pro tools & precise criteria" },
    { icon: Trophy, title: isAr ? "المنظمون" : "Organizers", desc: isAr ? "أنشئ وأدِر فعاليات بسلاسة" : "Create & manage events seamlessly", href: "/for-organizers" },
    { icon: Star, title: isAr ? "الرعاة" : "Sponsors", desc: isAr ? "اربط علامتك التجارية بالتميز" : "Connect your brand with excellence", href: "/sponsors" },
    { icon: Building2, title: isAr ? "الشركات" : "Companies", desc: isAr ? "حلول متكاملة لقطاع الأغذية" : "Complete solutions for the food industry", href: "/for-companies" },
    { icon: BookOpen, title: isAr ? "الطلاب" : "Students", desc: isAr ? "تعلّم وطوّر مهاراتك بلا حدود" : "Learn & develop your skills limitlessly" },
  ];

  const whyUs = [
    { icon: Globe, title: isAr ? "منصة عالمية" : "Global Reach", desc: isAr ? "مجتمع طهي دولي بلا حدود جغرافية" : "An international culinary community without borders" },
    { icon: Scale, title: isAr ? "تحكيم رقمي" : "Digital Judging", desc: isAr ? "نظام تقييم شفاف وعادل وموثوق" : "A transparent, fair & trusted scoring system" },
    { icon: Award, title: isAr ? "شهادات معتمدة" : "Certified Awards", desc: isAr ? "شهادات رقمية قابلة للتحقق فوراً" : "Instantly verifiable digital certificates" },
    { icon: ShieldCheck, title: isAr ? "آمن وموثوق" : "Secure & Trusted", desc: isAr ? "حماية احترافية لبياناتك وخصوصيتك" : "Enterprise-grade protection for your data & privacy" },
  ];

  const servicesReveal = useScrollReveal();
  const rolesReveal = useScrollReveal();
  const whyReveal = useScrollReveal();

  return (
    <div className="space-y-10 md:space-y-16">
      {/* Services */}
      <section ref={servicesReveal.ref} className="container" aria-labelledby="services-heading" dir={isAr ? "rtl" : "ltr"}>
        <SectionReveal>
          <div className="mb-8 text-center">
            <Badge variant="secondary" className="mb-2 gap-1">
              <Sparkles className="h-3 w-3" />
              {isAr ? "الخدمات" : "Services"}
            </Badge>
            <h2 id="services-heading" className={cn("text-xl font-bold sm:text-2xl md:text-3xl tracking-tight", !isAr && "font-serif")}>
              {isAr ? "كل ما يحتاجه عالم الطهي" : "Everything the Culinary World Needs"}
            </h2>
            <p className="mx-auto mt-1.5 max-w-xl text-sm text-muted-foreground leading-relaxed">
              {isAr ? "منصة متكاملة صُممت لتمكين كل محترف في عالم الطهي" : "A comprehensive platform designed to empower every culinary professional"}
            </p>
          </div>
        </SectionReveal>
        <div className={cn("grid gap-3 grid-cols-2 lg:grid-cols-3 transition-all duration-700", servicesReveal.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8")}>
          {services.map((s) => (
            <Link key={s.title} to={s.href} className="group block">
              <Card className="h-full border-border/40 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-primary/20">
                <CardContent className="flex flex-col p-3.5 sm:p-5">
                  <div className={cn("mb-3 flex h-10 w-10 items-center justify-center rounded-xl transition-all group-hover:scale-110", s.bg)}>
                    <s.icon className={cn("h-5 w-5", s.color)} />
                  </div>
                  <h3 className="font-bold mb-1 text-sm sm:text-base group-hover:text-primary transition-colors">{s.title}</h3>
                  <p className="mb-3 flex-1 text-xs sm:text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                  <span className="inline-flex items-center text-xs font-medium text-primary">
                    {isAr ? "اكتشف المزيد" : "Explore"}
                    <ArrowRight className="ms-1 h-3 w-3" />
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Roles */}
      <section ref={rolesReveal.ref} className="relative overflow-hidden" aria-labelledby="roles-heading" dir={isAr ? "rtl" : "ltr"}>
        <div className="absolute inset-0 bg-muted/20" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.04),transparent_70%)]" />
        <div className="container relative">
          <SectionReveal>
            <div className="mb-8 text-center">
              <h2 id="roles-heading" className={cn("text-xl font-bold sm:text-2xl md:text-3xl tracking-tight", !isAr && "font-serif")}>
                {isAr ? "لمن صُممت هذه المنصة؟" : "Who Is Altoha For?"}
              </h2>
              <p className="mx-auto mt-1.5 max-w-xl text-sm text-muted-foreground">
                {isAr ? "مصممة لخدمة كل دور في منظومة الطهي الاحترافية" : "Designed to serve every role in the professional culinary ecosystem"}
              </p>
            </div>
          </SectionReveal>
          <div className={cn("grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 transition-all duration-700", rolesReveal.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8")}>
            {roles.map((role) => {
              const content = (
                <Card className="h-full text-center border-border/40 transition-all hover:shadow-md hover:-translate-y-1 hover:border-primary/20">
                  <CardContent className="p-4">
                    <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 group-hover:bg-primary/15 transition-colors">
                      <role.icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="mb-0.5 text-sm font-bold">{role.title}</h3>
                    <p className="text-[11px] text-muted-foreground leading-snug">{role.desc}</p>
                  </CardContent>
                </Card>
              );
              return (
                <div key={role.title} className="group">
                  {role.href ? <Link to={role.href} className="block">{content}</Link> : content}
                </div>
              );
            })}
          </div>
          {!user && (
            <div className="mt-8 text-center">
              <Button size="lg" asChild>
                <Link to="/register">
                  {isAr ? "سجّل مجاناً وابدأ الآن" : "Sign Up Free & Get Started"}
                  <ArrowRight className="ms-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Why Altoha */}
      <section ref={whyReveal.ref} className="container" aria-labelledby="why-heading" dir={isAr ? "rtl" : "ltr"}>
        <SectionReveal>
          <div className="mb-8 text-center">
            <h2 id="why-heading" className={cn("text-xl font-bold sm:text-2xl md:text-3xl tracking-tight", !isAr && "font-serif")}>
              {isAr ? "لماذا الطهاة؟" : "Why Altoha?"}
            </h2>
            <p className="mx-auto mt-1.5 max-w-md text-sm text-muted-foreground">
              {isAr ? "ما يميزنا عن أي منصة أخرى" : "What sets us apart from any other platform"}
            </p>
          </div>
        </SectionReveal>
        <div className={cn("grid gap-3 grid-cols-2 lg:grid-cols-4 transition-all duration-700", whyReveal.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8")}>
          {whyUs.map((item) => (
            <Card key={item.title} className="border-border/40 text-center transition-all hover:shadow-md hover:-translate-y-1">
              <CardContent className="flex flex-col items-center p-5">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/15">
                  <item.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-1 text-sm font-bold">{item.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Cards */}
      <section className="container" dir={isAr ? "rtl" : "ltr"}>
        <div className="grid gap-3 md:grid-cols-2">
          <Card className="group relative overflow-hidden border-primary/15 bg-gradient-to-br from-primary/5 to-transparent transition-all hover:shadow-xl">
            <CardContent className="relative p-6 md:p-8">
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/15">
                <Star className="h-5 w-5 text-primary" />
              </div>
              <h3 className={cn("mb-2 text-xl font-bold", !isAr && "font-serif")}>
                {isAr ? "هل أنت راعٍ أو شركة؟" : "Sponsor or Company?"}
              </h3>
              <p className="mb-5 text-sm text-muted-foreground">
                {isAr ? "اربط علامتك التجارية بالتميز الطهوي وانطلق مع شبكة عالمية من المحترفين." : "Align your brand with culinary excellence and tap into a global network of professionals."}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" asChild>
                  <Link to="/sponsors">{isAr ? "فرص الرعاية" : "Sponsorship"}<ArrowRight className="ms-1 h-3 w-3" /></Link>
                </Button>
                <Button size="sm" variant="outline" asChild>
                  <Link to="/for-companies">{isAr ? "حلول الشركات" : "For Companies"}</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
          <Card className="group relative overflow-hidden border-accent/15 bg-gradient-to-br from-accent/5 to-transparent transition-all hover:shadow-xl">
            <CardContent className="relative p-6 md:p-8">
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 ring-1 ring-accent/15">
                <Trophy className="h-5 w-5 text-accent" />
              </div>
              <h3 className={cn("mb-2 text-xl font-bold", !isAr && "font-serif")}>
                {isAr ? "تنظّم مسابقات طهي؟" : "Organizing Competitions?"}
              </h3>
              <p className="mb-5 text-sm text-muted-foreground">
                {isAr ? "أدوات رقمية متكاملة لإنشاء وإدارة مسابقات طهوية احترافية بلا عناء." : "Integrated digital tools to create & manage professional culinary competitions effortlessly."}
              </p>
              <Button size="sm" variant="secondary" asChild>
                <Link to="/for-organizers">{isAr ? "ابدأ التنظيم" : "Start Organizing"}<ArrowRight className="ms-1 h-3 w-3" /></Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Final CTA */}
      {!user && (
        <section className="relative overflow-hidden" dir={isAr ? "rtl" : "ltr"}>
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.08),transparent_60%)]" />
          <div className="container relative py-16 text-center md:py-24">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/15 shadow-lg shadow-primary/10">
              <ChefHat className="h-8 w-8 text-primary" />
            </div>
            <h2 className={cn("mb-3 text-xl font-bold sm:text-2xl md:text-3xl", !isAr && "font-serif")}>
              {isAr ? "رحلتك في عالم الطهي تبدأ هنا" : "Your Culinary Journey Starts Here"}
            </h2>
            <p className="mx-auto mb-7 max-w-lg text-sm text-muted-foreground leading-relaxed">
              {isAr
                ? "انضم مجاناً واستمتع بمسابقات حصرية، دروس متقدمة، شبكة مهنية عالمية، وأكثر."
                : "Join for free and enjoy exclusive competitions, masterclasses, a global professional network, and much more."}
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button size="lg" className="shadow-lg shadow-primary/20" asChild>
                <Link to="/register">
                  {isAr ? "أنشئ حسابك المجاني" : "Create Your Free Account"}
                  <ArrowRight className="ms-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/competitions">{isAr ? "تصفح المسابقات" : "Browse Competitions"}</Link>
              </Button>
            </div>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-5 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4 text-primary" />{isAr ? "مجاني بالكامل" : "Completely Free"}</div>
              <div className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4 text-primary" />{isAr ? "بدون بطاقة ائتمان" : "No Credit Card"}</div>
              <div className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4 text-primary" />{isAr ? "إعداد سريع" : "Quick Setup"}</div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
