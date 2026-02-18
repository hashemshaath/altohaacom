import { useLanguage } from "@/i18n/LanguageContext";
import {
  usePublicChefSchedule,
  EVENT_TYPE_CONFIG, PARTICIPATION_TYPES,
  type ChefScheduleEvent, type ScheduleEventType,
} from "@/hooks/useChefSchedule";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calendar as CalendarIcon, Trophy, ChefHat, Landmark, Tv, Mic,
  GraduationCap, MapPin, Clock, Plane, Ban, MoreHorizontal,
  Briefcase,
} from "lucide-react";
import { format, parseISO } from "date-fns";

const EVENT_ICONS: Record<string, any> = {
  competition: Trophy, chefs_table: ChefHat, exhibition: Landmark,
  tv_interview: Tv, conference: Mic, training: GraduationCap,
  visit: MapPin, travel: Plane, unavailable: Ban, other: MoreHorizontal,
};

interface Props {
  chefId: string;
}

export function ChefPublicSchedule({ chefId }: Props) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { data: events = [], isLoading } = usePublicChefSchedule(chefId);

  if (isLoading) return null;
  if (events.length === 0) return null;

  // Group by month
  const byMonth: Record<string, Partial<ChefScheduleEvent>[]> = {};
  events.forEach(ev => {
    if (!ev.start_date) return;
    const key = format(parseISO(ev.start_date), "yyyy-MM");
    if (!byMonth[key]) byMonth[key] = [];
    byMonth[key].push(ev);
  });

  return (
    <Card className="border-border/40">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <CalendarIcon className="h-4 w-4" />
          {isAr ? "الجدول القادم" : "Upcoming Schedule"}
          <Badge variant="outline" className="text-[10px]">{events.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {Object.entries(byMonth).map(([monthKey, monthEvents]) => {
          const monthLabel = parseISO(monthKey + "-01").toLocaleString(isAr ? "ar" : "en", { month: "long", year: "numeric" });
          return (
            <div key={monthKey}>
              <div className="px-4 py-2 bg-muted/30 border-y border-border/20">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{monthLabel}</p>
              </div>
              <div className="divide-y divide-border/20">
                {monthEvents.map(ev => {
                  const config = EVENT_TYPE_CONFIG[(ev.event_type as ScheduleEventType) || "other"] || EVENT_TYPE_CONFIG.other;
                  const Icon = EVENT_ICONS[ev.event_type || "other"] || MoreHorizontal;
                  const showDetails = ev.show_details_publicly;

                  return (
                    <div key={ev.id} className="px-4 py-3 flex items-start gap-3">
                      <div className="text-center shrink-0 w-10">
                        <p className="text-lg font-black tabular-nums leading-none">
                          {ev.start_date ? format(parseISO(ev.start_date), "d") : "—"}
                        </p>
                        <p className="text-[9px] text-muted-foreground font-bold uppercase">
                          {ev.start_date ? format(parseISO(ev.start_date), "EEE") : ""}
                        </p>
                      </div>
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${config.color}`}>
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-sm">
                            {showDetails ? ev.title : (isAr ? config.ar : config.en)}
                          </h4>
                          <Badge className={`text-[8px] border ${config.color}`}>{isAr ? config.ar : config.en}</Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground flex-wrap">
                          {ev.start_date && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {ev.all_day ? (isAr ? "يوم كامل" : "All Day") : format(parseISO(ev.start_date), "HH:mm")}
                            </span>
                          )}
                          {showDetails && ev.city && (
                            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{ev.city}</span>
                          )}
                          {showDetails && ev.channel_name && (
                            <span className="flex items-center gap-1"><Tv className="h-3 w-3" />{isAr && ev.channel_name_ar ? ev.channel_name_ar : ev.channel_name}</span>
                          )}
                          {ev.participation_type && (
                            <Badge variant="outline" className="text-[8px]">
                              {isAr ? (PARTICIPATION_TYPES.find(p => p.value === ev.participation_type)?.ar || ev.participation_type) : ev.participation_type}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
