import { memo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { useUserRoles } from "@/hooks/useUserRole";
import { useScrolled } from "@/hooks/useScrolled";
import { useScrollDirection } from "@/hooks/useScrollDirection";
import { useSiteSettingsContext } from "@/contexts/SiteSettingsContext";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { ThemeToggle } from "./ThemeToggle";
import { NotificationBell } from "./notifications/NotificationBell";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DesktopNav } from "./header/DesktopNav";
import { UserDropdown } from "./header/UserDropdown";
import { MobileMenu } from "./header/MobileMenu";
import { cn } from "@/lib/utils";
import {
  Trophy,
  Users,
  GraduationCap,
  Landmark,
  Newspaper,
  ShoppingBag,
  UtensilsCrossed,
  Building2,
  Star,
  BookOpen,
  HandHeart,
  Factory,
} from "lucide-react";

const primaryNav = [
  { to: "/competitions", icon: Trophy, labelEn: "Competitions", labelAr: "المسابقات" },
  { to: "/exhibitions", icon: Landmark, labelEn: "Exhibitions", labelAr: "المعارض" },
  { to: "/community", icon: Users, labelEn: "Community", labelAr: "المجتمع" },
  { to: "/news", icon: Newspaper, labelEn: "News", labelAr: "الأخبار" },
];

const moreLinks = [
  { to: "/organizers", icon: Building2, labelEn: "Organizers", labelAr: "المنظمون" },
  { to: "/masterclasses", icon: GraduationCap, labelEn: "Masterclasses", labelAr: "الدروس المتقدمة" },
  { to: "/recipes", icon: UtensilsCrossed, labelEn: "Recipes", labelAr: "الوصفات" },
  { to: "/shop", icon: ShoppingBag, labelEn: "Shop", labelAr: "المتجر" },
  { to: "/entities", icon: Star, labelEn: "Entities", labelAr: "الجهات" },
  { to: "/establishments", icon: Building2, labelEn: "Establishments", labelAr: "المؤسسات" },
  { to: "/pro-suppliers", icon: Factory, labelEn: "Pro Suppliers", labelAr: "الموردون المحترفون" },
  { to: "/mentorship", icon: HandHeart, labelEn: "Mentorship", labelAr: "الإرشاد" },
  { to: "/knowledge", icon: BookOpen, labelEn: "Knowledge", labelAr: "المعرفة" },
];

const HEADER_HEIGHT = "h-14";
const HEADER_SPACER = "h-14"; // Must match header height

export const Header = memo(function Header() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { data: userRoles = [] } = useUserRoles();
  const isJudge = userRoles.includes("judge");
  const isAr = language === "ar";
  const scrolled = useScrolled();
  const { visible: headerVisible } = useScrollDirection(12);
  const siteSettings = useSiteSettingsContext();
  const headerCfg = siteSettings.header || {};
  const brandCfg = siteSettings.branding || {};
  const identityLogos = (siteSettings.brand_identity as any)?.logos || {};
  const logoUrl = identityLogos.natural || identityLogos.variation2 || brandCfg.logoUrl || "/altoha-logo.png";

  const isFixed = headerCfg.stickyHeader !== false;

  return (
    <>
      <header
        role="banner"
        className={cn(
          "inset-x-0 top-0 z-50 border-b transition-all duration-300",
          isFixed ? "fixed" : "relative",
          scrolled
            ? "bg-card/95 backdrop-blur-xl border-border shadow-sm"
            : "bg-card border-border/40",
          isFixed && !headerVisible && "-translate-y-full"
        )}
      >
        <div className={cn("container flex items-center gap-3", HEADER_HEIGHT)}>
          {/* Left: Mobile menu + Logo */}
          <div className="flex items-center gap-2 shrink-0">
            <MobileMenu primaryNav={primaryNav} moreLinks={moreLinks} />
            <Link
              to="/"
              aria-label="Altoha homepage"
              className="flex items-center gap-2 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:rounded-lg"
            >
              {headerCfg.showLogo !== false && (
                <img
                  src={logoUrl}
                  alt={brandCfg.siteName || "Altoha"}
                  className="h-7 w-auto sm:h-8 transition-transform duration-200 group-hover:scale-105"
                />
              )}
              {headerCfg.showBrandName !== false && (
                <span className={cn(
                  "text-base font-bold text-foreground hidden sm:inline tracking-tight",
                  !isAr && "font-serif"
                )}>
                  {isAr ? (brandCfg.siteNameAr || "الطهاة") : (brandCfg.siteName || "Altoha")}
                </span>
              )}
            </Link>
          </div>

          {/* Center: Desktop Nav */}
          <DesktopNav
            primaryNav={primaryNav}
            moreLinks={moreLinks}
            isJudge={isJudge}
            isAr={isAr}
          />

          {/* Right: Actions */}
          <div className="flex items-center gap-1 ms-auto shrink-0">
            {headerCfg.showSearch !== false && (
              <Button variant="ghost" size="icon" asChild className="rounded-lg h-8 w-8">
                <Link to="/search"><Search className="h-4 w-4" /></Link>
              </Button>
            )}
            {user && headerCfg.showNotifications !== false && <NotificationBell />}
            {headerCfg.showThemeToggle !== false && <ThemeToggle />}
            {headerCfg.showLanguageSwitcher !== false && <LanguageSwitcher />}
            <UserDropdown />
          </div>
        </div>
      </header>

      {/* Spacer to prevent content from hiding behind fixed header */}
      {isFixed && <div className={HEADER_SPACER} aria-hidden="true" />}
    </>
  );
});
