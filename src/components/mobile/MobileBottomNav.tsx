import { useLocation, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { useNotifications } from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";
import { Home, Compass, Users, Bell, User } from "lucide-react";
import { memo, useEffect, useRef, useState, useCallback } from "react";
import { subscribeScroll } from "@/lib/scrollManager";

const navItems = [
  { to: "/", icon: Home, labelEn: "Home", labelAr: "الرئيسية", exact: true },
  { to: "/competitions", icon: Compass, labelEn: "Explore", labelAr: "اكتشاف" },
  { to: "/community", icon: Users, labelEn: "Community", labelAr: "مجتمع" },
  { to: "/notifications", icon: Bell, labelEn: "Alerts", labelAr: "إشعارات", badge: true },
  { to: "/profile", icon: User, labelEn: "Account", labelAr: "حسابي", authFallback: "/auth" },
];

const hiddenPaths = ["/auth", "/admin", "/onboarding", "/install"];

export const MobileBottomNav = memo(function MobileBottomNav() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { unreadCount } = useNotifications();
  const location = useLocation();
  const isAr = language === "ar";
  const [visible, setVisible] = useState(true);
  const prevY = useRef(0);
  const visRef = useRef(true);
  const raf = useRef(0);

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
        "fixed bottom-0 inset-x-0 z-50 md:hidden transition-transform duration-300 will-change-transform",
        "bg-white/92 dark:bg-[rgba(17,24,39,0.92)]",
        "border-t border-[rgba(229,231,235,0.8)] dark:border-[rgba(55,65,81,0.8)]",
        visible ? "translate-y-0" : "translate-y-full"
      )}
      style={{
        height: "calc(56px + env(safe-area-inset-bottom, 0px))",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        backdropFilter: "blur(24px) saturate(180%)",
        WebkitBackdropFilter: "blur(24px) saturate(180%)",
        boxShadow: "0 -1px 0 rgba(0,0,0,0.05)",
      }}
      role="navigation"
      aria-label="Mobile navigation"
    >
      <div className="flex items-stretch h-14" role="menubar">
        {navItems.map((item) => {
          const isActive = item.exact
            ? location.pathname === item.to
            : location.pathname.startsWith(item.to);
          const Icon = item.icon;
          const href = item.authFallback && !user ? item.authFallback : item.to;
          const showBadge = item.badge && unreadCount > 0;

          return (
            <Link
              key={item.to}
              to={href}
              onClick={vibrate}
              role="menuitem"
              aria-current={isActive ? "page" : undefined}
              aria-label={isAr ? item.labelAr : item.labelEn}
              className={cn(
                "relative flex flex-1 flex-col items-center justify-center gap-[3px] select-none touch-manipulation",
                "transition-all duration-150 ease-out",
                "active:scale-[0.88]",
                "-webkit-tap-highlight-color-transparent"
              )}
              style={{ WebkitTapHighlightColor: "transparent" }}
            >
              {/* Active pill behind icon */}
              {isActive && (
                <span
                  className="absolute top-[6px] h-7 w-7 rounded-lg"
                  style={{ background: "var(--bg-purple-wash)" }}
                  aria-hidden="true"
                />
              )}

              {/* Icon wrapper */}
              <span className="relative z-[1] flex items-center justify-center h-[22px] w-[22px]">
                <Icon
                  className="h-[22px] w-[22px] transition-colors duration-150"
                  style={{ color: isActive ? "var(--color-primary)" : "#9CA3AF" }}
                  strokeWidth={isActive ? 2.4 : 1.8}
                />

                {/* Notification badge */}
                {showBadge && (
                  <span
                    className="absolute -top-1.5 -end-2 flex items-center justify-center rounded-full text-white"
                    style={{
                      minWidth: 16,
                      height: 16,
                      fontSize: 9,
                      fontWeight: 700,
                      background: "var(--color-error)",
                      border: "2px solid white",
                      padding: "0 3px",
                      lineHeight: 1,
                    }}
                  >
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </span>

              {/* Label */}
              <span
                className="text-[12px] leading-none transition-colors duration-150"
                style={{
                  color: isActive ? "var(--color-primary)" : "#9CA3AF",
                  fontWeight: isActive ? 600 : 500,
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
