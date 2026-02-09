import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { useIsAdmin } from "@/hooks/useAdmin";
import { useUserRoles } from "@/hooks/useUserRole";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { ThemeToggle } from "./ThemeToggle";
import { NotificationBell } from "./notifications/NotificationBell";
import { QuickSearch } from "./search/QuickSearch";
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
  Trophy,
  Users,
  GraduationCap,
  Landmark,
  Newspaper,
  User,
  LogOut,
  MessageSquare,
  Settings,
} from "lucide-react";
import { useState } from "react";

const navLinks = [
  { to: "/dashboard", icon: Home, labelKey: "home" },
  { to: "/competitions", icon: Trophy, labelKey: "competitions" },
  { to: "/community", icon: Users, labelKey: "community" },
  { to: "/masterclasses", icon: GraduationCap, labelKey: "masterclasses", fallback: "Masterclasses" },
  { to: "/exhibitions", icon: Landmark, labelKey: "exhibitions" },
  { to: "/news", icon: Newspaper, labelKey: "news", fallback: "News" },
];

export function Header() {
  const { user, signOut } = useAuth();
  const { t, language } = useLanguage();
  const { data: isAdmin } = useIsAdmin();
  const { data: userRoles = [] } = useUserRoles();
  const isJudge = userRoles.includes("judge");
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-md">
      <div className="container flex h-14 items-center justify-between gap-2">
        {/* Logo */}
        <Link to="/" className="flex shrink-0 items-center gap-2">
          <img src="/altohaa-logo.png" alt="Altohaa" className="h-8 w-auto" />
          <span className="font-serif text-lg font-bold text-primary hidden sm:inline">Altohaa</span>
        </Link>

        {/* Desktop nav links */}
        {user && (
          <nav className="hidden items-center gap-1 lg:flex">
            {navLinks.map((link) => (
              <Button
                key={link.to}
                variant="ghost"
                size="sm"
                asChild
                className={cn(
                  "text-muted-foreground",
                  isActive(link.to) && "bg-muted text-foreground"
                )}
              >
                <Link to={link.to}>{t(link.labelKey as any) || link.fallback}</Link>
              </Button>
            ))}
          </nav>
        )}

        {/* Right side actions */}
        <div className="flex items-center gap-1">
          <div className="hidden md:block">
            <QuickSearch />
          </div>
          {user && <NotificationBell />}
          <ThemeToggle />
          <LanguageSwitcher />

          {/* Desktop-only auth actions */}
          {!user && (
            <div className="hidden items-center gap-1 md:flex">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/auth">{t("signIn")}</Link>
              </Button>
              <Button size="sm" asChild>
                <Link to="/auth?tab=signup">{t("signUp")}</Link>
              </Button>
            </div>
          )}

          {/* Desktop sign out + profile */}
          {user && (
            <div className="hidden items-center gap-1 lg:flex">
              {isJudge && (
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/judging" className="flex items-center gap-1.5">
                    <Scale className="h-3.5 w-3.5" />
                    {t("judgingPanel")}
                  </Link>
                </Button>
              )}
              {isAdmin && (
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/admin" className="flex items-center gap-1.5">
                    <Shield className="h-3.5 w-3.5" />
                    {t("adminPanel")}
                  </Link>
                </Button>
              )}
              <Button variant="ghost" size="icon" asChild>
                <Link to="/profile">
                  <User className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="ghost" size="icon" onClick={signOut} title={t("signOut")}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Mobile menu */}
          <div className="lg:hidden">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side={language === "ar" ? "right" : "left"} className="w-72 p-0">
                <div className="flex h-full flex-col">
                  {/* Sheet header */}
                  <div className="flex items-center gap-2 border-b p-4">
                    <img src="/altohaa-logo.png" alt="Altohaa" className="h-8 w-auto" />
                    <span className="font-serif text-lg font-bold text-primary">Altohaa</span>
                  </div>

                  {/* Nav links */}
                  <nav className="flex-1 overflow-y-auto p-3">
                    {user ? (
                      <>
                        {/* Search on mobile */}
                        <Link
                          to="/search"
                          onClick={() => setOpen(false)}
                          className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                        >
                          <Search className="h-4 w-4" />
                          {language === "ar" ? "بحث" : "Search"}
                        </Link>

                        <Separator className="my-2" />

                        {navLinks.map((link) => (
                          <Link
                            key={link.to}
                            to={link.to}
                            onClick={() => setOpen(false)}
                            className={cn(
                              "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors",
                              isActive(link.to)
                                ? "bg-primary text-primary-foreground"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            )}
                          >
                            <link.icon className="h-4 w-4" />
                            {t(link.labelKey as any) || link.fallback}
                          </Link>
                        ))}

                        <Separator className="my-2" />

                        <Link
                          to="/profile"
                          onClick={() => setOpen(false)}
                          className={cn(
                            "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors",
                            isActive("/profile")
                              ? "bg-primary text-primary-foreground"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          )}
                        >
                          <User className="h-4 w-4" />
                          {t("myProfile")}
                        </Link>

                        <Link
                          to="/messages"
                          onClick={() => setOpen(false)}
                          className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                        >
                          <MessageSquare className="h-4 w-4" />
                          {language === "ar" ? "الرسائل" : "Messages"}
                        </Link>

                        <Link
                          to="/notification-preferences"
                          onClick={() => setOpen(false)}
                          className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                        >
                          <Settings className="h-4 w-4" />
                          {t("notificationPreferences")}
                        </Link>

                        {isJudge && (
                          <Link
                            to="/judging"
                            onClick={() => setOpen(false)}
                            className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                          >
                            <Scale className="h-4 w-4" />
                            {t("judgingPanel")}
                          </Link>
                        )}
                        {isAdmin && (
                          <Link
                            to="/admin"
                            onClick={() => setOpen(false)}
                            className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                          >
                            <Shield className="h-4 w-4" />
                            {t("adminPanel")}
                          </Link>
                        )}
                      </>
                    ) : (
                      <div className="space-y-2 p-2">
                        <Button className="w-full" asChild onClick={() => setOpen(false)}>
                          <Link to="/auth">{t("signIn")}</Link>
                        </Button>
                        <Button variant="outline" className="w-full" asChild onClick={() => setOpen(false)}>
                          <Link to="/auth?tab=signup">{t("signUp")}</Link>
                        </Button>
                      </div>
                    )}
                  </nav>

                  {/* Sign out at bottom */}
                  {user && (
                    <div className="border-t p-3">
                      <Button
                        variant="ghost"
                        className="w-full justify-start gap-3 text-muted-foreground"
                        onClick={() => { signOut(); setOpen(false); }}
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
        </div>
      </div>
    </header>
  );
}
