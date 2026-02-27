import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { useSiteSettingsContext } from "@/contexts/SiteSettingsContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { AdminSearchCommand } from "./AdminSearchCommand";
import { Button } from "@/components/ui/button";
import { Home, LogOut } from "lucide-react";

export function AdminHeader() {
  const { signOut } = useAuth();
  const { language } = useLanguage();
  const siteSettings = useSiteSettingsContext();
  const brandCfg = siteSettings.branding || {};
  const isAr = language === "ar";

  return (
    <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-md">
      <div className="flex h-14 items-center justify-between px-4">
        {/* Left: Logo + Admin label */}
        <div className="flex items-center gap-3">
          <Link to="/admin" className="flex items-center gap-2">
            <img src={brandCfg.logoUrl || "/altoha-logo.png"} alt={brandCfg.siteName || "Altoha"} className="h-8 w-auto" />
            <span className={`text-lg font-bold text-primary ${isAr ? "" : "font-serif"}`}>
              {isAr ? (brandCfg.siteNameAr || "الطهاة") : (brandCfg.siteName || "Altoha")}
            </span>
          </Link>
          <span className="hidden rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary sm:inline-block">
            {language === "ar" ? "لوحة الإدارة" : "Admin"}
          </span>
          <div className="hidden sm:block ms-2">
            <AdminSearchCommand />
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5">
          <Button variant="ghost" size="icon" asChild title={language === "ar" ? "العودة للموقع" : "Back to site"}>
            <Link to="/dashboard">
              <Home className="h-4 w-4" />
            </Link>
          </Button>
          <NotificationBell />
          <ThemeToggle />
          <LanguageSwitcher />
          <Button variant="ghost" size="icon" onClick={signOut} title={language === "ar" ? "تسجيل الخروج" : "Sign out"}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
