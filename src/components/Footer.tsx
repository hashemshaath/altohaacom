import { useLanguage } from "@/i18n/LanguageContext";
import { Link } from "react-router-dom";
import { Building2, Trophy, GraduationCap, Newspaper, Users, Globe, Mail, Phone } from "lucide-react";

export function Footer() {
  const { t, language } = useLanguage();
  const isAr = language === "ar";

  return (
    <footer className="border-t bg-card">
      <div className="container py-12">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <img src="/altohaa-logo.png" alt="Altohaa" className="h-8 w-auto" />
              <span className="font-serif text-lg font-bold text-primary">Altohaa</span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              {isAr
                ? "المنصة الرائدة لمجتمع الطهي العالمي — تجمع الطهاة والحكام والمنظمين والرعاة في مكان واحد."
                : "The premier global culinary community platform — uniting chefs, judges, organizers, and sponsors in one place."}
            </p>
            <div className="flex gap-3 text-sm text-muted-foreground">
              <a href="mailto:info@altohaa.com" className="flex items-center gap-1 hover:text-primary transition-colors">
                <Mail className="h-3.5 w-3.5" />
                info@altohaa.com
              </a>
            </div>
          </div>

          {/* Platform Links */}
          <div>
            <h4 className="mb-3 font-semibold">{isAr ? "المنصة" : "Platform"}</h4>
            <nav className="flex flex-col gap-2 text-sm text-muted-foreground">
              <Link to="/competitions" className="flex items-center gap-1.5 hover:text-primary transition-colors">
                <Trophy className="h-3.5 w-3.5" />{isAr ? "المسابقات" : "Competitions"}
              </Link>
              <Link to="/community" className="flex items-center gap-1.5 hover:text-primary transition-colors">
                <Users className="h-3.5 w-3.5" />{isAr ? "المجتمع" : "Community"}
              </Link>
              <Link to="/masterclasses" className="flex items-center gap-1.5 hover:text-primary transition-colors">
                <GraduationCap className="h-3.5 w-3.5" />{isAr ? "الدروس المتقدمة" : "Masterclasses"}
              </Link>
              <Link to="/entities" className="flex items-center gap-1.5 hover:text-primary transition-colors">
                <Building2 className="h-3.5 w-3.5" />{isAr ? "الجهات والجمعيات" : "Entities & Associations"}
              </Link>
              <Link to="/news" className="flex items-center gap-1.5 hover:text-primary transition-colors">
                <Newspaper className="h-3.5 w-3.5" />{isAr ? "الأخبار" : "News"}
              </Link>
              <Link to="/exhibitions" className="flex items-center gap-1.5 hover:text-primary transition-colors">
                <Globe className="h-3.5 w-3.5" />{isAr ? "المعارض" : "Exhibitions"}
              </Link>
            </nav>
          </div>

          {/* For Business */}
          <div>
            <h4 className="mb-3 font-semibold">{isAr ? "للأعمال" : "For Business"}</h4>
            <nav className="flex flex-col gap-2 text-sm text-muted-foreground">
              <Link to="/sponsors" className="hover:text-primary transition-colors">
                {isAr ? "فرص الرعاية" : "Sponsorship Opportunities"}
              </Link>
              <Link to="/for-organizers" className="hover:text-primary transition-colors">
                {isAr ? "للمنظمين" : "For Organizers"}
              </Link>
              <Link to="/verify" className="hover:text-primary transition-colors">
                {isAr ? "التحقق من الشهادات" : "Certificate Verification"}
              </Link>
              <Link to="/help" className="hover:text-primary transition-colors">
                {isAr ? "مركز المساعدة" : "Help Center"}
              </Link>
            </nav>
          </div>

          {/* Quick Access */}
          <div>
            <h4 className="mb-3 font-semibold">{t("quickLinks")}</h4>
            <nav className="flex flex-col gap-2 text-sm text-muted-foreground">
              <Link to="/" className="hover:text-primary transition-colors">{t("home")}</Link>
              <Link to="/auth" className="hover:text-primary transition-colors">{t("signIn")}</Link>
              <Link to="/auth?tab=signup" className="hover:text-primary transition-colors">{t("signUp")}</Link>
              <Link to="/search" className="hover:text-primary transition-colors">{isAr ? "بحث" : "Search"}</Link>
              <Link to="/install" className="hover:text-primary transition-colors">{isAr ? "تثبيت التطبيق" : "Install App"}</Link>
            </nav>
          </div>
        </div>

        <div className="mt-8 border-t pt-6 flex flex-col items-center gap-2 text-center text-sm text-muted-foreground sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} Altohaa. {t("allRightsReserved")}</p>
          <div className="flex gap-4">
            <span className="hover:text-primary cursor-pointer">Instagram</span>
            <span className="hover:text-primary cursor-pointer">Twitter</span>
            <span className="hover:text-primary cursor-pointer">LinkedIn</span>
            <span className="hover:text-primary cursor-pointer">YouTube</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
