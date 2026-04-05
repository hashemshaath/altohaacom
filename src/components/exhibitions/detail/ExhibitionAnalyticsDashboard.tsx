import { useState, useMemo, memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Eye, Users, TrendingUp, MapPin, Smartphone, Monitor, Tablet, Calendar, Star, Ticket } from "lucide-react";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from "recharts";

interface Props {
  exhibitionId: string;
}

const COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

export const ExhibitionAnalyticsDashboard = memo(function ExhibitionAnalyticsDashboard({ exhibitionId }: Props) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [period, setPeriod] = useState("7d");

  const periodDays = period === "7d" ? 7 : period === "30d" ? 30 : 90;
  const sinceDate = new Date(Date.now() - periodDays * 86400000).toISOString();

  const { data: events = [] } = useQuery({
    queryKey: ["exhibition-analytics", exhibitionId, period],
    queryFn: async () => {
      const { data } = await supabase
        .from("exhibition_analytics_events")
        .select("id, event_type, user_id, device_type, source, country, created_at")
        .eq("exhibition_id", exhibitionId)
        .gte("created_at", sinceDate)
        .order("created_at", { ascending: true });
      return data || [];
    },
  });

  const { data: tickets = [] } = useQuery({
    queryKey: ["exhibition-tickets-analytics", exhibitionId],
    queryFn: async () => {
      const { data } = await supabase
        .from("exhibition_tickets")
        .select("id, created_at, price_paid, currency, status")
        .eq("exhibition_id", exhibitionId);
      return data || [];
    },
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ["exhibition-reviews-analytics", exhibitionId],
    queryFn: async () => {
      const { data } = await supabase
        .from("exhibition_reviews")
        .select("rating, created_at")
        .eq("exhibition_id", exhibitionId);
      return data || [];
    },
  });

  const stats = useMemo(() => {
    const pageViews = events.filter(e => e.event_type === "page_view").length;
    const uniqueUsers = new Set(events.filter(e => e.user_id).map(e => e.user_id)).size;
    const ticketsSold = tickets.filter(t => t.status === "confirmed").length;
    const revenue = tickets.filter(t => t.status === "confirmed").reduce((s, t) => s + (t.price_paid || 0), 0);
    const avgRating = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : "—";

    return { pageViews, uniqueUsers, ticketsSold, revenue, avgRating };
  }, [events, tickets, reviews]);

  const dailyViews = useMemo(() => {
    const map: Record<string, number> = {};
    events.filter(e => e.event_type === "page_view").forEach(e => {
      const day = e.created_at.slice(0, 10);
      map[day] = (map[day] || 0) + 1;
    });
    return Object.entries(map).map(([date, views]) => ({ date, views }));
  }, [events]);

  const deviceData = useMemo(() => {
    const map: Record<string, number> = {};
    events.forEach(e => {
      const d = e.device_type || "unknown";
      map[d] = (map[d] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [events]);

  const sourceData = useMemo(() => {
    const map: Record<string, number> = {};
    events.forEach(e => {
      const s = e.source || "direct";
      map[s] = (map[s] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [events]);

  const countryData = useMemo(() => {
    const map: Record<string, number> = {};
    events.forEach(e => {
      const c = e.country || "Unknown";
      map[c] = (map[c] || 0) + 1;
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, value]) => ({ name, value }));
  }, [events]);

  const statCards = [
    { icon: Eye, label: isAr ? "مشاهدات" : "Page Views", value: stats.pageViews, color: "text-primary" },
    { icon: Users, label: isAr ? "زوار فريدين" : "Unique Visitors", value: stats.uniqueUsers, color: "text-chart-2" },
    { icon: Ticket, label: isAr ? "تذاكر مباعة" : "Tickets Sold", value: stats.ticketsSold, color: "text-chart-3" },
    { icon: TrendingUp, label: isAr ? "الإيرادات" : "Revenue", value: stats.revenue, prefix: "$", color: "text-chart-4" },
    { icon: Star, label: isAr ? "متوسط التقييم" : "Avg Rating", value: stats.avgRating, color: "text-chart-5" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          {isAr ? "تحليلات المعرض" : "Exhibition Analytics"}
        </h3>
        <div className="flex gap-1">
          {["7d", "30d", "90d"].map(p => (
            <Badge
              key={p}
              variant={period === p ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setPeriod(p)}
            >
              {p === "7d" ? (isAr ? "7 أيام" : "7 days") : p === "30d" ? (isAr ? "30 يوم" : "30 days") : (isAr ? "90 يوم" : "90 days")}
            </Badge>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {statCards.map((s, i) => (
          <Card key={i}>
            <CardContent className="p-4 text-center">
              <s.icon className={`h-5 w-5 mx-auto mb-1 ${s.color}`} />
              <p className="text-2xl font-bold">{typeof s.value === "number" ? <AnimatedCounter value={s.value} prefix={(s as any).prefix || ""} /> : s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="traffic">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="traffic">{isAr ? "الزيارات" : "Traffic"}</TabsTrigger>
          <TabsTrigger value="sources">{isAr ? "المصادر" : "Sources"}</TabsTrigger>
          <TabsTrigger value="devices">{isAr ? "الأجهزة" : "Devices"}</TabsTrigger>
          <TabsTrigger value="geo">{isAr ? "الجغرافيا" : "Geography"}</TabsTrigger>
        </TabsList>

        <TabsContent value="traffic">
          <Card>
            <CardHeader><CardTitle className="text-sm">{isAr ? "المشاهدات اليومية" : "Daily Views"}</CardTitle></CardHeader>
            <CardContent>
              {dailyViews.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={dailyViews}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                    <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                    <Tooltip />
                    <Line type="monotone" dataKey="views" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-muted-foreground py-12">{isAr ? "لا توجد بيانات بعد" : "No data yet"}</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sources">
          <Card>
            <CardHeader><CardTitle className="text-sm">{isAr ? "مصادر الزيارات" : "Traffic Sources"}</CardTitle></CardHeader>
            <CardContent>
              {sourceData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={sourceData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-muted-foreground py-12">{isAr ? "لا توجد بيانات" : "No data"}</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="devices">
          <Card>
            <CardHeader><CardTitle className="text-sm">{isAr ? "توزيع الأجهزة" : "Device Distribution"}</CardTitle></CardHeader>
            <CardContent>
              {deviceData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={deviceData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {deviceData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-muted-foreground py-12">{isAr ? "لا توجد بيانات" : "No data"}</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="geo">
          <Card>
            <CardHeader><CardTitle className="text-sm">{isAr ? "الدول الأكثر زيارة" : "Top Countries"}</CardTitle></CardHeader>
            <CardContent>
              {countryData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={countryData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
                    <Tooltip />
                    <Bar dataKey="value" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-muted-foreground py-12">{isAr ? "لا توجد بيانات" : "No data"}</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
});
