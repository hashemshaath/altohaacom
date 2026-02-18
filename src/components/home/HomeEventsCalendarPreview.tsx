import { useLanguage } from "@/i18n/LanguageContext";
import { useGlobalEventsCalendar, GLOBAL_EVENT_COLORS, GLOBAL_EVENT_LABELS, type GlobalEvent } from "@/hooks/useGlobalEventsCalendar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Trophy, Landmark, ChefHat, Tv, Mic, GraduationCap, Plane, Users, MoreHorizontal, ArrowRight, Globe, BookOpen, UtensilsCrossed, Palmtree, Ban } from "lucide-react";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

const ICONS: Record<string, any> = {
  Trophy, Landmark, ChefHat, Tv, Mic, GraduationCap, MapPin, Plane, Users,
  MoreHorizontal, BookOpen, UtensilsCrossed, Palmtree, Ban,
};

export function HomeEventsCalendarPreview() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { data: events = [] } = useGlobalEventsCalendar();

  const upcoming = events
    .filter(e => new Date(e.start_date) >= new Date())
    .slice(0, 6);

  if (upcoming.length === 0) return null;

  return (
    <section className="container py-8">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Globe className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold">{isAr ? "تقويم الفعاليات" : "Events Calendar"}</h2>
            <p className="text-xs text-muted-foreground">{isAr ? "الفعاليات القادمة محلياً ودولياً" : "Upcoming local & international events"}</p>
          </div>
        </div>
        <Link to="/events-calendar">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs">
            {isAr ? "عرض التقويم" : "View Calendar"}
            <ArrowRight className="h-3 w-3" />
          </Button>
        </Link>
      </div>
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {upcoming.map(ev => {
          const colors = GLOBAL_EVENT_COLORS[ev.type];
          const label = GLOBAL_EVENT_LABELS[ev.type];
          const IconComp = ICONS[label?.icon] || MoreHorizontal;
          return (
            <Card key={ev.id} className={cn("border overflow-hidden hover:shadow-md transition-shadow", colors.border)}>
              <CardContent className="p-3">
                <div className="flex items-start gap-3">
                  <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border", colors.bg, colors.border)}>
                    <IconComp className={cn("h-4 w-4", colors.text)} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <Badge variant="outline" className={cn("text-[9px] px-1.5 py-0 mb-1 border", colors.bg, colors.text, colors.border)}>
                      {isAr ? label?.ar : label?.en}
                    </Badge>
                    {ev.link ? (
                      <Link to={ev.link} className="text-sm font-semibold hover:text-primary transition-colors line-clamp-1 block">{ev.title}</Link>
                    ) : (
                      <p className="text-sm font-semibold line-clamp-1">{ev.title}</p>
                    )}
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-1">
                      <span className="flex items-center gap-0.5">
                        <Calendar className="h-2.5 w-2.5" />
                        {format(parseISO(ev.start_date), "MMM d, yyyy")}
                      </span>
                      {ev.city && (
                        <span className="flex items-center gap-0.5">
                          <MapPin className="h-2.5 w-2.5" />{ev.city}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className={cn("w-1 h-10 rounded-full shrink-0", colors.dot)} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
