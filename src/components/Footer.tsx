import { useIsAr } from "@/hooks/useIsAr";
import { forwardRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useSiteSettingsContext } from "@/contexts/SiteSettingsContext";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Mail, Send, ArrowUp, Shield, Lock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
  {
    titleEn: "Legal",
    titleAr: "قانوني",
    links: [
      { to: "/privacy", en: "Privacy Policy", ar: "سياسة الخصوصية" },
      { to: "/terms", en: "Terms of Service", ar: "شروط الاستخدام" },
      { to: "/cookies", en: "Cookie Policy", ar: "سياسة الكوكيز" },
    ],
  },
];

const trustBadges = [
  { icon: Shield, labelEn: "SSL Secured", labelAr: "محمي بـ SSL" },
  { icon: Lock, labelEn: "Data Protected", labelAr: "بيانات محمية" },
  { icon: CheckCircle2, labelEn: "GDPR Compliant", labelAr: "متوافق مع GDPR" },
];

export const Footer = forwardRef<HTMLElement>(function Footer(_, ref) {
  const { user } = useAuth();
  const isAr = useIsAr();
  const siteSettings = useSiteSettingsContext();
  const footerCfg = siteSettings.footer || {};
  const brandCfg = siteSettings.branding || {};
  const identityLogos = (siteSettings.brand_identity as Record<string, Record<string, string>> | undefined)?.logos || {};
  const { toast } = useToast();
  const [nlEmail, setNlEmail] = useState("");
  const [nlLoading, setNlLoading] = useState(false);

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

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nlEmail.trim()) return;
    setNlLoading(true);
    try {
      const { error } = await supabase.from("newsletter_subscribers").insert({ email: nlEmail.trim() });
      if (error) {
        if (error.code === "23505") {
          toast({ title: l("Already Subscribed", "مشترك بالفعل"), description: l("This email is already registered", "هذا البريد مسجل مسبقاً") });
        } else throw error;
      } else {
        toast({ title: l("Subscribed!", "تم الاشتراك!"), description: l("Thanks for joining!", "شكراً لانضمامك!") });
        setNlEmail("");
      }
    } catch {
      toast({ variant: "destructive", title: l("Error", "خطأ"), description: l("Something went wrong", "حدث خطأ") });
    } finally {
      setNlLoading(false);
    }
  };

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <footer
      ref={ref}
      id="site-footer"
      className="border-t border-[hsl(220_13%_91%)] bg-[hsl(220_14%_96%)] dark:bg-[hsl(213_35%_8%)] dark:border-border/30 pb-24 sm:pb-0 safe-area-bottom"
      role="contentinfo"
    >
      <div className="container px-5 sm:px-6">

        {/* ── Top: Brand + Newsletter ── */}
        <div className="py-10 sm:py-12 flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
          {/* Brand */}
          <div className="max-w-sm">
            <Link to="/" className="inline-flex items-center gap-2.5 group">
              <img src={logoUrl} alt={siteName} className="h-8 w-auto" loading="lazy" />
              <span className={cn("text-lg font-bold text-[hsl(220_13%_11%)] dark:text-foreground", !isAr && "font-serif")}>
                {siteName}
              </span>
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-[hsl(220_9%_35%)] dark:text-muted-foreground">
              {l(
                "The premier platform connecting culinary professionals worldwide through competitions, education, and community.",
                "المنصة الرائدة التي تربط المحترفين في عالم الطهي عبر المسابقات والتعليم والمجتمع."
              )}
            </p>
            <a
              href={`mailto:${contactEmail}`}
              className="mt-3 inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors duration-200"
            >
              <Mail className="h-3.5 w-3.5" />
              {contactEmail}
            </a>
          </div>

          {/* Newsletter */}
          <div className="w-full max-w-md">
            <h3 className="text-sm font-semibold text-foreground">
              {l("Stay Updated", "ابقَ على اطلاع")}
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {l("Get the latest news and updates directly to your inbox.", "احصل على آخر الأخبار والتحديثات مباشرة.")}
            </p>
            <form onSubmit={handleNewsletterSubmit} className="mt-3 flex gap-2">
              <Input
                type="email"
                value={nlEmail}
                onChange={(e) => setNlEmail(e.target.value)}
                placeholder={l("your@email.com", "بريدك الإلكتروني")}
                required
                className="flex-1 h-10 rounded-xl border-border bg-background dark:bg-background text-sm"
              />
              <Button type="submit" disabled={nlLoading} size="sm" className="h-10 px-5 rounded-xl gap-1.5 shrink-0">
                <Send className="h-3.5 w-3.5" />
                {nlLoading ? "..." : l("Subscribe", "اشتراك")}
              </Button>
            </form>
          </div>
        </div>

        {/* ── Divider ── */}
        <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" aria-hidden="true" />

        {/* ── Nav columns ── */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-8 py-10 sm:grid-cols-2 md:grid-cols-4">
          {navColumns.map((col) => (
            <nav key={col.titleEn} aria-label={col.titleEn}>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-foreground mb-3.5">
                {l(col.titleEn, col.titleAr)}
              </h3>
              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="relative text-[0.8125rem] text-muted-foreground hover:text-primary transition-colors duration-200 inline-block py-0.5 after:absolute after:bottom-0 after:start-0 after:h-[1.5px] after:w-0 after:bg-primary after:transition-all after:duration-300 hover:after:w-full touch-manipulation"
                    >
                      {l(link.en, link.ar)}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        {/* ── Trust badges ── */}
        <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" aria-hidden="true" />
        <div className="py-5 flex flex-wrap items-center justify-center gap-6">
          {trustBadges.map((badge) => (
            <div key={badge.labelEn} className="flex items-center gap-2 text-xs text-muted-foreground">
              <badge.icon className="h-3.5 w-3.5 text-primary/70" />
              <span>{l(badge.labelEn, badge.labelAr)}</span>
            </div>
          ))}
        </div>

        {/* ── Bottom bar ── */}
        <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" aria-hidden="true" />
        <div className="py-5 flex flex-col-reverse gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground/60">{copyrightText}</p>

          {/* Social icons */}
          {footerCfg.showSocialLinks !== false && socialLinks.length > 0 && (
            <div className="flex items-center gap-1">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank" rel="noopener noreferrer"
                  aria-label={social.label}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/8 transition-all duration-200 touch-manipulation"
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d={social.icon} />
                  </svg>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Back to top ── */}
      <button
        onClick={scrollToTop}
        aria-label={l("Back to top", "العودة للأعلى")}
        className="fixed bottom-6 end-6 z-40 flex h-10 w-10 items-center justify-center rounded-full border border-border bg-white/90 text-muted-foreground shadow-lg backdrop-blur-sm hover:text-primary hover:border-primary/30 transition-all duration-200 sm:bottom-8 sm:end-8 dark:bg-card/90 dark:border-border/40"
      >
        <ArrowUp className="h-4 w-4" />
      </button>
    </footer>
  );
});

Footer.displayName = "Footer";
