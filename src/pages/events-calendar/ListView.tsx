import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GLOBAL_EVENT_COLORS, GLOBAL_EVENT_LABELS, type GlobalEvent } from "@/hooks/useGlobalEventsCalendar";
import { Calendar, MapPin, Landmark, Tv, Timer, Building2, ArrowRight, MoreHorizontal } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ar as arLocale } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { ICONS } from "./constants";
import { getCountdown } from "./utils";
import { localizeCity, localizeCountry } from "@/lib/localizeLocation";

export function ListView({ events, isAr }: { events: GlobalEvent[]; isAr: boolean }) {
  const now = new Date();
  const upcomingEvents = events.filter(e => new Date(e.start_date) >= now);
  const pastEvents = events.filter(e => new Date(e.start_date) < now);

  const groupedUpcoming = useMemo(() => {
    const groups: Record<string, GlobalEvent[]> = {};
    upcomingEvents.forEach(e => {
      const key = format(new Date(e.start_date), "yyyy-MM");
      if (!groups[key]) groups[key] = [];
      groups[key].push(e);
    });
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [upcomingEvents]);

  if (events.length === 0) {
    return (
      <div className="text-center py-20">
        <Calendar className="h-12 w-12 text-muted-foreground/10 mx-auto mb-3" />
        <p className="text-sm font-medium text-muted-foreground">{isAr ? "لا توجد فعاليات" : "No events found"}</p>
        <p className="text-xs text-muted-foreground/50 mt-1">{isAr ? "جرّب تغيير الفلاتر" : "Try adjusting your filters"}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {groupedUpcoming.map(([monthKey, monthEvents]) => (
        <div key={monthKey}>
          <div className="flex items-center gap-3 mb-3">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <h3 className="text-sm font-bold text-foreground">
              {format(new Date(monthKey + "-01"), "MMMM yyyy", isAr ? { locale: arLocale } : undefined)}
            </h3>
            <Badge variant="outline" className="text-[10px] tabular-nums">{monthEvents.length}</Badge>
            <div className="flex-1 h-px bg-border/30" />
          </div>
          <div className="space-y-2.5">
            {monthEvents.map(ev => <ListEventCard key={ev.id} event={ev} isAr={isAr} />)}
          </div>
        </div>
      ))}

      {pastEvents.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-3">
            <h3 className="text-sm font-bold text-muted-foreground">
              {isAr ? "فعاليات سابقة" : "Past Events"}
            </h3>
            <Badge variant="outline" className="text-[10px] tabular-nums">{pastEvents.length}</Badge>
            <div className="flex-1 h-px bg-border/30" />
          </div>
          <div className="space-y-2 opacity-60">
            {pastEvents.slice(-8).reverse().map(ev => <ListEventCard key={ev.id} event={ev} isAr={isAr} />)}
          </div>
        </div>
      )}
    </div>
  );
}

function ListEventCard({ event, isAr }: { event: GlobalEvent; isAr: boolean }) {
  const colors = GLOBAL_EVENT_COLORS[event.type];
  const label = GLOBAL_EVENT_LABELS[event.type];
  const IconComp = ICONS[label?.icon] || MoreHorizontal;
  const countdown = getCountdown(event.start_date, isAr);
  const countryLabel = event.country_code ? localizeCountry(event.country_code, isAr) : "";

  const card = (
    <Card className={cn(
      "overflow-hidden transition-all hover:shadow-xl group border-border/40",
      countdown.past && "opacity-70"
    )}>
      <div className="flex">
        <div className={cn(
          "w-28 sm:w-36 shrink-0 relative overflow-hidden",
          !event.cover_image_url && colors.bg
        )}>
          {event.cover_image_url ? (
            <img src={event.cover_image_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
          ) : (
            <div className="flex items-center justify-center h-full">
              <IconComp className={cn("h-8 w-8 opacity-30", colors.text)} />
            </div>
          )}
          {event.logo_url && (
            <div className="absolute bottom-1.5 start-1.5 h-8 w-8 rounded-xl bg-background/90 shadow-sm flex items-center justify-center overflow-hidden ring-1 ring-border/20">
              <img src={event.logo_url} alt="" className="h-6 w-6 object-contain" loading="lazy" />
            </div>
          )}
          {!countdown.past && (
            <div className={cn(
              "absolute top-1.5 end-1.5 rounded-md px-1.5 py-0.5 text-[10px] font-bold shadow-sm",
              countdown.urgent ? "bg-destructive text-destructive-foreground" : "bg-background/90 text-foreground backdrop-blur-sm"
            )}>
              <Timer className="h-2.5 w-2.5 inline me-0.5" />{countdown.text}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0 p-3 sm:p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
              <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 border gap-0.5", colors.bg, colors.text, colors.border)}>
                <IconComp className="h-2.5 w-2.5" />
                {isAr ? label?.ar : label?.en}
              </Badge>
              {event.is_recurring && (
                <Badge variant="outline" className="text-[9px] px-1 py-0">{isAr ? "سنوي" : "Annual"}</Badge>
              )}
              {event.status && event.status !== "upcoming" && (
                <Badge variant="secondary" className="text-[9px] px-1 py-0 capitalize">{(() => {
                  const sl: Record<string, string> = { completed: "مكتملة", ongoing: "جارية", cancelled: "ملغاة", postponed: "مؤجلة", past: "سابقة" };
                  return isAr ? (sl[event.status] || event.status) : event.status;
                })()}</Badge>
              )}
            </div>
            <h4 className="text-sm sm:text-base font-bold line-clamp-2 group-hover:text-primary transition-colors">
              {isAr && event.title_ar ? event.title_ar : event.title}
            </h4>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1 font-medium">
                <Calendar className="h-3 w-3 text-primary" />
                {format(parseISO(event.start_date), isAr ? "d MMM yyyy" : "MMM d, yyyy", isAr ? { locale: arLocale } : undefined)}
                {event.end_date && ` – ${format(parseISO(event.end_date), isAr ? "d MMM" : "MMM d", isAr ? { locale: arLocale } : undefined)}`}
              </span>
              {(event.city || countryLabel) && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {localizeCity(event.city || "", isAr)}{event.city && countryLabel ? ", " : ""}{countryLabel}
                </span>
              )}
              {event.venue && (
                <span className="flex items-center gap-1">
                  <Landmark className="h-3 w-3" />
                  {isAr && event.venue_ar ? event.venue_ar : event.venue}
                </span>
              )}
              {event.organizer_name && (
                <span className="flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  {isAr && event.organizer_name_ar ? event.organizer_name_ar : event.organizer_name}
                </span>
              )}
              {event.channel_name && (
                <span className="flex items-center gap-1"><Tv className="h-3 w-3" />{event.channel_name}</span>
              )}
            </div>
          </div>
          {event.link && (
            <div className="flex items-center justify-end mt-2 pt-2 border-t border-border/15">
              <span className="text-[11px] text-primary font-medium flex items-center gap-1 group-hover:gap-1.5 transition-all">
                {isAr ? "عرض التفاصيل" : "View Details"}
                <ArrowRight className="h-3 w-3" />
              </span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );

  return event.link ? <Link to={event.link} className="block">{card}</Link> : card;
}
