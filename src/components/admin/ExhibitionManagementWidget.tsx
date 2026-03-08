import { memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useVisibleRefetchInterval } from "@/hooks/useVisibleRefetchInterval";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Landmark, Ticket, Users, MapPin, Calendar, TrendingUp } from "lucide-react";
import { subDays, format, differenceInDays } from "date-fns";

export const ExhibitionManagementWidget = memo(function ExhibitionManagementWidget() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data, isLoading } = useQuery({
    queryKey: ["admin-exhibition-mgmt-widget"],
    queryFn: async () => {
      const now = new Date();

      const [exhibitions, booths, tickets] = await Promise.all([
        supabase.from("exhibitions").select("id, status, start_date, end_date, city, country, view_count, created_at"),
        supabase.from("exhibition_booths").select("id, exhibition_id, status, assigned_to"),
        supabase.from("exhibition_tickets").select("id, exhibition_id, status, checked_in_at, created_at"),
      ]);

      const allExhibitions = exhibitions.data || [];
      const allBooths = booths.data || [];
      const allTickets = tickets.data || [];

      // Status breakdown
      const statusMap: Record<string, number> = {};
      allExhibitions.forEach(e => { statusMap[e.status] = (statusMap[e.status] || 0) + 1; });

      // Active / upcoming
      const active = allExhibitions.filter(e => e.status === "active").length;
      const upcoming = allExhibitions.filter(e => {
        if (!e.start_date) return false;
        return new Date(e.start_date) > now && e.status !== "cancelled";
      }).length;

      // Booth stats
      const totalBooths = allBooths.length;
      const assignedBooths = allBooths.filter(b => b.assigned_to).length;
      const boothOccupancy = totalBooths > 0 ? Math.round((assignedBooths / totalBooths) * 100) : 0;

      // Ticket stats
      const totalTickets = allTickets.length;
      const checkedIn = allTickets.filter(t => t.checked_in_at).length;
      const checkInRate = totalTickets > 0 ? Math.round((checkedIn / totalTickets) * 100) : 0;

      // Top cities
      const cityMap: Record<string, number> = {};
      allExhibitions.forEach(e => { if (e.city) cityMap[e.city] = (cityMap[e.city] || 0) + 1; });
      const topCities = Object.entries(cityMap).sort((a, b) => b[1] - a[1]).slice(0, 5);

      // Ticket volume by day (last 7 days)
      const dailyMap: Record<string, number> = {};
      const sevenDaysAgo = subDays(now, 7);
      for (let i = 6; i >= 0; i--) {
        dailyMap[format(subDays(now, i), "EEE")] = 0;
      }
      allTickets.filter(t => new Date(t.created_at) >= sevenDaysAgo).forEach(t => {
        const d = format(new Date(t.created_at), "EEE");
        if (dailyMap[d] !== undefined) dailyMap[d]++;
      });
      const dailyTickets = Object.entries(dailyMap).map(([day, count]) => ({ day, count }));

      // Total views
      const totalViews = allExhibitions.reduce((s, e) => s + (e.view_count || 0), 0);

      return {
        total: allExhibitions.length,
        active,
        upcoming,
        totalBooths,
        assignedBooths,
        boothOccupancy,
        totalTickets,
        checkedIn,
        checkInRate,
        totalViews,
        statusMap,
        topCities,
        dailyTickets,
      };
    },
    refetchInterval: useVisibleRefetchInterval(60000),
  });

  if (isLoading) return <Skeleton className="h-52 w-full rounded-xl" />;
  if (!data) return null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {[
          { icon: Landmark, label: isAr ? "إجمالي" : "Total", value: data.total, color: "text-primary", bg: "bg-primary/10" },
          { icon: TrendingUp, label: isAr ? "نشطة" : "Active", value: data.active, color: "text-chart-5", bg: "bg-chart-5/10" },
          { icon: Calendar, label: isAr ? "قادمة" : "Upcoming", value: data.upcoming, color: "text-chart-3", bg: "bg-chart-3/10" },
          { icon: Ticket, label: isAr ? "تذاكر" : "Tickets", value: data.totalTickets, color: "text-chart-4", bg: "bg-chart-4/10" },
          { icon: Users, label: isAr ? "تسجيل دخول" : "Check-in", value: `${data.checkInRate}%`, color: data.checkInRate >= 50 ? "text-chart-5" : "text-chart-4", bg: data.checkInRate >= 50 ? "bg-chart-5/10" : "bg-chart-4/10" },
          { icon: MapPin, label: isAr ? "أجنحة" : "Booths", value: `${data.assignedBooths}/${data.totalBooths}`, color: "text-primary", bg: "bg-primary/10" },
        ].map(kpi => (
          <Card key={kpi.label}>
            <CardContent className="p-3 flex items-center gap-2">
              <div className={`rounded-full p-1.5 ${kpi.bg}`}><kpi.icon className={`h-3.5 w-3.5 ${kpi.color}`} /></div>
              <div className="min-w-0">
                <p className="text-[9px] text-muted-foreground truncate">{kpi.label}</p>
                <p className="text-base font-bold">{kpi.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{isAr ? "حجم التذاكر اليومي" : "Daily Ticket Volume"}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={data.dailyTickets}>
                <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} width={28} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name={isAr ? "تذاكر" : "Tickets"} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardContent className="p-3">
              <p className="text-[10px] font-semibold text-muted-foreground mb-2">{isAr ? "إشغال الأجنحة" : "Booth Occupancy"}</p>
              <Progress value={data.boothOccupancy} className="h-2 mb-1" />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>{isAr ? "مُعيّن" : "Assigned"}: {data.assignedBooths}</span>
                <span>{data.boothOccupancy}%</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3">
              <p className="text-[10px] font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {isAr ? "أعلى المدن" : "Top Cities"}
              </p>
              <div className="space-y-1">
                {data.topCities.map(([city, count]) => (
                  <div key={city} className="flex items-center justify-between text-[10px]">
                    <span>{city}</span>
                    <Badge variant="outline" className="text-[9px] h-4">{count}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
