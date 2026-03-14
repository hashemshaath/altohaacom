import { forwardRef, memo, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  ChefHat,
  Trophy,
  Globe,
  Users,
  Utensils,
  BookOpen,
  Star,
  Calendar,
  Sparkles,
  Search,
  TrendingUp,
  Award,
  MapPin,
} from "lucide-react";

/* ─── Intersection Observer Hook ─── */
function useReveal(threshold = 0.1) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.unobserve(el);
        }
      },
      { threshold, rootMargin: "60px" }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);

  return { ref, visible };
}

/* ─── Section Wrapper ─── */
const Section = forwardRef<HTMLElement, {
  children: React.ReactNode;
  className?: string;
  dark?: boolean;
  id?: string;
}>(function Section({ children, className, dark = false, id }, forwardedRef) {
  const { ref: revealRef, visible } = useReveal();

  const setRef = (node: HTMLElement | null) => {
    revealRef.current = node;
    if (typeof forwardedRef === "function") {
      forwardedRef(node);
      return;
    }
    if (forwardedRef) {
      forwardedRef.current = node;
    }
  };

  return (
    <section
      ref={setRef}
      id={id}
      className={cn(
        "transition-all duration-700 ease-out",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
        dark && "bg-foreground text-background",
        className
      )}
    >
      {children}
    </section>
  );
});
Section.displayName = "Section";

