import { ROUTES } from "@/config/routes";
import { useIsAr } from "@/hooks/useIsAr";
import { forwardRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useSiteSettingsContext } from "@/contexts/SiteSettingsContext";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Mail, Send, Shield, Lock, CheckCircle2, ChefHat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const SOCIAL_ICONS: Record<string, string> = {
  instagram: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z",
  x: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z",
  linkedin: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z",
  youtube: "M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z",
  tiktok: "M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z",
};

const navColumns = [
  {
    titleEn: "Platform",
    titleAr: "المنصة",
    links: [
      { to: ROUTES.competitions, en: "Competitions", ar: "المسابقات" },
      { to: ROUTES.exhibitions, en: "Exhibitions", ar: "المعارض" },
      { to: ROUTES.community, en: "Community", ar: "المجتمع" },
      { to: ROUTES.blog, en: "News & Blog", ar: "الأخبار والمدونة" },
      { to: ROUTES.jobs, en: "Jobs", ar: "الوظائف" },
      { to: ROUTES.recipes, en: "Recipes", ar: "الوصفات" },
    ],
  },
  {
    titleEn: "Discover",
    titleAr: "اكتشف",
    links: [
      { to: ROUTES.masterclasses, en: "Masterclasses", ar: "الدروس المتقدمة" },
      { to: ROUTES.shop, en: "Shop", ar: "المتجر" },
      { to: ROUTES.rankings, en: "Rankings", ar: "التصنيفات" },
      { to: ROUTES.eventsCalendar, en: "Events Calendar", ar: "تقويم الفعاليات" },
      { to: ROUTES.mentorship, en: "Mentorship", ar: "الإرشاد" },
      { to: ROUTES.entities, en: "Culinary Entities", ar: "الجهات الطهوية" },
    ],
  },
  {
    titleEn: "Company",
    titleAr: "الشركة",
    links: [
      { to: ROUTES.about, en: "About Us", ar: "من نحن" },
      { to: ROUTES.contact, en: "Contact", ar: "اتصل بنا" },
      { to: ROUTES.help, en: "Help Center", ar: "مركز المساعدة" },
      { to: ROUTES.forOrganizers, en: "For Organizers", ar: "للمنظمين" },
      { to: ROUTES.forCompanies, en: "For Companies", ar: "للشركات" },
      { to: ROUTES.verify, en: "Verify Certificate", ar: "التحقق من الشهادات" },
    ],
  },
  {
    titleEn: "Legal",
    titleAr: "قانوني",
    links: [
      { to: ROUTES.privacy, en: "Privacy Policy", ar: "سياسة الخصوصية" },
      { to: ROUTES.terms, en: "Terms of Service", ar: "شروط الاستخدام" },
      { to: ROUTES.cookies, en: "Cookie Policy", ar: "سياسة الكوكيز" },
    ],
  },
];

const trustBadges = [
  { icon: Shield, labelEn: "SSL Secured", labelAr: "محمي بـ SSL" },
  { icon: Lock, labelEn: "Data Protected", labelAr: "بيانات محمية" },
  { icon: CheckCircle2, labelEn: "GDPR Compliant", labelAr: "متوافق مع GDPR" },
];

