import { forwardRef } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useSiteSettingsContext } from "@/contexts/SiteSettingsContext";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Mail, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const SOCIAL_ICONS: Record<string, string> = {
  instagram: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z",
  x: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z",
  linkedin: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z",
  youtube: "M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z",
};

const navColumns = [
  {
    titleEn: "Platform",
    titleAr: "المنصة",
    links: [
      { to: "/competitions", en: "Competitions", ar: "المسابقات" },
      { to: "/exhibitions", en: "Exhibitions", ar: "المعارض" },
      { to: "/community", en: "Community", ar: "المجتمع" },
      { to: "/blog", en: "News", ar: "الأخبار" },
      { to: "/jobs", en: "Jobs", ar: "الوظائف" },
      { to: "/recipes", en: "Recipes", ar: "الوصفات" },
    ],
  },
  {
    titleEn: "Discover",
    titleAr: "اكتشف",
    links: [
      { to: "/masterclasses", en: "Masterclasses", ar: "الدروس المتقدمة" },
      { to: "/shop", en: "Shop", ar: "المتجر" },
      { to: "/rankings", en: "Rankings", ar: "التصنيفات" },
      { to: "/events-calendar", en: "Events", ar: "الفعاليات" },
      { to: "/mentorship", en: "Mentorship", ar: "الإرشاد" },
      { to: "/entities", en: "Entities", ar: "الجهات" },
    ],
  },
  {
    titleEn: "Company",
    titleAr: "الشركة",
    links: [
      { to: "/about", en: "About", ar: "من نحن" },
      { to: "/contact", en: "Contact", ar: "اتصل بنا" },
      { to: "/help", en: "Help Center", ar: "المساعدة" },
      { to: "/for-organizers", en: "For Organizers", ar: "للمنظمين" },
      { to: "/for-companies", en: "For Companies", ar: "للشركات" },
      { to: "/verify", en: "Verify Certificate", ar: "التحقق من الشهادات" },
    ],
  },
];

const legalLinks = [
  { to: "/privacy", en: "Privacy", ar: "الخصوصية" },
  { to: "/terms", en: "Terms", ar: "الشروط" },
  { to: "/cookies", en: "Cookies", ar: "الكوكيز" },
];

export const Footer = forwardRef<HTMLElement>(function Footer(_, ref) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const isAr = language === "ar";
  const siteSettings = useSiteSettingsContext();
  const footerCfg = siteSettings.footer || {};
  const brandCfg = siteSettings.branding || {};
  const identityLogos = (siteSettings.brand_identity as any)?.logos || {};

  if (footerCfg.showFooter === false) return null;

  const siteName = isAr ? (brandCfg.siteNameAr || "الطهاة") : (brandCfg.siteName || "Altoha");
  const logoUrl = identityLogos.natural || identityLogos.variation2 || brandCfg.logoUrl || "/altoha-logo.png";
  const contactEmail = brandCfg.contactEmail || "info@altoha.com";
  const l = (en: string, ar: string) => (isAr ? ar : en);
  const year = new Date().getFullYear();
  const copyrightText = isAr
    ? (footerCfg.copyrightTextAr || `© {year} الطهاة`).replace("{year}", String(year))
    : (footerCfg.copyrightText || `© {year} Altoha`).replace("{year}", String(year));

  const socialLinks = [
    { href: footerCfg.instagramUrl, label: "Instagram", icon: SOCIAL_ICONS.instagram },
    { href: footerCfg.xUrl, label: "X", icon: SOCIAL_ICONS.x },
    { href: footerCfg.linkedinUrl, label: "LinkedIn", icon: SOCIAL_ICONS.linkedin },
    { href: footerCfg.youtubeUrl, label: "YouTube", icon: SOCIAL_ICONS.youtube },
  ].filter(s => s.href);

  return (
    <footer
      ref={ref}
      id="site-footer"
      className="bg-[hsl(213_33%_15%)] dark:bg-[hsl(213_35%_8%)] text-[hsl(210_18%_82%)] pb-24 sm:pb-0 safe-area-bottom"
      role="contentinfo"
    >
      <div className="container px-5 sm:px-6">
        {/* Main grid: Brand col + 3 nav columns */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-8 py-8 sm:grid-cols-3 lg:grid-cols-5">
          {/* Brand column — spans 2 cols on lg */}
          <div className="col-span-2 sm:col-span-3 lg:col-span-2 lg:pe-8">
            <Link to="/" className="inline-flex items-center gap-2 group">
              <img src={logoUrl} alt={siteName} className="h-7 w-auto" loading="lazy" />
              <span className={cn("text-base font-bold text-foreground", !isAr && "font-serif")}>
                {siteName}
              </span>
            </Link>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <a
                href={`mailto:${contactEmail}`}
                className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <Mail className="h-3.5 w-3.5" />
                {contactEmail}
              </a>
              {!user && (
                <Button size="sm" asChild className="rounded-xl h-8 text-xs gap-1">
                  <Link to="/register">
                    {l("Join Free", "انضم مجاناً")}
                    <ArrowUpRight className="h-3 w-3" />
                  </Link>
                </Button>
              )}
            </div>
            {/* Social icons */}
            {footerCfg.showSocialLinks !== false && socialLinks.length > 0 && (
              <div className="mt-4 flex items-center gap-1.5">
                {socialLinks.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className="flex h-10 w-10 sm:h-8 sm:w-8 items-center justify-center rounded-xl text-muted-foreground/50 hover:text-primary hover:bg-primary/8 transition-all duration-200 touch-manipulation"
                  >
                    <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d={social.icon} />
                    </svg>
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Nav columns */}
          {navColumns.map((col) => (
            <nav key={col.titleEn} aria-label={col.titleEn}>
              <h3 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70 mb-3">
                {l(col.titleEn, col.titleAr)}
              </h3>
              <ul className="space-y-2 sm:space-y-1.5">
                {col.links.map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="text-[14px] sm:text-[13px] text-muted-foreground hover:text-foreground transition-colors duration-200 touch-manipulation inline-block py-0.5"
                    >
                      {l(link.en, link.ar)}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-border/20 py-4 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[11px] text-muted-foreground/60">{copyrightText}</p>
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground/60">
            {legalLinks.map((link, i) => (
              <span key={link.to} className="flex items-center gap-3">
                <Link to={link.to} className="hover:text-foreground transition-colors">
                  {l(link.en, link.ar)}
                </Link>
                {i < legalLinks.length - 1 && <span className="text-border/40">·</span>}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
});

Footer.displayName = "Footer";
