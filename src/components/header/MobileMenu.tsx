import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { useIsAdmin } from "@/hooks/useAdmin";
import { useUserRoles } from "@/hooks/useUserRole";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getDisplayName, getDisplayInitial } from "@/lib/getDisplayName";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Menu, Shield, Scale, Home, User, LogOut, MessageSquare, HelpCircle, ChevronDown, Settings, Crown } from "lucide-react";
import React from "react";
import { useState, useCallback, memo, forwardRef } from "react";

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
  basic: { en: "Basic", ar: "أساسي", color: "bg-muted text-muted-foreground" },
  professional: { en: "Professional", ar: "محترف", color: "bg-primary/10 text-primary" },
  enterprise: { en: "Enterprise", ar: "مؤسسات", color: "bg-chart-4/15 text-chart-4" },
};

/* ── Single nav item ── */
const NavItem = memo(function NavItem({ to, icon: Icon, children, active, onClose }: {
  to: string; icon: React.ElementType; children: React.ReactNode; active?: boolean; onClose: () => void;
}) {
  return (
    <Link
      to={to}
      onClick={() => {
        try { if ("vibrate" in navigator) navigator.vibrate(8); } catch {}
        onClose();
      }}
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium transition-colors touch-manipulation select-none active:scale-[0.98]",
        active
          ? "text-primary font-semibold"
          : "text-foreground/80 hover:bg-muted/50 active:bg-muted/70"
      )}
    >
      <Icon className={cn("h-5 w-5 shrink-0", active ? "text-primary" : "text-muted-foreground")} />
      <span className="flex-1">{children}</span>
    </Link>
  );
});

/* ── Collapsible section ── */
const Section = memo(function Section({ label, count, defaultOpen = false, children }: {
  label: string; count?: number; defaultOpen?: boolean; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-3 py-2 touch-manipulation"
      >
        <span className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider">
          {label}
          {count !== undefined && <span className="ms-1 text-[10px] opacity-60">({count})</span>}
        </span>
        <ChevronDown className={cn(
          "h-3.5 w-3.5 text-muted-foreground/40 transition-transform duration-200",
          open && "rotate-180"
        )} />
      </button>
      <div className={cn(
        "grid transition-all duration-200",
        open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
      )}>
        <div className="overflow-hidden space-y-px">{children}</div>
      </div>
    </div>
  );
});

