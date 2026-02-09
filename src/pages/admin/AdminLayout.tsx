import { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useIsAdmin } from "@/hooks/useAdmin";
import { Navigate, Outlet, NavLink } from "react-router-dom";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Footer } from "@/components/Footer";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Users,
  Shield,
  CreditCard,
  Flag,
  FileText,
  LayoutDashboard,
  UserSearch,
  Trophy,
  Settings,
  Palette,
  Plug,
  Bot,
  Newspaper,
  Image,
  Eye,
  ChevronLeft,
  ChevronRight,
  Building,
  Bell,
  Globe,
  Database,
  Award,
} from "lucide-react";

export default function AdminLayout() {
  const { t, language } = useLanguage();
  const { data: isAdmin, isLoading } = useIsAdmin();
  const [collapsed, setCollapsed] = useState(false);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  const navSections = [
    {
      title: language === "ar" ? "لوحة التحكم" : "Dashboard",
      items: [
        { to: "/admin", icon: LayoutDashboard, label: language === "ar" ? "نظرة عامة" : "Overview", end: true },
      ],
    },
    {
      title: language === "ar" ? "إدارة المستخدمين" : "User Management",
      items: [
        { to: "/admin/users", icon: Users, label: language === "ar" ? "المستخدمين" : "Users" },
        { to: "/admin/companies", icon: Building, label: language === "ar" ? "الشركات" : "Companies" },
        { to: "/admin/leads", icon: UserSearch, label: language === "ar" ? "العملاء المحتملين" : "Leads" },
        { to: "/admin/roles", icon: Shield, label: language === "ar" ? "الأدوار والصلاحيات" : "Roles & Permissions" },
        { to: "/admin/memberships", icon: CreditCard, label: language === "ar" ? "العضويات" : "Memberships" },
      ],
    },
    {
      title: language === "ar" ? "المحتوى" : "Content",
      items: [
        { to: "/admin/articles", icon: Newspaper, label: language === "ar" ? "المقالات والأخبار" : "Articles & News" },
        { to: "/admin/competitions", icon: Trophy, label: language === "ar" ? "المسابقات" : "Competitions" },
        { to: "/admin/certificates", icon: Award, label: language === "ar" ? "الشهادات" : "Certificates" },
        { to: "/admin/media", icon: Image, label: language === "ar" ? "مكتبة الوسائط" : "Media Library" },
        { to: "/admin/moderation", icon: Flag, label: language === "ar" ? "إدارة المحتوى" : "Moderation" },
      ],
    },
    {
      title: language === "ar" ? "التكاملات" : "Integrations",
      items: [
        { to: "/admin/integrations", icon: Plug, label: language === "ar" ? "التكاملات" : "Integrations" },
        { to: "/admin/ai", icon: Bot, label: language === "ar" ? "الذكاء الاصطناعي" : "AI Configuration" },
      ],
    },
    {
      title: language === "ar" ? "المظهر" : "Appearance",
      items: [
        { to: "/admin/theme", icon: Palette, label: language === "ar" ? "المظهر والألوان" : "Theme & Colors" },
        { to: "/admin/components", icon: Eye, label: language === "ar" ? "إظهار المكونات" : "Component Visibility" },
      ],
    },
    {
      title: language === "ar" ? "النظام" : "System",
      items: [
        { to: "/admin/settings", icon: Settings, label: language === "ar" ? "الإعدادات العامة" : "General Settings" },
        { to: "/admin/notifications", icon: Bell, label: language === "ar" ? "الإشعارات" : "Notifications" },
        { to: "/admin/localization", icon: Globe, label: language === "ar" ? "اللغات" : "Localization" },
        { to: "/admin/audit", icon: FileText, label: language === "ar" ? "سجل العمليات" : "Audit Log" },
        { to: "/admin/database", icon: Database, label: language === "ar" ? "قاعدة البيانات" : "Database" },
      ],
    },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <AdminHeader />
      <div className="flex flex-1">
        {/* Sidebar */}
        <aside 
          className={cn(
            "sticky top-0 hidden h-[calc(100vh-64px)] shrink-0 border-r bg-card transition-all duration-300 md:block",
            collapsed ? "w-16" : "w-64"
          )}
        >
          <div className="flex h-full flex-col">
            {/* Collapse Toggle */}
            <div className="flex items-center justify-between border-b p-3">
              {!collapsed && (
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <Building className="h-4 w-4" />
                  </div>
                  <span className="font-semibold">{language === "ar" ? "لوحة الإدارة" : "Admin Panel"}</span>
                </div>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCollapsed(!collapsed)}
                className={cn("shrink-0", collapsed && "mx-auto")}
              >
                {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              </Button>
            </div>

            {/* Navigation */}
            <ScrollArea className="flex-1 p-2">
              <nav className="space-y-4">
                {navSections.map((section, idx) => (
                  <div key={idx}>
                    {!collapsed && (
                      <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {section.title}
                      </p>
                    )}
                    <div className="space-y-1">
                      {section.items.map((item) => (
                        <NavLink
                          key={item.to}
                          to={item.to}
                          end={item.end}
                          className={({ isActive }) =>
                            cn(
                              "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                              collapsed && "justify-center px-2",
                              isActive
                                ? "bg-primary text-primary-foreground"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            )
                          }
                          title={collapsed ? item.label : undefined}
                        >
                          <item.icon className="h-4 w-4 shrink-0" />
                          {!collapsed && <span className="truncate">{item.label}</span>}
                        </NavLink>
                      ))}
                    </div>
                    {idx < navSections.length - 1 && !collapsed && <Separator className="my-3" />}
                  </div>
                ))}
              </nav>
            </ScrollArea>
          </div>
        </aside>

        {/* Main Content */}
        <main className="min-w-0 flex-1">
          <div className="container py-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
