import React, { useState, useMemo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useGlobalEventsCalendar, GLOBAL_EVENT_COLORS, GLOBAL_EVENT_LABELS, type GlobalEvent, type GlobalEventType } from "@/hooks/useGlobalEventsCalendar";
import { Badge } from "@/components/ui/badge";
import { Globe, Calendar, MapPin, Timer, Building2, MoreHorizontal } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ar } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { ICONS } from "@/pages/events-calendar/constants";
import { getCountdown } from "@/pages/events-calendar/utils";
import { SectionHeader } from "./SectionHeader";
import { FilterChip } from "./FilterChip";
import { HorizontalScrollRow } from "./HorizontalScrollRow";
import { localizeCity } from "@/lib/localizeLocation";
import { useSectionConfig } from "@/components/home/SectionKeyContext";

const FILTER_TYPES: GlobalEventType[] = ["competition", "exhibition", "conference", "tv_interview", "training", "chefs_table"];

function resolveEventType(type: string | null | undefined): GlobalEventType {
  if (type && Object.prototype.hasOwnProperty.call(GLOBAL_EVENT_COLORS, type)) {
    return type as GlobalEventType;
  }
  return "other";
}

function getEventMeta(event: GlobalEvent) {
  const eventType = resolveEventType(event.type);
  return {
    colors: GLOBAL_EVENT_COLORS[eventType],
    label: GLOBAL_EVENT_LABELS[eventType],
  };
}

function formatEventDate(value: string, isAr: boolean) {
  const parsed = parseISO(value);
  if (Number.isNaN(parsed.getTime())) return isAr ? "تاريخ غير محدد" : "Date TBD";
  return format(parsed, "d MMM yyyy", { locale: isAr ? ar : undefined });
}

export function HomeEventsCalendarPreview() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [selectedFilter, setSelectedFilter] = useState<GlobalEventType | null>(null);
  const { data: events = [] } = useGlobalEventsCalendar();
  const sectionConfig = useSectionConfig();
  const itemCount = sectionConfig?.item_count || 6;

  const upcoming = useMemo(() => {
    const now = Date.now();
    let filtered = events.filter((event) => {
      const startsAt = Date.parse(event.start_date ?? "");
      return Number.isFinite(startsAt) && startsAt >= now;
    });
    if (selectedFilter) {
      filtered = filtered.filter((event) => resolveEventType(event.type) === selectedFilter);
    }
    return filtered.slice(0, itemCount);
  }, [events, selectedFilter, itemCount]);

  if (events.length === 0) return null;

  return (
    <section dir={isAr ? "rtl" : "ltr"}>
      <div className="container">
        <SectionHeader
          icon={Globe}
          badge={isAr ? "التقويم" : "Calendar"}
          title={isAr ? "تقويم الفعاليات" : "Events Calendar"}
          subtitle={isAr ? "الفعاليات القادمة محلياً ودولياً" : "Upcoming local & international events"}
          viewAllHref="/events-calendar"
          viewAllLabel={isAr ? "عرض التقويم" : "View Calendar"}
          isAr={isAr}
          filters={
            <>
              <FilterChip
                label={isAr ? "الكل" : "All"}
                active={selectedFilter === null}
                onClick={() => setSelectedFilter(null)}
              />
              {FILTER_TYPES.map((type) => {
                const label = GLOBAL_EVENT_LABELS[type];
                const count = events.filter((e) => {
                  const s = Date.parse(e.start_date ?? "");
                  return resolveEventType(e.type) === type && Number.isFinite(s) && s >= Date.now();
                }).length;
                return (
                  <FilterChip
                    key={type}
                    label={isAr ? label?.ar : label?.en}
                    active={selectedFilter === type}
                    count={count}
                    onClick={() => setSelectedFilter(selectedFilter === type ? null : type)}
                  />
                );
              })}
            </>
          }
        />

        {upcoming.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">{isAr ? "لا توجد فعاليات قادمة" : "No upcoming events"}</p>
          </div>
        ) : (
          <HorizontalScrollRow isAr={isAr}>
            {upcoming.map((event) => (
              <CalendarEventCard key={event.id} event={event} isAr={isAr} />
            ))}
          </HorizontalScrollRow>
        )}
      </div>
    </section>
  );
}

/* ─── Calendar Event Card ─── */
const CalendarEventCard = forwardRef<HTMLDivElement, { event: GlobalEvent; isAr: boolean }>(function CalendarEventCard({ event, isAr }, ref) {
  const { colors, label } = getEventMeta(event);
  const IconComp = ICONS[label?.icon] || MoreHorizontal;
  const countdown = getCountdown(event.start_date, isAr);

  const card = (
    <div className="group flex gap-3 rounded-2xl border border-border/30 bg-card p-3 transition-all duration-300 hover:shadow-md hover:shadow-primary/5 hover:-translate-y-0.5 active:scale-[0.98] touch-manipulation h-full">
      {/* Image / Icon */}
      <div className={cn("w-20 h-20 rounded-xl overflow-hidden shrink-0", !event.cover_image_url && colors.bg)}>
        {event.cover_image_url ? (
          <img
            src={event.cover_image_url}
            alt={event.title || "Event"}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <IconComp className={cn("h-6 w-6 opacity-40", colors.text)} />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-1.5 flex-wrap mb-1">
            <Badge variant="outline" className={cn("text-[9px] px-1.5 py-0 border gap-0.5", colors.bg, colors.text, colors.border)}>
              <IconComp className="h-2.5 w-2.5" />
              {isAr ? label?.ar : label?.en}
            </Badge>
            {!countdown.past && (
              <Badge
                variant={countdown.urgent ? "destructive" : "secondary"}
                className="text-[9px] px-1.5 py-0 gap-0.5"
              >
                <Timer className="h-2 w-2" />
                {countdown.text}
              </Badge>
            )}
          </div>
          <h3 className="text-[13px] font-bold line-clamp-2 group-hover:text-primary transition-colors leading-snug">
            {isAr && event.title_ar ? event.title_ar : event.title}
          </h3>
        </div>
        <div className="flex items-center gap-2.5 text-[11px] text-muted-foreground mt-1.5">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3 text-primary/50" />
            {formatEventDate(event.start_date, isAr)}
          </span>
          {event.city && (
            <span className="flex items-center gap-1 truncate">
              <MapPin className="h-3 w-3 text-primary/50 shrink-0" />
              {localizeCity(event.city, isAr)}
            </span>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="snap-start shrink-0 w-[80vw] sm:w-[48vw] md:w-[38vw] lg:w-[30vw] xl:w-[24vw]">
      {event.link ? <Link to={event.link} className="block h-full">{card}</Link> : card}
    </div>
  );
}
