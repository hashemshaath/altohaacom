import { memo, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCSVExport } from "@/hooks/useCSVExport";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area } from "recharts";
import { Download, TrendingUp, Users, Ticket, DollarSign, BarChart3, Eye, Star, MapPin, Clock } from "lucide-react";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { format, subDays, differenceInDays } from "date-fns";

interface Props { exhibitionId: string; exhibitionTitle: string; isAr: boolean; }

const COLORS = ["hsl(var(--primary))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))", "hsl(var(--chart-2))"];

export default memo(function OrganizerAdvancedReports({ exhibitionId, exhibitionTitle, isAr }: Props) {
  const t = (en: string, ar: string) => isAr ? ar : en;

  const { data, isLoading } = useQuery({
    queryKey: ["organizer-advanced-reports", exhibitionId],
    queryFn: async () => {
      const [ticketsRes, boothsRes, reviewsRes, followersRes, exhibitionRes] = await Promise.all([
        supabase.from("exhibition_tickets").select("id, status, created_at, checked_in_at, ticket_type, price_paid, currency").eq("exhibition_id", exhibitionId),
        supabase.from("exhibition_booths").select("id, status, category, price, currency, assigned_to, hall, size_sqm").eq("exhibition_id", exhibitionId),
        supabase.from("exhibition_reviews").select("id, rating, created_at").eq("exhibition_id", exhibitionId),
        supabase.from("exhibition_followers").select("id, created_at").eq("exhibition_id", exhibitionId),
        supabase.from("exhibitions").select("view_count, start_date, end_date, created_at").eq("id", exhibitionId).single(),
      ]);

      const tickets = ticketsRes.data || [];
      const booths = boothsRes.data || [];
      const reviews = reviewsRes.data || [];
      const followers = followersRes.data || [];
      const exhibition = exhibitionRes.data;

      // Revenue
      const totalRevenue = tickets.reduce((s, t: any) => s + (t.price_paid || 0), 0);
      const boothRevenue = booths.filter((b: any) => b.assigned_to).reduce((s, b: any) => s + (b.price || 0), 0);
      const currency = tickets[0]?.currency || booths[0]?.currency || "SAR";

      // Ticket stats
      const confirmed = tickets.filter((t: any) => t.status === "confirmed").length;
      const checkedIn = tickets.filter((t: any) => t.checked_in_at).length;
      const checkInRate = confirmed > 0 ? Math.round((checkedIn / confirmed) * 100) : 0;

      // Daily ticket trend (30 days)
      const now = new Date();
      const dailyMap: Record<string, number> = {};
      for (let i = 29; i >= 0; i--) dailyMap[format(subDays(now, i), "MM/dd")] = 0;
      tickets.forEach((t: any) => {
        const d = format(new Date(t.created_at), "MM/dd");
        if (dailyMap[d] !== undefined) dailyMap[d]++;
      });
      const dailyTrend = Object.entries(dailyMap).map(([date, count]) => ({ date, count }));

      // Ticket type breakdown
      const typeMap: Record<string, number> = {};
      tickets.forEach((t: any) => { const tp = t.ticket_type || "standard"; typeMap[tp] = (typeMap[tp] || 0) + 1; });
      const ticketTypes = Object.entries(typeMap).map(([name, value]) => ({ name, value }));

      // Booth stats
      const totalBooths = booths.length;
      const occupiedBooths = booths.filter((b: any) => b.status === "occupied" || b.assigned_to).length;
      const boothOccupancy = totalBooths > 0 ? Math.round((occupiedBooths / totalBooths) * 100) : 0;

      // Booth by category
      const catMap: Record<string, number> = {};
      booths.forEach((b: any) => { const c = b.category || "general"; catMap[c] = (catMap[c] || 0) + 1; });
      const boothCategories = Object.entries(catMap).map(([name, value]) => ({ name, value }));

      // Reviews
      const avgRating = reviews.length > 0 ? (reviews.reduce((s, r: any) => s + r.rating, 0) / reviews.length).toFixed(1) : "0";
      const ratingDist = [1, 2, 3, 4, 5].map(star => ({ star: `${star}⭐`, count: reviews.filter((r: any) => r.rating === star).length }));

      // Follower growth (daily, last 14 days)
      const followerDaily: Record<string, number> = {};
      for (let i = 13; i >= 0; i--) followerDaily[format(subDays(now, i), "MM/dd")] = 0;
      followers.forEach((f: any) => {
        const d = format(new Date(f.created_at), "MM/dd");
        if (followerDaily[d] !== undefined) followerDaily[d]++;
      });
      const followerTrend = Object.entries(followerDaily).map(([date, count]) => ({ date, count }));

      // Event duration
      const eventDuration = exhibition ? differenceInDays(new Date(exhibition.end_date), new Date(exhibition.start_date)) + 1 : 0;

      return {
        totalTickets: tickets.length, confirmed, checkedIn, checkInRate,
        totalRevenue, boothRevenue, currency,
        totalBooths, occupiedBooths, boothOccupancy,
        totalReviews: reviews.length, avgRating, ratingDist,
        totalFollowers: followers.length,
        viewCount: exhibition?.view_count || 0,
        eventDuration,
        dailyTrend, ticketTypes, boothCategories, followerTrend,
        tickets, booths,
      };
    },
    refetchInterval: 60000,
  });

  const { exportCSV: exportTickets } = useCSVExport({
    columns: [
      { header: "ID", accessor: (r: any) => r.id },
      { header: "Status", accessor: (r: any) => r.status },
      { header: "Type", accessor: (r: any) => r.ticket_type || "standard" },
      { header: "Amount", accessor: (r: any) => r.price_paid || 0 },
      { header: "Checked In", accessor: (r: any) => r.checked_in_at ? "Yes" : "No" },
      { header: "Created", accessor: (r: any) => r.created_at },
    ],
    filename: `${exhibitionTitle}_tickets`,
  });

  const { exportCSV: exportBooths } = useCSVExport({
    columns: [
      { header: "Status", accessor: (r: any) => r.status },
      { header: "Category", accessor: (r: any) => r.category },
      { header: "Hall", accessor: (r: any) => r.hall },
      { header: "Price", accessor: (r: any) => r.price },
      { header: "Size (sqm)", accessor: (r: any) => r.size_sqm },
      { header: "Assigned", accessor: (r: any) => r.assigned_to ? "Yes" : "No" },
    ],
    filename: `${exhibitionTitle}_booths`,
  });

  if (isLoading) return <Skeleton className="h-60 w-full rounded-xl" />;
  if (!data) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-sm flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" />
          {t("Advanced Reports", "تقارير متقدمة")}
        </h3>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="text-[10px]" onClick={() => exportTickets(data.tickets)}>
            <Download className="me-1 h-3 w-3" /> {t("Export Tickets", "تصدير التذاكر")}
          </Button>
          <Button size="sm" variant="outline" className="text-[10px]" onClick={() => exportBooths(data.booths)}>
            <Download className="me-1 h-3 w-3" /> {t("Export Booths", "تصدير الأجنحة")}
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {[
          { icon: Ticket, label: t("Tickets", "تذاكر"), numValue: data.totalTickets, sub: `${data.checkInRate}% ${t("check-in", "دخول")}` },
          { icon: DollarSign, label: t("Revenue", "الإيرادات"), numValue: Math.round(data.totalRevenue), suffix: ` ${data.currency}`, subValue: data.boothRevenue },
          { icon: MapPin, label: t("Booths", "أجنحة"), strValue: `${data.occupiedBooths}/${data.totalBooths}`, sub: `${data.boothOccupancy}%` },
          { icon: Star, label: t("Rating", "تقييم"), strValue: data.avgRating, sub: `${data.totalReviews} ${t("reviews", "تقييم")}` },
          { icon: Users, label: t("Followers", "متابعون"), numValue: data.totalFollowers },
          { icon: Eye, label: t("Views", "مشاهدات"), numValue: data.viewCount, sub: `${data.eventDuration} ${t("days", "أيام")}` },
        ].map(kpi => (
          <Card key={kpi.label}>
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <kpi.icon className="h-3.5 w-3.5 text-primary" />
                <span className="text-[9px] text-muted-foreground">{kpi.label}</span>
              </div>
              <p className="text-base font-bold">
                {'numValue' in kpi && kpi.numValue !== undefined
                  ? <><AnimatedCounter value={kpi.numValue} className="inline" />{kpi.suffix || ''}</>
                  : kpi.strValue}
              </p>
              {kpi.sub && <p className="text-[9px] text-muted-foreground">{kpi.sub}</p>}
              {'subValue' in kpi && (kpi as any).subValue != null && <p className="text-[9px] text-muted-foreground">+<AnimatedCounter value={Math.round((kpi as any).subValue)} className="inline" /> {isAr ? "أجنحة" : "booths"}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Ticket Trend */}
        <Card>
          <CardHeader className="py-2 px-4"><CardTitle className="text-xs">{t("30-Day Ticket Trend", "اتجاه التذاكر 30 يوم")}</CardTitle></CardHeader>
          <CardContent className="p-4">
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={data.dailyTrend}>
                <XAxis dataKey="date" tick={{ fontSize: 9 }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 9 }} width={28} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                <Area type="monotone" dataKey="count" fill="hsl(var(--primary))" fillOpacity={0.15} stroke="hsl(var(--primary))" strokeWidth={2} name={t("Tickets", "تذاكر")} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Ticket Types */}
        <Card>
          <CardHeader className="py-2 px-4"><CardTitle className="text-xs">{t("Ticket Types", "أنواع التذاكر")}</CardTitle></CardHeader>
          <CardContent className="p-4 flex items-center justify-center">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={data.ticketTypes} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {data.ticketTypes.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Booth Categories */}
        <Card>
          <CardHeader className="py-2 px-4"><CardTitle className="text-xs">{t("Booth Categories", "فئات الأجنحة")}</CardTitle></CardHeader>
          <CardContent className="p-4">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={data.boothCategories} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 9 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 9 }} width={60} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                <Bar dataKey="value" fill="hsl(var(--chart-3))" radius={[0, 4, 4, 0]} name={t("Booths", "أجنحة")} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Rating Distribution */}
        <Card>
          <CardHeader className="py-2 px-4"><CardTitle className="text-xs">{t("Rating Distribution", "توزيع التقييمات")}</CardTitle></CardHeader>
          <CardContent className="p-4">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={data.ratingDist}>
                <XAxis dataKey="star" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 9 }} width={28} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                <Bar dataKey="count" fill="hsl(var(--chart-4))" radius={[4, 4, 0, 0]} name={t("Reviews", "تقييمات")} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Follower Growth */}
      <Card>
        <CardHeader className="py-2 px-4"><CardTitle className="text-xs">{t("Follower Growth (14 days)", "نمو المتابعين (14 يوم)")}</CardTitle></CardHeader>
        <CardContent className="p-4">
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={data.followerTrend}>
              <XAxis dataKey="date" tick={{ fontSize: 9 }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 9 }} width={28} />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
              <Line type="monotone" dataKey="count" stroke="hsl(var(--chart-5))" strokeWidth={2} dot={{ r: 3 }} name={t("New Followers", "متابعون جدد")} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Occupancy & Check-in Progress */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="p-4 space-y-2">
            <p className="text-xs font-semibold">{t("Booth Occupancy", "إشغال الأجنحة")}</p>
            <Progress value={data.boothOccupancy} className="h-3" />
            <p className="text-[10px] text-muted-foreground">{data.occupiedBooths} / {data.totalBooths} ({data.boothOccupancy}%)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 space-y-2">
            <p className="text-xs font-semibold">{t("Check-in Rate", "معدل الدخول")}</p>
            <Progress value={data.checkInRate} className="h-3" />
            <p className="text-[10px] text-muted-foreground">{data.checkedIn} / {data.confirmed} ({data.checkInRate}%)</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
});
