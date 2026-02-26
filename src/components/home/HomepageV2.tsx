import { lazy, Suspense, memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Calendar, MapPin, Trophy, Users, Sparkles, Star, ChefHat, BookOpen, Globe } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useCountUp } from "@/hooks/useCountUp";

/* ─── Lazy sections unique to V2 ─── */
const NewsletterSignup = lazy(() => import("@/components/home/NewsletterSignup").then(m => ({ default: m.NewsletterSignup })));
const PartnersLogos = lazy(() => import("@/components/home/PartnersLogos").then(m => ({ default: m.PartnersLogos })));

const V2Fallback = memo(() => (
  <div className="container py-8">
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
      <Skeleton className="h-64 rounded-2xl" />
      <Skeleton className="h-64 rounded-2xl" />
    </div>
  </div>
));
V2Fallback.displayName = "V2Fallback";

/* ─── Editorial Hero ─── */
function EditorialHero() {
  const { language } = useLanguage();
  const isAr = language === "ar";

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

  const { data: latestArticle } = useQuery({
    queryKey: ["v2-latest-article"],
    queryFn: async () => {
      const { data } = await supabase
        .from("articles")
        .select("id, title, title_ar, excerpt, excerpt_ar, featured_image_url, slug, published_at")
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(1);
      return data?.[0] || null;
    },
    staleTime: 1000 * 60 * 5,
  });

  return (
    <section className="relative">
      {/* Full-bleed editorial grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 min-h-[480px] lg:min-h-[560px]">
        {/* Main Feature — 3 cols */}
        <div className="relative lg:col-span-3 overflow-hidden group">
          {featured?.cover_image_url ? (
            <img
              src={featured.cover_image_url}
              alt=""
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-accent/10" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/90 via-foreground/40 to-transparent" />
          <div className="relative flex flex-col justify-end h-full p-6 sm:p-8 lg:p-10">
            <Badge className="w-fit mb-3 bg-primary/90 text-primary-foreground border-0 backdrop-blur-sm">
              <Trophy className="h-3 w-3 me-1" />
              {isAr ? "مسابقة مميزة" : "Featured Competition"}
            </Badge>
            <h1 className={cn(
              "text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight text-background mb-3",
              !isAr && "font-serif"
            )}>
              {featured ? (isAr && featured.title_ar ? featured.title_ar : featured.title) : (isAr ? "اكتشف عالم الطهي" : "Discover the Culinary World")}
            </h1>
            {featured && (
              <div className="flex items-center gap-4 text-background/80 text-sm mb-4">
                {featured.competition_start && (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(featured.competition_start), "MMM d, yyyy")}
                  </span>
                )}
                {featured.city && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" />
                    {featured.city}
                  </span>
                )}
              </div>
            )}
            <Button size="lg" className="w-fit shadow-lg" asChild>
              <Link to={featured ? `/competitions/${featured.id}` : "/competitions"}>
                {isAr ? "اكتشف المزيد" : "Explore Now"}
                <ArrowRight className="ms-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Side stack — 2 cols */}
        <div className="lg:col-span-2 grid grid-rows-2">
          {/* Latest Article */}
          <Link
            to={latestArticle ? `/articles/${latestArticle.slug}` : "/articles"}
            className="relative overflow-hidden group"
          >
            {latestArticle?.featured_image_url ? (
              <img
                src={latestArticle.featured_image_url}
                alt=""
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-accent/20 to-accent/5" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/30 to-transparent" />
            <div className="relative flex flex-col justify-end h-full p-5 sm:p-6">
              <Badge variant="secondary" className="w-fit mb-2 text-[10px] backdrop-blur-sm">
                <BookOpen className="h-3 w-3 me-1" />
                {isAr ? "أحدث المقالات" : "Latest Article"}
              </Badge>
              <h2 className="text-lg font-bold text-background leading-snug line-clamp-2">
                {latestArticle ? (isAr && latestArticle.title_ar ? latestArticle.title_ar : latestArticle.title) : (isAr ? "آخر الأخبار" : "Latest News")}
              </h2>
            </div>
          </Link>

          {/* CTA Panel */}
          <div className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-accent">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,hsl(var(--accent)/0.3),transparent_60%)]" />
            <div className="relative flex flex-col justify-center items-center h-full p-6 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-background/15 backdrop-blur-sm mb-3">
                <Sparkles className="h-6 w-6 text-primary-foreground" />
              </div>
              <h3 className={cn("text-xl font-bold text-primary-foreground mb-2", !isAr && "font-serif")}>
                {isAr ? "انضم إلينا اليوم" : "Join the Community"}
              </h3>
              <p className="text-sm text-primary-foreground/80 mb-4 max-w-[240px]">
                {isAr ? "سجّل الآن وابدأ رحلتك في عالم الطهي الاحترافي" : "Sign up and start your professional culinary journey"}
              </p>
              <Button variant="secondary" className="shadow-lg" asChild>
                <Link to="/register">
                  {isAr ? "سجّل مجاناً" : "Sign Up Free"}
                  <ArrowRight className="ms-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Trending Strip ─── */
function TrendingStrip() {
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
        .limit(6);
      return data || [];
    },
    staleTime: 1000 * 60 * 5,
  });

  if (comps.length === 0) return null;

  return (
    <section className="py-10 md:py-14">
      <div className="container">
        <div className="flex items-end justify-between mb-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary mb-1">
              {isAr ? "لا تفوّت" : "Don't Miss"}
            </p>
            <h2 className={cn("text-2xl sm:text-3xl font-bold tracking-tight", !isAr && "font-serif")}>
              {isAr ? "الأحداث الرائجة" : "Trending Events"}
            </h2>
          </div>
          <Button variant="ghost" className="gap-1.5 text-sm" asChild>
            <Link to="/competitions">
              {isAr ? "عرض الكل" : "View All"}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {comps.map((comp: any, i: number) => {
            const title = isAr && comp.title_ar ? comp.title_ar : comp.title;
            const isLarge = i === 0;
            return (
              <Link
                key={comp.id}
                to={`/competitions/${comp.id}`}
                className={cn(
                  "group relative overflow-hidden rounded-2xl",
                  isLarge && "sm:col-span-2 sm:row-span-2"
                )}
              >
                <div className={cn("relative overflow-hidden", isLarge ? "aspect-[16/9]" : "aspect-[16/10]")}>
                  {comp.cover_image_url ? (
                    <img
                      src={comp.cover_image_url}
                      alt={title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-primary/15 to-accent/10 flex items-center justify-center">
                      <Trophy className="h-10 w-10 text-primary/30" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent" />
                  <div className="absolute bottom-0 inset-x-0 p-4 sm:p-5">
                    <Badge variant="secondary" className="mb-2 text-[10px] backdrop-blur-sm">
                      {comp.status === "registration_open" ? (isAr ? "التسجيل مفتوح" : "Registration Open") : (isAr ? "قريباً" : "Upcoming")}
                    </Badge>
                    <h3 className={cn(
                      "font-bold text-background leading-snug line-clamp-2 mb-1",
                      isLarge ? "text-xl sm:text-2xl" : "text-base"
                    )}>
                      {title}
                    </h3>
                    <div className="flex items-center gap-3 text-background/70 text-xs">
                      {comp.competition_start && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(comp.competition_start), "MMM d")}
                        </span>
                      )}
                      {comp.city && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {comp.city}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ─── Stats Bar V2 ─── */
function StatsBarV2() {
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
    { value: stats?.entities || 0, label: isAr ? "جهة" : "Entities", icon: ChefHat },
    { value: stats?.exhibitions || 0, label: isAr ? "معرض" : "Exhibitions", icon: Globe },
  ];

  return (
    <section ref={ref} className="bg-foreground/[0.03] border-y border-border/20">
      <div className="container py-8 sm:py-10">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          {items.map((stat, i) => {
            const count = useCountUp(stat.value, isVisible);
            return (
              <div
                key={stat.label}
                className={cn(
                  "text-center transition-all duration-700",
                  isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
                )}
                style={{ transitionDelay: `${i * 120}ms` }}
              >
                <stat.icon className="h-5 w-5 mx-auto mb-2 text-primary/60" />
                <p className="text-3xl sm:text-4xl font-bold tracking-tight tabular-nums text-foreground">{count}+</p>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mt-1">{stat.label}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ─── Featured Chefs Editorial ─── */
function EditorialChefs() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data: chefs = [] } = useQuery({
    queryKey: ["v2-editorial-chefs"],
    queryFn: async () => {
      const res = await (supabase
        .from("profiles") as any)
        .select("id, full_name, full_name_ar, avatar_url, role, country, city, specialization, is_verified")
        .eq("is_verified", true)
        .in("role", ["chef", "judge"])
        .order("loyalty_points", { ascending: false })
        .limit(8);
      const { data } = res;
      return (data || []) as any[];
    },
    staleTime: 1000 * 60 * 5,
  });

  if (chefs.length === 0) return null;

  return (
    <section className="py-10 md:py-14">
      <div className="container">
        <div className="flex items-end justify-between mb-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary mb-1">
              {isAr ? "الطهاة المميزون" : "Spotlight"}
            </p>
            <h2 className={cn("text-2xl sm:text-3xl font-bold tracking-tight", !isAr && "font-serif")}>
              {isAr ? "نجوم المنصة" : "Featured Chefs"}
            </h2>
          </div>
          <Button variant="ghost" className="gap-1.5 text-sm" asChild>
            <Link to="/community">
              {isAr ? "عرض الكل" : "View All"}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {chefs.map((chef: any) => {
            const name = isAr && chef.full_name_ar ? chef.full_name_ar : chef.full_name;
            return (
              <Link key={chef.id} to={`/chef/${chef.id}`} className="group">
                <div className="relative aspect-[3/4] rounded-2xl overflow-hidden">
                  {chef.avatar_url ? (
                    <img
                      src={chef.avatar_url}
                      alt={name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                      <ChefHat className="h-10 w-10 text-muted-foreground/30" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute bottom-0 inset-x-0 p-3 translate-y-2 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <p className="text-sm font-bold text-background line-clamp-1">{name}</p>
                    {chef.specialization && (
                      <p className="text-xs text-background/70 line-clamp-1">{chef.specialization}</p>
                    )}
                  </div>
                  {chef.is_verified && (
                    <div className="absolute top-2 end-2">
                      <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                        <Star className="h-3 w-3 text-primary-foreground" />
                      </div>
                    </div>
                  )}
                </div>
                <div className="mt-2 group-hover:opacity-0 transition-opacity">
                  <p className="text-sm font-semibold line-clamp-1">{name}</p>
                  <p className="text-xs text-muted-foreground">{chef.city || chef.country || ""}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ─── Latest Articles Grid ─── */
function ArticlesEditorial() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data: articles = [] } = useQuery({
    queryKey: ["v2-editorial-articles"],
    queryFn: async () => {
      const { data } = await supabase
        .from("articles")
        .select("id, title, title_ar, excerpt, excerpt_ar, featured_image_url, slug, published_at, type")
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(4);
      return data || [];
    },
    staleTime: 1000 * 60 * 5,
  });

  if (articles.length === 0) return null;

  const main = articles[0];
  const side = articles.slice(1);

  return (
    <section className="py-10 md:py-14 bg-foreground/[0.02]">
      <div className="container">
        <div className="flex items-end justify-between mb-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary mb-1">
              {isAr ? "من المجلة" : "From the Magazine"}
            </p>
            <h2 className={cn("text-2xl sm:text-3xl font-bold tracking-tight", !isAr && "font-serif")}>
              {isAr ? "أحدث المقالات" : "Latest Stories"}
            </h2>
          </div>
          <Button variant="ghost" className="gap-1.5 text-sm" asChild>
            <Link to="/articles">
              {isAr ? "جميع المقالات" : "All Articles"}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Main article */}
          <Link to={`/articles/${main.slug}`} className="group">
            <div className="relative aspect-[16/10] rounded-2xl overflow-hidden">
              {main.featured_image_url ? (
                <img src={main.featured_image_url} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-accent/15 to-primary/5 flex items-center justify-center">
                  <BookOpen className="h-12 w-12 text-muted-foreground/20" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 to-transparent" />
              <div className="absolute bottom-0 inset-x-0 p-5">
                <Badge variant="secondary" className="mb-2 text-[10px]">{main.type === "news" ? (isAr ? "أخبار" : "News") : (isAr ? "مقال" : "Article")}</Badge>
                <h3 className="text-xl font-bold text-background leading-snug line-clamp-2">{isAr && main.title_ar ? main.title_ar : main.title}</h3>
                {main.published_at && (
                  <p className="text-xs text-background/60 mt-1">{format(new Date(main.published_at), "MMM d, yyyy")}</p>
                )}
              </div>
            </div>
          </Link>

          {/* Side articles */}
          <div className="space-y-4">
            {side.map((article: any) => (
              <Link key={article.id} to={`/articles/${article.slug}`} className="group flex gap-4 items-start">
                <div className="w-28 h-20 rounded-xl overflow-hidden shrink-0 bg-muted">
                  {article.featured_image_url ? (
                    <img src={article.featured_image_url} alt="" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                      <BookOpen className="h-5 w-5 text-muted-foreground/30" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <Badge variant="outline" className="mb-1 text-[9px]">{article.type === "news" ? (isAr ? "أخبار" : "News") : (isAr ? "مقال" : "Article")}</Badge>
                  <h3 className="text-sm font-semibold leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                    {isAr && article.title_ar ? article.title_ar : article.title}
                  </h3>
                  {article.published_at && (
                    <p className="text-[11px] text-muted-foreground mt-1">{format(new Date(article.published_at), "MMM d, yyyy")}</p>
                  )}
                </div>
              </Link>
            ))}
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
      <EditorialHero />
      <StatsBarV2 />
      <TrendingStrip />
      <EditorialChefs />
      <ArticlesEditorial />
      <Suspense fallback={<V2Fallback />}>
        <NewsletterSignup />
      </Suspense>
      <Suspense fallback={<V2Fallback />}>
        <PartnersLogos />
      </Suspense>
    </div>
  );
}
