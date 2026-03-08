import { memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Landmark, Ticket, Users, MapPin, Calendar, Building } from "lucide-react";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { differenceInDays } from "date-fns";

export const ExhibitionAnalyticsWidget = memo(function ExhibitionAnalyticsWidget() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data, isLoading } = useQuery({
    queryKey: ["admin-exhibition-analytics"],
    queryFn: async () => {
      const [
        { count: totalExh },
        { count: published },
        { count: upcoming },
        { count: totalBooths },
        { count: assignedBooths },
        { count: totalTickets },
        { data: upcomingExh },
      ] = await Promise.all([
        supabase.from("exhibitions").select("*", { count: "exact", head: true }),
        supabase.from("exhibitions").select("*", { count: "exact", head: true }).eq("status", "active" as any),
        supabase.from("exhibitions").select("*", { count: "exact", head: true }).eq("status", "active" as any).gte("start_date", new Date().toISOString()),
        supabase.from("exhibition_booths").select("*", { count: "exact", head: true }),
        supabase.from("exhibition_booths").select("*", { count: "exact", head: true }).eq("status", "occupied"),
        supabase.from("exhibition_tickets").select("*", { count: "exact", head: true }),
        supabase.from("exhibitions").select("id, title, title_ar, start_date, venue, city, status")
          .eq("status", "active" as any)
          .gte("start_date", new Date().toISOString())
          .order("start_date", { ascending: true })
          .limit(4),
      ]);

      const boothOccupancy = totalBooths ? Math.round(((assignedBooths || 0) / totalBooths) * 100) : 0;

      return {
        totalExh: totalExh || 0,
        published: published || 0,
        upcoming: upcoming || 0,
        totalBooths: totalBooths || 0,
        assignedBooths: assignedBooths || 0,
        totalTickets: totalTickets || 0,
        boothOccupancy,
        upcomingExh: upcomingExh || [],
      };
    },
    staleTime: 1000 * 60 * 3,
  });

  if (isLoading) return <Skeleton className="h-64 w-full rounded-xl" />;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Landmark className="h-4 w-4 text-primary" />
          {isAr ? "تحليلات المعارض" : "Exhibition Analytics"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: Landmark, label: isAr ? "إجمالي" : "Total", value: data?.totalExh, color: "text-primary" },
            { icon: Calendar, label: isAr ? "قادمة" : "Upcoming", value: data?.upcoming, color: "text-chart-2" },
            { icon: Ticket, label: isAr ? "التذاكر" : "Tickets", value: data?.totalTickets, color: "text-chart-3" },
          ].map((m, i) => (
            <div key={i} className="text-center p-2 rounded-xl bg-muted/30">
              <m.icon className={`h-3.5 w-3.5 mx-auto mb-1 ${m.color}`} />
              <p className="text-sm font-bold"><AnimatedCounter value={m.value || 0} /></p>
              <p className="text-[9px] text-muted-foreground">{m.label}</p>
            </div>
          ))}
        </div>

        {/* Booth Occupancy */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-muted-foreground flex items-center gap-1">
              <Building className="h-3 w-3" />
              {isAr ? "إشغال الأجنحة" : "Booth Occupancy"}
            </span>
            <span className="font-medium">{data?.assignedBooths}/{data?.totalBooths} ({data?.boothOccupancy}%)</span>
          </div>
          <Progress value={data?.boothOccupancy || 0} className="h-1.5" />
        </div>

        {/* Upcoming Events */}
        {data?.upcomingExh && data.upcomingExh.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">{isAr ? "معارض قادمة" : "Upcoming Events"}</p>
            {data.upcomingExh.map((exh: any) => {
              const daysLeft = differenceInDays(new Date(exh.start_date), new Date());
              return (
                <div key={exh.id} className="flex items-center justify-between text-[11px] p-1.5 rounded bg-muted/20">
                  <div className="truncate flex-1">
                    <span className="font-medium">{isAr && exh.title_ar ? exh.title_ar : exh.title}</span>
                    {exh.city && <span className="text-muted-foreground ms-1">• {exh.city}</span>}
                  </div>
                  <Badge variant={daysLeft <= 7 ? "destructive" : "secondary"} className="text-[9px] px-1.5 py-0 shrink-0 ms-2">
                    {daysLeft}d
                  </Badge>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
});
