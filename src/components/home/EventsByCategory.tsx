import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Globe, Coffee, ArrowRight, Calendar, MapPin, Users, Flame } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { SectionReveal } from "@/components/ui/section-reveal";
import { StaggeredList } from "@/components/ui/staggered-list";
import { CountdownBadge } from "@/components/ui/countdown-badge";
import { ShareButton } from "@/components/ui/share-button";

export function EventsByCategory() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data: competitions = [] } = useQuery({
    queryKey: ["home-competitions-cat"],
    queryFn: async () => {
      const { data } = await supabase
        .from("competitions")
        .select("id, title, title_ar, cover_image_url, status, competition_start, city, country, is_virtual")
        .in("status", ["registration_open", "upcoming", "in_progress"])
        .order("competition_start", { ascending: true })
        .limit(8);
      return data || [];
    },
  });

  const { data: exhibitions = [] } = useQuery({
    queryKey: ["home-exhibitions-cat"],
    queryFn: async () => {
      const { data } = await supabase
        .from("exhibitions")
        .select("id, title, title_ar, cover_image_url, status, start_date, city, country, slug, venue, venue_ar, organizer_name, organizer_name_ar, logo_url")
        .in("status", ["upcoming", "active"])
        .order("start_date", { ascending: true })
        .limit(6);
      return data || [];
    },
  });

  const { data: chefsTableSessions = [] } = useQuery({
    queryKey: ["home-chefs-table-cat"],
    queryFn: async () => {
      const { data } = await supabase
        .from("chefs_table_sessions")
        .select("id, title, title_ar, status, session_date, venue, product_category, product_name, is_published")
        .eq("is_published", true)
        .in("status", ["scheduled", "in_progress"])
        .order("session_date", { ascending: true })
        .limit(6);
      return data || [];
    },
  });

  const statusBadge = (status: string) => {
    const map: Record<string, { label: string; labelAr: string; cls: string; icon?: any }> = {
      registration_open: { label: "Open", labelAr: "مفتوح", cls: "bg-chart-2/90 text-chart-2-foreground", icon: Users },
      in_progress: { label: "Live", labelAr: "جارية", cls: "bg-destructive/90 text-destructive-foreground animate-pulse", icon: Flame },
      upcoming: { label: "Upcoming", labelAr: "قادمة", cls: "" },
      active: { label: "Active", labelAr: "نشط", cls: "bg-chart-2/90 text-chart-2-foreground" },
    };
    const s = map[status] || map.upcoming;
    const Icon = s.icon;
    return (
      <Badge className={cn("text-[10px] shadow-sm gap-1", s.cls)}>
        {Icon && <Icon className="h-2.5 w-2.5" />}
        {isAr ? s.labelAr : s.label}
      </Badge>
    );
  };

  /* Featured card (first item, larger) */
  const renderFeaturedCompetition = (item: any) => {
    const title = isAr && item.title_ar ? item.title_ar : item.title;
    return (
      <Link key={item.id} to={`/competitions/${item.id}`} className="group block col-span-2 row-span-2">
        <Card interactive className="h-full overflow-hidden border-border/40 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-primary/25">
          <div className="relative aspect-[16/10] sm:aspect-[16/9] overflow-hidden bg-muted">
            {item.cover_image_url ? (
              <img src={item.cover_image_url} alt={title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
            ) : (
              <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                <Trophy className="h-12 w-12 text-primary/30" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/30 to-transparent" />
            <div className="absolute end-3 top-3 flex flex-col items-end gap-1.5">
              {statusBadge(item.status)}
              {item.competition_start && <CountdownBadge targetDate={new Date(item.competition_start)} isAr={isAr} />}
            </div>
            <ShareButton title={title} url={`/competitions/${item.id}`} isAr={isAr} className="absolute start-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            {/* Overlaid content on featured card */}
            <div className="absolute bottom-0 inset-x-0 p-4">
              <Badge variant="outline" className="mb-2 bg-background/60 backdrop-blur-sm text-[10px]">
                <Trophy className="me-1 h-2.5 w-2.5" />
                {isAr ? "مميز" : "Featured"}
              </Badge>
              <h3 className="line-clamp-2 text-base sm:text-lg font-bold text-foreground group-hover:text-primary transition-colors leading-snug">
                {title}
              </h3>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                {item.competition_start && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-primary/60" />
                    {format(new Date(item.competition_start), "MMM d, yyyy")}
                  </span>
                )}
                {item.is_virtual ? (
                  <span className="flex items-center gap-1">
                    <Globe className="h-3 w-3 text-primary/60" />
                    {isAr ? "افتراضي" : "Virtual"}
                  </span>
                ) : item.city ? (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-primary/60" />
                    {item.city}{item.country ? `, ${item.country}` : ""}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </Card>
      </Link>
    );
  };

  const renderCompetitionCard = (item: any) => {
    const title = isAr && item.title_ar ? item.title_ar : item.title;
    return (
      <Link key={item.id} to={`/competitions/${item.id}`} className="group block">
        <Card interactive className="h-full overflow-hidden border-border/40 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-primary/25">
          <div className="relative aspect-[16/10] overflow-hidden bg-muted">
            {item.cover_image_url ? (
              <img src={item.cover_image_url} alt={title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />
            ) : (
              <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                <Trophy className="h-8 w-8 text-primary/30" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="absolute end-2 top-2 flex flex-col items-end gap-1">
              {statusBadge(item.status)}
              {item.competition_start && <CountdownBadge targetDate={new Date(item.competition_start)} isAr={isAr} />}
            </div>
            <ShareButton title={title} url={`/competitions/${item.id}`} isAr={isAr} className="absolute start-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <CardContent className="p-3">
            <h3 className="mb-1.5 line-clamp-2 text-sm font-bold text-foreground group-hover:text-primary transition-colors leading-snug">
              {title}
            </h3>
            <div className="space-y-1 text-[11px] text-muted-foreground">
              {item.competition_start && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3 w-3 shrink-0 text-primary/50" />
                  <span>{format(new Date(item.competition_start), "MMM d, yyyy")}</span>
                </div>
              )}
              {item.is_virtual ? (
                <div className="flex items-center gap-1.5">
                  <Globe className="h-3 w-3 shrink-0 text-primary/50" />
                  <span>{isAr ? "افتراضي" : "Virtual"}</span>
                </div>
              ) : item.city ? (
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-3 w-3 shrink-0 text-primary/50" />
                  <span className="truncate">{item.city}{item.country ? `, ${item.country}` : ""}</span>
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  };

  const tabs = [
    {
      key: "competitions",
      icon: Trophy,
      labelEn: "Competitions",
      labelAr: "المسابقات",
      items: competitions,
      renderItem: renderCompetitionCard,
      renderFeatured: renderFeaturedCompetition,
      viewAllHref: "/competitions",
    },
    {
      key: "exhibitions",
      icon: Globe,
      labelEn: "Exhibitions",
      labelAr: "المعارض",
      items: exhibitions,
      renderItem: (item: any) => {
        const title = isAr && item.title_ar ? item.title_ar : item.title;
        const venue = isAr && item.venue_ar ? item.venue_ar : item.venue;
        const organizerName = isAr && item.organizer_name_ar ? item.organizer_name_ar : item.organizer_name;
        return (
          <Link key={item.id} to={`/exhibitions/${item.slug || item.id}`} className="group block">
            <Card interactive className="h-full overflow-hidden border-border/40 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-primary/25">
              <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                {item.cover_image_url ? (
                  <img src={item.cover_image_url} alt={title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />
                ) : (
                  <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                    <Globe className="h-8 w-8 text-primary/30" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute end-2 top-2 flex flex-col items-end gap-1">
                  {statusBadge(item.status)}
                  {item.start_date && <CountdownBadge targetDate={new Date(item.start_date)} isAr={isAr} />}
                </div>
                <ShareButton title={title} url={`/exhibitions/${item.slug || item.id}`} isAr={isAr} className="absolute start-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <CardContent className="p-3">
                <h3 className="mb-1 line-clamp-2 text-sm font-bold text-foreground group-hover:text-primary transition-colors leading-snug">
                  {title}
                </h3>
                {organizerName && (
                  <div className="mb-1.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    {item.logo_url ? (
                      <img src={item.logo_url} alt={organizerName} className="h-4 w-4 rounded object-contain shrink-0" />
                    ) : (
                      <Globe className="h-3 w-3 shrink-0 text-primary/50" />
                    )}
                    <span className="truncate">{organizerName}</span>
                  </div>
                )}
                <div className="space-y-1 text-[11px] text-muted-foreground">
                  {item.start_date && (
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3 w-3 shrink-0 text-primary/50" />
                      <span>{format(new Date(item.start_date), "MMM d, yyyy")}</span>
                    </div>
                  )}
                  {(venue || item.city) && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3 w-3 shrink-0 text-primary/50" />
                      <span className="truncate">{venue || ""}{item.city ? (venue ? `, ${item.city}` : item.city) : ""}{item.country ? `, ${item.country}` : ""}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      },
      viewAllHref: "/exhibitions",
    },
    {
      key: "chefs-table",
      icon: Coffee,
      labelEn: "Chef's Table",
      labelAr: "طاولة الشيف",
      items: chefsTableSessions,
      renderItem: (item: any) => {
        const title = isAr && item.title_ar ? item.title_ar : item.title;
        return (
          <Link key={item.id} to={`/chefs-table/${item.id}`} className="group block">
            <Card interactive className="h-full border-border/40 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-primary/25">
              <CardContent className="p-4">
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 transition-all duration-300 group-hover:scale-110 group-hover:bg-primary/15">
                  <Coffee className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mb-1.5 line-clamp-2 text-sm font-bold text-foreground group-hover:text-primary transition-colors">{title}</h3>
                <div className="space-y-1.5 text-[11px] text-muted-foreground">
                  {item.product_category && (
                    <Badge variant="secondary" className="text-[10px]">{item.product_category}</Badge>
                  )}
                  {item.session_date && (
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3 w-3 shrink-0 text-primary/50" />
                      <span>{format(new Date(item.session_date), "MMM d, yyyy")}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      },
      viewAllHref: "/chefs-table",
    },
  ];

  return (
    <section className="container py-8 md:py-12" aria-labelledby="events-cat-heading">
      <SectionReveal>
        <div className="mb-6 text-center">
          <h2 id="events-cat-heading" className={cn("text-xl font-bold sm:text-2xl md:text-3xl text-foreground tracking-tight", !isAr && "font-serif")}>
            {isAr ? "استكشف عالم الفعاليات" : "Explore the World of Events"}
          </h2>
          <p className="mt-1.5 text-sm text-muted-foreground max-w-lg mx-auto">
            {isAr ? "مسابقات ومعارض وجلسات تذوق تنتظرك من كل أنحاء العالم" : "Competitions, exhibitions & tastings await you from around the globe"}
          </p>
        </div>
      </SectionReveal>

      <Tabs defaultValue="competitions" className="w-full">
        <TabsList className="mx-auto mb-5 flex w-fit flex-wrap">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.key} value={tab.key} className="gap-1 text-xs sm:text-sm sm:gap-1.5">
              <tab.icon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              {isAr ? tab.labelAr : tab.labelEn}
              {tab.items.length > 0 && (
                <span className="ms-1 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-muted px-1 text-[9px] font-bold tabular-nums">
                  {tab.items.length}
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {tabs.map((tab) => (
          <TabsContent key={tab.key} value={tab.key}>
            {tab.items.length > 0 ? (
              <>
                {/* Featured layout: first card large + rest in grid */}
                {tab.key === "competitions" && tab.items.length >= 3 && tab.renderFeatured ? (
                  <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
                    {tab.renderFeatured(tab.items[0])}
                    {tab.items.slice(1).map(tab.renderItem)}
                  </div>
                ) : (
                  <StaggeredList className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4" stagger={60}>
                    {tab.items.map(tab.renderItem)}
                  </StaggeredList>
                )}
                <div className="mt-5 text-center">
                  <Button variant="outline" size="sm" asChild>
                    <Link to={tab.viewAllHref}>
                      {isAr ? "عرض الكل" : "View All"}
                      <ArrowRight className="ms-1 h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
              </>
            ) : (
              <div className="py-10 text-center text-muted-foreground">
                {isAr ? "لا توجد فعاليات حالياً — ترقبوا الجديد!" : "No events yet — stay tuned for exciting updates!"}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </section>
  );
}
