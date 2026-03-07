import { useLocation, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAccountType } from "@/hooks/useAccountType";
import { useNotifications } from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Trophy,
  Users,
  Search,
  Home,
  Plus,
  UtensilsCrossed,
  GraduationCap,
  ShoppingBag,
  MessageSquare,
  Camera,
  BookOpen,
} from "lucide-react";
import { useState, useEffect, useRef, useCallback, memo } from "react";

const navItems = [
  { to: "/", icon: Home, labelEn: "Home", labelAr: "الرئيسية", authOnly: false, exact: true },
  { to: "/competitions", icon: Trophy, labelEn: "Compete", labelAr: "المسابقات", authOnly: false },
  { to: "__fab__", icon: Plus, labelEn: "Create", labelAr: "إنشاء", authOnly: true, isFab: true, proOnly: true },
  { to: "/community", icon: Users, labelEn: "Community", labelAr: "المجتمع", authOnly: false },
  { to: "/dashboard", icon: LayoutDashboard, labelEn: "Profile", labelAr: "ملفي", authOnly: true },
];

function getFabActions(pathname: string) {
  if (pathname.startsWith("/competitions")) {
    return [
      { to: "/create-competition", labelEn: "New Competition", labelAr: "مسابقة جديدة", icon: Trophy },
      { to: "/search?type=competitions", labelEn: "Browse", labelAr: "تصفح", icon: Search },
    ];
  }
  if (pathname.startsWith("/community")) {
    return [
      { to: "/community?action=post", labelEn: "New Post", labelAr: "منشور جديد", icon: Camera },
      { to: "/recipes/new", labelEn: "Share Recipe", labelAr: "شارك وصفة", icon: UtensilsCrossed },
    ];
  }
  if (pathname.startsWith("/recipes")) {
    return [
      { to: "/recipes/new", labelEn: "New Recipe", labelAr: "وصفة جديدة", icon: UtensilsCrossed },
      { to: "/search?type=recipes", labelEn: "Browse", labelAr: "تصفح", icon: Search },
    ];
  }
  if (pathname.startsWith("/masterclasses") || pathname.startsWith("/knowledge")) {
    return [
      { to: "/masterclasses", labelEn: "Courses", labelAr: "الدورات", icon: GraduationCap },
      { to: "/knowledge", labelEn: "Knowledge", labelAr: "المعرفة", icon: BookOpen },
    ];
  }
  if (pathname.startsWith("/shop")) {
    return [
      { to: "/shop", labelEn: "Browse Shop", labelAr: "تصفح المتجر", icon: ShoppingBag },
      { to: "/shop/my-products", labelEn: "My Products", labelAr: "منتجاتي", icon: ShoppingBag },
    ];
  }
  return [
    { to: "/create-competition", labelEn: "Competition", labelAr: "مسابقة", icon: Trophy },
    { to: "/search", labelEn: "Search", labelAr: "بحث", icon: Search },
    { to: "/messages", labelEn: "Messages", labelAr: "الرسائل", icon: MessageSquare },
  ];
}

const hiddenPaths = ["/auth", "/admin", "/onboarding", "/install"];

