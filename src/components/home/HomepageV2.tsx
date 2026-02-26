import { lazy, Suspense, memo, useRef, useEffect, useState, useCallback } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Calendar, MapPin, Trophy, Users, ChefHat, Globe, Play, Star, BookOpen, Flame } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useCountUp } from "@/hooks/useCountUp";

const NewsletterSignup = lazy(() => import("@/components/home/NewsletterSignup").then(m => ({ default: m.NewsletterSignup })));
const PartnersLogos = lazy(() => import("@/components/home/PartnersLogos").then(m => ({ default: m.PartnersLogos })));

const V2Fallback = memo(() => (
  <div className="container py-8">
    <Skeleton className="h-64 rounded-2xl" />
  </div>
));
V2Fallback.displayName = "V2Fallback";

/* ─── Single stat item (hook-safe) ─── */
function V2StatItem({ stat, index, isVisible }: { stat: { value: number; label: string; icon: any }; index: number; isVisible: boolean }) {
  const count = useCountUp(stat.value, isVisible);
  return (
    <div
      className={cn(
        "text-center transition-all duration-1000",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
      )}
      style={{ transitionDelay: `${index * 150}ms` }}
    >
      <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 mb-4">
        <stat.icon className="h-6 w-6 text-primary" />
      </div>
      <p className="text-4xl sm:text-5xl font-bold tracking-tight tabular-nums">{count}+</p>
      <p className="text-sm text-muted-foreground font-medium mt-2">{stat.label}</p>
    </div>
  );
}

/* ─── Parallax hook ─── */
function useParallax(speed = 0.3) {
  const ref = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf: number;
    const onScroll = () => {
      raf = requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();
        const viewH = window.innerHeight;
        if (rect.bottom > 0 && rect.top < viewH) {
          const progress = (viewH - rect.top) / (viewH + rect.height);
          setOffset((progress - 0.5) * speed * 200);
        }
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => { window.removeEventListener("scroll", onScroll); cancelAnimationFrame(raf); };
  }, [speed]);

  return { ref, offset };
}

/* ─── Cinematic Full-Bleed Hero ─── */
function CinematicHero() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { ref, offset } = useParallax(0.4);

  const { data: featured } = useQuery({
    queryKey: ["v2-featured-comp"],
    queryFn: async () => {
      const { data } = await supabase
        .from("competitions")
        .select("id, title, title_ar, cover_image_url, city, country, competition_start, status")
        .in("status", ["registration_open", "upcoming", "in_progress"])
        .order("competition_start", { ascending: true })
        .limit(1);
      return data?.[0] || null;
    },
    staleTime: 1000 * 60 * 5,
  });

  return (
    <section ref={ref} className="relative h-[85vh] min-h-[560px] max-h-[900px] overflow-hidden">
      {/* Background with parallax */}
      <div
        className="absolute inset-0 scale-110"
        style={{ transform: `translateY(${offset}px) scale(1.1)` }}
      >
        {featured?.cover_image_url ? (
          <img
            src={featured.cover_image_url}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-foreground via-foreground/90 to-primary/30" />
        )}
      </div>

      {/* Cinematic overlays */}
      <div className="absolute inset-0 bg-foreground/50" />
      <div className="absolute inset-0 bg-gradient-to-t from-foreground via-transparent to-foreground/30" />
      <div className="absolute inset-0 bg-gradient-to-r from-foreground/60 via-transparent to-transparent" />

      {/* Animated grain texture overlay */}
      <div className="absolute inset-0 opacity-[0.03] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjMwMCIgaGVpZ2h0PSIzMDAiIGZpbHRlcj0idXJsKCNhKSIgb3BhY2l0eT0iMC4xNSIvPjwvc3ZnPg==')]" />

      {/* Content */}
      <div className="relative h-full flex flex-col justify-end container pb-16 sm:pb-20 lg:pb-24">
        <div className="max-w-2xl space-y-5 animate-[fadeInUp_1s_ease-out]">
          <Badge className="bg-primary/80 text-primary-foreground border-0 backdrop-blur-md px-3 py-1">
            <Flame className="h-3.5 w-3.5 me-1.5" />
            {isAr ? "مسابقة مميزة" : "Featured Competition"}
          </Badge>

          <h1 className={cn(
            "text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold leading-[1.05] text-background tracking-tight",
            !isAr && "font-serif"
          )}>
            {featured
              ? (isAr && featured.title_ar ? featured.title_ar : featured.title)
              : (isAr ? "اكتشف عالم الطهي" : "Discover the Culinary World")}
          </h1>

          {featured && (
            <div className="flex flex-wrap items-center gap-4 text-background/70 text-sm">
              {featured.competition_start && (
                <span className="flex items-center gap-1.5 backdrop-blur-sm bg-background/5 rounded-full px-3 py-1">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(featured.competition_start), "MMMM d, yyyy")}
                </span>
              )}
              {featured.city && (
                <span className="flex items-center gap-1.5 backdrop-blur-sm bg-background/5 rounded-full px-3 py-1">
                  <MapPin className="h-4 w-4" />
                  {featured.city}{featured.country ? `, ${featured.country}` : ""}
                </span>
              )}
            </div>
          )}

          <div className="flex flex-wrap gap-3 pt-2">
            <Button size="lg" className="shadow-2xl text-base px-8" asChild>
              <Link to={featured ? `/competitions/${featured.id}` : "/competitions"}>
                {isAr ? "اكتشف المزيد" : "Explore Now"}
                <ArrowRight className="ms-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="border-background/20 text-background bg-background/10 hover:bg-background/20 backdrop-blur-sm text-base" asChild>
              <Link to="/competitions">
                <Play className="me-2 h-4 w-4" />
                {isAr ? "جميع المسابقات" : "All Competitions"}
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Bottom fade into content */}
      <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
}

