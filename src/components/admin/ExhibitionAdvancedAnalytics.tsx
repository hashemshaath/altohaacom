import { memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Area, AreaChart,
} from "recharts";
import { Download, TrendingUp, Users, Ticket, DollarSign, Eye, MapPin, Calendar } from "lucide-react";
import { subDays, format, startOfWeek, endOfWeek } from "date-fns";
import { useCSVExport } from "@/hooks/useCSVExport";

const COLORS = [
  "hsl(var(--primary))", "hsl(var(--chart-3))", "hsl(var(--chart-4))",
  "hsl(var(--chart-5))", "hsl(var(--chart-2))", "hsl(var(--chart-1))",
];

export const ExhibitionAdvancedAnalytics = memo(function ExhibitionAdvancedAnalytics() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const t = (en: string, ar: string) => isAr ? ar : en;

  const { data, isLoading } = useQuery({
    queryKey: ["admin-exhibition-advanced-analytics"],
    queryFn: async () => {
      const now = new Date();
      const thirtyDaysAgo = subDays(now, 30);

      const [exhibitions, tickets, booths, reviews, followers] = await Promise.all([
        supabase.from("exhibitions").select("id, title, status, start_date, end_date, city, country, view_count, created_at, is_free, ticket_price"),
        supabase.from("exhibition_tickets").select("id, exhibition_id, status, created_at, checked_in_at"),
        supabase.from("exhibition_booths").select("id, exhibition_id, status, assigned_to, price"),
        supabase.from("exhibition_reviews").select("id, exhibition_id, rating, created_at"),
        supabase.from("exhibition_followers").select("id, exhibition_id, created_at"),
      ]);

      const allExhibitions = exhibitions.data || [];
      const allTickets = tickets.data || [];
      const allBooths = booths.data || [];
      const allReviews = reviews.data || [];
      const allFollowers = followers.data || [];

      // Revenue estimate from paid tickets
      const paidTickets = allTickets.filter((t: any) => t.status === "confirmed").length;
      const pendingPayments = allTickets.filter((t: any) => t.status === "pending").length;

      // Status distribution for pie chart
      const statusDist: Record<string, number> = {};
      allExhibitions.forEach(e => { statusDist[e.status] = (statusDist[e.status] || 0) + 1; });
      const statusPieData = Object.entries(statusDist).map(([name, value]) => ({ name, value }));

      // Ticket trend (last 30 days)
      const ticketTrend: Record<string, number> = {};
      for (let i = 29; i >= 0; i--) {
        ticketTrend[format(subDays(now, i), "MMM dd")] = 0;
      }
      allTickets.filter(t => new Date(t.created_at) >= thirtyDaysAgo).forEach(t => {
        const d = format(new Date(t.created_at), "MMM dd");
        if (ticketTrend[d] !== undefined) ticketTrend[d]++;
      });
      const ticketTrendData = Object.entries(ticketTrend).map(([date, count]) => ({ date, count }));

      // Follower trend (last 30 days)
      const followerTrend: Record<string, number> = {};
      for (let i = 29; i >= 0; i--) {
        followerTrend[format(subDays(now, i), "MMM dd")] = 0;
      }
      allFollowers.filter(f => new Date(f.created_at) >= thirtyDaysAgo).forEach(f => {
        const d = format(new Date(f.created_at), "MMM dd");
        if (followerTrend[d] !== undefined) followerTrend[d]++;
      });
      const followerTrendData = Object.entries(followerTrend).map(([date, count]) => ({ date, count }));

      // Top exhibitions by tickets
      const ticketsByExhibition: Record<string, number> = {};
      allTickets.forEach(t => { ticketsByExhibition[t.exhibition_id] = (ticketsByExhibition[t.exhibition_id] || 0) + 1; });
      const topExhibitions = Object.entries(ticketsByExhibition)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([id, count]) => {
          const ex = allExhibitions.find(e => e.id === id);
          return { name: ex?.title?.slice(0, 25) || id.slice(0, 8), tickets: count };
        });

      // Rating distribution
      const ratingDist = [1, 2, 3, 4, 5].map(r => ({
        rating: `${r}⭐`,
        count: allReviews.filter(rv => rv.rating === r).length,
      }));

      // City distribution
      const cityMap: Record<string, number> = {};
      allExhibitions.forEach(e => { if (e.city) cityMap[e.city] = (cityMap[e.city] || 0) + 1; });
      const cityData = Object.entries(cityMap).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([city, count]) => ({ city, count }));

      // Check-in rate
      const totalTickets = allTickets.length;
      const checkedIn = allTickets.filter(t => t.checked_in_at).length;
      const checkInRate = totalTickets > 0 ? Math.round((checkedIn / totalTickets) * 100) : 0;

      // Avg rating
      const avgRating = allReviews.length > 0
        ? (allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length).toFixed(1)
        : "0";

      return {
        totalExhibitions: allExhibitions.length,
        totalTickets,
        paidTickets,
        pendingPayments,
        totalBooths: allBooths.length,
        assignedBooths: allBooths.filter(b => b.assigned_to).length,
        totalViews: allExhibitions.reduce((s, e) => s + (e.view_count || 0), 0),
        totalFollowers: allFollowers.length,
        totalReviews: allReviews.length,
        avgRating,
        checkedIn,
        checkInRate,
        statusPieData,
        ticketTrendData,
        followerTrendData,
        topExhibitions,
        ratingDist,
        cityData,
      };
    },
    staleTime: 1000 * 60 * 2,
  });

  const { exportCSV } = useCSVExport({
    columns: [
      { header: "Metric", accessor: (r: any) => r.metric },
      { header: "Value", accessor: (r: any) => r.value },
    ],
    filename: "exhibition_analytics",
  });

  const handleExport = () => {
    if (!data) return;
    exportCSV([
      { metric: "Total Exhibitions", value: data.totalExhibitions },
      { metric: "Total Tickets", value: data.totalTickets },
      { metric: "Paid Tickets", value: data.paidTickets },
      { metric: "Check-in Rate", value: `${data.checkInRate}%` },
      { metric: "Total Views", value: data.totalViews },
      { metric: "Total Followers", value: data.totalFollowers },
      { metric: "Avg Rating", value: data.avgRating },
      { metric: "Total Reviews", value: data.totalReviews },
    ]);
  };

  if (isLoading) return <Skeleton className="h-96 w-full rounded-xl" />;
  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          {t("Advanced Analytics", "تحليلات متقدمة")}
        </h3>
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="me-1.5 h-3.5 w-3.5" />
          {t("Export", "تصدير")}
        </Button>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: Ticket, label: t("Tickets Sold", "التذاكر المباعة"), value: data.totalTickets, sub: `${data.paidTickets} ${t("paid", "مدفوع")}`, color: "text-primary" },
          { icon: Users, label: t("Check-in Rate", "نسبة الدخول"), value: `${data.checkInRate}%`, sub: `${data.checkedIn} ${t("checked in", "دخلوا")}`, color: "text-chart-3" },
          { icon: Eye, label: t("Total Views", "إجمالي المشاهدات"), value: data.totalViews, sub: `${data.totalFollowers} ${t("followers", "متابع")}`, color: "text-chart-4" },
          { icon: Calendar, label: t("Avg Rating", "متوسط التقييم"), value: `${data.avgRating}⭐`, sub: `${data.totalReviews} ${t("reviews", "تقييم")}`, color: "text-chart-5" },
        ].map(kpi => (
          <Card key={kpi.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
                <span className="text-xs text-muted-foreground">{kpi.label}</span>
              </div>
              <p className="text-2xl font-bold">{typeof kpi.value === "number" ? <AnimatedCounter value={kpi.value} /> : kpi.value}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{kpi.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Ticket Trend */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{t("30-Day Ticket Trend", "اتجاه التذاكر - 30 يوم")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={data.ticketTrendData}>
                <defs>
                  <linearGradient id="ticketGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fontSize: 9 }} interval={4} />
                <YAxis tick={{ fontSize: 9 }} width={24} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                <Area type="monotone" dataKey="count" stroke="hsl(var(--primary))" fill="url(#ticketGrad)" strokeWidth={2} name={t("Tickets", "تذاكر")} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{t("Status Distribution", "توزيع الحالات")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={data.statusPieData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                  {data.statusPieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Charts */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Top Exhibitions */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{t("Top by Tickets", "الأعلى تذاكراً")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={data.topExhibitions} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 9 }} />
                <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 9 }} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                <Bar dataKey="tickets" fill="hsl(var(--chart-3))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Rating Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{t("Rating Distribution", "توزيع التقييمات")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={data.ratingDist}>
                <XAxis dataKey="rating" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 9 }} width={24} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                <Bar dataKey="count" fill="hsl(var(--chart-4))" radius={[4, 4, 0, 0]} name={t("Reviews", "تقييمات")} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* City Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" /> {t("By City", "حسب المدينة")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2.5">
              {data.cityData.map(c => (
                <div key={c.city}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span>{c.city}</span>
                    <Badge variant="outline" className="text-[9px] h-4">{c.count}</Badge>
                  </div>
                  <Progress value={(c.count / (data.cityData[0]?.count || 1)) * 100} className="h-1.5" />
                </div>
              ))}
              {data.cityData.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-6">{t("No data", "لا توجد بيانات")}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
});