export const MobileBottomNav = memo(function MobileBottomNav() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { isFan } = useAccountType();
  const { unreadCount } = useNotifications();
  const location = useLocation();
  const isAr = language === "ar";
  const [fabOpen, setFabOpen] = useState(false);
  const [visible, setNavVisible] = useState(true);

  // Use refs for scroll tracking to avoid re-renders on every scroll
  const prevScrollY = useRef(0);
  const visibleRef = useRef(true);
  const rafId = useRef(0);

  const fabActions = getFabActions(location.pathname);

  // Optimized scroll handler using rAF and refs
  useEffect(() => {
    const handleScroll = () => {
      cancelAnimationFrame(rafId.current);
      rafId.current = requestAnimationFrame(() => {
        const currentScrollY = window.scrollY;
        const prev = prevScrollY.current;
        let shouldBeVisible = visibleRef.current;

        if (currentScrollY < 50) {
          shouldBeVisible = true;
        } else if (currentScrollY > prev + 8) {
          shouldBeVisible = false;
        } else if (currentScrollY < prev - 8) {
          shouldBeVisible = true;
        }

        prevScrollY.current = currentScrollY;

        if (shouldBeVisible !== visibleRef.current) {
          visibleRef.current = shouldBeVisible;
          setNavVisible(shouldBeVisible);
          if (!shouldBeVisible) setFabOpen(false);
        }
      });
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      cancelAnimationFrame(rafId.current);
    };
  }, []);

  // Close FAB on route change
  useEffect(() => {
    setFabOpen(false);
  }, [location.pathname]);

  const visibleItems = navItems.filter((item) => {
    if (item.authOnly && !user) return false;
    if ((item as any).proOnly && isFan) return false;
    return true;
  });

  if (hiddenPaths.some((p) => location.pathname.startsWith(p))) return null;

  const toggleFab = useCallback(() => {
    try { if ("vibrate" in navigator) navigator.vibrate(12); } catch {}
    setFabOpen((o) => !o);
  }, []);

  return (
    <>
      {fabOpen && (
        <div
          className="fixed inset-0 z-[55] bg-background/60 backdrop-blur-sm md:hidden"
          onClick={() => setFabOpen(false)}
          aria-hidden="true"
        >
          <div
            className="absolute bottom-24 inset-x-0 flex flex-col items-center gap-3"
            style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
          >
            {fabActions.map((action, i) => (
              <Link
                key={action.to}
                to={action.to}
                onClick={() => setFabOpen(false)}
                className="flex items-center gap-3 rounded-2xl bg-card border border-border/60 px-6 py-3.5 shadow-2xl shadow-foreground/10 transition-all hover:bg-accent active:scale-[0.96] min-w-[180px] justify-center"
                style={{
                  animation: `fade-in 0.18s ease-out ${i * 55}ms both, slide-in-from-bottom-2 0.22s ease-out ${i * 55}ms both`,
                }}
              >
                <action.icon className="h-4 w-4 text-primary shrink-0" />
                <span className="text-sm font-semibold">
                  {isAr ? action.labelAr : action.labelEn}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <nav
        className={cn(
          "fixed bottom-0 inset-x-0 z-50 border-t border-border/40 bg-card/95 backdrop-blur-xl supports-[backdrop-filter]:bg-card/80 md:hidden shadow-[0_-4px_20px_-4px_hsl(var(--foreground)/0.08)] transition-transform duration-300 will-change-transform",
          visible ? "translate-y-0" : "translate-y-full"
        )}
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        role="navigation"
        aria-label="Mobile navigation"
      >
        <div className="flex items-center justify-around px-1 h-16">
          {visibleItems.map((item) => {
            if (item.isFab) {
              return (
                <button
                  key="fab"
                  onClick={toggleFab}
                  aria-expanded={fabOpen}
                  aria-label={isAr ? "قائمة الإنشاء" : "Create menu"}
                  className="flex flex-col items-center justify-center gap-0.5 flex-1 py-1 min-h-[48px] touch-manipulation"
                >
                  <div
                    className={cn(
                      "flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-all duration-300 active:scale-[0.85]",
                      fabOpen && "rotate-45 bg-destructive shadow-destructive/30 scale-105"
                    )}
                  >
                    <Plus className="h-5 w-5" />
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
                onClick={() => {
                  try { if ("vibrate" in navigator) navigator.vibrate(8); } catch {}
                }}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-0.5 flex-1 py-1.5 rounded-xl transition-all duration-200 active:scale-[0.88] min-h-[48px] touch-manipulation select-none",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                <span
                  className={cn(
                    "absolute top-0.5 h-[3px] rounded-full bg-primary transition-all duration-300 ease-spring",
                    isActive ? "w-6 opacity-100" : "w-0 opacity-0"
                  )}
                />
                <div
                  className={cn(
                    "relative flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-300",
                    isActive && "bg-primary/12 scale-110"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-5 w-5 transition-all duration-200",
                      isActive ? "text-primary" : "text-muted-foreground"
                    )}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                  {item.to === "/dashboard" && unreadCount > 0 && (
                    <span className="absolute -top-0.5 -end-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-destructive-foreground animate-scale-in">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </div>
                <span
                  className={cn(
                    "text-[10px] leading-none transition-all duration-200",
                    isActive ? "font-bold text-primary" : "font-medium"
                  )}
                >
                  {isAr ? item.labelAr : item.labelEn}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
});