/* ─── Immersive Stats ─── */
function ImmersiveStats() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { ref, isVisible } = useScrollReveal({ threshold: 0.3 });

  const { data: stats } = useQuery({
    queryKey: ["home-stats"],
    queryFn: async () => {
      const [profiles, comps, ents, exhs] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("competitions").select("*", { count: "exact", head: true }),
        supabase.from("culinary_entities").select("*", { count: "exact", head: true }),
        supabase.from("exhibitions").select("*", { count: "exact", head: true }),
      ]);
      return {
        members: profiles.count || 0,
        competitions: comps.count || 0,
        entities: ents.count || 0,
        exhibitions: exhs.count || 0,
      };
    },
    staleTime: 1000 * 60 * 5,
  });

  const items = [
    { value: stats?.members || 0, label: isAr ? "عضو مسجل" : "Members", icon: Users },
    { value: stats?.competitions || 0, label: isAr ? "مسابقة" : "Competitions", icon: Trophy },
    { value: stats?.entities || 0, label: isAr ? "جهة" : "Organizations", icon: ChefHat },
    { value: stats?.exhibitions || 0, label: isAr ? "معرض" : "Exhibitions", icon: Globe },
  ];

  return (
    <section ref={ref} className="py-16 sm:py-20">
      <div className="container">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {items.map((stat, i) => (
            <V2StatItem key={stat.label} stat={stat} index={i} isVisible={isVisible} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Cinematic Events Showcase ─── */
function CinematicEvents() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data: comps = [] } = useQuery({
    queryKey: ["v2-trending-comps"],
    queryFn: async () => {
      const { data } = await supabase
        .from("competitions")
        .select("id, title, title_ar, cover_image_url, city, country_code, competition_start, status")
        .in("status", ["registration_open", "upcoming", "in_progress"])
        .order("competition_start", { ascending: true })
        .limit(4);
      return data || [];
    },
    staleTime: 1000 * 60 * 5,
  });

  const { ref, isVisible } = useScrollReveal({ threshold: 0.1 });

  if (comps.length === 0) return null;

  return (
    <section className="relative py-20 sm:py-28 overflow-hidden">
      {/* Dark cinematic background */}
      <div className="absolute inset-0 bg-foreground" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.15),transparent_70%)]" />

      <div ref={ref} className="relative container">
        <div className={cn(
          "text-center mb-12 transition-all duration-1000",
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        )}>
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-primary mb-3">
            {isAr ? "لا تفوّت" : "Don't Miss"}
          </p>
          <h2 className={cn(
            "text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-background",
            !isAr && "font-serif"
          )}>
            {isAr ? "أحداث استثنائية" : "Extraordinary Events"}
          </h2>
        </div>

        {/* Immersive horizontal scroll on mobile, grid on desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {comps.map((comp: any, i: number) => {
            const title = isAr && comp.title_ar ? comp.title_ar : comp.title;
            return (
              <Link
                key={comp.id}
                to={`/competitions/${comp.id}`}
                className={cn(
                  "group relative overflow-hidden rounded-2xl transition-all duration-700",
                  isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12",
                )}
                style={{ transitionDelay: `${200 + i * 150}ms` }}
              >
                <div className="relative aspect-[16/10] overflow-hidden">
                  {comp.cover_image_url ? (
                    <img
                      src={comp.cover_image_url}
                      alt={title}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                      loading="lazy"
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-primary/20 to-accent/10 flex items-center justify-center">
                      <Trophy className="h-12 w-12 text-background/20" />
                    </div>
                  )}
                  {/* Multi-layer gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-foreground via-foreground/30 to-transparent opacity-80 group-hover:opacity-70 transition-opacity duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-r from-foreground/40 to-transparent" />

                  {/* Content */}
                  <div className="absolute bottom-0 inset-x-0 p-5 sm:p-6">
                    <Badge className="mb-3 bg-primary/80 text-primary-foreground border-0 backdrop-blur-sm text-[10px]">
                      {comp.status === "registration_open"
                        ? (isAr ? "التسجيل مفتوح" : "Registration Open")
                        : (isAr ? "قريباً" : "Upcoming")}
                    </Badge>
                    <h3 className={cn(
                      "text-xl sm:text-2xl font-bold text-background leading-snug line-clamp-2 mb-2",
                      !isAr && "font-serif"
                    )}>
                      {title}
                    </h3>
                    <div className="flex items-center gap-4 text-background/60 text-sm">
                      {comp.competition_start && (
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          {format(new Date(comp.competition_start), "MMM d, yyyy")}
                        </span>
                      )}
                      {comp.city && (
                        <span className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5" />
                          {comp.city}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Hover arrow */}
                  <div className="absolute top-4 end-4 h-10 w-10 rounded-full bg-background/10 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                    <ArrowRight className="h-5 w-5 text-background" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        <div className={cn(
          "text-center mt-10 transition-all duration-700 delay-500",
          isVisible ? "opacity-100" : "opacity-0"
        )}>
          <Button variant="outline" size="lg" className="border-background/20 text-background bg-background/5 hover:bg-background/15 backdrop-blur-sm" asChild>
            <Link to="/competitions">
              {isAr ? "عرض جميع الأحداث" : "View All Events"}
              <ArrowRight className="ms-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

