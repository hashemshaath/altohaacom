import { useParams } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { useSocialLinkPageByUsername } from "@/hooks/useSocialLinkPage";
import { SEOHead } from "@/components/SEOHead";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ExternalLink, Instagram, Twitter, Facebook, Linkedin, Youtube, Globe,
  User, ArrowLeft, Share2, Check, BadgeCheck, MapPin, Briefcase, Award, Link2,
  Pencil, LogIn, Phone, MessageCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { buildSocialLinksUrl } from "@/lib/publicAppUrl";

const SOCIAL_ICONS: Record<string, { icon: typeof Instagram; label: string; urlPrefix?: string; gradient: string; hoverBg: string }> = {
  instagram: { icon: Instagram, label: "Instagram", urlPrefix: "https://instagram.com/", gradient: "from-pink-500 to-purple-600", hoverBg: "rgba(225,48,108,0.2)" },
  twitter: { icon: Twitter, label: "X / Twitter", urlPrefix: "https://x.com/", gradient: "from-sky-400 to-blue-500", hoverBg: "rgba(29,155,240,0.2)" },
  facebook: { icon: Facebook, label: "Facebook", urlPrefix: "https://facebook.com/", gradient: "from-blue-500 to-blue-700", hoverBg: "rgba(24,119,242,0.2)" },
  linkedin: { icon: Linkedin, label: "LinkedIn", urlPrefix: "https://linkedin.com/in/", gradient: "from-blue-600 to-blue-800", hoverBg: "rgba(10,102,194,0.2)" },
  youtube: { icon: Youtube, label: "YouTube", urlPrefix: "https://youtube.com/@", gradient: "from-red-500 to-red-700", hoverBg: "rgba(255,0,0,0.2)" },
  tiktok: { icon: Globe, label: "TikTok", urlPrefix: "https://tiktok.com/@", gradient: "from-gray-700 to-gray-900", hoverBg: "rgba(255,255,255,0.1)" },
  snapchat: { icon: Globe, label: "Snapchat", urlPrefix: "https://snapchat.com/add/", gradient: "from-yellow-400 to-yellow-600", hoverBg: "rgba(255,252,0,0.15)" },
  website: { icon: Globe, label: "Website", gradient: "from-emerald-500 to-teal-600", hoverBg: "rgba(16,185,129,0.2)" },
};

const BUTTON_STYLES: Record<string, string> = {
  rounded: "rounded-2xl",
  pill: "rounded-full",
  square: "rounded-lg",
  sharp: "rounded-none",
  outline: "rounded-2xl border-2 bg-transparent",
};

const FONT_MAP: Record<string, string> = {
  default: "inherit",
  inter: "'Inter', sans-serif",
  playfair: "'Playfair Display', serif",
  poppins: "'Poppins', sans-serif",
  cairo: "'Cairo', sans-serif",
  tajawal: "'Tajawal', sans-serif",
  montserrat: "'Montserrat', sans-serif",
  roboto: "'Roboto', sans-serif",
};

const FONT_SIZE_MAP: Record<string, { name: string; bio: string; meta: string; link: string }> = {
  sm: { name: "text-lg sm:text-xl", bio: "text-xs", meta: "text-[10px]", link: "text-xs" },
  md: { name: "text-2xl sm:text-3xl", bio: "text-sm", meta: "text-xs", link: "text-sm" },
  lg: { name: "text-3xl sm:text-4xl", bio: "text-base", meta: "text-sm", link: "text-base" },
  xl: { name: "text-4xl sm:text-5xl", bio: "text-lg", meta: "text-base", link: "text-lg" },
};

interface ExtraSettings {
  font_size: string;
  show_bio: boolean;
  show_job_title: boolean;
  show_location: boolean;
  show_stats: boolean;
  show_awards: boolean;
  show_membership: boolean;
  show_full_profile_btn: boolean;
}

const DEFAULT_EXTRA: ExtraSettings = {
  font_size: "md",
  show_bio: true,
  show_job_title: true,
  show_location: true,
  show_stats: true,
  show_awards: true,
  show_membership: true,
  show_full_profile_btn: true,
};

function parseExtra(customCss: string | null | undefined): ExtraSettings {
  if (!customCss) return { ...DEFAULT_EXTRA };
  try {
    return { ...DEFAULT_EXTRA, ...JSON.parse(customCss) };
  } catch {
    return { ...DEFAULT_EXTRA };
  }
}

