import { useState } from "react";
import { Outlet } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import AdminPendingBanner from "@/components/admin/AdminPendingBanner";
import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminSidebarNav } from "@/components/admin/AdminSidebarNav";
import { cn } from "@/lib/utils";
import { useGlobalShortcuts } from "@/hooks/useGlobalShortcuts";
import { Button } from "@/components/ui/button";
import { Building, ChevronLeft, ChevronRight, PanelLeftClose, PanelLeft } from "lucide-react";

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
            "sticky top-14 hidden h-[calc(100vh-56px)] shrink-0 border-e border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-300 md:block",
            collapsed ? "w-[68px]" : "w-64"
          )}
        >
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b border-border/40 p-3">
              {!collapsed && (
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-sm shadow-primary/15">
                    <Building className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <span className="font-bold text-sm">{language === "ar" ? "لوحة الإدارة" : "Admin Panel"}</span>
                </div>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCollapsed(!collapsed)}
                className={cn("shrink-0 rounded-xl h-8 w-8 hover:bg-muted", collapsed && "mx-auto")}
              >
                {collapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
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
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
