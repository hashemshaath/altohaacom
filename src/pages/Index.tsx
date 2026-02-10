import { Link } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Trophy,
  GraduationCap,
  ShoppingBag,
  ArrowRight,
  Globe,
  Building2,
  Award,
  Star,
  Calendar,
  MapPin,
  BookOpen,
  Newspaper,
  Scale,
  ShieldCheck,
  CheckCircle,
  ChefHat,
} from "lucide-react";
import { format } from "date-fns";

const Index = () => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const isAr = language === "ar";

  const { data: competitions } = useQuery({
    queryKey: ["home-competitions"],
    queryFn: async () => {
      const { data } = await supabase
        .from("competitions")
        .select("id, title, title_ar, cover_image_url, status, competition_start, competition_end, city, country, is_virtual, competition_registrations(id)")
        .in("status", ["registration_open", "upcoming"])
        .order("competition_start", { ascending: true })
        .limit(4);
      return data || [];
    },
  });

  const { data: articles } = useQuery({
    queryKey: ["home-articles"],
    queryFn: async () => {
      const { data } = await supabase
        .from("articles")
        .select("id, title, title_ar, excerpt, excerpt_ar, featured_image_url, slug, published_at, type")
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(3);
      return data || [];
    },
  });

  const { data: entities } = useQuery({
    queryKey: ["home-entities"],
    queryFn: async () => {
      const { data } = await supabase
        .from("culinary_entities")
        .select("id, name, name_ar, logo_url, slug, type, scope, country, is_verified")
        .eq("is_verified", true)
        .order("name")
        .limit(6);
      return data || [];
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["home-stats"],
    queryFn: async () => {
      const [profiles, comps, ents] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("competitions").select("id", { count: "exact", head: true }),
        supabase.from("culinary_entities").select("id", { count: "exact", head: true }),
      ]);
      return {
        members: profiles.count || 0,
        competitions: comps.count || 0,
        entities: ents.count || 0,
      };
    },
  });

  const services = [
    { icon: Users, title: isAr ? "المجتمع المهني" : "Professional Community", desc: isAr ? "تواصل مع طهاة محترفين من جميع أنحاء العالم وابنِ شبكة مهنية قوية." : "Connect with professional chefs worldwide and build a powerful professional network.", href: "/community" },
    { icon: Trophy, title: isAr ? "المسابقات الطهوية" : "Culinary Competitions", desc: isAr ? "شارك في مسابقات طهي عالمية ومحلية مع نظام تحكيم رقمي احترافي." : "Participate in global and local culinary competitions with a professional digital judging system.", href: "/competitions" },
    { icon: GraduationCap, title: isAr ? "الدروس المتقدمة" : "Masterclasses", desc: isAr ? "تعلم من أفضل الطهاة من خلال دروس متقدمة ومحتوى تعليمي حصري." : "Learn from the best chefs through advanced lessons and exclusive educational content.", href: "/masterclasses" },
    { icon: Building2, title: isAr ? "الجهات والجمعيات" : "Entities & Associations", desc: isAr ? "اكتشف الجمعيات الطهوية والأكاديميات محلياً ودولياً." : "Discover culinary associations and academies locally and internationally.", href: "/entities" },
    { icon: Newspaper, title: isAr ? "الأخبار والمعارض" : "News & Exhibitions", desc: isAr ? "ابقَ على اطلاع بآخر الأخبار والمعارض في عالم الطهي." : "Stay updated with the latest news and exhibitions in the culinary world.", href: "/news" },
    { icon: ShoppingBag, title: isAr ? "المتجر الطهوي" : "Culinary Shop", desc: isAr ? "أدوات طهي فاخرة وكتب وخدمات مهنية." : "Premium culinary tools, books, and professional services.", href: "/shop" },
  ];

  const whyUs = [
    { icon: Globe, title: isAr ? "منصة عالمية" : "Global Platform", desc: isAr ? "وصول إلى مجتمع طهي دولي" : "Access a worldwide culinary community" },
    { icon: Scale, title: isAr ? "تحكيم رقمي" : "Digital Judging", desc: isAr ? "نظام تقييم شفاف وعادل" : "Transparent and fair scoring system" },
    { icon: Award, title: isAr ? "شهادات معتمدة" : "Certified Awards", desc: isAr ? "شهادات رقمية قابلة للتحقق" : "Verifiable digital certificates" },
    { icon: ShieldCheck, title: isAr ? "آمن وموثوق" : "Secure & Trusted", desc: isAr ? "حماية بيانات على مستوى المؤسسات" : "Enterprise-grade data protection" },
  ];

  const roles = [
    { icon: ChefHat, title: isAr ? "الطهاة" : "Chefs", desc: isAr ? "اعرض مهاراتك وشارك في المسابقات" : "Showcase your skills and compete" },
    { icon: Scale, title: isAr ? "الحكام" : "Judges", desc: isAr ? "قيّم المتسابقين بأدوات احترافية" : "Evaluate contestants with pro tools" },
    { icon: Trophy, title: isAr ? "المنظمون" : "Organizers", desc: isAr ? "أنشئ وأدِر مسابقات بسهولة" : "Create and manage competitions easily" },
    { icon: Star, title: isAr ? "الرعاة" : "Sponsors", desc: isAr ? "اربط علامتك التجارية بالتميز" : "Connect your brand with excellence" },
    { icon: GraduationCap, title: isAr ? "الطلاب" : "Students", desc: isAr ? "تعلم وتطور مهاراتك الطهوية" : "Learn and develop your culinary skills" },
    { icon: BookOpen, title: isAr ? "المتطوعون" : "Volunteers", desc: isAr ? "ساهم في تنظيم الفعاليات" : "Help organize events and activities" },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <SEOHead
        title="Altohaa - Culinary Community Platform"
        description="The premier culinary community platform for chefs, judges, and food enthusiasts. Compete, learn, and connect."
        ogImage="/pwa-512x512.png"
      />
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/8 via-background to-background" />
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
        <div className="absolute -top-40 start-1/2 -translate-x-1/2 h-80 w-[600px] rounded-full bg-primary/5 blur-3xl" />

        <div className="container relative flex flex-col items-center py-16 text-center sm:py-20 md:py-28">
          <div className="mb-5 rounded-2xl bg-primary/5 p-3.5 ring-1 ring-primary/10">
            <img src="/altohaa-logo.png" alt="Altohaa" className="h-16 w-auto sm:h-20 md:h-24" />
          </div>
          <h1 className="mb-3 font-serif text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl">
            <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Altohaa
            </span>
          </h1>
          <p className="mb-1.5 font-serif text-lg text-primary/80 sm:text-xl md:text-2xl">
            {isAr ? "مجتمع الطهي العالمي" : "The Global Culinary Community"}
          </p>
          <p className="mb-8 max-w-xl text-sm text-muted-foreground sm:text-base md:max-w-2xl md:text-lg">
            {isAr
              ? "المنصة الرائدة التي تجمع الطهاة المحترفين والحكام والمنظمين والرعاة. تنافس، تعلم، وتطور."
              : "The premier platform uniting professional chefs, judges, organizers, and sponsors. Compete, learn, and grow."}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {user ? (
              <Button size="lg" asChild>
                <Link to="/dashboard">
                  {isAr ? "لوحة التحكم" : "Dashboard"}
                  <ArrowRight className="ms-2 h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <>
                <Button size="lg" asChild>
                  <Link to="/auth?tab=signup">
                    {t("joinNow")}
                    <ArrowRight className="ms-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link to="/auth">{t("signIn")}</Link>
                </Button>
              </>
            )}
            <Button size="lg" variant="secondary" asChild>
              <Link to="/competitions">{isAr ? "تصفح المسابقات" : "Browse Competitions"}</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y bg-card/80 backdrop-blur-sm">
        <div className="container grid grid-cols-3 py-6 sm:py-8">
          {[
            { value: stats?.members || 0, label: isAr ? "عضو مسجل" : "Members", icon: Users },
            { value: stats?.competitions || 0, label: isAr ? "مسابقة" : "Competitions", icon: Trophy },
            { value: stats?.entities || 0, label: isAr ? "جهة معتمدة" : "Entities", icon: Building2 },
          ].map((stat, i) => (
            <div key={stat.label} className={`flex flex-col items-center gap-1 px-2 ${i > 0 ? "border-s" : ""}`}>
              <div className="mb-1 flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 sm:h-9 sm:w-9">
                <stat.icon className="h-4 w-4 text-primary" />
              </div>
              <p className="text-xl font-bold text-foreground sm:text-2xl md:text-3xl">{stat.value}+</p>
              <p className="text-[11px] text-muted-foreground sm:text-xs md:text-sm">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Services */}
      <section className="container py-14 md:py-20">
        <div className="mb-10 text-center">
          <Badge variant="secondary" className="mb-3">
            {isAr ? "الخدمات" : "Services"}
          </Badge>
          <h2 className="mb-2 font-serif text-2xl font-bold sm:text-3xl md:text-4xl">
            {isAr ? "خدمات المنصة" : "Platform Services"}
          </h2>
          <p className="mx-auto max-w-xl text-sm text-muted-foreground sm:text-base">
            {isAr
              ? "كل ما يحتاجه محترف الطهي في منصة واحدة"
              : "Everything a culinary professional needs in one platform"}
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => (
            <Link key={s.title} to={s.href} className="group block">
              <Card className="h-full border-border/50 transition-all hover:shadow-lg hover:-translate-y-1 hover:border-primary/20">
                <CardContent className="flex flex-col p-5">
                  <div className="mb-3.5 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/15">
                    <s.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-1.5 group-hover:text-primary transition-colors">{s.title}</h3>
                  <p className="mb-4 flex-1 text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                  <span className="inline-flex items-center text-xs font-medium text-primary">
                    {isAr ? "اكتشف المزيد" : "Explore"}
                    <ArrowRight className="ms-1 h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Competitions */}
      {competitions && competitions.length > 0 && (
        <section className="bg-muted/30 py-14 md:py-20">
          <div className="container">
            <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <Badge variant="secondary" className="mb-2">
                  <Trophy className="me-1 h-3 w-3" />
                  {isAr ? "مسابقات" : "Competitions"}
                </Badge>
                <h2 className="font-serif text-2xl font-bold sm:text-3xl md:text-4xl">
                  {isAr ? "مسابقات مفتوحة" : "Open Competitions"}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {isAr ? "سجل الآن في أحدث المسابقات" : "Register now for the latest competitions"}
                </p>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link to="/competitions">
                  {isAr ? "عرض الكل" : "View All"}
                  <ArrowRight className="ms-1 h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {competitions.map((comp: any) => {
                const title = isAr && comp.title_ar ? comp.title_ar : comp.title;
                return (
                  <Link key={comp.id} to={`/competitions/${comp.id}`} className="group block">
                    <Card className="h-full overflow-hidden border-border/50 transition-all hover:shadow-lg hover:-translate-y-1 hover:border-primary/20">
                      <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                        {comp.cover_image_url ? (
                          <img src={comp.cover_image_url} alt={title} className="h-full w-full object-cover transition-transform group-hover:scale-105" loading="lazy" />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <Trophy className="h-10 w-10 text-muted-foreground/20" />
                          </div>
                        )}
                        <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/30 to-transparent" />
                        <Badge className="absolute end-2 top-2 bg-primary/90 text-primary-foreground text-[10px]">
                          {comp.status === "registration_open" ? (isAr ? "مفتوح" : "Open") : (isAr ? "قادمة" : "Upcoming")}
                        </Badge>
                      </div>
                      <CardContent className="p-3.5">
                        <h3 className="mb-2 line-clamp-2 text-sm font-semibold group-hover:text-primary transition-colors">{title}</h3>
                        <div className="space-y-1 text-[11px] text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3 w-3 shrink-0" />
                            <span>{format(new Date(comp.competition_start), "MMM d, yyyy")}</span>
                          </div>
                          {comp.is_virtual ? (
                            <div className="flex items-center gap-1.5"><Globe className="h-3 w-3 shrink-0" /><span>{isAr ? "افتراضي" : "Virtual"}</span></div>
                          ) : comp.city ? (
                            <div className="flex items-center gap-1.5"><MapPin className="h-3 w-3 shrink-0" /><span>{comp.city}{comp.country ? `, ${comp.country}` : ""}</span></div>
                          ) : null}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Roles */}
      <section className="container py-14 md:py-20">
        <div className="mb-10 text-center">
          <Badge variant="secondary" className="mb-3">
            {isAr ? "الأدوار" : "Roles"}
          </Badge>
          <h2 className="mb-2 font-serif text-2xl font-bold sm:text-3xl md:text-4xl">
            {isAr ? "لمن هذه المنصة؟" : "Who Is Altohaa For?"}
          </h2>
          <p className="mx-auto max-w-xl text-sm text-muted-foreground sm:text-base">
            {isAr ? "منصة مصممة لخدمة كل المحترفين في عالم الطهي" : "A platform designed for every professional in the culinary world"}
          </p>
        </div>
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
          {roles.map((role) => (
            <Card key={role.title} className="group text-center border-border/50 transition-all hover:shadow-md hover:-translate-y-1 hover:border-primary/20">
              <CardContent className="p-4">
                <div className="mx-auto mb-2.5 flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 transition-colors group-hover:bg-primary/15">
                  <role.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mb-0.5 text-sm font-semibold">{role.title}</h3>
                <p className="text-[11px] text-muted-foreground leading-snug">{role.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        {!user && (
          <div className="mt-8 text-center">
            <Button size="lg" asChild>
              <Link to="/auth?tab=signup">
                {isAr ? "سجل مجاناً الآن" : "Sign Up Free Now"}
                <ArrowRight className="ms-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        )}
      </section>

      {/* Entities */}
      {entities && entities.length > 0 && (
        <section className="bg-muted/30 py-14 md:py-20">
          <div className="container">
            <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <Badge variant="secondary" className="mb-2">
                  <Building2 className="me-1 h-3 w-3" />
                  {isAr ? "جهات" : "Entities"}
                </Badge>
                <h2 className="font-serif text-2xl font-bold sm:text-3xl md:text-4xl">
                  {isAr ? "الجهات المعتمدة" : "Verified Entities"}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {isAr ? "شبكة واسعة من الجمعيات والأكاديميات الطهوية" : "A wide network of culinary associations and academies"}
                </p>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link to="/entities">
                  {isAr ? "عرض الكل" : "View All"}
                  <ArrowRight className="ms-1 h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
              {entities.map((entity: any) => {
                const name = isAr && entity.name_ar ? entity.name_ar : entity.name;
                return (
                  <Link key={entity.id} to={`/entities/${entity.slug}`} className="group block">
                    <Card className="h-full text-center border-border/50 transition-all hover:shadow-md hover:-translate-y-1 hover:border-primary/20">
                      <CardContent className="p-4">
                        {entity.logo_url ? (
                          <img src={entity.logo_url} alt={name} className="mx-auto mb-2.5 h-12 w-12 rounded-xl object-cover ring-1 ring-border/50" loading="lazy" />
                        ) : (
                          <div className="mx-auto mb-2.5 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                            <Building2 className="h-6 w-6 text-primary" />
                          </div>
                        )}
                        <h3 className="mb-1 text-xs font-semibold line-clamp-2 group-hover:text-primary transition-colors">{name}</h3>
                        <div className="flex items-center justify-center gap-1">
                          {entity.is_verified && <ShieldCheck className="h-3 w-3 text-primary" />}
                          <span className="text-[10px] text-muted-foreground">{entity.country || ""}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* News */}
      {articles && articles.length > 0 && (
        <section className="container py-14 md:py-20">
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Badge variant="secondary" className="mb-2">
                <Newspaper className="me-1 h-3 w-3" />
                {isAr ? "أخبار" : "News"}
              </Badge>
              <h2 className="font-serif text-2xl font-bold sm:text-3xl md:text-4xl">
                {isAr ? "آخر الأخبار" : "Latest News"}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {isAr ? "ابقَ على اطلاع بآخر المستجدات" : "Stay up to date with the latest updates"}
              </p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link to="/news">
                {isAr ? "عرض الكل" : "View All"}
                <ArrowRight className="ms-1 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((article: any) => {
              const title = isAr && article.title_ar ? article.title_ar : article.title;
              const excerpt = isAr && article.excerpt_ar ? article.excerpt_ar : article.excerpt;
              return (
                <Link key={article.id} to={`/news/${article.slug}`} className="group block">
                  <Card className="h-full overflow-hidden border-border/50 transition-all hover:shadow-lg hover:-translate-y-1 hover:border-primary/20">
                    <div className="relative aspect-[16/9] overflow-hidden bg-muted">
                      {article.featured_image_url ? (
                        <img src={article.featured_image_url} alt={title} className="h-full w-full object-cover transition-transform group-hover:scale-105" loading="lazy" />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <Newspaper className="h-10 w-10 text-muted-foreground/20" />
                        </div>
                      )}
                      <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/20 to-transparent" />
                      <Badge className="absolute start-2.5 top-2.5" variant="secondary">{article.type}</Badge>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="mb-1.5 line-clamp-2 text-sm font-semibold group-hover:text-primary transition-colors">{title}</h3>
                      {excerpt && <p className="mb-2 line-clamp-2 text-xs text-muted-foreground">{excerpt}</p>}
                      {article.published_at && (
                        <p className="text-[10px] text-muted-foreground">{format(new Date(article.published_at), "MMM d, yyyy")}</p>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Why Altohaa */}
      <section className="bg-muted/30 py-14 md:py-20">
        <div className="container">
          <div className="mb-10 text-center">
            <Badge variant="secondary" className="mb-3">
              {isAr ? "المميزات" : "Features"}
            </Badge>
            <h2 className="mb-2 font-serif text-2xl font-bold sm:text-3xl md:text-4xl">
              {isAr ? "لماذا ألتوها؟" : "Why Altohaa?"}
            </h2>
            <p className="mx-auto max-w-xl text-sm text-muted-foreground sm:text-base">
              {isAr ? "منصة متكاملة تجمع كل ما يحتاجه عالم الطهي" : "An integrated platform for everything the culinary world needs"}
            </p>
          </div>
          <div className="grid gap-6 grid-cols-2 lg:grid-cols-4">
            {whyUs.map((item) => (
              <div key={item.title} className="flex flex-col items-center text-center">
                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/15">
                  <item.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="mb-1 text-sm font-semibold">{item.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Cards */}
      <section className="container py-14 md:py-20">
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="group border-primary/10 bg-gradient-to-br from-primary/5 to-transparent transition-all hover:shadow-lg hover:border-primary/20">
            <CardContent className="p-6 md:p-8">
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                <Star className="h-5 w-5 text-primary" />
              </div>
              <h3 className="mb-1.5 font-serif text-xl font-bold md:text-2xl">
                {isAr ? "هل أنت راعٍ أو شركة؟" : "Are You a Sponsor?"}
              </h3>
              <p className="mb-5 text-sm text-muted-foreground leading-relaxed">
                {isAr
                  ? "اربط علامتك التجارية بالتميز الطهوي واستفد من شبكة عالمية."
                  : "Connect your brand with culinary excellence and a global network of professionals."}
              </p>
              <Button size="sm" asChild>
                <Link to="/sponsors">
                  {isAr ? "اكتشف فرص الرعاية" : "Explore Sponsorship"}
                  <ArrowRight className="ms-1.5 h-3.5 w-3.5" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="group border-accent/10 bg-gradient-to-br from-accent/5 to-transparent transition-all hover:shadow-lg hover:border-accent/20">
            <CardContent className="p-6 md:p-8">
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10">
                <Trophy className="h-5 w-5 text-accent-foreground" />
              </div>
              <h3 className="mb-1.5 font-serif text-xl font-bold md:text-2xl">
                {isAr ? "هل أنت منظم مسابقات؟" : "Competition Organizer?"}
              </h3>
              <p className="mb-5 text-sm text-muted-foreground leading-relaxed">
                {isAr
                  ? "أنشئ وأدِر مسابقات طهوية احترافية بأدوات رقمية متكاملة."
                  : "Create and manage professional culinary competitions with integrated digital tools."}
              </p>
              <Button variant="secondary" size="sm" asChild>
                <Link to="/for-organizers">
                  {isAr ? "ابدأ التنظيم" : "Start Organizing"}
                  <ArrowRight className="ms-1.5 h-3.5 w-3.5" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Final CTA */}
      {!user && (
        <section className="border-t bg-gradient-to-b from-muted/20 to-background">
          <div className="container py-14 text-center md:py-20">
            <h2 className="mb-3 font-serif text-2xl font-bold sm:text-3xl md:text-4xl">
              {isAr ? "انضم إلى مجتمع الطهي العالمي" : "Join the Global Culinary Community"}
            </h2>
            <p className="mx-auto mb-6 max-w-lg text-sm text-muted-foreground sm:text-base">
              {isAr
                ? "سجل مجاناً واستمتع بجميع مميزات المنصة — مسابقات، دروس متقدمة، شبكة مهنية والمزيد."
                : "Sign up for free and enjoy all platform features — competitions, masterclasses, networking, and more."}
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button size="lg" asChild>
                <Link to="/auth?tab=signup">
                  {isAr ? "أنشئ حسابك المجاني" : "Create Your Free Account"}
                  <ArrowRight className="ms-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/competitions">{isAr ? "تصفح المسابقات" : "Browse Competitions"}</Link>
              </Button>
            </div>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground sm:gap-6 sm:text-sm">
              <div className="flex items-center gap-1.5"><CheckCircle className="h-3.5 w-3.5 text-primary" />{isAr ? "مجاني بالكامل" : "Completely Free"}</div>
              <div className="flex items-center gap-1.5"><CheckCircle className="h-3.5 w-3.5 text-primary" />{isAr ? "بدون بطاقة ائتمان" : "No Credit Card"}</div>
              <div className="flex items-center gap-1.5"><CheckCircle className="h-3.5 w-3.5 text-primary" />{isAr ? "إعداد في دقائق" : "Setup in Minutes"}</div>
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
};

export default Index;
