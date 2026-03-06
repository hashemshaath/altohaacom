import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatsCard } from "@/components/ui/stats-card";
import { TrendIndicator } from "@/components/ui/trend-indicator";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid,
} from "recharts";
import { format, subMonths, parseISO, startOfMonth } from "date-fns";
import {
  Landmark, Eye, Star, Ticket, MapPin, TrendingUp,
  Users, BarChart3, Globe,
} from "lucide-react";

const CHART_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

interface Props {
  organizerId: string;
  exhibitions: any[];
}

export default function OrganizerAnalyticsTab({ organizerId, exhibitions }: Props) {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const exIds = useMemo(() => exhibitions.map((e: any) => e.id).filter(Boolean), [exhibitions]);

  // Aggregate stats: tickets, reviews, followers
  const { data: aggData } = useQuery({
    queryKey: ["organizer-analytics-agg", organizerId, exIds],
    queryFn: async () => {
      if (!exIds.length) return { tickets: 0, reviews: 0, avgRating: 0, totalViews: 0, followers: 0, countries: 0 };

      const [ticketsRes, reviewsRes, followersRes] = await Promise.all([
        supabase.from("exhibition_tickets").select("id", { count: "exact", head: true }).in("exhibition_id", exIds),
        supabase.from("exhibition_reviews").select("id, rating").in("exhibition_id", exIds),
        supabase.from("exhibition_followers").select("id", { count: "exact", head: true }).in("exhibition_id", exIds),
      ]);

      const reviews = reviewsRes.data || [];
      const avgRating = reviews.length > 0
        ? reviews.reduce((s, r: any) => s + (r.rating || 0), 0) / reviews.length
        : 0;

      const totalViews = exhibitions.reduce((s: number, e: any) => s + (e.view_count || 0), 0);
      const countries = new Set(exhibitions.map((e: any) => e.country).filter(Boolean)).size;

      return {
        tickets: ticketsRes.count || 0,
        reviews: reviews.length,
        avgRating,
        totalViews,
        followers: followersRes.count || 0,
        countries,
      };
    },
    enabled: exIds.length > 0,
  });

  // Events over time (monthly)
  const eventsOverTime = useMemo(() => {
    const months: Record<string, number> = {};
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const m = startOfMonth(subMonths(now, i));
      months[format(m, "yyyy-MM")] = 0;
    }
    exhibitions.forEach((e: any) => {
      if (e.start_date) {
        const key = format(parseISO(e.start_date), "yyyy-MM");
        if (key in months) months[key]++;
      }
    });
    return Object.entries(months).map(([month, count]) => ({
      month: format(parseISO(month + "-01"), "MMM yy"),
      events: count,
    }));
  }, [exhibitions]);

  // Status distribution
  const statusDist = useMemo(() => {
    const map: Record<string, number> = {};
    exhibitions.forEach((e: any) => {
      const s = e.status || "unknown";
      map[s] = (map[s] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [exhibitions]);

  // Country distribution
  const countryDist = useMemo(() => {
    const map: Record<string, number> = {};
    exhibitions.forEach((e: any) => {
      const c = e.country || e.city || "Unknown";
      map[c] = (map[c] || 0) + 1;
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [exhibitions]);

  // Views trend (per exhibition, sorted by date)
  const viewsTrend = useMemo(() => {
    return exhibitions
      .filter((e: any) => e.start_date)
      .sort((a: any, b: any) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
      .slice(-12)
      .map((e: any) => ({
        name: format(parseISO(e.start_date), "MMM yy"),
        views: e.view_count || 0,
      }));
  }, [exhibitions]);

  const stats = aggData || { tickets: 0, reviews: 0, avgRating: 0, totalViews: 0, followers: 0, countries: 0 };

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-2">
        <StatsCard icon={<Ticket className="h-4 w-4" />} label={isAr ? "التذاكر" : "Tickets"} value={stats.tickets.toLocaleString()} />
        <StatsCard icon={<Eye className="h-4 w-4" />} label={isAr ? "المشاهدات" : "Views"} value={stats.totalViews.toLocaleString()} />
        <StatsCard icon={<Users className="h-4 w-4" />} label={isAr ? "المتابعون" : "Followers"} value={stats.followers.toLocaleString()} />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <StatsCard icon={<Star className="h-4 w-4" />} label={isAr ? "التقييم" : "Rating"} value={stats.avgRating > 0 ? stats.avgRating.toFixed(1) : "—"} />
        <StatsCard icon={<BarChart3 className="h-4 w-4" />} label={isAr ? "المراجعات" : "Reviews"} value={stats.reviews} />
        <StatsCard icon={<Globe className="h-4 w-4" />} label={isAr ? "الدول" : "Countries"} value={stats.countries} />
      </div>

      {/* Events Over Time */}
      {eventsOverTime.length > 0 && (
        <Card className="rounded-2xl border-border/40">
          <CardContent className="p-3">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              {isAr ? "المعارض شهرياً (12 شهر)" : "Events per Month (12m)"}
            </p>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={eventsOverTime}>
                <XAxis dataKey="month" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 9 }} tickLine={false} axisLine={false} allowDecimals={false} width={20} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                <Bar dataKey="events" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Views Trend */}
      {viewsTrend.length > 1 && (
        <Card className="rounded-2xl border-border/40">
          <CardContent className="p-3">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              {isAr ? "اتجاه المشاهدات" : "Views Trend"}
            </p>
            <ResponsiveContainer width="100%" height={120}>
              <LineChart data={viewsTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 9 }} tickLine={false} axisLine={false} width={30} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                <Line type="monotone" dataKey="views" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Status & Geography */}
      <div className="grid grid-cols-2 gap-2">
        {statusDist.length > 0 && (
          <Card className="rounded-2xl border-border/40">
            <CardContent className="p-3">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                {isAr ? "توزيع الحالة" : "Status"}
              </p>
              <ResponsiveContainer width="100%" height={100}>
                <PieChart>
                  <Pie data={statusDist} cx="50%" cy="50%" innerRadius={25} outerRadius={40} dataKey="value" paddingAngle={2}>
                    {statusDist.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 10, borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-1 mt-1">
                {statusDist.map((s, i) => (
                  <Badge key={s.name} variant="outline" className="text-[8px] gap-0.5">
                    <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                    {s.name} ({s.value})
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {countryDist.length > 0 && (
          <Card className="rounded-2xl border-border/40">
            <CardContent className="p-3">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                {isAr ? "التوزيع الجغرافي" : "Geography"}
              </p>
              <div className="space-y-1.5">
                {countryDist.map((c, i) => (
                  <div key={c.name} className="flex items-center gap-2">
                    <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                    <span className="text-[10px] truncate flex-1">{c.name}</span>
                    <Badge variant="secondary" className="text-[8px] h-4">{c.value}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* No data state */}
      {exhibitions.length === 0 && (
        <div className="text-center py-8">
          <BarChart3 className="h-10 w-10 mx-auto text-muted-foreground/30 mb-2" />
          <p className="text-sm text-muted-foreground">{isAr ? "لا توجد بيانات كافية للتحليل" : "Not enough data for analytics"}</p>
        </div>
      )}
    </div>
  );
}
