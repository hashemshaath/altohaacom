import React, { memo, useState, useMemo, useRef } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import {
  useGlobalEventsCalendar,
  GLOBAL_EVENT_COLORS,
  GLOBAL_EVENT_LABELS,
  type GlobalEvent,
  type GlobalEventType,
} from "@/hooks/useGlobalEventsCalendar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Globe,
  Calendar,
  MapPin,
  Timer,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ar as arLocale } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { ICONS } from "@/pages/events-calendar/constants";
import { getCountdown } from "@/pages/events-calendar/utils";
import { SectionHeader } from "./SectionHeader";
import { localizeCity } from "@/lib/localizeLocation";
import { useSectionConfig } from "@/components/home/SectionKeyContext";
import { MoreHorizontal } from "lucide-react";

/* ─── Constants ─── */
const FILTER_TYPES: GlobalEventType[] = [
  "competition",
  "exhibition",
  "conference",
  "tv_interview",
  "training",
  "chefs_table",
];

/* ─── Helpers ─── */
function resolveEventType(type: string | null | undefined): GlobalEventType {
  if (type && Object.prototype.hasOwnProperty.call(GLOBAL_EVENT_COLORS, type)) {
    return type as GlobalEventType;
  }
  return "other";
}

function formatEventDate(value: string, isAr: boolean) {
  const parsed = parseISO(value);
  if (Number.isNaN(parsed.getTime())) return isAr ? "تاريخ غير محدد" : "Date TBD";
  return format(parsed, "d MMM yyyy", { locale: isAr ? arLocale : undefined });
}

function formatDateParts(value: string, isAr: boolean) {
  const parsed = parseISO(value);
  if (Number.isNaN(parsed.getTime())) return { day: "?", month: "TBD" };
  return {
    day: format(parsed, "d"),
    month: format(parsed, "MMM", { locale: isAr ? arLocale : undefined }),
    year: format(parsed, "yyyy"),
  };
}

