import { useMemo, memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  BarChart3, TrendingUp, Target, Globe, Users, Eye,
  Ticket, Star, MapPin, Calendar, Percent,
} from "lucide-react";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid,
} from "recharts";

interface Props {
  exhibitions: any[];
  byYear: Record<string, any[]>;
  sortedYears: string[];
  upcoming: any[];
  active: any[];
  past: any[];
  countries: string[];
  totalExhibitions: number;
  totalViews: number;
  totalTickets: number;
  totalReviews: number;
  editionStats: { visitors?: number; exhibitors?: number; area?: number };
  types: string[];
  isAr: boolean;
}

const CHART_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--chart-1))",
];

export const OrganizerAnalyticsTab = memo(function OrganizerAnalyticsTab({
  exhibitions, byYear, sortedYears, upcoming, active, past,
  countries, totalExhibitions, totalViews, totalTickets, totalReviews,
  editionStats, types, isAr,
}: Props) {
  // Yearly data for area chart
  const yearlyData = useMemo(() =>
    sortedYears.slice().reverse().map(year => ({
      year,
      events: byYear[year].length,
      views: byYear[year].reduce((s: number, e: any) => s + (e.view_count || 0), 0),
    })),
  [sortedYears, byYear]);

  // Event type distribution for pie chart
  const typeData = useMemo(() =>
    types.map(t => ({
      name: t.replace(/_/g, " "),
      value: exhibitions.filter((e: any) => e.type === t).length,
    })),
  [types, exhibitions]);

  // Country distribution
  const countryData = useMemo(() =>
    countries.map(c => ({
      name: c,
      events: exhibitions.filter((e: any) => e.country === c).length,
    })).sort((a, b) => b.events - a.events),
  [countries, exhibitions]);

  // Monthly distribution (heatmap data)
  const monthlyData = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, i) => ({
      month: new Date(2024, i).toLocaleString(isAr ? "ar" : "en", { month: "short" }),
      count: 0,
    }));
    exhibitions.forEach((e: any) => {
      if (e.start_date) {
        const m = new Date(e.start_date).getMonth();
        months[m].count++;
      }
    });
    return months;
  }, [exhibitions, isAr]);

  // Growth rate
  const growthRate = useMemo(() => {
    if (sortedYears.length < 2) return null;
    const current = byYear[sortedYears[0]]?.length || 0;
    const previous = byYear[sortedYears[1]]?.length || 0;
    if (previous === 0) return null;
    return Math.round(((current - previous) / previous) * 100);
  }, [sortedYears, byYear]);

  // Average rating across all exhibitions
  const avgDuration = useMemo(() => {
    const durations = exhibitions
      .filter((e: any) => e.start_date && e.end_date)
      .map((e: any) => {
        const start = new Date(e.start_date).getTime();
        const end = new Date(e.end_date).getTime();
        return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
      })
      .filter(d => d > 0);
    return durations.length > 0 ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0;
  }, [exhibitions]);

  return (
    <div className="space-y-4">
      {/* KPI Summary Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: Calendar, label: isAr ? "إجمالي الفعاليات" : "Total Events", value: totalExhibitions, suffix: "" },
          { icon: Eye, label: isAr ? "إجمالي المشاهدات" : "Total Views", value: totalViews, suffix: "" },
          { icon: Ticket, label: isAr ? "التذاكر المباعة" : "Tickets Sold", value: totalTickets, suffix: "" },
          { icon: Star, label: isAr ? "التقييمات" : "Reviews", value: totalReviews, suffix: "" },
        ].map(kpi => (
          <Card key={kpi.label} className="rounded-2xl border-border/40">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <kpi.icon className="h-3.5 w-3.5 text-primary" />
                <span className="text-[10px] text-muted-foreground">{kpi.label}</span>
              </div>
              <p className="text-xl font-bold"><AnimatedCounter value={kpi.value} /></p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Growth + Duration + Completion Rate */}
      <div className="grid grid-cols-3 gap-3">
        {growthRate !== null && (
          <Card className="rounded-2xl border-border/40">
            <CardContent className="p-3 text-center">
              <TrendingUp className={`h-5 w-5 mx-auto mb-1 ${growthRate >= 0 ? "text-chart-2" : "text-destructive"}`} />
              <p className={`text-lg font-bold ${growthRate >= 0 ? "text-chart-2" : "text-destructive"}`}>
                {growthRate > 0 ? "+" : ""}{growthRate}%
              </p>
              <p className="text-[9px] text-muted-foreground">{isAr ? "معدل النمو" : "Growth Rate"}</p>
            </CardContent>
          </Card>
        )}
        <Card className="rounded-2xl border-border/40">
          <CardContent className="p-3 text-center">
            <Calendar className="h-5 w-5 mx-auto mb-1 text-chart-4" />
            <p className="text-lg font-bold">{avgDuration}</p>
            <p className="text-[9px] text-muted-foreground">{isAr ? "متوسط المدة (أيام)" : "Avg Duration (days)"}</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-border/40">
          <CardContent className="p-3 text-center">
            <Globe className="h-5 w-5 mx-auto mb-1 text-chart-5" />
            <p className="text-lg font-bold">{countries.length}</p>
            <p className="text-[9px] text-muted-foreground">{isAr ? "دول" : "Countries"}</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Events Over Years - Area Chart */}
        <Card className="rounded-2xl border-border/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              {isAr ? "النشاط عبر السنوات" : "Activity Over Years"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {yearlyData.length > 1 ? (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={yearlyData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                  <defs>
                    <linearGradient id="orgGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                  <XAxis dataKey="year" tick={{ fontSize: 10 }} className="text-muted-foreground" />
                  <YAxis tick={{ fontSize: 10 }} allowDecimals={false} className="text-muted-foreground" />
                  <RechartsTooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }}
                    labelStyle={{ fontWeight: 600 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="events"
                    stroke="hsl(var(--primary))"
                    fill="url(#orgGradient)"
                    strokeWidth={2}
                    name={isAr ? "فعاليات" : "Events"}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-sm text-muted-foreground">
                {isAr ? "بيانات غير كافية" : "Not enough data"}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Event Type Distribution - Pie Chart */}
        <Card className="rounded-2xl border-border/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              {isAr ? "أنواع الفعاليات" : "Event Types"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {typeData.length > 0 ? (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width={140} height={140}>
                  <PieChart>
                    <Pie
                      data={typeData}
                      cx="50%"
                      cy="50%"
                      innerRadius={35}
                      outerRadius={60}
                      dataKey="value"
                      strokeWidth={2}
                      stroke="hsl(var(--card))"
                    >
                      {typeData.map((_, idx) => (
                        <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-1.5">
                  {typeData.map((item, idx) => (
                    <div key={item.name} className="flex items-center gap-2 text-xs">
                      <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: CHART_COLORS[idx % CHART_COLORS.length] }} />
                      <span className="capitalize flex-1 truncate">{item.name}</span>
                      <Badge variant="secondary" className="text-[9px] h-4 px-1.5">{item.value}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-[140px] flex items-center justify-center text-sm text-muted-foreground">
                {isAr ? "لا توجد بيانات" : "No data"}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Monthly Activity Heatmap */}
      <Card className="rounded-2xl border-border/40">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            {isAr ? "النشاط الشهري" : "Monthly Activity"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={monthlyData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 9 }} className="text-muted-foreground" />
              <YAxis tick={{ fontSize: 9 }} allowDecimals={false} className="text-muted-foreground" />
              <RechartsTooltip
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }}
              />
              <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name={isAr ? "فعاليات" : "Events"} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Geographic + Cumulative Row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Geographic Distribution */}
        <Card className="rounded-2xl border-border/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" />
              {isAr ? "التوزيع الجغرافي" : "Geographic Reach"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {countryData.map((c, idx) => {
              const pct = Math.round((c.events / totalExhibitions) * 100);
              return (
                <div key={c.name}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full shrink-0" style={{ background: CHART_COLORS[idx % CHART_COLORS.length] }} />
                      <span>{c.name}</span>
                    </div>
                    <span className="text-muted-foreground font-mono text-[10px]">{c.events} ({pct}%)</span>
                  </div>
                  <Progress value={pct} className="h-1.5" />
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Cumulative Stats + Status */}
        <div className="space-y-4">
          {(editionStats.visitors || editionStats.exhibitors || editionStats.area) && (
            <Card className="rounded-2xl border-border/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  {isAr ? "إحصائيات تراكمية" : "Cumulative Stats"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {editionStats.visitors && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground flex items-center gap-1.5"><Users className="h-3 w-3" />{isAr ? "الزوار" : "Visitors"}</span>
                    <span className="text-lg font-bold">{editionStats.visitors.toLocaleString()}</span>
                  </div>
                )}
                {editionStats.exhibitors && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground flex items-center gap-1.5"><MapPin className="h-3 w-3" />{isAr ? "العارضون" : "Exhibitors"}</span>
                    <span className="text-lg font-bold">{editionStats.exhibitors.toLocaleString()}</span>
                  </div>
                )}
                {editionStats.area && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{isAr ? "المساحة" : "Area"}</span>
                    <span className="text-lg font-bold">{editionStats.area.toLocaleString()} m²</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card className="rounded-2xl border-border/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Percent className="h-4 w-4 text-primary" />
                {isAr ? "توزيع الحالات" : "Status Distribution"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { label: isAr ? "قادمة" : "Upcoming", count: upcoming.length, color: "bg-chart-2" },
                { label: isAr ? "جارية" : "Active", count: active.length, color: "bg-primary" },
                { label: isAr ? "منتهية" : "Completed", count: past.length, color: "bg-muted-foreground" },
              ].map(s => (
                <div key={s.label} className="flex items-center gap-3">
                  <span className={`h-2 w-2 rounded-full shrink-0 ${s.color}`} />
                  <span className="text-xs flex-1">{s.label}</span>
                  <Badge variant="secondary" className="text-[10px] font-mono">{s.count}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
});
