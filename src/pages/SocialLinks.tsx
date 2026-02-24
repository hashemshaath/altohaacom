import { useParams } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { useSocialLinkPageByUsername } from "@/hooks/useSocialLinkPage";
import { SEOHead } from "@/components/SEOHead";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, Instagram, Twitter, Facebook, Linkedin, Youtube, Globe, User, ArrowLeft, Share2, Copy, Check, BadgeCheck, MapPin, Briefcase, Award, Clock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const SOCIAL_ICONS: Record<string, { icon: typeof Instagram; label: string; color: string; urlPrefix?: string }> = {
  instagram: { icon: Instagram, label: "Instagram", color: "#E4405F", urlPrefix: "https://instagram.com/" },
  twitter: { icon: Twitter, label: "X / Twitter", color: "#1DA1F2", urlPrefix: "https://x.com/" },
  facebook: { icon: Facebook, label: "Facebook", color: "#1877F2", urlPrefix: "https://facebook.com/" },
  linkedin: { icon: Linkedin, label: "LinkedIn", color: "#0A66C2", urlPrefix: "https://linkedin.com/in/" },
  youtube: { icon: Youtube, label: "YouTube", color: "#FF0000", urlPrefix: "https://youtube.com/@" },
  tiktok: { icon: Globe, label: "TikTok", color: "#000000", urlPrefix: "https://tiktok.com/@" },
  snapchat: { icon: Globe, label: "Snapchat", color: "#FFFC00", urlPrefix: "https://snapchat.com/add/" },
  website: { icon: Globe, label: "Website", color: "#6366f1" },
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

  return (
    <div
      className={`flex min-h-screen flex-col items-center ${!coverImage ? theme.bg : ""} ${theme.text} transition-colors`}
      dir={isAr ? "rtl" : "ltr"}
      style={coverImage ? {
        backgroundImage: `url(${coverImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      } : undefined}
    >
      <SEOHead
        title={`${title} - Altoha Links`}
        description={bio || `${displayName}'s links on Altoha`}
      />

      {coverImage && <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />}

      <div className="relative z-10 w-full max-w-lg px-4 py-8 sm:py-12">
        {/* Share button */}
        <div className={`flex justify-end mb-4 transition-all duration-700 ${animated ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"}`}>
          <Button
            variant="ghost"
            size="icon"
            className={`h-9 w-9 rounded-full ${coverImage || themeName !== "default" ? "text-white/80 hover:text-white hover:bg-white/10" : "text-muted-foreground hover:text-foreground"}`}
            onClick={shareNative}
          >
            {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
          </Button>
        </div>

        {/* Avatar & Name */}
        <div className={`flex flex-col items-center gap-3 mb-6 transition-all duration-700 delay-100 ${animated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
          {(page?.show_avatar !== false) && (
            <div className="relative">
              <Avatar className="h-28 w-28 sm:h-32 sm:w-32 ring-4 ring-white/20 shadow-2xl">
                <AvatarImage src={profile.avatar_url || ""} alt={displayName} />
                <AvatarFallback className="text-2xl font-bold bg-primary/20">{displayName?.charAt(0)}</AvatarFallback>
              </Avatar>
              {isVerified && (
                <div className="absolute -bottom-1 -end-1 h-7 w-7 rounded-full bg-primary flex items-center justify-center ring-2 ring-background shadow-lg">
                  <BadgeCheck className="h-4 w-4 text-primary-foreground" />
                </div>
              )}
            </div>
          )}
          <div className="text-center">
            <h1 className="text-xl sm:text-2xl font-bold">{title}</h1>
            <p className="text-sm opacity-70 mt-0.5">@{profile.username}</p>
            {(jobTitle || specialization) && (
              <p className="text-sm opacity-80 mt-1 flex items-center justify-center gap-1.5">
                <Briefcase className="h-3.5 w-3.5 opacity-60" />
                {jobTitle || specialization}
              </p>
            )}
            {(city || countryCode) && (
              <p className="text-sm opacity-70 mt-1 flex items-center justify-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 opacity-60" />
                {city}{city && countryCode ? ", " : ""}{countryCode}
              </p>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        {(yearsExp || viewCount || membershipTier) && (
          <div className={`flex justify-center gap-4 sm:gap-6 mb-6 transition-all duration-700 delay-150 ${animated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
            {yearsExp && (
              <div className="text-center">
                <p className="text-lg font-bold">{yearsExp}+</p>
                <p className="text-[11px] opacity-60 uppercase tracking-wider">{isAr ? "سنوات خبرة" : "Years Exp."}</p>
              </div>
            )}
            {viewCount > 0 && (
              <div className="text-center">
                <p className="text-lg font-bold">{viewCount}</p>
                <p className="text-[11px] opacity-60 uppercase tracking-wider">{isAr ? "مشاهدات" : "Views"}</p>
              </div>
            )}
            {membershipTier && membershipTier !== "free" && (
              <div className="text-center">
                <span className="inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 capitalize">
                  {membershipTier}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Bio */}
        {bio && (
          <div className={`mb-6 transition-all duration-700 delay-200 ${animated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
            <div className={`${theme.card} border rounded-2xl p-4`}>
              <p className="text-sm leading-relaxed opacity-90 text-center">{bio}</p>
            </div>
          </div>
        )}

        {/* Global Awards */}
        {globalAwards && Array.isArray(globalAwards) && globalAwards.length > 0 && (
          <div className={`mb-6 transition-all duration-700 delay-250 ${animated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
            <div className={`${theme.card} border rounded-2xl p-4`}>
              <h3 className="text-xs font-semibold uppercase tracking-wider opacity-60 mb-3 flex items-center gap-1.5">
                <Award className="h-3.5 w-3.5" />
                {isAr ? "الجوائز والإنجازات" : "Awards & Achievements"}
              </h3>
              <div className="flex flex-wrap gap-2">
                {globalAwards.map((award: any, i: number) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/10 text-xs">
                    {award.icon === "gold" && <span>🏅</span>}
                    {award.icon === "tabakh" && <span>👨‍🍳</span>}
                    {award.icon && !["gold", "tabakh"].includes(award.icon) && <span>🏆</span>}
                    <span>{isAr ? (award.name_ar || award.name) : (award.name || award.name_ar)}</span>
                    {award.year && <span className="opacity-50">({award.year})</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Social Icons */}
        {page?.show_social_icons !== false && socialPlatforms.length > 0 && (
          <div className={`flex justify-center flex-wrap gap-3 mb-6 transition-all duration-700 delay-300 ${animated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
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
                  className={`flex h-12 w-12 items-center justify-center rounded-full ${theme.card} border transition-all duration-300 hover:scale-110 hover:shadow-lg active:scale-95`}
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
          <div className="space-y-3 mb-6">
            {items.map((item, index) => (
              <a
                key={item.id}
                href={item.url.startsWith("http") ? item.url : `https://${item.url}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => handleLinkClick(item.id)}
                className={`group flex items-center gap-3 border px-5 py-4 ${btnStyle} ${theme.card} transition-all duration-500 hover:scale-[1.02] hover:shadow-xl active:scale-[0.98] ${animated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
                style={{
                  ...buttonColorStyle,
                  transitionDelay: `${400 + index * 80}ms`,
                }}
              >
                {item.thumbnail_url && (
                  <img src={item.thumbnail_url} alt="" className="h-10 w-10 rounded-lg object-cover shrink-0" />
                )}
                {item.icon && !item.thumbnail_url && (
                  <span className="text-xl shrink-0">{item.icon}</span>
                )}
                <span className="flex-1 text-sm font-medium text-center">
                  {isAr ? (item.title_ar || item.title) : item.title}
                </span>
                <ExternalLink className="h-4 w-4 opacity-0 group-hover:opacity-60 transition-opacity shrink-0" />
              </a>
            ))}
          </div>
        )}

        {items.length === 0 && socialPlatforms.length === 0 && (
          <div className={`text-center py-12 opacity-60 transition-all duration-700 delay-300 ${animated ? "opacity-60 translate-y-0" : "opacity-0 translate-y-6"}`}>
            <Globe className="h-12 w-12 mx-auto mb-3 opacity-40" />
            <p className="text-sm">{isAr ? "لا توجد روابط بعد" : "No links yet"}</p>
          </div>
        )}

        {/* View Full Profile Link */}
        <div className={`mt-8 transition-all duration-700 delay-500 ${animated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          <Link
            to={`/${profile.username}`}
            className={`flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl ${theme.card} border text-sm font-medium transition-all hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]`}
          >
            <User className="h-4 w-4 opacity-70" />
            {isAr ? "عرض البروفايل الكامل" : "View Full Profile"}
          </Link>
        </div>

        {/* Footer */}
        <div className={`mt-8 text-center transition-all duration-700 delay-600 ${animated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          <Link to="/" className="inline-flex items-center gap-1.5 text-[10px] opacity-30 hover:opacity-50 transition-opacity font-medium tracking-wider uppercase">
            <div className="h-4 w-4 rounded bg-primary/30 flex items-center justify-center">
              <span className="text-[8px] font-bold">A</span>
            </div>
            Altoha
          </Link>
        </div>
      </div>
    </div>
  );
}
