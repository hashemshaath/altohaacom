import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GLOBAL_EVENT_COLORS, GLOBAL_EVENT_LABELS, type GlobalEvent } from "@/hooks/useGlobalEventsCalendar";
import { Calendar, Clock, MapPin, Timer, Building2, ArrowRight, MoreHorizontal } from "lucide-react";
import { format, parseISO, isSameDay } from "date-fns";
import { ar as arLocale } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { localizeCity } from "@/lib/localizeLocation";
import { Link } from "react-router-dom";
import { ICONS } from "./constants";
import { getCountdown, getEventsForDay } from "./utils";

export function DayView({ events, currentDate, isAr }: { events: GlobalEvent[]; currentDate: Date; isAr: boolean }) {
  const dayEvents = useMemo(() => getEventsForDay(events, currentDate), [events, currentDate]);
  const isToday = isSameDay(currentDate, new Date());

  return (
    <Card className="shadow-sm border-border/40">
      <div className={cn("flex items-center gap-4 px-5 py-5 border-b border-border/20", isToday && "bg-primary/5")}>
        <div className={cn(
          "flex h-16 w-16 flex-col items-center justify-center rounded-2xl shadow-sm shrink-0",
          isToday ? "bg-primary text-primary-foreground" : "bg-muted"
        )}>
          <span className="text-[10px] font-bold uppercase leading-none tracking-wider">{format(currentDate, "EEE", isAr ? { locale: arLocale } : undefined)}</span>
          <span className="text-3xl font-bold leading-none tabular-nums mt-1">{currentDate.getDate()}</span>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold">{format(currentDate, isAr ? "d MMMM yyyy" : "MMMM d, yyyy", isAr ? { locale: arLocale } : undefined)}</h3>
          <p className="text-sm text-muted-foreground">
            {dayEvents.length} {isAr ? "فعاليات مجدولة" : "events scheduled"}
            {isToday && <span className="text-primary font-semibold ms-1.5">• {isAr ? "اليوم" : "Today"}</span>}
          </p>
          {dayEvents.length > 0 && dayEvents.length <= 3 && (
            <div className="mt-1 flex flex-wrap gap-1.5">
              {dayEvents.map(ev => {
                const evColors = GLOBAL_EVENT_COLORS[ev.type];
                return (
                  <Badge key={ev.id} variant="outline" className={cn("text-[10px] px-1.5 py-0 gap-1 border", evColors?.bg, evColors?.text, evColors?.border)}>
                    {isAr && ev.title_ar ? ev.title_ar : ev.title}
                  </Badge>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <CardContent className="p-5">
        {dayEvents.length === 0 ? (
          <div className="text-center py-16">
            <Calendar className="h-12 w-12 text-muted-foreground/10 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">{isAr ? "لا توجد فعاليات في هذا اليوم" : "No events scheduled for this day"}</p>
            <p className="text-xs text-muted-foreground/50 mt-1">{isAr ? "استخدم ← → للتنقل" : "Use ← → to navigate"}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {dayEvents.map(ev => <DayEventCard key={ev.id} event={ev} isAr={isAr} />)}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function DayEventCard({ event, isAr }: { event: GlobalEvent; isAr: boolean }) {
  const colors = GLOBAL_EVENT_COLORS[event.type];
  const label = GLOBAL_EVENT_LABELS[event.type];
  const IconComp = ICONS[label?.icon] || MoreHorizontal;
  const countdown = getCountdown(event.start_date, isAr);

  const content = (
    <div className={cn(
      "flex gap-3 p-4 rounded-xl border transition-all hover:shadow-lg group",
      colors.border, "hover:bg-muted/20",
      countdown.urgent && !countdown.past && "ring-1 ring-destructive/20"
    )}>
      {event.cover_image_url ? (
        <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-muted shadow-sm">
          <img src={event.cover_image_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
        </div>
      ) : (
        <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-xl", colors.bg)}>
          <IconComp className={cn("h-5 w-5", colors.text)} />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 border gap-0.5", colors.bg, colors.text, colors.border)}>
            <IconComp className="h-2.5 w-2.5" />
            {isAr ? label?.ar : label?.en}
          </Badge>
          {!countdown.past && (
            <Badge variant={countdown.urgent ? "destructive" : "secondary"} className="text-[9px] px-1.5 py-0 gap-0.5">
              <Timer className="h-2.5 w-2.5" />{countdown.text}
            </Badge>
          )}
        </div>
        <p className="text-sm font-bold group-hover:text-primary transition-colors line-clamp-2">
          {isAr && event.title_ar ? event.title_ar : event.title}
        </p>
        <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground flex-wrap">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {event.all_day ? (isAr ? "طوال اليوم" : "All Day") : format(parseISO(event.start_date), "h:mm a", isAr ? { locale: arLocale } : undefined)}
            {event.end_date && ` – ${format(parseISO(event.end_date), isAr ? "d MMM" : "MMM d", isAr ? { locale: arLocale } : undefined)}`}
          </span>
          {event.city && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{localizeCity(event.city, isAr)}</span>}
          {event.organizer_name && <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{isAr && event.organizer_name_ar ? event.organizer_name_ar : event.organizer_name}</span>}
        </div>
      </div>
      {event.link && (
        <div className="hidden sm:flex items-center">
          <ArrowRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary transition-colors" />
        </div>
      )}
    </div>
  );

  return event.link ? <Link to={event.link}>{content}</Link> : content;
}