/* ─── Chef Showcase with dramatic reveals ─── */
function ChefShowcase() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { ref, isVisible } = useScrollReveal({ threshold: 0.15 });

  const { data: chefs = [] } = useQuery({
    queryKey: ["v2-editorial-chefs"],
    queryFn: async () => {
      const res = await (supabase.from("profiles") as any)
        .select("id, full_name, full_name_ar, avatar_url, role, country, city, specialization, is_verified")
        .eq("is_verified", true)
        .in("role", ["chef", "judge"])
        .order("loyalty_points", { ascending: false })
        .limit(6);
      return (res.data || []) as any[];
    },
    staleTime: 1000 * 60 * 5,
  });

  if (chefs.length === 0) return null;

  return (
    <section ref={ref} className="py-20 sm:py-28 overflow-hidden">
      <div className="container">
        <div className={cn(
          "text-center mb-14 transition-all duration-1000",
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        )}>
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-primary mb-3">
            {isAr ? "نجوم المنصة" : "Spotlight"}
          </p>
          <h2 className={cn(
            "text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight",
            !isAr && "font-serif"
          )}>
            {isAr ? "الطهاة المميزون" : "World-Class Chefs"}
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-5 lg:gap-6">
          {chefs.map((chef: any, i: number) => {
            const name = isAr && chef.full_name_ar ? chef.full_name_ar : chef.full_name;
            return (
              <Link
                key={chef.id}
                to={`/chef/${chef.id}`}
                className={cn(
                  "group relative transition-all duration-700",
                  isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10",
                )}
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                <div className="relative aspect-[3/4] rounded-2xl overflow-hidden">
                  {chef.avatar_url ? (
                    <img
                      src={chef.avatar_url}
                      alt={name}
                      className="h-full w-full object-cover transition-all duration-700 group-hover:scale-105 group-hover:brightness-110"
                      loading="lazy"
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                      <ChefHat className="h-12 w-12 text-muted-foreground/20" />
                    </div>
                  )}
                  {/* Dark cinematic gradient from bottom */}
                  <div className="absolute inset-0 bg-gradient-to-t from-foreground/90 via-foreground/20 to-transparent" />

                  {/* Content always visible at bottom */}
                  <div className="absolute bottom-0 inset-x-0 p-4 sm:p-5">
                    <p className={cn("text-base sm:text-lg font-bold text-background leading-snug", !isAr && "font-serif")}>{name}</p>
                    {chef.specialization && (
                      <p className="text-xs text-background/60 mt-0.5 line-clamp-1">{chef.specialization}</p>
                    )}
                    {(chef.city || chef.country) && (
                      <p className="text-xs text-background/50 mt-0.5 flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {chef.city || chef.country}
                      </p>
                    )}
                  </div>

                  {chef.is_verified && (
                    <div className="absolute top-3 end-3">
                      <div className="h-7 w-7 rounded-full bg-primary/90 backdrop-blur-sm flex items-center justify-center">
                        <Star className="h-3.5 w-3.5 text-primary-foreground" />
                      </div>
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>

        <div className={cn(
          "text-center mt-10 transition-all duration-700 delay-500",
          isVisible ? "opacity-100" : "opacity-0"
        )}>
          <Button variant="outline" size="lg" asChild>
            <Link to="/community">
              {isAr ? "اكتشف المزيد" : "Meet the Community"}
              <ArrowRight className="ms-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

/* ─── Cinematic Articles ─── */
function CinematicArticles() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { ref, isVisible } = useScrollReveal({ threshold: 0.1 });
  const { ref: parallaxRef, offset } = useParallax(0.2);

  const { data: articles = [] } = useQuery({
    queryKey: ["v2-editorial-articles"],
    queryFn: async () => {
      const { data } = await supabase
        .from("articles")
        .select("id, title, title_ar, excerpt, excerpt_ar, featured_image_url, slug, published_at, type")
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(3);
      return data || [];
    },
    staleTime: 1000 * 60 * 5,
  });

  if (articles.length === 0) return null;
  const main = articles[0];
  const side = articles.slice(1);

  return (
    <section className="relative py-20 sm:py-28 overflow-hidden">
      {/* Subtle parallax bg accent */}
      <div ref={parallaxRef} className="absolute inset-0 pointer-events-none">
        <div
          className="absolute -top-20 -end-20 w-[500px] h-[500px] rounded-full bg-primary/5 blur-3xl"
          style={{ transform: `translateY(${offset * 0.5}px)` }}
        />
      </div>

      <div ref={ref} className="relative container">
        <div className={cn(
          "text-center mb-14 transition-all duration-1000",
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        )}>
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-primary mb-3">
            {isAr ? "قصص ملهمة" : "Stories"}
          </p>
          <h2 className={cn(
            "text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight",
            !isAr && "font-serif"
          )}>
            {isAr ? "أحدث المقالات" : "Latest Stories"}
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Main article - cinematic card */}
          <Link
            to={`/articles/${main.slug}`}
            className={cn(
              "group relative overflow-hidden rounded-2xl transition-all duration-700",
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
            )}
            style={{ transitionDelay: "200ms" }}
          >
            <div className="relative aspect-[4/3] overflow-hidden">
              {main.featured_image_url ? (
                <img src={main.featured_image_url} alt="" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy" />
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-accent/10 to-primary/5 flex items-center justify-center">
                  <BookOpen className="h-14 w-14 text-muted-foreground/15" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent" />
              <div className="absolute bottom-0 inset-x-0 p-6 sm:p-8">
                <Badge className="mb-3 bg-primary/80 text-primary-foreground border-0 backdrop-blur-sm text-[10px]">
                  {main.type === "news" ? (isAr ? "أخبار" : "News") : (isAr ? "مقال" : "Article")}
                </Badge>
                <h3 className={cn("text-2xl sm:text-3xl font-bold text-background leading-snug line-clamp-2", !isAr && "font-serif")}>
                  {isAr && main.title_ar ? main.title_ar : main.title}
                </h3>
                {(isAr ? main.excerpt_ar : main.excerpt) && (
                  <p className="text-sm text-background/60 mt-2 line-clamp-2 max-w-lg">
                    {isAr && main.excerpt_ar ? main.excerpt_ar : main.excerpt}
                  </p>
                )}
                {main.published_at && (
                  <p className="text-xs text-background/50 mt-3">{format(new Date(main.published_at), "MMMM d, yyyy")}</p>
                )}
              </div>
            </div>
          </Link>

          {/* Side articles */}
          <div className="flex flex-col gap-5 justify-center">
            {side.map((article: any, i: number) => (
              <Link
                key={article.id}
                to={`/articles/${article.slug}`}
                className={cn(
                  "group flex gap-5 items-start p-4 rounded-2xl border border-border/50 hover:border-primary/20 hover:bg-muted/30 transition-all duration-700",
                  isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8",
                )}
                style={{ transitionDelay: `${400 + i * 150}ms` }}
              >
                <div className="w-32 h-24 rounded-xl overflow-hidden shrink-0 bg-muted">
                  {article.featured_image_url ? (
                    <img src={article.featured_image_url} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                      <BookOpen className="h-6 w-6 text-muted-foreground/20" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <Badge variant="outline" className="mb-1.5 text-[9px]">
                    {article.type === "news" ? (isAr ? "أخبار" : "News") : (isAr ? "مقال" : "Article")}
                  </Badge>
                  <h3 className="text-base font-bold leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                    {isAr && article.title_ar ? article.title_ar : article.title}
                  </h3>
                  {article.published_at && (
                    <p className="text-xs text-muted-foreground mt-1.5">{format(new Date(article.published_at), "MMM d, yyyy")}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className={cn(
          "text-center mt-10 transition-all duration-700 delay-700",
          isVisible ? "opacity-100" : "opacity-0"
        )}>
          <Button variant="outline" size="lg" asChild>
            <Link to="/articles">
              {isAr ? "جميع المقالات" : "All Stories"}
              <ArrowRight className="ms-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

/* ─── CTA Section with immersive gradient ─── */
function ImmersiveCTA() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { ref, isVisible } = useScrollReveal({ threshold: 0.3 });

  return (
    <section className="relative py-24 sm:py-32 overflow-hidden">
      {/* Multi-layer gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-accent" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(var(--accent)/0.4),transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,hsl(var(--primary)/0.6),transparent_60%)]" />

      {/* Grain */}
      <div className="absolute inset-0 opacity-[0.04] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjMwMCIgaGVpZ2h0PSIzMDAiIGZpbHRlcj0idXJsKCNhKSIgb3BhY2l0eT0iMC4xNSIvPjwvc3ZnPg==')]" />

      <div ref={ref} className="relative container text-center">
        <div className={cn(
          "max-w-2xl mx-auto space-y-6 transition-all duration-1000",
          isVisible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-10 scale-95"
        )}>
          <h2 className={cn(
            "text-3xl sm:text-4xl lg:text-5xl font-bold text-primary-foreground leading-tight",
            !isAr && "font-serif"
          )}>
            {isAr ? "انضم إلى مجتمع الطهي العالمي" : "Join the Global Culinary Community"}
          </h2>
          <p className="text-lg text-primary-foreground/70 max-w-lg mx-auto">
            {isAr
              ? "سجّل الآن وابدأ رحلتك في عالم الطهي الاحترافي مع أفضل الطهاة حول العالم"
              : "Sign up today and begin your professional culinary journey alongside the world's finest chefs"}
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-2">
            <Button size="lg" variant="secondary" className="shadow-2xl text-base px-8" asChild>
              <Link to="/register">
                {isAr ? "سجّل مجاناً" : "Get Started Free"}
                <ArrowRight className="ms-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Main V2 Export ─── */
export function HomepageV2() {
  return (
    <div className="space-y-0">
      <CinematicHero />
      <ImmersiveStats />
      <CinematicEvents />
      <ChefShowcase />
      <CinematicArticles />
      <ImmersiveCTA />
      <Suspense fallback={<V2Fallback />}>
        <NewsletterSignup />
      </Suspense>
      <Suspense fallback={<V2Fallback />}>
        <PartnersLogos />
      </Suspense>
    </div>
  );
}
