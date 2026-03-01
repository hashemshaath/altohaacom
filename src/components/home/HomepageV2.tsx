import { lazy, Suspense, memo, useRef, useEffect, useState, useMemo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { getDisplayName } from "@/lib/getDisplayName";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Calendar, MapPin, Trophy, Users, ChefHat, Globe, Play, Star, BookOpen, Flame, Database, Filter } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useCountUp } from "@/hooks/useCountUp";
import { SectionReveal } from "@/components/ui/section-reveal";
import { FilterChip } from "./FilterChip";

const NewsletterSignup = lazy(() => import("@/components/home/NewsletterSignup").then(m => ({ default: m.NewsletterSignup })));
const PartnersLogos = lazy(() => import("@/components/home/PartnersLogos").then(m => ({ default: m.PartnersLogos })));

const V2Fallback = memo(() => (
  <div className="container py-8">
    <Skeleton className="h-64 rounded-2xl" />
  </div>
));
V2Fallback.displayName = "V2Fallback";

/* ─── Data Source Badge ─── */
function SourceBadge({ source, count }: { source: string; count?: number }) {
  return (
    <Badge variant="outline" className="gap-1 text-[9px] font-normal text-muted-foreground/60 border-dashed">
      <Database className="h-2.5 w-2.5" />
      {source}
      {typeof count === "number" && <span className="font-bold tabular-nums ms-0.5">{count}</span>}
    </Badge>
  );
}

/* ─── Single stat item (hook-safe) ─── */
function V2StatItem({ stat, index }: { stat: { value: number; label: string; icon: any }; index: number }) {
  const count = useCountUp(stat.value, true);
  return (
    <SectionReveal delay={index * 100}>
      <div className="text-center group">
        <div className="inline-flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-primary/10 mb-3 sm:mb-4 transition-transform group-hover:scale-110 group-hover:bg-primary/15">
          <stat.icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
        </div>
        <p className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight tabular-nums">{count}+</p>
        <p className="text-xs sm:text-sm text-muted-foreground font-medium mt-1 sm:mt-2">{stat.label}</p>
      </div>
    </SectionReveal>
  );
}

