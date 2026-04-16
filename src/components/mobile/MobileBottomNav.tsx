import { useIsAr } from "@/hooks/useIsAr";
import { useLocation, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";
import { Home, Compass, Users, Plus, User } from "lucide-react";
import { memo, useEffect, useRef, useState, useCallback } from "react";
import { subscribeScroll } from "@/lib/scrollManager";

const navItems = [
  { to: "/", icon: Home, labelEn: "Home", labelAr: "الرئيسية", exact: true },
  { to: "/recipes", icon: Compass, labelEn: "Explore", labelAr: "استكشاف" },
  { to: "/competitions", icon: null, labelEn: "", labelAr: "", cta: true },
  { to: "/community", icon: Users, labelEn: "Community", labelAr: "المجتمع" },
  { to: "/profile", icon: User, labelEn: "Account", labelAr: "حسابي", authFallback: "/auth" },
];

const hiddenPaths = ["/auth", "/admin", "/onboarding", "/install"];

export const MobileBottomNav = memo(function MobileBottomNav() {
  const { user } = useAuth();
  const isAr = useIsAr();
  const { unreadCount } = useNotifications();
  const location = useLocation();
  const [visible, setVisible] = useState(true);
  const prevY = useRef(0);
  const visRef = useRef(true);

  useEffect(() => {
    return subscribeScroll((y) => {
      let show = visRef.current;
      if (y < 50) show = true;
      else if (y > prevY.current + 8) show = false;
      else if (y < prevY.current - 8) show = true;
      prevY.current = y;
      if (show !== visRef.current) {
        visRef.current = show;
        setVisible(show);
      }
    });
  }, []);

  const vibrate = useCallback(() => {
    try { if ("vibrate" in navigator) navigator.vibrate(8); } catch {}
  }, []);

  if (hiddenPaths.some((p) => location.pathname.startsWith(p))) return null;

  return (
    <nav
      className={cn(
        "fixed bottom-0 inset-x-0 z-50 md:hidden transition-transform duration-300 will-change-transform mobile-bottom-nav",
        visible ? "translate-y-0" : "translate-y-full"
      )}
      style={{
        height: "calc(64px + env(safe-area-inset-bottom, 0px))",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        background: "#FEFCF8",
        borderTop: "1px solid rgba(28,28,26,0.1)",
      }}
      role="navigation"
      aria-label="Mobile navigation"
    >
      <div className="flex items-stretch h-16" role="menubar">
        {navItems.map((item) => {
          const isActive = item.exact
            ? location.pathname === item.to
            : location.pathname.startsWith(item.to);
          const href = item.authFallback && !user ? item.authFallback : item.to;

          /* ── Center CTA button ── */
          if (item.cta) {
            return (
              <Link
                key="cta"
                to={item.to}
                onClick={vibrate}
                role="menuitem"
                aria-label={isAr ? "إجراء رئيسي" : "Main action"}
                className="relative flex flex-1 items-center justify-center select-none touch-manipulation active:scale-[0.92] -webkit-tap-highlight-color-transparent"
                style={{ WebkitTapHighlightColor: "transparent" }}
              >
                <span
                  className="flex items-center justify-center rounded-full shadow-md"
                  style={{
                    width: 48,
                    height: 48,
                    background: "#C05B2E",
                    marginTop: -12,
                  }}
                >
                  <Plus className="h-6 w-6" style={{ color: "#FEFCF8" }} strokeWidth={2.5} />
                </span>
              </Link>
            );
          }

          const Icon = item.icon!;

          return (
            <Link
              key={item.to}
              to={href}
              onClick={vibrate}
              role="menuitem"
              aria-current={isActive ? "page" : undefined}
              aria-label={isAr ? item.labelAr : item.labelEn}
              className={cn(
                "relative flex flex-1 flex-col items-center justify-center gap-1 select-none touch-manipulation",
                "transition-all duration-150 ease-out",
                "active:scale-[0.88]",
                "-webkit-tap-highlight-color-transparent"
              )}
              style={{ WebkitTapHighlightColor: "transparent" }}
            >
              {/* Active dot indicator above icon */}
              {isActive && (
                <span
                  className="absolute top-1.5 rounded-full"
                  style={{ width: 4, height: 4, background: "#C05B2E" }}
                  aria-hidden="true"
                />
              )}

              {/* Icon */}
              <span className="relative z-[1] flex items-center justify-center" style={{ width: 24, height: 24 }}>
                <Icon
                  className="transition-colors duration-150"
                  style={{ color: isActive ? "#C05B2E" : "#9E9890", width: 24, height: 24 }}
                  strokeWidth={isActive ? 2.2 : 1.8}
                />
              </span>

              {/* Label */}
              <span
                className="leading-none transition-colors duration-150"
                style={{
                  fontSize: "0.625rem",
                  fontWeight: 500,
                  color: isActive ? "#C05B2E" : "#9E9890",
                }}
              >
                {isAr ? item.labelAr : item.labelEn}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
});
