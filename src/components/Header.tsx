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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
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
  ShoppingBag,
  User,
  LogOut,
  MessageSquare,
  Settings,
  UtensilsCrossed,
  Building2,
  ChefHat,
  LayoutDashboard,
  Bell,
  HelpCircle,
  Star,
} from "lucide-react";
import { useState } from "react";

/* ── Primary navigation (always visible for logged-in users) ── */
const primaryNav = [
  { to: "/", icon: Home, labelKey: "home", fallback: "Home" },
  { to: "/competitions", icon: Trophy, labelKey: "competitions" },
  { to: "/exhibitions", icon: Landmark, labelKey: "exhibitions" },
  { to: "/community", icon: Users, labelKey: "community" },
];

/* ── Discover dropdown (logged-in only) ── */
const discoverLinks = [
  { to: "/masterclasses", icon: GraduationCap, labelEn: "Masterclasses", labelAr: "الدروس المتقدمة" },
  { to: "/news", icon: Newspaper, labelEn: "News", labelAr: "الأخبار" },
  { to: "/recipes", icon: UtensilsCrossed, labelEn: "Recipes", labelAr: "الوصفات" },
  { to: "/shop", icon: ShoppingBag, labelEn: "Shop", labelAr: "المتجر" },
  { to: "/establishments", icon: Building2, labelEn: "Establishments", labelAr: "المؤسسات" },
  { to: "/entities", icon: Star, labelEn: "Entities", labelAr: "الجهات" },
];

/* ── Public navigation (when not logged in) ── */
const publicNav = [
  { to: "/competitions", icon: Trophy, labelEn: "Competitions", labelAr: "المسابقات" },
  { to: "/exhibitions", icon: Landmark, labelEn: "Exhibitions", labelAr: "المعارض" },
  { to: "/news", icon: Newspaper, labelEn: "News", labelAr: "الأخبار" },
  { to: "/masterclasses", icon: GraduationCap, labelEn: "Masterclasses", labelAr: "الدروس" },
];

