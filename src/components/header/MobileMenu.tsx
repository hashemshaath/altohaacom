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
  basic: { en: "Basic", ar: "أساسي", color: "bg-[var(--bg-surface)] text-[var(--color-muted)]" },
  professional: { en: "Professional", ar: "محترف", color: "bg-[var(--color-primary-light)] text-[var(--color-primary)]" },
  enterprise: { en: "Enterprise", ar: "مؤسسات", color: "bg-[var(--color-info-bg)] text-[var(--color-info)]" },
};

/* ── Single nav item ── */
const NavItem = memo(React.forwardRef<HTMLAnchorElement, {
  to: string; icon: React.ElementType; children: React.ReactNode; active?: boolean; onClose: () => void;
}>(function NavItem({ to, icon: Icon, children, active, onClose }, ref) {
  const isAr = useIsAr();
  return (
    <Link
      ref={ref}
      to={to}
      onClick={onClose}
      className={cn(
        "flex items-center gap-3 h-[52px] px-4 text-[16px] font-medium border-b border-[var(--color-border-light)] transition-colors touch-manipulation select-none active:scale-[0.98]",
        active
          ? "text-[var(--color-primary)] bg-[var(--color-primary-light)]"
          : "text-[var(--color-body)] hover:bg-[var(--bg-surface)]"
      )}
    >
      <Icon className={cn("h-5 w-5 shrink-0", active ? "text-[var(--color-primary)]" : "text-[var(--color-muted)]")} />
      <span className="flex-1">{children}</span>
    </Link>
  );
}));

/* ── Collapsible section ── */
const Section = memo(function Section({ label, defaultOpen = false, children }: {
  label: string; defaultOpen?: boolean; children: React.ReactNode;
}) {
  const isAr = useIsAr();
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between h-[52px] px-4 border-b border-[var(--color-border-light)] touch-manipulation"
      >
        <span className="text-[16px] font-medium text-[var(--color-body)]">
          {label}
        </span>
        <ChevronDown className={cn(
          "h-4 w-4 text-[var(--color-muted)] transition-transform duration-200",
          open && "rotate-180"
        )} />
      </button>
      <div className={cn(
        "grid transition-all duration-200",
        open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
      )}>
        <div className="overflow-hidden bg-[var(--bg-surface)]">
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
        .single();
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

  // Lock body scroll when open
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
        className="flex items-center justify-center h-11 w-11 rounded-[var(--radius-sm)] text-[var(--color-heading)] transition-colors hover:bg-[var(--bg-surface)] touch-manipulation active:scale-95"
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
          "fixed inset-0 z-[99] bg-black/40 transition-opacity duration-200",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={closeMenu}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        className={cn(
          "fixed top-0 z-[100] h-[100dvh] bg-[var(--bg-background)] transition-transform duration-280",
          isAr ? "right-0" : "left-0",
          open
            ? "translate-x-0"
            : isAr ? "translate-x-full" : "-translate-x-full"
        )}
        style={{
          width: "min(320px, 85vw)",
          boxShadow: open ? (isAr ? "-8px 0 32px rgba(0,0,0,0.12)" : "8px 0 32px rgba(0,0,0,0.12)") : "none",
          transitionTimingFunction: open ? "cubic-bezier(0.34, 1.56, 0.64, 1)" : "ease",
        }}
      >
        <div className="flex h-full flex-col">
          {/* Drawer header: 60px */}
          <div className="flex items-center justify-between h-[60px] px-5 border-b border-[var(--color-border-light)] shrink-0">
            {user ? (
              <Link to="/profile" onClick={closeMenu} className="flex items-center gap-3 min-w-0">
                <Avatar className="h-9 w-9 border-2 border-[var(--color-primary-light)]">
                  <AvatarImage src={profile?.avatar_url || undefined} alt={displayName} />
                  <AvatarFallback className="text-xs font-bold bg-[var(--color-primary-light)] text-[var(--color-primary)]">{initials}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-[15px] font-semibold text-[var(--color-heading)] truncate">{displayName}</p>
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
              className="flex items-center justify-center h-11 w-11 rounded-full text-[var(--color-muted)] hover:bg-[var(--bg-surface)] transition-colors touch-manipulation"
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
                <NavItem to="/chefs-table" icon={Scale} active={isActive("/chefs-table")} onClose={closeMenu}>
                  {label("Chef's Table", "طاولة الشيف")}
                </NavItem>

                {/* Explore - accordion */}
                <Section label={label("Explore", "اكتشف")}>
                  {moreLinks.map((link) => (
                    <Link
                      key={link.to}
                      to={link.to}
                      onClick={closeMenu}
                      className={cn(
                        "flex items-center gap-3 px-6 py-3 text-[14px] transition-colors touch-manipulation",
                        isActive(link.to)
                          ? "text-[var(--color-primary)] font-medium"
                          : "text-[var(--color-muted)] hover:text-[var(--color-body)]"
                      )}
                    >
                      <link.icon className="h-4 w-4 shrink-0" />
                      {label(link.labelEn, link.labelAr)}
                    </Link>
                  ))}
                </Section>

                {/* Account - accordion */}
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
                      className="flex items-center gap-3 px-6 py-3 text-[14px] text-[var(--color-muted)] hover:text-[var(--color-body)] transition-colors touch-manipulation"
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {label(item.en, item.ar)}
                    </Link>
                  ))}
                </Section>

                {isAdmin && (
                  <NavItem to="/admin" icon={Shield} onClose={closeMenu}>
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

          {/* Bottom CTA — pinned */}
          <div className="shrink-0 border-t border-[var(--color-border-light)] bg-[var(--bg-background)] p-4" style={{ paddingBottom: "calc(16px + env(safe-area-inset-bottom))" }}>
            {user ? (
              <button
                onClick={() => { signOut(); closeMenu(); }}
                className="btn btn-ghost w-full justify-center gap-2 text-[var(--color-muted)] hover:text-[var(--color-error)]"
              >
                <LogOut className="h-4 w-4" />
                {t("signOut")}
              </button>
            ) : (
              <div className="space-y-2">
                <Link to="/login" onClick={closeMenu} className="btn btn-ghost w-full justify-center">
                  {t("signIn")}
                </Link>
                <Link to="/register" onClick={closeMenu} className="btn btn-primary w-full justify-center">
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
