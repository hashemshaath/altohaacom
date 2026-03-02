import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { GLOBAL_EVENT_COLORS, GLOBAL_EVENT_LABELS, type GlobalEvent } from "@/hooks/useGlobalEventsCalendar";
import { Calendar, MapPin, Landmark, Tv, Timer, Building2, MoreHorizontal } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ar as arLocale } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { localizeCity, localizeCountry } from "@/lib/localizeLocation";
import { Link } from "react-router-dom";
import { ICONS } from "./constants";
import { getCountdown } from "./utils";

function EventTooltipContent({ event, isAr }: { event: GlobalEvent; isAr: boolean }) {
  const label = GLOBAL_EVENT_LABELS[event.type];
  const colors = GLOBAL_EVENT_COLORS[event.type];
  const countdown = getCountdown(event.start_date, isAr);
  const loc = isAr ? { locale: arLocale } : undefined;
  return (
    <div className="max-w-[300px] space-y-2">
      {event.cover_image_url && (
        <img src={event.cover_image_url} alt="" className="w-full h-24 object-cover rounded-xl" loading="lazy" />
      )}
      <div className="flex items-center gap-1.5 flex-wrap">
        <Badge variant="outline" className={cn("text-[9px] px-1.5 py-0 border", colors.bg, colors.text, colors.border)}>
          {isAr ? label?.ar : label?.en}
        </Badge>
        {!countdown.past && (
          <Badge variant={countdown.urgent ? "destructive" : "outline"} className="text-[9px] px-1.5 py-0 gap-0.5">
            <Timer className="h-2 w-2" />{countdown.text}
          </Badge>
        )}
        {event.source !== "global_event" && (
          <Badge variant="secondary" className="text-[8px] px-1 py-0 capitalize">{event.source.replace("_", " ")}</Badge>
        )}
      </div>
      <p className="text-xs font-bold leading-snug">{isAr && event.title_ar ? event.title_ar : event.title}</p>
      <div className="flex flex-col gap-0.5 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <Calendar className="h-2.5 w-2.5" />
          {format(parseISO(event.start_date), isAr ? "d MMM yyyy" : "MMM d, yyyy", loc)}
          {event.end_date && ` – ${format(parseISO(event.end_date), isAr ? "d MMM" : "MMM d", loc)}`}
        </span>
        {event.city && <span className="flex items-center gap-1"><MapPin className="h-2.5 w-2.5" />{localizeCity(event.city, isAr)}{event.country_code ? `, ${localizeCountry(event.country_code, isAr)}` : ""}</span>}
        {event.venue && <span className="flex items-center gap-1"><Landmark className="h-2.5 w-2.5" />{isAr && event.venue_ar ? event.venue_ar : event.venue}</span>}
        {event.organizer_name && <span className="flex items-center gap-1"><Building2 className="h-2.5 w-2.5" />{isAr && event.organizer_name_ar ? event.organizer_name_ar : event.organizer_name}</span>}
        {event.channel_name && <span className="flex items-center gap-1"><Tv className="h-2.5 w-2.5" />{event.channel_name}</span>}
      </div>
      {event.link && <p className="text-[9px] text-primary font-medium">{isAr ? "اضغط للتفاصيل ←" : "Click for details →"}</p>}
    </div>
  );
}

export function EventChip({ event, isAr, compact = false }: { event: GlobalEvent; isAr: boolean; compact?: boolean }) {
  const colors = GLOBAL_EVENT_COLORS[event.type];
  const label = GLOBAL_EVENT_LABELS[event.type];
  const IconComp = ICONS[label?.icon] || MoreHorizontal;
  const countdown = getCountdown(event.start_date, isAr);

  const chip = (
    <div className={cn(
      "flex items-center gap-1 rounded-md px-1.5 py-0.5 transition-all cursor-default border",
      colors.bg, colors.text, colors.border,
      "hover:shadow-sm hover:brightness-95",
      compact ? "text-[9px]" : "text-[10px]",
      countdown.urgent && !countdown.past && "ring-1 ring-destructive/30"
    )}>
      <IconComp className={cn(compact ? "h-2.5 w-2.5 shrink-0" : "h-3 w-3 shrink-0")} />
      <span className="truncate font-medium leading-tight">{isAr && event.title_ar ? event.title_ar : event.title}</span>
    </div>
  );

  const inner = event.link ? <Link to={event.link} className="block truncate">{chip}</Link> : chip;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{inner}</TooltipTrigger>
      <TooltipContent side="top" className="p-3 shadow-xl">
        <EventTooltipContent event={event} isAr={isAr} />
      </TooltipContent>
    </Tooltip>
  );
}
