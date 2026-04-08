import { useState, lazy, Suspense, memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { useCSVExport } from "@/hooks/useCSVExport";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell,
} from "recharts";
import {
  BarChart3, Landmark, Calendar, TrendingUp, CheckCircle, Clock,
  Eye, Ticket, Users, MapPin, Building, Download, History,
  CheckCircle2, Pencil, Trash2, Plus, Star,
} from "lucide-react";
import { format, subDays, differenceInDays, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

const COLORS = [
  "hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))",
  "hsl(var(--chart-4))", "hsl(var(--chart-5))", "hsl(var(--destructive))",
];

const TabSkeleton = () => (
  <div className="space-y-4">
    <div className="grid grid-cols-4 gap-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
    <Skeleton className="h-64 rounded-xl" />
  </div>
);

// ── KPI Strip ────────────────────────────────────────────
const ExhibitionKPIStrip = memo(function ExhibitionKPIStrip() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data, isLoading } = useQuery({
    queryKey: ["exhibition-stats-kpi"],
    queryFn: async () => {
      const { data: exhibitions } = await supabase.from("exhibitions").select("id, status, start_date, view_count");
      const exhs = exhibitions || [];
      const now = new Date();
      const [tickets, booths, followers] = await Promise.all([
        supabase.from("exhibition_tickets").select("id", { count: "exact", head: true }),
        supabase.from("exhibition_booths").select("id", { count: "exact", head: true }),
        supabase.from("exhibition_followers").select("id", { count: "exact", head: true }),
      ]);
      return {
        total: exhs.length,
        active: exhs.filter(e => e.status === "active").length,
        upcoming: exhs.filter(e => e.status === "upcoming" || (e.status === "active" && e.start_date && new Date(e.start_date) > now)).length,
        completed: exhs.filter(e => e.status === "completed").length,
        totalViews: exhs.reduce((s, e) => s + (e.view_count || 0), 0),
        totalTickets: tickets.count || 0,
      };
    },
    staleTime: 1000 * 60 * 2,
  });

  const items = [
    { icon: Landmark, label: isAr ? "الإجمالي" : "Total", value: data?.total, color: "text-primary", bg: "bg-primary/10", accent: "bg-primary" },
    { icon: TrendingUp, label: isAr ? "نشطة" : "Active", value: data?.active, color: "text-chart-2", bg: "bg-chart-2/10", accent: "bg-chart-2" },
    { icon: Calendar, label: isAr ? "قادمة" : "Upcoming", value: data?.upcoming, color: "text-chart-3", bg: "bg-chart-3/10", accent: "bg-chart-3" },
    { icon: CheckCircle, label: isAr ? "مكتملة" : "Completed", value: data?.completed, color: "text-chart-5", bg: "bg-chart-5/10", accent: "bg-chart-5" },
    { icon: Ticket, label: isAr ? "التذاكر" : "Tickets", value: data?.totalTickets, color: "text-chart-4", bg: "bg-chart-4/10", accent: "bg-chart-4" },
    { icon: Eye, label: isAr ? "المشاهدات" : "Views", value: data?.totalViews, color: "text-destructive", bg: "bg-destructive/10", accent: "bg-destructive" },
  ];

  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
      {items.map((item) => (
        <Card key={item.label} className="group relative overflow-hidden border-border/40 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 hover:border-border/60 rounded-2xl">
          <div className={cn("absolute inset-x-0 top-0 h-1 rounded-t-2xl transition-all duration-300 group-hover:h-1.5", item.accent)} />
          <CardContent className="p-3.5 pt-4 flex items-center gap-3">
            <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110", item.bg)}>
              <item.icon className={cn("h-4.5 w-4.5", item.color)} />
            </div>
            <div className="min-w-0">
              {isLoading ? <Skeleton className="h-6 w-10 rounded-xl" /> : (
                <AnimatedCounter value={item.value || 0} className="text-lg font-black leading-none tracking-tight" />
              )}
              <p className="text-[12px] text-muted-foreground truncate mt-0.5">{item.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
});

// ── Overview Tab ─────────────────────────────────────────
const OverviewTab = memo(function OverviewTab() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data, isLoading } = useQuery({
    queryKey: ["exhibition-stats-overview"],
    queryFn: async () => {
      const now = new Date();
      const [exhRes, ticketsRes, boothsRes, followersRes, sponsorsRes] = await Promise.all([
        supabase.from("exhibitions").select("id, title, title_ar, status, start_date, end_date, venue, city, country, view_count, created_at"),
        supabase.from("exhibition_tickets").select("id, exhibition_id, created_at, status, checked_in_at"),
        supabase.from("exhibition_booths").select("id, exhibition_id, status, assigned_to"),
        supabase.from("exhibition_followers").select("id, exhibition_id"),
        supabase.from("exhibition_sponsors").select("id, exhibition_id, tier"),
      ]);
      const exhibitions = exhRes.data || [];
      const tickets = ticketsRes.data || [];
      const booths = boothsRes.data || [];
      const followers = followersRes.data || [];
      const sponsors = sponsorsRes.data || [];

      // Next event
      const upcoming = exhibitions.filter(e => e.start_date && new Date(e.start_date) > now && e.status !== "cancelled")
        .sort((a, b) => new Date(a.start_date!).getTime() - new Date(b.start_date!).getTime());
      const nextEvent = upcoming[0];
      const daysToNext = nextEvent?.start_date ? differenceInDays(new Date(nextEvent.start_date), now) : null;

      // Booth utilization
      const totalBooths = booths.length;
      const occupiedBooths = booths.filter(b => b.status === "occupied" || b.assigned_to).length;
      const boothUtilization = totalBooths > 0 ? Math.round((occupiedBooths / totalBooths) * 100) : 0;

      // Check-in rate
      const confirmedTickets = tickets.filter(t => t.status === "confirmed").length;
      const checkedIn = tickets.filter(t => t.checked_in_at).length;
      const checkInRate = confirmedTickets > 0 ? Math.round((checkedIn / confirmedTickets) * 100) : 0;

      // Ticket trend 14 days
      const trend: Record<string, number> = {};
      for (let i = 13; i >= 0; i--) trend[format(subDays(now, i), "MM/dd")] = 0;
      tickets.forEach(t => { const d = format(new Date(t.created_at), "MM/dd"); if (d in trend) trend[d]++; });
      const ticketTrend = Object.entries(trend).map(([date, count]) => ({ date, count }));

      // Sponsor tiers
      const tierMap: Record<string, number> = {};
      sponsors.forEach(s => { tierMap[s.tier || "standard"] = (tierMap[s.tier || "standard"] || 0) + 1; });
      const sponsorTiers = Object.entries(tierMap).map(([name, value]) => ({ name, value }));

      // Status distribution
      const statusMap: Record<string, number> = {};
      exhibitions.forEach(e => { statusMap[e.status] = (statusMap[e.status] || 0) + 1; });
      const statusData = Object.entries(statusMap).map(([name, value]) => ({ name, value }));

      return {
        totalTickets: tickets.length, totalFollowers: followers.length, totalSponsors: sponsors.length,
        boothUtilization, occupiedBooths, totalBooths, checkInRate, checkedIn, confirmedTickets,
        ticketTrend, sponsorTiers, statusData,
        nextEvent: nextEvent ? { title: isAr ? (nextEvent.title_ar || nextEvent.title) : nextEvent.title, daysTo: daysToNext } : null,
      };
    },
    staleTime: 1000 * 60 * 2,
  });

  if (isLoading) return <TabSkeleton />;

  return (
    <div className="space-y-4">
      {/* Next Event Banner */}
      {data?.nextEvent && (
        <div className="bg-primary/10 border border-primary/20 rounded-xl p-3 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">{isAr ? "الفعالية القادمة" : "Next Event"}</p>
            <p className="font-semibold text-sm">{data.nextEvent.title}</p>
          </div>
          <Badge variant="outline" className="text-primary border-primary">
            {data.nextEvent.daysTo !== null ? `${data.nextEvent.daysTo} ${isAr ? "يوم" : "days"}` : "—"}
          </Badge>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Ticket Trend */}
        <Card className="lg:col-span-2 border-border/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Ticket className="h-4 w-4 text-primary" />
              {isAr ? "التذاكر - آخر 14 يوم" : "Tickets - Last 14 Days"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data?.ticketTrend}>
                  <defs>
                    <linearGradient id="ticketGradOverview" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                  <Area type="monotone" dataKey="count" stroke="hsl(var(--primary))" fill="url(#ticketGradOverview)" strokeWidth={2} name={isAr ? "تذاكر" : "Tickets"} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Status Pie + Quick Stats */}
        <div className="space-y-4">
          <Card className="border-border/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{isAr ? "توزيع الحالات" : "Status Distribution"}</CardTitle>
            </CardHeader>
            <CardContent>
              {data?.statusData && data.statusData.length > 0 ? (
                <>
                  <div className="h-[130px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={data.statusData} cx="50%" cy="50%" innerRadius={30} outerRadius={55} paddingAngle={3} dataKey="value">
                          {data.statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {data.statusData.map((d, i) => (
                      <span key={d.name} className="text-[11px] flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        {d.name} ({d.value})
                      </span>
                    ))}
                  </div>
                </>
              ) : <p className="text-xs text-muted-foreground text-center py-4">{isAr ? "لا توجد بيانات" : "No data"}</p>}
            </CardContent>
          </Card>

          {/* Rates */}
          <Card className="border-border/40">
            <CardContent className="p-4 space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground flex items-center gap-1"><Building className="h-3 w-3" />{isAr ? "إشغال الأجنحة" : "Booth Occupancy"}</span>
                  <span className="font-medium">{data?.occupiedBooths}/{data?.totalBooths} ({data?.boothUtilization}%)</span>
                </div>
                <Progress value={data?.boothUtilization || 0} className="h-1.5" />
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground flex items-center gap-1"><CheckCircle2 className="h-3 w-3" />{isAr ? "معدل الحضور" : "Check-in Rate"}</span>
                  <span className="font-medium">{data?.checkedIn}/{data?.confirmedTickets} ({data?.checkInRate}%)</span>
                </div>
                <Progress value={data?.checkInRate || 0} className="h-1.5" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom: Sponsors + Engagement */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border-border/40">
          <CardHeader className="pb-2"><CardTitle className="text-sm">{isAr ? "مستويات الرعاة" : "Sponsor Tiers"}</CardTitle></CardHeader>
          <CardContent>
            {data?.sponsorTiers && data.sponsorTiers.length > 0 ? (
              <div className="h-[150px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.sponsorTiers} layout="vertical">
                    <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={60} />
                    <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {data.sponsorTiers.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : <p className="text-xs text-muted-foreground text-center py-4">{isAr ? "لا يوجد رعاة" : "No sponsors"}</p>}
          </CardContent>
        </Card>
        {[
          { icon: Users, label: isAr ? "المتابعون" : "Followers", value: data?.totalFollowers || 0, color: "text-chart-3" },
          { icon: TrendingUp, label: isAr ? "الرعاة" : "Sponsors", value: data?.totalSponsors || 0, color: "text-chart-4" },
        ].map(s => (
          <Card key={s.label} className="border-border/40">
            <CardContent className="p-6 flex flex-col items-center justify-center text-center">
              <s.icon className={cn("h-8 w-8 mb-2", s.color)} />
              <AnimatedCounter value={s.value} className="text-3xl font-black" />
              <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
});

// ── Tickets Tab ──────────────────────────────────────────
const TicketsTab = memo(function TicketsTab() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data, isLoading } = useQuery({
    queryKey: ["exhibition-stats-tickets"],
    queryFn: async () => {
      const now = new Date();
      const thirtyDaysAgo = subDays(now, 30);
      const [ticketsRes, exhRes] = await Promise.all([
        supabase.from("exhibition_tickets").select("id, exhibition_id, status, created_at, checked_in_at, ticket_number, attendee_name").order("created_at", { ascending: false }).limit(500),
        supabase.from("exhibitions").select("id, title, title_ar"),
      ]);
      const tickets = ticketsRes.data || [];
      const exhibitions = exhRes.data || [];
      const exhMap = new Map(exhibitions.map(e => [e.id, isAr ? (e.title_ar || e.title) : e.title]));

      const confirmed = tickets.filter(t => t.status === "confirmed").length;
      const checkedIn = tickets.filter(t => t.checked_in_at).length;
      const pending = tickets.filter(t => t.status === "pending").length;
      const checkInRate = confirmed > 0 ? Math.round((checkedIn / confirmed) * 100) : 0;

      // 30-day trend
      const trend: Record<string, number> = {};
      for (let i = 29; i >= 0; i--) trend[format(subDays(now, i), "MMM dd")] = 0;
      tickets.filter(t => new Date(t.created_at) >= thirtyDaysAgo).forEach(t => {
        const d = format(new Date(t.created_at), "MMM dd");
        if (d in trend) trend[d]++;
      });
      const trendData = Object.entries(trend).map(([date, count]) => ({ date, count }));

      // Top exhibitions by tickets
      const byExh: Record<string, number> = {};
      tickets.forEach(t => { byExh[t.exhibition_id] = (byExh[t.exhibition_id] || 0) + 1; });
      const topExhibitions = Object.entries(byExh).sort((a, b) => b[1] - a[1]).slice(0, 6)
        .map(([id, count]) => ({ name: (exhMap.get(id) || id).slice(0, 25), tickets: count }));

      return { total: tickets.length, confirmed, checkedIn, pending, checkInRate, trendData, topExhibitions, recent: tickets.slice(0, 8) };
    },
    staleTime: 1000 * 60 * 2,
  });

  if (isLoading) return <TabSkeleton />;

  return (
    <div className="space-y-4">
      {/* Mini KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: Ticket, label: isAr ? "إجمالي" : "Total", value: data?.total || 0, color: "text-primary", bg: "bg-primary/10" },
          { icon: CheckCircle2, label: isAr ? "حضور" : "Check-ins", value: data?.checkedIn || 0, color: "text-chart-3", bg: "bg-chart-3/10" },
          { icon: Clock, label: isAr ? "معلقة" : "Pending", value: data?.pending || 0, color: "text-chart-4", bg: "bg-chart-4/10" },
          { icon: TrendingUp, label: isAr ? "نسبة الحضور" : "Check-in Rate", value: data?.checkInRate || 0, color: "text-chart-2", bg: "bg-chart-2/10", suffix: "%" },
        ].map(kpi => (
          <Card key={kpi.label} className="border-border/40">
            <CardContent className="p-3 flex items-center gap-3">
              <div className={cn("rounded-xl p-2", kpi.bg)}><kpi.icon className={cn("h-4 w-4", kpi.color)} /></div>
              <div>
                <p className="text-[12px] text-muted-foreground">{kpi.label}</p>
                <p className="text-lg font-bold"><AnimatedCounter value={kpi.value} />{(kpi as any).suffix || ""}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* 30-day Trend */}
        <Card className="lg:col-span-2 border-border/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{isAr ? "اتجاه التذاكر - 30 يوم" : "30-Day Ticket Trend"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data?.trendData}>
                  <defs>
                    <linearGradient id="ticketGrad30" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fontSize: 9 }} interval={4} />
                  <YAxis tick={{ fontSize: 10 }} width={24} allowDecimals={false} />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                  <Area type="monotone" dataKey="count" stroke="hsl(var(--primary))" fill="url(#ticketGrad30)" strokeWidth={2} name={isAr ? "تذاكر" : "Tickets"} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Exhibitions + Recent */}
        <div className="space-y-4">
          <Card className="border-border/40">
            <CardHeader className="pb-2"><CardTitle className="text-sm">{isAr ? "الأعلى تذاكراً" : "Top by Tickets"}</CardTitle></CardHeader>
            <CardContent>
              {data?.topExhibitions && data.topExhibitions.length > 0 ? (
                <div className="h-[140px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.topExhibitions} layout="vertical">
                      <XAxis type="number" tick={{ fontSize: 9 }} allowDecimals={false} />
                      <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 8 }} />
                      <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                      <Bar dataKey="tickets" fill="hsl(var(--chart-3))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : <p className="text-xs text-muted-foreground text-center py-4">{isAr ? "لا توجد بيانات" : "No data"}</p>}
            </CardContent>
          </Card>

          <Card className="border-border/40">
            <CardHeader className="pb-2"><CardTitle className="text-sm">{isAr ? "آخر التذاكر" : "Recent Tickets"}</CardTitle></CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="max-h-[200px]">
                <div className="space-y-1 p-3">
                  {data?.recent?.map(t => (
                    <div key={t.id} className="flex items-center justify-between text-[12px] p-1.5 rounded bg-muted/20">
                      <div className="truncate flex-1">
                        <span className="font-mono font-medium">{t.ticket_number}</span>
                        {t.attendee_name && <span className="text-muted-foreground ms-2">• {t.attendee_name}</span>}
                      </div>
                      <Badge variant={t.status === "confirmed" ? "default" : "secondary"} className="text-[11px] px-1.5 py-0 shrink-0 ms-2">
                        {t.status === "confirmed" ? (isAr ? "مؤكد" : "OK") : (isAr ? "معلق" : "Pending")}
                      </Badge>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
});

// ── Analytics Tab ────────────────────────────────────────
const AnalyticsTab = memo(function AnalyticsTab() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data, isLoading } = useQuery({
    queryKey: ["exhibition-stats-analytics"],
    queryFn: async () => {
      const now = new Date();
      const thirtyDaysAgo = subDays(now, 30);
      const [exhibitions, tickets, reviews, followers] = await Promise.all([
        supabase.from("exhibitions").select("id, title, status, city, country, view_count, is_free, ticket_price"),
        supabase.from("exhibition_tickets").select("id, exhibition_id, status, created_at, checked_in_at"),
        supabase.from("exhibition_reviews").select("id, exhibition_id, rating, created_at"),
        supabase.from("exhibition_followers").select("id, exhibition_id, created_at"),
      ]);
      const allExhibitions = exhibitions.data || [];
      const allTickets = tickets.data || [];
      const allReviews = reviews.data || [];
      const allFollowers = followers.data || [];

      // Follower trend 30d
      const followerTrend: Record<string, number> = {};
      for (let i = 29; i >= 0; i--) followerTrend[format(subDays(now, i), "MMM dd")] = 0;
      allFollowers.filter(f => new Date(f.created_at) >= thirtyDaysAgo).forEach(f => {
        const d = format(new Date(f.created_at), "MMM dd");
        if (d in followerTrend) followerTrend[d]++;
      });
      const followerTrendData = Object.entries(followerTrend).map(([date, count]) => ({ date, count }));

      // Rating distribution
      const ratingDist = [1, 2, 3, 4, 5].map(r => ({ rating: `${r}⭐`, count: allReviews.filter(rv => rv.rating === r).length }));
      const avgRating = allReviews.length > 0 ? (allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length).toFixed(1) : "0";

      // City distribution
      const cityMap: Record<string, number> = {};
      allExhibitions.forEach(e => { if (e.city) cityMap[e.city] = (cityMap[e.city] || 0) + 1; });
      const cityData = Object.entries(cityMap).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([city, count]) => ({ city, count }));

      return {
        totalViews: allExhibitions.reduce((s, e) => s + (e.view_count || 0), 0),
        totalFollowers: allFollowers.length,
        totalReviews: allReviews.length,
        avgRating,
        followerTrendData, ratingDist, cityData,
      };
    },
    staleTime: 1000 * 60 * 2,
  });

  const { exportCSV } = useCSVExport({
    columns: [
      { header: "Metric", accessor: (r: Record<string, unknown>) => String(r.metric || "") },
      { header: "Value", accessor: (r: Record<string, unknown>) => String(r.value || "") },
    ],
    filename: "exhibition_analytics",
  });

  const handleExport = () => {
    if (!data) return;
    exportCSV([
      { metric: "Total Views", value: data.totalViews },
      { metric: "Total Followers", value: data.totalFollowers },
      { metric: "Total Reviews", value: data.totalReviews },
      { metric: "Avg Rating", value: data.avgRating },
    ]);
  };

  if (isLoading) return <TabSkeleton />;

  return (
    <div className="space-y-4">
      {/* Export */}
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="me-1.5 h-3.5 w-3.5" />{isAr ? "تصدير" : "Export"}
        </Button>
      </div>

      {/* Engagement KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: Eye, label: isAr ? "المشاهدات" : "Total Views", value: data?.totalViews || 0, color: "text-primary" },
          { icon: Users, label: isAr ? "المتابعون" : "Followers", value: data?.totalFollowers || 0, color: "text-chart-3" },
          { icon: Star, label: isAr ? "متوسط التقييم" : "Avg Rating", value: data?.avgRating || "0", color: "text-chart-4", isText: true },
          { icon: CheckCircle2, label: isAr ? "التقييمات" : "Reviews", value: data?.totalReviews || 0, color: "text-chart-5" },
        ].map(kpi => (
          <Card key={kpi.label} className="border-border/40">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <kpi.icon className={cn("h-4 w-4", kpi.color)} />
                <span className="text-xs text-muted-foreground">{kpi.label}</span>
              </div>
              <p className="text-2xl font-bold">
                {(kpi as any).isText ? `${kpi.value}⭐` : <AnimatedCounter value={Number(kpi.value)} />}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Follower Trend */}
        <Card className="border-border/40">
          <CardHeader className="pb-2"><CardTitle className="text-sm">{isAr ? "نمو المتابعين - 30 يوم" : "Follower Growth (30d)"}</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data?.followerTrendData}>
                  <XAxis dataKey="date" tick={{ fontSize: 9 }} interval={4} />
                  <YAxis tick={{ fontSize: 10 }} width={24} allowDecimals={false} />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                  <Area type="monotone" dataKey="count" stroke="hsl(var(--chart-3))" fill="hsl(var(--chart-3))" fillOpacity={0.15} name={isAr ? "متابعون" : "Followers"} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Rating Distribution */}
        <Card className="border-border/40">
          <CardHeader className="pb-2"><CardTitle className="text-sm">{isAr ? "توزيع التقييمات" : "Rating Distribution"}</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.ratingDist}>
                  <XAxis dataKey="rating" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} width={24} allowDecimals={false} />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                  <Bar dataKey="count" fill="hsl(var(--chart-4))" radius={[4, 4, 0, 0]} name={isAr ? "تقييمات" : "Reviews"} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* City Distribution */}
      <Card className="border-border/40">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" /> {isAr ? "التوزيع الجغرافي" : "Geographic Distribution"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data?.cityData && data.cityData.length > 0 ? (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {data.cityData.map(c => (
                <div key={c.city} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span>{c.city}</span>
                    <Badge variant="outline" className="text-[11px]">{c.count}</Badge>
                  </div>
                  <Progress value={(c.count / (data.cityData[0]?.count || 1)) * 100} className="h-1.5" />
                </div>
              ))}
            </div>
          ) : <p className="text-xs text-muted-foreground text-center py-4">{isAr ? "لا توجد بيانات" : "No data"}</p>}
        </CardContent>
      </Card>
    </div>
  );
});

