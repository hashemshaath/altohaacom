import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
  LineChart, Line, CartesianGrid, AreaChart, Area, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, FunnelChart, Funnel, LabelList,
} from "recharts";
import { format, subDays, eachDayOfInterval, parseISO } from "date-fns";
import { TrendingUp, Users, Ticket, Star, Clock, Activity, Globe, Eye } from "lucide-react";

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

  const { data: followerTimeline = [] } = useQuery({
    queryKey: ["organizer-followers-timeline", exhibitionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exhibition_followers")
        .select("created_at")
        .eq("exhibition_id", exhibitionId)
        .order("created_at");
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60,
  });

  const { data: cookingSessionStats = [] } = useQuery({
    queryKey: ["organizer-cooking-stats", exhibitionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exhibition_cooking_sessions")
        .select("id, title, status")
        .eq("exhibition_id", exhibitionId);
      if (error) throw error;
      if (!data || data.length === 0) return [];
      const sessionIds = data.map(d => d.id);
      const { data: regs } = await supabase
        .from("exhibition_session_registrations")
        .select("session_id")
        .in("session_id", sessionIds);
      const regCounts = new Map<string, number>();
      (regs || []).forEach((r: any) => regCounts.set(r.session_id, (regCounts.get(r.session_id) || 0) + 1));
      return data.map(d => ({ ...d, registrations: regCounts.get(d.id) || 0 }));
    },
    staleTime: 1000 * 60,
  });

  const { data: volunteerCount = 0 } = useQuery({
    queryKey: ["organizer-volunteer-count", exhibitionId],
    queryFn: async () => {
      const { count } = await supabase
        .from("exhibition_volunteers")
        .select("id", { count: "exact", head: true })
        .eq("exhibition_id", exhibitionId)
        .eq("status", "approved");
      return count || 0;
    },
    staleTime: 1000 * 60,
  });

  // Revenue
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

  // Cumulative
  const cumulativeData = useMemo(() => {
    if (dailyRegistrations.length === 0) return [];
    let cum = 0;
    return dailyRegistrations.map((d: any) => {
      cum += d[t("Bookings", "حجوزات")];
      return { ...d, [t("Total", "الإجمالي")]: cum };
    });
  }, [dailyRegistrations]);

  // Check-in hourly
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

  const topSessions = useMemo(() => {
    return [...scheduleRegs].sort((a, b) => b.registrations - a.registrations).slice(0, 5);
  }, [scheduleRegs]);

  // Engagement funnel
  const funnelData = useMemo(() => {
    const followers = followerTimeline.length;
    const tickets = ticketsOverTime.length;
    const checkins = ticketsOverTime.filter((t: any) => t.checked_in_at).length;
    const reviewed = reviewsData.length;
    return [
      { name: t("Followers", "المتابعين"), value: followers, fill: CHART_COLORS[0] },
      { name: t("Tickets", "التذاكر"), value: tickets, fill: CHART_COLORS[1] },
      { name: t("Check-ins", "الحضور"), value: checkins, fill: CHART_COLORS[2] },
      { name: t("Reviews", "التقييمات"), value: reviewed, fill: CHART_COLORS[3] },
    ].filter(d => d.value > 0);
  }, [followerTimeline, ticketsOverTime, reviewsData]);

  // Follower growth
  const followerGrowth = useMemo(() => {
    if (followerTimeline.length === 0) return [];
    const days = eachDayOfInterval({ start: subDays(new Date(), 29), end: new Date() });
    const counts = new Map<string, number>();
    days.forEach(d => counts.set(format(d, "yyyy-MM-dd"), 0));
    followerTimeline.forEach((f: any) => {
      const day = format(parseISO(f.created_at), "yyyy-MM-dd");
      if (counts.has(day)) counts.set(day, counts.get(day)! + 1);
    });
    let cum = 0;
    return Array.from(counts.entries()).map(([date, val]) => {
      cum += val;
      return { date: format(parseISO(date), "MMM d"), [t("Followers", "المتابعين")]: cum };
    });
  }, [followerTimeline, isAr]);

  // Engagement radar
  const engagementRadar = useMemo(() => {
    const maxVal = Math.max(followerTimeline.length, ticketsOverTime.length, reviewsData.length, boothStats.length, scheduleRegs.length, cookingSessionStats.length, 1);
    const normalize = (v: number) => Math.round((v / maxVal) * 100);
    return [
      { metric: t("Followers", "متابعين"), value: normalize(followerTimeline.length) },
      { metric: t("Tickets", "تذاكر"), value: normalize(ticketsOverTime.length) },
      { metric: t("Reviews", "تقييمات"), value: normalize(reviewsData.length) },
      { metric: t("Booths", "أجنحة"), value: normalize(boothStats.length) },
      { metric: t("Sessions", "جلسات"), value: normalize(scheduleRegs.length) },
      { metric: t("Cooking", "طهي"), value: normalize(cookingSessionStats.length) },
    ];
  }, [followerTimeline, ticketsOverTime, reviewsData, boothStats, scheduleRegs, cookingSessionStats]);

  if (ticketsOverTime.length === 0 && reviewsData.length === 0 && boothStats.length === 0 && followerTimeline.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 text-center">
          <Activity className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">{t("No analytics data yet", "لا توجد بيانات تحليلية بعد")}</p>
        </CardContent>
      </Card>
    );
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
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-muted/60 shrink-0">
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

      {/* Engagement Funnel + Radar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {funnelData.length > 1 && (
          <Card className="border-border/40">
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm flex items-center gap-2">
                <Eye className="h-3.5 w-3.5 text-primary" />
                {t("Engagement Funnel", "قمع التفاعل")}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2 pe-4">
              <div className="space-y-2">
                {funnelData.map((d, i) => {
                  const maxVal = funnelData[0].value || 1;
                  const pct = Math.round((d.value / maxVal) * 100);
                  return (
                    <div key={d.name} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{d.name}</span>
                        <span className="font-semibold">{d.value} <span className="text-muted-foreground font-normal">({pct}%)</span></span>
                      </div>
                      <div className="h-6 rounded-md bg-muted/40 overflow-hidden">
                        <div className="h-full rounded-md transition-all duration-700" style={{ width: `${pct}%`, background: d.fill }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {engagementRadar.some(d => d.value > 0) && (
          <Card className="border-border/40">
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm flex items-center gap-2">
                <Activity className="h-3.5 w-3.5 text-chart-2" />
                {t("Engagement Radar", "رادار التفاعل")}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2 flex items-center justify-center">
              <ResponsiveContainer width="100%" height={200}>
                <RadarChart data={engagementRadar}>
                  <PolarGrid stroke="hsl(var(--border) / 0.3)" />
                  <PolarAngleAxis dataKey="metric" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
                  <PolarRadiusAxis tick={{ fontSize: 8 }} domain={[0, 100]} />
                  <Radar dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
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

      {/* Follower Growth */}
      {followerGrowth.length > 0 && (
        <Card className="border-border/40">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm flex items-center gap-2">
              <Globe className="h-3.5 w-3.5 text-chart-3" />
              {t("Follower Growth (30 days)", "نمو المتابعين (30 يوم)")}
              <Badge variant="secondary" className="text-[10px]">{followerTimeline.length} {t("total", "إجمالي")}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2 pe-4">
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={followerGrowth}>
                <defs>
                  <linearGradient id="colorFollowers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-3))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--chart-3))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.3)" />
                <XAxis dataKey="date" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
                <Area type="monotone" dataKey={t("Followers", "المتابعين")} stroke="hsl(var(--chart-3))" fill="url(#colorFollowers)" strokeWidth={2} />
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

      {/* Cooking Sessions Summary */}
      {cookingSessionStats.length > 0 && (
        <Card className="border-border/40">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm">{t("Cooking Sessions", "جلسات الطهي")}</CardTitle>
          </CardHeader>
          <CardContent className="p-2 pe-4">
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={cookingSessionStats} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                <YAxis type="category" dataKey="title" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" width={120} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
                <Bar dataKey="registrations" fill="hsl(var(--chart-5))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

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

      {/* Summary badges */}
      <div className="flex flex-wrap gap-2">
        {boothStatusData.map((s) => (
          <Badge key={s.name} variant="outline" className="text-xs gap-1.5 px-3 py-1.5">
            <span className={`h-2 w-2 rounded-full ${s.name === 'available' ? 'bg-chart-3' : s.name === 'reserved' ? 'bg-chart-4' : s.name === 'occupied' ? 'bg-primary' : 'bg-muted-foreground'}`} />
            <span className="capitalize">{s.name}</span>
            <span className="font-bold">{s.value}</span>
          </Badge>
        ))}
        {volunteerCount > 0 && (
          <Badge variant="outline" className="text-xs gap-1.5 px-3 py-1.5">
            <span className="h-2 w-2 rounded-full bg-chart-5" />
            {t("Volunteers", "متطوعين")}
            <span className="font-bold">{volunteerCount}</span>
          </Badge>
        )}
      </div>
    </div>
  );
}
