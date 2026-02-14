import { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Navigate, Outlet, NavLink, useLocation } from "react-router-dom";
import { useCompanyAccess } from "@/hooks/useCompanyAccess";
import { useActiveCompanyRoles } from "@/hooks/useCompanyRoles";
import { useCompanyPagePermissions } from "@/hooks/useCompanyPermissions";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
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
  Package,
  Menu,
  Crown,
  MoreHorizontal,
  Megaphone,
  Bell,
} from "lucide-react";

export default function CompanyPortalLayout() {
  const { t, language } = useLanguage();
  const { companyId, isLoading } = useCompanyAccess();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const activeRoles = useActiveCompanyRoles(companyId);
  const permissions = useCompanyPagePermissions();

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

  const allNavItems = [
    { to: "/company", icon: LayoutDashboard, label: language === "ar" ? "لوحة التحكم" : "Dashboard", end: true, page: "dashboard" },
    { to: "/company/profile", icon: Building2, label: language === "ar" ? "ملف الشركة" : "Profile", page: "profile" },
    { to: "/company/notifications", icon: Bell, label: language === "ar" ? "الإشعارات" : "Notifications", page: "communications" },
    { to: "/company/team", icon: Users, label: language === "ar" ? "فريق العمل" : "Team", page: "team" },
    { to: "/company/catalog", icon: Package, label: language === "ar" ? "كتالوج المنتجات" : "Catalog", roles: ["supplier", "vendor"], page: "catalog" },
    { to: "/company/orders", icon: ShoppingCart, label: language === "ar" ? "الطلبيات" : "Orders", page: "orders" },
    { to: "/company/invoices", icon: FileText, label: language === "ar" ? "الفواتير" : "Invoices", page: "invoices" },
    { to: "/company/invitations", icon: FileText, label: language === "ar" ? "الدعوات" : "Invitations", roles: ["sponsor", "partner"], page: "invitations" },
    { to: "/company/sponsorships", icon: Crown, label: language === "ar" ? "فرص الرعاية" : "Sponsorships", roles: ["sponsor", "partner"], page: "sponsorships" },
    { to: "/company/communications", icon: MessageSquare, label: language === "ar" ? "التواصل" : "Comms", page: "communications" },
    { to: "/company/statements", icon: BarChart3, label: language === "ar" ? "كشوفات الحساب" : "Statements", page: "statements" },
    { to: "/company/transactions", icon: FileText, label: language === "ar" ? "المعاملات" : "Transactions", page: "transactions" },
    { to: "/company/evaluations", icon: Star, label: language === "ar" ? "التقييمات" : "Evaluations", page: "evaluations" },
    { to: "/company/media", icon: Image, label: language === "ar" ? "مكتبة الوسائط" : "Media", page: "media" },
    { to: "/company/branches", icon: Building2, label: language === "ar" ? "الفروع" : "Branches", page: "branches" },
    { to: "/company/drivers", icon: Truck, label: language === "ar" ? "السائقون" : "Drivers", roles: ["logistics", "supplier"], page: "drivers" },
    { to: "/company/working-hours", icon: Clock, label: language === "ar" ? "ساعات العمل" : "Hours", page: "working-hours" },
    { to: "/company/advertising", icon: Megaphone, label: language === "ar" ? "الإعلانات" : "Advertising", roles: ["sponsor", "partner", "vendor", "supplier"], page: "advertising" },
    { to: "/company/settings", icon: Settings, label: language === "ar" ? "الإعدادات" : "Settings", page: "settings" },
  ];

  // Filter nav items based on active company roles (show all if no roles assigned yet)
  const navItems = (activeRoles.length > 0
    ? allNavItems.filter(item => !item.roles || item.roles.some(r => activeRoles.includes(r)))
    : allNavItems
  ).filter(item => permissions.canAccess(item.page));

  // Bottom bar shows first 4 items + "More" on mobile
  const bottomBarItems = navItems.slice(0, 4);
  const isMoreActive = !bottomBarItems.some(
    (item) => item.end ? location.pathname === item.to : location.pathname.startsWith(item.to)
  );

  const NavList = ({ onNavigate }: { onNavigate?: () => void }) => (
    <nav className="space-y-1">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )
          }
        >
          <item.icon className="h-4 w-4 shrink-0" />
          <span className="truncate">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="flex flex-1">
        {/* Desktop Sidebar */}
        <aside
          className={cn(
            "sticky top-0 hidden h-[calc(100vh-64px)] shrink-0 border-r bg-card transition-all duration-300 md:block",
            collapsed ? "w-16" : "w-64"
          )}
        >
          <div className="flex h-full flex-col">
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
        <main className="min-w-0 flex-1 pb-20 md:pb-0">
          <div className="container py-6">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="fixed inset-x-0 bottom-0 z-50 border-t bg-card/95 backdrop-blur-sm md:hidden">
        <nav className="flex items-center justify-around px-1 py-1.5">
          {bottomBarItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "flex flex-1 flex-col items-center gap-0.5 rounded-md py-1.5 text-[10px] transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground"
                )
              }
            >
              <item.icon className="h-5 w-5" />
              <span className="truncate">{item.label}</span>
            </NavLink>
          ))}

          {/* More button opens sheet */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <button
                className={cn(
                  "flex flex-1 flex-col items-center gap-0.5 rounded-md py-1.5 text-[10px] transition-colors",
                  isMoreActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                <MoreHorizontal className="h-5 w-5" />
                <span>{language === "ar" ? "المزيد" : "More"}</span>
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="max-h-[70vh] rounded-t-2xl px-4 pb-8 pt-4">
              <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-muted" />
              <ScrollArea className="h-full">
                <NavList onNavigate={() => setMobileOpen(false)} />
              </ScrollArea>
            </SheetContent>
          </Sheet>
        </nav>
      </div>

      <div className="hidden md:block">
        <Footer />
      </div>
    </div>
  );
}
