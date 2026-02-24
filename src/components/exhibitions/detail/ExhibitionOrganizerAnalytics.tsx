import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid, AreaChart, Area } from "recharts";
import { format, subDays, eachDayOfInterval, parseISO, eachHourOfInterval, startOfDay, endOfDay } from "date-fns";
import { TrendingUp, Users, Ticket, Star, Clock } from "lucide-react";

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

  const { data: ticketsOverTime = [] } = useQuery({
    queryKey: ["organizer-tickets-timeline", exhibitionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exhibition_tickets")
        .select("created_at, checked_in_at, price_paid, currency, ticket_type_id")
        .eq("exhibition_id", exhibitionId)
        .order("created_at");
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60,
  });

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

  const { data: scheduleRegs = [] } = useQuery({
    queryKey: ["organizer-schedule-regs", exhibitionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exhibition_schedule_items")
        .select("id, title, category, max_attendees")
        .eq("exhibition_id", exhibitionId);
      if (error) throw error;
      if (!data || data.length === 0) return [];
      const itemIds = data.map(d => d.id);
      const { data: regs } = await supabase
        .from("exhibition_schedule_registrations")
        .select("schedule_item_id")
        .in("schedule_item_id", itemIds);
      const regCounts = new Map<string, number>();
      (regs || []).forEach((r: any) => regCounts.set(r.schedule_item_id, (regCounts.get(r.schedule_item_id) || 0) + 1));
      return data.map(d => ({ ...d, registrations: regCounts.get(d.id) || 0 }));
    },
    staleTime: 1000 * 60,
  });

  // Revenue summary
  const revenue = useMemo(() => {
    let total = 0;
    ticketsOverTime.forEach((t: any) => { total += (t.price_paid || 0); });
    return total;
  }, [ticketsOverTime]);

  // Daily registrations
  const dailyRegistrations = useMemo(() => {
    if (ticketsOverTime.length === 0) return [];
    const days = eachDayOfInterval({ start: subDays(new Date(), 29), end: new Date() });
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
      [t("Bookings", "حجوزات")]: val.bookings,
      [t("Check-ins", "حضور")]: val.checkins,
    }));
  }, [ticketsOverTime, isAr]);

  // Cumulative ticket sales
  const cumulativeData = useMemo(() => {
    if (dailyRegistrations.length === 0) return [];
    let cum = 0;
    return dailyRegistrations.map((d: any) => {
      cum += d[t("Bookings", "حجوزات")];
      return { ...d, [t("Total", "الإجمالي")]: cum };
    });
  }, [dailyRegistrations]);

  // Check-in hourly heatmap (today)
  const hourlyCheckins = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => ({ hour: `${String(i).padStart(2, "0")}:00`, count: 0 }));
    ticketsOverTime.forEach((t: any) => {
      if (t.checked_in_at) {
        const h = new Date(t.checked_in_at).getHours();
        hours[h].count++;
      }
    });
    return hours.filter(h => h.count > 0 || (parseInt(h.hour) >= 8 && parseInt(h.hour) <= 22));
  }, [ticketsOverTime]);

  const ratingDistribution = useMemo(() => {
    return [1, 2, 3, 4, 5].map(r => ({
      rating: `${r}⭐`,
      count: reviewsData.filter((rev: any) => rev.rating === r).length,
    }));
  }, [reviewsData]);

  const boothCategories = useMemo(() => {
    const catMap = new Map<string, number>();
    boothStats.forEach((b: any) => catMap.set(b.category || "general", (catMap.get(b.category || "general") || 0) + 1));
    return Array.from(catMap.entries()).map(([name, value]) => ({ name, value }));
  }, [boothStats]);

  const boothStatusData = useMemo(() => {
    const statusMap = new Map<string, number>();
    boothStats.forEach((b: any) => statusMap.set(b.status || "available", (statusMap.get(b.status || "available") || 0) + 1));
    return Array.from(statusMap.entries()).map(([name, value]) => ({ name, value }));
  }, [boothStats]);

  // Top sessions by registration
  const topSessions = useMemo(() => {
    return [...scheduleRegs].sort((a, b) => b.registrations - a.registrations).slice(0, 5);
  }, [scheduleRegs]);

  if (ticketsOverTime.length === 0 && reviewsData.length === 0 && boothStats.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* KPI Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { label: t("Total Tickets", "إجمالي التذاكر"), value: ticketsOverTime.length, icon: Ticket, color: "text-primary" },
          { label: t("Checked In", "تم الحضور"), value: ticketsOverTime.filter((t: any) => t.checked_in_at).length, icon: Users, color: "text-chart-3" },
          { label: t("Revenue", "الإيرادات"), value: revenue > 0 ? `${revenue.toLocaleString()} SAR` : "—", icon: TrendingUp, color: "text-chart-2" },
          { label: t("Avg Rating", "متوسط التقييم"), value: reviewsData.length > 0 ? (reviewsData.reduce((s: number, r: any) => s + r.rating, 0) / reviewsData.length).toFixed(1) : "—", icon: Star, color: "text-chart-4" },
        ].map(kpi => (
          <Card key={kpi.label} className="border-border/40">
            <CardContent className="p-3 flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/60 shrink-0">
                <kpi.icon className={`h-3.5 w-3.5 ${kpi.color}`} />
              </div>
              <div>
                <p className={`text-sm font-bold ${kpi.color}`}>{kpi.value}</p>
                <p className="text-[9px] text-muted-foreground">{kpi.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Cumulative ticket area chart */}
      {cumulativeData.length > 0 && (
        <Card className="border-border/40">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm">{t("Cumulative Ticket Sales (30 days)", "مبيعات التذاكر التراكمية (30 يوم)")}</CardTitle>
          </CardHeader>
          <CardContent className="p-2 pe-4">
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={cumulativeData}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.3)" />
                <XAxis dataKey="date" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
                <Area type="monotone" dataKey={t("Total", "الإجمالي")} stroke="hsl(var(--primary))" fill="url(#colorTotal)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Daily Registrations Line Chart */}
      {dailyRegistrations.length > 0 && (
        <Card className="border-border/40">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm">{t("Daily Bookings vs Check-ins", "الحجوزات مقابل الحضور يومياً")}</CardTitle>
          </CardHeader>
          <CardContent className="p-2 pe-4">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={dailyRegistrations}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.3)" />
                <XAxis dataKey="date" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
                <Line type="monotone" dataKey={t("Bookings", "حجوزات")} stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey={t("Check-ins", "حضور")} stroke="hsl(var(--chart-3))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Check-in by hour */}
      {hourlyCheckins.length > 0 && (
        <Card className="border-border/40">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-chart-1" />
              {t("Check-ins by Hour", "الحضور حسب الساعة")}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2 pe-4">
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={hourlyCheckins}>
                <XAxis dataKey="hour" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
                <Bar dataKey="count" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
              </BarChart>
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

      {/* Top Sessions */}
      {topSessions.length > 0 && (
        <Card className="border-border/40">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm">{t("Top Sessions by Registrations", "أكثر الجلسات تسجيلاً")}</CardTitle>
          </CardHeader>
          <CardContent className="p-2 pe-4">
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={topSessions} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                <YAxis type="category" dataKey="title" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" width={120} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
                <Bar dataKey="registrations" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Booth Status Summary */}
      {boothStatusData.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {boothStatusData.map((s) => (
            <Badge key={s.name} variant="outline" className="text-xs gap-1.5 px-3 py-1.5">
              <span className={`h-2 w-2 rounded-full ${s.name === 'available' ? 'bg-chart-3' : s.name === 'reserved' ? 'bg-chart-4' : s.name === 'occupied' ? 'bg-primary' : 'bg-muted-foreground'}`} />
              <span className="capitalize">{s.name}</span>
              <span className="font-bold">{s.value}</span>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
