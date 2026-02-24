import { useParams } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { useSocialLinkPageByUsername } from "@/hooks/useSocialLinkPage";
import { SEOHead } from "@/components/SEOHead";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, Instagram, Twitter, Facebook, Linkedin, Youtube, Globe, User, ArrowLeft, Share2, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const SOCIAL_ICONS: Record<string, { icon: typeof Instagram; label: string; color: string }> = {
  instagram: { icon: Instagram, label: "Instagram", color: "#E4405F" },
  twitter: { icon: Twitter, label: "X / Twitter", color: "#1DA1F2" },
  facebook: { icon: Facebook, label: "Facebook", color: "#1877F2" },
  linkedin: { icon: Linkedin, label: "LinkedIn", color: "#0A66C2" },
  youtube: { icon: Youtube, label: "YouTube", color: "#FF0000" },
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

  const copyLink = async () => {
    await navigator.clipboard.writeText(`https://altoha.com/${username}/links`);
    setCopied(true);
    toast({ title: isAr ? "تم نسخ الرابط" : "Link copied!" });
    setTimeout(() => setCopied(false), 2000);
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

  const bio = isAr ? (page?.bio_ar || page?.bio) : (page?.bio || page?.bio_ar);
  const title = isAr ? (page?.page_title_ar || page?.page_title || displayName) : (page?.page_title || page?.page_title_ar || displayName);

  const socialPlatforms = [
    { key: "instagram", value: profile.instagram },
    { key: "twitter", value: profile.twitter },
    { key: "facebook", value: profile.facebook },
    { key: "linkedin", value: profile.linkedin },
    { key: "youtube", value: profile.youtube },
    { key: "website", value: profile.website },
  ].filter(s => s.value);

  const buttonColorStyle = page?.button_color && page.button_color !== "#000000"
    ? { backgroundColor: page.button_color, color: page.text_color || "#ffffff" }
    : {};

  const hasCustomBg = page?.background_image_url;

  return (
    <div
      className={`flex min-h-screen flex-col items-center ${!hasCustomBg ? theme.bg : ""} ${theme.text} transition-colors`}
      dir={isAr ? "rtl" : "ltr"}
      style={hasCustomBg ? {
        backgroundImage: `url(${page.background_image_url})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      } : undefined}
    >
      <SEOHead
        title={`${title} - Altoha Links`}
        description={bio || `${displayName}'s links on Altoha`}
      />

      {hasCustomBg && <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px]" />}

      <div className="relative z-10 w-full max-w-lg px-4 py-8 sm:py-12">
        {/* Share button */}
        <div className="flex justify-end mb-4">
          <Button
            variant="ghost"
            size="icon"
            className={`h-9 w-9 rounded-full ${hasCustomBg || themeName !== "default" ? "text-white/80 hover:text-white hover:bg-white/10" : "text-muted-foreground hover:text-foreground"}`}
            onClick={copyLink}
          >
            {copied ? <Copy className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
          </Button>
        </div>

        {/* Avatar & Name */}
        <div className="flex flex-col items-center gap-3 mb-8">
          {(page?.show_avatar !== false) && (
            <Avatar className="h-24 w-24 ring-4 ring-white/20 shadow-2xl">
              <AvatarImage src={profile.avatar_url || ""} alt={displayName} />
              <AvatarFallback className="text-2xl font-bold bg-primary/20">{displayName?.charAt(0)}</AvatarFallback>
            </Avatar>
          )}
          <div className="text-center">
            <h1 className="text-xl font-bold">{title}</h1>
            <p className="text-sm opacity-70 mt-0.5">@{profile.username}</p>
            {bio && <p className="text-sm opacity-80 mt-2 max-w-xs mx-auto leading-relaxed">{bio}</p>}
          </div>
        </div>

        {/* Social Icons */}
        {page?.show_social_icons !== false && socialPlatforms.length > 0 && (
          <div className="flex justify-center gap-3 mb-8">
            {socialPlatforms.map(({ key, value }) => {
              const info = SOCIAL_ICONS[key];
              if (!info) return null;
              const Icon = info.icon;
              const href = value?.startsWith("http") ? value : `https://${value}`;
              return (
                <a
                  key={key}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex h-11 w-11 items-center justify-center rounded-full ${theme.card} border transition-all hover:scale-110 hover:shadow-lg`}
                  title={info.label}
                >
                  <Icon className="h-5 w-5" />
                </a>
              );
            })}
          </div>
        )}

        {/* Link Items */}
        <div className="space-y-3">
          {items.map((item) => (
            <a
              key={item.id}
              href={item.url.startsWith("http") ? item.url : `https://${item.url}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`group flex items-center gap-3 border px-5 py-4 ${btnStyle} ${theme.card} transition-all duration-300 hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]`}
              style={buttonColorStyle}
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

        {items.length === 0 && socialPlatforms.length === 0 && (
          <div className="text-center py-12 opacity-60">
            <Globe className="h-12 w-12 mx-auto mb-3 opacity-40" />
            <p className="text-sm">{isAr ? "لا توجد روابط بعد" : "No links yet"}</p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center">
          <Link to={`/${profile.username}`} className="text-xs opacity-50 hover:opacity-80 transition-opacity">
            {isAr ? "عرض البروفايل الكامل" : "View full profile"} →
          </Link>
          <div className="mt-3">
            <Link to="/" className="text-[10px] opacity-30 hover:opacity-50 transition-opacity font-medium tracking-wider uppercase">
              Altoha
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
