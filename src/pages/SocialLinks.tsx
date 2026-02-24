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

const THEMES: Record<string, { bg: string; card: string; text: string; accent: string }> = {
  default: { bg: "bg-gradient-to-br from-background via-background to-muted/30", card: "bg-card/90 backdrop-blur-xl border-border/30", text: "text-foreground", accent: "bg-primary" },
  dark: { bg: "bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950", card: "bg-white/5 backdrop-blur-xl border-white/10", text: "text-white", accent: "bg-white" },
  ocean: { bg: "bg-gradient-to-br from-blue-950 via-cyan-900 to-teal-950", card: "bg-white/10 backdrop-blur-xl border-white/15", text: "text-white", accent: "bg-cyan-400" },
  sunset: { bg: "bg-gradient-to-br from-orange-950 via-rose-900 to-purple-950", card: "bg-white/10 backdrop-blur-xl border-white/15", text: "text-white", accent: "bg-orange-400" },
  forest: { bg: "bg-gradient-to-br from-green-950 via-emerald-900 to-teal-950", card: "bg-white/10 backdrop-blur-xl border-white/15", text: "text-white", accent: "bg-emerald-400" },
  minimal: { bg: "bg-white dark:bg-gray-950", card: "bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800", text: "text-gray-900 dark:text-gray-100", accent: "bg-gray-900 dark:bg-white" },
  candy: { bg: "bg-gradient-to-br from-pink-400 via-purple-400 to-indigo-500", card: "bg-white/20 backdrop-blur-xl border-white/25", text: "text-white", accent: "bg-white" },
  gold: { bg: "bg-gradient-to-br from-yellow-900 via-amber-800 to-yellow-950", card: "bg-white/10 backdrop-blur-xl border-yellow-500/20", text: "text-amber-50", accent: "bg-amber-400" },
};

