import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, X } from "lucide-react";
import { format, isSameDay } from "date-fns";
import { ar as arLocale } from "date-fns/locale";
import type { GlobalEvent } from "@/hooks/useGlobalEventsCalendar";
import { DayEventCard } from "./DayView";

export function SelectedDayPanel({ day, events, onClose, isAr }: {
  day: Date; events: GlobalEvent[]; onClose: () => void; isAr: boolean;
}) {
  if (events.length === 0) return null;

  return (
    <Card className="border-primary/20 animate-in slide-in-from-top-2 duration-200 shadow-lg shadow-primary/5">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-primary/10">
              <Calendar className="h-4 w-4 text-primary" />
            </div>
            {format(day, isAr ? "EEEE, d MMMM yyyy" : "EEEE, MMMM d, yyyy", isAr ? { locale: arLocale } : undefined)}
          </h3>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] tabular-nums">
              {events.length} {isAr ? "فعاليات" : "events"}
            </Badge>
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={onClose}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        <div className="grid gap-2.5 sm:grid-cols-2">
          {events.map(ev => <DayEventCard key={ev.id} event={ev} isAr={isAr} />)}
        </div>
      </CardContent>
    </Card>
  );
}
