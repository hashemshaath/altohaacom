import { memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity } from "lucide-react";
import { format, subDays, startOfDay, parseISO } from "date-fns";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const WEEKS = 12;
const DAYS = WEEKS * 7;

function getIntensity(count: number): string {
  if (count === 0) return "bg-muted/40";
  if (count <= 1) return "bg-primary/20";
  if (count <= 3) return "bg-primary/40";
  if (count <= 5) return "bg-primary/60";
  return "bg-primary/90";
}

export const ActivityHeatmapWidget = memo(function ActivityHeatmapWidget() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const isAr = language === "ar";

  const { data } = useQuery({
    queryKey: ["activity-heatmap", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const since = subDays(new Date(), DAYS).toISOString();

      // Aggregate multiple activity sources
      const postsRes: any = await supabase.from("posts" as any).select("created_at").eq("author_id", user.id).gte("created_at", since);
      const recipesRes: any = await supabase.from("recipes" as any).select("created_at").eq("author_id", user.id).gte("created_at", since);
      const commentsRes: any = await supabase.from("post_comments" as any).select("created_at").eq("user_id", user.id).gte("created_at", since);

      const allDates: string[] = [
        ...(postsRes.data || []).map((d: any) => d.created_at),
        ...(recipesRes.data || []).map((d: any) => d.created_at),
        ...(commentsRes.data || []).map((d: any) => d.created_at),
      ];

      // Build day map
      const dayMap: Record<string, number> = {};
      for (let i = DAYS - 1; i >= 0; i--) {
        dayMap[format(subDays(new Date(), i), "yyyy-MM-dd")] = 0;
      }
      allDates.forEach(d => {
        const key = format(startOfDay(parseISO(d)), "yyyy-MM-dd");
        if (key in dayMap) dayMap[key]++;
      });

      const totalActivities = allDates.length;
      const activeDays = Object.values(dayMap).filter(v => v > 0).length;
      const maxPerDay = Math.max(...Object.values(dayMap), 0);

      return { dayMap, totalActivities, activeDays, maxPerDay };
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  if (!data) return null;

  const days = Object.entries(data.dayMap);
  // Group into weeks (columns)
  const weeks: [string, number][][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7) as [string, number][]);
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          {isAr ? "خريطة النشاط" : "Activity Heatmap"}
          <span className="ms-auto text-[10px] font-normal text-muted-foreground">
            {isAr ? `${data.activeDays} يوم نشط` : `${data.activeDays} active days`}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg font-bold">{data.totalActivities}</span>
          <span className="text-xs text-muted-foreground">
            {isAr ? `نشاط في آخر ${WEEKS} أسبوع` : `activities in last ${WEEKS} weeks`}
          </span>
        </div>
        <TooltipProvider delayDuration={100}>
          <div className="flex gap-[3px] overflow-x-auto" style={{ scrollbarWidth: "none" }}>
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-[3px]">
                {week.map(([date, count]) => (
                  <Tooltip key={date}>
                    <TooltipTrigger asChild>
                      <div
                        className={`h-3 w-3 rounded-[2px] transition-colors duration-200 cursor-default ${getIntensity(count)}`}
                      />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-[10px] px-2 py-1">
                      <p className="font-bold">{count} {isAr ? "نشاط" : "activities"}</p>
                      <p className="text-muted-foreground">{format(parseISO(date), "MMM d, yyyy")}</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            ))}
          </div>
        </TooltipProvider>
        {/* Legend */}
        <div className="flex items-center gap-1.5 mt-3 text-[9px] text-muted-foreground">
          <span>{isAr ? "أقل" : "Less"}</span>
          {["bg-muted/40", "bg-primary/20", "bg-primary/40", "bg-primary/60", "bg-primary/90"].map((c, i) => (
            <div key={i} className={`h-2.5 w-2.5 rounded-[2px] ${c}`} />
          ))}
          <span>{isAr ? "أكثر" : "More"}</span>
        </div>
      </CardContent>
    </Card>
  );
});
