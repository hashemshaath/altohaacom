import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { useUserRoles } from "@/hooks/useUserRole";
import { useScrolled } from "@/hooks/useScrolled";
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
  LayoutDashboard,
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

export function Header() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { data: userRoles = [] } = useUserRoles();
  const isJudge = userRoles.includes("judge");
  const isAr = language === "ar";
  const scrolled = useScrolled();
  const siteSettings = useSiteSettingsContext();
  const headerCfg = siteSettings.header || {};
  const brandCfg = siteSettings.branding || {};
  const identityLogos = (siteSettings.brand_identity as any)?.logos || {};
  // Priority: brand_identity logos > branding logoUrl > fallback
  const logoUrl = identityLogos.natural || identityLogos.variation2 || brandCfg.logoUrl || "/altoha-logo.png";

  const visiblePrimary = primaryNav;

  return (
    <header
      role="banner"
      className={cn(
        "fixed top-0 inset-x-0 z-50 border-b transition-all duration-300",
        headerCfg.stickyHeader === false && "relative",
        scrolled
          ? "bg-card/80 backdrop-blur-xl border-border/50 shadow-lg shadow-foreground/[0.03]"
          : "bg-card/60 backdrop-blur-md border-border/20 shadow-none"
      )}
    >
      <nav className="container flex h-14 items-center gap-2 sm:gap-2.5" aria-label="Main navigation">
        {/* Mobile menu */}
        <MobileMenu primaryNav={primaryNav} moreLinks={moreLinks} />

        {/* Logo */}
        <Link
          to="/"
          aria-label="Altoha homepage"
          className="flex shrink-0 items-center gap-2 me-1 sm:me-3 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:rounded-xl"
        >
          {headerCfg.showLogo !== false && (
            <img
              src={logoUrl}
              alt={brandCfg.siteName || "Altoha"}
              className="h-8 w-auto sm:h-9 transition-transform duration-200 group-hover:scale-105"
            />
          )}
          {headerCfg.showBrandName !== false && (
            <span className={cn("text-lg font-bold text-primary hidden sm:inline tracking-tight", !isAr && "font-serif")}>
              {isAr ? (brandCfg.siteNameAr || "الطهاة") : (brandCfg.siteName || "Altoha")}
            </span>
          )}
        </Link>

        {/* Desktop Nav */}
        <DesktopNav
          primaryNav={visiblePrimary}
          moreLinks={moreLinks}
          isJudge={isJudge}
          isAr={isAr}
        />

        {/* Right side */}
        <div className="flex items-center gap-0.5 sm:gap-1 ms-auto">
          {headerCfg.showSearch !== false && (
            <div className="hidden md:block">
              <Button variant="ghost" size="icon" asChild className="rounded-full">
                <Link to="/search"><Search className="h-4 w-4" /></Link>
              </Button>
            </div>
          )}
          {user && headerCfg.showNotifications !== false && <NotificationBell />}
          {headerCfg.showThemeToggle !== false && <ThemeToggle />}
          {headerCfg.showLanguageSwitcher !== false && <LanguageSwitcher />}
          <UserDropdown />
        </div>
      </nav>
    </header>
  );
}
