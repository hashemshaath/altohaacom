import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
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

  // Fetch upcoming competitions
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

  // Fetch latest news
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

  // Fetch entities
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

  // Stats
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
    { icon: Users, title: isAr ? "المجتمع المهني" : "Professional Community", desc: isAr ? "تواصل مع طهاة محترفين من جميع أنحاء العالم، شارك وصفاتك وخبراتك وابنِ شبكة مهنية قوية." : "Connect with professional chefs worldwide, share recipes and expertise, and build a powerful professional network.", href: "/community" },
    { icon: Trophy, title: isAr ? "المسابقات الطهوية" : "Culinary Competitions", desc: isAr ? "شارك في مسابقات طهي عالمية ومحلية لجميع المستويات مع نظام تحكيم رقمي احترافي." : "Participate in global and local culinary competitions at all levels with a professional digital judging system.", href: "/competitions" },
    { icon: GraduationCap, title: isAr ? "الدروس المتقدمة" : "Masterclasses", desc: isAr ? "تعلم من أفضل الطهاة في العالم من خلال دروس متقدمة وورش عمل تفاعلية ومحتوى تعليمي حصري." : "Learn from the world's best chefs through advanced lessons, interactive workshops, and exclusive educational content.", href: "/masterclasses" },
    { icon: Building2, title: isAr ? "الجهات والجمعيات" : "Entities & Associations", desc: isAr ? "اكتشف وتابع الجمعيات الطهوية والأكاديميات والجهات الحكومية المعنية بالطهي محلياً ودولياً." : "Discover and follow culinary associations, academies, and government entities locally and internationally.", href: "/entities" },
    { icon: Newspaper, title: isAr ? "الأخبار والمعارض" : "News & Exhibitions", desc: isAr ? "ابقَ على اطلاع بآخر الأخبار والمعارض والفعاليات في عالم الطهي حول العالم." : "Stay updated with the latest news, exhibitions, and events in the culinary world around the globe.", href: "/news" },
    { icon: ShoppingBag, title: isAr ? "المتجر الطهوي" : "Culinary Shop", desc: isAr ? "اكتشف أدوات الطهي الفاخرة والكتب والوصفات والخدمات المهنية في متجرنا المتخصص." : "Discover premium culinary tools, books, recipes, and professional services in our specialized shop.", href: "#", comingSoon: true },
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
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-accent/20" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_hsl(var(--primary)/0.15),_transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_hsl(var(--accent)/0.15),_transparent_50%)]" />
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-primary/10 blur-3xl animate-pulse" />
        <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-accent/10 blur-3xl animate-pulse" />

        <div className="container relative flex flex-col items-center py-20 text-center md:py-28">
          <div className="mb-6 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 p-4 ring-1 ring-primary/20">
            <img src="/altohaa-logo.png" alt="Altohaa" className="h-20 w-auto md:h-28" />
          </div>
          <h1 className="mb-4 font-serif text-4xl font-bold tracking-tight md:text-6xl">
            <span className="bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent">
              Altohaa
            </span>
          </h1>
          <p className="mb-2 font-serif text-xl text-primary md:text-2xl">
            {isAr ? "مجتمع الطهي العالمي" : "The Global Culinary Community"}
          </p>
          <p className="mb-8 max-w-2xl text-muted-foreground md:text-lg">
            {isAr
              ? "المنصة الرائدة التي تجمع الطهاة المحترفين والحكام والمنظمين والرعاة في مكان واحد. تنافس، تعلم، وتطور في عالم الطهي."
              : "The premier platform uniting professional chefs, judges, organizers, and sponsors in one place. Compete, learn, and grow in the culinary world."}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {user ? (
              <Button size="lg" className="group transition-all duration-300 hover:shadow-lg hover:shadow-primary/25" asChild>
                <Link to="/dashboard">
                  {isAr ? "لوحة التحكم" : "Dashboard"}
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            ) : (
              <>
                <Button size="lg" className="group transition-all duration-300 hover:shadow-lg hover:shadow-primary/25" asChild>
                  <Link to="/auth?tab=signup">
                    {t("joinNow")}
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="transition-all duration-300" asChild>
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

      {/* Stats Banner */}
      <section className="border-y bg-muted/30">
        <div className="container grid grid-cols-3 gap-4 py-8 md:py-10">
          {[
            { value: stats?.members || 0, label: isAr ? "عضو مسجل" : "Registered Members" },
            { value: stats?.competitions || 0, label: isAr ? "مسابقة" : "Competitions" },
            { value: stats?.entities || 0, label: isAr ? "جهة وجمعية" : "Entities & Associations" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-2xl font-bold text-primary md:text-3xl">{stat.value}+</p>
              <p className="text-xs text-muted-foreground md:text-sm">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Services / Platform Features */}
      <section className="container py-16 md:py-24">
        <div className="mb-12 text-center">
          <h2 className="mb-3 font-serif text-3xl font-bold md:text-4xl">
            {isAr ? "خدمات ومميزات المنصة" : "Platform Services & Features"}
          </h2>
          <p className="mx-auto max-w-2xl text-muted-foreground">
            {isAr
              ? "كل ما يحتاجه محترف الطهي في منصة واحدة متكاملة"
              : "Everything a culinary professional needs in one integrated platform"}
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => (
            <Card key={s.title} className="group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <CardContent className="relative flex flex-col p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary/10 to-accent/10 ring-1 ring-primary/10 transition-all duration-300 group-hover:ring-primary/30 group-hover:shadow-lg group-hover:shadow-primary/10">
                  <s.icon className="h-6 w-6 text-primary transition-transform duration-300 group-hover:scale-110" />
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-semibold">{s.title}</h3>
                  {s.comingSoon && <Badge variant="secondary" className="text-xs">{t("comingSoon")}</Badge>}
                </div>
                <p className="mb-4 flex-1 text-sm text-muted-foreground">{s.desc}</p>
                {!s.comingSoon && (
                  <Button variant="ghost" size="sm" className="w-fit" asChild>
                    <Link to={s.href}>
                      {isAr ? "اكتشف المزيد" : "Explore"}
                      <ArrowRight className="ml-1 h-3 w-3" />
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Open Competitions */}
      {competitions && competitions.length > 0 && (
        <section className="bg-muted/30 py-16 md:py-24">
          <div className="container">
            <div className="mb-10 flex flex-col items-center justify-between gap-4 sm:flex-row">
              <div>
                <h2 className="font-serif text-3xl font-bold md:text-4xl">
                  {isAr ? "مسابقات مفتوحة للتسجيل" : "Open Competitions"}
                </h2>
                <p className="text-muted-foreground">
                  {isAr ? "سجل الآن في أحدث المسابقات الطهوية" : "Register now for the latest culinary competitions"}
                </p>
              </div>
              <Button variant="outline" asChild>
                <Link to="/competitions">
                  {isAr ? "عرض الكل" : "View All"}
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {competitions.map((comp: any) => {
                const title = isAr && comp.title_ar ? comp.title_ar : comp.title;
                return (
                  <Card key={comp.id} className="group overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                    <div className="relative h-40 overflow-hidden bg-gradient-to-br from-primary/20 to-accent/20">
                      {comp.cover_image_url ? (
                        <img src={comp.cover_image_url} alt={title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                      ) : (
                        <div className="flex h-full items-center justify-center"><Trophy className="h-12 w-12 text-primary/30" /></div>
                      )}
                      <Badge className="absolute right-2 top-2 bg-primary/90 text-primary-foreground">
                        {comp.status === "registration_open" ? (isAr ? "التسجيل مفتوح" : "Registration Open") : (isAr ? "قادمة" : "Upcoming")}
                      </Badge>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="mb-2 line-clamp-2 font-semibold">{title}</h3>
                      <div className="space-y-1 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>{format(new Date(comp.competition_start), "MMM d, yyyy")}</span>
                        </div>
                        {comp.is_virtual ? (
                          <div className="flex items-center gap-1.5"><Globe className="h-3.5 w-3.5" /><span>{isAr ? "افتراضي" : "Virtual"}</span></div>
                        ) : comp.city ? (
                          <div className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /><span>{comp.city}{comp.country ? `, ${comp.country}` : ""}</span></div>
                        ) : null}
                        <div className="flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5" />
                          <span>{comp.competition_registrations?.length || 0} {isAr ? "مشارك" : "participants"}</span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="p-4 pt-0">
                      <Button variant="outline" size="sm" className="w-full" asChild>
                        <Link to={`/competitions/${comp.id}`}>{isAr ? "عرض التفاصيل" : "View Details"}</Link>
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Who Is Altohaa For */}
      <section className="container py-16 md:py-24">
        <div className="mb-12 text-center">
          <h2 className="mb-3 font-serif text-3xl font-bold md:text-4xl">
            {isAr ? "لمن هذه المنصة؟" : "Who Is Altohaa For?"}
          </h2>
          <p className="mx-auto max-w-2xl text-muted-foreground">
            {isAr ? "منصة مصممة لخدمة كل المحترفين في عالم الطهي" : "A platform designed to serve every professional in the culinary world"}
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          {roles.map((role) => (
            <Card key={role.title} className="text-center transition-all duration-300 hover:shadow-md hover:-translate-y-1">
              <CardContent className="p-5">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <role.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-1 font-semibold text-sm">{role.title}</h3>
                <p className="text-xs text-muted-foreground">{role.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        {!user && (
          <div className="mt-8 text-center">
            <Button size="lg" asChild>
              <Link to="/auth?tab=signup">
                {isAr ? "سجل مجاناً الآن" : "Sign Up Free Now"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        )}
      </section>

      {/* Entities & Associations */}
      {entities && entities.length > 0 && (
        <section className="bg-muted/30 py-16 md:py-24">
          <div className="container">
            <div className="mb-10 flex flex-col items-center justify-between gap-4 sm:flex-row">
              <div>
                <h2 className="font-serif text-3xl font-bold md:text-4xl">
                  {isAr ? "الجهات والجمعيات المعتمدة" : "Verified Entities & Associations"}
                </h2>
                <p className="text-muted-foreground">
                  {isAr ? "شبكة واسعة من الجمعيات والأكاديميات الطهوية حول العالم" : "A wide network of culinary associations and academies worldwide"}
                </p>
              </div>
              <Button variant="outline" asChild>
                <Link to="/entities">
                  {isAr ? "عرض الكل" : "View All"}
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
              {entities.map((entity: any) => {
                const name = isAr && entity.name_ar ? entity.name_ar : entity.name;
                return (
                  <Link key={entity.id} to={`/entities/${entity.slug}`} className="block">
                    <Card className="h-full text-center transition-all duration-300 hover:shadow-md hover:-translate-y-1">
                      <CardContent className="p-4">
                        {entity.logo_url ? (
                          <img src={entity.logo_url} alt={name} className="mx-auto mb-3 h-14 w-14 rounded-lg object-cover" />
                        ) : (
                          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-lg bg-primary/10">
                            <Building2 className="h-7 w-7 text-primary" />
                          </div>
                        )}
                        <h3 className="mb-1 text-sm font-semibold line-clamp-2">{name}</h3>
                        <div className="flex items-center justify-center gap-1">
                          {entity.is_verified && <ShieldCheck className="h-3 w-3 text-primary" />}
                          <span className="text-xs text-muted-foreground">{entity.country || ""}</span>
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

      {/* Latest News */}
      {articles && articles.length > 0 && (
        <section className="container py-16 md:py-24">
          <div className="mb-10 flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div>
              <h2 className="font-serif text-3xl font-bold md:text-4xl">
                {isAr ? "آخر الأخبار والمقالات" : "Latest News & Articles"}
              </h2>
              <p className="text-muted-foreground">
                {isAr ? "ابقَ على اطلاع بآخر المستجدات في عالم الطهي" : "Stay up to date with the latest culinary world updates"}
              </p>
            </div>
            <Button variant="outline" asChild>
              <Link to="/news">
                {isAr ? "عرض الكل" : "View All"}
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((article: any) => {
              const title = isAr && article.title_ar ? article.title_ar : article.title;
              const excerpt = isAr && article.excerpt_ar ? article.excerpt_ar : article.excerpt;
              return (
                <Card key={article.id} className="group overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                  <div className="relative h-48 overflow-hidden bg-gradient-to-br from-primary/10 to-accent/10">
                    {article.featured_image_url ? (
                      <img src={article.featured_image_url} alt={title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                    ) : (
                      <div className="flex h-full items-center justify-center"><Newspaper className="h-12 w-12 text-primary/30" /></div>
                    )}
                    <Badge className="absolute left-3 top-3" variant="secondary">{article.type}</Badge>
                  </div>
                  <CardContent className="p-5">
                    <h3 className="mb-2 line-clamp-2 font-semibold">{title}</h3>
                    {excerpt && <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">{excerpt}</p>}
                    {article.published_at && (
                      <p className="text-xs text-muted-foreground">{format(new Date(article.published_at), "MMM d, yyyy")}</p>
                    )}
                  </CardContent>
                  <CardFooter className="p-5 pt-0">
                    <Button variant="ghost" size="sm" asChild>
                      <Link to={`/news/${article.slug}`}>
                        {isAr ? "اقرأ المزيد" : "Read More"}
                        <ArrowRight className="ml-1 h-3 w-3" />
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {/* Why Altohaa */}
      <section className="bg-muted/30 py-16 md:py-24">
        <div className="container">
          <div className="mb-12 text-center">
            <h2 className="mb-3 font-serif text-3xl font-bold md:text-4xl">
              {isAr ? "لماذا ألتوها؟" : "Why Altohaa?"}
            </h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              {isAr ? "منصة متكاملة تجمع كل ما يحتاجه عالم الطهي في مكان واحد" : "An integrated platform bringing everything the culinary world needs into one place"}
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {whyUs.map((item) => (
              <div key={item.title} className="flex flex-col items-center text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/20">
                  <item.icon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="mb-1 font-semibold">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For Sponsors & Organizers CTA */}
      <section className="container py-16 md:py-24">
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardContent className="p-8">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Star className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 font-serif text-2xl font-bold">
                {isAr ? "هل أنت راعٍ أو شركة؟" : "Are You a Sponsor or Company?"}
              </h3>
              <p className="mb-6 text-muted-foreground">
                {isAr
                  ? "اربط علامتك التجارية بالتميز الطهوي واستفد من شبكة عالمية من المحترفين والجمهور."
                  : "Connect your brand with culinary excellence and benefit from a global network of professionals and audiences."}
              </p>
              <Button asChild>
                <Link to="/sponsors">
                  {isAr ? "اكتشف فرص الرعاية" : "Explore Sponsorship"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-accent/20 bg-gradient-to-br from-accent/5 to-transparent">
            <CardContent className="p-8">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
                <Trophy className="h-6 w-6 text-accent" />
              </div>
              <h3 className="mb-2 font-serif text-2xl font-bold">
                {isAr ? "هل أنت منظم مسابقات؟" : "Are You a Competition Organizer?"}
              </h3>
              <p className="mb-6 text-muted-foreground">
                {isAr
                  ? "أنشئ وأدِر مسابقات طهوية احترافية بأدوات رقمية متكاملة من التسجيل حتى إعلان الفائزين."
                  : "Create and manage professional culinary competitions with integrated digital tools from registration to announcing winners."}
              </p>
              <Button variant="secondary" asChild>
                <Link to="/for-organizers">
                  {isAr ? "ابدأ التنظيم" : "Start Organizing"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Final CTA */}
      {!user && (
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10" />
          <div className="container relative py-16 text-center md:py-24">
            <h2 className="mb-4 font-serif text-3xl font-bold md:text-4xl">
              {isAr ? "انضم إلى مجتمع الطهي العالمي اليوم" : "Join the Global Culinary Community Today"}
            </h2>
            <p className="mx-auto mb-8 max-w-xl text-muted-foreground">
              {isAr
                ? "سجل مجاناً واستمتع بجميع مميزات المنصة — مسابقات، دروس متقدمة، شبكة مهنية والمزيد."
                : "Sign up for free and enjoy all platform features — competitions, masterclasses, professional networking, and more."}
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button size="lg" asChild>
                <Link to="/auth?tab=signup">
                  {isAr ? "أنشئ حسابك المجاني" : "Create Your Free Account"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/competitions">{isAr ? "تصفح المسابقات" : "Browse Competitions"}</Link>
              </Button>
            </div>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4 text-primary" />{isAr ? "مجاني بالكامل" : "Completely Free"}</div>
              <div className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4 text-primary" />{isAr ? "بدون بطاقة ائتمان" : "No Credit Card"}</div>
              <div className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4 text-primary" />{isAr ? "إعداد في دقائق" : "Setup in Minutes"}</div>
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
};

export default Index;
