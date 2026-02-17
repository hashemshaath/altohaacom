import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Flame, Clock, Calendar } from "lucide-react";
import { useState } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type DataSource = "profiles" | "messages" | "competition_registrations" | "posts";

export function ActivityHeatmap() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [source, setSource] = useState<DataSource>("profiles");

  const sourceConfig: Record<DataSource, { label: string; labelAr: string; dateField: string }> = {
    profiles: { label: "Signups", labelAr: "التسجيلات", dateField: "created_at" },
    messages: { label: "Messages", labelAr: "الرسائل", dateField: "created_at" },
    competition_registrations: { label: "Registrations", labelAr: "تسجيلات المسابقات", dateField: "created_at" },
    posts: { label: "Posts", labelAr: "المنشورات", dateField: "created_at" },
  };

  const days = isAr
    ? ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"]
    : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const hours = Array.from({ length: 24 }, (_, i) => i);

  const { data: heatmapData, isLoading } = useQuery({
    queryKey: ["activity-heatmap", source],
    queryFn: async () => {
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
      const { data: records } = await supabase
        .from(source as any)
        .select(sourceConfig[source].dateField)
        .gte(sourceConfig[source].dateField, ninetyDaysAgo)
        .limit(1000);

      // Build 7×24 grid
      const grid: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
      let maxVal = 0;

      (records || []).forEach((r: any) => {
        const d = new Date(r[sourceConfig[source].dateField]);
        const day = d.getDay();
        const hour = d.getHours();
        grid[day][hour]++;
        if (grid[day][hour] > maxVal) maxVal = grid[day][hour];
      });

      // Find peak
      let peakDay = 0, peakHour = 0;
      for (let d = 0; d < 7; d++) {
        for (let h = 0; h < 24; h++) {
          if (grid[d][h] > grid[peakDay][peakHour]) {
            peakDay = d;
            peakHour = h;
          }
        }
      }

      return { grid, maxVal, peakDay, peakHour, total: (records || []).length };
    },
    staleTime: 1000 * 60 * 5,
  });

  const getColor = (value: number, max: number) => {
    if (max === 0 || value === 0) return "bg-muted/30";
    const ratio = value / max;
    if (ratio > 0.75) return "bg-primary";
    if (ratio > 0.5) return "bg-primary/70";
    if (ratio > 0.25) return "bg-primary/40";
    return "bg-primary/15";
  };

  const config = sourceConfig[source];

  return (
    <div className="space-y-6 mt-4">
      {/* Controls */}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-4 py-4">
          <div className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">{isAr ? "خريطة النشاط الحرارية" : "Activity Heatmap"}</span>
          </div>
          <Select value={source} onValueChange={(v) => setSource(v as DataSource)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(sourceConfig).map(([key, val]) => (
                <SelectItem key={key} value={key}>
                  {isAr ? val.labelAr : val.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Badge variant="outline" className="gap-1">
            <Clock className="h-3 w-3" />
            {isAr ? "آخر 90 يوم" : "Last 90 days"}
          </Badge>
        </CardContent>
      </Card>

      {/* Peak Stats */}
      {!isLoading && heatmapData && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-muted-foreground">{isAr ? "إجمالي الأحداث" : "Total Events"}</p>
              <p className="text-2xl font-bold mt-1">{heatmapData.total.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">{isAr ? "أنشط يوم" : "Peak Day"}</p>
              </div>
              <p className="text-2xl font-bold mt-1">{days[heatmapData.peakDay]}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">{isAr ? "أنشط ساعة" : "Peak Hour"}</p>
              </div>
              <p className="text-2xl font-bold mt-1">
                {heatmapData.peakHour.toString().padStart(2, "0")}:00
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Heatmap Grid */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Flame className="h-4 w-4 text-primary" />
            {isAr ? config.labelAr : config.label} — {isAr ? "حسب اليوم والساعة" : "by Day & Hour"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-[280px] w-full" />
          ) : !heatmapData || heatmapData.total === 0 ? (
            <p className="py-16 text-center text-muted-foreground">
              {isAr ? "لا توجد بيانات كافية" : "Not enough data"}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-[600px]">
                {/* Hour labels */}
                <div className="flex items-center mb-1">
                  <div className="w-12 shrink-0" />
                  {hours.map((h) => (
                    <div key={h} className="flex-1 text-center text-[9px] text-muted-foreground">
                      {h % 3 === 0 ? `${h.toString().padStart(2, "0")}` : ""}
                    </div>
                  ))}
                </div>

                {/* Grid rows */}
                {days.map((day, dayIdx) => (
                  <div key={dayIdx} className="flex items-center gap-0.5 mb-0.5">
                    <div className="w-12 shrink-0 text-[11px] text-muted-foreground text-end pe-2">
                      {day}
                    </div>
                    {hours.map((hour) => {
                      const val = heatmapData.grid[dayIdx][hour];
                      return (
                        <Tooltip key={hour}>
                          <TooltipTrigger asChild>
                            <div
                              className={`flex-1 aspect-square rounded-sm cursor-default transition-colors ${getColor(val, heatmapData.maxVal)}`}
                            />
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-xs">
                            <p className="font-medium">{day} {hour.toString().padStart(2, "0")}:00</p>
                            <p>{val} {isAr ? "حدث" : "events"}</p>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                ))}

                {/* Legend */}
                <div className="flex items-center justify-end gap-1 mt-3">
                  <span className="text-[10px] text-muted-foreground me-1">{isAr ? "أقل" : "Less"}</span>
                  {["bg-muted/30", "bg-primary/15", "bg-primary/40", "bg-primary/70", "bg-primary"].map((c, i) => (
                    <div key={i} className={`h-3 w-3 rounded-sm ${c}`} />
                  ))}
                  <span className="text-[10px] text-muted-foreground ms-1">{isAr ? "أكثر" : "More"}</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
