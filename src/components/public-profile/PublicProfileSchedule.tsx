import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Trophy, BookOpen, MapPin, Clock } from "lucide-react";
import { toEnglishDigits } from "@/lib/formatNumber";
import { Link } from "react-router-dom";

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

export function PublicProfileSchedule({ userId, isAr }: Props) {
  const { data: schedule = [] } = useQuery({
    queryKey: ["user-schedule", userId],
    queryFn: async () => {
      const now = new Date().toISOString();
      const items: ScheduleItem[] = [];

      const { data: compRegs }: any = await supabase
        .from("competition_registrations" as any)
        .select("id, status, competitions(id, title, title_ar, start_date, location, location_ar)")
        .eq("user_id", userId)
        .in("status", ["approved", "pending"]);

      (compRegs || []).forEach((reg: any) => {
        const comp = reg.competitions;
        if (comp?.start_date && comp.start_date >= now) {
          items.push({
            id: reg.id, type: "competition",
            title: isAr ? (comp.title_ar || comp.title) : comp.title,
            date: comp.start_date,
            location: isAr ? (comp.location_ar || comp.location) : comp.location,
            status: reg.status, link: `/competitions/${comp.id}`,
          });
        }
      });

      const { data: enrollments }: any = await supabase
        .from("masterclass_enrollments" as any)
        .select("id, status, masterclasses(id, title, title_ar, start_date, location)")
        .eq("user_id", userId)
        .in("status", ["active", "enrolled"]);

      (enrollments || []).forEach((enr: any) => {
        const mc = enr.masterclasses;
        if (mc?.start_date && mc.start_date >= now) {
          items.push({
            id: enr.id, type: "masterclass",
            title: isAr ? (mc.title_ar || mc.title) : mc.title,
            date: mc.start_date, location: mc.location,
            status: enr.status, link: `/masterclasses/${mc.id}`,
          });
        }
      });

      items.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      return items.slice(0, 6);
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });

  if (schedule.length === 0) return null;

  const typeConfig: Record<string, { icon: typeof Trophy; color: string; bg: string }> = {
    competition: { icon: Trophy, color: "text-chart-4", bg: "bg-chart-4/10" },
    masterclass: { icon: BookOpen, color: "text-chart-2", bg: "bg-chart-2/10" },
    event: { icon: Calendar, color: "text-chart-5", bg: "bg-chart-5/10" },
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
              <Link key={item.id} to={item.link} className={cls} dir={isAr ? "rtl" : "ltr"}>{inner}</Link>
            ) : (
              <div key={item.id} className={cls} dir={isAr ? "rtl" : "ltr"}>{inner}</div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
