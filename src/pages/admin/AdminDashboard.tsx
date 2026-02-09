import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  UserCheck, 
  Flag, 
  Trophy, 
  MessageSquare, 
  FileText,
  TrendingUp,
  ArrowRight,
  Shield,
  Activity,
  CreditCard,
  UserX,
  Landmark,
  Package,
  Building2,
  GraduationCap,
} from "lucide-react";
import { format } from "date-fns";

export default function AdminDashboard() {
  const { t, language } = useLanguage();

  // Fetch comprehensive stats
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
        supabase.from("profiles").select("id, full_name, username, avatar_url, created_at").order("created_at", { ascending: false }).limit(5),
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

  const statCards = [
    {
      title: language === "ar" ? "إجمالي المستخدمين" : "Total Users",
      value: stats?.totalUsers || 0,
      icon: Users,
      color: "text-primary",
      bgColor: "bg-primary/10",
      link: "/admin/users",
    },
    {
      title: language === "ar" ? "المستخدمين النشطين" : "Active Users",
      value: stats?.activeUsers || 0,
      icon: UserCheck,
      color: "text-primary",
      bgColor: "bg-primary/10",
      link: "/admin/users?status=active",
    },
    {
      title: language === "ar" ? "تقارير معلقة" : "Pending Reports",
      value: stats?.pendingReports || 0,
      icon: Flag,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
      link: "/admin/moderation",
      urgent: (stats?.pendingReports || 0) > 0,
    },
    {
      title: language === "ar" ? "المسابقات" : "Competitions",
      value: stats?.totalCompetitions || 0,
      icon: Trophy,
      color: "text-primary",
      bgColor: "bg-primary/10",
      link: "/admin/competitions",
    },
    {
      title: language === "ar" ? "المعارض" : "Exhibitions",
      value: stats?.totalExhibitions || 0,
      icon: Landmark,
      color: "text-primary",
      bgColor: "bg-primary/10",
      link: "/admin/exhibitions",
    },
    {
      title: language === "ar" ? "الدورات" : "Masterclasses",
      value: stats?.totalMasterclasses || 0,
      icon: GraduationCap,
      color: "text-primary",
      bgColor: "bg-primary/10",
      link: "/admin/masterclasses",
    },
    {
      title: language === "ar" ? "المقالات" : "Articles",
      value: stats?.totalArticles || 0,
      icon: FileText,
      color: "text-primary",
      bgColor: "bg-primary/10",
      link: "/admin/articles",
    },
    {
      title: language === "ar" ? "الطلبات" : "Orders",
      value: stats?.totalOrders || 0,
      icon: Package,
      color: "text-primary",
      bgColor: "bg-primary/10",
      link: "/admin/orders",
    },
  ];

  const quickActions = [
    {
      title: language === "ar" ? "إدارة المستخدمين" : "User Management",
      description: language === "ar" ? "عرض وتعديل جميع المستخدمين" : "View and edit all users",
      icon: Users,
      link: "/admin/users",
    },
    {
      title: language === "ar" ? "إدارة الأدوار" : "Role Management",
      description: language === "ar" ? "تعيين وإدارة صلاحيات المستخدمين" : "Assign and manage user permissions",
      icon: Shield,
      link: "/admin/roles",
    },
    {
      title: language === "ar" ? "العضويات" : "Memberships",
      description: language === "ar" ? "ترقية وتخفيض عضويات المستخدمين" : "Upgrade and downgrade memberships",
      icon: CreditCard,
      link: "/admin/memberships",
    },
    {
      title: language === "ar" ? "مراجعة المحتوى" : "Content Moderation",
      description: language === "ar" ? "مراجعة التقارير والمحتوى المُبلغ عنه" : "Review reports and flagged content",
      icon: Flag,
      link: "/admin/moderation",
      badge: stats?.pendingReports,
    },
  ];

  const getActionBadge = (actionType: string) => {
    const colors: Record<string, string> = {
      suspend_user: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      active_user: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      banned_user: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      change_membership: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      resolve_report: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      update_roles: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
      update_profile: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
    };
    return (
      <Badge className={colors[actionType] || "bg-muted"} variant="outline">
        {actionType.replace(/_/g, " ")}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold">{t("adminPanel")}</h1>
          <p className="text-muted-foreground">
            {language === "ar" ? "مرحباً، مدير النظام" : "Welcome, Super Admin"}
          </p>
        </div>
        <Badge variant="secondary" className="gap-1">
          <Shield className="h-3 w-3" />
          {language === "ar" ? "صلاحيات كاملة" : "Full Access"}
        </Badge>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Link key={stat.title} to={stat.link}>
            <Card className={`hover:shadow-md transition-shadow ${stat.urgent ? "ring-2 ring-orange-500" : ""}`}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`rounded-full p-2 ${stat.bgColor}`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoading ? "..." : stat.value.toLocaleString()}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              {language === "ar" ? "إجراءات سريعة" : "Quick Actions"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {quickActions.map((action) => (
              <Link key={action.title} to={action.link}>
                <div className="flex items-center justify-between rounded-lg border p-4 hover:bg-accent/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-primary/10 p-2">
                      <action.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{action.title}</p>
                      <p className="text-sm text-muted-foreground">{action.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {action.badge && action.badge > 0 && (
                      <Badge variant="destructive">{action.badge}</Badge>
                    )}
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>

        {/* Recent Admin Actions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              {language === "ar" ? "آخر الإجراءات" : "Recent Actions"}
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/admin/audit">
                {language === "ar" ? "عرض الكل" : "View All"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {stats?.recentActions?.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                {language === "ar" ? "لا توجد إجراءات حديثة" : "No recent actions"}
              </p>
            ) : (
              <div className="space-y-3">
                {stats?.recentActions?.map((action: any) => (
                  <div key={action.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                    <div className="flex items-center gap-3">
                      {getActionBadge(action.action_type)}
                    </div>
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
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{language === "ar" ? "أحدث المستخدمين" : "Recent Users"}</CardTitle>
            <CardDescription>
              {language === "ar" ? "آخر المستخدمين المسجلين" : "Latest registered users"}
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link to="/admin/users">
              {language === "ar" ? "عرض الكل" : "View All"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {stats?.recentUsers?.map((user: any) => (
              <Link 
                key={user.id} 
                to={`/${user.username || user.id}`}
                className="flex items-center gap-3 rounded-lg border p-3 hover:bg-accent/50 transition-colors"
              >
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                  {(user.full_name || "U")[0].toUpperCase()}
                </div>
                <div>
                  <p className="font-medium">{user.full_name || "Unknown"}</p>
                  <p className="text-xs text-muted-foreground">
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
