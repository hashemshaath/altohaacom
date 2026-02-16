import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { useUserRoles } from "@/hooks/useUserRole";
import { useScrolled } from "@/hooks/useScrolled";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { ThemeToggle } from "./ThemeToggle";
import { NotificationBell } from "./notifications/NotificationBell";
import { QuickSearch } from "./search/QuickSearch";
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
} from "lucide-react";

const primaryNav = [
  { to: "/dashboard", icon: LayoutDashboard, labelEn: "Dashboard", labelAr: "لوحة التحكم", authOnly: true },
  { to: "/competitions", icon: Trophy, labelEn: "Competitions", labelAr: "المسابقات" },
  { to: "/exhibitions", icon: Landmark, labelEn: "Exhibitions", labelAr: "المعارض" },
  { to: "/community", icon: Users, labelEn: "Community", labelAr: "المجتمع" },
  { to: "/news", icon: Newspaper, labelEn: "News", labelAr: "الأخبار" },
];

const moreLinks = [
  { to: "/masterclasses", icon: GraduationCap, labelEn: "Masterclasses", labelAr: "الدروس المتقدمة" },
  { to: "/recipes", icon: UtensilsCrossed, labelEn: "Recipes", labelAr: "الوصفات" },
  { to: "/shop", icon: ShoppingBag, labelEn: "Shop", labelAr: "المتجر" },
  { to: "/entities", icon: Star, labelEn: "Entities", labelAr: "الجهات" },
  { to: "/establishments", icon: Building2, labelEn: "Establishments", labelAr: "المؤسسات" },
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

  const visiblePrimary = primaryNav.filter((l) => !l.authOnly || user);

  return (
    <header
      role="banner"
      className={cn(
        "sticky top-0 z-50 border-b bg-card/90 backdrop-blur-xl supports-[backdrop-filter]:bg-card/80 transition-shadow duration-300",
        scrolled
          ? "border-border/60 shadow-sm shadow-foreground/[0.03]"
          : "border-border/40 shadow-none"
      )}
    >
      <nav className="container flex h-14 items-center gap-1 sm:gap-2" aria-label="Main navigation">
        {/* Mobile menu - placed first for left alignment */}
        <MobileMenu primaryNav={primaryNav} moreLinks={moreLinks} />

        {/* Logo */}
        <Link
          to={user ? "/dashboard" : "/"}
          aria-label="Altohaa homepage"
          className="flex shrink-0 items-center gap-2 me-1 sm:me-2 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:rounded-lg"
        >
          <img
            src="/altohaa-logo.png"
            alt="Altohaa"
            className="h-7 w-auto sm:h-8 transition-transform duration-200 group-hover:scale-105"
          />
          <span className="font-serif text-lg font-bold text-primary hidden sm:inline">
            Altohaa
          </span>
        </Link>

        {/* Desktop Nav */}
        <DesktopNav
          primaryNav={visiblePrimary}
          moreLinks={moreLinks}
          isJudge={isJudge}
          isAr={isAr}
        />

        {/* Right side - consolidated */}
        <div className="flex items-center gap-1 ms-auto">
          <div className="hidden md:block">
            <QuickSearch />
          </div>
          {user && <NotificationBell />}
          <ThemeToggle />
          <LanguageSwitcher />
          <UserDropdown />
        </div>
      </nav>
    </header>
  );
}