const BUTTON_STYLES: Record<string, string> = {
  rounded: "rounded-2xl",
  pill: "rounded-full",
  square: "rounded-lg",
  sharp: "rounded-none",
  outline: "rounded-2xl border-2 bg-transparent",
};

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
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="w-full max-w-md space-y-4 p-6">
          <div className="flex flex-col items-center gap-3">
            <Skeleton className="h-24 w-24 rounded-full" />
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-56" />
          </div>
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-14 w-full rounded-2xl" />)}
        </div>
      </div>
    );
  }

  if (error || !data?.profile) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-4">
        <div className="rounded-2xl bg-muted/60 p-5"><User className="h-10 w-10 text-muted-foreground/40" /></div>
        <h1 className="font-serif text-xl font-bold">{isAr ? "الصفحة غير موجودة" : "Page not found"}</h1>
        <p className="text-sm text-muted-foreground max-w-xs text-center">
          {isAr ? "هذه الصفحة غير موجودة أو لم يتم إنشاؤها بعد" : "This page doesn't exist or hasn't been created yet"}
        </p>
        <Button asChild variant="outline" size="sm">
          <Link to="/"><ArrowLeft className="me-1.5 h-3.5 w-3.5" />{isAr ? "الرئيسية" : "Go Home"}</Link>
        </Button>
      </div>
    );
  }

  const { profile, page, items } = data;
  const themeName = page?.theme || "default";
  const theme = THEMES[themeName] || THEMES.default;
  const btnStyle = BUTTON_STYLES[page?.button_style || "rounded"] || BUTTON_STYLES.rounded;

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

  return (
    <div
      className="flex min-h-screen flex-col items-center bg-[#0a0a0a] text-white"
      dir={isAr ? "rtl" : "ltr"}
    >
      <SEOHead
        title={`${title} - Altoha Links`}
        description={bio || `${displayName}'s links on Altoha`}
      />

      {/* Cover / Hero Section */}
      <div className="relative w-full h-[280px] sm:h-[320px] overflow-hidden">
        {hasCover ? (
          <>
            <img
              src={coverImage}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/10 to-[#0a0a0a]" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-b from-primary/20 via-primary/5 to-[#0a0a0a]" />
        )}

        {/* Share button in top corner */}
        <div className={`absolute top-4 ${isAr ? "left-4" : "right-4"} z-20 transition-all duration-700 ${animated ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"}`}>
          <button
            onClick={shareNative}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white/80 hover:text-white hover:bg-black/60 transition-all"
          >
            {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
          </button>
        </div>

        {/* Avatar positioned at bottom of cover */}
        <div className={`absolute -bottom-14 left-1/2 -translate-x-1/2 z-20 transition-all duration-700 delay-100 ${animated ? "opacity-100 scale-100" : "opacity-0 scale-90"}`}>
          {(page?.show_avatar !== false) && (
            <div className="relative">
              <Avatar className="h-28 w-28 sm:h-32 sm:w-32 ring-[3px] ring-[#0a0a0a] shadow-2xl">
                <AvatarImage src={profile.avatar_url || ""} alt={displayName} className="object-cover" />
                <AvatarFallback className="text-3xl font-bold bg-primary/30 text-white">{displayName?.charAt(0)}</AvatarFallback>
              </Avatar>
              {isVerified && (
                <div className="absolute -bottom-0.5 -end-0.5 h-7 w-7 rounded-full bg-primary flex items-center justify-center ring-2 ring-[#0a0a0a] shadow-lg">
                  <BadgeCheck className="h-4 w-4 text-primary-foreground" />
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
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white tracking-tight">{title}</h1>
          <p className="text-sm text-white/50 mt-1">@{profile.username}</p>

          {/* Job title / specialization & location in a refined row */}
          <div className="flex items-center justify-center flex-wrap gap-x-4 gap-y-1 mt-2.5">
            {(jobTitle || specialization) && (
              <span className="text-sm text-white/70 flex items-center gap-1.5">
                <Briefcase className="h-3.5 w-3.5 text-primary/80" />
                {jobTitle || specialization}
              </span>
            )}
            {(city || countryCode) && (
              <span className="text-sm text-white/70 flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-primary/80" />
                {city}{city && countryCode ? ", " : ""}{countryCode}
              </span>
            )}
          </div>

          {/* Membership badge */}
          {membershipTier && membershipTier !== "free" && (
            <div className="mt-3">
              <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full bg-primary/15 text-primary border border-primary/20 capitalize">
                ✦ {membershipTier}
              </span>
            </div>
          )}
        </div>

        {/* Stats Row */}
        {(yearsExp || viewCount) && (
          <div className={`flex justify-center gap-8 mb-6 transition-all duration-700 delay-250 ${animated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
            {yearsExp && (
              <div className="text-center">
                <p className="text-xl font-bold text-white">{yearsExp}<span className="text-primary">+</span></p>
                <p className="text-[10px] text-white/40 uppercase tracking-widest mt-0.5">{isAr ? "سنوات خبرة" : "Years Exp."}</p>
              </div>
            )}
            {viewCount > 0 && (
              <div className="text-center">
                <p className="text-xl font-bold text-white">{viewCount}</p>
                <p className="text-[10px] text-white/40 uppercase tracking-widest mt-0.5">{isAr ? "مشاهدات" : "Views"}</p>
              </div>
            )}
          </div>
        )}

        {/* Separator */}
        <div className={`w-12 h-px bg-white/10 mx-auto mb-6 transition-all duration-700 delay-300 ${animated ? "opacity-100 w-12" : "opacity-0 w-0"}`} />

        {/* Bio */}
        {bio && (
          <div className={`mb-6 transition-all duration-700 delay-300 ${animated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
            <p className="text-sm text-white/75 leading-relaxed text-center max-w-md mx-auto">{bio}</p>
          </div>
        )}

        {/* Awards */}
        {globalAwards && Array.isArray(globalAwards) && globalAwards.length > 0 && (
          <div className={`mb-6 transition-all duration-700 delay-350 ${animated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
            <div className="rounded-2xl bg-white/[0.04] border border-white/[0.08] p-4">
              <h3 className="text-[10px] font-semibold uppercase tracking-widest text-white/40 mb-3 flex items-center gap-1.5">
                <Award className="h-3.5 w-3.5 text-primary/70" />
                {isAr ? "الجوائز والإنجازات" : "Awards & Achievements"}
              </h3>
              <div className="flex flex-wrap gap-2">
                {globalAwards.map((award: any, i: number) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.06] border border-white/[0.06] text-xs text-white/80">
                    {award.icon === "gold" && <span>🏅</span>}
                    {award.icon === "tabakh" && <span>👨‍🍳</span>}
                    {award.icon && !["gold", "tabakh"].includes(award.icon) && <span>🏆</span>}
                    <span>{isAr ? (award.name_ar || award.name) : (award.name || award.name_ar)}</span>
                    {award.year && <span className="text-white/30">({award.year})</span>}
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
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.06] border border-white/[0.08] text-white/70 hover:text-white hover:bg-white/[0.12] hover:border-white/[0.15] transition-all duration-300 hover:scale-110 active:scale-95"
                  title={info.label}
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
                className={`group flex items-center gap-3 border border-white/[0.08] px-5 py-4 ${btnStyle} bg-white/[0.04] backdrop-blur-sm transition-all duration-500 hover:bg-white/[0.08] hover:border-white/[0.15] hover:scale-[1.02] hover:shadow-xl active:scale-[0.98] ${animated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
                style={{
                  ...buttonColorStyle,
                  transitionDelay: `${500 + index * 80}ms`,
                }}
              >
                {item.thumbnail_url && (
                  <img src={item.thumbnail_url} alt="" className="h-10 w-10 rounded-lg object-cover shrink-0" />
                )}
                {item.icon && !item.thumbnail_url && (
                  <span className="text-xl shrink-0">{item.icon}</span>
                )}
                <span className="flex-1 text-sm font-medium text-center text-white/90">
                  {isAr ? (item.title_ar || item.title) : item.title}
                </span>
                <ExternalLink className="h-4 w-4 opacity-0 group-hover:opacity-50 transition-opacity shrink-0 text-white/60" />
              </a>
            ))}
          </div>
        )}

        {items.length === 0 && socialPlatforms.length === 0 && (
          <div className={`text-center py-10 transition-all duration-700 delay-400 ${animated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
            <Globe className="h-10 w-10 mx-auto mb-3 text-white/20" />
            <p className="text-sm text-white/40">{isAr ? "لا توجد روابط بعد" : "No links yet"}</p>
          </div>
        )}

        {/* View Full Profile */}
        <div className={`mt-2 transition-all duration-700 delay-500 ${animated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          <Link
            to={`/${profile.username}`}
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-primary/10 border border-primary/20 text-sm font-medium text-primary hover:bg-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <User className="h-4 w-4" />
            {isAr ? "عرض البروفايل الكامل" : "View Full Profile"}
          </Link>
        </div>

        {/* Footer */}
        <div className={`mt-10 text-center transition-all duration-700 delay-600 ${animated ? "opacity-100" : "opacity-0"}`}>
          <Link to="/" className="inline-flex items-center gap-1.5 text-[10px] text-white/20 hover:text-white/40 transition-opacity font-medium tracking-wider uppercase">
            <div className="h-4 w-4 rounded bg-primary/20 flex items-center justify-center">
              <span className="text-[8px] font-bold text-primary/60">A</span>
            </div>
            Altoha
          </Link>
        </div>
      </div>
    </div>
  );
}
