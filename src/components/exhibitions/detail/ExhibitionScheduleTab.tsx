import { memo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";

interface ScheduleItem {
  time?: string; title?: string; title_ar?: string;
  description?: string; description_ar?: string;
}

interface ScheduleDay {
  day?: string; day_ar?: string; title?: string; title_ar?: string;
  items?: ScheduleItem[]; events?: ScheduleItem[];
  time?: string; description?: string; description_ar?: string;
}

interface Props {
  schedule: ScheduleDay[];
  isAr: boolean;
}

export const ExhibitionScheduleTab = memo(function ExhibitionScheduleTab({ schedule, isAr }: Props) {
  return (
    <div className="space-y-4">
      {schedule.map((dayOrItem, i) => {
        const dayEvents = dayOrItem.items || dayOrItem.events || [];
        const dayLabel = isAr && dayOrItem.day_ar ? dayOrItem.day_ar : dayOrItem.day;
        const dayTitle = isAr && dayOrItem.title_ar ? dayOrItem.title_ar : dayOrItem.title;
        if (dayEvents.length > 0) {
          return <CollapsibleDay key={i} index={i} dayLabel={dayLabel} dayTitle={dayTitle} events={dayEvents} isAr={isAr} defaultOpen={i === 0} />;
        }
        return (
          <div key={i} className="flex gap-4 rounded-xl border bg-card p-4 shadow-sm">
            <div className="shrink-0 font-mono text-sm font-semibold text-primary">{dayOrItem.time || dayLabel}</div>
            <div>
              <p className="font-medium">{isAr && dayOrItem.title_ar ? dayOrItem.title_ar : dayOrItem.title}</p>
              {(dayOrItem.description || dayOrItem.description_ar) && <p className="text-sm text-muted-foreground">{isAr && dayOrItem.description_ar ? dayOrItem.description_ar : dayOrItem.description}</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
});

function CollapsibleDay({ index, dayLabel, dayTitle, events, isAr, defaultOpen }: {
  index: number; dayLabel?: string; dayTitle?: string; events: ScheduleItem[]; isAr: boolean; defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card className="overflow-hidden shadow-sm">
        <CollapsibleTrigger asChild>
          <button className="w-full text-start active:scale-[0.99] transition-transform">
            <div className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-accent/5" />
              <div className="relative flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 font-bold text-primary text-sm">{index + 1}</div>
                  <div>
                    <p className="text-xs text-muted-foreground">{dayLabel}</p>
                    {dayTitle && <p className="font-semibold">{dayTitle}</p>}
                    <p className="text-xs text-muted-foreground">{events.length} {isAr ? "فعالية" : "events"}</p>
                  </div>
                </div>
                <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
              </div>
            </div>
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="border-t px-5 py-4 space-y-4">
            <div className="relative border-s-2 border-border ps-6 space-y-5">
              {events.map((event, j) => (
                <div key={j} className="relative">
                  <div className="absolute -start-[29px] top-0.5 h-3.5 w-3.5 rounded-full border-2 border-primary bg-background" />
                  {event.time && <p className="font-mono text-xs font-semibold text-primary">{event.time}</p>}
                  <p className="font-medium text-sm">{isAr && event.title_ar ? event.title_ar : event.title}</p>
                  {(event.description || event.description_ar) && <p className="mt-0.5 text-xs text-muted-foreground">{isAr && event.description_ar ? event.description_ar : event.description}</p>}
                </div>
              ))}
            </div>
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
