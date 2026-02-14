import { useLanguage } from "@/i18n/LanguageContext";
import { useProfileAnalytics } from "@/hooks/useProfileViews";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, Users, Monitor, Smartphone, TrendingUp, Globe, Clock } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar,
} from "recharts";
import { StaggeredList } from "@/components/ui/staggered-list";
import { EmptyState } from "@/components/ui/empty-state";

interface ProfileAnalyticsDashboardProps {
  userId: string;
}

const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export function ProfileAnalyticsDashboard({ userId }: ProfileAnalyticsDashboardProps) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { data: analytics, isLoading } = useProfileAnalytics(userId);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map(i => (
          <Card key={i}><CardContent className="p-4"><div className="h-16 animate-pulse bg-muted rounded" /></CardContent></Card>
        ))}
      </div>
    );
  }

  if (!analytics || analytics.totalViews === 0) {
    return (
      <EmptyState
        icon={Eye}
        title={isAr ? "لا توجد بيانات بعد" : "No analytics data yet"}
        description={isAr ? "ستظهر الإحصائيات عند زيارة ملفك الشخصي" : "Analytics will appear when your profile gets views"}
      />
    );
  }

  const statCards = [
    {
      icon: Eye,
      label: isAr ? "إجمالي الزيارات" : "Total Views",
      value: analytics.totalViews,
      sub: isAr ? "آخر 30 يوم" : "Last 30 days",
      color: "text-chart-1",
      bg: "bg-chart-1/10",
    },
    {
      icon: TrendingUp,
      label: isAr ? "آخر 7 أيام" : "Last 7 Days",
      value: analytics.last7Days,
      sub: isAr ? "زيارة" : "views",
      color: "text-chart-2",
      bg: "bg-chart-2/10",
    },
    {
      icon: Users,
      label: isAr ? "زوار فريدون" : "Unique Visitors",
      value: analytics.uniqueVisitors,
      sub: isAr ? "آخر 30 يوم" : "Last 30 days",
      color: "text-chart-3",
      bg: "bg-chart-3/10",
    },
    {
      icon: Globe,
      label: isAr ? "الشركات" : "Companies",
      value: analytics.viewerTypeBreakdown["company"] || 0,
      sub: isAr ? "زيارة من شركات" : "Company visits",
      color: "text-chart-4",
      bg: "bg-chart-4/10",
    },
  ];

  // Prepare pie data for visitor type
  const visitorTypePie = Object.entries(analytics.viewerTypeBreakdown).map(([key, val]) => ({
    name: key === "company" ? (isAr ? "شركات" : "Companies") : (isAr ? "أفراد" : "Individuals"),
    value: val,
  }));

  // Device pie
  const devicePie = Object.entries(analytics.deviceBreakdown).map(([key, val]) => ({
    name: key === "mobile" ? (isAr ? "جوال" : "Mobile") : key === "desktop" ? (isAr ? "حاسوب" : "Desktop") : key,
    value: val,
  }));

  // Referrer data
  const referrerData = Object.entries(analytics.referrerBreakdown)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, value]) => ({ name, value }));

  // Hourly data
  const hourlyData = analytics.hourlyBreakdown.map((count: number, hour: number) => ({
    hour: `${hour.toString().padStart(2, "0")}:00`,
    views: count,
  }));

  return (
    <StaggeredList className="space-y-6" stagger={80}>
      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${stat.bg}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-[10px] text-muted-foreground leading-tight">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Views Over Time */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            {isAr ? "الزيارات خلال 30 يوم" : "Views Over 30 Days"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.dailyViews}>
                <defs>
                  <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} className="text-muted-foreground" />
                <YAxis tick={{ fontSize: 10 }} className="text-muted-foreground" />
                <Tooltip
                  contentStyle={{ borderRadius: "0.75rem", border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }}
                  labelFormatter={(v) => v}
                />
                <Area type="monotone" dataKey="views" stroke="hsl(var(--primary))" fill="url(#viewsGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Charts Row */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* Visitor Type Pie */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              {isAr ? "نوع الزوار" : "Visitor Type"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={visitorTypePie} cx="50%" cy="50%" innerRadius={35} outerRadius={60} paddingAngle={4} dataKey="value">
                    {visitorTypePie.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-3 mt-2">
              {visitorTypePie.map((entry, i) => (
                <div key={entry.name} className="flex items-center gap-1.5 text-xs">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                  {entry.name} ({entry.value})
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Device Breakdown */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Monitor className="h-4 w-4 text-primary" />
              {isAr ? "الأجهزة" : "Devices"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={devicePie} cx="50%" cy="50%" innerRadius={35} outerRadius={60} paddingAngle={4} dataKey="value">
                    {devicePie.map((_, i) => <Cell key={i} fill={CHART_COLORS[(i + 2) % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-3 mt-2">
              {devicePie.map((entry, i) => (
                <div key={entry.name} className="flex items-center gap-1.5 text-xs">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[(i + 2) % CHART_COLORS.length] }} />
                  {entry.name} ({entry.value})
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Visit Times */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              {isAr ? "أوقات الزيارة" : "Visit Times"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourlyData}>
                  <XAxis dataKey="hour" tick={{ fontSize: 8 }} interval={3} />
                  <YAxis tick={{ fontSize: 8 }} />
                  <Tooltip />
                  <Bar dataKey="views" fill="hsl(var(--chart-3))" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Referrers */}
      {referrerData.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" />
              {isAr ? "مصادر الزيارات" : "Traffic Sources"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {referrerData.map((r, i) => (
                <div key={r.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                    <span className="text-sm">{r.name}</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">{r.value}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </StaggeredList>
  );
}
