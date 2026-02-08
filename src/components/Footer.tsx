import { useLanguage } from "@/i18n/LanguageContext";
import { Link } from "react-router-dom";

export function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="border-t bg-card">
      <div className="container py-12">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <img src="/altohaa-logo.png" alt="Altohaa" className="h-8 w-auto" />
              <span className="font-serif text-lg font-bold text-primary">Altohaa</span>
            </div>
            <p className="text-sm text-muted-foreground">{t("footerTagline")}</p>
          </div>

          <div>
            <h4 className="mb-3 font-semibold">{t("quickLinks")}</h4>
            <nav className="flex flex-col gap-2 text-sm text-muted-foreground">
              <Link to="/" className="hover:text-primary transition-colors">{t("home")}</Link>
              <Link to="/auth" className="hover:text-primary transition-colors">{t("signIn")}</Link>
              <Link to="/auth?tab=signup" className="hover:text-primary transition-colors">{t("signUp")}</Link>
            </nav>
          </div>

          <div>
            <h4 className="mb-3 font-semibold">{t("followUs")}</h4>
            <div className="flex gap-3 text-sm text-muted-foreground">
              <span>Instagram</span>
              <span>Twitter</span>
              <span>Facebook</span>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t pt-6 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Altohaa. {t("allRightsReserved")}
        </div>
      </div>
    </footer>
  );
}
