import { useState, Suspense } from "react";
import { Outlet } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import AdminPendingBanner from "@/components/admin/AdminPendingBanner";
import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminSidebarNav } from "@/components/admin/AdminSidebarNav";
import { AdminPageTransition } from "@/components/admin/AdminPageTransition";
import { cn } from "@/lib/utils";
import { WidgetErrorBoundary } from "@/components/WidgetErrorBoundary";
import { useGlobalShortcuts } from "@/hooks/useGlobalShortcuts";
import { Button } from "@/components/ui/button";
import { PanelLeftClose, PanelLeft } from "lucide-react";

export default function AdminLayout() {
  const { language } = useLanguage();
  const [collapsed, setCollapsed] = useState(false);
  useGlobalShortcuts();

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <AdminHeader />
      <div className="flex flex-1">
        {/* Desktop Sidebar */}
        <aside
          className={cn(
            "sticky top-14 hidden h-[calc(100vh-56px)] shrink-0 border-e border-border/40 bg-card/80 backdrop-blur-sm transition-all duration-300 md:block",
            collapsed ? "w-[60px]" : "w-60"
          )}
        >
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b border-border/30 px-2.5 py-2.5">
              {!collapsed && (
                <span className="px-1 text-xs font-semibold text-muted-foreground/80 uppercase tracking-wider">
                  {language === "ar" ? "القائمة" : "Menu"}
                </span>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCollapsed(!collapsed)}
                className={cn("shrink-0 rounded-lg h-7 w-7 hover:bg-muted active:scale-90 transition-all", collapsed && "mx-auto")}
              >
                {collapsed ? <PanelLeft className="h-3.5 w-3.5" /> : <PanelLeftClose className="h-3.5 w-3.5" />}
              </Button>
            </div>
            <AdminSidebarNav collapsed={collapsed} />
          </div>
        </aside>

        {/* Main Content */}
        <main className="min-w-0 flex-1">
          <div className="container py-6">
            <AdminPendingBanner />
            <AdminBreadcrumb />
            <WidgetErrorBoundary name="admin-page">
              <AdminPageTransition>
                <Outlet />
              </AdminPageTransition>
            </WidgetErrorBoundary>
          </div>
        </main>
      </div>
    </div>
  );
}