/* ─── Editorial Hero ─── */
const EditorialHero = memo(function EditorialHero({ isAr }: { isAr: boolean }) {
  return (
    <section className="relative min-h-[85vh] flex items-center overflow-hidden bg-foreground">
      {/* Abstract background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-[60%] h-full bg-gradient-to-l from-primary/30 to-transparent" />
        <div className="absolute bottom-0 left-0 w-[40%] h-[60%] bg-gradient-to-tr from-accent/20 to-transparent" />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--primary) / 0.15) 1px, transparent 0)`,
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <div className="container relative z-10 py-16 md:py-24">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left — Typography */}
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/15 text-primary text-xs font-bold tracking-widest uppercase">
              <Sparkles className="h-3.5 w-3.5" />
              {isAr ? "المنصة الأولى عالمياً" : "World's #1 Platform"}
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-serif font-bold leading-[1.05] tracking-tight text-background">
              {isAr ? (
                <>
                  اصنع{" "}
                  <span className="text-primary">مستقبلك</span>{" "}
                  في عالم الطهي
                </>
              ) : (
                <>
                  Shape Your{" "}
                  <span className="text-primary">Culinary</span>{" "}
                  Future
                </>
              )}
            </h1>

            <p className="text-lg md:text-xl text-background/70 max-w-lg leading-relaxed font-light">
              {isAr
                ? "انضم لأكبر مجتمع طهوي عالمي يضم أكثر من 50,000 طاهٍ من 120 دولة. سجّل في المسابقات، وتواصل مع الخبراء."
                : "Join 50,000+ chefs across 120 countries. Compete in world-class events, connect with industry leaders, and elevate your craft."}
            </p>

            <div className="flex flex-wrap gap-4">
              <Button asChild size="lg" className="rounded-xl text-base px-8 h-13 font-semibold">
                <Link to="/register">
                  {isAr ? "انضم الآن" : "Join Now"}
                  <ArrowRight className="ms-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="rounded-xl text-base px-8 h-13 border-background/20 text-background hover:bg-background/10 hover:text-background"
              >
                <Link to="/competitions">
                  {isAr ? "استكشف المسابقات" : "Explore Events"}
                </Link>
              </Button>
            </div>
          </div>

          {/* Right — Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: Users, value: "50K+", label: isAr ? "طاهٍ مسجل" : "Registered Chefs" },
              { icon: Globe, value: "120+", label: isAr ? "دولة" : "Countries" },
              { icon: Trophy, value: "500+", label: isAr ? "مسابقة" : "Competitions" },
              { icon: Award, value: "10K+", label: isAr ? "شهادة" : "Certificates" },
            ].map((stat, i) => (
              <div
                key={i}
                className={cn(
                  "relative rounded-2xl border border-background/10 bg-background/5 backdrop-blur-sm p-6 transition-all duration-300 hover:bg-background/10 hover:border-primary/30 group",
                  i === 0 && "col-span-2 sm:col-span-1"
                )}
              >
                <stat.icon className="h-6 w-6 text-primary mb-4 transition-transform duration-300 group-hover:scale-110" />
                <p className="text-3xl md:text-4xl font-serif font-bold text-background">{stat.value}</p>
                <p className="text-sm text-background/60 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
});

/* ─── Quick Search Bar ─── */
function EditorialSearch({ isAr }: { isAr: boolean }) {
  return (
    <Section className="py-0 -mt-7 relative z-20">
      <div className="container">
        <Link
          to="/search"
          className="flex items-center gap-4 rounded-2xl bg-card border border-border shadow-lg px-6 py-4 max-w-2xl mx-auto transition-all duration-300 hover:shadow-xl hover:border-primary/30 group"
        >
          <Search className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
          <span className="text-muted-foreground text-base">
            {isAr ? "ابحث عن طهاة، مسابقات، وصفات..." : "Search chefs, competitions, recipes..."}
          </span>
          <ArrowRight className="h-4 w-4 text-muted-foreground ms-auto group-hover:text-primary group-hover:translate-x-1 transition-all" />
        </Link>
      </div>
    </Section>
  );
}

/* ─── Category Cards ─── */
function EditorialCategories({ isAr }: { isAr: boolean }) {
  const cats = [
    { icon: Trophy, label: isAr ? "المسابقات" : "Competitions", href: "/competitions", color: "from-primary/20 to-primary/5" },
    { icon: ChefHat, label: isAr ? "الطهاة" : "Chefs", href: "/chefs", color: "from-accent/20 to-accent/5" },
    { icon: Calendar, label: isAr ? "الفعاليات" : "Events", href: "/events", color: "from-info/20 to-info/5" },
    { icon: BookOpen, label: isAr ? "المقالات" : "Articles", href: "/articles", color: "from-success/20 to-success/5" },
    { icon: Utensils, label: isAr ? "الوصفات" : "Recipes", href: "/recipes", color: "from-warning/20 to-warning/5" },
    { icon: MapPin, label: isAr ? "المعارض" : "Exhibitions", href: "/exhibitions", color: "from-destructive/20 to-destructive/5" },
  ];

  return (
    <Section className="py-16 md:py-20">
      <div className="container">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground">
            {isAr ? "استكشف المنصة" : "Explore the Platform"}
          </h2>
          <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
            {isAr ? "اكتشف كل ما تحتاجه لتطوير مسيرتك في عالم الطهي" : "Discover everything you need to elevate your culinary journey"}
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {cats.map((cat) => (
            <Link
              key={cat.href}
              to={cat.href}
              className="group flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover:shadow-lg hover:border-primary/30 hover:-translate-y-1"
            >
              <div className={cn("rounded-xl p-3 bg-gradient-to-br transition-transform duration-300 group-hover:scale-110", cat.color)}>
                <cat.icon className="h-6 w-6 text-foreground" />
              </div>
              <span className="text-sm font-semibold text-foreground">{cat.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </Section>
  );
}

interface EditorialCompetition {
  id: string;
  title: string;
  title_ar: string | null;
  cover_image_url: string | null;
  competition_start: string | null;
  venue: string | null;
  country_code: string | null;
  status: string | null;
}

interface EditorialChef {
  user_id: string;
  full_name: string | null;
  full_name_ar: string | null;
  avatar_url: string | null;
  country_code: string | null;
}

/* ─── Featured Competitions ─── */
function EditorialCompetitions({ isAr }: { isAr: boolean }) {
  const { data: competitions = [] } = useQuery<EditorialCompetition[]>({
    queryKey: ["editorial-competitions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("competitions")
        .select("id, title, title_ar, cover_image_url, competition_start, venue, country_code, status")
        .in("status", ["registration_open", "upcoming", "in_progress"])
        .order("competition_start", { ascending: true })
        .limit(4);

      if (error) return [];
      return (data || []) as EditorialCompetition[];
    },
    staleTime: 1000 * 60 * 5,
  });

  return (
    <Section className="py-16 md:py-24 bg-muted/30" id="competitions">
      <div className="container">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-primary text-xs font-bold tracking-widest uppercase mb-2">
              {isAr ? "قادم قريباً" : "Coming Up"}
            </p>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground">
              {isAr ? "المسابقات المميزة" : "Featured Competitions"}
            </h2>
          </div>
          <Button asChild variant="ghost" className="hidden sm:flex text-primary hover:text-primary">
            <Link to="/competitions">
              {isAr ? "عرض الكل" : "View All"} <ArrowRight className="ms-1 h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {competitions.length > 0
            ? competitions.map((comp) => (
                <Link
                  key={comp.id}
                  to={`/competition/${comp.id}`}
                  className="group rounded-2xl border border-border bg-card overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                >
                  <div className="aspect-[4/3] bg-muted relative overflow-hidden">
                    {comp.cover_image_url ? (
                      <img
                        src={comp.cover_image_url}
                        alt={isAr ? comp.title_ar || comp.title : comp.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
                        <Trophy className="h-10 w-10 text-primary/40" />
                      </div>
                    )}
                    {comp.status && (
                      <span className="absolute top-3 start-3 bg-primary text-primary-foreground text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                        {comp.status}
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-foreground line-clamp-2 text-sm">
                      {isAr ? comp.title_ar || comp.title : comp.title}
                    </h3>
                    {(comp.venue || comp.country_code) && (
                      <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {[comp.venue, comp.country_code].filter(Boolean).join(" • ")}
                      </p>
                    )}
                  </div>
                </Link>
              ))
            : Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-2xl border border-border bg-card overflow-hidden animate-pulse">
                  <div className="aspect-[4/3] bg-muted" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                </div>
              ))}
        </div>

        <div className="sm:hidden mt-6 text-center">
          <Button asChild variant="outline" className="rounded-xl">
            <Link to="/competitions">{isAr ? "عرض الكل" : "View All"}</Link>
          </Button>
        </div>
      </div>
    </Section>
  );
}

/* ─── Featured Chefs ─── */
function EditorialChefs({ isAr }: { isAr: boolean }) {
  const { data: chefs = [] } = useQuery<EditorialChef[]>({
    queryKey: ["editorial-chefs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, full_name, full_name_ar, avatar_url, country_code")
        .not("avatar_url", "is", null)
        .order("created_at", { ascending: false })
        .limit(8);

      if (error) return [];
      return (data || []) as EditorialChef[];
    },
    staleTime: 1000 * 60 * 5,
  });

  return (
    <Section className="py-16 md:py-24" id="chefs">
      <div className="container">
        <div className="text-center mb-10">
          <p className="text-primary text-xs font-bold tracking-widest uppercase mb-2">
            {isAr ? "مجتمعنا" : "Our Community"}
          </p>
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground">
            {isAr ? "طهاة مميزون" : "Featured Chefs"}
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
          {(chefs.length > 0 ? chefs : Array.from({ length: 8 })).map((chef, i) => (
            <div key={chef?.user_id || i} className="group text-center">
              {chef?.user_id ? (
                <Link to={`/chef/${chef.user_id}`} className="block">
                  <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border-2 border-border group-hover:border-primary transition-colors duration-300 mb-2">
                    <img
                      src={chef.avatar_url || ""}
                      alt={isAr ? chef.full_name_ar || chef.full_name || "Chef" : chef.full_name || "Chef"}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                  <p className="text-xs font-semibold text-foreground line-clamp-1">
                    {isAr ? chef.full_name_ar || chef.full_name : chef.full_name}
                  </p>
                  {chef.country_code && (
                    <p className="text-[10px] text-muted-foreground mt-0.5">{chef.country_code}</p>
                  )}
                </Link>
              ) : (
                <div className="animate-pulse">
                  <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-muted mb-2" />
                  <div className="h-3 bg-muted rounded w-2/3 mx-auto" />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="text-center mt-8">
          <Button asChild variant="outline" className="rounded-xl">
            <Link to="/chefs">
              {isAr ? "عرض جميع الطهاة" : "Browse All Chefs"} <ArrowRight className="ms-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </Section>
  );
}

/* ─── Stats Band (dark inversion) ─── */
function EditorialStats({ isAr }: { isAr: boolean }) {
  const stats = [
    { icon: TrendingUp, value: "1M+", label: isAr ? "زيارة شهرية" : "Monthly Visits" },
    { icon: Star, value: "4.9", label: isAr ? "تقييم المنصة" : "Platform Rating" },
    { icon: Users, value: "50K+", label: isAr ? "عضو نشط" : "Active Members" },
    { icon: Trophy, value: "500+", label: isAr ? "مسابقة سنوياً" : "Events Yearly" },
  ];

  return (
    <section className="bg-foreground py-16 md:py-20">
      <div className="container">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {stats.map((s, i) => (
            <div key={i} className="text-center group">
              <s.icon className="h-7 w-7 text-primary mx-auto mb-3 transition-transform duration-300 group-hover:scale-110" />
              <p className="text-3xl md:text-4xl font-serif font-bold text-background">{s.value}</p>
              <p className="text-sm text-background/60 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Articles / Blog ─── */
function EditorialArticles({ isAr }: { isAr: boolean }) {
  const { data: articles = [] } = useQuery({
    queryKey: ["editorial-articles"],
    queryFn: async () => {
      const { data } = await supabase
        .from("articles")
        .select("id, title, title_ar, excerpt, excerpt_ar, featured_image_url, slug, published_at")
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(3);
      return data || [];
    },
    staleTime: 1000 * 60 * 5,
  });

  return (
    <Section className="py-16 md:py-24" id="articles">
      <div className="container">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-primary text-xs font-bold tracking-widest uppercase mb-2">
              {isAr ? "آخر الأخبار" : "Latest News"}
            </p>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground">
              {isAr ? "المقالات والأخبار" : "Articles & Insights"}
            </h2>
          </div>
          <Button asChild variant="ghost" className="hidden sm:flex text-primary hover:text-primary">
            <Link to="/articles">
              {isAr ? "عرض الكل" : "View All"} <ArrowRight className="ms-1 h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {(articles.length > 0 ? articles : Array.from({ length: 3 })).map((article: any, i) => (
            <article key={article?.id || i}>
              {article?.id ? (
                <Link
                  to={`/article/${article.slug}`}
                  className="group block rounded-2xl border border-border bg-card overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                >
                  <div className="aspect-[16/9] bg-muted overflow-hidden">
                    {article.featured_image_url ? (
                      <img
                        src={article.featured_image_url}
                        alt={isAr ? article.title_ar : article.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
                        <BookOpen className="h-8 w-8 text-primary/40" />
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <h3 className="font-semibold text-foreground line-clamp-2 mb-2">
                      {isAr ? article.title_ar || article.title : article.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {isAr ? article.excerpt_ar || article.excerpt : article.excerpt}
                    </p>
                  </div>
                </Link>
              ) : (
                <div className="rounded-2xl border border-border bg-card overflow-hidden animate-pulse">
                  <div className="aspect-[16/9] bg-muted" />
                  <div className="p-5 space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-full" />
                  </div>
                </div>
              )}
            </article>
          ))}
        </div>
      </div>
    </Section>
  );
}

/* ─── Testimonials ─── */
function EditorialTestimonials({ isAr }: { isAr: boolean }) {
  const testimonials = [
    {
      quote: isAr ? "منصة غيّرت مسيرتي المهنية بالكامل" : "This platform completely transformed my career",
      name: isAr ? "شيف أحمد" : "Chef Ahmed",
      role: isAr ? "طاهٍ تنفيذي" : "Executive Chef",
    },
    {
      quote: isAr ? "أفضل مكان للتواصل مع خبراء الطهي العالميين" : "The best place to connect with global culinary experts",
      name: isAr ? "شيف سارة" : "Chef Sarah",
      role: isAr ? "مستشارة طعام" : "Food Consultant",
    },
    {
      quote: isAr ? "المسابقات هنا على مستوى عالمي حقيقي" : "The competitions here are truly world-class",
      name: isAr ? "شيف ماركو" : "Chef Marco",
      role: isAr ? "بطل دولي" : "International Champion",
    },
  ];

  return (
    <Section className="py-16 md:py-24 bg-muted/30" id="testimonials">
      <div className="container">
        <div className="text-center mb-10">
          <p className="text-primary text-xs font-bold tracking-widest uppercase mb-2">
            {isAr ? "شهادات" : "Testimonials"}
          </p>
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground">
            {isAr ? "ماذا يقول الطهاة" : "What Chefs Say"}
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {testimonials.map((t, i) => (
            <div
              key={i}
              className="rounded-2xl border border-border bg-card p-6 md:p-8 transition-all duration-300 hover:shadow-lg"
            >
              <Star className="h-5 w-5 text-primary mb-4" />
              <blockquote className="text-foreground font-medium leading-relaxed mb-6">
                "{t.quote}"
              </blockquote>
              <div>
                <p className="font-semibold text-foreground text-sm">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

/* ─── Newsletter CTA ─── */
function EditorialNewsletter({ isAr }: { isAr: boolean }) {
  return (
    <Section className="py-16 md:py-24">
      <div className="container">
        <div className="max-w-3xl mx-auto text-center rounded-3xl bg-gradient-to-br from-foreground to-foreground/95 p-10 md:p-16 relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--primary) / 0.3) 1px, transparent 0)`,
              backgroundSize: "32px 32px",
            }}
          />
          <div className="relative z-10">
            <Sparkles className="h-8 w-8 text-primary mx-auto mb-4" />
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-background mb-3">
              {isAr ? "لا تفوّت أي تحديث" : "Never Miss an Update"}
            </h2>
            <p className="text-background/60 mb-8 max-w-md mx-auto">
              {isAr
                ? "اشترك في نشرتنا الإخبارية واحصل على آخر الأخبار والمسابقات مباشرة."
                : "Subscribe to our newsletter and get the latest competitions, news, and culinary insights delivered directly."}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder={isAr ? "بريدك الإلكتروني" : "Your email address"}
                className="flex-1 rounded-xl bg-background/10 border border-background/20 px-5 py-3 text-background placeholder:text-background/40 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                dir={isAr ? "rtl" : "ltr"}
              />
              <Button className="rounded-xl px-6 h-12 font-semibold">
                {isAr ? "اشترك" : "Subscribe"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}

/* ─── Platform Features ─── */
function EditorialFeatures({ isAr }: { isAr: boolean }) {
  const features = [
    { icon: Trophy, title: isAr ? "مسابقات عالمية" : "Global Competitions", desc: isAr ? "شارك في أرقى المسابقات" : "Compete in world-class culinary events" },
    { icon: ChefHat, title: isAr ? "ملف احترافي" : "Professional Profile", desc: isAr ? "أنشئ ملفك الاحترافي" : "Build your professional portfolio" },
    { icon: BookOpen, title: isAr ? "محتوى تعليمي" : "Learning Content", desc: isAr ? "دورات ومقالات حصرية" : "Exclusive courses and masterclasses" },
    { icon: Users, title: isAr ? "تواصل مهني" : "Networking", desc: isAr ? "تواصل مع الخبراء" : "Connect with industry leaders" },
    { icon: Award, title: isAr ? "شهادات معتمدة" : "Certifications", desc: isAr ? "احصل على شهادات رسمية" : "Earn verified certificates" },
    { icon: Globe, title: isAr ? "تغطية عالمية" : "Global Reach", desc: isAr ? "حضور في 120+ دولة" : "Present in 120+ countries" },
  ];

  return (
    <Section className="py-16 md:py-24 bg-muted/30" id="features">
      <div className="container">
        <div className="text-center mb-12">
          <p className="text-primary text-xs font-bold tracking-widest uppercase mb-2">
            {isAr ? "لماذا نحن" : "Why Choose Us"}
          </p>
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground">
            {isAr ? "مميزات المنصة" : "Platform Features"}
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {features.map((f, i) => (
            <div
              key={i}
              className="rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover:shadow-lg hover:border-primary/30 group"
            >
              <div className="rounded-xl bg-primary/10 w-12 h-12 flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110">
                <f.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

/* ─── Main Editorial Homepage ─── */
const EditorialHomepage = memo(function EditorialHomepage() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  return (
    <div className="flex flex-col">
      <EditorialHero isAr={isAr} />
      <EditorialSearch isAr={isAr} />
      <EditorialCategories isAr={isAr} />
      <EditorialCompetitions isAr={isAr} />
      <EditorialChefs isAr={isAr} />
      <EditorialStats isAr={isAr} />
      <EditorialArticles isAr={isAr} />
      <EditorialFeatures isAr={isAr} />
      <EditorialTestimonials isAr={isAr} />
      <EditorialNewsletter isAr={isAr} />
    </div>
  );
});

export default EditorialHomepage;