export const Footer = forwardRef<HTMLElement>(function Footer(_, ref) {
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
    ? (footerCfg.copyrightTextAr || `© {year} الطهاة. جميع الحقوق محفوظة.`).replace("{year}", String(year))
    : (footerCfg.copyrightText || `© {year} Altoha. All rights reserved.`).replace("{year}", String(year));

  const socialLinks = [
    { href: footerCfg.instagramUrl, label: "Instagram", icon: SOCIAL_ICONS.instagram },
    { href: footerCfg.xUrl, label: "X", icon: SOCIAL_ICONS.x },
    { href: footerCfg.linkedinUrl, label: "LinkedIn", icon: SOCIAL_ICONS.linkedin },
    { href: footerCfg.youtubeUrl, label: "YouTube", icon: SOCIAL_ICONS.youtube },
    { href: footerCfg.tiktokUrl, label: "TikTok", icon: SOCIAL_ICONS.tiktok },
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
        toast({ title: l("Subscribed!", "تم الاشتراك!"), description: l("Thanks for joining our community!", "شكراً لانضمامك لمجتمعنا!") });
        setNlEmail("");
      }
    } catch {
      toast({ variant: "destructive", title: l("Error", "خطأ"), description: l("Something went wrong", "حدث خطأ") });
    } finally {
      setNlLoading(false);
    }
  };

  return (
    <footer
      ref={ref}
      id="site-footer"
      className="relative overflow-hidden border-t border-border/30 pb-24 sm:pb-0 safe-area-bottom bg-[hsl(220,20%,7%)] text-white"
      role="contentinfo"
    >
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" aria-hidden="true" />

      <div className="container relative px-5 sm:px-6">

        {/* ── Main grid: Brand + Nav columns + Newsletter ── */}
        <div className="grid grid-cols-2 md:grid-cols-12 gap-x-6 gap-y-8 pt-10 pb-6">
          {/* Brand block */}
          <div className="col-span-2 md:col-span-4">
            <Link to="/" className="inline-flex items-center gap-2.5 group">
              <img src={logoUrl} alt={siteName} width={32} height={32} className="h-8 w-auto" loading="lazy" decoding="async" />
              <span className="text-base font-bold text-white tracking-tight">{siteName}</span>
            </Link>
            <p className="mt-3 text-[13px] leading-relaxed text-white/45 max-w-xs">
              {l(
                "The premier platform connecting culinary professionals worldwide.",
                "المنصة الرائدة التي تربط محترفي الطهي حول العالم."
              )}
            </p>
            <a
              href={`mailto:${contactEmail}`}
              className="mt-3 inline-flex items-center gap-1.5 text-[13px] text-white/40 hover:text-primary transition-colors"
            >
              <Mail className="h-3.5 w-3.5" />
              {contactEmail}
            </a>

            {/* Social icons inline with brand */}
            {footerCfg.showSocialLinks !== false && socialLinks.length > 0 && (
              <div className="flex items-center gap-1 mt-4">
                {socialLinks.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank" rel="noopener noreferrer"
                    aria-label={social.label}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-all duration-200"
                  >
                    <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d={social.icon} />
                    </svg>
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Nav columns — 4 cols compact */}
          {navColumns.map((col) => (
            <nav key={col.titleEn} aria-label={col.titleEn} className="md:col-span-2">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.15em] text-white/70 mb-2.5">
                {l(col.titleEn, col.titleAr)}
              </h3>
              <ul className="space-y-1.5">
                {col.links.map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="text-[13px] text-white/45 hover:text-white transition-colors duration-200 inline-block touch-manipulation"
                    >
                      {l(link.en, link.ar)}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        {/* ── Newsletter row — compact horizontal ── */}
        <div className="border-t border-white/10 py-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-center gap-2">
            <ChefHat className="h-4 w-4 text-primary shrink-0" />
            <div>
              <h3 className="text-[13px] font-semibold text-white leading-tight">
                {l("Stay in the Loop", "ابقَ على اطلاع")}
              </h3>
              <p className="text-[11px] text-white/40 leading-tight mt-0.5">
                {l("Latest culinary news & exclusive insights.", "آخر أخبار الطهي والمحتوى الحصري.")}
              </p>
            </div>
          </div>
          <form onSubmit={handleNewsletterSubmit} className="flex gap-2 w-full md:w-auto md:max-w-sm">
            <Input
              type="email"
              value={nlEmail}
              onChange={(e) => setNlEmail(e.target.value)}
              placeholder={l("your@email.com", "بريدك الإلكتروني")}
              required
              className="flex-1 h-9 rounded-lg border-white/10 bg-white/5 text-white placeholder:text-white/25 text-[13px] focus:border-primary/50 focus:ring-primary/20"
            />
            <Button type="submit" disabled={nlLoading} size="sm" className="h-9 px-4 rounded-lg gap-1.5 shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-[13px]">
              <Send className="h-3.5 w-3.5" />
              {nlLoading ? "..." : l("Subscribe", "اشتراك")}
            </Button>
          </form>
        </div>

        {/* ── Bottom bar: copyright + trust badges ── */}
        <div className="border-t border-white/10 py-4 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-[11px] text-white/30">{copyrightText}</p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            {trustBadges.map((badge) => (
              <div key={badge.labelEn} className="flex items-center gap-1.5 text-[11px] text-white/35">
                <badge.icon className="h-3.5 w-3.5 text-primary/60" />
                <span>{l(badge.labelEn, badge.labelAr)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
});

Footer.displayName = "Footer";
