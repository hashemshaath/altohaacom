import { useLanguage } from "@/i18n/LanguageContext";
import { useIsAdmin } from "@/hooks/useAdmin";
import { Navigate, Outlet, NavLink } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { cn } from "@/lib/utils";
import {
  Users,
  Shield,
  CreditCard,
  Flag,
  FileText,
  LayoutDashboard,
} from "lucide-react";

export default function AdminLayout() {
  const { t } = useLanguage();
  const { data: isAdmin, isLoading } = useIsAdmin();

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

  const navItems = [
    { to: "/admin", icon: LayoutDashboard, label: t("adminPanel"), end: true },
    { to: "/admin/users", icon: Users, label: t("userManagement") },
    { to: "/admin/roles", icon: Shield, label: t("rolePermissions") },
    { to: "/admin/memberships", icon: CreditCard, label: t("membershipControl") },
    { to: "/admin/moderation", icon: Flag, label: t("contentModeration") },
    { to: "/admin/audit", icon: FileText, label: t("auditLog") },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="container flex flex-1 gap-6 py-6">
        {/* Sidebar */}
        <aside className="hidden w-64 shrink-0 md:block">
          <nav className="sticky top-20 space-y-1 rounded-lg border bg-card p-4">
            <h2 className="mb-4 font-serif text-lg font-semibold">{t("adminPanel")}</h2>
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )
                }
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
      <Footer />
    </div>
  );
}
