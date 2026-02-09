import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { useIsAdmin } from "@/hooks/useAdmin";
import { useUserRoles } from "@/hooks/useUserRole";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { ThemeToggle } from "./ThemeToggle";
import { NotificationBell } from "./notifications/NotificationBell";
import { Button } from "@/components/ui/button";
import { Menu, X, Shield, Scale, HelpCircle, Newspaper } from "lucide-react";
import { useState } from "react";

export function Header() {
  const { user, signOut } = useAuth();
  const { t } = useLanguage();
  const { data: isAdmin } = useIsAdmin();
  const { data: userRoles = [] } = useUserRoles();
  const isJudge = userRoles.includes("judge");
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <img src="/altohaa-logo.png" alt="Altohaa" className="h-10 w-auto" />
          <span className="font-serif text-xl font-bold text-primary">Altohaa</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-2 md:flex">
          <ThemeToggle />
          <LanguageSwitcher />
          {user ? (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/dashboard">{t("home")}</Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/competitions">{t("competitions")}</Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/community">{t("community")}</Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/profile">{t("myProfile")}</Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/notification-preferences">{t("notificationPreferences")}</Link>
              </Button>
              {isJudge && (
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/judging" className="flex items-center gap-1.5">
                    <Scale className="h-4 w-4" />
                    {t("judgingPanel")}
                  </Link>
                </Button>
              )}
              {isAdmin && (
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/admin" className="flex items-center gap-1.5">
                    <Shield className="h-4 w-4" />
                    {t("adminPanel")}
                  </Link>
                </Button>
              )}
              <NotificationBell />
              <Button variant="outline" size="sm" onClick={signOut}>
                {t("signOut")}
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/auth">{t("signIn")}</Link>
              </Button>
              <Button size="sm" asChild>
                <Link to="/auth?tab=signup">{t("signUp")}</Link>
              </Button>
            </>
          )}
        </nav>

        {/* Mobile menu toggle */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <LanguageSwitcher />
          <Button variant="ghost" size="icon" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="border-t bg-card p-4 md:hidden">
          <nav className="flex flex-col gap-2">
            {user ? (
              <>
                <Button variant="ghost" size="sm" asChild onClick={() => setMenuOpen(false)}>
                  <Link to="/dashboard">{t("home")}</Link>
                </Button>
                <Button variant="ghost" size="sm" asChild onClick={() => setMenuOpen(false)}>
                  <Link to="/competitions">{t("competitions")}</Link>
                </Button>
                <Button variant="ghost" size="sm" asChild onClick={() => setMenuOpen(false)}>
                  <Link to="/community">{t("community")}</Link>
                </Button>
                <Button variant="ghost" size="sm" asChild onClick={() => setMenuOpen(false)}>
                  <Link to="/profile">{t("myProfile")}</Link>
                </Button>
                <Button variant="ghost" size="sm" asChild onClick={() => setMenuOpen(false)}>
                  <Link to="/notification-preferences">{t("notificationPreferences")}</Link>
                </Button>
                {isJudge && (
                  <Button variant="ghost" size="sm" asChild onClick={() => setMenuOpen(false)}>
                    <Link to="/judging" className="flex items-center gap-1.5">
                      <Scale className="h-4 w-4" />
                      {t("judgingPanel")}
                    </Link>
                  </Button>
                )}
                {isAdmin && (
                  <Button variant="ghost" size="sm" asChild onClick={() => setMenuOpen(false)}>
                    <Link to="/admin" className="flex items-center gap-1.5">
                      <Shield className="h-4 w-4" />
                      {t("adminPanel")}
                    </Link>
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => { signOut(); setMenuOpen(false); }}>
                  {t("signOut")}
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild onClick={() => setMenuOpen(false)}>
                  <Link to="/auth">{t("signIn")}</Link>
                </Button>
                <Button size="sm" asChild onClick={() => setMenuOpen(false)}>
                  <Link to="/auth?tab=signup">{t("signUp")}</Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
