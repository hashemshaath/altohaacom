import { useParams } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { useSocialLinkPageByUsername } from "@/hooks/useSocialLinkPage";
import { SEOHead } from "@/components/SEOHead";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, Instagram, Twitter, Facebook, Linkedin, Youtube, Globe, User, ArrowLeft, Share2, Check, BadgeCheck, MapPin, Briefcase, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const SOCIAL_ICONS: Record<string, { icon: typeof Instagram; label: string; urlPrefix?: string }> = {
  instagram: { icon: Instagram, label: "Instagram", urlPrefix: "https://instagram.com/" },
  twitter: { icon: Twitter, label: "X / Twitter", urlPrefix: "https://x.com/" },
  facebook: { icon: Facebook, label: "Facebook", urlPrefix: "https://facebook.com/" },
  linkedin: { icon: Linkedin, label: "LinkedIn", urlPrefix: "https://linkedin.com/in/" },
  youtube: { icon: Youtube, label: "YouTube", urlPrefix: "https://youtube.com/@" },
  tiktok: { icon: Globe, label: "TikTok", urlPrefix: "https://tiktok.com/@" },
  snapchat: { icon: Globe, label: "Snapchat", urlPrefix: "https://snapchat.com/add/" },
  website: { icon: Globe, label: "Website" },
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

export default function SocialLinks() {
  const { username } = useParams<{ username: string }>();
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { toast } = useToast();
  const { data, isLoading, error } = useSocialLinkPageByUsername(username);
  const [copied, setCopied] = useState(false);
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleLinkClick = async (itemId: string) => {
    try {
      await supabase.from("social_link_items").update({ click_count: (data?.items.find(i => i.id === itemId)?.click_count || 0) + 1 }).eq("id", itemId);
    } catch {}
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(`https://altoha.com/${username}/links`);
    setCopied(true);
    toast({ title: isAr ? "تم نسخ الرابط" : "Link copied!" });
    setTimeout(() => setCopied(false), 2000);
  };

  const shareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: `${username} - Altoha`, url: `https://altoha.com/${username}/links` });
      } catch {}
    } else {
      copyLink();
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: "linear-gradient(135deg, #0f0f0f 0%, #1a1a2e 50%, #0f0f0f 100%)" }}>
        <div className="w-full max-w-md space-y-4 p-6">
          <div className="flex flex-col items-center gap-3">
            <Skeleton className="h-24 w-24 rounded-full bg-white/10" />
            <Skeleton className="h-6 w-40 bg-white/10" />
            <Skeleton className="h-4 w-56 bg-white/10" />
          </div>
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-14 w-full rounded-2xl bg-white/10" />)}
        </div>
      </div>
    );
  }

  if (error || !data?.profile) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4" style={{ background: "linear-gradient(135deg, #0f0f0f 0%, #1a1a2e 50%, #0f0f0f 100%)" }}>
        <div className="rounded-2xl bg-white/5 p-5 border border-white/10"><User className="h-10 w-10 text-white/30" /></div>
        <h1 className="font-serif text-xl font-bold text-white">{isAr ? "الصفحة غير موجودة" : "Page not found"}</h1>
        <p className="text-sm text-white/50 max-w-xs text-center">
          {isAr ? "هذه الصفحة غير موجودة أو لم يتم إنشاؤها بعد" : "This page doesn't exist or hasn't been created yet"}
        </p>
        <Button asChild variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10">
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

  // Google Fonts link for the chosen font
  const googleFontLink = page?.font_family && page.font_family !== "default"
    ? `https://fonts.googleapis.com/css2?family=${encodeURIComponent(page.font_family === "playfair" ? "Playfair Display" : page.font_family === "cairo" ? "Cairo" : page.font_family === "tajawal" ? "Tajawal" : page.font_family === "montserrat" ? "Montserrat" : page.font_family === "poppins" ? "Poppins" : page.font_family === "roboto" ? "Roboto" : "Inter")}:wght@300;400;500;600;700&display=swap`
    : null;

  return (
    <div
      className="flex min-h-screen flex-col items-center"
      dir={isAr ? "rtl" : "ltr"}
      style={{
        background: "linear-gradient(135deg, #0f0f0f 0%, #1a1a2e 50%, #0f0f0f 100%)",
        fontFamily,
        color: "#f0f0f0",
      }}
    >
      {googleFontLink && <link rel="stylesheet" href={googleFontLink} />}
      <SEOHead
        title={`${title} - Altoha Links`}
        description={bio || `${displayName}'s links on Altoha`}
      />

      {/* Cover / Hero Section */}
      <div className="relative w-full h-[260px] sm:h-[300px] overflow-hidden">
        {hasCover ? (
          <>
            <img src={coverImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(15,15,15,0.6) 60%, #0f0f0f 100%)" }} />
          </>
        ) : (
          <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(99,102,241,0.15) 0%, transparent 100%)" }} />
        )}

        {/* Share button */}
        <div className={`absolute top-4 ${isAr ? "left-4" : "right-4"} z-20 transition-all duration-700 ${animated ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"}`}>
          <button
            onClick={shareNative}
            className="flex h-10 w-10 items-center justify-center rounded-full backdrop-blur-md border transition-all"
            style={{ backgroundColor: "rgba(255,255,255,0.08)", borderColor: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.7)" }}
          >
            {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
          </button>
        </div>

        {/* Avatar */}
        <div className={`absolute -bottom-14 left-1/2 -translate-x-1/2 z-20 transition-all duration-700 delay-100 ${animated ? "opacity-100 scale-100" : "opacity-0 scale-90"}`}>
          {(page?.show_avatar !== false) && (
            <div className="relative">
              <Avatar className="h-28 w-28 sm:h-32 sm:w-32 shadow-2xl" style={{ boxShadow: "0 0 0 4px #0f0f0f, 0 8px 32px rgba(0,0,0,0.5)" }}>
                <AvatarImage src={profile.avatar_url || ""} alt={displayName} className="object-cover" />
                <AvatarFallback className="text-3xl font-bold" style={{ background: "rgba(99,102,241,0.2)", color: "#e0e0e0" }}>{displayName?.charAt(0)}</AvatarFallback>
              </Avatar>
              {isVerified && (
                <div className="absolute -bottom-0.5 -end-0.5 h-7 w-7 rounded-full flex items-center justify-center shadow-lg" style={{ background: "#6366f1", boxShadow: "0 0 0 3px #0f0f0f" }}>
                  <BadgeCheck className="h-4 w-4 text-white" />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-lg px-5 pt-16 pb-10">
        {/* Name & Meta */}
        <div className={`text-center mb-6 transition-all duration-700 delay-200 ${animated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
          <h1 className={`font-bold tracking-tight ${fontSize.name}`} style={{ color: "#ffffff" }}>{title}</h1>
          <p className="mt-1" style={{ fontSize: "13px", color: "rgba(255,255,255,0.4)" }}>@{profile.username}</p>

          {/* Job title / specialization & location */}
          {(extra.show_job_title || extra.show_location) && (
            <div className="flex items-center justify-center flex-wrap gap-x-4 gap-y-1 mt-3">
              {extra.show_job_title && (jobTitle || specialization) && (
                <span className={`flex items-center gap-1.5 ${fontSize.meta}`} style={{ color: "rgba(255,255,255,0.6)" }}>
                  <Briefcase className="h-3.5 w-3.5" style={{ color: "rgba(129,140,248,0.8)" }} />
                  {jobTitle || specialization}
                </span>
              )}
              {extra.show_location && (city || countryCode) && (
                <span className={`flex items-center gap-1.5 ${fontSize.meta}`} style={{ color: "rgba(255,255,255,0.6)" }}>
                  <MapPin className="h-3.5 w-3.5" style={{ color: "rgba(129,140,248,0.8)" }} />
                  {city}{city && countryCode ? ", " : ""}{countryCode}
                </span>
              )}
            </div>
          )}

          {/* Membership badge */}
          {extra.show_membership && membershipTier && membershipTier !== "free" && (
            <div className="mt-3">
              <span className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-full capitalize"
                style={{ background: "rgba(99,102,241,0.15)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,0.25)" }}>
                ✦ {membershipTier}
              </span>
            </div>
          )}
        </div>

        {/* Stats Row */}
        {extra.show_stats && (yearsExp || viewCount > 0) && (
          <div className={`flex justify-center gap-10 mb-6 transition-all duration-700 delay-250 ${animated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
            {yearsExp && (
              <div className="text-center">
                <p className="text-2xl font-bold" style={{ color: "#ffffff" }}>{yearsExp}<span style={{ color: "#818cf8" }}>+</span></p>
                <p className="text-[10px] uppercase tracking-widest mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>{isAr ? "سنوات خبرة" : "Years Exp."}</p>
              </div>
            )}
            {viewCount > 0 && (
              <div className="text-center">
                <p className="text-2xl font-bold" style={{ color: "#ffffff" }}>{viewCount.toLocaleString()}</p>
                <p className="text-[10px] uppercase tracking-widest mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>{isAr ? "مشاهدات" : "Views"}</p>
              </div>
            )}
          </div>
        )}

        {/* Separator */}
        <div className={`h-px mx-auto mb-6 transition-all duration-700 delay-300 ${animated ? "opacity-100 w-16" : "opacity-0 w-0"}`} style={{ background: "rgba(255,255,255,0.08)" }} />

        {/* Bio */}
        {extra.show_bio && bio && (
          <div className={`mb-6 transition-all duration-700 delay-300 ${animated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
            <p className={`leading-relaxed text-center max-w-md mx-auto ${fontSize.bio}`} style={{ color: "rgba(255,255,255,0.65)" }}>{bio}</p>
          </div>
        )}

        {/* Awards */}
        {extra.show_awards && globalAwards && Array.isArray(globalAwards) && globalAwards.length > 0 && (
          <div className={`mb-6 transition-all duration-700 delay-350 ${animated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
            <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <h3 className="text-[10px] font-semibold uppercase tracking-widest mb-3 flex items-center gap-1.5" style={{ color: "rgba(255,255,255,0.35)" }}>
                <Award className="h-3.5 w-3.5" style={{ color: "rgba(129,140,248,0.6)" }} />
                {isAr ? "الجوائز والإنجازات" : "Awards & Achievements"}
              </h3>
              <div className="flex flex-wrap gap-2">
                {globalAwards.map((award: any, i: number) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.75)" }}>
                    {award.icon === "gold" && <span>🏅</span>}
                    {award.icon === "tabakh" && <span>👨‍🍳</span>}
                    {award.icon && !["gold", "tabakh"].includes(award.icon) && <span>🏆</span>}
                    <span>{isAr ? (award.name_ar || award.name) : (award.name || award.name_ar)}</span>
                    {award.year && <span style={{ color: "rgba(255,255,255,0.25)" }}>({award.year})</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Social Icons */}
        {page?.show_social_icons !== false && socialPlatforms.length > 0 && (
          <div className={`flex justify-center flex-wrap gap-3 mb-8 transition-all duration-700 delay-400 ${animated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
            {socialPlatforms.map(({ key, value }) => {
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
                  className="flex h-12 w-12 items-center justify-center rounded-full transition-all duration-300 hover:scale-110 active:scale-95"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "rgba(255,255,255,0.65)",
                  }}
                  title={info.label}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.12)";
                    (e.currentTarget as HTMLElement).style.color = "#ffffff";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)";
                    (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.65)";
                  }}
                >
                  <Icon className="h-5 w-5" />
                </a>
              );
            })}
          </div>
        )}

        {/* Link Items */}
        {items.length > 0 && (
          <div className="space-y-3 mb-8">
            {items.map((item, index) => (
              <a
                key={item.id}
                href={item.url.startsWith("http") ? item.url : `https://${item.url}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => handleLinkClick(item.id)}
                className={`group flex items-center gap-3 px-5 py-4 ${btnStyle} backdrop-blur-sm transition-all duration-500 hover:scale-[1.02] hover:shadow-xl active:scale-[0.98] ${animated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
                style={{
                  background: buttonColorStyle.backgroundColor || "rgba(255,255,255,0.04)",
                  border: `1px solid ${buttonColorStyle.backgroundColor ? "transparent" : "rgba(255,255,255,0.08)"}`,
                  color: buttonColorStyle.color || "rgba(255,255,255,0.85)",
                  transitionDelay: `${500 + index * 80}ms`,
                }}
                onMouseEnter={e => {
                  if (!buttonColorStyle.backgroundColor) {
                    (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.08)";
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.15)";
                  }
                }}
                onMouseLeave={e => {
                  if (!buttonColorStyle.backgroundColor) {
                    (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)";
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)";
                  }
                }}
              >
                {item.thumbnail_url && (
                  <img src={item.thumbnail_url} alt="" className="h-10 w-10 rounded-lg object-cover shrink-0" />
                )}
                {item.icon && !item.thumbnail_url && (
                  <span className="text-xl shrink-0">{item.icon}</span>
                )}
                <span className={`flex-1 font-medium text-center ${fontSize.link}`}>
                  {isAr ? (item.title_ar || item.title) : item.title}
                </span>
                <ExternalLink className="h-4 w-4 opacity-0 group-hover:opacity-50 transition-opacity shrink-0" />
              </a>
            ))}
          </div>
        )}

        {items.length === 0 && socialPlatforms.length === 0 && (
          <div className={`text-center py-10 transition-all duration-700 delay-400 ${animated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
            <Globe className="h-10 w-10 mx-auto mb-3" style={{ color: "rgba(255,255,255,0.15)" }} />
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>{isAr ? "لا توجد روابط بعد" : "No links yet"}</p>
          </div>
        )}

        {/* View Full Profile */}
        {extra.show_full_profile_btn && (
          <div className={`mt-2 transition-all duration-700 delay-500 ${animated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            <Link
              to={`/${profile.username}`}
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl text-sm font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)", color: "#a5b4fc" }}
            >
              <User className="h-4 w-4" />
              {isAr ? "عرض البروفايل الكامل" : "View Full Profile"}
            </Link>
          </div>
        )}

        {/* Footer */}
        <div className={`mt-10 text-center transition-all duration-700 delay-600 ${animated ? "opacity-100" : "opacity-0"}`}>
          <Link to="/" className="inline-flex items-center gap-1.5 font-medium tracking-wider uppercase transition-opacity" style={{ fontSize: "10px", color: "rgba(255,255,255,0.15)" }}>
            <div className="h-4 w-4 rounded flex items-center justify-center" style={{ background: "rgba(99,102,241,0.15)" }}>
              <span className="text-[8px] font-bold" style={{ color: "rgba(99,102,241,0.5)" }}>A</span>
            </div>
            Altoha
          </Link>
        </div>
      </div>
    </div>
  );
}
