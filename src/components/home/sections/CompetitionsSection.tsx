import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, MapPin, Trophy, Flame } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { localizeLocation } from "@/lib/localizeLocation";
import { useSectionConfig } from "@/components/home/SectionKeyContext";
import { SectionHeader } from "@/components/home/SectionHeader";
import { HorizontalScrollRow } from "@/components/home/HorizontalScrollRow";

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
    <section dir={isAr ? "rtl" : "ltr"}>
      <div className="container">
        <SectionHeader
          icon={Trophy}
          badge={isAr ? "مسابقات وفعاليات" : "Competitions & Events"}
          title={title}
          subtitle={showSubtitle ? subtitle : undefined}
          viewAllHref={showViewAll ? "/events-calendar" : undefined}
          isAr={isAr}
        />

        <HorizontalScrollRow isAr={isAr}>
          {allEvents.map((event: any) => (
            <Link
              key={event.id}
              to={event.link}
              className="group block snap-start shrink-0 w-[72vw] sm:w-[45vw] md:w-[32vw] lg:w-[24vw] xl:w-[20vw] touch-manipulation"
            >
              <Card className="overflow-hidden border-border/30 h-full transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5 rounded-2xl active:scale-[0.98]">
                <div className="relative aspect-[16/10] overflow-hidden">
                  {event.cover_image_url ? (
                    <img src={event.cover_image_url} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                  ) : (
                    <div className="h-full w-full bg-muted flex items-center justify-center">
                      <Trophy className="h-8 w-8 text-muted-foreground/20" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />
                  <div className="absolute top-2 start-2 flex gap-1.5">
                    {event.status && STATUS_STYLES[event.status] && (
                      <Badge variant="outline" className={cn("text-[9px] font-bold", STATUS_STYLES[event.status].class)}>
                        {event.status === "in_progress" && <Flame className="h-3 w-3 me-0.5" />}
                        {isAr ? STATUS_STYLES[event.status].ar : STATUS_STYLES[event.status].en}
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-[9px] bg-background/80 backdrop-blur-sm">
                      {event.type === "competition" ? (isAr ? "مسابقة" : "Competition") : (isAr ? "معرض" : "Exhibition")}
                    </Badge>
                  </div>
                </div>
                <CardContent className="p-3">
                  <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                    {isAr ? event.title_ar || event.title : event.title}
                  </h3>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                    {event.date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(event.date), "d MMM yyyy", { locale: isAr ? ar : undefined })}
                      </span>
                    )}
                    {(event.city || event.country) && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {localizeLocation({ city: event.city, country: event.country }, isAr)}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </HorizontalScrollRow>
      </div>
    </section>
  );
}
