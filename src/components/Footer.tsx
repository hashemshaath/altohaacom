import { memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useSiteSettingsContext } from "@/contexts/SiteSettingsContext";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Mail, ArrowUpRight, Trophy, Users, Briefcase, GraduationCap,
  UtensilsCrossed, Globe, Newspaper, Medal, CalendarDays,
  ShoppingBag, Building2, HandHeart, ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const SOCIAL_ICONS: Record<string, string> = {
  instagram: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z",
  x: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z",
  linkedin: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z",
  youtube: "M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z",
};

const platformLinks = [
  { to: "/competitions", icon: Trophy, en: "Competitions", ar: "المسابقات" },
  { to: "/community", icon: Users, en: "Community", ar: "المجتمع" },
  { to: "/jobs", icon: Briefcase, en: "Jobs", ar: "الوظائف" },
  { to: "/recipes", icon: UtensilsCrossed, en: "Recipes", ar: "الوصفات" },
  { to: "/exhibitions", icon: Globe, en: "Exhibitions", ar: "المعارض" },
  { to: "/news", icon: Newspaper, en: "News", ar: "الأخبار" },
];

const discoverLinks = [
  { to: "/masterclasses", icon: GraduationCap, en: "Masterclasses", ar: "الدروس المتقدمة" },
  { to: "/shop", icon: ShoppingBag, en: "Shop", ar: "المتجر" },
  { to: "/rankings", icon: Medal, en: "Rankings", ar: "التصنيفات" },
  { to: "/events-calendar", icon: CalendarDays, en: "Events Calendar", ar: "تقويم الفعاليات" },
  { to: "/mentorship", icon: HandHeart, en: "Mentorship", ar: "الإرشاد" },
  { to: "/entities", icon: Building2, en: "Entities", ar: "الجهات" },
];

const businessLinks = [
  { to: "/sponsors", en: "Sponsorship", ar: "فرص الرعاية" },
  { to: "/for-organizers", en: "For Organizers", ar: "للمنظمين" },
  { to: "/for-companies", en: "For Companies", ar: "للشركات" },
  { to: "/for-chefs", en: "For Chefs", ar: "للطهاة" },
];

const legalLinks = [
  { to: "/about", en: "About", ar: "من نحن" },
  { to: "/contact", en: "Contact", ar: "اتصل بنا" },
  { to: "/privacy", en: "Privacy", ar: "الخصوصية" },
  { to: "/terms", en: "Terms", ar: "الشروط" },
  { to: "/cookies", en: "Cookies", ar: "الكوكيز" },
  { to: "/help", en: "Help Center", ar: "المساعدة" },
];

