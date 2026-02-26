import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AdminAnalyticsWidgets } from "@/components/admin/AdminAnalyticsWidgets";
import { MLAnalyticsDashboard } from "@/components/admin/MLAnalyticsDashboard";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { toEnglishDigits } from "@/lib/formatNumber";
import { 
  Users, 
  UserCheck,
  UserPlus,
  Flag, 
  Trophy, 
  FileText,
  TrendingUp,
  ArrowRight,
  Shield,
  Activity,
  CreditCard,
  Landmark,
  Package,
  GraduationCap,
  LayoutDashboard,
  Zap,
  MessageSquare,
  AlertTriangle,
} from "lucide-react";
import { format } from "date-fns";

export default function AdminDashboard() {
  const { language } = useLanguage();
  const isAr = language === "ar";

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
        recentActions: recentActions || [],
        recentUsers: recentUsers || [],
      };
    },
    staleTime: 1000 * 30,
  });

  // Today's activity summary
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
    staleTime: 1000 * 60,
  });

  const statCards = useMemo(() => [
    { title: isAr ? "إجمالي المستخدمين" : "Total Users", value: stats?.totalUsers || 0, icon: Users, accent: "border-s-primary", bg: "bg-primary/10", color: "text-primary", link: "/admin/users" },
    { title: isAr ? "المستخدمين النشطين" : "Active Users", value: stats?.activeUsers || 0, icon: UserCheck, accent: "border-s-primary", bg: "bg-primary/10", color: "text-primary", link: "/admin/users?status=active" },
    { title: isAr ? "تقارير معلقة" : "Pending Reports", value: stats?.pendingReports || 0, icon: Flag, accent: "border-s-destructive", bg: "bg-destructive/10", color: "text-destructive", link: "/admin/moderation", urgent: (stats?.pendingReports || 0) > 0 },
    { title: isAr ? "المسابقات" : "Competitions", value: stats?.totalCompetitions || 0, icon: Trophy, accent: "border-s-primary", bg: "bg-primary/10", color: "text-primary", link: "/admin/competitions" },
    { title: isAr ? "المعارض" : "Exhibitions", value: stats?.totalExhibitions || 0, icon: Landmark, accent: "border-s-primary", bg: "bg-primary/10", color: "text-primary", link: "/admin/exhibitions" },
    { title: isAr ? "الدورات" : "Masterclasses", value: stats?.totalMasterclasses || 0, icon: GraduationCap, accent: "border-s-primary", bg: "bg-primary/10", color: "text-primary", link: "/admin/masterclasses" },
    { title: isAr ? "المقالات" : "Articles", value: stats?.totalArticles || 0, icon: FileText, accent: "border-s-primary", bg: "bg-primary/10", color: "text-primary", link: "/admin/articles" },
    { title: isAr ? "الطلبات" : "Orders", value: stats?.totalOrders || 0, icon: Package, accent: "border-s-primary", bg: "bg-primary/10", color: "text-primary", link: "/admin/orders" },
  ], [stats, isAr]);

  const quickActions = useMemo(() => [
    { title: isAr ? "إدارة المستخدمين" : "User Management", description: isAr ? "عرض وتعديل جميع المستخدمين" : "View and edit all users", icon: Users, link: "/admin/users" },
    { title: isAr ? "إدارة الأدوار" : "Role Management", description: isAr ? "تعيين وإدارة صلاحيات المستخدمين" : "Assign and manage user permissions", icon: Shield, link: "/admin/roles" },
    { title: isAr ? "العضويات" : "Memberships", description: isAr ? "ترقية وتخفيض عضويات المستخدمين" : "Upgrade and downgrade memberships", icon: CreditCard, link: "/admin/memberships" },
    { title: isAr ? "مراجعة المحتوى" : "Content Moderation", description: isAr ? "مراجعة التقارير والمحتوى المُبلغ عنه" : "Review reports and flagged content", icon: Flag, link: "/admin/moderation", badge: stats?.pendingReports },
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

  return (
    <div className="space-y-6">
      <AdminPageHeader
        icon={LayoutDashboard}
        title={isAr ? "لوحة التحكم" : "Admin Dashboard"}
        description={isAr ? "مرحباً، مدير النظام" : "Welcome, Super Admin"}
        actions={
          <Badge variant="secondary" className="gap-1.5">
            <Shield className="h-3 w-3" />
            {isAr ? "صلاحيات كاملة" : "Full Access"}
          </Badge>
        }
      />

      {/* Stats Grid - improved with hover effects */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
        {statCards.map((stat) => (
          <Link key={stat.title} to={stat.link}>
            <Card className={`group border-s-[3px] ${stat.accent} transition-all duration-200 hover:shadow-lg hover:-translate-y-1 ${stat.urgent ? "ring-1 ring-destructive/30 animate-pulse" : ""}`}>
              <CardContent className="flex items-center gap-3 p-4">
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${stat.bg} transition-transform group-hover:scale-110`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div className="min-w-0">
                  {isLoading ? (
                    <>
                      <Skeleton className="h-7 w-14 mb-1" />
                      <Skeleton className="h-3 w-20" />
                    </>
                  ) : (
                    <>
                      <p className="text-2xl font-black leading-none tracking-tight">
                        {toEnglishDigits(stat.value.toLocaleString())}
                      </p>
                      <p className="mt-1 text-[11px] text-muted-foreground truncate">{stat.title}</p>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>


      {/* Today's Activity Summary */}
      <Card className="border-border/50 bg-gradient-to-r from-primary/5 to-transparent">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
              <Zap className="h-3.5 w-3.5 text-primary" />
            </div>
            <h3 className="text-sm font-bold">{isAr ? "نشاط اليوم" : "Today's Activity"}</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: isAr ? "مستخدمون جدد" : "New Users", value: todayStats?.newUsers || 0, icon: UserPlus, color: "text-primary" },
              { label: isAr ? "منشورات" : "Posts", value: todayStats?.newPosts || 0, icon: MessageSquare, color: "text-chart-2" },
              { label: isAr ? "طلبات" : "Orders", value: todayStats?.newOrders || 0, icon: Package, color: "text-chart-3" },
              { label: isAr ? "بلاغات" : "Reports", value: todayStats?.newReports || 0, icon: AlertTriangle, color: todayStats?.newReports ? "text-destructive" : "text-muted-foreground" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2.5 rounded-lg border border-border/40 bg-card p-3">
                <item.icon className={`h-4 w-4 shrink-0 ${item.color}`} />
                <div>
                  <p className={`text-lg font-black leading-none ${item.color}`}>{toEnglishDigits(item.value.toString())}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{item.label}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Analytics Widgets */}
      <AdminAnalyticsWidgets />

      {/* ML-Powered Insights */}
      <MLAnalyticsDashboard />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Quick Actions */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                <Activity className="h-3.5 w-3.5 text-primary" />
              </div>
              {isAr ? "إجراءات سريعة" : "Quick Actions"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {quickActions.map((action) => (
              <Link key={action.title} to={action.link}>
                <div className="flex items-center justify-between rounded-xl border border-border/50 p-3.5 transition-all hover:bg-accent/50 hover:shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <action.icon className="h-4 w-4 text-primary" />
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
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>

        {/* Recent Admin Actions */}
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
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
                  <div key={action.id} className="flex items-center justify-between rounded-lg border border-border/40 p-3">
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
      <Card className="border-border/50">
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
                className="flex items-center gap-3 rounded-xl border border-border/50 p-3 transition-all hover:shadow-md hover:bg-accent/30 hover:-translate-y-0.5"
              >
                <div className="relative h-10 w-10 shrink-0 rounded-full overflow-hidden ring-2 ring-primary/20">
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
    </div>
  );
}
