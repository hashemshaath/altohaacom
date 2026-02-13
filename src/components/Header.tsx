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
  LayoutDashboard,
  HelpCircle,
  Star,
  BookOpen,
  HandHeart,
  Building,
  ChevronDown,
} from "lucide-react";
import { useState } from "react";

const primaryNav = [
  { to: "/dashboard", icon: LayoutDashboard, labelEn: "Dashboard", labelAr: "لوحة التحكم", authOnly: true },
  { to: "/competitions", icon: Trophy, labelEn: "Competitions", labelAr: "المسابقات" },
  { to: "/exhibitions", icon: Landmark, labelEn: "Exhibitions", labelAr: "المعارض" },
  { to: "/community", icon: Users, labelEn: "Community", labelAr: "المجتمع" },
  { to: "/news", icon: Newspaper, labelEn: "News", labelAr: "الأخبار" },
];

const moreLinks = [
  { to: "/masterclasses", icon: GraduationCap, labelEn: "Masterclasses", labelAr: "الدروس المتقدمة" },
  { to: "/recipes", icon: UtensilsCrossed, labelEn: "Recipes", labelAr: "الوصفات" },
  { to: "/shop", icon: ShoppingBag, labelEn: "Shop", labelAr: "المتجر" },
  { to: "/entities", icon: Star, labelEn: "Entities", labelAr: "الجهات" },
  { to: "/establishments", icon: Building2, labelEn: "Establishments", labelAr: "المؤسسات" },
  { to: "/mentorship", icon: HandHeart, labelEn: "Mentorship", labelAr: "الإرشاد" },
  { to: "/knowledge", icon: BookOpen, labelEn: "Knowledge", labelAr: "المعرفة" },
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

  const isActive = (path: string) => location.pathname === path || (path !== "/" && location.pathname.startsWith(path + "/"));
  const label = (en: string, ar: string) => isAr ? ar : en;

  const visiblePrimary = primaryNav.filter((l) => !l.authOnly || user);

  return (
    <header className="sticky top-0 z-50 border-b border-border/40 bg-card/90 backdrop-blur-xl supports-[backdrop-filter]:bg-card/80">
      <div className="container flex h-14 items-center gap-2">
        {/* Logo */}
        <Link to={user ? "/dashboard" : "/"} className="flex shrink-0 items-center gap-2.5 me-2 group">
          <img src="/altohaa-logo.png" alt="Altohaa" className="h-8 w-auto transition-transform group-hover:scale-105" />
          <span className="font-serif text-lg font-bold text-primary hidden sm:inline">Altohaa</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-0.5 lg:flex flex-1 justify-center">
          {visiblePrimary.map((link) => (
            <Button
              key={link.to}
              variant="ghost"
              size="sm"
              asChild
              className={cn(
                "text-muted-foreground h-8 px-3 transition-all duration-200",
                isActive(link.to) && "bg-primary/10 text-primary font-medium shadow-sm shadow-primary/5"
              )}
            >
              <Link to={link.to} className="flex items-center gap-1.5">
                <link.icon className="h-3.5 w-3.5" />
                {label(link.labelEn, link.labelAr)}
              </Link>
            </Button>
          ))}

          {/* More dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="text-muted-foreground h-8 px-3 gap-1">
                <Building className="h-3.5 w-3.5" />
                {label("More", "المزيد")}
                <ChevronDown className="h-3 w-3 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-52">
              {moreLinks.map((link) => (
                <DropdownMenuItem key={link.to} asChild>
                  <Link to={link.to} className="flex items-center gap-2.5">
                    <link.icon className="h-4 w-4 text-muted-foreground" />
                    {label(link.labelEn, link.labelAr)}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {isJudge && (
            <Button variant="ghost" size="sm" asChild className={cn("text-muted-foreground h-8 px-3", isActive("/tastings") && "bg-primary/10 text-primary font-medium")}>
              <Link to="/tastings" className="flex items-center gap-1.5">
                <Scale className="h-3.5 w-3.5" />
                {label("Evaluation", "التقييم")}
              </Link>
            </Button>
          )}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-1 ms-auto">
          <div className="hidden md:block">
            <QuickSearch />
          </div>
          {user && <NotificationBell />}
          <ThemeToggle />
          <LanguageSwitcher />

          {/* User dropdown (desktop) */}
          {user ? (
            <div className="hidden lg:block">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full border border-border/60 hover:border-primary/30 transition-colors">
                    <User className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal text-xs text-muted-foreground truncate">
                    {user.email}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="flex items-center gap-2.5">
                      <User className="h-4 w-4 text-muted-foreground" />
                      {t("myProfile")}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/messages" className="flex items-center gap-2.5">
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      {label("Messages", "الرسائل")}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/notification-preferences" className="flex items-center gap-2.5">
                      <Settings className="h-4 w-4 text-muted-foreground" />
                      {t("notificationPreferences")}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/help" className="flex items-center gap-2.5">
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                      {label("Help Center", "مركز المساعدة")}
                    </Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to="/admin" className="flex items-center gap-2.5">
                          <Shield className="h-4 w-4 text-muted-foreground" />
                          {t("adminPanel")}
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive">
                    <LogOut className="h-4 w-4 me-2.5" />
                    {t("signOut")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <div className="hidden items-center gap-2 lg:flex">
              <Button variant="ghost" size="sm" asChild className="text-muted-foreground">
                <Link to="/login">{t("signIn")}</Link>
              </Button>
              <Button size="sm" asChild className="shadow-sm shadow-primary/15">
                <Link to="/register">{t("signUp")}</Link>
              </Button>
            </div>
          )}

          {/* Mobile Menu */}
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

                  <nav className="flex-1 overflow-y-auto p-3 space-y-1">
                    {user ? (
                      <>
                        <Link
                          to="/search"
                          onClick={() => setOpen(false)}
                          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                        >
                          <Search className="h-4 w-4" />
                          {label("Search", "بحث")}
                        </Link>

                        <Separator className="my-2" />

                        <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
                          {label("Navigate", "التنقل")}
                        </p>
                        {visiblePrimary.map((link) => (
                          <Link
                            key={link.to}
                            to={link.to}
                            onClick={() => setOpen(false)}
                            className={cn(
                              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200",
                              isActive(link.to)
                                ? "bg-primary/10 text-primary font-medium shadow-sm"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            )}
                          >
                            <link.icon className="h-4 w-4" />
                            {label(link.labelEn, link.labelAr)}
                          </Link>
                        ))}

                        {isJudge && (
                          <Link to="/tastings" onClick={() => setOpen(false)} className={cn("flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors", isActive("/tastings") ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-muted hover:text-foreground")}>
                            <Scale className="h-4 w-4" />
                            {label("Evaluation", "التقييم")}
                          </Link>
                        )}

                        <Separator className="my-2" />

                        <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
                          {label("Explore", "اكتشف")}
                        </p>
                        {moreLinks.map((link) => (
                          <Link
                            key={link.to}
                            to={link.to}
                            onClick={() => setOpen(false)}
                            className={cn(
                              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                              isActive(link.to)
                                ? "bg-primary/10 text-primary font-medium"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            )}
                          >
                            <link.icon className="h-4 w-4" />
                            {label(link.labelEn, link.labelAr)}
                          </Link>
                        ))}

                        <Separator className="my-2" />

                        <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
                          {label("Account", "الحساب")}
                        </p>
                        <Link to="/profile" onClick={() => setOpen(false)} className={cn("flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors", isActive("/profile") ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-muted hover:text-foreground")}>
                          <User className="h-4 w-4" />
                          {t("myProfile")}
                        </Link>
                        <Link to="/messages" onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                          <MessageSquare className="h-4 w-4" />
                          {label("Messages", "الرسائل")}
                        </Link>
                        <Link to="/help" onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                          <HelpCircle className="h-4 w-4" />
                          {label("Help Center", "مركز المساعدة")}
                        </Link>

                        {isAdmin && (
                          <>
                            <Separator className="my-2" />
                            <Link to="/admin" onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                              <Shield className="h-4 w-4" />
                              {t("adminPanel")}
                            </Link>
                          </>
                        )}
                      </>
                    ) : (
                      <>
                        <Link to="/" onClick={() => setOpen(false)} className={cn("flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors", isActive("/") ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-muted hover:text-foreground")}>
                          <Home className="h-4 w-4" />
                          {label("Home", "الرئيسية")}
                        </Link>
                        {primaryNav.filter(l => !l.authOnly).map((link) => (
                          <Link
                            key={link.to}
                            to={link.to}
                            onClick={() => setOpen(false)}
                            className={cn(
                              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                              isActive(link.to)
                                ? "bg-primary/10 text-primary font-medium"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            )}
                          >
                            <link.icon className="h-4 w-4" />
                            {label(link.labelEn, link.labelAr)}
                          </Link>
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
                        className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive"
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
