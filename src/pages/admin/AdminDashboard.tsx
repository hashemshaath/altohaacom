import { useMemo, lazy, Suspense } from "react";
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
import { ActivityPulse } from "@/components/ui/activity-pulse";
import { useInViewport } from "@/hooks/useInViewport";
import {
  Users, UserCheck, UserPlus, Flag, Trophy, FileText, Calendar,
  TrendingUp, ArrowRight, ArrowUpRight, ArrowDownRight,
  Shield, Activity, Package, GraduationCap, LayoutDashboard,
  Zap, MessageSquare, AlertTriangle, Settings,
  Heart, ChefHat, Building2, Landmark, Eye,
} from "lucide-react";
import { format, subDays } from "date-fns";
import { cn } from "@/lib/utils";
import { ResponsiveContainer, AreaChart, Area } from "recharts";

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

/* ─── Helpers ─── */
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

/* ─── Main Dashboard ─── */
export default function AdminDashboard() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  useAdminCacheWarmer();

  /* ── Data Queries ── */
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
        supabase.from("admin_actions").select("id, action_type, created_at").order("created_at", { ascending: false }).limit(5),
        supabase.from("profiles").select("id, full_name, display_name, username, avatar_url, created_at").order("created_at", { ascending: false }).limit(5),
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
        supabase.from("exhibitions").select("id, title, title_ar, start_date, city, country, status, slug, edition_year")
          .gte("start_date", now).in("status", ["upcoming", "active"]).order("start_date").limit(4),
        supabase.from("competitions").select("id, title, title_ar, competition_start, city, country, status, edition_year")
          .gte("competition_start", now).in("status", ["upcoming", "registration_open", "in_progress"]).order("competition_start").limit(4),
      ]);
      return [
        ...(exh || []).map(e => ({ ...e, type: "exhibition" as const, date: e.start_date, link: `/admin/exhibitions` })),
        ...(comp || []).map(c => ({ ...c, type: "competition" as const, date: c.competition_start, link: `/admin/competitions` })),
      ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(0, 6);
    },
    staleTime: 1000 * 60 * 5,
  });

  const { data: recentImports } = useQuery({
    queryKey: ["admin-recent-imports"],
    queryFn: async () => {
      const { data } = await supabase
        .from("bulk_imports")
        .select("id, entity_type, status, total_rows, processed_rows, created_at, file_name")
        .order("created_at", { ascending: false })
        .limit(5);
      return data || [];
    },
    staleTime: 1000 * 60 * 5,
  });

  /* ── Derived data ── */
  const sparklineKeys: Record<string, string> = {
    "Total Users": "users", "إجمالي المستخدمين": "users",
    "Competitions": "comps", "المسابقات": "comps",
    "Exhibitions": "exhibitions", "المعارض": "exhibitions",
    "Articles": "articles", "المقالات": "articles",
  };

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return isAr ? "صباح الخير" : "Good morning";
    if (hour < 17) return isAr ? "مساء الخير" : "Good afternoon";
    return isAr ? "مساء الخير" : "Good evening";
  }, [isAr]);

  const primaryKPIs = useMemo(() => [
    { title: isAr ? "إجمالي المستخدمين" : "Total Users", value: stats?.totalUsers || 0, icon: Users, color: "text-primary", bg: "bg-primary/8", chartColor: "hsl(var(--primary))", link: "/admin/users" },
    { title: isAr ? "المستخدمين النشطين" : "Active Users", value: stats?.activeUsers || 0, icon: UserCheck, color: "text-chart-5", bg: "bg-chart-5/8", chartColor: "hsl(var(--chart-5))", link: "/admin/users?status=active" },
    { title: isAr ? "تقارير معلقة" : "Pending Reports", value: stats?.pendingReports || 0, icon: Flag, color: "text-destructive", bg: "bg-destructive/8", chartColor: "hsl(var(--destructive))", link: "/admin/moderation", urgent: (stats?.pendingReports || 0) > 0 },
    { title: isAr ? "المسابقات" : "Competitions", value: stats?.totalCompetitions || 0, icon: Trophy, color: "text-chart-2", bg: "bg-chart-2/8", chartColor: "hsl(var(--chart-2))", link: "/admin/competitions" },
  ], [stats, isAr]);

  const secondaryKPIs = useMemo(() => [
    { title: isAr ? "المعارض" : "Exhibitions", value: stats?.totalExhibitions || 0, icon: Landmark, color: "text-chart-3", bg: "bg-chart-3/8", link: "/admin/exhibitions" },
    { title: isAr ? "المنظمون" : "Organizers", value: stats?.totalOrganizers || 0, icon: Building2, color: "text-chart-4", bg: "bg-chart-4/8", link: "/admin/organizers" },
    { title: isAr ? "الدورات" : "Masterclasses", value: stats?.totalMasterclasses || 0, icon: GraduationCap, color: "text-accent-foreground", bg: "bg-accent/30", link: "/admin/masterclasses" },
    { title: isAr ? "المقالات" : "Articles", value: stats?.totalArticles || 0, icon: FileText, color: "text-chart-1", bg: "bg-chart-1/8", link: "/admin/articles" },
    { title: isAr ? "الطلبات" : "Orders", value: stats?.totalOrders || 0, icon: Package, color: "text-chart-5", bg: "bg-chart-5/8", link: "/admin/orders" },
  ], [stats, isAr]);

  const quickLinks = useMemo(() => [
    { title: isAr ? "المستخدمون" : "Users", icon: Users, link: "/admin/users", color: "text-primary" },
    { title: isAr ? "المنظمون" : "Organizers", icon: Building2, link: "/admin/organizers", color: "text-chart-4" },
    { title: isAr ? "المعارض" : "Exhibitions", icon: Landmark, link: "/admin/exhibitions", color: "text-chart-3" },
    { title: isAr ? "المسابقات" : "Competitions", icon: Trophy, link: "/admin/competitions", color: "text-chart-2" },
    { title: isAr ? "الأدوار" : "Roles", icon: Shield, link: "/admin/roles", color: "text-muted-foreground" },
    { title: isAr ? "المراجعة" : "Moderation", icon: Flag, link: "/admin/moderation", color: "text-destructive", badge: stats?.pendingReports },
    { title: isAr ? "الإشعارات" : "Notifications", icon: MessageSquare, link: "/admin/notifications", color: "text-chart-1" },
    { title: isAr ? "الإعدادات" : "Settings", icon: Settings, link: "/admin/settings", color: "text-muted-foreground" },
  ], [isAr, stats?.pendingReports]);

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* ═══════════════════ HEADER ═══════════════════ */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <LayoutDashboard className="h-5 w-5 text-primary" />
            </div>
            {greeting} 👋
          </h1>
          <p className="text-sm text-muted-foreground">
            {isAr ? "نظرة شاملة على المنصة" : "Platform overview"} · <span className="font-medium text-foreground/70">{format(new Date(), "EEEE, MMM d, yyyy")}</span>
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-3">
          <ActivityPulse status="live" label={isAr ? "مباشر" : "Live"} size="md" />
          <AdminRealtimeNotificationBell />
        </div>
      </div>

      <SecurityAlertsBanner />

      {/* ═══════════════════ PRIMARY KPIs (4 large cards) ═══════════════════ */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {primaryKPIs.map((kpi) => {
          const sparkKey = sparklineKeys[kpi.title];
          const sparkPoints = sparkKey && sparkData ? sparkData.map((d) => ({ v: d[sparkKey] || 0 })) : null;
          const trend = sparkPoints && sparkPoints.length >= 2 ? sparkPoints[sparkPoints.length - 1].v - sparkPoints[0].v : 0;

          return (
            <Link key={kpi.title} to={kpi.link}>
              <Card className={cn(
                "group relative overflow-hidden transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 rounded-xl",
                kpi.urgent && "ring-1 ring-destructive/30"
              )}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl transition-transform group-hover:scale-110", kpi.bg)}>
                      <kpi.icon className={cn("h-5 w-5", kpi.color)} />
                    </div>
                    {trend !== 0 && (
                      <Badge variant="outline" className={cn("text-xs gap-0.5 font-semibold", trend > 0 ? "text-chart-5 border-chart-5/30" : "text-destructive border-destructive/30")}>
                        {trend > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                        {Math.abs(trend)}
                      </Badge>
                    )}
                  </div>
                  {isLoading ? (
                    <Skeleton className="h-8 w-20 rounded mb-1" />
                  ) : (
                    <p className="text-3xl font-bold tracking-tight tabular-nums">
                      <AnimatedCounter value={kpi.value} />
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground font-medium mt-1">{kpi.title}</p>
                  {sparkPoints && sparkPoints.length > 0 && (
                    <div className="mt-3 -mx-2 opacity-30 group-hover:opacity-60 transition-opacity">
                      <ResponsiveContainer width="100%" height={32}>
                        <AreaChart data={sparkPoints}>
                          <defs>
                            <linearGradient id={`grad-${kpi.title}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor={kpi.chartColor} stopOpacity={0.3} />
                              <stop offset="100%" stopColor={kpi.chartColor} stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <Area type="monotone" dataKey="v" stroke={kpi.chartColor} strokeWidth={1.5} fill={`url(#grad-${kpi.title})`} dot={false} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* ═══════════════════ SECONDARY KPIs (5 compact cards) ═══════════════════ */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
        {secondaryKPIs.map((kpi) => (
          <Link key={kpi.title} to={kpi.link}>
            <Card className="group overflow-hidden transition-all duration-200 hover:shadow-sm hover:-translate-y-0.5 rounded-xl">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-transform group-hover:scale-110", kpi.bg)}>
                  <kpi.icon className={cn("h-4 w-4", kpi.color)} />
                </div>
                <div className="min-w-0">
                  {isLoading ? (
                    <Skeleton className="h-5 w-10 rounded mb-0.5" />
                  ) : (
                    <p className="text-lg font-bold tabular-nums leading-tight">
                      <AnimatedCounter value={kpi.value} />
                    </p>
                  )}
                  <p className="text-[11px] text-muted-foreground font-medium truncate">{kpi.title}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* ═══════════════════ MAIN CONTENT GRID ═══════════════════ */}
      <div className="grid gap-5 lg:grid-cols-3">
        {/* ── Left Column (2/3) ── */}
        <div className="lg:col-span-2 space-y-5">
          {/* Quick Actions */}
          <Card className="rounded-xl">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" />
                  {isAr ? "إجراءات سريعة" : "Quick Actions"}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-2">
                {quickLinks.map((action) => (
                  <Link key={action.title} to={action.link}>
                    <div className="group relative flex flex-col items-center gap-2 rounded-xl border border-border/40 p-3.5 text-center transition-all duration-200 hover:bg-muted/40 hover:border-primary/20 active:scale-[0.97]">
                      <action.icon className={cn("h-5 w-5 transition-colors", action.color)} />
                      <span className="text-[11px] font-medium text-muted-foreground group-hover:text-foreground transition-colors leading-tight">{action.title}</span>
                      {action.badge && action.badge > 0 && (
                        <Badge variant="destructive" className="absolute -top-1.5 -end-1.5 text-[10px] h-4 min-w-4 px-1">{action.badge}</Badge>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Events */}
          {upcomingEvents && upcomingEvents.length > 0 && (
            <Card className="rounded-xl">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-chart-4" />
                    {isAr ? "الفعاليات القادمة" : "Upcoming Events"}
                  </CardTitle>
                  <div className="flex gap-1.5">
                    <Button variant="ghost" size="sm" className="text-xs h-7 px-2" asChild>
                      <Link to="/admin/exhibitions">{isAr ? "المعارض" : "Exhibitions"} <ArrowRight className="ms-1 h-3 w-3" /></Link>
                    </Button>
                    <Button variant="ghost" size="sm" className="text-xs h-7 px-2" asChild>
                      <Link to="/admin/competitions">{isAr ? "المسابقات" : "Competitions"} <ArrowRight className="ms-1 h-3 w-3" /></Link>
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                  {upcomingEvents.map((ev) => (
                    <Link key={ev.id} to={ev.link}>
                      <div className="group flex items-start gap-3 rounded-xl border border-border/40 p-3 transition-all hover:bg-muted/30 hover:border-primary/20">
                        <div className="flex flex-col items-center rounded-lg bg-primary/8 p-2 text-center min-w-[44px]">
                          <span className="text-[11px] font-semibold text-primary uppercase">{format(new Date(ev.date), "MMM")}</span>
                          <span className="text-lg font-bold text-primary leading-none">{format(new Date(ev.date), "d")}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold truncate group-hover:text-primary transition-colors">
                            {(() => {
                              const title = isAr ? ((ev as any).title_ar || ev.title) : ev.title;
                              const year = (ev as any).edition_year;
                              if (!year || title.includes(String(year))) return title;
                              return `${title} ${year}`;
                            })()}
                          </p>
                          <div className="flex items-center gap-1.5 mt-1">
                            <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                              {ev.type === "competition" ? (isAr ? "مسابقة" : "Competition") : (isAr ? "معرض" : "Exhibition")}
                            </Badge>
                            {(ev as any).city && <span className="text-[11px] text-muted-foreground truncate">{(ev as any).city}</span>}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Pending Actions */}
          <LazySection>
            <AdminPendingActionsWidget />
          </LazySection>

          {/* Recent Actions */}
          <Card className="rounded-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                {isAr ? "آخر الإجراءات" : "Recent Actions"}
              </CardTitle>
              <Button variant="ghost" size="sm" asChild className="text-xs h-7">
                <Link to="/admin/audit">{isAr ? "عرض الكل" : "View All"} <ArrowRight className="ms-1 h-3 w-3" /></Link>
              </Button>
            </CardHeader>
            <CardContent>
              {stats?.recentActions?.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">{isAr ? "لا توجد إجراءات حديثة" : "No recent actions"}</p>
              ) : (
                <div className="space-y-2">
                  {stats?.recentActions?.map((action) => (
                    <div key={action.id} className="flex items-center justify-between rounded-lg border border-border/30 p-2.5 transition-colors hover:bg-muted/30">
                      <Badge variant="outline" className="text-xs capitalize">{action.action_type.replace(/_/g, " ")}</Badge>
                      <span className="text-[11px] text-muted-foreground tabular-nums">{format(new Date(action.created_at), "MMM d, HH:mm")}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Right Column (1/3) ── */}
        <div className="space-y-5">
          {/* Today's Activity */}
          <Card className="rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Activity className="h-4 w-4 text-chart-2" />
                {isAr ? "نشاط اليوم" : "Today's Activity"}
                <ActivityPulse status="live" className="ms-auto" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2.5">
                {[
                  { label: isAr ? "مستخدمون جدد" : "New Users", value: todayStats?.newUsers || 0, icon: UserPlus, color: "text-primary", bg: "bg-primary/8" },
                  { label: isAr ? "منشورات" : "Posts", value: todayStats?.newPosts || 0, icon: MessageSquare, color: "text-chart-2", bg: "bg-chart-2/8" },
                  { label: isAr ? "طلبات" : "Orders", value: todayStats?.newOrders || 0, icon: Package, color: "text-chart-3", bg: "bg-chart-3/8" },
                  { label: isAr ? "بلاغات" : "Reports", value: todayStats?.newReports || 0, icon: AlertTriangle, color: todayStats?.newReports ? "text-destructive" : "text-muted-foreground", bg: todayStats?.newReports ? "bg-destructive/8" : "bg-muted/50" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3 rounded-xl border border-border/30 p-3">
                    <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", item.bg)}>
                      <item.icon className={cn("h-4 w-4", item.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground font-medium">{item.label}</p>
                    </div>
                    <p className={cn("text-lg font-bold tabular-nums", item.color)}>
                      <AnimatedCounter value={Number(item.value) || 0} className="inline" />
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Account Types */}
          <Card className="rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Users className="h-4 w-4 text-chart-3" />
                {isAr ? "أنواع الحسابات" : "Account Types"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { label: isAr ? "محترف" : "Professional", value: stats?.proUsers || 0, icon: ChefHat, color: "text-primary", bg: "bg-primary" },
                  { label: isAr ? "مستخدم عادي" : "Regular User", value: stats?.fanUsers || 0, icon: Heart, color: "text-chart-4", bg: "bg-chart-4" },
                ].map((type) => {
                  const pct = stats?.totalUsers ? Math.round((type.value / stats.totalUsers) * 100) : 0;
                  return (
                    <div key={type.label}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <type.icon className={cn("h-4 w-4", type.color)} />
                          <span className="text-xs font-medium">{type.label}</span>
                        </div>
                        <span className={cn("text-sm font-bold tabular-nums", type.color)}>
                          <AnimatedCounter value={type.value} />
                          <span className="text-[11px] text-muted-foreground ms-1">({pct}%)</span>
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div className={cn("h-full rounded-full transition-all duration-700", type.bg)} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* System Health */}
          <Card className="rounded-xl border-chart-5/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-chart-5/10">
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

          {/* Recent Users */}
          <Card className="rounded-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-chart-1" />
                {isAr ? "أحدث المستخدمين" : "Recent Users"}
              </CardTitle>
              <Button variant="ghost" size="sm" asChild className="text-xs h-7">
                <Link to="/admin/users">{isAr ? "الكل" : "All"} <ArrowRight className="ms-1 h-3 w-3" /></Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-1.5">
                {stats?.recentUsers?.map((user) => (
                  <Link key={user.id} to={`/${user.username || user.id}`} className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted/40">
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
                      <p className="text-[11px] text-muted-foreground tabular-nums">{format(new Date(user.created_at), "MMM d, yyyy")}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Imports */}
          {recentImports && recentImports.length > 0 && (
            <Card className="rounded-xl">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Zap className="h-4 w-4 text-chart-2" />
                    {isAr ? "آخر الاستيرادات" : "Recent Imports"}
                  </CardTitle>
                  <Button variant="ghost" size="sm" className="text-xs h-7 px-2" asChild>
                    <Link to="/admin/smart-import">{isAr ? "استيراد" : "Import"} <ArrowRight className="ms-1 h-3 w-3" /></Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {recentImports.map((imp) => (
                    <div key={imp.id} className="flex items-center justify-between rounded-lg border border-border/30 p-2.5">
                      <div className="flex items-center gap-2">
                        <Badge variant={imp.status === "completed" ? "default" : imp.status === "failed" ? "destructive" : "outline"} className="text-[10px] h-4 capitalize">
                          {imp.status}
                        </Badge>
                        <span className="text-xs font-medium">{imp.entity_type}</span>
                      </div>
                      <span className="text-[11px] text-muted-foreground tabular-nums">
                        {format(new Date(imp.created_at), "MMM d")}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* ═══════════════════ LAZY WIDGETS ═══════════════════ */}
      <Suspense fallback={null}><AdminCommandBar /></Suspense>
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
      <LazySection><CompanyDashboardWidget /></LazySection>
      <LazySection><DedupDashboardWidget /></LazySection>
      <LazySection><DataQualityDashboardWidget /></LazySection>
    </div>
  );
}
