import { useLocation, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Trophy,
  Users,
  Newspaper,
  Search,
  Home,
} from "lucide-react";

const navItems = [
  { to: "/", icon: Home, labelEn: "Home", labelAr: "الرئيسية", authOnly: false, exact: true },
  { to: "/competitions", icon: Trophy, labelEn: "Compete", labelAr: "المسابقات", authOnly: false },
  { to: "/community", icon: Users, labelEn: "Community", labelAr: "المجتمع", authOnly: false },
  { to: "/news", icon: Newspaper, labelEn: "News", labelAr: "الأخبار", authOnly: false },
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
      className="fixed bottom-0 inset-x-0 z-50 border-t border-border/60 bg-card/95 backdrop-blur-xl supports-[backdrop-filter]:bg-card/85 md:hidden safe-area-bottom"
      role="navigation"
      aria-label="Mobile navigation"
    >
      <div className="flex items-center justify-around px-1 h-16">
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
                "flex flex-col items-center justify-center gap-0.5 flex-1 py-1.5 rounded-xl transition-all duration-200 active:scale-95",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-xl transition-all duration-200",
                  isActive && "bg-primary/10 shadow-sm"
                )}
              >
                <Icon className={cn("h-5 w-5", isActive && "text-primary")} />
              </div>
              <span className="text-[10px] font-medium leading-none">
                {isAr ? item.labelAr : item.labelEn}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
