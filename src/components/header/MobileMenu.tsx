import { ROUTES } from "@/config/routes";
import { CACHE } from "@/lib/queryConfig";
import { useIsAr } from "@/hooks/useIsAr";
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { useIsAdmin } from "@/hooks/useAdmin";
import { useUserRoles } from "@/hooks/useUserRole";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getDisplayName, getDisplayInitial } from "@/lib/getDisplayName";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Menu, X, Shield, Scale, Home, User, LogOut,
  MessageSquare, HelpCircle, ChevronDown,
  Settings, Crown,
} from "lucide-react";
import { useState, useCallback, memo, forwardRef, useEffect } from "react";

interface NavLink {
  to: string;
  icon: React.ElementType;
  labelEn: string;
  labelAr: string;
  authOnly?: boolean;
}

interface MobileMenuProps {
  primaryNav: NavLink[];
  moreLinks: NavLink[];
}

const tierLabels: Record<string, { en: string; ar: string; color: string }> = {
  basic: { en: "Basic", ar: "أساسي", color: "bg-[#F5F0E8] text-[#9E9890]" },
  professional: { en: "Professional", ar: "محترف", color: "bg-[rgba(192,91,46,0.1)] text-[#C05B2E]" },
  enterprise: { en: "Enterprise", ar: "مؤسسات", color: "bg-[rgba(45,80,22,0.1)] text-[#2D5016]" },
};

/* ── Single nav item ── */
const NavItem = memo(React.forwardRef<HTMLAnchorElement, {
  to: string; icon: React.ElementType; children: React.ReactNode; active?: boolean; onClose: () => void;
}>(function NavItem({ to, icon: Icon, children, active, onClose }, ref) {
  return (
    <Link
      ref={ref}
      to={to}
      onClick={onClose}
      className="flex items-center gap-3 transition-colors touch-manipulation select-none active:scale-[0.98]"
      style={{
        height: "56px",
        padding: "16px 24px",
        fontSize: "1.25rem",
        fontWeight: active ? 600 : 500,
        color: active ? "#C05B2E" : "#1C1C1A",
        borderBottom: "1px solid rgba(28,28,26,0.06)",
        background: active ? "rgba(192,91,46,0.04)" : "transparent",
      }}
    >
      <Icon
        className="h-5 w-5 shrink-0"
        style={{ color: active ? "#C05B2E" : "#9E9890" }}
      />
      <span className="flex-1">{children}</span>
    </Link>
  );
}));

/* ── Collapsible section ── */
const Section = memo(function Section({ label, defaultOpen = false, children }: {
  label: string; defaultOpen?: boolean; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between touch-manipulation"
        style={{
          height: "56px",
          padding: "16px 24px",
          borderBottom: "1px solid rgba(28,28,26,0.06)",
        }}
      >
        <span style={{ fontSize: "1.25rem", fontWeight: 500, color: "#1C1C1A" }}>
          {label}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 transition-transform duration-200",
            open && "rotate-180"
          )}
          style={{ color: "#9E9890" }}
        />
      </button>
      <div className={cn(
        "grid transition-all duration-200",
        open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
      )}>
        <div className="overflow-hidden" style={{ background: "#F5F0E8" }}>
          {children}
        </div>
      </div>
    </div>
  );
});