/* ─── Parallax hook (reduced motion aware) ─── */
function useParallax(speed = 0.3) {
  const ref = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
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

/* ─── Cinematic Full-Bleed Hero (Enhanced) ─── */
function CinematicHero() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { ref, offset } = useParallax(0.35);
  const [imgLoaded, setImgLoaded] = useState(false);

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
    <section ref={ref} className="relative h-[82vh] sm:h-[88vh] min-h-[500px] max-h-[950px] overflow-hidden">
      <div className="absolute inset-0 will-change-transform" style={{ transform: `translateY(${offset}px) scale(1.08)` }}>
        {featured?.cover_image_url ? (
          <img src={featured.cover_image_url} alt="" className={cn("h-full w-full object-cover transition-opacity duration-700", imgLoaded ? "opacity-100" : "opacity-0")} onLoad={() => setImgLoaded(true)} fetchPriority="high" decoding="async" />
        ) : null}
        <div className={cn("absolute inset-0 bg-gradient-to-br from-foreground via-foreground/90 to-primary/30 transition-opacity duration-700", imgLoaded && featured?.cover_image_url ? "opacity-0" : "opacity-100")} />
      </div>

      <div className="absolute inset-0 bg-foreground/40" />
      <div className="absolute inset-0 bg-gradient-to-t from-foreground/95 via-foreground/15 to-foreground/20" />
      <div className="absolute inset-0 bg-gradient-to-r from-foreground/55 via-transparent to-transparent rtl:bg-gradient-to-l" />
      <div className="absolute start-0 top-0 bottom-0 w-1 bg-gradient-to-b from-transparent via-primary/60 to-transparent" />

      <div className="relative h-full flex flex-col justify-end container pb-14 sm:pb-18 lg:pb-24">
        <div className="max-w-2xl space-y-5 sm:space-y-6">
          <Badge className="bg-primary/90 text-primary-foreground border-0 backdrop-blur-md px-4 py-2 shadow-xl shadow-primary/25 text-xs sm:text-sm">
            <Flame className="h-3.5 w-3.5 me-2" />
            {isAr ? "مسابقة مميزة" : "Featured Competition"}
          </Badge>

          <h1 className={cn("text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-[1.06] text-background tracking-tight", !isAr && "font-serif")}>
            {featured ? (isAr && featured.title_ar ? featured.title_ar : featured.title) : (isAr ? "اكتشف عالم الطهي" : "Discover the Culinary World")}
          </h1>

          {featured && (
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
              {featured.competition_start && (
                <span className="inline-flex items-center gap-2 text-background/85 text-xs sm:text-sm backdrop-blur-md bg-background/10 rounded-xl px-4 py-2 border border-background/10 shadow-sm">
                  <Calendar className="h-3.5 w-3.5" />
                  {format(new Date(featured.competition_start), "MMMM d, yyyy", { locale: isAr ? ar : undefined })}
                </span>
              )}
              {featured.city && (
                <span className="inline-flex items-center gap-2 text-background/85 text-xs sm:text-sm backdrop-blur-md bg-background/10 rounded-xl px-4 py-2 border border-background/10 shadow-sm">
                  <MapPin className="h-3.5 w-3.5" />
                  {featured.city}{featured.country ? `, ${featured.country}` : ""}
                </span>
              )}
            </div>
          )}

          <div className="flex flex-wrap gap-3.5 pt-2">
            <Button size="lg" className="shadow-2xl shadow-primary/30 text-sm sm:text-base px-7 sm:px-9 h-12 sm:h-13 rounded-xl" asChild>
              <Link to={featured ? `/competitions/${featured.id}` : "/competitions"}>
                {isAr ? "اكتشف المزيد" : "Explore Now"}
                <ArrowRight className="ms-2 h-4 w-4 sm:h-5 sm:w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="border-background/20 text-background bg-background/10 hover:bg-background/20 backdrop-blur-md text-sm sm:text-base h-12 sm:h-13 rounded-xl" asChild>
              <Link to="/competitions">
                <Play className="me-2 h-4 w-4" />
                {isAr ? "جميع المسابقات" : "All Competitions"}
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 inset-x-0 h-24 sm:h-28 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
}