// ── Animated counter for stats ──
function AnimatedNumber({ value, duration = 1200 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (value === 0) { setDisplay(0); return; }
    const start = performance.now();
    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * value));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [value, duration]);
  return <>{display.toLocaleString()}</>;
}

export default function SocialLinks() {
  const { username } = useParams<{ username: string }>();
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { toast } = useToast();
  const { user } = useAuth();
  const { data, isLoading, error } = useSocialLinkPageByUsername(username);
  const [copied, setCopied] = useState(false);
  const [animated, setAnimated] = useState(false);

  const isOwner = !!(user && data?.profile && user.id === data.profile.user_id);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleLinkClick = useCallback(async (itemId: string) => {
    try {
      await supabase.from("social_link_items").update({ click_count: (data?.items.find(i => i.id === itemId)?.click_count || 0) + 1 }).eq("id", itemId);
    } catch {}
  }, [data?.items]);

  const copyLink = useCallback(async () => {
    if (!username) return;
    await navigator.clipboard.writeText(buildSocialLinksUrl(username));
    setCopied(true);
    toast({ title: isAr ? "تم نسخ الرابط" : "Link copied!" });
    setTimeout(() => setCopied(false), 2000);
  }, [username, isAr, toast]);

  const shareNative = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: `${username} - Altoha`, url: buildSocialLinksUrl(username) });
      } catch {}
    } else {
      copyLink();
    }
  }, [username, copyLink]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: "linear-gradient(180deg, #0a0a12 0%, #0d0d18 100%)" }}>
        <div className="w-full max-w-md space-y-5 p-6">
          <div className="flex flex-col items-center gap-4">
            <Skeleton className="h-28 w-28 rounded-full" style={{ background: "rgba(255,255,255,0.04)" }} />
            <Skeleton className="h-7 w-44" style={{ background: "rgba(255,255,255,0.04)" }} />
            <Skeleton className="h-4 w-56" style={{ background: "rgba(255,255,255,0.04)" }} />
            <div className="flex gap-3 mt-2">
              {[1,2,3,4].map(i => <Skeleton key={i} className="h-11 w-11 rounded-full" style={{ background: "rgba(255,255,255,0.04)" }} />)}
            </div>
          </div>
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full rounded-2xl" style={{ background: "rgba(255,255,255,0.04)" }} />)}
        </div>
      </div>
    );
  }

  if (error || !data?.profile) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-5 p-4" style={{ background: "linear-gradient(180deg, #0a0a12 0%, #0d0d18 100%)" }}>
        <div className="rounded-full p-6" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
          <User className="h-10 w-10" style={{ color: "rgba(255,255,255,0.15)" }} />
        </div>
        <div className="text-center">
          <h1 className="text-xl font-bold" style={{ color: "#ffffff" }}>{isAr ? "الصفحة غير موجودة" : "Page not found"}</h1>
          <p className="mt-2 text-sm max-w-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
            {isAr ? "هذه الصفحة غير موجودة أو لم يتم إنشاؤها بعد" : "This page doesn't exist or hasn't been created yet"}
          </p>
        </div>
        <Button asChild variant="outline" size="sm" className="mt-2" style={{ borderColor: "rgba(255,255,255,0.12)", color: "#ffffff", background: "rgba(255,255,255,0.04)" }}>
          <Link to="/"><ArrowLeft className="me-1.5 h-3.5 w-3.5" />{isAr ? "الرئيسية" : "Go Home"}</Link>
        </Button>
      </div>
    );
  }

  const { profile, page, items } = data;
  const btnStyle = BUTTON_STYLES[page?.button_style || "rounded"] || BUTTON_STYLES.rounded;
  const extra = parseExtra(page?.custom_css);
  const fontSize = FONT_SIZE_MAP[extra.font_size] || FONT_SIZE_MAP.md;
  const fontFamily = FONT_MAP[page?.font_family || "default"] || "inherit";

  const displayName = isAr
    ? (profile.display_name_ar || profile.full_name_ar || profile.display_name || profile.full_name || "")
    : (profile.display_name || profile.full_name || profile.display_name_ar || profile.full_name_ar || "");

  const bio = isAr
    ? ((profile as any).bio_ar || (profile as any).bio || page?.bio_ar || page?.bio)
    : ((profile as any).bio || (profile as any).bio_ar || page?.bio || page?.bio_ar);

  const title = isAr ? (page?.page_title_ar || page?.page_title || displayName) : (page?.page_title || page?.page_title_ar || displayName);

  const specialization = isAr
    ? ((profile as any).specialization_ar || (profile as any).specialization)
    : ((profile as any).specialization || (profile as any).specialization_ar);

  const jobTitle = isAr
    ? ((profile as any).job_title_ar || (profile as any).job_title)
    : ((profile as any).job_title || (profile as any).job_title_ar);

  const socialPlatforms = [
    { key: "instagram", value: profile.instagram },
    { key: "twitter", value: profile.twitter },
    { key: "facebook", value: profile.facebook },
    { key: "linkedin", value: profile.linkedin },
    { key: "youtube", value: profile.youtube },
    { key: "tiktok", value: (profile as any).tiktok },
    { key: "snapchat", value: (profile as any).snapchat },
    { key: "website", value: profile.website },
  ].filter(s => s.value);

  const whatsapp = (profile as any).whatsapp;
  const phone = (profile as any).phone;

  const buttonColorStyle = page?.button_color && page.button_color !== "#000000"
    ? { backgroundColor: page.button_color, color: page.text_color || "#ffffff" }
    : {};

  const coverImage = (profile as any).cover_image_url || page?.background_image_url;
  const isVerified = (profile as any).is_verified;
  const yearsExp = (profile as any).years_of_experience;
  const city = (profile as any).city;
  const countryCode = (profile as any).country_code;
  const membershipTier = (profile as any).membership_tier;
  const globalAwards = (profile as any).global_awards;
  const viewCount = (profile as any).view_count;
  const hasCover = !!coverImage;

  const googleFontLink = page?.font_family && page.font_family !== "default"
    ? `https://fonts.googleapis.com/css2?family=${encodeURIComponent(page.font_family === "playfair" ? "Playfair Display" : page.font_family === "cairo" ? "Cairo" : page.font_family === "tajawal" ? "Tajawal" : page.font_family === "montserrat" ? "Montserrat" : page.font_family === "poppins" ? "Poppins" : page.font_family === "roboto" ? "Roboto" : "Inter")}:wght@300;400;500;600;700&display=swap`
    : null;

  const accentColor = "#c4a265";
  const accentLight = "rgba(196,162,101,0.12)";
  const accentMedium = "rgba(196,162,101,0.25)";

  return (
    <div
      className="flex min-h-screen flex-col items-center"
      dir={isAr ? "rtl" : "ltr"}
      style={{
        background: "linear-gradient(180deg, #0a0a12 0%, #0d0d18 50%, #0a0a12 100%)",
        fontFamily,
        color: "#f5f5f5",
      }}
    >
      {googleFontLink && <link rel="stylesheet" href={googleFontLink} />}
      <SEOHead
        title={`${title} - Altoha Links`}
        description={bio || `${displayName}'s links on Altoha`}
      />

      {/* Cover / Hero */}
      <div className="relative w-full" style={{ height: hasCover ? "300px" : "200px" }}>
        {hasCover ? (
          <>
            <img src={coverImage} alt="" className="absolute inset-0 w-full h-full object-cover" loading="eager" />
            <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(10,10,18,0.05) 0%, rgba(10,10,18,0.4) 40%, rgba(10,10,18,0.95) 85%, #0a0a12 100%)" }} />
          </>
        ) : (
          <div className="absolute inset-0" style={{
            background: `radial-gradient(ellipse at 50% 0%, ${accentLight} 0%, transparent 60%), linear-gradient(180deg, rgba(196,162,101,0.03) 0%, transparent 100%)`
          }} />
        )}

        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-[0.015]" style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
          backgroundSize: "24px 24px"
        }} />

        {/* Top Actions */}
        <div className={`absolute top-4 ${isAr ? "left-4" : "right-4"} z-20 flex gap-2 transition-all duration-700 ${animated ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"}`}>
          {isOwner && (
            <Link
              to="/social-links"
              className="flex h-10 w-10 items-center justify-center rounded-full backdrop-blur-xl transition-all duration-300 hover:scale-110 active:scale-95"
              style={{ backgroundColor: "rgba(196,162,101,0.2)", border: "1px solid rgba(196,162,101,0.35)", color: accentColor }}
              title={isAr ? "تعديل" : "Edit"}
            >
              <Pencil className="h-4 w-4" />
            </Link>
          )}
          <button
            onClick={shareNative}
            className="flex h-10 w-10 items-center justify-center rounded-full backdrop-blur-xl transition-all duration-300 hover:scale-110 active:scale-95"
            style={{ backgroundColor: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }}
          >
            {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
          </button>
        </div>

        {/* Avatar */}
        <div className={`absolute -bottom-16 left-1/2 -translate-x-1/2 z-20 transition-all duration-700 delay-150 ${animated ? "opacity-100 scale-100" : "opacity-0 scale-75"}`}>
          {(page?.show_avatar !== false) && (
            <div className="relative">
              <div className="absolute -inset-1 rounded-full animate-pulse" style={{ background: `radial-gradient(circle, ${accentLight} 0%, transparent 70%)`, opacity: 0.4 }} />
              <Avatar className="h-32 w-32 shadow-2xl relative" style={{ boxShadow: `0 0 0 4px #0a0a12, 0 0 60px ${accentLight}` }}>
                <AvatarImage src={profile.avatar_url || ""} alt={displayName} className="object-cover" />
                <AvatarFallback className="text-3xl font-bold" style={{ background: accentLight, color: accentColor }}>{displayName?.charAt(0)}</AvatarFallback>
              </Avatar>
              {isVerified && (
                <div className="absolute -bottom-1 -end-1 h-8 w-8 rounded-full flex items-center justify-center shadow-lg" style={{ background: `linear-gradient(135deg, ${accentColor}, #d4b576)`, boxShadow: `0 0 0 3px #0a0a12, 0 4px 12px rgba(196,162,101,0.3)` }}>
                  <BadgeCheck className="h-4.5 w-4.5 text-white" />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-lg px-5 pt-20 pb-12">

        {/* Name & Meta */}
        <div className={`text-center mb-8 transition-all duration-700 delay-250 ${animated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <h1 className={`font-bold tracking-tight ${fontSize.name}`} style={{ color: "#ffffff", textShadow: "0 2px 20px rgba(0,0,0,0.3)" }}>
            {title}
          </h1>

          <p className="mt-2 font-medium" style={{ fontSize: "13px", color: "rgba(255,255,255,0.3)", letterSpacing: "1px" }}>
            @{profile.username}
          </p>

          {/* Job & Location */}
          {(extra.show_job_title || extra.show_location) && (
            <div className="flex items-center justify-center flex-wrap gap-x-5 gap-y-1.5 mt-4">
              {extra.show_job_title && (jobTitle || specialization) && (
                <span className={`flex items-center gap-1.5 font-medium ${fontSize.meta}`} style={{ color: "rgba(255,255,255,0.5)" }}>
                  <Briefcase className="h-3.5 w-3.5" style={{ color: accentColor }} />
                  {jobTitle || specialization}
                </span>
              )}
              {extra.show_location && (city || countryCode) && (
                <span className={`flex items-center gap-1.5 font-medium ${fontSize.meta}`} style={{ color: "rgba(255,255,255,0.5)" }}>
                  <MapPin className="h-3.5 w-3.5" style={{ color: accentColor }} />
                  {city}{city && countryCode ? ", " : ""}{countryCode}
                </span>
              )}
            </div>
          )}

          {/* Membership */}
          {extra.show_membership && membershipTier && membershipTier !== "free" && (
            <div className="mt-4">
              <span className="inline-flex items-center gap-1.5 px-4 py-1.5 text-[11px] font-semibold rounded-full capitalize tracking-wide"
                style={{ background: `linear-gradient(135deg, ${accentLight}, rgba(196,162,101,0.08))`, color: accentColor, border: `1px solid ${accentMedium}`, backdropFilter: "blur(10px)" }}>
                ✦ {membershipTier}
              </span>
            </div>
          )}
        </div>

        {/* Stats */}
        {extra.show_stats && (yearsExp || viewCount > 0) && (
          <div className={`flex justify-center gap-2 mb-8 transition-all duration-700 delay-300 ${animated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
            {yearsExp && (
              <div className="text-center px-7 py-4 rounded-2xl backdrop-blur-sm" style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.05)" }}>
                <p className="text-2xl font-bold tabular-nums" style={{ color: "#fff" }}>
                  <AnimatedNumber value={yearsExp} /><span style={{ color: accentColor }}>+</span>
                </p>
                <p className="text-[10px] uppercase tracking-[0.15em] mt-1.5 font-medium" style={{ color: "rgba(255,255,255,0.3)" }}>
                  {isAr ? "سنوات خبرة" : "Years Exp."}
                </p>
              </div>
            )}
            {viewCount > 0 && (
              <div className="text-center px-7 py-4 rounded-2xl backdrop-blur-sm" style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.05)" }}>
                <p className="text-2xl font-bold tabular-nums" style={{ color: "#fff" }}>
                  <AnimatedNumber value={viewCount} />
                </p>
                <p className="text-[10px] uppercase tracking-[0.15em] mt-1.5 font-medium" style={{ color: "rgba(255,255,255,0.3)" }}>
                  {isAr ? "مشاهدات" : "Views"}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Bio */}
        {extra.show_bio && bio && (
          <div className={`mb-8 transition-all duration-700 delay-350 ${animated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
            <div className="rounded-2xl px-5 py-4 backdrop-blur-sm" style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <p className={`leading-relaxed text-center ${fontSize.bio}`} style={{ color: "rgba(255,255,255,0.65)" }}>
                {bio}
              </p>
            </div>
          </div>
        )}

        {/* Awards */}
        {extra.show_awards && globalAwards && Array.isArray(globalAwards) && globalAwards.length > 0 && (
          <div className={`mb-8 transition-all duration-700 delay-400 ${animated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
            <div className="rounded-2xl p-5 backdrop-blur-sm" style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <h3 className="text-[10px] font-semibold uppercase tracking-[0.2em] mb-4 flex items-center gap-2" style={{ color: accentColor }}>
                <Award className="h-3.5 w-3.5" />
                {isAr ? "الجوائز والإنجازات" : "Awards & Achievements"}
              </h3>
              <div className="space-y-2">
                {globalAwards.map((award: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 hover:translate-x-1"
                    style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                    <span className="text-lg">
                      {award.icon === "gold" ? "🏅" : award.icon === "tabakh" ? "👨‍🍳" : "🏆"}
                    </span>
                    <span className="flex-1 text-sm font-medium" style={{ color: "rgba(255,255,255,0.75)" }}>
                      {isAr ? (award.name_ar || award.name) : (award.name || award.name_ar)}
                    </span>
                    {award.year && <span className="text-xs font-medium tabular-nums" style={{ color: "rgba(255,255,255,0.25)" }}>{award.year}</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Social Icons */}
        {page?.show_social_icons !== false && (socialPlatforms.length > 0 || whatsapp || phone) && (
          <div className={`mb-8 transition-all duration-700 delay-450 ${animated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
            <h3 className="text-[10px] font-semibold uppercase tracking-[0.2em] mb-4 text-center" style={{ color: "rgba(255,255,255,0.25)" }}>
              {isAr ? "تابعني" : "Follow Me"}
            </h3>
            <div className="flex justify-center flex-wrap gap-3">
              {socialPlatforms.map(({ key, value }, index) => {
                const info = SOCIAL_ICONS[key];
                if (!info) return null;
                const Icon = info.icon;
                const href = value?.startsWith("http") ? value : (info.urlPrefix ? `${info.urlPrefix}${value}` : `https://${value}`);
                return (
                  <a
                    key={key}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative flex h-12 w-12 items-center justify-center rounded-full transition-all duration-300 hover:scale-110 active:scale-95"
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      color: "#ffffff",
                      transitionDelay: `${index * 50}ms`,
                    }}
                    title={info.label}
                  >
                    <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: info.hoverBg }} />
                    <Icon className="h-5 w-5 relative z-10" />
                  </a>
                );
              })}
              {whatsapp && (
                <a
                  href={`https://wa.me/${whatsapp.replace(/[^0-9+]/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative flex h-12 w-12 items-center justify-center rounded-full transition-all duration-300 hover:scale-110 active:scale-95"
                  style={{ background: "rgba(37,211,102,0.1)", border: "1px solid rgba(37,211,102,0.2)", color: "#25d366" }}
                  title="WhatsApp"
                >
                  <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: "rgba(37,211,102,0.15)" }} />
                  <MessageCircle className="h-5 w-5 relative z-10" />
                </a>
              )}
              {phone && (
                <a
                  href={`tel:${phone}`}
                  className="group relative flex h-12 w-12 items-center justify-center rounded-full transition-all duration-300 hover:scale-110 active:scale-95"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#ffffff" }}
                  title={isAr ? "اتصل" : "Call"}
                >
                  <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: "rgba(255,255,255,0.08)" }} />
                  <Phone className="h-5 w-5 relative z-10" />
                </a>
              )}
            </div>
          </div>
        )}

        {/* Link Items */}
        {items.length > 0 && (
          <div className={`space-y-3 mb-8 transition-all duration-700 delay-500 ${animated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
            <h3 className="text-[10px] font-semibold uppercase tracking-[0.2em] mb-4 text-center" style={{ color: "rgba(255,255,255,0.25)" }}>
              {isAr ? "الروابط" : "Links"}
            </h3>
            {items.map((item, index) => (
              <a
                key={item.id}
                href={item.url.startsWith("http") ? item.url : `https://${item.url}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => handleLinkClick(item.id)}
                className={`group relative flex items-center gap-3 px-5 py-4 ${btnStyle} backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] overflow-hidden`}
                style={{
                  background: buttonColorStyle.backgroundColor || "rgba(255,255,255,0.04)",
                  border: `1px solid ${buttonColorStyle.backgroundColor ? "transparent" : "rgba(255,255,255,0.08)"}`,
                  color: buttonColorStyle.color || "#ffffff",
                  animationDelay: `${index * 80}ms`,
                }}
              >
                {/* Hover shine effect */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{
                  background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.03) 50%, transparent 100%)"
                }} />

                {item.thumbnail_url && (
                  <img src={item.thumbnail_url} alt="" className="h-10 w-10 rounded-lg object-cover shrink-0 relative z-10" loading="lazy" />
                )}
                {item.icon && !item.thumbnail_url && (
                  <span className="text-xl shrink-0 relative z-10">{item.icon}</span>
                )}
                <span className={`flex-1 font-medium text-center relative z-10 ${fontSize.link}`}>
                  {isAr ? (item.title_ar || item.title) : item.title}
                </span>
                <ExternalLink className="h-4 w-4 opacity-20 group-hover:opacity-60 transition-opacity shrink-0 relative z-10" />
              </a>
            ))}
          </div>
        )}

        {/* Empty state */}
        {items.length === 0 && socialPlatforms.length === 0 && (
          <div className={`text-center py-10 mb-6 rounded-2xl transition-all duration-700 delay-400 ${animated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
            style={{ background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.03)" }}>
            <Link2 className="h-8 w-8 mx-auto mb-3" style={{ color: "rgba(255,255,255,0.1)" }} />
            <p className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.2)" }}>
              {isAr ? "لا توجد روابط بعد" : "No links yet"}
            </p>
          </div>
        )}

        {/* View Full Profile */}
        {extra.show_full_profile_btn && (
          <div className={`mt-4 transition-all duration-700 delay-550 ${animated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            <Link
              to={`/${profile.username}`}
              className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl text-sm font-semibold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: `linear-gradient(135deg, ${accentLight}, rgba(196,162,101,0.06))`,
                border: `1px solid ${accentMedium}`,
                color: accentColor,
              }}
            >
              <User className="h-4 w-4" />
              {isAr ? "عرض البروفايل الكامل" : "View Full Profile"}
            </Link>
          </div>
        )}

        {/* Owner Edit Banner */}
        {isOwner && (
          <div className={`mt-6 transition-all duration-700 delay-600 ${animated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            <Link
              to="/social-links"
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl text-sm font-semibold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#ffffff",
              }}
            >
              <Pencil className="h-4 w-4" />
              {isAr ? "تعديل ونشر الصفحة" : "Edit & Publish Page"}
            </Link>
          </div>
        )}

        {/* Login CTA */}
        {!user && (
          <div className={`mt-6 transition-all duration-700 delay-600 ${animated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            <Link
              to="/auth"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl text-xs font-medium transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.05)",
                color: "rgba(255,255,255,0.35)",
              }}
            >
              <LogIn className="h-3.5 w-3.5" />
              {isAr ? "أنشئ صفحتك الخاصة" : "Create your own page"}
            </Link>
          </div>
        )}

        {/* Footer */}
        <div className={`mt-14 text-center transition-all duration-700 delay-700 ${animated ? "opacity-100" : "opacity-0"}`}>
          <Link to="/" className="inline-flex items-center gap-2 transition-opacity hover:opacity-60" style={{ color: "rgba(255,255,255,0.1)" }}>
            <div className="h-5 w-5 rounded-md flex items-center justify-center" style={{ background: accentLight }}>
              <span className="text-[9px] font-bold" style={{ color: accentColor }}>A</span>
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em]">Altoha</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