export const Footer = memo(function Footer() {
  const { t, language } = useLanguage();
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
  const siteDesc = isAr
    ? (brandCfg.siteDescriptionAr || "المنصة الرائدة لمجتمع الطهي العالمي — تجمع الطهاة والحكام والمنظمين والرعاة في مكان واحد.")
    : (brandCfg.siteDescription || "The premier global culinary community platform — uniting chefs, judges, organizers, and sponsors in one place.");

  const year = new Date().getFullYear();
  const copyrightText = isAr
    ? (footerCfg.copyrightTextAr || `© {year} الطهاة. جميع الحقوق محفوظة.`).replace("{year}", String(year))
    : (footerCfg.copyrightText || `© {year} Altoha. All rights reserved.`).replace("{year}", String(year));

  const socialLinks = [
    { href: footerCfg.instagramUrl, label: "Instagram", icon: SOCIAL_ICONS.instagram },
    { href: footerCfg.xUrl, label: "X", icon: SOCIAL_ICONS.x },
    { href: footerCfg.linkedinUrl, label: "LinkedIn", icon: SOCIAL_ICONS.linkedin },
    { href: footerCfg.youtubeUrl, label: "YouTube", icon: SOCIAL_ICONS.youtube },
  ].filter(s => s.href);

  const l = (en: string, ar: string) => isAr ? ar : en;

  return (
    <footer id="site-footer" className="relative border-t border-border/30 bg-card pb-20 md:pb-0 overflow-hidden" role="contentinfo">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute -top-32 start-1/2 -translate-x-1/2 w-[500px] h-[250px] rounded-full bg-primary/[0.03] blur-[100px]" />

      <div className="container relative">
        {/* Top: Brand + Newsletter CTA */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 py-8 border-b border-border/20">
          <div className="flex items-center gap-3">
            <img src={logoUrl} alt={siteName} className="h-9 w-auto" loading="lazy" />
            <div>
              <span className={cn("text-lg font-bold text-foreground", !isAr && "font-serif")}>{siteName}</span>
              <p className="text-[11px] text-muted-foreground/60 mt-0.5 max-w-[280px] line-clamp-1">{siteDesc}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a href={`mailto:${contactEmail}`} className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary group">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/8 group-hover:bg-primary/15 transition-colors">
                <Mail className="h-4 w-4 text-primary" />
              </div>
              <span className="hidden sm:inline">{contactEmail}</span>
            </a>
            {!user && (
              <Button size="sm" asChild className="rounded-xl shadow-[var(--shadow-sm)] gap-1.5 text-xs font-semibold">
                <Link to="/register">
                  {l("Join Free", "انضم مجاناً")}
                  <ArrowUpRight className="h-3 w-3" />
                </Link>
              </Button>
            )}
          </div>
        </div>

        {/* Links Grid */}
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 py-10">
          {/* Platform */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground/80 mb-4">{l("Platform", "المنصة")}</h4>
            <nav aria-label="Platform links" className="space-y-1">
              {platformLinks.map((link) => (
                <Link key={link.to} to={link.to} className="group/fl flex items-center gap-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
                  <link.icon className="h-3.5 w-3.5 text-muted-foreground/50 group-hover/fl:text-primary transition-colors" />
                  <span>{l(link.en, link.ar)}</span>
                </Link>
              ))}
            </nav>
          </div>

          {/* Discover */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground/80 mb-4">{l("Discover", "اكتشف")}</h4>
            <nav aria-label="Discover links" className="space-y-1">
              {discoverLinks.map((link) => (
                <Link key={link.to} to={link.to} className="group/fl flex items-center gap-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
                  <link.icon className="h-3.5 w-3.5 text-muted-foreground/50 group-hover/fl:text-primary transition-colors" />
                  <span>{l(link.en, link.ar)}</span>
                </Link>
              ))}
            </nav>
          </div>

          {/* For Business */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground/80 mb-4">{l("For Business", "للأعمال")}</h4>
            <nav aria-label="Business links" className="space-y-1">
              {businessLinks.map((link) => (
                <Link key={link.to} to={link.to} className="flex items-center gap-1.5 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground group/bl">
                  <ChevronRight className="h-3 w-3 text-muted-foreground/30 group-hover/bl:text-primary/60 transition-colors" />
                  <span>{l(link.en, link.ar)}</span>
                </Link>
              ))}
            </nav>
            <div className="mt-4 pt-3 border-t border-border/15">
              <Link to="/verify" className="text-xs text-muted-foreground/60 hover:text-primary transition-colors">
                {l("Certificate Verification", "التحقق من الشهادات")}
              </Link>
            </div>
          </div>

          {/* Quick Access */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground/80 mb-4">{t("quickLinks")}</h4>
            <nav aria-label="Quick links" className="space-y-1">
              <Link to="/" className="block py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">{t("home")}</Link>
              <Link to="/search" className="block py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">{l("Search", "بحث")}</Link>
              {user ? (
                <>
                  <Link to="/dashboard" className="block py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">{l("Dashboard", "لوحة التحكم")}</Link>
                  <Link to="/profile" className="block py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">{t("myProfile")}</Link>
                </>
              ) : (
                <>
                  <Link to="/login" className="block py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">{t("signIn")}</Link>
                  <Link to="/register" className="block py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">{t("signUp")}</Link>
                </>
              )}
              <Link to="/install" className="block py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">{l("Install App", "تثبيت التطبيق")}</Link>
            </nav>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-border/20 py-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Legal */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground/50">
            {legalLinks.map((link, i) => (
              <span key={link.to} className="flex items-center gap-3">
                <Link to={link.to} className="hover:text-foreground transition-colors">{l(link.en, link.ar)}</Link>
                {i < legalLinks.length - 1 && <span className="text-border">·</span>}
              </span>
            ))}
          </div>

          {/* Social + copyright */}
          <div className="flex items-center gap-4">
            {footerCfg.showSocialLinks !== false && socialLinks.length > 0 && (
              <div className="flex items-center gap-2">
                {socialLinks.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground/40 transition-all duration-200 hover:text-primary hover:bg-primary/8"
                  >
                    <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24"><path d={social.icon} /></svg>
                  </a>
                ))}
              </div>
            )}
            <p className="text-[10px] text-muted-foreground/40">{copyrightText}</p>
          </div>
        </div>
      </div>
    </footer>
  );
});
Footer.displayName = "Footer";
