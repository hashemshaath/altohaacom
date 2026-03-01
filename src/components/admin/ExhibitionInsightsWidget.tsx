import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Landmark, Ticket, MapPin, Calendar, Users, TrendingUp } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { format, subDays, isFuture } from "date-fns";

export function ExhibitionInsightsWidget() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data, isLoading } = useQuery({
    queryKey: ["admin-exhibition-insights"],
    queryFn: async () => {
      const [exhibitionsRes, ticketsRes, boothsRes, followersRes, recentTicketsRes] = await Promise.all([
        supabase.from("exhibitions").select("id, title, title_ar, status, start_date, end_date, venue, city"),
        supabase.from("exhibition_tickets").select("id", { count: "exact", head: true }),
        supabase.from("exhibition_booths").select("id, status, exhibition_id"),
        supabase.from("exhibition_followers").select("id", { count: "exact", head: true }),
        supabase.from("exhibition_tickets").select("created_at").gte("created_at", subDays(new Date(), 14).toISOString()),
      ]);

      const exhibitions = exhibitionsRes.data || [];
      const upcoming = exhibitions.filter((e: any) => e.start_date && isFuture(new Date(e.start_date)));
      const booths = boothsRes.data || [];
      const occupiedBooths = booths.filter((b: any) => b.status === "reserved" || b.status === "occupied").length;

      // Ticket trend (14 days)
      const ticketTrend: Record<string, number> = {};
      for (let i = 13; i >= 0; i--) {
        ticketTrend[format(subDays(new Date(), i), "MM/dd")] = 0;
      }
      (recentTicketsRes.data || []).forEach((t: any) => {
        const key = format(new Date(t.created_at), "MM/dd");
        if (ticketTrend[key] !== undefined) ticketTrend[key]++;
      });
      const ticketTrendData = Object.entries(ticketTrend).map(([date, count]) => ({ date, count }));

      // Status breakdown
      const statusMap: Record<string, number> = {};
      exhibitions.forEach((e: any) => { statusMap[e.status || "draft"] = (statusMap[e.status || "draft"] || 0) + 1; });

      return {
        totalExhibitions: exhibitions.length,
        upcomingCount: upcoming.length,
        totalTickets: ticketsRes.count || 0,
        totalBooths: booths.length,
        occupiedBooths,
        totalFollowers: followersRes.count || 0,
        ticketTrendData,
        statusMap,
        upcoming: upcoming.slice(0, 3).map((e: any) => ({
          title: isAr ? (e.title_ar || e.title) : e.title,
          date: e.start_date,
          city: e.city,
        })),
      };
    },
    staleTime: 1000 * 60 * 5,
  });

  if (isLoading) {
    return <Card><CardContent className="p-6"><Skeleton className="h-48 w-full" /></CardContent></Card>;
  }

  if (!data) return null;

  const boothOccupancy = data.totalBooths > 0 ? Math.round((data.occupiedBooths / data.totalBooths) * 100) : 0;

  const kpis = [
    { icon: Landmark, label: isAr ? "المعارض" : "Exhibitions", value: data.totalExhibitions, color: "text-chart-3" },
    { icon: Calendar, label: isAr ? "القادمة" : "Upcoming", value: data.upcomingCount, color: "text-primary" },
    { icon: Ticket, label: isAr ? "التذاكر" : "Tickets", value: data.totalTickets, color: "text-chart-2" },
    { icon: MapPin, label: isAr ? "الأجنحة" : "Booths", value: `${data.occupiedBooths}/${data.totalBooths}`, color: "text-chart-4" },
    { icon: Users, label: isAr ? "المتابعون" : "Followers", value: data.totalFollowers, color: "text-chart-5" },
  ];

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Landmark className="h-4 w-4 text-chart-3" />
          {isAr ? "تحليلات المعارض والفعاليات" : "Exhibition & Events Insights"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* KPI Row */}
        <div className="grid grid-cols-5 gap-2">
          {kpis.map((kpi, i) => (
            <div key={i} className="text-center p-2 rounded-xl bg-muted/40">
              <kpi.icon className={`h-4 w-4 mx-auto mb-1 ${kpi.color}`} />
              <p className="text-lg font-bold">{kpi.value}</p>
              <p className="text-[9px] text-muted-foreground">{kpi.label}</p>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {/* Ticket Sales Trend */}
          <div>
            <p className="text-xs font-medium mb-2 text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              {isAr ? "التذاكر (14 يوم)" : "Tickets (14 days)"}
            </p>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={data.ticketTrendData}>
                <defs>
                  <linearGradient id="ticketGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-3))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--chart-3))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                <XAxis dataKey="date" tick={{ fontSize: 8 }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 8 }} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                <Area type="monotone" dataKey="count" stroke="hsl(var(--chart-3))" fill="url(#ticketGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Upcoming + Booth Occupancy */}
          <div className="space-y-3">
            {/* Booth occupancy bar */}
            <div>
              <p className="text-xs font-medium mb-1 text-muted-foreground">{isAr ? "إشغال الأجنحة" : "Booth Occupancy"}</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-3 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-chart-4 transition-all"
                    style={{ width: `${boothOccupancy}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-chart-4">{boothOccupancy}%</span>
              </div>
            </div>

            {/* Status badges */}
            <div>
              <p className="text-xs font-medium mb-1 text-muted-foreground">{isAr ? "الحالات" : "Status"}</p>
              <div className="flex flex-wrap gap-1">
                {Object.entries(data.statusMap).map(([status, count]) => (
                  <Badge key={status} variant="outline" className="text-[9px]">
                    {status}: {count as number}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Upcoming events */}
            {data.upcoming.length > 0 && (
              <div>
                <p className="text-xs font-medium mb-1 text-muted-foreground">{isAr ? "الفعاليات القادمة" : "Upcoming"}</p>
                <div className="space-y-1.5">
                  {data.upcoming.map((e: any, i: number) => (
                    <div key={i} className="flex items-center gap-2 text-xs p-1.5 rounded bg-muted/30">
                      <Calendar className="h-3 w-3 text-primary shrink-0" />
                      <span className="truncate flex-1 font-medium">{e.title}</span>
                      <span className="text-muted-foreground text-[9px]">{e.date ? format(new Date(e.date), "MMM d") : ""}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