/* ─── Main Component ─── */
export const HomeEventsCalendarPreview = memo(function HomeEventsCalendarPreview() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [selectedFilter, setSelectedFilter] = useState<GlobalEventType | null>(null);
  const { data: events = [] } = useGlobalEventsCalendar();
  const sectionConfig = useSectionConfig();
  const itemCount = sectionConfig?.item_count || 6;
  const scrollRef = useRef<HTMLDivElement>(null);

  const now = Date.now();

  const upcomingAll = useMemo(
    () =>
      events.filter((e) => {
        const s = Date.parse(e.start_date ?? "");
        return Number.isFinite(s) && s >= now;
      }),
    [events, now]
  );

  const upcoming = useMemo(() => {
    let filtered = upcomingAll;
    if (selectedFilter) {
      filtered = filtered.filter((e) => resolveEventType(e.type) === selectedFilter);
    }
    return filtered.slice(0, itemCount);
  }, [upcomingAll, selectedFilter, itemCount]);

  const typeCounts = useMemo(() => {
    const counts: Partial<Record<GlobalEventType, number>> = {};
    for (const e of upcomingAll) {
      const t = resolveEventType(e.type);
      counts[t] = (counts[t] || 0) + 1;
    }
    return counts;
  }, [upcomingAll]);

  const scroll = (dir: "start" | "end") => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.7;
    // In RTL, scrollLeft is negative, so "end" (logical) means scrolling left (negative)
    const physicalDir = dir === "end" ? 1 : -1;
    const rtlFlip = isAr ? -1 : 1;
    el.scrollBy({ left: physicalDir * rtlFlip * amount, behavior: "smooth" });
  };

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
        />

        {/* ─── Single-line scrollable filters ─── */}
        <div className="mb-5 -mx-1 overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-2 px-1 min-w-max">
            <FilterPill
              label={isAr ? "الكل" : "All"}
              active={selectedFilter === null}
              count={upcomingAll.length}
              onClick={() => setSelectedFilter(null)}
            />
            {FILTER_TYPES.map((type) => {
              const label = GLOBAL_EVENT_LABELS[type];
              const count = typeCounts[type] || 0;
              if (count === 0) return null;
              return (
                <FilterPill
                  key={type}
                  label={isAr ? label?.ar : label?.en}
                  active={selectedFilter === type}
                  count={count}
                  onClick={() => setSelectedFilter(selectedFilter === type ? null : type)}
                  dotColor={GLOBAL_EVENT_COLORS[type].dot}
                />
              );
            })}
          </div>
        </div>

        {/* ─── Events grid ─── */}
        {upcoming.length === 0 ? (
          <div className="text-center py-12 rounded-2xl border border-dashed border-border/40 bg-muted/20">
            <Calendar className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground font-medium">
              {isAr ? "لا توجد فعاليات قادمة" : "No upcoming events"}
            </p>
          </div>
        ) : (
          <div className="relative group/scroll">
            {/* Scroll arrows — desktop */}
            <Button
              variant="outline"
              size="icon"
              className="absolute start-0 top-1/2 -translate-y-1/2 z-20 h-9 w-9 rounded-full shadow-lg bg-background/95 backdrop-blur-sm opacity-0 group-hover/scroll:opacity-100 transition-opacity hidden sm:flex"
              onClick={() => scroll("start")}
            >
              <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="absolute end-0 top-1/2 -translate-y-1/2 z-20 h-9 w-9 rounded-full shadow-lg bg-background/95 backdrop-blur-sm opacity-0 group-hover/scroll:opacity-100 transition-opacity hidden sm:flex"
              onClick={() => scroll("end")}
            >
              <ChevronRight className="h-4 w-4 rtl:rotate-180" />
            </Button>

            <div
              ref={scrollRef}
              dir={isAr ? "rtl" : "ltr"}
              className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-none pb-2 touch-pan-x"
              style={{ WebkitOverflowScrolling: "touch" }}
            >
              {upcoming.map((event) => (
                <EventCard key={event.id} event={event} isAr={isAr} />
              ))}
            </div>
          </div>
        )}

        {/* Stats strip */}
        {upcomingAll.length > 3 && (
          <div className="mt-5 flex items-center justify-between rounded-2xl bg-muted/30 border border-border/20 px-4 py-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Sparkles className="h-4 w-4 text-primary/60" />
              <span className="font-medium">
                {isAr
                  ? `${upcomingAll.length} فعالية قادمة`
                  : `${upcomingAll.length} upcoming events`}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="rounded-xl gap-1 text-xs font-semibold text-primary h-8 px-3"
              asChild
            >
              <Link to="/events-calendar">
                {isAr ? "عرض الكل" : "View all"}
                <ArrowRight className="h-3 w-3 rtl:rotate-180" />
              </Link>
            </Button>
          </div>
        )}
      </div>
    </section>
  );
});

/* ─── Filter Pill ─── */
interface FilterPillProps {
  label: string;
  active: boolean;
  count: number;
  onClick: () => void;
  dotColor?: string;
}

const FilterPill = memo(
  React.forwardRef<HTMLButtonElement, FilterPillProps>(function FilterPill(
    { label, active, count, onClick, dotColor },
    ref
  ) {
    return (
      <button
        ref={ref}
        onClick={onClick}
        className={cn(
          "shrink-0 flex items-center gap-1.5 h-9 px-4 rounded-full text-sm font-semibold transition-all duration-200 touch-manipulation active:scale-95",
          active
            ? "bg-primary text-primary-foreground shadow-sm"
            : "bg-muted/50 text-muted-foreground hover:bg-muted border border-border/30"
        )}
      >
        {dotColor && !active && <span className={cn("h-2 w-2 rounded-full shrink-0", dotColor)} />}
        {label}
        {count > 0 && (
          <span
            className={cn(
              "text-[11px] tabular-nums",
              active ? "opacity-80" : "opacity-50"
            )}
          >
            ({count})
          </span>
        )}
      </button>
    );
  })
);

