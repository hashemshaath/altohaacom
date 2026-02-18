import { useMemo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useChefScheduleEvents, EVENT_TYPE_CONFIG, type ChefScheduleEvent, type ScheduleEventType } from "@/hooks/useChefSchedule";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, Tv, Plus, Trophy, ChefHat, Landmark, Mic, GraduationCap, MessageSquare, User, Plane, Ban, MoreHorizontal } from "lucide-react";
import { format, parseISO } from "date-fns";
import { Link } from "react-router-dom";

const ICONS: Record<string, any> = {
  competition: Trophy, chefs_table: ChefHat, exhibition: Landmark,
  tv_interview: Tv, conference: Mic, training: GraduationCap,
  consultation: MessageSquare, visit: MapPin, personal: User,
  travel: Plane, unavailable: Ban, other: MoreHorizontal,
};

export function ChefScheduleWidget() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { user } = useAuth();

  const dateRange = useMemo(() => {
    const now = new Date();
    const threeMonths = new Date(now);
    threeMonths.setMonth(now.getMonth() + 3);
    return { start: now.toISOString(), end: threeMonths.toISOString() };
  }, []);

  const { data: events = [] } = useChefScheduleEvents(user?.id, dateRange);

  const upcoming = events
    .filter(e => e.status !== "cancelled")
    .slice(0, 5);

  if (upcoming.length === 0) return null;

  return (
    <Card className="border-border/40">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            {isAr ? "جدولي القادم" : "My Schedule"}
            <Badge variant="outline" className="text-[10px]">{upcoming.length}</Badge>
          </CardTitle>
          <Link to="/profile?tab=schedule">
            <Button variant="ghost" size="sm" className="h-7 text-xs">{isAr ? "عرض الكل" : "View All"}</Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border/20">
          {upcoming.map(ev => {
            const config = EVENT_TYPE_CONFIG[ev.event_type as ScheduleEventType] || EVENT_TYPE_CONFIG.other;
            const Icon = ICONS[ev.event_type] || MoreHorizontal;
            return (
              <div key={ev.id} className="px-4 py-2.5 flex items-center gap-3 hover:bg-muted/20 transition-colors">
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${config.color}`}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate">{ev.title}</p>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{format(parseISO(ev.start_date), "MMM d")}</span>
                    {ev.city && <span className="flex items-center gap-0.5"><MapPin className="h-2.5 w-2.5" />{ev.city}</span>}
                  </div>
                </div>
                <Badge variant={ev.status === "confirmed" ? "default" : "outline"} className="text-[8px]">{ev.status}</Badge>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
