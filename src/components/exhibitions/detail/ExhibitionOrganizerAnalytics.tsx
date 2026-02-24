import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid } from "recharts";
import { format, subDays, eachDayOfInterval, parseISO } from "date-fns";

interface Props {
  exhibitionId: string;
  isAr: boolean;
}

const CHART_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export function ExhibitionOrganizerAnalytics({ exhibitionId, isAr }: Props) {
  const t = (en: string, ar: string) => isAr ? ar : en;

  // Tickets over time
  const { data: ticketsOverTime = [] } = useQuery({
    queryKey: ["organizer-tickets-timeline", exhibitionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exhibition_tickets")
        .select("created_at, checked_in_at")
        .eq("exhibition_id", exhibitionId)
        .order("created_at");
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60,
  });

  // Reviews distribution
  const { data: reviewsData = [] } = useQuery({
    queryKey: ["organizer-reviews-dist", exhibitionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exhibition_reviews")
        .select("rating, created_at")
        .eq("exhibition_id", exhibitionId);
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60,
  });

  // Booth stats
  const { data: boothStats = [] } = useQuery({
    queryKey: ["organizer-booth-stats", exhibitionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exhibition_booths")
        .select("category, status, size")
        .eq("exhibition_id", exhibitionId);
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60,
  });

  // Daily registration chart data
  const dailyRegistrations = useMemo(() => {
    if (ticketsOverTime.length === 0) return [];
    const days = eachDayOfInterval({
      start: subDays(new Date(), 29),
      end: new Date(),
    });
    const counts = new Map<string, { bookings: number; checkins: number }>();
    days.forEach(d => counts.set(format(d, "yyyy-MM-dd"), { bookings: 0, checkins: 0 }));

    ticketsOverTime.forEach((t: any) => {
      const day = format(parseISO(t.created_at), "yyyy-MM-dd");
      if (counts.has(day)) counts.get(day)!.bookings++;
      if (t.checked_in_at) {
        const cin = format(parseISO(t.checked_in_at), "yyyy-MM-dd");
        if (counts.has(cin)) counts.get(cin)!.checkins++;
      }
    });

    return Array.from(counts.entries()).map(([date, val]) => ({
      date: format(parseISO(date), "MMM d"),
      [isAr ? "حجوزات" : "Bookings"]: val.bookings,
      [isAr ? "حضور" : "Check-ins"]: val.checkins,
    }));
  }, [ticketsOverTime, isAr]);

  // Rating distribution
  const ratingDistribution = useMemo(() => {
    const dist = [1, 2, 3, 4, 5].map(r => ({
      rating: `${r}⭐`,
      count: reviewsData.filter((rev: any) => rev.rating === r).length,
    }));
    return dist;
  }, [reviewsData]);

  // Booth category breakdown
  const boothCategories = useMemo(() => {
    const catMap = new Map<string, number>();
    boothStats.forEach((b: any) => {
      const cat = b.category || "general";
      catMap.set(cat, (catMap.get(cat) || 0) + 1);
    });
    return Array.from(catMap.entries()).map(([name, value]) => ({ name, value }));
  }, [boothStats]);

  // Booth status breakdown
  const boothStatusData = useMemo(() => {
    const statusMap = new Map<string, number>();
    boothStats.forEach((b: any) => {
      const s = b.status || "available";
      statusMap.set(s, (statusMap.get(s) || 0) + 1);
    });
    return Array.from(statusMap.entries()).map(([name, value]) => ({ name, value }));
  }, [boothStats]);

  if (ticketsOverTime.length === 0 && reviewsData.length === 0 && boothStats.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Daily Registrations Line Chart */}
      {dailyRegistrations.length > 0 && (
        <Card className="border-border/40">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm">{t("Registrations & Check-ins (30 days)", "الحجوزات والحضور (30 يوم)")}</CardTitle>
          </CardHeader>
          <CardContent className="p-2 pe-4">
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={dailyRegistrations}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.3)" />
                <XAxis dataKey="date" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
                <Line type="monotone" dataKey={isAr ? "حجوزات" : "Bookings"} stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey={isAr ? "حضور" : "Check-ins"} stroke="hsl(var(--chart-3))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Rating Distribution */}
        {reviewsData.length > 0 && (
          <Card className="border-border/40">
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm">{t("Rating Distribution", "توزيع التقييمات")}</CardTitle>
            </CardHeader>
            <CardContent className="p-2 pe-4">
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={ratingDistribution}>
                  <XAxis dataKey="rating" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
                  <Bar dataKey="count" fill="hsl(var(--chart-4))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Booth Categories Pie */}
        {boothCategories.length > 0 && (
          <Card className="border-border/40">
            <CardHeader className="py-3 px-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">{t("Booth Categories", "فئات الأجنحة")}</CardTitle>
                <Badge variant="secondary" className="text-[10px]">{boothStats.length} {t("total", "إجمالي")}</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-2 flex items-center justify-center">
              <div className="flex items-center gap-4">
                <ResponsiveContainer width={140} height={140}>
                  <PieChart>
                    <Pie data={boothCategories} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={35} outerRadius={60} paddingAngle={2}>
                      {boothCategories.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1.5">
                  {boothCategories.map((cat, i) => (
                    <div key={cat.name} className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-sm shrink-0" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                      <span className="text-[10px] text-muted-foreground capitalize">{cat.name}</span>
                      <span className="text-[10px] font-semibold">{cat.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Booth Status Summary */}
      {boothStatusData.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {boothStatusData.map((s) => (
            <Badge key={s.name} variant="outline" className="text-xs gap-1.5 px-3 py-1.5">
              <span className={`h-2 w-2 rounded-full ${s.name === 'available' ? 'bg-chart-3' : s.name === 'reserved' ? 'bg-chart-4' : 'bg-muted-foreground'}`} />
              <span className="capitalize">{s.name}</span>
              <span className="font-bold">{s.value}</span>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
