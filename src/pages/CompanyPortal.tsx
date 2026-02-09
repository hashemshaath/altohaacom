import { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Navigate, Outlet, NavLink } from "react-router-dom";
import { useCompanyAccess } from "@/hooks/useCompanyAccess";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  LayoutDashboard,
  ShoppingCart,
  MessageSquare,
  FileText,
  Users,
  Image,
  Clock,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Building2,
  Truck,
  Star,
} from "lucide-react";

export default function CompanyPortalLayout() {
  const { t, language } = useLanguage();
  const { companyId, isLoading } = useCompanyAccess();
  const [collapsed, setCollapsed] = useState(false);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!companyId) {
    return <Navigate to="/dashboard" replace />;
  }

  const navItems = [
    { to: "/company", icon: LayoutDashboard, label: language === "ar" ? "لوحة التحكم" : "Dashboard", end: true },
    { to: "/company/profile", icon: Building2, label: language === "ar" ? "ملف الشركة" : "Company Profile" },
    { to: "/company/team", icon: Users, label: language === "ar" ? "فريق العمل" : "Team" },
    { to: "/company/orders", icon: ShoppingCart, label: language === "ar" ? "الطلبيات" : "Orders" },
    { to: "/company/invitations", icon: FileText, label: language === "ar" ? "الدعوات" : "Invitations" },
    { to: "/company/communications", icon: MessageSquare, label: language === "ar" ? "التواصل" : "Communications" },
    { to: "/company/statements", icon: BarChart3, label: language === "ar" ? "كشوفات الحساب" : "Statements" },
    { to: "/company/transactions", icon: FileText, label: language === "ar" ? "المعاملات" : "Transactions" },
    { to: "/company/evaluations", icon: Star, label: language === "ar" ? "التقييمات" : "Evaluations" },
    { to: "/company/media", icon: Image, label: language === "ar" ? "مكتبة الوسائط" : "Media Library" },
    { to: "/company/branches", icon: Building2, label: language === "ar" ? "الفروع" : "Branches" },
    { to: "/company/drivers", icon: Truck, label: language === "ar" ? "السائقون" : "Drivers" },
    { to: "/company/working-hours", icon: Clock, label: language === "ar" ? "ساعات العمل" : "Working Hours" },
    { to: "/company/settings", icon: Settings, label: language === "ar" ? "الإعدادات" : "Settings" },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="flex flex-1">
        {/* Sidebar */}
        <aside
          className={cn(
            "sticky top-0 hidden h-[calc(100vh-64px)] shrink-0 border-r bg-card transition-all duration-300 md:block",
            collapsed ? "w-16" : "w-64"
          )}
        >
          <div className="flex h-full flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b p-3">
              {!collapsed && (
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <span className="font-semibold">{language === "ar" ? "بوابة الشركة" : "Company Portal"}</span>
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
              <nav className="space-y-1">
                {navItems.map((item) => (
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
      <Footer />
    </div>
  );
}
