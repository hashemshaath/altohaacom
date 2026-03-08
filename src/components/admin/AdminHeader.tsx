import { memo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { useSiteSettingsContext } from "@/contexts/SiteSettingsContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { AdminSearchCommand } from "./AdminSearchCommand";
import { AdminMobileNavDrawer } from "./AdminMobileNavDrawer";
import { Button } from "@/components/ui/button";
import { Home, LogOut } from "lucide-react";

export const AdminHeader = memo(function AdminHeader() {
  const { signOut } = useAuth();
  const { language } = useLanguage();
  const siteSettings = useSiteSettingsContext();
  const brandCfg = siteSettings.branding || {};
  const isAr = language === "ar";

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-card/70 backdrop-blur-xl">
      <div className="flex h-14 items-center justify-between px-4">
        {/* Left: Logo + Admin label */}
        <div className="flex items-center gap-3">
          <AdminMobileNavDrawer />
          <Link to="/admin" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-sm shadow-primary/20 transition-transform duration-200 group-hover:scale-105">
              <img src={brandCfg.logoUrl || "/altoha-logo.png"} alt={brandCfg.siteName || "Altoha"} className="h-6 w-auto brightness-0 invert" />
            </div>
            <span className={`text-lg font-bold text-foreground ${isAr ? "" : "font-serif"}`}>
              {isAr ? (brandCfg.siteNameAr || "الطهاة") : (brandCfg.siteName || "Altoha")}
            </span>
          </Link>
          <span className="hidden rounded-xl bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary sm:inline-block">
            {language === "ar" ? "لوحة الإدارة" : "Admin"}
          </span>
          <div className="hidden sm:block ms-1">
            <AdminSearchCommand />
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" asChild className="rounded-xl hover:bg-muted" title={language === "ar" ? "العودة للموقع" : "Back to site"}>
            <Link to="/dashboard">
              <Home className="h-4 w-4" />
            </Link>
          </Button>
          <NotificationBell />
          <ThemeToggle />
          <LanguageSwitcher />
          <div className="mx-1 h-6 w-px bg-border/50" />
          <Button variant="ghost" size="icon" onClick={signOut} className="rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10" title={language === "ar" ? "تسجيل الخروج" : "Sign out"}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
});