/* ─── Event Card ─── */
const EventCard = memo(React.forwardRef<HTMLDivElement, { event: GlobalEvent; isAr: boolean }>(
  function EventCard({ event, isAr }, ref) {
  const eventType = resolveEventType(event.type);
  const colors = GLOBAL_EVENT_COLORS[eventType];
  const label = GLOBAL_EVENT_LABELS[eventType];
  const IconComp = ICONS[label?.icon] || MoreHorizontal;
  const countdown = getCountdown(event.start_date, isAr);
  const dateParts = formatDateParts(event.start_date, isAr);
  const title = isAr && event.title_ar ? event.title_ar : event.title;

  const card = (
    <article
      className={cn(
        "group relative flex flex-col rounded-2xl border border-border/30 bg-card overflow-hidden",
        "transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1",
        "active:scale-[0.98] touch-manipulation h-full"
      )}
    >
      {/* Cover image or gradient header */}
      <div className={cn("relative h-36 sm:h-40 overflow-hidden", !event.cover_image_url && colors.bg)}>
        {event.cover_image_url ? (
          <img loading="lazy" src={event.cover_image_url}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
           
            decoding="async"
          />
        ) : event.logo_url ? (
          <div className="flex items-center justify-center h-full bg-gradient-to-br from-background to-muted/50 p-4">
            <img loading="lazy" src={event.logo_url}
              alt={title}
              className="max-h-20 max-w-[80%] object-contain"
             
            />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <IconComp className={cn("h-12 w-12 opacity-15", colors.text)} />
          </div>
        )}

        {/* Top badges overlay */}
        <div className="absolute top-2.5 start-2.5 end-2.5 flex items-start justify-between">
          <Badge
            className={cn(
              "text-[11px] px-2 py-0.5 gap-1 rounded-lg font-bold shadow-sm backdrop-blur-sm",
              colors.bg,
              colors.text,
              colors.border
            )}
          >
            <IconComp className="h-3 w-3" />
            {isAr ? label?.ar : label?.en}
          </Badge>
          {!countdown.past && (
            <Badge
              variant={countdown.urgent ? "destructive" : "secondary"}
              className="text-[11px] px-2 py-0.5 gap-1 rounded-lg font-bold shadow-sm backdrop-blur-sm"
            >
              <Timer className="h-3 w-3" />
              {countdown.text}
            </Badge>
          )}
        </div>

        {/* Date chip — bottom-end */}
        <div className="absolute bottom-2.5 end-2.5 flex flex-col items-center justify-center h-12 w-12 rounded-xl bg-background/90 backdrop-blur-sm shadow-sm border border-border/20">
          <span className="text-[10px] font-bold uppercase leading-none text-primary">
            {dateParts.month}
          </span>
          <span className="text-lg font-extrabold leading-none mt-0.5 text-foreground">
            {dateParts.day}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col p-4 gap-2">
        <h3 className="text-sm sm:text-[15px] font-bold line-clamp-2 group-hover:text-primary transition-colors leading-snug">
          {title}
        </h3>

        {/* Organizer */}
        {(event.organizer_name || event.organizer_name_ar) && (
          <p className="text-[11px] text-muted-foreground truncate">
            {isAr ? event.organizer_name_ar || event.organizer_name : event.organizer_name}
          </p>
        )}

        {/* Meta row */}
        <div className="mt-auto flex items-center gap-3 text-[12px] text-muted-foreground pt-2 border-t border-border/20">
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5 text-primary/50 shrink-0" />
            {formatEventDate(event.start_date, isAr)}
          </span>
          {event.city && (
            <span className="flex items-center gap-1 truncate">
              <MapPin className="h-3.5 w-3.5 text-primary/50 shrink-0" />
              {localizeCity(event.city, isAr)}
            </span>
          )}
        </div>
      </div>
    </article>
  );

  return (
    <div ref={ref} className="snap-start shrink-0 w-[75vw] sm:w-[46vw] md:w-[36vw] lg:w-[28vw] xl:w-[22vw]">
      {event.link ? (
        <Link to={event.link} className="block h-full">
          {card}
        </Link>
      ) : (
        card
      )}
    </div>
  );
}));
