import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { Building2, Trophy, GraduationCap, Newspaper, Users, Globe, Mail, User, LayoutDashboard } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export function Footer() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const isAr = language === "ar";

  return (
    <footer className="border-t bg-card">
      <div className="container py-8 md:py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="mb-3 flex items-center gap-2">
              <img src="/altohaa-logo.png" alt="Altohaa" className="h-8 w-auto" />
              <span className="font-serif text-lg font-bold text-primary">Altohaa</span>
            </div>
            <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
              {isAr
                ? "المنصة الرائدة لمجتمع الطهي العالمي — تجمع الطهاة والحكام والمنظمين والرعاة في مكان واحد."
                : "The premier global culinary community platform — uniting chefs, judges, organizers, and sponsors in one place."}
            </p>
            <a href="mailto:info@altohaa.com" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary">
              <Mail className="h-3.5 w-3.5" />
              info@altohaa.com
            </a>
          </div>

          {/* Platform Links */}
          <div>
            <h4 className="mb-3 text-sm font-semibold">{isAr ? "المنصة" : "Platform"}</h4>
            <nav className="flex flex-col gap-2 text-sm text-muted-foreground">
              <Link to="/competitions" className="flex items-center gap-1.5 transition-colors hover:text-primary">
                <Trophy className="h-3.5 w-3.5" />{isAr ? "المسابقات" : "Competitions"}
              </Link>
              <Link to="/community" className="flex items-center gap-1.5 transition-colors hover:text-primary">
                <Users className="h-3.5 w-3.5" />{isAr ? "المجتمع" : "Community"}
              </Link>
              <Link to="/masterclasses" className="flex items-center gap-1.5 transition-colors hover:text-primary">
                <GraduationCap className="h-3.5 w-3.5" />{isAr ? "الدروس المتقدمة" : "Masterclasses"}
              </Link>
              <Link to="/entities" className="flex items-center gap-1.5 transition-colors hover:text-primary">
                <Building2 className="h-3.5 w-3.5" />{isAr ? "الجهات والجمعيات" : "Entities & Associations"}
              </Link>
              <Link to="/news" className="flex items-center gap-1.5 transition-colors hover:text-primary">
                <Newspaper className="h-3.5 w-3.5" />{isAr ? "الأخبار" : "News"}
              </Link>
              <Link to="/exhibitions" className="flex items-center gap-1.5 transition-colors hover:text-primary">
                <Globe className="h-3.5 w-3.5" />{isAr ? "المعارض" : "Exhibitions"}
              </Link>
            </nav>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold">{isAr ? "للأعمال" : "For Business"}</h4>
            <nav className="flex flex-col gap-2 text-sm text-muted-foreground">
              <Link to="/sponsors" className="transition-colors hover:text-primary">
                {isAr ? "فرص الرعاية" : "Sponsorship Opportunities"}
              </Link>
              <Link to="/for-organizers" className="transition-colors hover:text-primary">
                {isAr ? "للمنظمين" : "For Organizers"}
              </Link>
              <Link to="/for-companies" className="transition-colors hover:text-primary">
                {isAr ? "للشركات" : "For Companies"}
              </Link>
              <Link to="/for-chefs" className="transition-colors hover:text-primary">
                {isAr ? "للطهاة" : "For Chefs"}
              </Link>
              <Link to="/verify" className="transition-colors hover:text-primary">
                {isAr ? "التحقق من الشهادات" : "Certificate Verification"}
              </Link>
              <Link to="/help" className="transition-colors hover:text-primary">
                {isAr ? "مركز المساعدة" : "Help Center"}
              </Link>
            </nav>
          </div>

          {/* Quick Access */}
          <div>
            <h4 className="mb-3 text-sm font-semibold">{t("quickLinks")}</h4>
            <nav className="flex flex-col gap-2 text-sm text-muted-foreground">
              <Link to="/" className="transition-colors hover:text-primary">{t("home")}</Link>
              {user ? (
                <>
                  <Link to="/dashboard" className="flex items-center gap-1.5 transition-colors hover:text-primary">
                    <LayoutDashboard className="h-3.5 w-3.5" />{isAr ? "لوحة التحكم" : "Dashboard"}
                  </Link>
                  <Link to="/profile" className="flex items-center gap-1.5 transition-colors hover:text-primary">
                    <User className="h-3.5 w-3.5" />{t("myProfile")}
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/auth" className="transition-colors hover:text-primary">{t("signIn")}</Link>
                  <Link to="/auth?tab=signup" className="transition-colors hover:text-primary">{t("signUp")}</Link>
                </>
              )}
              <Link to="/search" className="transition-colors hover:text-primary">{isAr ? "بحث" : "Search"}</Link>
              <Link to="/install" className="transition-colors hover:text-primary">{isAr ? "تثبيت التطبيق" : "Install App"}</Link>
            </nav>
          </div>
        </div>

        <Separator className="my-6" />

        <div className="flex flex-col items-center gap-3 text-center text-xs text-muted-foreground sm:flex-row sm:justify-between sm:text-sm">
          <p>© {new Date().getFullYear()} Altohaa. {t("allRightsReserved")}</p>
          <div className="flex gap-4">
            <a href="https://instagram.com/altohaa" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-primary">Instagram</a>
            <a href="https://x.com/altohaa" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-primary">Twitter</a>
            <a href="https://linkedin.com/company/altohaa" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-primary">LinkedIn</a>
            <a href="https://youtube.com/@altohaa" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-primary">YouTube</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
