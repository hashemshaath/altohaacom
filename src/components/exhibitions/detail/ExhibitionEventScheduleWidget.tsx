import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarClock, MapPin, Clock, Users } from "lucide-react";
import { format, isToday, isTomorrow, parseISO } from "date-fns";

interface Props {
  exhibitionId: string;
  isAr: boolean;
}

export function ExhibitionEventScheduleWidget({ exhibitionId, isAr }: Props) {
  const t = (en: string, ar: string) => isAr ? ar : en;

  const { data: items = [] } = useQuery({
    queryKey: ["exhibition-schedule-widget", exhibitionId],
    queryFn: async () => {
      const { data } = await supabase
        .from("exhibition_schedule_items")
        .select("id, title, title_ar, start_time, end_time, location, location_ar, category, speaker_name")
        .eq("exhibition_id", exhibitionId)
        .gte("start_time", new Date().toISOString())
        .order("start_time", { ascending: true })
        .limit(6);
      return data || [];
    },
    staleTime: 1000 * 60 * 3,
  });

  if (items.length === 0) return null;

  return (
    <Card className="border-border/40">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <CalendarClock className="h-4 w-4 text-chart-2" />
          {t("Upcoming Sessions", "الجلسات القادمة")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.map((item: any) => {
          const startTime = parseISO(item.start_time);
          const title = isAr && item.title_ar ? item.title_ar : item.title;
          const dayLabel = isToday(startTime) ? t("Today", "اليوم") : isTomorrow(startTime) ? t("Tomorrow", "غداً") : format(startTime, "MMM d");

          return (
            <div key={item.id} className="flex items-start gap-3 p-2.5 rounded-xl bg-muted/20 hover:bg-muted/40 transition-colors group">
              <div className="flex flex-col items-center shrink-0 min-w-[44px]">
                <span className="text-[9px] font-medium text-muted-foreground uppercase">{dayLabel}</span>
                <span className="text-sm font-bold text-primary">{format(startTime, "HH:mm")}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate group-hover:text-primary transition-colors">{title}</p>
                <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground">
                  {item.location && (
                    <span className="flex items-center gap-0.5">
                      <MapPin className="h-2.5 w-2.5" />
                      {item.location}
                    </span>
                  )}
                  {item.speaker_name && (
                    <span className="flex items-center gap-0.5">
                      <Users className="h-2.5 w-2.5" />
                      {item.speaker_name}
                    </span>
                  )}
                </div>
              </div>
              {item.category && (
                <Badge variant="secondary" className="text-[8px] shrink-0 h-4 px-1.5">
                  {item.category}
                </Badge>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

export default ExhibitionEventScheduleWidget;