export const MobileMenu = forwardRef<HTMLDivElement, MobileMenuProps>(function MobileMenu({ primaryNav, moreLinks }, ref) {
  const { user, signOut } = useAuth();
  const { t, language } = useLanguage();
  const { data: isAdmin } = useIsAdmin();
  const { data: userRoles = [] } = useUserRoles();
  const isJudge = userRoles.includes("judge");
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const isAr = language === "ar";

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
    staleTime: 60000,
  });

  const displayName = getDisplayName(profile, isAr, user?.email?.split("@")[0] || "");
  const initials = getDisplayInitial(profile, isAr);
  const tier = (profile as any)?.membership_tier;
  const tierInfo = tier ? tierLabels[tier] : null;

  const isActive = (path: string) =>
    location.pathname === path || (path !== "/" && location.pathname.startsWith(path + "/"));
  const label = (en: string, ar: string) => (isAr ? ar : en);
  const closeMenu = useCallback(() => setOpen(false), []);

  return (
    <div ref={ref} className="lg:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="h-9 w-9 active:scale-90 transition-transform touch-manipulation" aria-label="Open menu">
            <Menu className="h-5 w-5" aria-hidden="true" />
          </Button>
        </SheetTrigger>
        <SheetContent side={isAr ? "right" : "left"} className="w-[280px] p-0 overflow-hidden">
          <div className="flex h-full flex-col">

            {/* ── User header ── */}
            {user ? (
              <Link to="/profile" onClick={closeMenu} className="block border-b border-border/30 hover:bg-muted/20 transition-colors">
                <div className="flex items-center gap-3 px-4 py-4">
                  <Avatar className="h-11 w-11 border-2 border-primary/15">
                    <AvatarImage src={profile?.avatar_url || undefined} alt={displayName} />
                    <AvatarFallback className="text-sm font-bold bg-primary/10 text-primary">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-bold truncate">{displayName}</p>
                    {tierInfo && (
                      <Badge variant="secondary" className={`mt-0.5 text-[10px] h-[18px] px-1.5 ${tierInfo.color}`}>
                        <Crown className="h-2.5 w-2.5 me-0.5" />
                        {isAr ? tierInfo.ar : tierInfo.en}
                      </Badge>
                    )}
                  </div>
                </div>
              </Link>
            ) : (
              <div className="border-b border-border/30 px-4 py-3.5">
                <Link to="/" onClick={closeMenu} className="flex items-center gap-2.5">
                  <img src="/altoha-logo.png" alt="Altoha" className="h-8 w-auto" loading="lazy" />
                  <span className="font-serif text-lg font-bold text-primary">Altoha</span>
                </Link>
              </div>
            )}

            {/* ── Navigation ── */}
            <nav className="flex-1 overflow-y-auto overscroll-contain p-2 space-y-1 scroll-smooth">
              {user ? (
                <>
                  {/* Primary links - always visible */}
                  {primaryNav.map((link) => (
                    <NavItem key={link.to} to={link.to} icon={link.icon} active={isActive(link.to)} onClose={closeMenu}>
                      {label(link.labelEn, link.labelAr)}
                    </NavItem>
                  ))}
                  <NavItem to="/chefs-table" icon={Scale} active={isActive("/chefs-table")} onClose={closeMenu}>
                    {label("Chef's Table", "طاولة الشيف")}
                  </NavItem>

                  <div className="mx-3 my-2 h-px bg-border/30" />

                  {/* Explore - collapsed */}
                  <Section label={label("Explore", "اكتشف")} count={moreLinks.length}>
                    {moreLinks.map((link) => (
                      <NavItem key={link.to} to={link.to} icon={link.icon} active={isActive(link.to)} onClose={closeMenu}>
                        {label(link.labelEn, link.labelAr)}
                      </NavItem>
                    ))}
                  </Section>

                  <div className="mx-3 my-2 h-px bg-border/30" />

                  {/* Account - collapsed */}
                  <Section label={label("Account", "الحساب")}>
                    <NavItem to="/profile" icon={User} active={isActive("/profile")} onClose={closeMenu}>
                      {t("myProfile")}
                    </NavItem>
                    <NavItem to="/messages" icon={MessageSquare} onClose={closeMenu}>
                      {label("Messages", "الرسائل")}
                    </NavItem>
                    <NavItem to="/notification-preferences" icon={Settings} onClose={closeMenu}>
                      {label("Settings", "الإعدادات")}
                    </NavItem>
                    <NavItem to="/help" icon={HelpCircle} onClose={closeMenu}>
                      {label("Help Center", "مركز المساعدة")}
                    </NavItem>
                  </Section>

                  {isAdmin && (
                    <>
                      <div className="mx-3 my-2 h-px bg-border/30" />
                      <NavItem to="/admin" icon={Shield} onClose={closeMenu}>
                        {t("adminPanel")}
                      </NavItem>
                    </>
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
                  <div className="mx-3 my-3 h-px bg-border/30" />
                  <div className="space-y-2 px-3">
                    <Button className="w-full" asChild onClick={closeMenu}>
                      <Link to="/login">{t("signIn")}</Link>
                    </Button>
                    <Button variant="outline" className="w-full" asChild onClick={closeMenu}>
                      <Link to="/register">{t("signUp")}</Link>
                    </Button>
                  </div>
                </>
              )}
            </nav>

            {/* ── Sign out footer ── */}
            {user && (
              <div className="border-t border-border/30 p-2">
                <Button
                  variant="ghost"
                  className="w-full justify-center gap-2 text-muted-foreground hover:text-destructive active:scale-[0.97] h-10"
                  onClick={() => { signOut(); closeMenu(); }}
                >
                  <LogOut className="h-4 w-4" />
                  {t("signOut")}
                </Button>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
});

MobileMenu.displayName = "MobileMenu";
