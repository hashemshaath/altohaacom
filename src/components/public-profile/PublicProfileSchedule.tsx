import { memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Trophy, BookOpen, MapPin, Clock, Tv, ChefHat, Landmark } from "lucide-react";
import { toEnglishDigits } from "@/lib/formatNumber";
import { Link } from "react-router-dom";
import { usePublicChefSchedule, EVENT_TYPE_CONFIG, type ScheduleEventType } from "@/hooks/useChefSchedule";

interface Props {
  userId: string;
  isAr: boolean;
}

interface ScheduleItem {
  id: string;
  type: "competition" | "masterclass" | "event";
  title: string;
  date: string;
  location?: string;
  status?: string;
  link?: string;
}

export const PublicProfileSchedule = memo(function PublicProfileSchedule({ userId, isAr }: Props) {
  const { data: chefEvents = [] } = usePublicChefSchedule(userId);

  const { data: schedule = [] } = useQuery({
    queryKey: ["user-schedule", userId, chefEvents.length],
    queryFn: async () => {
      const now = new Date().toISOString();
      const items: ScheduleItem[] = [];

      const { data: compRegs }: any = await supabase
        .from("competition_registrations")
        .select("id, status, competitions(id, title, title_ar, competition_start, venue, venue_ar)")
        .eq("participant_id", userId)
        .in("status", ["approved", "pending"]);

      (compRegs || []).forEach((reg: any) => {
        const comp = reg.competitions;
        if (comp?.competition_start && comp.competition_start >= now) {
          items.push({
            id: reg.id, type: "competition",
            title: isAr ? (comp.title_ar || comp.title) : comp.title,
            date: comp.competition_start,
            location: isAr ? (comp.venue_ar || comp.venue) : comp.venue,
            status: reg.status, link: `/competitions/${comp.id}`,
          });
        }
      });

      const { data: enrollments }: any = await supabase
        .from("masterclass_enrollments")
        .select("id, status, masterclasses(id, title, title_ar, start_date)")
        .eq("user_id", userId)
        .in("status", ["active", "enrolled"]);

      (enrollments || []).forEach((enr: any) => {
        const mc = enr.masterclasses;
        if (mc?.start_date && mc.start_date >= now) {
          items.push({
            id: enr.id, type: "masterclass",
            title: isAr ? (mc.title_ar || mc.title) : mc.title,
            date: mc.start_date,
            status: enr.status, link: `/masterclasses/${mc.id}`,
          });
        }
      });

      // Merge public chef schedule events
      chefEvents.forEach((ev: any) => {
        const config = EVENT_TYPE_CONFIG[(ev.event_type as ScheduleEventType) || "other"];
        items.push({
          id: ev.id,
          type: ev.event_type === "tv_interview" ? "event" : (ev.event_type || "event"),
          title: ev.show_details_publicly ? (isAr && ev.title_ar ? ev.title_ar : ev.title) : (isAr ? config?.ar : config?.en) || "Event",
          date: ev.start_date,
          location: ev.show_details_publicly ? (isAr && ev.venue_ar ? ev.venue_ar : ev.city || ev.venue) : undefined,
        });
      });

      items.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      return items.slice(0, 8);
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });

  if (schedule.length === 0) return null;

  const typeConfig: Record<string, { icon: typeof Trophy; color: string; bg: string }> = {
    competition: { icon: Trophy, color: "text-chart-4", bg: "bg-chart-4/10" },
    masterclass: { icon: BookOpen, color: "text-chart-2", bg: "bg-chart-2/10" },
    event: { icon: Calendar, color: "text-chart-5", bg: "bg-chart-5/10" },
    chefs_table: { icon: ChefHat, color: "text-chart-2", bg: "bg-chart-2/10" },
    exhibition: { icon: Landmark, color: "text-chart-3", bg: "bg-chart-3/10" },
    tv_interview: { icon: Tv, color: "text-chart-4", bg: "bg-chart-4/10" },
  };

  const getDaysUntil = (dateStr: string) => {
    const diff = Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (diff <= 0) return isAr ? "اليوم" : "Today";
    if (diff === 1) return isAr ? "غداً" : "Tomorrow";
    return isAr ? `بعد ${toEnglishDigits(diff)} يوم` : `In ${toEnglishDigits(diff)} days`;
  };

  return (
    <Card className="rounded-2xl border-border/40 overflow-hidden">
      <CardContent className="p-0">
        <div className="px-5 py-3 border-b border-border/30 bg-muted/30">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            {isAr ? "الجدول القادم" : "Upcoming Schedule"}
          </h3>
        </div>
        <div className="divide-y divide-border/20">
          {schedule.map((item) => {
            const config = typeConfig[item.type] || typeConfig.event;
            const Icon = config.icon;
            const d = new Date(item.date);
            const day = toEnglishDigits(d.getDate());
            const month = d.toLocaleDateString(isAr ? "ar-SA" : "en-US", { month: "short" });

            const inner = (
              <>
                <div className="flex flex-col items-center justify-center w-11 shrink-0">
                  <span className="text-[10px] uppercase font-semibold text-muted-foreground leading-none">{month}</span>
                  <span className="text-lg font-bold leading-tight tabular-nums">{day}</span>
                </div>
                <div className={`w-0.5 h-10 rounded-full ${config.bg}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <Icon className={`h-3 w-3 ${config.color} shrink-0`} />
                    <span className="text-xs font-semibold truncate group-hover:text-primary transition-colors">{item.title}</span>
                  </div>
                  {item.location && (
                    <span className="text-[10px] text-muted-foreground flex items-center gap-0.5 mt-0.5 truncate">
                      <MapPin className="h-2.5 w-2.5 shrink-0" />{item.location}
                    </span>
                  )}
                </div>
                <div className="shrink-0">
                  <Badge variant="outline" className="text-[10px] h-5 gap-1">
                    <Clock className="h-2.5 w-2.5" />{getDaysUntil(item.date)}
                  </Badge>
                </div>
              </>
            );

            const cls = "flex items-center gap-3 px-5 py-3 hover:bg-muted/30 transition-colors group";

            return item.link ? (
              <Link key={item.id} to={item.link} className={cls}>{inner}</Link>
            ) : (
              <div key={item.id} className={cls}>{inner}</div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
});
