import { memo } from "react";
import { ROUTES } from "@/config/routes";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Trophy, Flame } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { localizeLocation } from "@/lib/localizeLocation";
import { useSectionConfig } from "@/components/home/SectionKeyContext";
import { SectionHeader } from "@/components/home/SectionHeader";
import { HorizontalScrollRow } from "@/components/home/HorizontalScrollRow";

const STATUS_STYLES: Record<string, { en: string; ar: string; dot: string }> = {
  registration_open: { en: "Open", ar: "مفتوح", dot: "bg-emerald-500" },
  upcoming: { en: "Upcoming", ar: "قادم", dot: "bg-blue-500" },
  in_progress: { en: "Live", ar: "مباشر", dot: "bg-red-500" },
  active: { en: "Active", ar: "نشط", dot: "bg-emerald-500" },
  completed: { en: "Completed", ar: "منتهي", dot: "bg-gray-400" },
};

const CompetitionsSection = memo(function CompetitionsSection() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const config = useSectionConfig();

  const itemCount = config?.item_count || 6;
  const title = config
    ? (isAr ? config.title_ar || "الفعاليات القادمة" : config.title_en || "Upcoming Events")
    : (isAr ? "الفعاليات القادمة" : "Upcoming Events");
  const subtitle = config
    ? (isAr ? config.subtitle_ar || "" : config.subtitle_en || "")
    : (isAr ? "تنافس وشارك في أفضل الفعاليات الطهوية" : "Compete in world-class culinary events");
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
        .in("status", ["upcoming", "active", "completed"])
        .order("start_date", { ascending: true })
        .limit(20);
      const active = (data || []).filter(e => e.status !== "completed");
      const completed = (data || []).filter(e => e.status === "completed").reverse().slice(0, 4);
      return [...active, ...completed].slice(0, 12);
    },
    staleTime: 1000 * 60 * 5,
  });

  const allEvents = [
    ...competitions.map((c) => ({ ...c, type: "competition" as const, date: c.competition_start, link: ROUTES.competition(c.id) })),
    ...exhibitions.map((e) => ({ ...e, type: "exhibition" as const, date: e.start_date, link: ROUTES.exhibition(e.slug || e.id) })),
  ].sort((a, b) => new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime()).slice(0, Math.max(itemCount, 12));

  if (allEvents.length === 0) return null;

  return (
    <section dir={isAr ? "rtl" : "ltr"}>
      <div className="container">
        <SectionHeader
          icon={Trophy}
          badge={isAr ? "فعاليات" : "Events"}
          title={title}
          subtitle={showSubtitle ? subtitle : undefined}
          viewAllHref={showViewAll ? "/events-calendar" : undefined}
          isAr={isAr}
        />

        <HorizontalScrollRow isAr={isAr}>
          {allEvents.map((event) => {
            const status = event.status && STATUS_STYLES[event.status];
            return (
              <Link
                key={event.id}
                to={event.link}
                className="group block snap-start shrink-0 w-[75vw] sm:w-[45vw] md:w-[32vw] lg:w-[24vw] xl:w-[20vw] touch-manipulation"
              >
                <div className="overflow-hidden rounded-2xl border border-border/30 <div className="overflow-hidden rounded-2xl border border-border/30 bg-card h-full transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1 active:scale-[0.98] shadow-sm"> hover:-translate-y-1 active:scale-[0.98] shadow-sm">
                  <div className="relative aspect-[16/10] overflow-hidden">
                    {event.cover_image_url ? (
                      <img src={event.cover_image_url} alt={isAr ? event.title_ar || event.title : event.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                        <Trophy className="h-10 w-10 text-muted-foreground/20" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <div className="absolute top-2.5 start-2.5 flex gap-1.5">
                      {status && (
                        <Badge className="text-xs font-bold bg-white/90 text-foreground backdrop-blur-sm border-0 gap-1.5 shadow-sm">
                          <span className={cn("h-1.5 w-1.5 rounded-full", status.dot)} />
                          {event.status === "in_progress" && <Flame className="h-3 w-3 text-red-500" />}
                          {isAr ? status.ar : status.en}
                        </Badge>
                      )}
                    </div>
                    <Badge className="absolute bottom-2.5 start-2.5 text-xs bg-white/90 text-foreground backdrop-blur-sm border-0 shadow-sm">
                      {event.type === "competition" ? (isAr ? "مسابقة" : "Competition") : (isAr ? "معرض" : "Exhibition")}
                    </Badge>
                  </div>
                  <div className="p-4">
                    <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                      {isAr ? event.title_ar || event.title : event.title}
                    </h3>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      {event.date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {format(new Date(event.date), "d MMM yyyy", { locale: isAr ? ar : undefined })}
                        </span>
                      )}
                      {(event.city || event.country) && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {localizeLocation({ city: event.city, country: event.country }, isAr)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </HorizontalScrollRow>
      </div>
    </section>
  );
});

export default CompetitionsSection;
