import { useLocation, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Trophy,
  Users,
  Search,
  Home,
} from "lucide-react";

const navItems = [
  { to: "/", icon: Home, labelEn: "Home", labelAr: "الرئيسية", authOnly: false, exact: true },
  { to: "/competitions", icon: Trophy, labelEn: "Compete", labelAr: "المسابقات", authOnly: false },
  { to: "/search", icon: Search, labelEn: "Search", labelAr: "بحث", authOnly: false },
  { to: "/community", icon: Users, labelEn: "Community", labelAr: "المجتمع", authOnly: false },
  { to: "/dashboard", icon: LayoutDashboard, labelEn: "Dashboard", labelAr: "لوحتي", authOnly: true },
];

export function MobileBottomNav() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const location = useLocation();
  const isAr = language === "ar";

  const visible = navItems.filter((item) => !item.authOnly || user);

  // Hide on admin pages, auth page, etc.
  const hiddenPaths = ["/auth", "/admin", "/onboarding", "/install"];
  if (hiddenPaths.some((p) => location.pathname.startsWith(p))) return null;

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-50 border-t border-border/40 bg-card/95 backdrop-blur-xl supports-[backdrop-filter]:bg-card/80 md:hidden shadow-[0_-4px_20px_-4px_hsl(var(--foreground)/0.06)]"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      role="navigation"
      aria-label="Mobile navigation"
    >
      <div className="flex items-center justify-around px-2 h-16">
        {visible.map((item) => {
          const isActive = item.exact
            ? location.pathname === item.to
            : location.pathname.startsWith(item.to);
          const Icon = item.icon;

          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 flex-1 py-1.5 rounded-xl transition-all duration-200 active:scale-[0.92] min-h-[48px] touch-manipulation",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div
                className={cn(
                  "relative flex h-8 w-8 items-center justify-center rounded-xl transition-all duration-300",
                  isActive && "bg-primary/10 scale-110 shadow-sm shadow-primary/10"
                )}
              >
                <Icon className={cn("h-5 w-5 transition-colors duration-200", isActive && "text-primary")} />
                {isActive && (
                  <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 h-0.5 w-4 rounded-full bg-primary" />
                )}
              </div>
              <span className={cn(
                "text-[10px] font-medium leading-none transition-all duration-200",
                isActive && "font-bold"
              )}>
                {isAr ? item.labelAr : item.labelEn}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
