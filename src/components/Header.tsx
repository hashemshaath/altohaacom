import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useState } from "react";

export function Header() {
  const { user, signOut } = useAuth();
  const { t } = useLanguage();
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
          <LanguageSwitcher />
          {user ? (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/dashboard">{t("home")}</Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/community">{t("community")}</Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/profile">{t("myProfile")}</Link>
              </Button>
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
                  <Link to="/community">{t("community")}</Link>
                </Button>
                <Button variant="ghost" size="sm" asChild onClick={() => setMenuOpen(false)}>
                  <Link to="/profile">{t("myProfile")}</Link>
                </Button>
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
