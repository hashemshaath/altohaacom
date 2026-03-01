import { useMemo, lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { useStaggeredReveal } from "@/hooks/useStaggeredAnimation";
import { SystemHealthBar } from "@/components/admin/SystemHealthBar";
import { AdminQuickActionsBar } from "@/components/admin/AdminQuickActionsBar";
import { AdminRealtimeNotificationBell } from "@/components/admin/AdminRealtimeNotificationBell";
import { AdminMobileNavGrid } from "@/components/admin/AdminMobileOptimizer";
import { SecurityAlertsBanner } from "@/components/admin/SecurityAlertsBanner";
import { AdminKeyboardShortcuts, ShortcutHintsCard } from "@/components/admin/AdminKeyboardShortcuts";
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
import { toEnglishDigits } from "@/lib/formatNumber";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { useInViewport } from "@/hooks/useInViewport";
import {
  Users, UserCheck, UserPlus, Flag, Trophy, FileText,
  TrendingUp, ArrowRight, ArrowUpRight, ArrowDownRight,
  Shield, Activity, CreditCard, Landmark, Package,
  GraduationCap, LayoutDashboard, Zap, MessageSquare,
  AlertTriangle, CheckCircle2, Send, Plus, Settings,
  Heart, ChefHat,
} from "lucide-react";
import { format, subDays } from "date-fns";
import { cn } from "@/lib/utils";

// Lazy load ALL heavy widgets - they render far below the fold
const AdminActivityFeed = lazy(() => import("@/components/admin/AdminActivityFeed").then(m => ({ default: m.AdminActivityFeed })));
const AdminModerationQueue = lazy(() => import("@/components/admin/AdminModerationQueue").then(m => ({ default: m.AdminModerationQueue })));
const AdminFinanceOverview = lazy(() => import("@/components/admin/AdminFinanceOverview").then(m => ({ default: m.AdminFinanceOverview })));
const AdminPendingActionsWidget = lazy(() => import("@/components/admin/AdminPendingActionsWidget").then(m => ({ default: m.AdminPendingActionsWidget })));
const AdminAlertCenter = lazy(() => import("@/components/admin/AdminAlertCenter").then(m => ({ default: m.AdminAlertCenter })));
const AdminKPITrends = lazy(() => import("@/components/admin/AdminKPITrends").then(m => ({ default: m.AdminKPITrends })));
const ContentAnalyticsWidget = lazy(() => import("@/components/admin/ContentAnalyticsWidget").then(m => ({ default: m.ContentAnalyticsWidget })));
const FinanceAnalyticsWidget = lazy(() => import("@/components/admin/FinanceAnalyticsWidget").then(m => ({ default: m.FinanceAnalyticsWidget })));
const CRMPipelineWidget = lazy(() => import("@/components/admin/CRMPipelineWidget").then(m => ({ default: m.CRMPipelineWidget })));
const PerformanceMonitorWidget = lazy(() => import("@/components/admin/PerformanceMonitorWidget").then(m => ({ default: m.PerformanceMonitorWidget })));
const CompetitionInsightsWidget = lazy(() => import("@/components/admin/CompetitionInsightsWidget").then(m => ({ default: m.CompetitionInsightsWidget })));
const ExhibitionInsightsWidget = lazy(() => import("@/components/admin/ExhibitionInsightsWidget").then(m => ({ default: m.ExhibitionInsightsWidget })));
const SupportInsightsWidget = lazy(() => import("@/components/admin/SupportInsightsWidget").then(m => ({ default: m.SupportInsightsWidget })));
const SecurityInsightsWidget = lazy(() => import("@/components/admin/SecurityInsightsWidget").then(m => ({ default: m.SecurityInsightsWidget })));
const AutomationStatusWidget = lazy(() => import("@/components/admin/AutomationStatusWidget").then(m => ({ default: m.AutomationStatusWidget })));
const AdminPDFReportGenerator = lazy(() => import("@/components/admin/AdminPDFReportGenerator").then(m => ({ default: m.AdminPDFReportGenerator })));
const AdminReportHub = lazy(() => import("@/components/admin/AdminReportHub").then(m => ({ default: m.AdminReportHub })));
const CompanyDashboardWidget = lazy(() => import("@/components/admin/CompanyDashboardWidget").then(m => ({ default: m.CompanyDashboardWidget })));
const AdminAuditTrail = lazy(() => import("@/components/admin/AdminAuditTrail").then(m => ({ default: m.AdminAuditTrail })));
const AdminAdvancedAnalytics = lazy(() => import("@/components/admin/AdminAdvancedAnalytics").then(m => ({ default: m.AdminAdvancedAnalytics })));
const AdminAutomationRules = lazy(() => import("@/components/admin/AdminAutomationRules").then(m => ({ default: m.AdminAutomationRules })));
const PerformanceOptimizationWidget = lazy(() => import("@/components/admin/PerformanceOptimizationWidget").then(m => ({ default: m.PerformanceOptimizationWidget })));
const ContentCalendarWidget = lazy(() => import("@/components/admin/ContentCalendarWidget").then(m => ({ default: m.ContentCalendarWidget })));
const ReportsSummaryWidget = lazy(() => import("@/components/admin/ReportsSummaryWidget").then(m => ({ default: m.ReportsSummaryWidget })));
const DashboardLiveMetricsWidget = lazy(() => import("@/components/admin/DashboardLiveMetricsWidget").then(m => ({ default: m.DashboardLiveMetricsWidget })));
const CommunicationsDashboardWidget = lazy(() => import("@/components/admin/CommunicationsDashboardWidget").then(m => ({ default: m.CommunicationsDashboardWidget })));
const CommunityEngagementWidget = lazy(() => import("@/components/admin/CommunityEngagementWidget").then(m => ({ default: m.CommunityEngagementWidget })));
const ProfileCompletenessWidget = lazy(() => import("@/components/admin/ProfileCompletenessWidget").then(m => ({ default: m.ProfileCompletenessWidget })));
const ShopOrdersOverviewWidget = lazy(() => import("@/components/admin/ShopOrdersOverviewWidget").then(m => ({ default: m.ShopOrdersOverviewWidget })));
const AdminScheduledExports = lazy(() => import("@/components/admin/AdminScheduledExports").then(m => ({ default: m.AdminScheduledExports })));
const ScheduledExportWidget = lazy(() => import("@/components/admin/ScheduledExportWidget").then(m => ({ default: m.ScheduledExportWidget })));
const AdminAnalyticsWidgets = lazy(() => import("@/components/admin/AdminAnalyticsWidgets").then(m => ({ default: m.AdminAnalyticsWidgets })));
const AdminCommandBar = lazy(() => import("@/components/admin/AdminCommandBar").then(m => ({ default: m.AdminCommandBar })));
const MLAnalyticsDashboard = lazy(() => import("@/components/admin/MLAnalyticsDashboard").then(m => ({ default: m.MLAnalyticsDashboard })));

/** Renders children only when the section scrolls into view */
function LazySection({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  const { ref, inView } = useInViewport("400px 0px");
  return (
    <div ref={ref}>
      {inView ? <Suspense fallback={fallback || <SectionSkeleton />}>{children}</Suspense> : <div className="min-h-[120px]" />}
    </div>
  );
}

function AnimatedStatValue({ value }: { value: number }) {
  return (
    <p className="text-2xl font-black leading-none tracking-tight">
      <AnimatedCounter value={value} />
    </p>
  );
}

function SectionSkeleton() {
  return <div className="space-y-3"><Skeleton className="h-40 w-full rounded-xl" /><Skeleton className="h-32 w-full rounded-xl" /></div>;
}

function StaggeredStatsGrid({ statCards, isLoading, sparklineKeys, sparkData, isAr }: any) {
  const { getStyle } = useStaggeredReveal(statCards.length, 70);
  return (
    <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
      {statCards.map((stat: any, index: number) => {
        const sparkKey = sparklineKeys[stat.title];
        const sparkPoints = sparkKey && sparkData ? sparkData.map((d: any) => ({ v: d[sparkKey] || 0 })) : null;
        const trend = sparkPoints && sparkPoints.length >= 2
          ? sparkPoints[sparkPoints.length - 1].v - sparkPoints[0].v
          : 0;

        return (
          <Link key={stat.title} to={stat.link} style={getStyle(index)}>
            <Card className={cn(
              "group relative overflow-hidden border-border/40 transition-all duration-300 hover:shadow-xl hover:-translate-y-1.5 hover:shadow-primary/8 hover:border-primary/20",
              stat.urgent && "ring-1 ring-destructive/30 animate-pulse"
            )}>
              {/* Accent top bar */}
              <div className={cn("absolute inset-x-0 top-0 h-1 rounded-t-xl", stat.bg.replace("/10", ""))} />
              <CardContent className="p-4 pt-5">
                <div className="flex items-center gap-3">
                  <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg", stat.bg)}>
                    <stat.icon className={cn("h-5 w-5 transition-transform duration-300 group-hover:rotate-6", stat.color)} />
                  </div>
                  <div className="min-w-0 flex-1">
                    {isLoading ? (
                      <>
                        <Skeleton className="h-7 w-14 mb-1 rounded-xl" />
                        <Skeleton className="h-3 w-20 rounded-xl" />
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-1.5">
                          <AnimatedStatValue value={stat.value} />
                          {sparkPoints && trend !== 0 && (
                            <Badge variant="outline" className={cn(
                              "text-[9px] px-1.5 py-0.5 gap-0.5 rounded-xl",
                              trend > 0 ? "text-chart-2 border-chart-2/30 bg-chart-2/5" : "text-destructive border-destructive/30 bg-destructive/5"
                            )}>
                              {trend > 0 ? <ArrowUpRight className="h-2.5 w-2.5" /> : <ArrowDownRight className="h-2.5 w-2.5" />}
                              {Math.abs(trend)}
                            </Badge>
                          )}
                        </div>
                        <p className="mt-1 text-[11px] text-muted-foreground truncate font-medium">{stat.title}</p>
                      </>
                    )}
                  </div>
                </div>
                {sparkPoints && sparkPoints.length > 0 && (
                  <div className="mt-3 -mx-1 opacity-60 group-hover:opacity-100 transition-opacity duration-300">
                    <ResponsiveContainer width="100%" height={32}>
                      <LineChart data={sparkPoints}>
                        <Line type="monotone" dataKey="v" stroke={stat.chartColor} strokeWidth={1.5} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}

export default function AdminDashboard() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  useAdminCacheWarmer();

  // ── Main stats (single batch) ──
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
        supabase.from("admin_actions").select("*").order("created_at", { ascending: false }).limit(5),
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
        recentActions: recentActions || [],
        recentUsers: recentUsers || [],
      };
    },
    staleTime: 1000 * 60 * 3,
    refetchOnWindowFocus: false,
  });

  // ── Today's activity ──
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
    refetchOnWindowFocus: false,
  });

  // ── Optimized 7-day sparkline: fetch date ranges for boundary counts only ──
  const { data: sparkData } = useQuery({
    queryKey: ["admin-sparkline-7d-optimized"],
    queryFn: async () => {
      const tables = ["profiles", "competitions", "exhibitions", "articles"] as const;
      const keys = ["users", "comps", "exhibitions", "articles"] as const;
      const dateCol = ["created_at", "created_at", "created_at", "created_at"] as const;

      // Build date ranges
      const ranges: { start: string; end: string; day: string }[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = subDays(new Date(), i);
        const start = new Date(d); start.setHours(0, 0, 0, 0);
        const end = new Date(d); end.setHours(23, 59, 59, 999);
        ranges.push({ start: start.toISOString(), end: end.toISOString(), day: format(d, "EEE") });
      }

      // Fire one query per table for the full 7-day window, then bucket locally
      const fullStart = ranges[0].start;
      const fullEnd = ranges[ranges.length - 1].end;

      const tableData = await Promise.all(
        tables.map((table) =>
          supabase
            .from(table)
            .select("created_at")
            .gte("created_at", fullStart)
            .lte("created_at", fullEnd)
            .order("created_at", { ascending: true })
            .limit(1000)
            .then(({ data }) => data || [])
        )
      );

      // Bucket into days
      return ranges.map((range) => {
        const row: Record<string, any> = { day: range.day };
        tables.forEach((_, ti) => {
          row[keys[ti]] = tableData[ti].filter(
            (r: any) => r.created_at >= range.start && r.created_at <= range.end
          ).length;
        });
        return row;
      });
    },
    staleTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
  });

  const sparklineKeys: Record<string, string> = {
    "Total Users": "users", "إجمالي المستخدمين": "users",
    "Competitions": "comps", "المسابقات": "comps",
    "Exhibitions": "exhibitions", "المعارض": "exhibitions",
    "Articles": "articles", "المقالات": "articles",
  };

  const statCards = useMemo(() => [
    { title: isAr ? "إجمالي المستخدمين" : "Total Users", value: stats?.totalUsers || 0, icon: Users, accent: "border-s-primary", bg: "bg-primary/10", color: "text-primary", chartColor: "hsl(var(--primary))", link: "/admin/users" },
    { title: isAr ? "المستخدمين النشطين" : "Active Users", value: stats?.activeUsers || 0, icon: UserCheck, accent: "border-s-primary", bg: "bg-primary/10", color: "text-primary", chartColor: "hsl(var(--primary))", link: "/admin/users?status=active" },
    { title: isAr ? "تقارير معلقة" : "Pending Reports", value: stats?.pendingReports || 0, icon: Flag, accent: "border-s-destructive", bg: "bg-destructive/10", color: "text-destructive", chartColor: "hsl(var(--destructive))", link: "/admin/moderation", urgent: (stats?.pendingReports || 0) > 0 },
    { title: isAr ? "المسابقات" : "Competitions", value: stats?.totalCompetitions || 0, icon: Trophy, accent: "border-s-chart-2", bg: "bg-chart-2/10", color: "text-chart-2", chartColor: "hsl(var(--chart-2))", link: "/admin/competitions" },
    { title: isAr ? "المعارض" : "Exhibitions", value: stats?.totalExhibitions || 0, icon: Landmark, accent: "border-s-chart-3", bg: "bg-chart-3/10", color: "text-chart-3", chartColor: "hsl(var(--chart-3))", link: "/admin/exhibitions" },
    { title: isAr ? "الدورات" : "Masterclasses", value: stats?.totalMasterclasses || 0, icon: GraduationCap, accent: "border-s-chart-4", bg: "bg-chart-4/10", color: "text-chart-4", chartColor: "hsl(var(--chart-4))", link: "/admin/masterclasses" },
    { title: isAr ? "المقالات" : "Articles", value: stats?.totalArticles || 0, icon: FileText, accent: "border-s-chart-5", bg: "bg-chart-5/10", color: "text-chart-5", chartColor: "hsl(var(--chart-5))", link: "/admin/articles" },
    { title: isAr ? "الطلبات" : "Orders", value: stats?.totalOrders || 0, icon: Package, accent: "border-s-primary", bg: "bg-primary/10", color: "text-primary", chartColor: "hsl(var(--primary))", link: "/admin/orders" },
  ], [stats, isAr]);

  const quickActions = useMemo(() => [
    { title: isAr ? "إدارة المستخدمين" : "User Management", description: isAr ? "عرض وتعديل جميع المستخدمين" : "View and edit all users", icon: Users, link: "/admin/users" },
    { title: isAr ? "إدارة الأدوار" : "Role Management", description: isAr ? "تعيين وإدارة صلاحيات المستخدمين" : "Assign and manage user permissions", icon: Shield, link: "/admin/roles" },
    { title: isAr ? "العضويات" : "Memberships", description: isAr ? "ترقية وتخفيض عضويات المستخدمين" : "Upgrade and downgrade memberships", icon: CreditCard, link: "/admin/memberships" },
    { title: isAr ? "مراجعة المحتوى" : "Content Moderation", description: isAr ? "مراجعة التقارير والمحتوى المُبلغ عنه" : "Review reports and flagged content", icon: Flag, link: "/admin/moderation", badge: stats?.pendingReports },
  ], [isAr, stats?.pendingReports]);

  const workflowShortcuts = useMemo(() => [
    { label: isAr ? "مسابقة جديدة" : "New Competition", icon: Plus, link: "/admin/competitions", color: "text-chart-2" },
    { label: isAr ? "نشر مقال" : "Publish Article", icon: Send, link: "/admin/articles", color: "text-chart-5" },
    { label: isAr ? "إرسال إشعار" : "Send Notification", icon: MessageSquare, link: "/admin/notifications", color: "text-chart-3" },
    { label: isAr ? "مراجعة البلاغات" : "Review Reports", icon: CheckCircle2, link: "/admin/moderation", color: "text-destructive" },
    { label: isAr ? "إعدادات الموقع" : "Site Settings", icon: Settings, link: "/admin/settings", color: "text-chart-4" },
    { label: isAr ? "إضافة معرض" : "New Exhibition", icon: Landmark, link: "/admin/exhibitions", color: "text-chart-1" },
  ], [isAr]);

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

  return (
    <div className="space-y-6">
      <AdminPageHeader
        icon={LayoutDashboard}
        title={isAr ? "لوحة التحكم" : "Admin Dashboard"}
        description={isAr ? "مرحباً، مدير النظام" : "Welcome, Super Admin"}
        actions={
          <div className="flex items-center gap-3 flex-wrap">
            <ActivityPulse status="live" label={isAr ? "مباشر" : "Live"} size="md" />
            <AdminRealtimeNotificationBell />
            <SystemHealthBar />
            <Badge variant="secondary" className="gap-1.5">
              <Shield className="h-3 w-3" />
              {isAr ? "صلاحيات كاملة" : "Full Access"}
            </Badge>
          </div>
        }
      />

      {/* Keyboard Shortcuts */}
      <AdminKeyboardShortcuts />

      {/* Security Alerts */}
      <SecurityAlertsBanner />

      {/* Mobile Nav Grid */}
      <AdminMobileNavGrid />

      {/* Quick Actions & Shortcuts */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
        <div className="lg:col-span-3">
          <AdminQuickActionsBar pendingReports={stats?.pendingReports} />
        </div>
        <ShortcutHintsCard />
      </div>

      {/* Live Platform Pulse */}
      <LazySection>
        <DashboardLiveMetricsWidget />
      </LazySection>

      {/* KPI Trends (week-over-week comparison) */}
      <LazySection>
        <AdminKPITrends />
      </LazySection>

      {/* Stats Grid with sparklines */}
      <div className="space-y-2">
        <StaggeredStatsGrid statCards={statCards} isLoading={isLoading} sparklineKeys={sparklineKeys} sparkData={sparkData} isAr={isAr} />
        <div className="flex justify-end px-1">
          <DataFreshness
            lastUpdated={stats ? new Date() : null}
            isRefetching={isLoading}
          />
        </div>
      </div>


      {/* Command Bar */}
      <Suspense fallback={null}><AdminCommandBar /></Suspense>

      {/* ── Row: Today's Activity + Pending Actions + Account Types ── */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Today's Activity */}
        <Card className="rounded-2xl border-border/40 bg-gradient-to-br from-primary/5 via-transparent to-chart-2/5 lg:col-span-1">
          <CardContent className="p-4">
             <div className="flex items-center gap-2.5 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-sm shadow-primary/15">
                <Zap className="h-4 w-4 text-primary-foreground" />
              </div>
              <h3 className="text-sm font-bold">{isAr ? "نشاط اليوم" : "Today's Activity"}</h3>
              <ActivityPulse status="live" className="ms-auto" />
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { label: isAr ? "مستخدمون جدد" : "New Users", value: todayStats?.newUsers || 0, icon: UserPlus, color: "text-primary", bg: "bg-primary/10" },
                { label: isAr ? "منشورات" : "Posts", value: todayStats?.newPosts || 0, icon: MessageSquare, color: "text-chart-2", bg: "bg-chart-2/10" },
                { label: isAr ? "طلبات" : "Orders", value: todayStats?.newOrders || 0, icon: Package, color: "text-chart-3", bg: "bg-chart-3/10" },
                { label: isAr ? "بلاغات" : "Reports", value: todayStats?.newReports || 0, icon: AlertTriangle, color: todayStats?.newReports ? "text-destructive" : "text-muted-foreground", bg: todayStats?.newReports ? "bg-destructive/10" : "bg-muted/50" },
              ].map((item, i) => (
                <div key={i} className="group flex items-center gap-2.5 rounded-2xl border border-border/30 bg-card/80 p-3 transition-all duration-200 hover:shadow-sm hover:-translate-y-0.5">
                  <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-110", item.bg)}>
                    <item.icon className={`h-4 w-4 shrink-0 ${item.color}`} />
                  </div>
                  <div>
                    <p className={`text-lg font-black leading-none ${item.color}`}>{toEnglishDigits(item.value.toString())}</p>
                    <p className="text-[9px] text-muted-foreground mt-1 font-medium">{item.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pending Actions Widget */}
        <AdminPendingActionsWidget />

        {/* Account Type Breakdown */}
        <Card className="rounded-2xl border-border/40">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-chart-4/10">
                <Users className="h-3.5 w-3.5 text-chart-4" />
              </div>
              <h3 className="text-sm font-bold">{isAr ? "أنواع الحسابات" : "Account Types"}</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                  <ChefHat className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">{isAr ? "محترف" : "Professional"}</p>
                    <p className="text-sm font-black text-primary"><AnimatedCounter value={stats?.proUsers || 0} /></p>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${stats?.totalUsers ? ((stats.proUsers / stats.totalUsers) * 100) : 0}%` }} />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-chart-4/10">
                  <Heart className="h-4 w-4 text-chart-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">{isAr ? "متابع" : "Follower"}</p>
                    <p className="text-sm font-black text-chart-4"><AnimatedCounter value={stats?.fanUsers || 0} /></p>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-chart-4 transition-all" style={{ width: `${stats?.totalUsers ? ((stats.fanUsers / stats.totalUsers) * 100) : 0}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Workflow Shortcuts */}
      <Card className="rounded-2xl border-border/40">
        <CardContent className="p-4">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-chart-3 to-chart-3/80 shadow-sm shadow-chart-3/15">
              <Zap className="h-4 w-4 text-primary-foreground" />
            </div>
            <h3 className="text-sm font-bold">{isAr ? "اختصارات سريعة" : "Quick Workflows"}</h3>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
            {workflowShortcuts.map((shortcut) => (
              <Link key={shortcut.label} to={shortcut.link}>
                <div className="group flex flex-col items-center gap-2 rounded-2xl border border-border/30 p-3.5 transition-all duration-300 hover:bg-accent/50 hover:shadow-md hover:shadow-primary/5 hover:-translate-y-1 text-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-muted/50 transition-all duration-200 group-hover:scale-110 group-hover:bg-muted">
                    <shortcut.icon className={cn("h-4.5 w-4.5", shortcut.color)} />
                  </div>
                  <span className="text-[10px] font-semibold text-muted-foreground leading-tight group-hover:text-foreground transition-colors">{shortcut.label}</span>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      <LazySection>
        <ReportsSummaryWidget />
      </LazySection>

      {/* ── Row: Community + Profile + Shop ── */}
      <LazySection>
        <div className="grid gap-4 lg:grid-cols-3">
          <CommunityEngagementWidget />
          <ProfileCompletenessWidget />
          <ShopOrdersOverviewWidget />
        </div>
      </LazySection>

      {/* ── Row: Activity Feed + Moderation + Alerts + Finance ── */}
      <LazySection>
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
          <AdminActivityFeed />
          <AdminModerationQueue />
          <AdminAlertCenter />
          <AdminFinanceOverview />
        </div>
      </LazySection>

      {/* ── Row: Quick Actions + Recent Actions ── */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Quick Actions */}
        <Card className="rounded-2xl border-border/40">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-primary/10">
                <Activity className="h-3.5 w-3.5 text-primary" />
              </div>
              {isAr ? "إجراءات سريعة" : "Quick Actions"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {quickActions.map((action) => (
              <Link key={action.title} to={action.link}>
                <div className="flex items-center justify-between rounded-2xl border border-border/40 p-3.5 transition-all duration-300 hover:bg-accent/50 hover:shadow-md hover:shadow-primary/5 hover:-translate-y-0.5 hover:border-primary/20 group/action">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 transition-all duration-300 group-hover/action:bg-primary/20 group-hover/action:scale-110">
                      <action.icon className="h-4 w-4 text-primary transition-transform duration-300 group-hover/action:rotate-3" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{action.title}</p>
                      <p className="text-xs text-muted-foreground">{action.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {action.badge && action.badge > 0 && (
                      <Badge variant="destructive" className="text-[10px]">{action.badge}</Badge>
                    )}
                    <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform duration-300 group-hover/action:translate-x-1" />
                  </div>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>

        {/* Recent Admin Actions */}
        <Card className="rounded-2xl border-border/40">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-primary/10">
                <TrendingUp className="h-3.5 w-3.5 text-primary" />
              </div>
              {isAr ? "آخر الإجراءات" : "Recent Actions"}
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/admin/audit">
                {isAr ? "عرض الكل" : "View All"}
                <ArrowRight className="ms-1.5 h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {stats?.recentActions?.length === 0 ? (
              <div className="flex flex-col items-center py-10 text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted/60">
                  <TrendingUp className="h-5 w-5 text-muted-foreground/40" />
                </div>
                <p className="text-sm text-muted-foreground">
                  {isAr ? "لا توجد إجراءات حديثة" : "No recent actions"}
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {stats?.recentActions?.map((action: any) => (
                  <div key={action.id} className="flex items-center justify-between rounded-xl border border-border/40 p-3 transition-all duration-200 hover:bg-muted/30">
                    {getActionBadge(action.action_type)}
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(action.created_at), "MMM d, HH:mm")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Users */}
      <Card className="rounded-2xl border-border/40">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base">{isAr ? "أحدث المستخدمين" : "Recent Users"}</CardTitle>
            <CardDescription className="mt-0.5">
              {isAr ? "آخر المستخدمين المسجلين" : "Latest registered users"}
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link to="/admin/users">
              {isAr ? "عرض الكل" : "View All"}
              <ArrowRight className="ms-1.5 h-3.5 w-3.5" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {stats?.recentUsers?.map((user: any) => (
              <Link
                key={user.id}
                to={`/${user.username || user.id}`}
                className="group flex items-center gap-3 rounded-2xl border border-border/40 p-3 transition-all duration-300 hover:shadow-md hover:bg-accent/30 hover:-translate-y-0.5"
              >
                <div className="relative h-10 w-10 shrink-0 rounded-full overflow-hidden ring-2 ring-primary/20 transition-transform duration-300 group-hover:scale-110">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt={user.display_name || user.full_name || "User"} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-primary/10 text-primary font-semibold">
                      {(user.display_name || user.full_name || "U")[0].toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium">{user.display_name || user.full_name || "Unknown"}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {format(new Date(user.created_at), "MMM d, yyyy")}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Competition & Evaluation Insights */}
      <LazySection><CompetitionInsightsWidget /></LazySection>

      {/* Exhibition & Events Insights */}
      <LazySection><ExhibitionInsightsWidget /></LazySection>

      {/* Support & Communications */}
      <LazySection><SupportInsightsWidget /></LazySection>

      {/* Security & Permissions */}
      <LazySection><SecurityInsightsWidget /></LazySection>

      {/* Content Analytics */}
      <LazySection><ContentAnalyticsWidget /></LazySection>

      {/* Finance Analytics */}
      <LazySection><FinanceAnalyticsWidget /></LazySection>

      {/* CRM Pipeline */}
      <LazySection><CRMPipelineWidget /></LazySection>

      {/* Automation Rules */}
      <LazySection><AdminAutomationRules /></LazySection>

      {/* Content Calendar + Communications + Exports */}
      <LazySection>
        <div className="grid gap-4 lg:grid-cols-3">
          <ContentCalendarWidget />
          <CommunicationsDashboardWidget />
          <AdminScheduledExports />
        </div>
      </LazySection>

      {/* Automation & Notifications Status */}
      <LazySection><AutomationStatusWidget /></LazySection>

      {/* Advanced Analytics */}
      <LazySection><AdminAdvancedAnalytics /></LazySection>

      {/* Quick Report Hub */}
      <LazySection><AdminReportHub /></LazySection>

      {/* PDF Report Generator */}
      <LazySection><AdminPDFReportGenerator /></LazySection>

      {/* Company Dashboard */}
      <LazySection><CompanyDashboardWidget /></LazySection>

      {/* Audit Trail */}
      <LazySection><AdminAuditTrail /></LazySection>

      {/* Performance Monitor */}
      <LazySection><PerformanceMonitorWidget /></LazySection>

      {/* App Performance */}
      <LazySection><PerformanceOptimizationWidget /></LazySection>

      {/* Quick Data Export */}
      <LazySection><ScheduledExportWidget /></LazySection>

      {/* Deep Analytics */}
      <LazySection><AdminAnalyticsWidgets /></LazySection>

      <LazySection><MLAnalyticsDashboard /></LazySection>
    </div>
  );
}
