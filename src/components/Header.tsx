import { useIsAr } from "@/hooks/useIsAr";
import { forwardRef } from "react";
import { useScrolled } from "@/hooks/useScrolled";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRoles } from "@/hooks/useUserRole";
import { useSiteSettingsContext } from "@/contexts/SiteSettingsContext";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { ThemeToggle } from "./ThemeToggle";
import { NotificationBell } from "./notifications/NotificationBell";
import { Button } from "@/components/ui/button";
import { DesktopNav } from "./header/DesktopNav";
import { UserDropdown } from "./header/UserDropdown";
import { MobileMenu } from "./header/MobileMenu";
import { cn } from "@/lib/utils";
import {
  Search, Trophy, Users, GraduationCap, Landmark, Newspaper,
  ShoppingBag, UtensilsCrossed, Building2, Star, BookOpen,
  HandHeart, Factory, Briefcase, CalendarDays, Medal,
} from "lucide-react";

const primaryNav = [
  { to: "/competitions", icon: Trophy, labelEn: "Competitions", labelAr: "المسابقات" },
  { to: "/exhibitions", icon: Landmark, labelEn: "Exhibitions", labelAr: "المعارض" },
  { to: "/community", icon: Users, labelEn: "Community", labelAr: "المجتمع" },
  { to: "/blog", icon: Newspaper, labelEn: "News", labelAr: "الأخبار" },
];

const moreLinks = [
  { to: "/jobs", icon: Briefcase, labelEn: "Jobs", labelAr: "الوظائف" },
  { to: "/organizers", icon: Building2, labelEn: "Organizers", labelAr: "المنظمون" },
  { to: "/masterclasses", icon: GraduationCap, labelEn: "Masterclasses", labelAr: "الدروس المتقدمة" },
  { to: "/recipes", icon: UtensilsCrossed, labelEn: "Recipes", labelAr: "الوصفات" },
  { to: "/shop", icon: ShoppingBag, labelEn: "Shop", labelAr: "المتجر" },
  { to: "/entities", icon: Star, labelEn: "Entities", labelAr: "الجهات" },
  { to: "/establishments", icon: Building2, labelEn: "Establishments", labelAr: "المؤسسات" },
  { to: "/pro-suppliers", icon: Factory, labelEn: "Pro Suppliers", labelAr: "الموردون المحترفون" },
  { to: "/mentorship", icon: HandHeart, labelEn: "Mentorship", labelAr: "الإرشاد" },
  { to: "/knowledge", icon: BookOpen, labelEn: "Knowledge", labelAr: "المعرفة" },
  { to: "/events-calendar", icon: CalendarDays, labelEn: "Events", labelAr: "الفعاليات" },
  { to: "/rankings", icon: Medal, labelEn: "Rankings", labelAr: "التصنيفات" },
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

  return (
    <>
      <header
        ref={ref}
        role="banner"
        className={cn(
          "sticky inset-x-0 top-0 z-50 transition-all duration-300",
          /* Desktop: 72px, Mobile: 60px */
          "h-[60px] lg:h-[72px]",
          scrolled
            ? "bg-[var(--bg-background)] shadow-[0_1px_0_rgba(0,0,0,0.06),0_2px_12px_rgba(0,0,0,0.04)] border-b border-[var(--color-border)]"
            : "bg-[var(--bg-background)]/95 dark:bg-[rgba(17,24,39,0.95)] backdrop-blur-[20px] backdrop-saturate-[180%] border-b border-[var(--color-border-light)] dark:border-[rgba(55,65,81,0.8)]"
        )}
        style={{ WebkitBackdropFilter: scrolled ? undefined : "blur(20px) saturate(180%)" }}
      >
        <div className="mx-auto flex h-full max-w-[var(--container-max)] items-center gap-4 px-4 lg:px-6">
          {/* Mobile: hamburger on the left (LTR) / right (RTL) */}
          <MobileMenu primaryNav={primaryNav} moreLinks={moreLinks} />

          {/* Logo */}
          <Link
            to="/"
            aria-label="Altoha homepage"
            className="flex items-center gap-2.5 shrink-0 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:rounded-lg"
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
              <span className="text-base font-bold text-[var(--color-heading)] hidden sm:inline tracking-tight">
                {isAr ? (brandCfg.siteNameAr || "الطهاة") : (brandCfg.siteName || "Altoha")}
              </span>
            )}
          </Link>

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
              <Button variant="ghost" size="icon" asChild className="rounded-full h-10 w-10 text-[var(--color-muted)] hover:text-[var(--color-heading)] hover:bg-[var(--bg-surface)] touch-manipulation transition-colors duration-150">
                <Link to="/search" aria-label={isAr ? "البحث" : "Search"}>
                  <Search className="h-[18px] w-[18px]" aria-hidden="true" />
                </Link>
              </Button>
            )}
            {user && headerCfg.showNotifications !== false && <NotificationBell />}
            {headerCfg.showThemeToggle !== false && <ThemeToggle />}
            {headerCfg.showLanguageSwitcher !== false && <LanguageSwitcher />}
            <UserDropdown />
          </div>
        </div>
      </header>
    </>
  );
});

Header.displayName = "Header";
