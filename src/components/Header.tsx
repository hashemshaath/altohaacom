import { ROUTES } from "@/config/routes";
import { useIsAr } from "@/hooks/useIsAr";
import { forwardRef, useState, useEffect } from "react";
import { useScrolled } from "@/hooks/useScrolled";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRoles } from "@/hooks/useUserRole";
import { useSiteSettingsContext } from "@/contexts/SiteSettingsContext";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { ThemeToggle } from "./ThemeToggle";
import { NotificationBell } from "./notifications/NotificationBell";
import { DesktopNav } from "./header/DesktopNav";
import { UserDropdown } from "./header/UserDropdown";
import { MobileMenu } from "./header/MobileMenu";
import { SearchBarLazy as SearchBar } from "./features/SearchBarLazy";
import { cn } from "@/lib/utils";
import { Search, X } from "lucide-react";
import {
  Trophy, Users, GraduationCap, Landmark, Newspaper,
  ShoppingBag, UtensilsCrossed, Building2, Star, BookOpen,
  HandHeart, Factory, Briefcase, CalendarDays, Medal,
} from "lucide-react";

const primaryNav = [
  { to: ROUTES.competitions, icon: Trophy, labelEn: "Competitions", labelAr: "المسابقات" },
  { to: ROUTES.exhibitions, icon: Landmark, labelEn: "Exhibitions", labelAr: "المعارض" },
  { to: ROUTES.community, icon: Users, labelEn: "Community", labelAr: "المجتمع" },
  { to: ROUTES.blog, icon: Newspaper, labelEn: "News", labelAr: "الأخبار" },
];

const moreLinks = [
  { to: ROUTES.jobs, icon: Briefcase, labelEn: "Jobs", labelAr: "الوظائف" },
  { to: ROUTES.organizers, icon: Building2, labelEn: "Organizers", labelAr: "المنظمون" },
  { to: ROUTES.masterclasses, icon: GraduationCap, labelEn: "Masterclasses", labelAr: "الدروس المتقدمة" },
  { to: ROUTES.recipes, icon: UtensilsCrossed, labelEn: "Recipes", labelAr: "الوصفات" },
  { to: ROUTES.shop, icon: ShoppingBag, labelEn: "Shop", labelAr: "المتجر" },
  { to: ROUTES.entities, icon: Star, labelEn: "Entities", labelAr: "الجهات" },
  { to: ROUTES.establishments, icon: Building2, labelEn: "Establishments", labelAr: "المؤسسات" },
  { to: ROUTES.proSuppliers, icon: Factory, labelEn: "Pro Suppliers", labelAr: "الموردون المحترفون" },
  { to: ROUTES.mentorship, icon: HandHeart, labelEn: "Mentorship", labelAr: "الإرشاد" },
  { to: ROUTES.knowledge, icon: BookOpen, labelEn: "Knowledge", labelAr: "المعرفة" },
  { to: ROUTES.eventsCalendar, icon: CalendarDays, labelEn: "Events", labelAr: "الفعاليات" },
  { to: ROUTES.rankings, icon: Medal, labelEn: "Rankings", labelAr: "التصنيفات" },
];

export const Header = forwardRef<HTMLElement>(function Header(_, ref) {
  const { user } = useAuth();
  const isAr = useIsAr();
  const { data: userRoles = [] } = useUserRoles();
  const isJudge = userRoles.includes("judge");
  const siteSettings = useSiteSettingsContext();
  const headerCfg = siteSettings.header || {};
  const brandCfg = siteSettings.branding || {};
  const identityLogos = (siteSettings.brand_identity as Record<string, Record<string, string>> | undefined)?.logos || {};
  const logoUrl = identityLogos.natural || identityLogos.variation2 || brandCfg.logoUrl || "/altoha-logo.png";

  const scrolled = useScrolled(20);
  const [searchOpen, setSearchOpen] = useState(false);

  // Escape closes overlay
  useEffect(() => {
    if (!searchOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSearchOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [searchOpen]);

  return (
    <header
      ref={ref}
      role="banner"
      className={cn(
        "sticky inset-x-0 top-0 z-[100] transition-all duration-300",
        "h-[56px] lg:h-[64px]",
        "bg-[#FEFCF8] dark:bg-[hsl(220,20%,10%)]",
        "border-b",
        scrolled
          ? "border-border/40 shadow-sm dark:border-border/30 dark:shadow-black/20"
          : "border-border/20 dark:border-border/10"
      )}
    >
      <div className="relative mx-auto flex h-full max-w-[1280px] items-center gap-4 px-4 lg:px-6">
        {/* Mobile: hamburger */}
        <MobileMenu primaryNav={primaryNav} moreLinks={moreLinks} />

        {/* Logo */}
        <Link
          to="/"
          aria-label="Altoha homepage"
          className={cn(
            "flex items-center gap-2.5 shrink-0 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:rounded-lg",
            searchOpen && "lg:invisible"
          )}
        >
          {headerCfg.showLogo !== false && (
            <img
              src={logoUrl}
              alt={isAr ? "الطهاة — الصفحة الرئيسية" : "Altoha — Homepage"}
              className="h-8 w-auto transition-transform duration-300 group-hover:scale-105"
              loading="eager"
            />
          )}
          {headerCfg.showBrandName !== false && (
            <span className="text-base font-bold hidden sm:inline tracking-tight text-foreground">
              {isAr ? (brandCfg.siteNameAr || "الطهاة") : (brandCfg.siteName || "Altoha")}
            </span>
          )}
        </Link>

        {/* Center: Desktop Nav (hidden on desktop while overlay is open) */}
        <div className={cn("flex flex-1 items-center min-w-0", searchOpen && "lg:invisible")}>
          <DesktopNav
            primaryNav={primaryNav}
            moreLinks={moreLinks}
            isJudge={isJudge}
            isAr={isAr}
          />
        </div>

        {/* Right: Actions */}
        <div className={cn("flex items-center gap-1.5 ms-auto shrink-0", searchOpen && "lg:invisible")}>
          {headerCfg.showSearch !== false && (
            <>
              {/* Desktop: opens overlay */}
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                aria-label={isAr ? "البحث" : "Search"}
                className="hidden lg:flex items-center justify-center h-10 w-10 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors duration-150"
              >
                <Search className="h-[18px] w-[18px]" aria-hidden="true" />
              </button>
              {/* Mobile: navigates to /search */}
              <Link
                to={ROUTES.search}
                aria-label={isAr ? "البحث" : "Search"}
                className="lg:hidden flex items-center justify-center h-10 w-10 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors duration-150 touch-manipulation"
              >
                <Search className="h-[18px] w-[18px]" aria-hidden="true" />
              </Link>
            </>
          )}
          {user && headerCfg.showNotifications !== false && <NotificationBell />}
          {headerCfg.showThemeToggle !== false && <ThemeToggle />}
          {headerCfg.showLanguageSwitcher !== false && <LanguageSwitcher />}
          <UserDropdown />
        </div>

        {/* Desktop search overlay */}
        {searchOpen && (
          <div
            className="hidden lg:flex absolute inset-x-0 top-0 h-full bg-background items-center gap-3 px-6 animate-in fade-in-0 duration-150 z-10"
            role="dialog"
            aria-label={isAr ? "البحث" : "Search"}
          >
            <div className="flex-1 max-w-[860px] mx-auto">
              <SearchBar autoFocus />
            </div>
            <button
              type="button"
              onClick={() => setSearchOpen(false)}
              aria-label={isAr ? "إغلاق" : "Close"}
              className="flex items-center justify-center h-10 w-10 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors shrink-0"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
});

Header.displayName = "Header";
