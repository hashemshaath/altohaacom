import { useMemo, lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { AdminQuickActionsBar } from "@/components/admin/AdminQuickActionsBar";
import { AdminRealtimeNotificationBell } from "@/components/admin/AdminRealtimeNotificationBell";
import { AdminMobileNavGrid } from "@/components/admin/AdminMobileOptimizer";
import { SecurityAlertsBanner } from "@/components/admin/SecurityAlertsBanner";
import { useAdminCacheWarmer } from "@/hooks/useAdminCacheWarmer";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ActivityPulse } from "@/components/ui/activity-pulse";
import { DataFreshness } from "@/components/ui/data-freshness";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { useInViewport } from "@/hooks/useInViewport";
import {
  Users, UserCheck, UserPlus, Flag, Trophy, FileText,
  TrendingUp, ArrowRight, ArrowUpRight, ArrowDownRight,
  Shield, Activity, CreditCard, Landmark, Package,
  GraduationCap, LayoutDashboard, Zap, MessageSquare,
  AlertTriangle, Send, Plus, Settings,
  Heart, ChefHat, Building2,
} from "lucide-react";
import { format, subDays } from "date-fns";
import { cn } from "@/lib/utils";
import { ResponsiveContainer, LineChart, Line } from "recharts";

// Lazy load heavy widgets
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
      {inView ? <Suspense fallback={fallback || <SectionSkeleton />}>{children}</Suspense> : <div className="min-h-[80px]" />}
    </div>
  );
}

function SectionSkeleton() {
  return <div className="space-y-3"><Skeleton className="h-32 w-full rounded-xl" /></div>;
}