export const MobileMenu = forwardRef<HTMLDivElement, MobileMenuProps>(function MobileMenu({ primaryNav, moreLinks }, ref) {
  const isAr = useIsAr();
  const { user, signOut } = useAuth();
  const { t, language } = useLanguage();
  const { data: isAdmin } = useIsAdmin();
  const { data: userRoles = [] } = useUserRoles();
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const { data: profile } = useQuery({
    queryKey: ["header-profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("profiles")
        .select("full_name, full_name_ar, display_name, display_name_ar, avatar_url, username, membership_tier")
        .eq("user_id", user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
    ...CACHE.realtime,
  });

  const displayName = getDisplayName(profile, isAr, user?.email?.split("@")[0] || "");
  const initials = getDisplayInitial(profile, isAr);
  const tier = profile?.membership_tier;
  const tierInfo = tier ? tierLabels[tier] : null;

  const isActive = (path: string) =>
    location.pathname === path || (path !== "/" && location.pathname.startsWith(path + "/"));
  const label = (en: string, ar: string) => (isAr ? ar : en);
  const closeMenu = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <div ref={ref} className="lg:hidden">
      {/* Hamburger / X button */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-center h-10 w-10 rounded-lg transition-colors touch-manipulation active:scale-95"
        style={{ color: "#1C1C1A" }}
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
      >
        <div className="relative h-5 w-5">
          <span className={cn(
            "absolute left-0 block h-[2px] w-5 bg-current rounded-full transition-all duration-300",
            open ? "top-[9px] rotate-45" : "top-[3px]"
          )} />
          <span className={cn(
            "absolute left-0 top-[9px] block h-[2px] w-5 bg-current rounded-full transition-all duration-200",
            open ? "opacity-0 scale-0" : "opacity-100"
          )} />
          <span className={cn(
            "absolute left-0 block h-[2px] w-5 bg-current rounded-full transition-all duration-300",
            open ? "top-[9px] -rotate-45" : "top-[15px]"
          )} />
        </div>
      </button>

      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-[99] transition-opacity duration-200",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        style={{ background: "rgba(28,28,26,0.5)" }}
        onClick={closeMenu}
        aria-hidden="true"
      />

      {/* Full-screen overlay menu */}
      <div
        className={cn(
          "fixed inset-0 z-[100] transition-all duration-300",
          open
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        )}
        style={{
          background: "#FEFCF8",
          transitionTimingFunction: open ? "cubic-bezier(0.16,1,0.3,1)" : "ease",
        }}
      >
        <div className="flex h-full flex-col">
          {/* Header: 56px */}
          <div
            className="flex items-center justify-between shrink-0"
            style={{
              height: "56px",
              padding: "0 24px",
              borderBottom: "1px solid rgba(28,28,26,0.08)",
            }}
          >
            {user ? (
              <Link to={ROUTES.profileDashboard} onClick={closeMenu} className="flex items-center gap-3 min-w-0">
                <Avatar className="h-9 w-9" style={{ border: "2px solid rgba(192,91,46,0.2)" }}>
                  <AvatarImage src={profile?.avatar_url || undefined} alt={displayName} />
                  <AvatarFallback
                    className="text-xs font-bold"
                    style={{ background: "rgba(192,91,46,0.1)", color: "#C05B2E" }}
                  >
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-[15px] font-semibold truncate" style={{ color: "#1C1C1A" }}>{displayName}</p>
                  {tierInfo && (
                    <Badge variant="secondary" className={`text-xs h-[18px] px-1.5 ${tierInfo.color}`}>
                      <Crown className="h-2.5 w-2.5 me-0.5" />
                      {isAr ? tierInfo.ar : tierInfo.en}
                    </Badge>
                  )}
                </div>
              </Link>
            ) : (
              <Link to="/" onClick={closeMenu} className="flex items-center gap-2.5">
                <img src="/altoha-logo.png" alt="Altoha" className="h-8 w-auto" loading="lazy" />
              </Link>
            )}
            <button
              onClick={closeMenu}
              className="flex items-center justify-center h-10 w-10 rounded-lg transition-colors touch-manipulation"
              style={{ color: "#9E9890" }}
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation scrollable area */}
          <nav aria-label="Main menu" className="flex-1 overflow-y-auto overscroll-contain">
            {user ? (
              <>
                {primaryNav.map((link) => (
                  <NavItem key={link.to} to={link.to} icon={link.icon} active={isActive(link.to)} onClose={closeMenu}>
                    {label(link.labelEn, link.labelAr)}
                  </NavItem>
                ))}
                <NavItem to={ROUTES.chefsTable} icon={Scale} active={isActive("/chefs-table")} onClose={closeMenu}>
                  {label("Chef's Table", "طاولة الشيف")}
                </NavItem>

                <Section label={label("Explore", "اكتشف")}>
                  {moreLinks.map((link) => (
                    <Link
                      key={link.to}
                      to={link.to}
                      onClick={closeMenu}
                      className="flex items-center gap-3 transition-colors touch-manipulation"
                      style={{
                        padding: "12px 32px",
                        fontSize: "0.9375rem",
                        color: isActive(link.to) ? "#C05B2E" : "#6B6560",
                        fontWeight: isActive(link.to) ? 600 : 400,
                      }}
                    >
                      <link.icon className="h-4 w-4 shrink-0" />
                      {label(link.labelEn, link.labelAr)}
                    </Link>
                  ))}
                </Section>

                <Section label={label("Account", "الحساب")}>
                  {[
                    { to: "/profile", icon: User, en: "Profile", ar: "الملف الشخصي" },
                    { to: "/messages", icon: MessageSquare, en: "Messages", ar: "الرسائل" },
                    { to: "/notification-preferences", icon: Settings, en: "Settings", ar: "الإعدادات" },
                    { to: "/help", icon: HelpCircle, en: "Help Center", ar: "مركز المساعدة" },
                  ].map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={closeMenu}
                      className="flex items-center gap-3 transition-colors touch-manipulation"
                      style={{
                        padding: "12px 32px",
                        fontSize: "0.9375rem",
                        color: "#6B6560",
                      }}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {label(item.en, item.ar)}
                    </Link>
                  ))}
                </Section>

                {isAdmin && (
                  <NavItem to={ROUTES.admin} icon={Shield} onClose={closeMenu}>
                    {t("adminPanel")}
                  </NavItem>
                )}
              </>
            ) : (
              <>
                <NavItem to="/" icon={Home} active={isActive("/")} onClose={closeMenu}>
                  {label("Home", "الرئيسية")}
                </NavItem>
                {primaryNav.filter((l) => !l.authOnly).map((link) => (
                  <NavItem key={link.to} to={link.to} icon={link.icon} active={isActive(link.to)} onClose={closeMenu}>
                    {label(link.labelEn, link.labelAr)}
                  </NavItem>
                ))}
              </>
            )}
          </nav>

          {/* Bottom CTA */}
          <div
            className="shrink-0"
            style={{
              borderTop: "1px solid rgba(28,28,26,0.08)",
              background: "#FEFCF8",
              padding: "16px 24px",
              paddingBottom: "calc(16px + env(safe-area-inset-bottom))",
            }}
          >
            {user ? (
              <button
                onClick={() => { signOut(); closeMenu(); }}
                className="flex w-full items-center justify-center gap-2 py-3 rounded-lg font-medium transition-colors"
                style={{ color: "#9E9890", fontSize: "0.9375rem" }}
              >
                <LogOut className="h-4 w-4" />
                {t("signOut")}
              </button>
            ) : (
              <div className="space-y-3">
                <Link
                  to={ROUTES.login}
                  onClick={closeMenu}
                  className="flex items-center justify-center w-full font-semibold transition-all active:scale-[0.98]"
                  style={{
                    border: "1.5px solid rgba(28,28,26,0.2)",
                    color: "#1C1C1A",
                    padding: "12px 20px",
                    borderRadius: "8px",
                    fontSize: "0.9375rem",
                  }}
                >
                  {t("signIn")}
                </Link>
                <Link
                  to={ROUTES.register}
                  onClick={closeMenu}
                  className="flex items-center justify-center w-full font-bold transition-all active:scale-[0.98]"
                  style={{
                    background: "#C05B2E",
                    color: "#FEFCF8",
                    padding: "12px 20px",
                    borderRadius: "8px",
                    fontSize: "0.9375rem",
                  }}
                >
                  {t("signUp")}
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

MobileMenu.displayName = "MobileMenu";