// ── Activity Tab ─────────────────────────────────────────
const ActivityTab = memo(function ActivityTab() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data: actions = [] } = useQuery({
    queryKey: ["exhibition-stats-activity"],
    queryFn: async () => {
      const { data } = await supabase.from("admin_actions").select("id, action_type, created_at")
        .or("action_type.ilike.%exhibition%,action_type.eq.approve_exhibition,action_type.eq.reject_exhibition")
        .order("created_at", { ascending: false }).limit(30);
      return data || [];
    },
  });

  const { data: recentTickets = [] } = useQuery({
    queryKey: ["exhibition-stats-recent-tickets"],
    queryFn: async () => {
      const { data } = await supabase.from("exhibition_tickets").select("id, ticket_number, attendee_name, status, created_at")
        .order("created_at", { ascending: false }).limit(15);
      return data || [];
    },
  });

  const getActionIcon = (type: string) => {
    if (type.includes("approve")) return <CheckCircle2 className="h-3.5 w-3.5 text-chart-3" />;
    if (type.includes("reject")) return <Trash2 className="h-3.5 w-3.5 text-destructive" />;
    if (type.includes("create")) return <Plus className="h-3.5 w-3.5 text-primary" />;
    if (type.includes("update") || type.includes("edit")) return <Pencil className="h-3.5 w-3.5 text-chart-4" />;
    return <Eye className="h-3.5 w-3.5 text-muted-foreground" />;
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Recent Tickets */}
      <Card className="border-border/40">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Ticket className="h-4 w-4 text-chart-2" />
            {isAr ? "آخر التذاكر" : "Recent Tickets"}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="max-h-[400px]">
            <div className="space-y-1.5 p-3">
              {recentTickets.map(ticket => (
                <div key={ticket.id} className="flex items-center gap-2 rounded-xl bg-muted/30 px-3 py-2">
                  <Ticket className="h-3 w-3 text-chart-2 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-medium truncate">{ticket.ticket_number}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {ticket.attendee_name || (isAr ? "مجهول" : "Anonymous")} • {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-[11px] shrink-0">{ticket.status}</Badge>
                </div>
              ))}
              {recentTickets.length === 0 && <p className="py-8 text-center text-xs text-muted-foreground">{isAr ? "لا توجد تذاكر" : "No tickets"}</p>}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Admin Actions */}
      <Card className="border-border/40">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <History className="h-4 w-4 text-primary" />
            {isAr ? "سجل الإجراءات" : "Action Log"}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="max-h-[400px]">
            <div className="space-y-1.5 p-3">
              {actions.map(action => (
                <div key={action.id} className="flex items-center gap-2 rounded-xl bg-muted/30 px-3 py-2">
                  {getActionIcon(action.action_type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-medium truncate">{action.action_type.replace(/_/g, " ")}</p>
                    <p className="text-[11px] text-muted-foreground">{formatDistanceToNow(new Date(action.created_at), { addSuffix: true })}</p>
                  </div>
                </div>
              ))}
              {actions.length === 0 && <p className="py-8 text-center text-xs text-muted-foreground">{isAr ? "لا يوجد نشاط" : "No activity"}</p>}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
});

