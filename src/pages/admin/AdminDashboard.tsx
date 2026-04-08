import { useMemo, lazy, Suspense, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { AdminRealtimeNotificationBell } from "@/components/admin/AdminRealtimeNotificationBell";
import { SecurityAlertsBanner } from "@/components/admin/SecurityAlertsBanner";
import { useAdminCacheWarmer } from "@/hooks/useAdminCacheWarmer";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useInViewport } from "@/hooks/useInViewport";
import {
  Users, UserCheck, UserPlus, Flag, Trophy, FileText, Calendar,
  TrendingUp, ArrowRight, ArrowUpRight, ArrowDownRight,
  Shield, Activity, Package, GraduationCap, LayoutDashboard,
  Zap, MessageSquare, AlertTriangle, Settings,
  Heart, ChefHat, Building2, Landmark, BarChart3,
  Clock, Eye, Globe,
} from "lucide-react";
import { format, subDays } from "date-fns";
import { cn } from "@/lib/utils";
import { ResponsiveContainer, AreaChart, Area } from "recharts";
import { GrowthAreaChart, DonutChart, ComparisonBarChart, ActivityHeatmap } from "@/components/admin/AdminDashboardCharts";

const AdminActivityFeed = lazy(() => import("@/components/admin/AdminActivityFeed").then(m => ({ default: m.AdminActivityFeed })));
const AdminModerationQueue = lazy(() => import("@/components/admin/AdminModerationQueue").then(m => ({ default: m.AdminModerationQueue })));
const AdminPendingActionsWidget = lazy(() => import("@/components/admin/AdminPendingActionsWidget").then(m => ({ default: m.AdminPendingActionsWidget })));
const AdminAlertCenter = lazy(() => import("@/components/admin/AdminAlertCenter").then(m => ({ default: m.AdminAlertCenter })));
const CompanyDashboardWidget = lazy(() => import("@/components/admin/CompanyDashboardWidget").then(m => ({ default: m.CompanyDashboardWidget })));
const FinanceMembershipWidget = lazy(() => import("@/components/admin/FinanceMembershipWidget").then(m => ({ default: m.FinanceMembershipWidget })));
const DedupDashboardWidget = lazy(() => import("@/components/admin/DedupDashboardWidget").then(m => ({ default: m.DedupDashboardWidget })));
const DataQualityDashboardWidget = lazy(() => import("@/components/admin/DataQualityDashboardWidget").then(m => ({ default: m.DataQualityDashboardWidget })));
const ReportsSummaryWidget = lazy(() => import("@/components/admin/ReportsSummaryWidget").then(m => ({ default: m.ReportsSummaryWidget })));
const ShopOrdersOverviewWidget = lazy(() => import("@/components/admin/ShopOrdersOverviewWidget").then(m => ({ default: m.ShopOrdersOverviewWidget })));
const AdminCommandBar = lazy(() => import("@/components/admin/AdminCommandBar").then(m => ({ default: m.AdminCommandBar })));

