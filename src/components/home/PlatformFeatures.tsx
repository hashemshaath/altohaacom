import { Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users, Trophy, GraduationCap, ShoppingBag, Building2, Newspaper,
  Globe, Scale, Award, ShieldCheck, ArrowRight, CheckCircle, ChefHat, Star,
  Coffee, BookOpen,
} from "lucide-react";

export function PlatformFeatures() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const isAr = language === "ar";

  const services = [
    { icon: Trophy, title: isAr ? "المسابقات الطهوية" : "Culinary Competitions", desc: isAr ? "شارك في مسابقات طهي عالمية ومحلية مع نظام تحكيم رقمي." : "Compete in global and local culinary competitions.", href: "/competitions" },
    { icon: Coffee, title: isAr ? "تقييم وتذوق" : "Tasting & Evaluation", desc: isAr ? "نظام تقييم احترافي للقهوة والمشروبات والأطباق." : "Professional evaluation for coffee, beverages, and dishes.", href: "/tastings" },
    { icon: Globe, title: isAr ? "المعارض والفعاليات" : "Exhibitions & Events", desc: isAr ? "اكتشف المعارض الطهوية محلياً ودولياً." : "Discover culinary exhibitions locally and internationally.", href: "/exhibitions" },
    { icon: GraduationCap, title: isAr ? "الدروس المتقدمة" : "Masterclasses", desc: isAr ? "تعلم من أفضل الطهاة عبر دروس حصرية." : "Learn from top chefs through exclusive lessons.", href: "/masterclasses" },
    { icon: Users, title: isAr ? "المجتمع المهني" : "Professional Community", desc: isAr ? "تواصل مع طهاة ومحترفين عالميين." : "Network with chefs and culinary professionals.", href: "/community" },
    { icon: ShoppingBag, title: isAr ? "المتجر الطهوي" : "Culinary Shop", desc: isAr ? "أدوات طهي فاخرة وكتب وخدمات مهنية." : "Premium tools, books, and professional services.", href: "/shop" },
  ];

  const roles = [
    { icon: ChefHat, title: isAr ? "الطهاة" : "Chefs", desc: isAr ? "اعرض مهاراتك وشارك في المسابقات" : "Showcase your skills and compete", href: "/for-chefs" },
    { icon: Scale, title: isAr ? "الحكام" : "Judges", desc: isAr ? "قيّم المتسابقين بأدوات احترافية" : "Evaluate contestants with pro tools" },
    { icon: Trophy, title: isAr ? "المنظمون" : "Organizers", desc: isAr ? "أنشئ وأدِر مسابقات بسهولة" : "Create and manage competitions easily", href: "/for-organizers" },
    { icon: Star, title: isAr ? "الرعاة" : "Sponsors", desc: isAr ? "اربط علامتك بالتميز الطهوي" : "Connect your brand with excellence", href: "/sponsors" },
    { icon: Building2, title: isAr ? "الشركات" : "Companies", desc: isAr ? "حلول متكاملة لشركات الأغذية" : "Complete solutions for food companies", href: "/for-companies" },
    { icon: BookOpen, title: isAr ? "الطلاب" : "Students", desc: isAr ? "تعلم وتطور مهاراتك الطهوية" : "Learn and develop your skills" },
  ];

  const whyUs = [
    { icon: Globe, title: isAr ? "منصة عالمية" : "Global Platform", desc: isAr ? "وصول إلى مجتمع طهي دولي" : "Access a worldwide culinary community" },
    { icon: Scale, title: isAr ? "تحكيم رقمي" : "Digital Judging", desc: isAr ? "نظام تقييم شفاف وعادل" : "Transparent and fair scoring system" },
    { icon: Award, title: isAr ? "شهادات معتمدة" : "Certified Awards", desc: isAr ? "شهادات رقمية قابلة للتحقق" : "Verifiable digital certificates" },
    { icon: ShieldCheck, title: isAr ? "آمن وموثوق" : "Secure & Trusted", desc: isAr ? "حماية بيانات احترافية" : "Enterprise-grade data protection" },
  ];

  return (
    <>
      {/* Services */}
      <section className="container py-12 md:py-16">
        <div className="mb-8 text-center">
          <Badge variant="secondary" className="mb-3">{isAr ? "الخدمات" : "Services"}</Badge>
          <h2 className="font-serif text-2xl font-bold sm:text-3xl">{isAr ? "خدمات المنصة" : "Platform Services"}</h2>
          <p className="mx-auto mt-1 max-w-xl text-sm text-muted-foreground">
            {isAr ? "كل ما يحتاجه محترف الطهي في منصة واحدة" : "Everything a culinary professional needs in one platform"}
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => (
            <Link key={s.title} to={s.href} className="group block">
              <Card className="h-full border-border/50 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-primary/20">
                <CardContent className="flex flex-col p-5">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 transition-all group-hover:bg-primary/15 group-hover:scale-110">
                    <s.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">{s.title}</h3>
                  <p className="mb-3 flex-1 text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                  <span className="inline-flex items-center text-xs font-medium text-primary">
                    {isAr ? "اكتشف" : "Explore"}<ArrowRight className="ms-1 h-3 w-3 transition-transform group-hover:translate-x-1" />
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Roles */}
      <section className="bg-muted/30 py-12 md:py-16">
        <div className="container">
          <div className="mb-8 text-center">
            <h2 className="font-serif text-2xl font-bold sm:text-3xl">{isAr ? "لمن هذه المنصة؟" : "Who Is Altohaa For?"}</h2>
            <p className="mx-auto mt-1 max-w-xl text-sm text-muted-foreground">
              {isAr ? "منصة مصممة لخدمة كل المحترفين" : "A platform designed for every culinary professional"}
            </p>
          </div>
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
            {roles.map((role) => (
              <div key={role.title} className="group">
                {role.href ? (
                  <Link to={role.href} className="block">
                    <Card className="h-full text-center border-border/50 transition-all hover:shadow-md hover:-translate-y-1 hover:border-primary/20">
                      <CardContent className="p-4">
                        <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 group-hover:bg-primary/15 transition-colors">
                          <role.icon className="h-5 w-5 text-primary" />
                        </div>
                        <h3 className="mb-0.5 text-sm font-semibold">{role.title}</h3>
                        <p className="text-[11px] text-muted-foreground leading-snug">{role.desc}</p>
                      </CardContent>
                    </Card>
                  </Link>
                ) : (
                  <Card className="h-full text-center border-border/50 transition-all hover:shadow-md hover:-translate-y-1 hover:border-primary/20">
                    <CardContent className="p-4">
                      <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 group-hover:bg-primary/15 transition-colors">
                        <role.icon className="h-5 w-5 text-primary" />
                      </div>
                      <h3 className="mb-0.5 text-sm font-semibold">{role.title}</h3>
                      <p className="text-[11px] text-muted-foreground leading-snug">{role.desc}</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            ))}
          </div>
          {!user && (
            <div className="mt-6 text-center">
              <Button size="lg" asChild>
                <Link to="/auth?tab=signup">
                  {isAr ? "سجل مجاناً الآن" : "Sign Up Free Now"}
                  <ArrowRight className="ms-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Why Altohaa */}
      <section className="container py-12 md:py-16">
        <div className="mb-8 text-center">
          <h2 className="font-serif text-2xl font-bold sm:text-3xl">{isAr ? "لماذا ألتوها؟" : "Why Altohaa?"}</h2>
        </div>
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {whyUs.map((item) => (
            <Card key={item.title} className="border-border/50 text-center transition-all hover:shadow-md hover:-translate-y-1">
              <CardContent className="flex flex-col items-center p-5">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/15">
                  <item.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-1 text-sm font-semibold">{item.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Cards */}
      <section className="container pb-12 md:pb-16">
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="group relative overflow-hidden border-primary/15 bg-gradient-to-br from-primary/5 to-transparent transition-all hover:shadow-xl">
            <CardContent className="relative p-6 md:p-8">
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/15">
                <Star className="h-5 w-5 text-primary" />
              </div>
              <h3 className="mb-2 font-serif text-xl font-bold">{isAr ? "هل أنت راعٍ أو شركة؟" : "Sponsor or Company?"}</h3>
              <p className="mb-5 text-sm text-muted-foreground">{isAr ? "اربط علامتك بالتميز الطهوي واستفد من شبكة عالمية." : "Connect your brand with culinary excellence and a global network."}</p>
              <div className="flex gap-2">
                <Button size="sm" asChild><Link to="/sponsors">{isAr ? "الرعاية" : "Sponsorship"}<ArrowRight className="ms-1 h-3 w-3" /></Link></Button>
                <Button size="sm" variant="outline" asChild><Link to="/for-companies">{isAr ? "الشركات" : "Companies"}</Link></Button>
              </div>
            </CardContent>
          </Card>
          <Card className="group relative overflow-hidden border-accent/15 bg-gradient-to-br from-accent/5 to-transparent transition-all hover:shadow-xl">
            <CardContent className="relative p-6 md:p-8">
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 ring-1 ring-accent/15">
                <Trophy className="h-5 w-5 text-accent" />
              </div>
              <h3 className="mb-2 font-serif text-xl font-bold">{isAr ? "منظم مسابقات؟" : "Competition Organizer?"}</h3>
              <p className="mb-5 text-sm text-muted-foreground">{isAr ? "أنشئ وأدِر مسابقات طهوية احترافية بأدوات رقمية متكاملة." : "Create and manage professional competitions with integrated digital tools."}</p>
              <Button size="sm" variant="secondary" asChild><Link to="/for-organizers">{isAr ? "ابدأ التنظيم" : "Start Organizing"}<ArrowRight className="ms-1 h-3 w-3" /></Link></Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Final CTA */}
      {!user && (
        <section className="relative border-t overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/3 via-background to-background" />
          <div className="container relative py-14 text-center md:py-20">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/15">
              <ChefHat className="h-7 w-7 text-primary" />
            </div>
            <h2 className="mb-3 font-serif text-2xl font-bold sm:text-3xl">{isAr ? "انضم إلى مجتمع الطهي العالمي" : "Join the Global Culinary Community"}</h2>
            <p className="mx-auto mb-6 max-w-lg text-sm text-muted-foreground">
              {isAr ? "سجل مجاناً واستمتع بجميع المميزات — مسابقات، دروس، شبكة مهنية والمزيد." : "Sign up free and enjoy all features — competitions, masterclasses, networking, and more."}
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button size="lg" className="shadow-lg shadow-primary/20" asChild>
                <Link to="/auth?tab=signup">{isAr ? "أنشئ حسابك المجاني" : "Create Your Free Account"}<ArrowRight className="ms-2 h-4 w-4" /></Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/competitions">{isAr ? "تصفح المسابقات" : "Browse Competitions"}</Link>
              </Button>
            </div>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-5 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4 text-primary" />{isAr ? "مجاني بالكامل" : "Completely Free"}</div>
              <div className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4 text-primary" />{isAr ? "بدون بطاقة ائتمان" : "No Credit Card"}</div>
              <div className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4 text-primary" />{isAr ? "إعداد في دقائق" : "Setup in Minutes"}</div>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