// ── Main Page ────────────────────────────────────────────
export default function ExhibitionStatsAdmin() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="space-y-5">
      <AdminPageHeader
        icon={BarChart3}
        title={isAr ? "إحصائيات الفعاليات" : "Events Statistics"}
        description={isAr ? "نظرة عامة على أداء جميع المعارض والمؤتمرات والفعاليات" : "Overview of all exhibitions, conferences, and events performance"}
      />

      <ExhibitionKPIStrip />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start bg-muted/50 p-1 rounded-xl">
          <TabsTrigger value="overview" className="gap-1.5 text-xs rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Landmark className="h-3.5 w-3.5" />
            {isAr ? "نظرة عامة" : "Overview"}
          </TabsTrigger>
          <TabsTrigger value="tickets" className="gap-1.5 text-xs rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Ticket className="h-3.5 w-3.5" />
            {isAr ? "التذاكر" : "Tickets"}
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-1.5 text-xs rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <TrendingUp className="h-3.5 w-3.5" />
            {isAr ? "التحليلات" : "Analytics"}
          </TabsTrigger>
          <TabsTrigger value="activity" className="gap-1.5 text-xs rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <History className="h-3.5 w-3.5" />
            {isAr ? "النشاط" : "Activity"}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <Suspense fallback={<TabSkeleton />}><OverviewTab /></Suspense>
        </TabsContent>
        <TabsContent value="tickets" className="mt-4">
          <Suspense fallback={<TabSkeleton />}><TicketsTab /></Suspense>
        </TabsContent>
        <TabsContent value="analytics" className="mt-4">
          <Suspense fallback={<TabSkeleton />}><AnalyticsTab /></Suspense>
        </TabsContent>
        <TabsContent value="activity" className="mt-4">
          <Suspense fallback={<TabSkeleton />}><ActivityTab /></Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}
