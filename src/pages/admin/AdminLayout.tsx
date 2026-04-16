import { useState } from "react";
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

/**
 * TYPOGRAPHY POLICY — ALTOHA DESIGN SYSTEM
 * Minimum font size: 11px (0.6875rem) desktop / 13px (0.8125rem) mobile.
 * Do NOT use `text-xs` on body text — only on badges & labels.
 * Scale: display(48) h1(36) h2(28) h3(22) h4(18) body-lg(18) body(16) body-sm(14) caption(13) label(12) overline(11).
 * IBM Plex Arabic required on all text.
 * See src/styles/typography.css for the complete policy.
 */

export default function AdminLayout() {
  const { language } = useLanguage();
  const [collapsed, setCollapsed] = useState(false);
  useGlobalShortcuts();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AdminHeader />
      <div className="flex flex-1 items-start">
        <aside
          className={cn(
            "hidden shrink-0 border-e border-border bg-card transition-all duration-200 md:sticky md:top-14 md:block md:max-h-[calc(100dvh-3.5rem)] md:self-start md:overflow-y-auto",
            collapsed ? "w-[60px]" : "w-56"
          )}
        >
          <div className="flex min-h-full flex-col">
            <div className="flex items-center justify-between border-b border-border px-2.5 py-2">
              {!collapsed && (
                <span className="px-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  {language === "ar" ? "القائمة" : "Navigation"}
                </span>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCollapsed(!collapsed)}
                className={cn(
                  "h-7 w-7 shrink-0 rounded-md transition-all hover:bg-muted active:scale-95",
                  collapsed && "mx-auto"
                )}
              >
                {collapsed ? <PanelLeft className="h-3.5 w-3.5" /> : <PanelLeftClose className="h-3.5 w-3.5" />}
              </Button>
            </div>
            <AdminSidebarNav collapsed={collapsed} />
          </div>
        </aside>

        <main className="min-w-0 flex-1 overflow-x-hidden">
          <div className="container space-y-4 px-4 sm:px-6 lg:px-8 py-5">
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