export function Header() {
  const { user, signOut } = useAuth();
  const { t, language } = useLanguage();
  const { data: isAdmin } = useIsAdmin();
  const { data: userRoles = [] } = useUserRoles();
  const isJudge = userRoles.includes("judge");
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const isAr = language === "ar";

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur-md">
      <div className="container flex h-14 items-center gap-2">
        {/* ── Logo ── */}
        <Link to="/" className="flex shrink-0 items-center gap-2 me-1">
          <img src="/altohaa-logo.png" alt="Altohaa" className="h-8 w-auto" />
          <span className="font-serif text-lg font-bold text-primary hidden sm:inline">Altohaa</span>
        </Link>

        {/* ── Desktop Navigation ── */}
        {user ? (
          <nav className="hidden items-center gap-0.5 lg:flex flex-1 justify-center">
            {primaryNav.map((link) => (
              <Button
                key={link.to}
                variant="ghost"
                size="sm"
                asChild
                className={cn(
                  "text-muted-foreground h-8 px-3",
                  isActive(link.to) && "bg-primary/10 text-primary font-medium"
                )}
              >
                <Link to={link.to} className="flex items-center gap-1.5">
                  <link.icon className="h-3.5 w-3.5" />
                  {t(link.labelKey as any) || link.fallback}
                </Link>
              </Button>
            ))}

            {/* Discover Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-muted-foreground h-8 px-3 gap-1.5">
                  <ChefHat className="h-3.5 w-3.5" />
                  {isAr ? "اكتشف" : "Discover"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-48">
                {discoverLinks.map((link) => (
                  <DropdownMenuItem key={link.to} asChild>
                    <Link to={link.to} className="flex items-center gap-2">
                      <link.icon className="h-3.5 w-3.5" />
                      {isAr ? link.labelAr : link.labelEn}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Role-specific links */}
            {isJudge && (
              <Button variant="ghost" size="sm" asChild className={cn("text-muted-foreground h-8 px-3", isActive("/tastings") && "bg-primary/10 text-primary font-medium")}>
                <Link to="/tastings" className="flex items-center gap-1.5">
                  <Scale className="h-3.5 w-3.5" />
                  {isAr ? "التقييم" : "Evaluation"}
                </Link>
              </Button>
            )}
          </nav>
        ) : (
          <nav className="hidden items-center gap-0.5 lg:flex flex-1 justify-center">
            {publicNav.map((link) => (
              <Button
                key={link.to}
                variant="ghost"
                size="sm"
                asChild
                className={cn(
                  "text-muted-foreground h-8 px-3",
                  isActive(link.to) && "bg-primary/10 text-primary font-medium"
                )}
              >
                <Link to={link.to}>{isAr ? link.labelAr : link.labelEn}</Link>
              </Button>
            ))}
          </nav>
        )}

        {/* ── Right side actions ── */}
        <div className="flex items-center gap-1 ms-auto">
          <div className="hidden md:block">
            <QuickSearch />
          </div>
          {user && <NotificationBell />}
          <ThemeToggle />
          <LanguageSwitcher />

          {/* ── User profile dropdown (desktop) ── */}
          {user ? (
            <div className="hidden lg:block">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full border border-border">
                    <User className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuLabel className="font-normal text-xs text-muted-foreground">
                    {user.email}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard" className="flex items-center gap-2">
                      <LayoutDashboard className="h-3.5 w-3.5" />
                      {isAr ? "لوحة التحكم" : "Dashboard"}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="flex items-center gap-2">
                      <User className="h-3.5 w-3.5" />
                      {t("myProfile")}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/messages" className="flex items-center gap-2">
                      <MessageSquare className="h-3.5 w-3.5" />
                      {isAr ? "الرسائل" : "Messages"}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/notification-preferences" className="flex items-center gap-2">
                      <Settings className="h-3.5 w-3.5" />
                      {t("notificationPreferences")}
                    </Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to="/admin" className="flex items-center gap-2">
                          <Shield className="h-3.5 w-3.5" />
                          {t("adminPanel")}
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive">
                    <LogOut className="h-3.5 w-3.5 me-2" />
                    {t("signOut")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <div className="hidden items-center gap-1.5 lg:flex">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/auth">{t("signIn")}</Link>
              </Button>
              <Button size="sm" asChild>
                <Link to="/auth?tab=signup">{t("signUp")}</Link>
              </Button>
            </div>
          )}

          {/* ── Mobile Menu ── */}
          <div className="lg:hidden">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side={isAr ? "right" : "left"} className="w-[280px] p-0">
                <div className="flex h-full flex-col">
                  {/* Header */}
                  <div className="flex items-center gap-2 border-b p-4">
                    <img src="/altohaa-logo.png" alt="Altohaa" className="h-8 w-auto" />
                    <span className="font-serif text-lg font-bold text-primary">Altohaa</span>
                  </div>

                  {/* Content */}
                  <nav className="flex-1 overflow-y-auto p-3 space-y-1">
                    {user ? (
                      <>
                        {/* Search */}
                        <Link
                          to="/search"
                          onClick={() => setOpen(false)}
                          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                        >
                          <Search className="h-4 w-4" />
                          {isAr ? "بحث" : "Search"}
                        </Link>

                        <Separator className="my-2" />

                        {/* Main nav */}
                        <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                          {isAr ? "الأساسي" : "Main"}
                        </p>
                        {primaryNav.map((link) => (
                          <Link
                            key={link.to}
                            to={link.to}
                            onClick={() => setOpen(false)}
                            className={cn(
                              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                              isActive(link.to)
                                ? "bg-primary/10 text-primary font-medium"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            )}
                          >
                            <link.icon className="h-4 w-4" />
                            {t(link.labelKey as any) || link.fallback}
                          </Link>
                        ))}

                        <Separator className="my-2" />

                        {/* Discover */}
                        <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                          {isAr ? "اكتشف" : "Discover"}
                        </p>
                        {discoverLinks.map((link) => (
                          <Link
                            key={link.to}
                            to={link.to}
                            onClick={() => setOpen(false)}
                            className={cn(
                              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                              isActive(link.to)
                                ? "bg-primary/10 text-primary font-medium"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            )}
                          >
                            <link.icon className="h-4 w-4" />
                            {isAr ? link.labelAr : link.labelEn}
                          </Link>
                        ))}

                        <Separator className="my-2" />

                        {/* Account */}
                        <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                          {isAr ? "الحساب" : "Account"}
                        </p>
                        <Link to="/dashboard" onClick={() => setOpen(false)} className={cn("flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors", isActive("/dashboard") ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-muted hover:text-foreground")}>
                          <LayoutDashboard className="h-4 w-4" />
                          {isAr ? "لوحة التحكم" : "Dashboard"}
                        </Link>
                        <Link to="/profile" onClick={() => setOpen(false)} className={cn("flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors", isActive("/profile") ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-muted hover:text-foreground")}>
                          <User className="h-4 w-4" />
                          {t("myProfile")}
                        </Link>
                        <Link to="/messages" onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                          <MessageSquare className="h-4 w-4" />
                          {isAr ? "الرسائل" : "Messages"}
                        </Link>
                        <Link to="/notification-preferences" onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                          <Settings className="h-4 w-4" />
                          {t("notificationPreferences")}
                        </Link>

                        {/* Role-specific */}
                        {isJudge && (
                          <Link to="/tastings" onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                            <Scale className="h-4 w-4" />
                            {isAr ? "التقييم" : "Evaluation"}
                          </Link>
                        )}
                        {isAdmin && (
                          <Link to="/admin" onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                            <Shield className="h-4 w-4" />
                            {t("adminPanel")}
                          </Link>
                        )}
                      </>
                    ) : (
                      <>
                        {publicNav.map((link) => (
                          <Link
                            key={link.to}
                            to={link.to}
                            onClick={() => setOpen(false)}
                            className={cn(
                              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                              isActive(link.to)
                                ? "bg-primary/10 text-primary font-medium"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            )}
                          >
                            <link.icon className="h-4 w-4" />
                            {isAr ? link.labelAr : link.labelEn}
                          </Link>
                        ))}
                        <Separator className="my-2" />
                        <div className="space-y-2 p-2">
                          <Button className="w-full" asChild onClick={() => setOpen(false)}>
                            <Link to="/auth">{t("signIn")}</Link>
                          </Button>
                          <Button variant="outline" className="w-full" asChild onClick={() => setOpen(false)}>
                            <Link to="/auth?tab=signup">{t("signUp")}</Link>
                          </Button>
                        </div>
                      </>
                    )}
                  </nav>

                  {/* Bottom sign out */}
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
