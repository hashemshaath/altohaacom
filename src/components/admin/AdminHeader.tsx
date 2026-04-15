import { useIsAr } from "@/hooks/useIsAr";
import { memo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { useSiteSettingsContext } from "@/contexts/SiteSettingsContext";
import { useAdminRole } from "@/hooks/useAdminRole";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AdminColorStyleSelector } from "./AdminColorStyleSelector";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { AdminSearchCommand } from "./AdminSearchCommand";
import { AdminMobileNavDrawer } from "./AdminMobileNavDrawer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Home, LogOut, ShieldCheck, Shield } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export const AdminHeader = memo(function AdminHeader() {
  const { signOut } = useAuth();
  const { language } = useLanguage();
  const isAr = useIsAr();
  const siteSettings = useSiteSettingsContext();
  const { isSuperAdmin, adminRole } = useAdminRole();
  const brandCfg = siteSettings.branding || {};

  const roleBadge = isSuperAdmin
    ? { label: isAr ? "مسؤول أعلى" : "Super Admin", icon: ShieldCheck, className: "bg-destructive/10 text-destructive border-destructive/20" }
    : adminRole === ("admin" as unknown)
    ? { label: isAr ? "مسؤول" : "Admin", icon: Shield, className: "bg-primary/10 text-primary border-primary/20" }
    : null;

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card">
      <div className="flex h-14 items-center justify-between px-4">
        {/* Left */}
        <div className="flex items-center gap-3">
          <AdminMobileNavDrawer />
          <Link to="/admin" className="flex items-center gap-2.5 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary transition-all duration-200 group-hover:scale-105">
              <img loading="lazy" decoding="async" src={brandCfg.logoUrl || "/altoha-logo.png"} alt={brandCfg.siteName || "Altoha"} className="h-5 w-auto brightness-0 invert" />
            </div>
            <span className={`text-base font-bold text-foreground ${isAr ? "" : "font-serif"}`}>
              {isAr ? (brandCfg.siteNameAr || "الطهاة") : (brandCfg.siteName || "Altoha")}
            </span>
          </Link>
          {roleBadge ? (
            <Badge variant="outline" className={`hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold ${roleBadge.className}`}>
              <roleBadge.icon className="h-3 w-3" />
              {roleBadge.label}
            </Badge>
          ) : (
            <span className="hidden rounded bg-primary/10 px-2 py-0.5 text-[12px] font-semibold uppercase tracking-wider text-primary sm:inline-block">
              {language === "ar" ? "الإدارة" : "Admin"}
            </span>
          )}
          <div className="hidden sm:block ms-1">
            <AdminSearchCommand />
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" asChild className="rounded-md h-8 w-8 hover:bg-muted transition-all active:scale-95" aria-label={isAr ? "العودة للموقع" : "Back to site"}>
                <Link to="/dashboard">
                  <Home className="h-4 w-4" />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent className="text-xs">{isAr ? "العودة للموقع" : "Back to site"}</TooltipContent>
          </Tooltip>
          <NotificationBell />
          <AdminColorStyleSelector />
          <ThemeToggle />
          <LanguageSwitcher />
          <div className="mx-1 h-5 w-px bg-border" />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={signOut} className="rounded-md h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all active:scale-95" aria-label={isAr ? "تسجيل الخروج" : "Sign out"}>
                <LogOut className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="text-xs">{isAr ? "تسجيل الخروج" : "Sign out"}</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </header>
  );
});
