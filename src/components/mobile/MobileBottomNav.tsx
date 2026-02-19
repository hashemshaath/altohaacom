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
  Plus,
} from "lucide-react";
import { useState } from "react";

const navItems = [
  { to: "/", icon: Home, labelEn: "Home", labelAr: "الرئيسية", authOnly: false, exact: true },
  { to: "/competitions", icon: Trophy, labelEn: "Compete", labelAr: "المسابقات", authOnly: false },
  { to: "__fab__", icon: Plus, labelEn: "Create", labelAr: "إنشاء", authOnly: true, isFab: true },
  { to: "/community", icon: Users, labelEn: "Community", labelAr: "المجتمع", authOnly: false },
  { to: "/dashboard", icon: LayoutDashboard, labelEn: "My Space", labelAr: "مساحتي", authOnly: true },
];

const fabActions = [
  { to: "/create-competition", labelEn: "Competition", labelAr: "مسابقة", icon: Trophy },
  { to: "/search", labelEn: "Search", labelAr: "بحث", icon: Search },
  { to: "/community", labelEn: "Post", labelAr: "منشور", icon: Users },
];

export function MobileBottomNav() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const location = useLocation();
  const isAr = language === "ar";
  const [fabOpen, setFabOpen] = useState(false);

  const visible = navItems.filter((item) => !item.authOnly || user);

  const hiddenPaths = ["/auth", "/admin", "/onboarding", "/install"];
  if (hiddenPaths.some((p) => location.pathname.startsWith(p))) return null;

  return (
    <>
      {/* FAB overlay */}
      {fabOpen && (
        <div className="fixed inset-0 z-[55] bg-background/60 backdrop-blur-sm md:hidden" onClick={() => setFabOpen(false)}>
          <div className="absolute bottom-24 inset-x-0 flex flex-col items-center gap-2.5" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
            {fabActions.map((action, i) => (
              <Link
                key={action.to}
                to={action.to}
                onClick={() => setFabOpen(false)}
                className="flex items-center gap-2.5 rounded-full bg-card border border-border/50 px-5 py-3 shadow-xl transition-all hover:bg-accent active:scale-[0.95]"
                style={{ 
                  animation: `fade-in 0.2s ease-out ${i * 60}ms both, slide-in-from-bottom 0.25s ease-out ${i * 60}ms both`,
                }}
              >
                <action.icon className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">{isAr ? action.labelAr : action.labelEn}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <nav
        className="fixed bottom-0 inset-x-0 z-50 border-t border-border/40 bg-card/95 backdrop-blur-xl supports-[backdrop-filter]:bg-card/80 md:hidden shadow-[0_-4px_20px_-4px_hsl(var(--foreground)/0.06)]"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        role="navigation"
        aria-label="Mobile navigation"
      >
        <div className="flex items-center justify-around px-2 h-16">
          {visible.map((item) => {
            if (item.isFab) {
              return (
                <button
                  key="fab"
                  onClick={() => setFabOpen((o) => !o)}
                  className="flex flex-col items-center justify-center gap-0.5 flex-1 py-1.5 min-h-[48px] touch-manipulation"
                >
                  <div className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25 transition-all duration-300 active:scale-[0.9]",
                    fabOpen && "rotate-45 bg-destructive shadow-destructive/25"
                  )}>
                    <Plus className="h-5.5 w-5.5" />
                  </div>
                </button>
              );
            }

            const isActive = item.exact
              ? location.pathname === item.to
              : location.pathname.startsWith(item.to);
            const Icon = item.icon;

            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-0.5 flex-1 py-1.5 rounded-xl transition-all duration-200 active:scale-[0.9] min-h-[48px] touch-manipulation",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {/* Active indicator dot at top */}
                {isActive && (
                  <span className="absolute top-0.5 h-1 w-5 rounded-full bg-primary transition-all duration-300" />
                )}
                <div
                  className={cn(
                    "relative flex h-8 w-8 items-center justify-center rounded-xl transition-all duration-300",
                    isActive && "bg-primary/12 scale-110"
                  )}
                >
                  <Icon className={cn(
                    "h-5 w-5 transition-all duration-200",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )} />
                </div>
                <span className={cn(
                  "text-[10px] leading-none transition-all duration-200",
                  isActive ? "font-bold text-primary" : "font-medium"
                )}>
                  {isAr ? item.labelAr : item.labelEn}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
