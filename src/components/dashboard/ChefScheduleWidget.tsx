import { useMemo, useEffect, useState, memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useChefScheduleEvents, EVENT_TYPE_CONFIG, type ScheduleEventType } from "@/hooks/useChefSchedule";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, Tv, Trophy, ChefHat, Landmark, Mic, GraduationCap, MessageSquare, User, Plane, Ban, MoreHorizontal, Zap } from "lucide-react";
import { format, parseISO, isToday, isTomorrow, differenceInHours } from "date-fns";
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
  const [realtimeFlag, setRealtimeFlag] = useState(0);

  const dateRange = useMemo(() => {
    const now = new Date();
    const threeMonths = new Date(now);
    threeMonths.setMonth(now.getMonth() + 3);
    return { start: now.toISOString(), end: threeMonths.toISOString() };
  }, []);

  const { data: events = [], refetch } = useChefScheduleEvents(user?.id, dateRange);

  // Realtime sync for schedule changes
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("chef-schedule-widget")
      .on("postgres_changes", { event: "*", schema: "public", table: "chef_schedule_events", filter: `chef_id=eq.${user.id}` }, () => {
        setRealtimeFlag((p) => p + 1);
        refetch();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id, refetch]);

  const upcoming = events.filter((e) => e.status !== "cancelled").slice(0, 5);

  if (upcoming.length === 0) return null;

  const getTimeLabel = (dateStr: string) => {
    const d = parseISO(dateStr);
    if (isToday(d)) return { text: isAr ? "اليوم" : "Today", urgent: true };
    if (isTomorrow(d)) return { text: isAr ? "غداً" : "Tomorrow", urgent: differenceInHours(d, new Date()) < 24 };
    return { text: format(d, "MMM d"), urgent: false };
  };

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
          {upcoming.map((ev) => {
            const config = EVENT_TYPE_CONFIG[ev.event_type as ScheduleEventType] || EVENT_TYPE_CONFIG.other;
            const Icon = ICONS[ev.event_type] || MoreHorizontal;
            const time = getTimeLabel(ev.start_date);
            return (
              <div key={ev.id} className={`px-4 py-2.5 flex items-center gap-3 hover:bg-muted/20 transition-colors ${time.urgent ? "bg-chart-4/5" : ""}`}>
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border ${config.color}`}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate">{ev.title}</p>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    <span className={`flex items-center gap-0.5 ${time.urgent ? "text-chart-4 font-semibold" : ""}`}>
                      {time.urgent && <Zap className="h-2.5 w-2.5" />}
                      <Clock className="h-2.5 w-2.5" />
                      {time.text}
                    </span>
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