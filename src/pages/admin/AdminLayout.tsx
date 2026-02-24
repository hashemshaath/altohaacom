import { useState } from "react";
import { Outlet } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import AdminPendingBanner from "@/components/admin/AdminPendingBanner";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminSidebarNav } from "@/components/admin/AdminSidebarNav";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Building, ChevronLeft, ChevronRight, Menu } from "lucide-react";

export default function AdminLayout() {
  const { language } = useLanguage();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col">
      <AdminHeader />
      <div className="flex flex-1">
        {/* Mobile Nav */}
        <div className="sticky top-14 z-30 flex h-12 items-center border-b bg-card px-4 md:hidden">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side={language === "ar" ? "right" : "left"} className="w-72 p-0">
              <div className="flex h-full flex-col">
                <div className="flex items-center gap-2 border-b p-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <Building className="h-4 w-4" />
                  </div>
                  <span className="font-semibold">{language === "ar" ? "لوحة الإدارة" : "Admin Panel"}</span>
                </div>
                <AdminSidebarNav isMobile onItemClick={() => setMobileOpen(false)} />
              </div>
            </SheetContent>
          </Sheet>
          <span className="ms-2 text-sm font-medium text-muted-foreground">
            {language === "ar" ? "القائمة" : "Menu"}
          </span>
        </div>

        {/* Desktop Sidebar */}
        <aside
          className={cn(
            "sticky top-14 hidden h-[calc(100vh-56px)] shrink-0 border-e bg-card transition-all duration-300 md:block",
            collapsed ? "w-16" : "w-64"
          )}
        >
          <div className="flex h-full flex-col">
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
            <AdminSidebarNav collapsed={collapsed} />
          </div>
        </aside>

        {/* Main Content */}
        <main className="min-w-0 flex-1">
          <div className="container py-6">
            <AdminPendingBanner />
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
