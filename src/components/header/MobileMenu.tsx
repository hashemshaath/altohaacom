import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { useIsAdmin } from "@/hooks/useAdmin";
import { useUserRoles } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
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

export function MobileMenu({ primaryNav, moreLinks }: MobileMenuProps) {
  const { user, signOut } = useAuth();
  const { t, language } = useLanguage();
  const { data: isAdmin } = useIsAdmin();
  const { data: userRoles = [] } = useUserRoles();
  const isJudge = userRoles.includes("judge");
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const isAr = language === "ar";

  const isActive = (path: string) =>
    location.pathname === path || (path !== "/" && location.pathname.startsWith(path + "/"));
  const label = (en: string, ar: string) => (isAr ? ar : en);
  const visiblePrimary = primaryNav.filter((l) => !l.authOnly || user);

  const NavItem = ({ to, icon: Icon, children, active }: { to: string; icon: React.ElementType; children: React.ReactNode; active?: boolean }) => (
    <Link
      to={to}
      onClick={() => setOpen(false)}
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200",
        active
          ? "bg-primary/10 text-primary font-medium shadow-sm"
          : "text-muted-foreground hover:bg-muted hover:text-foreground active:scale-[0.98]"
      )}
    >
      <Icon className="h-4 w-4" />
      {children}
    </Link>
  );

  const SectionLabel = ({ children }: { children: React.ReactNode }) => (
    <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
      {children}
    </p>
  );

  return (
    <div className="lg:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side={isAr ? "right" : "left"} className="w-[300px] p-0">
          <div className="flex h-full flex-col">
            {/* Header */}
            <div className="flex items-center gap-2.5 border-b p-4 bg-muted/20">
              <img src="/altohaa-logo.png" alt="Altohaa" className="h-8 w-auto" />
              <span className="font-serif text-lg font-bold text-primary">Altohaa</span>
            </div>

            {/* User info bar */}
            {user && (
              <div className="border-b px-4 py-3 bg-muted/10">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 border border-primary/20">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                </div>
              </div>
            )}

            <nav className="flex-1 overflow-y-auto p-3 space-y-1">
              {user ? (
                <>
                  <NavItem to="/search" icon={Search}>
                    {label("Search", "بحث")}
                  </NavItem>

                  <Separator className="my-2" />
                  <SectionLabel>{label("Navigate", "التنقل")}</SectionLabel>

                  {visiblePrimary.map((link) => (
                    <NavItem key={link.to} to={link.to} icon={link.icon} active={isActive(link.to)}>
                      {label(link.labelEn, link.labelAr)}
                    </NavItem>
                  ))}

                  {isJudge && (
                    <NavItem to="/tastings" icon={Scale} active={isActive("/tastings")}>
                      {label("Evaluation", "التقييم")}
                    </NavItem>
                  )}

                  <Separator className="my-2" />
                  <SectionLabel>{label("Explore", "اكتشف")}</SectionLabel>

                  {moreLinks.map((link) => (
                    <NavItem key={link.to} to={link.to} icon={link.icon} active={isActive(link.to)}>
                      {label(link.labelEn, link.labelAr)}
                    </NavItem>
                  ))}

                  <Separator className="my-2" />
                  <SectionLabel>{label("Account", "الحساب")}</SectionLabel>

                  <NavItem to="/profile" icon={User} active={isActive("/profile")}>
                    {t("myProfile")}
                  </NavItem>
                  <NavItem to="/messages" icon={MessageSquare}>
                    {label("Messages", "الرسائل")}
                  </NavItem>
                  <NavItem to="/help" icon={HelpCircle}>
                    {label("Help Center", "مركز المساعدة")}
                  </NavItem>

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