export default function AdminDashboard() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  useAdminCacheWarmer();

  const { data: stats, isLoading } = useQuery({
    queryKey: ["superAdminStats"],
    queryFn: async () => {
      const [
        { count: totalUsers },
        { count: activeUsers },
        { count: suspendedUsers },
        { count: pendingReports },
        { count: totalCompetitions },
        { count: totalArticles },
        { count: totalMessages },
        { count: totalExhibitions },
        { count: totalOrders },
        { count: totalMasterclasses },
        { count: proUsers },
        { count: fanUsers },
        { count: totalOrganizers },
        { data: recentActions },
        { data: recentUsers },
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
        supabase.from("admin_actions").select("id, action_type, created_at").order("created_at", { ascending: false }).limit(5),
        supabase.from("profiles").select("id, full_name, display_name, username, avatar_url, created_at").order("created_at", { ascending: false }).limit(5),
      ]);

      return {
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        suspendedUsers: suspendedUsers || 0,
        pendingReports: pendingReports || 0,
        totalCompetitions: totalCompetitions || 0,
        totalArticles: totalArticles || 0,
        totalMessages: totalMessages || 0,
        totalExhibitions: totalExhibitions || 0,
        totalOrders: totalOrders || 0,
        totalMasterclasses: totalMasterclasses || 0,
        proUsers: proUsers || 0,
        fanUsers: fanUsers || 0,
        totalOrganizers: totalOrganizers || 0,
        recentActions: recentActions || [],
        recentUsers: recentUsers || [],
      };
    },
    staleTime: 1000 * 60 * 3,
  });

  const { data: todayStats } = useQuery({
    queryKey: ["admin-today-stats"],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();
      const [newUsers, newPosts, newOrders, newReports] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", todayISO),
        supabase.from("posts").select("*", { count: "exact", head: true }).gte("created_at", todayISO),
        supabase.from("company_orders").select("*", { count: "exact", head: true }).gte("created_at", todayISO),
        supabase.from("content_reports").select("*", { count: "exact", head: true }).gte("created_at", todayISO),
      ]);
      return {
        newUsers: newUsers.count || 0,
        newPosts: newPosts.count || 0,
        newOrders: newOrders.count || 0,
        newReports: newReports.count || 0,
      };
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

  const sparklineKeys: Record<string, string> = {
    "Total Users": "users", "إجمالي المستخدمين": "users",
    "Competitions": "comps", "المسابقات": "comps",
    "Exhibitions": "exhibitions", "المعارض": "exhibitions",
    "Articles": "articles", "المقالات": "articles",
  };

  const statCards = useMemo(() => [
    { title: isAr ? "إجمالي المستخدمين" : "Total Users", value: stats?.totalUsers || 0, icon: Users, bg: "bg-primary/10", color: "text-primary", chartColor: "hsl(var(--primary))", link: "/admin/users" },
    { title: isAr ? "المستخدمين النشطين" : "Active Users", value: stats?.activeUsers || 0, icon: UserCheck, bg: "bg-chart-5/10", color: "text-chart-5", chartColor: "hsl(var(--chart-5))", link: "/admin/users?status=active" },
    { title: isAr ? "تقارير معلقة" : "Pending Reports", value: stats?.pendingReports || 0, icon: Flag, bg: "bg-destructive/10", color: "text-destructive", chartColor: "hsl(var(--destructive))", link: "/admin/moderation", urgent: (stats?.pendingReports || 0) > 0 },
    { title: isAr ? "المسابقات" : "Competitions", value: stats?.totalCompetitions || 0, icon: Trophy, bg: "bg-chart-2/10", color: "text-chart-2", chartColor: "hsl(var(--chart-2))", link: "/admin/competitions" },
    { title: isAr ? "المعارض" : "Exhibitions", value: stats?.totalExhibitions || 0, icon: Landmark, bg: "bg-chart-3/10", color: "text-chart-3", chartColor: "hsl(var(--chart-3))", link: "/admin/exhibitions" },
    { title: isAr ? "المنظمون" : "Organizers", value: stats?.totalOrganizers || 0, icon: Building2, bg: "bg-chart-4/10", color: "text-chart-4", chartColor: "hsl(var(--chart-4))", link: "/admin/organizers" },
    { title: isAr ? "الدورات" : "Masterclasses", value: stats?.totalMasterclasses || 0, icon: GraduationCap, bg: "bg-accent/10", color: "text-accent", chartColor: "hsl(var(--accent))", link: "/admin/masterclasses" },
    { title: isAr ? "المقالات" : "Articles", value: stats?.totalArticles || 0, icon: FileText, bg: "bg-chart-1/10", color: "text-chart-1", chartColor: "hsl(var(--chart-1))", link: "/admin/articles" },
    { title: isAr ? "الطلبات" : "Orders", value: stats?.totalOrders || 0, icon: Package, bg: "bg-chart-5/10", color: "text-chart-5", chartColor: "hsl(var(--chart-5))", link: "/admin/orders" },
  ], [stats, isAr]);

  const quickActions = useMemo(() => [
    { title: isAr ? "إدارة المستخدمين" : "Users", icon: Users, link: "/admin/users" },
    { title: isAr ? "المنظمون" : "Organizers", icon: Building2, link: "/admin/organizers" },
    { title: isAr ? "إدارة الأدوار" : "Roles", icon: Shield, link: "/admin/roles" },
    { title: isAr ? "العضويات" : "Memberships", icon: CreditCard, link: "/admin/memberships" },
    { title: isAr ? "مراجعة المحتوى" : "Moderation", icon: Flag, link: "/admin/moderation", badge: stats?.pendingReports },
    { title: isAr ? "مسابقة جديدة" : "New Competition", icon: Plus, link: "/admin/competitions" },
    { title: isAr ? "إرسال إشعار" : "Notifications", icon: MessageSquare, link: "/admin/notifications" },
    { title: isAr ? "الإعدادات" : "Settings", icon: Settings, link: "/admin/settings" },
  ], [isAr, stats?.pendingReports]);

  const getActionBadge = (actionType: string) => {
    const colors: Record<string, string> = {
      suspend_user: "bg-destructive/10 text-destructive border-destructive/20",
      active_user: "bg-primary/10 text-primary border-primary/20",
      banned_user: "bg-destructive/10 text-destructive border-destructive/20",
      change_membership: "bg-accent/20 text-accent-foreground border-accent/20",
      resolve_report: "bg-secondary text-secondary-foreground border-border",
      update_roles: "bg-muted text-muted-foreground border-border",
      update_profile: "bg-muted text-muted-foreground border-border",
    };
    return (
      <Badge className={colors[actionType] || "bg-muted text-muted-foreground"} variant="outline">
        {actionType.replace(/_/g, " ")}
      </Badge>
    );
  };

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return isAr ? "صباح الخير" : "Good morning";
    if (hour < 17) return isAr ? "مساء الخير" : "Good afternoon";
    return isAr ? "مساء الخير" : "Good evening";
  }, [isAr]);

  return (
    <div className="space-y-5 pb-20 md:pb-0">
      {/* Page Header — with greeting */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
              <LayoutDashboard className="h-4.5 w-4.5 text-primary" />
            </div>
            {greeting} 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isAr ? "نظرة شاملة على المنصة" : "Platform overview at a glance"} · {format(new Date(), "EEEE, MMM d")}
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <ActivityPulse status="live" label={isAr ? "مباشر" : "Live"} size="md" />
          <AdminRealtimeNotificationBell />
        </div>
      </div>

      {/* Security Alerts */}
      <SecurityAlertsBanner />

      {/* Mobile Nav Grid */}
      <AdminMobileNavGrid />

      {/* ── Stats Grid ── */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const sparkKey = sparklineKeys[stat.title];
          const sparkPoints = sparkKey && sparkData ? sparkData.map((d) => ({ v: d[sparkKey] || 0 })) : null;
          const trend = sparkPoints && sparkPoints.length >= 2 ? sparkPoints[sparkPoints.length - 1].v - sparkPoints[0].v : 0;

          return (
            <Link key={stat.title} to={stat.link}>
               <Card className={cn(
                "group overflow-hidden transition-all duration-200 hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5 rounded-xl border-border/50",
                stat.urgent && "ring-1 ring-destructive/30 border-destructive/20"
              )}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      {isLoading ? (
                        <Skeleton className="h-7 w-16 mb-1.5 rounded" />
                      ) : (
                        <p className="text-2xl font-bold tracking-tight tabular-nums">
                          <AnimatedCounter value={stat.value} />
                        </p>
                      )}
                      <p className="text-[11px] text-muted-foreground font-medium mt-1">{stat.title}</p>
                    </div>
                    <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-200 group-hover:scale-110", stat.bg)}>
                      <stat.icon className={cn("h-4 w-4", stat.color)} />
                    </div>
                  </div>
                  {sparkPoints && sparkPoints.length > 0 && (
                    <div className="mt-3 -mx-1 flex items-center gap-2">
                      <div className="flex-1 opacity-40 group-hover:opacity-100 transition-opacity duration-300">
                        <ResponsiveContainer width="100%" height={28}>
                          <LineChart data={sparkPoints}>
                            <Line type="monotone" dataKey="v" stroke={stat.chartColor} strokeWidth={1.5} dot={false} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                      {trend !== 0 && (
                        <span className={cn("text-[10px] font-semibold tabular-nums flex items-center gap-0.5",
                          trend > 0 ? "text-chart-5" : "text-destructive"
                        )}>
                          {trend > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                          {Math.abs(trend)}
                        </span>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <DataFreshness lastUpdated={stats ? new Date() : null} isRefetching={isLoading} />

      {/* ── Quick Actions + Today's Activity ── */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Quick Actions */}
        <Card className="lg:col-span-2 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              {isAr ? "إجراءات سريعة" : "Quick Actions"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {quickActions.map((action) => (
                <Link key={action.title} to={action.link}>
                  <div className="group relative flex flex-col items-center gap-2 rounded-xl border border-border/40 p-3 text-center transition-all duration-200 hover:bg-muted/50 hover:border-primary/20 active:scale-95">
                    <action.icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    <span className="text-[11px] font-medium text-muted-foreground group-hover:text-foreground transition-colors leading-tight">{action.title}</span>
                    {action.badge && action.badge > 0 && (
                      <Badge variant="destructive" className="absolute -top-1.5 -end-1.5 text-[9px] h-4 min-w-4 px-1">{action.badge}</Badge>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Today's Activity */}
        <Card className="rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Activity className="h-4 w-4 text-accent" />
              {isAr ? "نشاط اليوم" : "Today"}
              <ActivityPulse status="live" className="ms-auto" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: isAr ? "مستخدمون جدد" : "New Users", value: todayStats?.newUsers || 0, icon: UserPlus, color: "text-primary" },
                { label: isAr ? "منشورات" : "Posts", value: todayStats?.newPosts || 0, icon: MessageSquare, color: "text-chart-2" },
                { label: isAr ? "طلبات" : "Orders", value: todayStats?.newOrders || 0, icon: Package, color: "text-chart-3" },
                { label: isAr ? "بلاغات" : "Reports", value: todayStats?.newReports || 0, icon: AlertTriangle, color: todayStats?.newReports ? "text-destructive" : "text-muted-foreground" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2.5 rounded-lg border border-border/30 p-2.5">
                  <item.icon className={cn("h-4 w-4 shrink-0", item.color)} />
                  <div>
                    <p className={cn("text-base font-bold tabular-nums leading-none", item.color)}>
                      <AnimatedCounter value={Number(item.value) || 0} className="inline" />
                    </p>
                    <p className="text-[9px] text-muted-foreground mt-0.5 font-medium">{item.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions Bar */}
      <AdminQuickActionsBar pendingReports={stats?.pendingReports} />

      {/* Command Bar */}
      <Suspense fallback={null}><AdminCommandBar /></Suspense>

      {/* ── Pending Actions + Account Types + System Health ── */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <AdminPendingActionsWidget />
        </div>

        {/* Account Type Breakdown + System Health */}
        <div className="space-y-4">
          <Card className="rounded-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Users className="h-4 w-4 text-chart-3" />
                {isAr ? "أنواع الحسابات" : "Account Types"}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                {[
                  { label: isAr ? "محترف" : "Professional", value: stats?.proUsers || 0, icon: ChefHat, color: "text-primary", bg: "bg-primary" },
                  { label: isAr ? "مستخدم عادي" : "Regular User", value: stats?.fanUsers || 0, icon: Heart, color: "text-chart-4", bg: "bg-chart-4" },
                ].map((type) => {
                  const pct = stats?.totalUsers ? Math.round((type.value / stats.totalUsers) * 100) : 0;
                  return (
                    <div key={type.label} className="flex items-center gap-3">
                      <type.icon className={cn("h-4 w-4 shrink-0", type.color)} />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium">{type.label}</span>
                          <span className={cn("text-sm font-bold tabular-nums", type.color)}>
                            <AnimatedCounter value={type.value} />
                            <span className="text-[10px] text-muted-foreground ms-1">{pct}%</span>
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <div className={cn("h-full rounded-full transition-all duration-700", type.bg)} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* System Health Pulse */}
          <Card className="rounded-xl border-chart-5/20 bg-chart-5/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-chart-5/15">
                    <Shield className="h-5 w-5 text-chart-5" />
                  </div>
                  <div className="absolute -top-0.5 -end-0.5 h-3 w-3 rounded-full bg-chart-5 border-2 border-background animate-pulse" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-chart-5">{isAr ? "النظام يعمل بشكل طبيعي" : "System Healthy"}</p>
                  <p className="text-[11px] text-muted-foreground">{isAr ? "جميع الخدمات تعمل" : "All services operational"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Lazy Widgets ── */}
      <LazySection><FinanceMembershipWidget /></LazySection>
      <LazySection><ReportsSummaryWidget /></LazySection>
      <LazySection><ShopOrdersOverviewWidget /></LazySection>

      <LazySection>
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          <AdminActivityFeed />
          <AdminModerationQueue />
          <AdminAlertCenter />
        </div>
      </LazySection>

      {/* Recent Actions + Recent Users */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              {isAr ? "آخر الإجراءات" : "Recent Actions"}
            </CardTitle>
            <Button variant="ghost" size="sm" asChild className="text-xs">
              <Link to="/admin/audit">
                {isAr ? "عرض الكل" : "View All"}
                <ArrowRight className="ms-1 h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {stats?.recentActions?.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">{isAr ? "لا توجد إجراءات حديثة" : "No recent actions"}</p>
            ) : (
              <div className="space-y-2">
                {stats?.recentActions?.map((action) => (
                  <div key={action.id} className="flex items-center justify-between rounded-lg border border-border/30 p-2.5">
                    {getActionBadge(action.action_type)}
                    <span className="text-[11px] text-muted-foreground tabular-nums">
                      {format(new Date(action.created_at), "MMM d, HH:mm")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-sm font-semibold">{isAr ? "أحدث المستخدمين" : "Recent Users"}</CardTitle>
              <CardDescription className="text-xs mt-0.5">{isAr ? "آخر المستخدمين المسجلين" : "Latest registered"}</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild className="text-xs">
              <Link to="/admin/users">
                {isAr ? "الكل" : "All"}
                <ArrowRight className="ms-1 h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats?.recentUsers?.map((user) => (
                <Link key={user.id} to={`/${user.username || user.id}`} className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted/50">
                  <div className="h-8 w-8 shrink-0 rounded-full overflow-hidden bg-primary/10">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt="" className="h-full w-full object-cover" loading="lazy" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-primary text-xs font-semibold">
                        {(user.display_name || user.full_name || "U")[0].toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{user.display_name || user.full_name || "Unknown"}</p>
                    <p className="text-[10px] text-muted-foreground tabular-nums">{format(new Date(user.created_at), "MMM d, yyyy")}</p>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <LazySection><CompanyDashboardWidget /></LazySection>
      <LazySection><DedupDashboardWidget /></LazySection>
      <LazySection><DataQualityDashboardWidget /></LazySection>
    </div>
  );
}
