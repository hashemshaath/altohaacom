import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Calendar, MapPin, Trophy, Flame } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { localizeLocation } from "@/lib/localizeLocation";
import { useSectionConfig } from "@/components/home/SectionKeyContext";

const STATUS_STYLES: Record<string, { en: string; ar: string; class: string }> = {
  registration_open: { en: "Open", ar: "مفتوح", class: "bg-chart-2/10 text-chart-2 border-chart-2/20" },
  upcoming: { en: "Upcoming", ar: "قادم", class: "bg-chart-4/10 text-chart-4 border-chart-4/20" },
  in_progress: { en: "Live", ar: "مباشر", class: "bg-destructive/10 text-destructive border-destructive/20" },
};

export default function CompetitionsSection() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const config = useSectionConfig();

  const itemCount = config?.item_count || 6;
  const title = config
    ? (isAr ? config.title_ar || "انضم إلى الأحداث القادمة" : config.title_en || "Upcoming Events")
    : (isAr ? "انضم إلى الأحداث القادمة" : "Upcoming Events");
  const subtitle = config
    ? (isAr ? config.subtitle_ar || "" : config.subtitle_en || "")
    : (isAr ? "تنافس وشارك في أفضل الفعاليات الطهوية حول العالم" : "Compete and participate in world-class culinary events");
  const showTitle = config?.show_title ?? true;
  const showSubtitle = config?.show_subtitle ?? true;
  const showViewAll = config?.show_view_all ?? true;

  const { data: competitions = [] } = useQuery({
    queryKey: ["home-competitions-minimal", itemCount],
    queryFn: async () => {
      const { data } = await supabase
        .from("competitions")
        .select("id, title, title_ar, cover_image_url, status, competition_start, city, country, country_code, is_virtual")
        .in("status", ["registration_open", "upcoming", "in_progress"])
        .order("competition_start", { ascending: true })
        .limit(itemCount);
      return data || [];
    },
    staleTime: 1000 * 60 * 5,
  });

  const { data: exhibitions = [] } = useQuery({
    queryKey: ["home-exhibitions-minimal"],
    queryFn: async () => {
      const { data } = await supabase
        .from("exhibitions")
        .select("id, title, title_ar, cover_image_url, status, start_date, city, country, slug, venue, venue_ar")
        .in("status", ["upcoming", "active"])
        .order("start_date", { ascending: true })
        .limit(3);
      return data || [];
    },
    staleTime: 1000 * 60 * 5,
  });

  const allEvents = [
    ...competitions.map((c: any) => ({ ...c, type: "competition", date: c.competition_start, link: `/competitions/${c.id}` })),
    ...exhibitions.map((e: any) => ({ ...e, type: "exhibition", date: e.start_date, link: `/exhibitions/${e.slug || e.id}` })),
  ].sort((a, b) => new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime()).slice(0, itemCount);

  if (allEvents.length === 0) return null;

  return (
    <section className="relative overflow-hidden bg-muted/30" dir={isAr ? "rtl" : "ltr"}>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(var(--primary)/0.04),transparent_60%)]" />
      <div className="container relative">
        {showTitle && (
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-3 px-3 py-1 text-xs font-semibold uppercase tracking-widest">
              {isAr ? "مسابقات وفعاليات" : "Competitions & Events"}
            </Badge>
            <h2 className={cn("text-2xl font-bold sm:text-3xl lg:text-4xl text-foreground tracking-tight", !isAr && "font-serif")}>
              {title}
            </h2>
            {showSubtitle && subtitle && (
              <p className="mt-2 text-muted-foreground max-w-lg mx-auto">{subtitle}</p>
            )}
          </div>
        )}

        {/* Featured Event (first) + Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {allEvents[0] && (
            <Link to={allEvents[0].link} className="group">
              <Card className="overflow-hidden border-border/30 h-full transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5 rounded-2xl">
                <div className="relative aspect-[16/9] overflow-hidden">
                  {allEvents[0].cover_image_url ? (
                    <img src={allEvents[0].cover_image_url} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="h-full w-full bg-muted flex items-center justify-center">
                      <Trophy className="h-12 w-12 text-muted-foreground/30" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                  <div className="absolute top-3 start-3 flex gap-2">
                    {allEvents[0].status && STATUS_STYLES[allEvents[0].status] && (
                      <Badge variant="outline" className={cn("text-[10px] font-bold", STATUS_STYLES[allEvents[0].status].class)}>
                        {allEvents[0].status === "in_progress" && <Flame className="h-3 w-3 me-1" />}
                        {isAr ? STATUS_STYLES[allEvents[0].status].ar : STATUS_STYLES[allEvents[0].status].en}
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-[10px] bg-background/80 backdrop-blur-sm">
                      {allEvents[0].type === "competition" ? (isAr ? "مسابقة" : "Competition") : (isAr ? "معرض" : "Exhibition")}
                    </Badge>
                  </div>
                </div>
                <CardContent className="p-5">
                  <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                    {isAr ? allEvents[0].title_ar || allEvents[0].title : allEvents[0].title}
                  </h3>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    {allEvents[0].date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(allEvents[0].date), "d MMM yyyy", { locale: isAr ? ar : undefined })}
                      </span>
                    )}
                    {(allEvents[0].city || allEvents[0].country) && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {localizeLocation({ city: allEvents[0].city, country: allEvents[0].country }, isAr)}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            {allEvents.slice(1, 5).map((event: any) => (
              <Link key={event.id} to={event.link} className="group">
                <Card className="overflow-hidden border-border/30 h-full transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 rounded-2xl">
                  <div className="relative aspect-[16/10] overflow-hidden">
                    {event.cover_image_url ? (
                      <img src={event.cover_image_url} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                    ) : (
                      <div className="h-full w-full bg-muted flex items-center justify-center">
                        <Trophy className="h-8 w-8 text-muted-foreground/20" />
                      </div>
                    )}
                    <div className="absolute top-2 start-2">
                      {event.status && STATUS_STYLES[event.status] && (
                        <Badge variant="outline" className={cn("text-[9px] font-bold", STATUS_STYLES[event.status].class)}>
                          {isAr ? STATUS_STYLES[event.status].ar : STATUS_STYLES[event.status].en}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <CardContent className="p-3">
                    <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                      {isAr ? event.title_ar || event.title : event.title}
                    </h3>
                    {event.date && (
                      <p className="mt-1 text-[11px] text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(event.date), "d MMM yyyy", { locale: isAr ? ar : undefined })}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {showViewAll && (
          <div className="mt-10 text-center">
            <Button variant="outline" className="rounded-xl" asChild>
              <Link to="/events-calendar">
                {isAr ? "عرض جميع الفعاليات" : "View All Events"}
                <ArrowRight className="ms-2 h-4 w-4 rtl:rotate-180" />
              </Link>
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
