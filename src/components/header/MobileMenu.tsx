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
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import {
  Menu,
  Shield,
  Scale,
  Search,
  Home,
  User,
  LogOut,
  MessageSquare,
  HelpCircle,
  ArrowRight,
  ChevronDown,
  LayoutDashboard,
  Settings,
  Crown,
} from "lucide-react";
import { useState } from "react";

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

export function MobileMenu({ primaryNav, moreLinks }: MobileMenuProps) {
  const { user, signOut } = useAuth();
  const { t, language } = useLanguage();
  const { data: isAdmin } = useIsAdmin();
  const { data: userRoles = [] } = useUserRoles();
  const isJudge = userRoles.includes("judge");
  const [open, setOpen] = useState(false);
  const [sectionsOpen, setSectionsOpen] = useState<Record<string, boolean>>({
    main: true,
    explore: false,
    account: false,
  });
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

  const toggleSection = (key: string) => {
    setSectionsOpen((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const NavItem = ({ to, icon: Icon, children, active, badge }: { to: string; icon: React.ElementType; children: React.ReactNode; active?: boolean; badge?: string }) => (
    <Link
      to={to}
      onClick={() => {
        try { if ("vibrate" in navigator) navigator.vibrate(8); } catch {}
        setOpen(false);
      }}
      className={cn(
        "relative flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition-all duration-200 touch-manipulation select-none",
        active
          ? "bg-primary/10 text-primary font-semibold"
          : "text-muted-foreground hover:bg-muted hover:text-foreground active:scale-[0.97] active:bg-muted/60"
      )}
    >
      {active && (
        <span className="absolute inset-y-1.5 start-0 w-[3px] rounded-full bg-primary animate-in slide-in-from-left-1 duration-200" />
      )}
      <div className={cn(
        "flex h-8 w-8 items-center justify-center rounded-lg transition-colors shrink-0",
        active ? "bg-primary/15" : "bg-muted/50"
      )}>
        <Icon className="h-4 w-4" />
      </div>
      <span className="flex-1">{children}</span>
      {badge && (
        <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-bold">{badge}</Badge>
      )}
    </Link>
  );

  const SectionToggle = ({ label: sectionLabel, sectionKey, count }: { label: string; sectionKey: string; count?: number }) => (
    <CollapsibleTrigger
      onClick={() => toggleSection(sectionKey)}
      className="flex w-full items-center justify-between px-3 py-2 rounded-xl hover:bg-muted/40 transition-colors"
    >
      <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
        {sectionLabel}
        {count !== undefined && (
          <span className="ms-1.5 text-[9px] text-muted-foreground/40">({count})</span>
        )}
      </span>
      <ChevronDown
        className={cn(
          "h-3 w-3 text-muted-foreground/40 transition-transform duration-200",
          sectionsOpen[sectionKey] && "rotate-180"
        )}
      />
    </CollapsibleTrigger>
  );

  return (
    <div className="lg:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side={isAr ? "right" : "left"} className="w-[300px] p-0 overflow-hidden">
          <div className="flex h-full flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b px-4 py-3.5 bg-gradient-to-b from-primary/5 to-transparent">
              <Link to="/" onClick={() => setOpen(false)} className="flex items-center gap-2.5">
                <img src="/altoha-logo.png" alt="Altoha" className="h-8 w-auto" />
                <span className="font-serif text-lg font-bold text-primary">Altoha</span>
              </Link>
            </div>

            {/* User info bar */}
            {user && (
              <Link to="/profile" onClick={() => setOpen(false)} className="block border-b hover:bg-muted/20 transition-colors">
                <div className="flex items-center gap-3 px-4 py-3">
                  <Avatar className="h-10 w-10 border-2 border-primary/20 shadow-sm">
                    <AvatarImage src={profile?.avatar_url || undefined} alt={displayName} />
                    <AvatarFallback className="text-xs font-bold bg-primary/10 text-primary">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate">{displayName}</p>
                    {tierInfo ? (
                      <Badge variant="secondary" className={`mt-0.5 text-[10px] h-4 px-1.5 ${tierInfo.color}`}>
                        <Crown className="h-2.5 w-2.5 me-0.5" />
                        {isAr ? tierInfo.ar : tierInfo.en}
                      </Badge>
                    ) : (
                      <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
                    )}
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground/50 shrink-0" />
                </div>
              </Link>
            )}

            <nav className="flex-1 overflow-y-auto p-3 space-y-1">
              {user ? (
                <>
                  {/* Quick actions - always visible */}
                  <NavItem to="/dashboard" icon={LayoutDashboard} active={isActive("/dashboard")}>
                    {label("Dashboard", "لوحة التحكم")}
                  </NavItem>
                  <NavItem to="/search" icon={Search}>
                    {label("Search", "بحث")}
                  </NavItem>

                  <Separator className="my-2" />

                  {/* Main Navigation - Collapsible */}
                  <Collapsible open={sectionsOpen.main}>
                    <SectionToggle label={label("Navigate", "التنقل")} sectionKey="main" count={primaryNav.length + (isJudge ? 1 : 0)} />
                    <CollapsibleContent className="space-y-0.5 mt-1">
                      {primaryNav.map((link) => (
                        <NavItem key={link.to} to={link.to} icon={link.icon} active={isActive(link.to)}>
                          {label(link.labelEn, link.labelAr)}
                        </NavItem>
                      ))}
                      <NavItem to="/chefs-table" icon={Scale} active={isActive("/chefs-table")}>
                        {label("Chef's Table", "طاولة الشيف")}
                      </NavItem>
                    </CollapsibleContent>
                  </Collapsible>

                  <Separator className="my-2" />

                  {/* Explore - Collapsible */}
                  <Collapsible open={sectionsOpen.explore}>
                    <SectionToggle label={label("Explore", "اكتشف")} sectionKey="explore" count={moreLinks.length} />
                    <CollapsibleContent className="space-y-0.5 mt-1">
                      {moreLinks.map((link) => (
                        <NavItem key={link.to} to={link.to} icon={link.icon} active={isActive(link.to)}>
                          {label(link.labelEn, link.labelAr)}
                        </NavItem>
                      ))}
                    </CollapsibleContent>
                  </Collapsible>

                  <Separator className="my-2" />

                  {/* Account - Collapsible */}
                  <Collapsible open={sectionsOpen.account}>
                    <SectionToggle label={label("Account", "الحساب")} sectionKey="account" />
                    <CollapsibleContent className="space-y-0.5 mt-1">
                      <NavItem to="/profile" icon={User} active={isActive("/profile")}>
                        {t("myProfile")}
                      </NavItem>
                      <NavItem to="/messages" icon={MessageSquare}>
                        {label("Messages", "الرسائل")}
                      </NavItem>
                      <NavItem to="/notification-preferences" icon={Settings}>
                        {label("Settings", "الإعدادات")}
                      </NavItem>
                      <NavItem to="/help" icon={HelpCircle}>
                        {label("Help Center", "مركز المساعدة")}
                      </NavItem>
                    </CollapsibleContent>
                  </Collapsible>

                  {isAdmin && (
                    <>
                      <Separator className="my-2" />
                      <NavItem to="/admin" icon={Shield}>
                        {t("adminPanel")}
                      </NavItem>
                    </>
                  )}
                </>
              ) : (
                <>
                  <NavItem to="/" icon={Home} active={isActive("/")}>
                    {label("Home", "الرئيسية")}
                  </NavItem>
                  {primaryNav.filter((l) => !l.authOnly).map((link) => (
                    <NavItem key={link.to} to={link.to} icon={link.icon} active={isActive(link.to)}>
                      {label(link.labelEn, link.labelAr)}
                    </NavItem>
                  ))}
                  <Separator className="my-3" />
                  <div className="space-y-2 p-2">
                    <Button className="w-full shadow-sm" asChild onClick={() => setOpen(false)}>
                      <Link to="/login">{t("signIn")}</Link>
                    </Button>
                    <Button variant="outline" className="w-full" asChild onClick={() => setOpen(false)}>
                      <Link to="/register">{t("signUp")}</Link>
                    </Button>
                  </div>
                </>
              )}
            </nav>

            {user && (
              <div className="border-t p-3 bg-muted/10">
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive transition-colors"
                  onClick={() => {
                    signOut();
                    setOpen(false);
                  }}
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
}