/* ─── Immersive Stats ─── */
function ImmersiveStats() {
  const { language } = useLanguage();
  const isAr = language === "ar";

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
    <section className="py-14 sm:py-20 lg:py-24">
      <div className="container">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 lg:gap-12 divide-x divide-border/15 rtl:divide-x-reverse">
          {items.map((stat, i) => (
            <V2StatItem key={stat.label} stat={stat} index={i} />
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
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const { data: comps = [] } = useQuery({
    queryKey: ["v2-trending-comps"],
    queryFn: async () => {
      const { data } = await supabase
        .from("competitions")
        .select("id, title, title_ar, cover_image_url, city, country_code, competition_start, status")
        .in("status", ["registration_open", "upcoming", "in_progress"])
        .order("competition_start", { ascending: true })
        .limit(6);
      return data || [];
    },
    staleTime: 1000 * 60 * 5,
  });

  const statuses = useMemo(() => {
    const s = new Set<string>();
    comps.forEach((c: any) => { if (c.status) s.add(c.status); });
    return Array.from(s);
  }, [comps]);

  const filtered = useMemo(() => {
    if (!statusFilter) return comps;
    return comps.filter((c: any) => c.status === statusFilter);
  }, [comps, statusFilter]);

  const statusLabels: Record<string, { en: string; ar: string }> = {
    registration_open: { en: "Open", ar: "مفتوح" },
    upcoming: { en: "Upcoming", ar: "قادمة" },
    in_progress: { en: "Live", ar: "جارية" },
  };

  if (comps.length === 0) return null;

  return (
    <section className="relative py-16 sm:py-20 lg:py-28 overflow-hidden">
      <div className="absolute inset-0 bg-foreground" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.15),transparent_70%)]" />

      <div className="relative container">
        <SectionReveal>
          <div className="text-center mb-8 sm:mb-12">
            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.3em] text-primary mb-2 sm:mb-3">
              {isAr ? "لا تفوّت" : "Don't Miss"}
            </p>
            <h2 className={cn("text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold tracking-tight text-background", !isAr && "font-serif")}>
              {isAr ? "أحداث استثنائية" : "Extraordinary Events"}
            </h2>
            <div className="flex justify-center gap-2 mt-3">
              <SourceBadge source="competitions" count={filtered.length} />
            </div>
          </div>
        </SectionReveal>

        {/* Filters */}
        {statuses.length > 1 && (
          <div className="flex items-center justify-center gap-1.5 mb-6 flex-wrap">
            <Filter className="h-3 w-3 text-background/40 shrink-0" />
            <FilterChip label={isAr ? "الكل" : "All"} active={!statusFilter} count={comps.length} onClick={() => setStatusFilter(null)} />
            {statuses.map(s => {
              const l = statusLabels[s] || { en: s, ar: s };
              return (
                <FilterChip
                  key={s}
                  label={isAr ? l.ar : l.en}
                  active={statusFilter === s}
                  count={comps.filter((c: any) => c.status === s).length}
                  onClick={() => setStatusFilter(statusFilter === s ? null : s)}
                />
              );
            })}
          </div>
        )}

        {/* Cards */}
        <div className="hidden sm:grid sm:grid-cols-2 gap-5">
          {filtered.slice(0, 4).map((comp: any, i: number) => (
            <EventCard key={comp.id} comp={comp} i={i} isAr={isAr} />
          ))}
        </div>
        <div className="sm:hidden -mx-4 px-4 overflow-x-auto scrollbar-none snap-x snap-mandatory">
          <div className="flex gap-3" style={{ width: `${filtered.length * 85}vw` }}>
            {filtered.map((comp: any, i: number) => (
              <div key={comp.id} className="snap-start" style={{ width: "82vw", flexShrink: 0 }}>
                <EventCard comp={comp} i={i} isAr={isAr} />
              </div>
            ))}
          </div>
        </div>

        <div className="text-center mt-8 sm:mt-10">
          <Button variant="outline" size="lg" className="border-background/20 text-background bg-background/5 hover:bg-background/15 backdrop-blur-sm text-sm sm:text-base" asChild>
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

/* ─── Event Card (shared) ─── */
const EventCard = memo(function EventCard({ comp, i, isAr }: { comp: any; i: number; isAr: boolean }) {
  const title = isAr && comp.title_ar ? comp.title_ar : comp.title;
  return (
    <SectionReveal delay={i * 100}>
      <Link to={`/competitions/${comp.id}`} className="group relative overflow-hidden rounded-2xl block">
        <div className="relative aspect-[16/10] overflow-hidden">
          {comp.cover_image_url ? (
            <img src={comp.cover_image_url} alt={title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" decoding="async" />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-primary/20 to-accent/10 flex items-center justify-center">
              <Trophy className="h-10 w-10 sm:h-12 sm:w-12 text-background/20" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-foreground via-foreground/30 to-transparent opacity-80 group-hover:opacity-70 transition-opacity duration-500" />
          <div className="absolute bottom-0 inset-x-0 p-4 sm:p-5 lg:p-6">
            <Badge className="mb-2 sm:mb-3 bg-primary/80 text-primary-foreground border-0 backdrop-blur-sm text-[9px] sm:text-[10px]">
              {comp.status === "registration_open" ? (isAr ? "التسجيل مفتوح" : "Registration Open") : comp.status === "in_progress" ? (isAr ? "جارية" : "Live") : (isAr ? "قريباً" : "Upcoming")}
            </Badge>
            <h3 className={cn("text-lg sm:text-xl lg:text-2xl font-bold text-background leading-snug line-clamp-2 mb-1.5", !isAr && "font-serif")}>{title}</h3>
            <div className="flex items-center gap-3 text-background/60 text-xs sm:text-sm">
              {comp.competition_start && (
                <span className="flex items-center gap-1"><Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5" />{format(new Date(comp.competition_start), "MMM d, yyyy")}</span>
              )}
              {comp.city && (
                <span className="flex items-center gap-1"><MapPin className="h-3 w-3 sm:h-3.5 sm:w-3.5" />{comp.city}</span>
              )}
            </div>
          </div>
          <div className="absolute top-3 end-3 h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-background/10 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-300">
            <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 text-background" />
          </div>
        </div>
      </Link>
    </SectionReveal>
  );
});

/* ─── Chef Showcase ─── */
function ChefShowcase() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  const { data: chefs = [] } = useQuery({
    queryKey: ["v2-editorial-chefs"],
    queryFn: async () => {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, username, full_name, full_name_ar, display_name, display_name_ar, avatar_url, country_code, city, specialization, specialization_ar, is_verified")
        .eq("is_verified", true)
        .order("loyalty_points", { ascending: false, nullsFirst: false })
        .limit(6);
      return (profiles || []).map((p: any) => ({ ...p, id: p.user_id }));
    },
    staleTime: 1000 * 60 * 5,
  });

  if (chefs.length === 0) return null;

  return (
    <section className="py-16 sm:py-20 lg:py-28 overflow-hidden">
      <div className="container">
        <SectionReveal>
          <div className="text-center mb-10 sm:mb-14">
            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.3em] text-primary mb-2 sm:mb-3">
              {isAr ? "نجوم المنصة" : "Spotlight"}
            </p>
            <h2 className={cn("text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold tracking-tight", !isAr && "font-serif")}>
              {isAr ? "الطهاة المميزون" : "World-Class Chefs"}
            </h2>
            <div className="flex justify-center gap-2 mt-3">
              <SourceBadge source="profiles (verified)" count={chefs.length} />
            </div>
          </div>
        </SectionReveal>

        <div className="hidden sm:grid sm:grid-cols-3 gap-4 lg:gap-6">
          {chefs.map((chef: any, i: number) => (
            <ChefCard key={chef.id} chef={chef} i={i} isAr={isAr} />
          ))}
        </div>
        <div className="sm:hidden -mx-4 px-4 overflow-x-auto scrollbar-none snap-x snap-mandatory">
          <div className="flex gap-3" style={{ width: `${chefs.length * 55}vw` }}>
            {chefs.map((chef: any, i: number) => (
              <div key={chef.id} className="snap-start" style={{ width: "52vw", flexShrink: 0 }}>
                <ChefCard chef={chef} i={i} isAr={isAr} />
              </div>
            ))}
          </div>
        </div>

        <div className="text-center mt-8 sm:mt-10">
          <Button variant="outline" size="lg" className="text-sm sm:text-base" asChild>
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

/* ─── Chef Card (shared) ─── */
const ChefCard = memo(function ChefCard({ chef, i, isAr }: { chef: any; i: number; isAr: boolean }) {
  const name = getDisplayName(chef, isAr);
  const spec = isAr && chef.specialization_ar ? chef.specialization_ar : chef.specialization;
  return (
    <SectionReveal delay={i * 80}>
      <Link to={`/chef/${chef.id}`} className="group relative block">
        <div className="relative aspect-[3/4] rounded-2xl overflow-hidden">
          {chef.avatar_url ? (
            <img src={chef.avatar_url} alt={name} className="h-full w-full object-cover transition-all duration-700 group-hover:scale-105" loading="lazy" decoding="async" />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
              <ChefHat className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground/20" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/90 via-foreground/20 to-transparent" />
          <div className="absolute bottom-0 inset-x-0 p-3 sm:p-4 lg:p-5">
            <p className={cn("text-sm sm:text-base lg:text-lg font-bold text-background leading-snug", !isAr && "font-serif")}>{name}</p>
            {spec && <p className="text-[10px] sm:text-xs text-background/60 mt-0.5 line-clamp-1">{spec}</p>}
            {(chef.city || chef.country_code) && (
              <p className="text-[10px] sm:text-xs text-background/50 mt-0.5 flex items-center gap-1">
                <MapPin className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                {chef.city || chef.country_code}
              </p>
            )}
          </div>
          {chef.is_verified && (
            <div className="absolute top-2 end-2 sm:top-3 sm:end-3">
              <div className="h-6 w-6 sm:h-7 sm:w-7 rounded-full bg-primary/90 backdrop-blur-sm flex items-center justify-center">
                <Star className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-primary-foreground" />
              </div>
            </div>
          )}
        </div>
      </Link>
    </SectionReveal>
  );
});

/* ─── Cinematic Articles ─── */
function CinematicArticles() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [typeFilter, setTypeFilter] = useState<string | null>(null);

  const { data: allArticles = [] } = useQuery({
    queryKey: ["v2-editorial-articles"],
    queryFn: async () => {
      const { data } = await supabase
        .from("articles")
        .select("id, title, title_ar, excerpt, excerpt_ar, featured_image_url, slug, published_at, type")
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(5);
      return data || [];
    },
    staleTime: 1000 * 60 * 5,
  });

  const types = useMemo(() => {
    const s = new Set<string>();
    allArticles.forEach((a: any) => { if (a.type) s.add(a.type); });
    return Array.from(s);
  }, [allArticles]);

  const articles = useMemo(() => {
    if (!typeFilter) return allArticles;
    return allArticles.filter((a: any) => a.type === typeFilter);
  }, [allArticles, typeFilter]);

  if (allArticles.length === 0) return null;
  if (articles.length === 0) return null;

  const main = articles[0];
  const side = articles.slice(1, 3);

  return (
    <section className="relative py-16 sm:py-20 lg:py-28 overflow-hidden">
      <div className="relative container">
        <SectionReveal>
          <div className="text-center mb-10 sm:mb-14">
            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.3em] text-primary mb-2 sm:mb-3">
              {isAr ? "قصص ملهمة" : "Stories"}
            </p>
            <h2 className={cn("text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold tracking-tight", !isAr && "font-serif")}>
              {isAr ? "أحدث المقالات" : "Latest Stories"}
            </h2>
            <div className="flex justify-center gap-2 mt-3">
              <SourceBadge source="articles" count={articles.length} />
            </div>
            {types.length > 1 && (
              <div className="flex items-center justify-center gap-1.5 mt-4 flex-wrap">
                <Filter className="h-3 w-3 text-muted-foreground/50 shrink-0" />
                <FilterChip label={isAr ? "الكل" : "All"} active={!typeFilter} count={allArticles.length} onClick={() => setTypeFilter(null)} />
                {types.map(t => (
                  <FilterChip
                    key={t}
                    label={t}
                    active={typeFilter === t}
                    count={allArticles.filter((a: any) => a.type === t).length}
                    onClick={() => setTypeFilter(typeFilter === t ? null : t)}
                  />
                ))}
              </div>
            )}
          </div>
        </SectionReveal>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <SectionReveal delay={100}>
            <Link to={`/articles/${main.slug}`} className="group relative overflow-hidden rounded-2xl block">
              <div className="relative aspect-[4/3] sm:aspect-[4/3] overflow-hidden">
                {main.featured_image_url ? (
                  <img src={main.featured_image_url} alt="" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" decoding="async" />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-accent/10 to-primary/5 flex items-center justify-center">
                    <BookOpen className="h-12 w-12 sm:h-14 sm:w-14 text-muted-foreground/15" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent" />
                <div className="absolute bottom-0 inset-x-0 p-4 sm:p-6 lg:p-8">
                  <Badge className="mb-2 sm:mb-3 bg-primary/80 text-primary-foreground border-0 backdrop-blur-sm text-[9px] sm:text-[10px]">
                    {main.type === "news" ? (isAr ? "أخبار" : "News") : (isAr ? "مقال" : "Article")}
                  </Badge>
                  <h3 className={cn("text-xl sm:text-2xl lg:text-3xl font-bold text-background leading-snug line-clamp-2", !isAr && "font-serif")}>
                    {isAr && main.title_ar ? main.title_ar : main.title}
                  </h3>
                  {(isAr ? main.excerpt_ar : main.excerpt) && (
                    <p className="hidden sm:block text-sm text-background/60 mt-2 line-clamp-2 max-w-lg">
                      {isAr && main.excerpt_ar ? main.excerpt_ar : main.excerpt}
                    </p>
                  )}
                  {main.published_at && <p className="text-[10px] sm:text-xs text-background/50 mt-2 sm:mt-3">{format(new Date(main.published_at), "MMMM d, yyyy", { locale: isAr ? ar : undefined })}</p>}
                </div>
              </div>
            </Link>
          </SectionReveal>

          <div className="flex flex-col gap-3 sm:gap-5 justify-center">
            {side.map((article: any, i: number) => (
              <SectionReveal key={article.id} delay={250 + i * 100} direction="right">
                <Link to={`/articles/${article.slug}`} className="group flex gap-3 sm:gap-5 items-start p-3 sm:p-4 rounded-2xl border border-border/50 hover:border-primary/20 hover:bg-muted/30 transition-all">
                  <div className="w-24 h-20 sm:w-32 sm:h-24 rounded-xl overflow-hidden shrink-0 bg-muted">
                    {article.featured_image_url ? (
                      <img src={article.featured_image_url} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" decoding="async" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                        <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground/20" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Badge variant="outline" className="mb-1 text-[8px] sm:text-[9px]">
                      {article.type === "news" ? (isAr ? "أخبار" : "News") : (isAr ? "مقال" : "Article")}
                    </Badge>
                    <h3 className="text-sm sm:text-base font-bold leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                      {isAr && article.title_ar ? article.title_ar : article.title}
                    </h3>
                    {article.published_at && <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">{format(new Date(article.published_at), "MMM d, yyyy", { locale: isAr ? ar : undefined })}</p>}
                  </div>
                </Link>
              </SectionReveal>
            ))}
          </div>
        </div>

        <div className="text-center mt-8 sm:mt-10">
          <Button variant="outline" size="lg" className="text-sm sm:text-base" asChild>
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

/* ─── CTA Section ─── */
function ImmersiveCTA() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  return (
    <section className="relative py-24 sm:py-28 lg:py-36 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-accent" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(var(--accent)/0.4),transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,hsl(var(--primary-foreground)/0.05),transparent_50%)]" />

      <div className="relative container text-center px-6">
        <SectionReveal>
          <div className="max-w-2xl mx-auto space-y-5 sm:space-y-7">
            <h2 className={cn("text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-primary-foreground leading-tight", !isAr && "font-serif")}>
              {isAr ? "انضم إلى مجتمع الطهي العالمي" : "Join the Global Culinary Community"}
            </h2>
            <p className="text-sm sm:text-base lg:text-lg text-primary-foreground/70 max-w-lg mx-auto leading-relaxed">
              {isAr ? "سجّل الآن وابدأ رحلتك في عالم الطهي الاحترافي مع أفضل الطهاة حول العالم" : "Sign up today and begin your professional culinary journey alongside the world's finest chefs"}
            </p>
            <div className="flex flex-wrap justify-center gap-3.5 sm:gap-4 pt-2 sm:pt-3">
              <Button size="lg" variant="secondary" className="shadow-2xl text-sm sm:text-base px-8 sm:px-10 h-12 sm:h-14 rounded-xl font-bold" asChild>
                <Link to="/register">
                  {isAr ? "سجّل مجاناً" : "Get Started Free"}
                  <ArrowRight className="ms-2 h-4 w-4 sm:h-5 sm:w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </SectionReveal>
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
