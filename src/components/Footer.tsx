import React from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { Building2, Trophy, GraduationCap, Newspaper, Users, Globe, Mail, User, LayoutDashboard } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export const Footer = React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(function Footer(_props, ref) {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const isAr = language === "ar";

  return (
    <footer ref={ref} className="border-t border-border/40 bg-card/80 backdrop-blur-sm pb-20 md:pb-0" role="contentinfo">
      <div className="container py-10 md:py-14">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="mb-4 flex items-center gap-2.5">
              <img src="/altohaa-logo.png" alt="Altohaa" className="h-9 w-auto" />
              <span className="font-serif text-xl font-bold text-primary">Altohaa</span>
            </div>
            <p className="mb-5 text-sm leading-relaxed text-muted-foreground">
              {isAr
                ? "المنصة الرائدة لمجتمع الطهي العالمي — تجمع الطهاة والحكام والمنظمين والرعاة في مكان واحد."
                : "The premier global culinary community platform — uniting chefs, judges, organizers, and sponsors in one place."}
            </p>
            <a href="mailto:info@altohaa.com" className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary group">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/8 group-hover:bg-primary/15 transition-colors">
                <Mail className="h-3.5 w-3.5 text-primary" />
              </div>
              info@altohaa.com
            </a>
          </div>

          {/* Platform Links */}
          <div>
            <h4 className="mb-4 text-sm font-semibold">{isAr ? "المنصة" : "Platform"}</h4>
            <nav aria-label="Platform links" className="flex flex-col gap-2.5 text-sm text-muted-foreground">
              <Link to="/competitions" className="flex items-center gap-2 transition-all duration-200 hover:text-primary hover:translate-x-0.5 rtl:hover:-translate-x-0.5">
                <Trophy className="h-3.5 w-3.5 opacity-60" />{isAr ? "المسابقات" : "Competitions"}
              </Link>
              <Link to="/community" className="flex items-center gap-2 transition-all duration-200 hover:text-primary hover:translate-x-0.5 rtl:hover:-translate-x-0.5">
                <Users className="h-3.5 w-3.5 opacity-60" />{isAr ? "المجتمع" : "Community"}
              </Link>
              <Link to="/masterclasses" className="flex items-center gap-2 transition-all duration-200 hover:text-primary hover:translate-x-0.5 rtl:hover:-translate-x-0.5">
                <GraduationCap className="h-3.5 w-3.5 opacity-60" />{isAr ? "الدروس المتقدمة" : "Masterclasses"}
              </Link>
              <Link to="/entities" className="flex items-center gap-2 transition-all duration-200 hover:text-primary hover:translate-x-0.5 rtl:hover:-translate-x-0.5">
                <Building2 className="h-3.5 w-3.5 opacity-60" />{isAr ? "الجهات والجمعيات" : "Entities & Associations"}
              </Link>
              <Link to="/news" className="flex items-center gap-2 transition-all duration-200 hover:text-primary hover:translate-x-0.5 rtl:hover:-translate-x-0.5">
                <Newspaper className="h-3.5 w-3.5 opacity-60" />{isAr ? "الأخبار" : "News"}
              </Link>
              <Link to="/exhibitions" className="flex items-center gap-2 transition-all duration-200 hover:text-primary hover:translate-x-0.5 rtl:hover:-translate-x-0.5">
                <Globe className="h-3.5 w-3.5 opacity-60" />{isAr ? "المعارض" : "Exhibitions"}
              </Link>
            </nav>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold">{isAr ? "للأعمال" : "For Business"}</h4>
            <nav aria-label="Business links" className="flex flex-col gap-2.5 text-sm text-muted-foreground">
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
            <h4 className="mb-4 text-sm font-semibold">{t("quickLinks")}</h4>
            <nav aria-label="Quick links" className="flex flex-col gap-2.5 text-sm text-muted-foreground">
              <Link to="/" className="transition-colors hover:text-primary">{t("home")}</Link>
              {user ? (
                <>
                  <Link to="/dashboard" className="flex items-center gap-2 transition-colors hover:text-primary">
                    <LayoutDashboard className="h-3.5 w-3.5 opacity-60" />{isAr ? "لوحة التحكم" : "Dashboard"}
                  </Link>
                  <Link to="/profile" className="flex items-center gap-2 transition-colors hover:text-primary">
                    <User className="h-3.5 w-3.5 opacity-60" />{t("myProfile")}
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/login" className="transition-colors hover:text-primary">{t("signIn")}</Link>
                  <Link to="/register" className="transition-colors hover:text-primary">{t("signUp")}</Link>
                </>
              )}
              <Link to="/search" className="transition-colors hover:text-primary">{isAr ? "بحث" : "Search"}</Link>
              <Link to="/install" className="transition-colors hover:text-primary">{isAr ? "تثبيت التطبيق" : "Install App"}</Link>
            </nav>
          </div>
        </div>

        <Separator className="my-8" />

        {/* Legal Links */}
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 mb-6 text-xs text-muted-foreground">
          <Link to="/about" className="hover:text-primary transition-colors">{isAr ? "من نحن" : "About Us"}</Link>
          <Link to="/contact" className="hover:text-primary transition-colors">{isAr ? "اتصل بنا" : "Contact Us"}</Link>
          <Link to="/privacy" className="hover:text-primary transition-colors">{isAr ? "سياسة الخصوصية" : "Privacy Policy"}</Link>
          <Link to="/terms" className="hover:text-primary transition-colors">{isAr ? "الشروط والأحكام" : "Terms & Conditions"}</Link>
          <Link to="/cookies" className="hover:text-primary transition-colors">{isAr ? "سياسة الكوكيز" : "Cookie Policy"}</Link>
        </div>

        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:justify-between">
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Altohaa. {t("allRightsReserved")}</p>
          <div className="flex items-center gap-3">
            {[
              { href: "https://instagram.com/altohaacom", label: "Instagram", icon: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" },
              { href: "https://x.com/altohaacom", label: "X", icon: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" },
              { href: "https://linkedin.com/company/altohaacom", label: "LinkedIn", icon: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" },
              { href: "https://youtube.com/@altohaacom", label: "YouTube", icon: "M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z" },
            ].map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={social.label}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/50 text-muted-foreground transition-all hover:bg-primary/10 hover:text-primary hover:scale-105"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d={social.icon} /></svg>
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
});
Footer.displayName = "Footer";
