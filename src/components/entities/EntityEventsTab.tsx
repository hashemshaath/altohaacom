import { useEntityEvents } from "@/hooks/useEntities";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, MapPin, Monitor, Users } from "lucide-react";
import { format } from "date-fns";

const eventTypeLabels: Record<string, { en: string; ar: string }> = {
  competition: { en: "Competition", ar: "مسابقة" },
  workshop: { en: "Workshop", ar: "ورشة عمل" },
  seminar: { en: "Seminar", ar: "ندوة" },
  conference: { en: "Conference", ar: "مؤتمر" },
  exhibition: { en: "Exhibition", ar: "معرض" },
  graduation: { en: "Graduation", ar: "حفل تخريج" },
  open_day: { en: "Open Day", ar: "يوم مفتوح" },
  general: { en: "Event", ar: "فعالية" },
};

const statusColors: Record<string, string> = {
  upcoming: "bg-primary/20 text-primary",
  ongoing: "bg-chart-3/20 text-chart-3",
  completed: "bg-muted text-muted-foreground",
  cancelled: "bg-destructive/20 text-destructive",
  draft: "bg-chart-4/20 text-chart-4",
};

interface Props {
  entityId: string;
}

export function EntityEventsTab({ entityId }: Props) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { data: events, isLoading } = useEntityEvents(entityId);

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        {[1, 2].map(i => <Skeleton key={i} className="h-40 w-full rounded-xl" />)}
      </div>
    );
  }

  if (!events?.length) {
    return (
      <div className="py-12 text-center">
        <Calendar className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground">{isAr ? "لا توجد فعاليات بعد" : "No events yet"}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {events.map(event => {
        const title = isAr && event.title_ar ? event.title_ar : event.title;
        const desc = isAr && event.description_ar ? event.description_ar : event.description;
        const loc = isAr && event.location_ar ? event.location_ar : event.location;
        const typeLabel = eventTypeLabels[event.event_type] || eventTypeLabels.general;

        return (
          <Card key={event.id} className="overflow-hidden transition-all hover:shadow-md">
            {event.image_url && (
              <img src={event.image_url} alt={title} className="h-32 w-full object-cover" loading="lazy" />
            )}
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-base">{title}</CardTitle>
                <Badge className={`shrink-0 text-xs ${statusColors[event.status] || ""}`}>{event.status}</Badge>
              </div>
              <Badge variant="secondary" className="w-fit">{isAr ? typeLabel.ar : typeLabel.en}</Badge>
            </CardHeader>
            <CardContent className="space-y-2">
              {desc && <p className="line-clamp-2 text-sm text-muted-foreground">{desc}</p>}
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                {event.start_date && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(event.start_date), "MMM d, yyyy")}
                  </span>
                )}
                {loc && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {loc}
                  </span>
                )}
                {event.is_virtual && (
                  <span className="flex items-center gap-1">
                    <Monitor className="h-3 w-3" />
                    {isAr ? "افتراضي" : "Virtual"}
                  </span>
                )}
                {event.max_attendees && (
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {isAr ? "الحد الأقصى" : "Max"} {event.max_attendees}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