function LazySection({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  const { ref, inView } = useInViewport("400px 0px");
  return (
    <div ref={ref}>
      {inView ? <Suspense fallback={fallback || <Skeleton className="h-32 w-full rounded-lg" />}>{children}</Suspense> : <div className="min-h-[80px]" />}
    </div>
  );
}

/* ─── Metric Card ─── */
function MetricCard({ title, value, icon: Icon, trend, sparkData, chartColor, link, loading, urgent }: {
  title: string; value: number; icon: any; trend?: number; sparkData?: { v: number }[];
  chartColor?: string; link: string; loading?: boolean; urgent?: boolean;
}) {
  return (
    <Link to={link}>
      <div className={cn(
        "group relative rounded-lg border border-border/50 bg-card p-4 transition-all duration-150 hover:border-border hover:bg-accent/5",
        urgent && "border-destructive/40"
      )}>
        <div className="flex items-center justify-between mb-3">
          <Icon className="h-4 w-4 text-muted-foreground" />
          {trend !== undefined && trend !== 0 && (
            <span className={cn("text-[11px] font-mono font-medium flex items-center gap-0.5",
              trend > 0 ? "text-chart-5" : "text-destructive"
            )}>
              {trend > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {trend > 0 ? "+" : ""}{trend}
            </span>
          )}
        </div>
        {loading ? (
          <Skeleton className="h-8 w-16 rounded mb-1" />
        ) : (
          <p className="text-2xl font-semibold tracking-tight tabular-nums text-foreground">
            <AnimatedCounter value={value} />
          </p>
        )}
        <p className="text-[12px] text-muted-foreground mt-0.5">{title}</p>
        {sparkData && sparkData.length > 0 && chartColor && (
          <div className="mt-2 -mx-1 opacity-40 group-hover:opacity-70 transition-opacity">
            <ResponsiveContainer width="100%" height={24}>
              <AreaChart data={sparkData}>
                <defs>
                  <linearGradient id={`g-${title.replace(/\s/g, "")}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={chartColor} stopOpacity={0.2} />
                    <stop offset="100%" stopColor={chartColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="v" stroke={chartColor} strokeWidth={1.2} fill={`url(#g-${title.replace(/\s/g, "")})`} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </Link>
  );
}

/* ─── Main ─── */
export default function AdminDashboard() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [activeTab, setActiveTab] = useState("overview");
  useAdminCacheWarmer();

  const { data: stats, isLoading } = useQuery({
    queryKey: ["superAdminStats"],
    queryFn: async () => {
      const [
        { count: totalUsers }, { count: activeUsers }, { count: suspendedUsers },
        { count: pendingReports }, { count: totalCompetitions }, { count: totalArticles },
        { count: totalMessages }, { count: totalExhibitions }, { count: totalOrders },
        { count: totalMasterclasses }, { count: proUsers }, { count: fanUsers },
        { count: totalOrganizers }, { data: recentActions }, { data: recentUsers },
      ] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("account_status", "active"),
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("account_status", "suspended"),
        supabase.from("content_reports").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("competitions").select("*", { count: "exact", head: true }),
        supabase.from("articles").select("*", { count: "exact", head: true }),
        supabase.from("messages").select("*", { count: "exact", head: true }),
        supabase.from("exhibitions").select("*", { count: "exact", head: true }),
        supabase.from("company_orders").select("*", { count: "exact", head: true }),
        supabase.from("masterclasses").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("account_type", "professional"),
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("account_type", "fan"),
        supabase.from("organizers").select("*", { count: "exact", head: true }),
        supabase.from("admin_actions").select("id, action_type, created_at").order("created_at", { ascending: false }).limit(8),
        supabase.from("profiles").select("id, full_name, display_name, username, avatar_url, created_at, account_type").order("created_at", { ascending: false }).limit(8),
      ]);
      return {
        totalUsers: totalUsers || 0, activeUsers: activeUsers || 0, suspendedUsers: suspendedUsers || 0,
        pendingReports: pendingReports || 0, totalCompetitions: totalCompetitions || 0, totalArticles: totalArticles || 0,
        totalMessages: totalMessages || 0, totalExhibitions: totalExhibitions || 0, totalOrders: totalOrders || 0,
        totalMasterclasses: totalMasterclasses || 0, proUsers: proUsers || 0, fanUsers: fanUsers || 0,
        totalOrganizers: totalOrganizers || 0, recentActions: recentActions || [], recentUsers: recentUsers || [],
      };
    },
    staleTime: 1000 * 60 * 3,
  });

  const { data: todayStats } = useQuery({
    queryKey: ["admin-today-stats"],
    queryFn: async () => {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();
      const [newUsers, newPosts, newOrders, newReports] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", todayISO),
        supabase.from("posts").select("*", { count: "exact", head: true }).gte("created_at", todayISO),
        supabase.from("company_orders").select("*", { count: "exact", head: true }).gte("created_at", todayISO),
        supabase.from("content_reports").select("*", { count: "exact", head: true }).gte("created_at", todayISO),
      ]);
      return { newUsers: newUsers.count || 0, newPosts: newPosts.count || 0, newOrders: newOrders.count || 0, newReports: newReports.count || 0 };
    },
    staleTime: 1000 * 60 * 3,
  });

  const { data: sparkData } = useQuery({
    queryKey: ["admin-sparkline-7d-optimized"],
    queryFn: async () => {
      const tables = ["profiles", "competitions", "exhibitions", "articles"] as const;
      const keys = ["users", "comps", "exhibitions", "articles"] as const;
      const ranges: { start: string; end: string; day: string }[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = subDays(new Date(), i);
        const start = new Date(d); start.setHours(0, 0, 0, 0);
        const end = new Date(d); end.setHours(23, 59, 59, 999);
        ranges.push({ start: start.toISOString(), end: end.toISOString(), day: format(d, "EEE") });
      }
      const fullStart = ranges[0].start;
      const fullEnd = ranges[ranges.length - 1].end;
      const tableData = await Promise.all(
        tables.map((table) =>
          supabase.from(table).select("created_at", { count: "exact" }).gte("created_at", fullStart).lte("created_at", fullEnd).order("created_at", { ascending: true }).limit(500).then(({ data }) => data || [])
        )
      );
      return ranges.map((range) => {
        const row: Record<string, any> = { day: range.day };
        tables.forEach((_, ti) => {
          row[keys[ti]] = tableData[ti].filter((r) => r.created_at >= range.start && r.created_at <= range.end).length;
        });
        return row;
      });
    },
    staleTime: 1000 * 60 * 10,
  });

  const { data: upcomingEvents } = useQuery({
    queryKey: ["admin-upcoming-events-preview"],
    queryFn: async () => {
      const now = new Date().toISOString();
      const [{ data: exh }, { data: comp }] = await Promise.all([
        supabase.from("exhibitions").select("id, title, title_ar, start_date, end_date, city, country, status, slug, edition_year")
          .gte("start_date", now).in("status", ["upcoming", "active"]).order("start_date").limit(6),
        supabase.from("competitions").select("id, title, title_ar, competition_start, competition_end, city, country, status, edition_year")
          .gte("competition_start", now).in("status", ["upcoming", "registration_open", "in_progress"]).order("competition_start").limit(6),
      ]);
      return [
        ...(exh || []).map(e => ({ ...e, type: "exhibition" as const, date: e.start_date, link: `/admin/exhibitions` })),
        ...(comp || []).map(c => ({ ...c, type: "competition" as const, date: c.competition_start, link: `/admin/competitions` })),
      ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(0, 8);
    },
    staleTime: 1000 * 60 * 5,
  });

  // Activity heatmap data (based on posts creation times over last 4 weeks)
  const { data: heatmapData } = useQuery({
    queryKey: ["admin-activity-heatmap"],
    queryFn: async () => {
      const since = subDays(new Date(), 28).toISOString();
      const { data: posts } = await supabase
        .from("posts").select("created_at").gte("created_at", since).limit(500);
      const { data: users } = await supabase
        .from("profiles").select("created_at").gte("created_at", since).limit(500);
      const all = [...(posts || []), ...(users || [])];
      const grid: { day: number; hour: number; value: number }[] = [];
      for (let d = 0; d < 7; d++) {
        for (let h = 0; h < 24; h++) {
          grid.push({ day: d, hour: h, value: 0 });
        }
      }
      all.forEach((item) => {
        const date = new Date(item.created_at);
        const day = (date.getDay() + 6) % 7; // Mon=0
        const hour = date.getHours();
        const cell = grid.find(c => c.day === day && c.hour === hour);
        if (cell) cell.value++;
      });
      return grid;
    },
    staleTime: 1000 * 60 * 15,
  });

  const getSparkPoints = (key: string) => sparkData?.map((d) => ({ v: d[key] || 0 })) || [];
  const getTrend = (key: string) => {
    const pts = getSparkPoints(key);
    return pts.length >= 2 ? pts[pts.length - 1].v - pts[0].v : 0;
  };

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return isAr ? "صباح الخير" : "Good morning";
    if (hour < 17) return isAr ? "مساء الخير" : "Good afternoon";
    return isAr ? "مساء الخير" : "Good evening";
  }, [isAr]);

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* ═══ Header ═══ */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-foreground">
            {greeting} 👋
          </h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            {format(new Date(), "EEEE, MMM d, yyyy")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-border/50 px-2.5 py-1">
            <div className="h-1.5 w-1.5 rounded-full bg-chart-5 animate-pulse" />
            <span className="text-[11px] text-muted-foreground font-medium">{isAr ? "مباشر" : "Live"}</span>
          </div>
          <AdminRealtimeNotificationBell />
        </div>
      </div>

      <SecurityAlertsBanner />

      {/* ═══ Tabs ═══ */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="h-9 w-full justify-start rounded-lg bg-muted/50 p-0.5 gap-0.5">
          <TabsTrigger value="overview" className="rounded-md text-xs font-medium px-3 data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <LayoutDashboard className="h-3.5 w-3.5 me-1.5" />
            {isAr ? "نظرة عامة" : "Overview"}
          </TabsTrigger>
          <TabsTrigger value="users" className="rounded-md text-xs font-medium px-3 data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Users className="h-3.5 w-3.5 me-1.5" />
            {isAr ? "المستخدمين" : "Users"}
          </TabsTrigger>
          <TabsTrigger value="events" className="rounded-md text-xs font-medium px-3 data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Calendar className="h-3.5 w-3.5 me-1.5" />
            {isAr ? "الفعاليات" : "Events"}
          </TabsTrigger>
          <TabsTrigger value="reports" className="rounded-md text-xs font-medium px-3 data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <BarChart3 className="h-3.5 w-3.5 me-1.5" />
            {isAr ? "التقارير" : "Reports"}
          </TabsTrigger>
        </TabsList>

        {/* ════════════ OVERVIEW TAB ════════════ */}
        <TabsContent value="overview" className="mt-5 space-y-5">
          {/* KPI Grid */}
          <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
            <MetricCard title={isAr ? "المستخدمون" : "Users"} value={stats?.totalUsers || 0} icon={Users} trend={getTrend("users")} sparkData={getSparkPoints("users")} chartColor="hsl(var(--primary))" link="/admin/users" loading={isLoading} />
            <MetricCard title={isAr ? "نشط" : "Active"} value={stats?.activeUsers || 0} icon={UserCheck} link="/admin/users?status=active" loading={isLoading} />
            <MetricCard title={isAr ? "البلاغات" : "Reports"} value={stats?.pendingReports || 0} icon={Flag} link="/admin/moderation" loading={isLoading} urgent={(stats?.pendingReports || 0) > 0} />
            <MetricCard title={isAr ? "المسابقات" : "Competitions"} value={stats?.totalCompetitions || 0} icon={Trophy} trend={getTrend("comps")} sparkData={getSparkPoints("comps")} chartColor="hsl(var(--chart-2))" link="/admin/competitions" loading={isLoading} />
            <MetricCard title={isAr ? "المعارض" : "Exhibitions"} value={stats?.totalExhibitions || 0} icon={Landmark} trend={getTrend("exhibitions")} sparkData={getSparkPoints("exhibitions")} chartColor="hsl(var(--chart-3))" link="/admin/exhibitions" loading={isLoading} />
            <MetricCard title={isAr ? "المقالات" : "Articles"} value={stats?.totalArticles || 0} icon={FileText} trend={getTrend("articles")} sparkData={getSparkPoints("articles")} chartColor="hsl(var(--chart-1))" link="/admin/articles" loading={isLoading} />
          </div>

          {/* Today strip */}
          <div className="flex items-center gap-3 overflow-x-auto pb-1">
            <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground shrink-0">
              <Clock className="h-3.5 w-3.5" />
              <span className="font-medium">{isAr ? "اليوم" : "Today"}</span>
            </div>
            <div className="h-4 w-px bg-border shrink-0" />
            {[
              { label: isAr ? "مستخدمون جدد" : "New users", value: todayStats?.newUsers || 0, color: "text-foreground" },
              { label: isAr ? "منشورات" : "Posts", value: todayStats?.newPosts || 0, color: "text-foreground" },
              { label: isAr ? "طلبات" : "Orders", value: todayStats?.newOrders || 0, color: "text-foreground" },
              { label: isAr ? "بلاغات" : "Reports", value: todayStats?.newReports || 0, color: todayStats?.newReports ? "text-destructive" : "text-foreground" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-1.5 shrink-0">
                <span className={cn("text-sm font-semibold tabular-nums", item.color)}>{item.value}</span>
                <span className="text-[11px] text-muted-foreground">{item.label}</span>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div>
            <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider mb-2.5">
              {isAr ? "وصول سريع" : "Quick access"}
            </p>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {[
                { title: isAr ? "المستخدمون" : "Users", icon: Users, link: "/admin/users" },
                { title: isAr ? "المنظمون" : "Organizers", icon: Building2, link: "/admin/organizers" },
                { title: isAr ? "المعارض" : "Exhibitions", icon: Landmark, link: "/admin/exhibitions" },
                { title: isAr ? "المسابقات" : "Competitions", icon: Trophy, link: "/admin/competitions" },
                { title: isAr ? "الأدوار" : "Roles", icon: Shield, link: "/admin/roles" },
                { title: isAr ? "المراجعة" : "Moderation", icon: Flag, link: "/admin/moderation", badge: stats?.pendingReports },
                { title: isAr ? "الإشعارات" : "Notifications", icon: MessageSquare, link: "/admin/notifications" },
                { title: isAr ? "الإعدادات" : "Settings", icon: Settings, link: "/admin/settings" },
              ].map((action) => (
                <Link key={action.title} to={action.link}>
                  <div className="group relative flex flex-col items-center gap-1.5 rounded-lg border border-border/40 p-3 text-center transition-all hover:border-border hover:bg-accent/5 active:scale-[0.97]">
                    <action.icon className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                    <span className="text-[10px] font-medium text-muted-foreground group-hover:text-foreground transition-colors leading-tight">{action.title}</span>
                    {action.badge && action.badge > 0 && (
                      <span className="absolute -top-1 -end-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground px-1">{action.badge}</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* ── Charts Row ── */}
          {sparkData && sparkData.length > 0 && (
            <div className="grid gap-4 lg:grid-cols-2">
              <GrowthAreaChart
                title={isAr ? "نمو المنصة — آخر 7 أيام" : "Platform Growth — Last 7 Days"}
                data={sparkData}
                lines={[
                  { key: "users", name: isAr ? "المستخدمين" : "Users", color: "hsl(var(--primary))" },
                  { key: "articles", name: isAr ? "المقالات" : "Articles", color: "hsl(var(--chart-1))" },
                  { key: "comps", name: isAr ? "المسابقات" : "Competitions", color: "hsl(var(--chart-2))" },
                ]}
              />
              <DonutChart
                title={isAr ? "توزيع المحتوى" : "Content Distribution"}
                data={[
                  { name: isAr ? "المسابقات" : "Competitions", value: stats?.totalCompetitions || 0, color: "hsl(var(--chart-2))" },
                  { name: isAr ? "المعارض" : "Exhibitions", value: stats?.totalExhibitions || 0, color: "hsl(var(--chart-3))" },
                  { name: isAr ? "المقالات" : "Articles", value: stats?.totalArticles || 0, color: "hsl(var(--chart-1))" },
                  { name: isAr ? "الدورات" : "Masterclasses", value: stats?.totalMasterclasses || 0, color: "hsl(var(--chart-4))" },
                ]}
              />
            </div>
          )}

          {heatmapData && heatmapData.length > 0 && (
            <ActivityHeatmap
              title={isAr ? "خريطة النشاط — آخر 4 أسابيع" : "Activity Heatmap — Last 4 Weeks"}
              data={heatmapData}
            />
          )}


          <div className="grid gap-4 lg:grid-cols-5">
            {/* Events Preview */}
            <div className="lg:col-span-3">
              <div className="flex items-center justify-between mb-2.5">
                <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider">{isAr ? "الفعاليات القادمة" : "Upcoming events"}</p>
                <Button variant="ghost" size="sm" className="text-[11px] h-6 px-2 text-muted-foreground hover:text-foreground" asChild>
                  <Link to="/admin/exhibitions">{isAr ? "عرض الكل" : "View all"} <ArrowRight className="ms-1 h-3 w-3" /></Link>
                </Button>
              </div>
              {upcomingEvents && upcomingEvents.length > 0 ? (
                <div className="space-y-1">
                  {upcomingEvents.slice(0, 5).map((ev) => (
                    <Link key={ev.id} to={ev.link}>
                      <div className="group flex items-center gap-3 rounded-lg border border-border/30 p-3 transition-all hover:border-border hover:bg-accent/5">
                        <div className="flex flex-col items-center rounded-md bg-muted/50 px-2.5 py-1.5 text-center min-w-[44px]">
                          <span className="text-[10px] font-medium text-muted-foreground uppercase">{format(new Date(ev.date), "MMM")}</span>
                          <span className="text-base font-semibold text-foreground leading-none">{format(new Date(ev.date), "d")}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                            {(() => {
                              const title = isAr ? ((ev as any).title_ar || ev.title) : ev.title;
                              const year = (ev as any).edition_year;
                              if (!year || title.includes(String(year))) return title;
                              return `${title} ${year}`;
                            })()}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[11px] text-muted-foreground capitalize">{ev.type === "competition" ? (isAr ? "مسابقة" : "competition") : (isAr ? "معرض" : "exhibition")}</span>
                            {(ev as any).city && (
                              <>
                                <span className="text-muted-foreground/30">·</span>
                                <span className="text-[11px] text-muted-foreground truncate">{(ev as any).city}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors shrink-0" />
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-border/50 p-8 text-center">
                  <Calendar className="h-5 w-5 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">{isAr ? "لا توجد فعاليات قادمة" : "No upcoming events"}</p>
                </div>
              )}
            </div>

            {/* Right side: System + Recent Actions */}
            <div className="lg:col-span-2 space-y-4">
              {/* System */}
              <div className="rounded-lg border border-border/50 p-4">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="relative">
                    <Shield className="h-4 w-4 text-chart-5" />
                    <div className="absolute -top-0.5 -end-0.5 h-2 w-2 rounded-full bg-chart-5 animate-pulse" />
                  </div>
                  <span className="text-sm font-medium">{isAr ? "حالة النظام" : "System status"}</span>
                </div>
                <div className="space-y-2">
                  {[
                    { label: isAr ? "الخدمات" : "Services", status: isAr ? "تعمل" : "Operational" },
                    { label: isAr ? "قاعدة البيانات" : "Database", status: isAr ? "متصلة" : "Connected" },
                    { label: isAr ? "التخزين" : "Storage", status: isAr ? "متاح" : "Available" },
                  ].map((s) => (
                    <div key={s.label} className="flex items-center justify-between">
                      <span className="text-[12px] text-muted-foreground">{s.label}</span>
                      <div className="flex items-center gap-1.5">
                        <div className="h-1.5 w-1.5 rounded-full bg-chart-5" />
                        <span className="text-[11px] font-medium text-chart-5">{s.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Secondary stats */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: isAr ? "المنظمون" : "Organizers", value: stats?.totalOrganizers || 0, icon: Building2 },
                  { label: isAr ? "الدورات" : "Classes", value: stats?.totalMasterclasses || 0, icon: GraduationCap },
                  { label: isAr ? "الطلبات" : "Orders", value: stats?.totalOrders || 0, icon: Package },
                  { label: isAr ? "الرسائل" : "Messages", value: stats?.totalMessages || 0, icon: MessageSquare },
                ].map((s) => (
                  <div key={s.label} className="rounded-lg border border-border/30 p-2.5">
                    <s.icon className="h-3.5 w-3.5 text-muted-foreground mb-1" />
                    <p className="text-base font-semibold tabular-nums">{isLoading ? <Skeleton className="h-4 w-8" /> : <AnimatedCounter value={s.value} />}</p>
                    <p className="text-[10px] text-muted-foreground">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Lazy Widgets */}
          <LazySection><AdminPendingActionsWidget /></LazySection>
          <LazySection><FinanceMembershipWidget /></LazySection>
          <Suspense fallback={null}><AdminCommandBar /></Suspense>
        </TabsContent>

        {/* ════════════ USERS TAB ════════════ */}
        <TabsContent value="users" className="mt-5 space-y-5">
          {/* User KPIs */}
          <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
            <MetricCard title={isAr ? "إجمالي المستخدمين" : "Total Users"} value={stats?.totalUsers || 0} icon={Users} trend={getTrend("users")} sparkData={getSparkPoints("users")} chartColor="hsl(var(--primary))" link="/admin/users" loading={isLoading} />
            <MetricCard title={isAr ? "محترف" : "Professional"} value={stats?.proUsers || 0} icon={ChefHat} link="/admin/users?type=professional" loading={isLoading} />
            <MetricCard title={isAr ? "مستخدم عادي" : "Regular"} value={stats?.fanUsers || 0} icon={Heart} link="/admin/users?type=fan" loading={isLoading} />
            <MetricCard title={isAr ? "موقوف" : "Suspended"} value={stats?.suspendedUsers || 0} icon={AlertTriangle} link="/admin/users?status=suspended" loading={isLoading} urgent={(stats?.suspendedUsers || 0) > 0} />
          </div>

          {/* Account breakdown bar */}
          <div className="rounded-lg border border-border/50 p-4">
            <p className="text-[12px] font-medium text-muted-foreground mb-3">{isAr ? "توزيع الحسابات" : "Account distribution"}</p>
            <div className="flex rounded-full overflow-hidden h-2 bg-muted">
              {stats?.totalUsers && stats.totalUsers > 0 && (
                <>
                  <div className="bg-primary transition-all duration-700" style={{ width: `${(stats.proUsers / stats.totalUsers) * 100}%` }} />
                  <div className="bg-chart-4 transition-all duration-700" style={{ width: `${(stats.fanUsers / stats.totalUsers) * 100}%` }} />
                </>
              )}
            </div>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-primary" />
                <span className="text-[11px] text-muted-foreground">{isAr ? "محترف" : "Pro"} ({stats?.totalUsers ? Math.round((stats.proUsers / stats.totalUsers) * 100) : 0}%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-chart-4" />
                <span className="text-[11px] text-muted-foreground">{isAr ? "عادي" : "Regular"} ({stats?.totalUsers ? Math.round((stats.fanUsers / stats.totalUsers) * 100) : 0}%)</span>
              </div>
            </div>
          </div>

          {/* User Charts */}
          <div className="grid gap-4 lg:grid-cols-2">
            {sparkData && sparkData.length > 0 && (
              <GrowthAreaChart
                title={isAr ? "نمو المستخدمين — آخر 7 أيام" : "User Growth — Last 7 Days"}
                data={sparkData}
                lines={[
                  { key: "users", name: isAr ? "المستخدمين" : "Users", color: "hsl(var(--primary))" },
                ]}
              />
            )}
            <DonutChart
              title={isAr ? "أنواع الحسابات" : "Account Types"}
              data={[
                { name: isAr ? "محترف" : "Professional", value: stats?.proUsers || 0, color: "hsl(var(--primary))" },
                { name: isAr ? "مستخدم عادي" : "Regular", value: stats?.fanUsers || 0, color: "hsl(var(--chart-4))" },
                { name: isAr ? "موقوف" : "Suspended", value: stats?.suspendedUsers || 0, color: "hsl(var(--destructive))" },
              ]}
            />
          </div>

          {/* Recent Users */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider">{isAr ? "أحدث المستخدمين" : "Recent users"}</p>
              <Button variant="ghost" size="sm" className="text-[11px] h-6 px-2 text-muted-foreground" asChild>
                <Link to="/admin/users">{isAr ? "إدارة الكل" : "Manage all"} <ArrowRight className="ms-1 h-3 w-3" /></Link>
              </Button>
            </div>
            <div className="rounded-lg border border-border/50 divide-y divide-border/30">
              {stats?.recentUsers?.map((user) => (
                <Link key={user.id} to={`/${user.username || user.id}`} className="flex items-center gap-3 p-3 transition-colors hover:bg-accent/5">
                  <div className="h-8 w-8 shrink-0 rounded-full overflow-hidden bg-muted">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt="" className="h-full w-full object-cover" loading="lazy" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-muted-foreground text-xs font-medium">
                        {(user.display_name || user.full_name || "U")[0].toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{user.display_name || user.full_name || "Unknown"}</p>
                    <p className="text-[11px] text-muted-foreground">{user.username ? `@${user.username}` : ""}</p>
                  </div>
                  <div className="text-end shrink-0">
                    <Badge variant="outline" className="text-[10px] h-4 font-normal capitalize">{(user as any).account_type || "user"}</Badge>
                    <p className="text-[10px] text-muted-foreground mt-0.5 tabular-nums">{format(new Date(user.created_at), "MMM d")}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <LazySection>
            <div className="grid gap-4 lg:grid-cols-2">
              <AdminActivityFeed />
              <AdminModerationQueue />
            </div>
          </LazySection>
        </TabsContent>

        {/* ════════════ EVENTS TAB ════════════ */}
        <TabsContent value="events" className="mt-5 space-y-5">
          <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
            <MetricCard title={isAr ? "المعارض" : "Exhibitions"} value={stats?.totalExhibitions || 0} icon={Landmark} trend={getTrend("exhibitions")} sparkData={getSparkPoints("exhibitions")} chartColor="hsl(var(--chart-3))" link="/admin/exhibitions" loading={isLoading} />
            <MetricCard title={isAr ? "المسابقات" : "Competitions"} value={stats?.totalCompetitions || 0} icon={Trophy} trend={getTrend("comps")} sparkData={getSparkPoints("comps")} chartColor="hsl(var(--chart-2))" link="/admin/competitions" loading={isLoading} />
            <MetricCard title={isAr ? "المنظمون" : "Organizers"} value={stats?.totalOrganizers || 0} icon={Building2} link="/admin/organizers" loading={isLoading} />
            <MetricCard title={isAr ? "الدورات" : "Masterclasses"} value={stats?.totalMasterclasses || 0} icon={GraduationCap} link="/admin/masterclasses" loading={isLoading} />
          </div>

          {/* Event Charts */}
          <div className="grid gap-4 lg:grid-cols-2">
            {sparkData && sparkData.length > 0 && (
              <ComparisonBarChart
                title={isAr ? "الفعاليات حسب اليوم — آخر أسبوع" : "Events by Day — Last Week"}
                data={sparkData.map(d => ({
                  label: d.day,
                  [isAr ? "معارض" : "Exhibitions"]: d.exhibitions || 0,
                  [isAr ? "مسابقات" : "Competitions"]: d.comps || 0,
                }))}
                bars={[
                  { key: isAr ? "معارض" : "Exhibitions", name: isAr ? "معارض" : "Exhibitions", color: "hsl(var(--chart-3))" },
                  { key: isAr ? "مسابقات" : "Competitions", name: isAr ? "مسابقات" : "Competitions", color: "hsl(var(--chart-2))" },
                ]}
              />
            )}
            <DonutChart
              title={isAr ? "توزيع الفعاليات" : "Events Breakdown"}
              data={[
                { name: isAr ? "المعارض" : "Exhibitions", value: stats?.totalExhibitions || 0, color: "hsl(var(--chart-3))" },
                { name: isAr ? "المسابقات" : "Competitions", value: stats?.totalCompetitions || 0, color: "hsl(var(--chart-2))" },
                { name: isAr ? "الدورات" : "Masterclasses", value: stats?.totalMasterclasses || 0, color: "hsl(var(--chart-4))" },
              ]}
            />
          </div>

          {/* Full events list */}
          <div>
            <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider mb-2.5">{isAr ? "جميع الفعاليات القادمة" : "All upcoming events"}</p>
            {upcomingEvents && upcomingEvents.length > 0 ? (
              <div className="rounded-lg border border-border/50 divide-y divide-border/30">
                {upcomingEvents.map((ev) => (
                  <Link key={ev.id} to={ev.link}>
                    <div className="group flex items-center gap-3 p-3 transition-colors hover:bg-accent/5">
                      <div className="flex flex-col items-center rounded-md bg-muted/50 px-2.5 py-1.5 text-center min-w-[44px]">
                        <span className="text-[10px] font-medium text-muted-foreground uppercase">{format(new Date(ev.date), "MMM")}</span>
                        <span className="text-base font-semibold text-foreground leading-none">{format(new Date(ev.date), "d")}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                          {isAr ? ((ev as any).title_ar || ev.title) : ev.title}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="outline" className="text-[10px] h-4 px-1.5 capitalize">{ev.type === "competition" ? (isAr ? "مسابقة" : "competition") : (isAr ? "معرض" : "exhibition")}</Badge>
                          {(ev as any).city && <span className="text-[11px] text-muted-foreground">{(ev as any).city}{(ev as any).country ? `, ${(ev as any).country}` : ""}</span>}
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[10px] h-4 capitalize shrink-0">{(ev as any).status}</Badge>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-border/50 p-10 text-center">
                <Calendar className="h-5 w-5 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">{isAr ? "لا توجد فعاليات" : "No upcoming events"}</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* ════════════ REPORTS TAB ════════════ */}
        <TabsContent value="reports" className="mt-5 space-y-5">
          <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
            <MetricCard title={isAr ? "بلاغات معلقة" : "Pending Reports"} value={stats?.pendingReports || 0} icon={Flag} link="/admin/moderation" loading={isLoading} urgent={(stats?.pendingReports || 0) > 0} />
            <MetricCard title={isAr ? "الطلبات" : "Orders"} value={stats?.totalOrders || 0} icon={Package} link="/admin/orders" loading={isLoading} />
            <MetricCard title={isAr ? "المقالات" : "Articles"} value={stats?.totalArticles || 0} icon={FileText} link="/admin/articles" loading={isLoading} />
            <MetricCard title={isAr ? "الرسائل" : "Messages"} value={stats?.totalMessages || 0} icon={MessageSquare} link="/admin/notifications" loading={isLoading} />
          </div>

          {/* Recent Actions */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider">{isAr ? "آخر الإجراءات" : "Recent actions"}</p>
              <Button variant="ghost" size="sm" className="text-[11px] h-6 px-2 text-muted-foreground" asChild>
                <Link to="/admin/audit">{isAr ? "سجل التدقيق" : "Audit log"} <ArrowRight className="ms-1 h-3 w-3" /></Link>
              </Button>
            </div>
            {stats?.recentActions && stats.recentActions.length > 0 ? (
              <div className="rounded-lg border border-border/50 divide-y divide-border/30">
                {stats.recentActions.map((action) => (
                  <div key={action.id} className="flex items-center justify-between p-3">
                    <div className="flex items-center gap-2">
                      <Activity className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-sm capitalize">{action.action_type.replace(/_/g, " ")}</span>
                    </div>
                    <span className="text-[11px] text-muted-foreground tabular-nums">{format(new Date(action.created_at), "MMM d, HH:mm")}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-border/50 p-10 text-center">
                <Activity className="h-5 w-5 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">{isAr ? "لا توجد إجراءات" : "No recent actions"}</p>
              </div>
            )}
          </div>

          <LazySection><ReportsSummaryWidget /></LazySection>
          <LazySection><ShopOrdersOverviewWidget /></LazySection>
          <LazySection>
            <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
              <AdminAlertCenter />
              <AdminModerationQueue />
              <AdminActivityFeed />
            </div>
          </LazySection>
          <LazySection><CompanyDashboardWidget /></LazySection>
          <LazySection><DedupDashboardWidget /></LazySection>
          <LazySection><DataQualityDashboardWidget /></LazySection>
        </TabsContent>
      </Tabs>
    </div>
  );
}
