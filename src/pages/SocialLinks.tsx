import { useParams, useSearchParams, Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { useSocialLinkPageByUsername } from "@/hooks/useSocialLinkPage";
import { SEOHead } from "@/components/SEOHead";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ExternalLink, User, ArrowLeft, Share2, Check, BadgeCheck, MapPin, Briefcase,
  Pencil, LogIn, Phone, MessageCircle, UserPlus, UserCheck, Loader2,
  Lock, Globe, Link2,
} from "lucide-react";
import { BioCareerSections } from "@/components/public-profile/BioCareerSections";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { buildSocialLinksUrl } from "@/lib/publicAppUrl";
import { useFollowStats, useIsFollowing, useToggleFollow, usePendingFollowRequest } from "@/hooks/useFollow";
import { countryFlag } from "@/lib/countryFlag";
import { useCountries } from "@/hooks/useCountries";
import {
  THEME_COLORS, BUTTON_STYLES_MAP, FONT_MAP, FONT_SIZE_MAP,
  parseExtra, getButtonStyleOverrides, isVideoLink, resolveActiveTheme,
} from "@/lib/socialLinksConstants";

// Extracted modules
import {
  SUPPORTED_LANGUAGES, type LangCode, SOCIAL_ICONS, tl,
  pickLocalizedText, formatCompact,
} from "@/lib/socialLinksTranslations";
import {
  AnimatedNumber, FloatingParticles, TypingText, VideoEmbed,
  SectionDivider, ContactFormSection, EmailSubscriptionSection,
} from "@/components/social-links/SocialLinksWidgets";

export default function SocialLinks() {
  const { username } = useParams<{ username: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { language: appLanguage } = useLanguage();
  const { toast } = useToast();
  const { user } = useAuth();
  const { data, isLoading, error } = useSocialLinkPageByUsername(username);
  const [copied, setCopied] = useState(false);
  const [animated, setAnimated] = useState(false);
  const [activePage, setActivePage] = useState("main");

  const langParam = searchParams.get("lang") as LangCode | null;
  const lang: LangCode = SUPPORTED_LANGUAGES.find(l => l.code === langParam)?.code || (appLanguage === "ar" ? "ar" : "en");
  const isRtl = SUPPORTED_LANGUAGES.find(l => l.code === lang)?.dir === "rtl";
  const dir = isRtl ? "rtl" : "ltr";

  const setLang = useCallback((code: LangCode) => {
    setSearchParams(prev => { const next = new URLSearchParams(prev); next.set("lang", code); return next; }, { replace: true });
  }, [setSearchParams]);

  const profileUserId = data?.profile?.user_id;
  const isOwner = !!(user && profileUserId && user.id === profileUserId);

  const { data: followStats } = useFollowStats(profileUserId || undefined);
  const { data: isFollowing } = useIsFollowing(profileUserId || undefined);
  const { data: pendingRequest } = usePendingFollowRequest(profileUserId || undefined);
  const toggleFollow = useToggleFollow(profileUserId || undefined);
  const { data: countries } = useCountries();

  useEffect(() => { const timer = setTimeout(() => setAnimated(true), 100); return () => clearTimeout(timer); }, []);

  // View tracking
  useEffect(() => {
    if (!profileUserId || isOwner) return;
    supabase.rpc("increment_field" as any, { table_name: "profiles_public", field_name: "view_count", row_id: profileUserId }).then(() => {});
    if (data?.page?.id) {
      const ua = navigator.userAgent;
      const isMobile = /Mobi|Android|iPhone/i.test(ua);
      const isTablet = /iPad|Tablet/i.test(ua);
      const deviceType = isMobile ? "mobile" : isTablet ? "tablet" : "desktop";
      const browser = /Firefox/i.test(ua) ? "Firefox" : /Edg/i.test(ua) ? "Edge" : /Chrome/i.test(ua) ? "Chrome" : /Safari/i.test(ua) ? "Safari" : "Other";
      supabase.from("social_link_visits").insert({ page_id: data.page.id, device_type: deviceType, browser, referrer: document.referrer || null, page_url: window.location.href } as any).then(() => {});
    }
  }, [profileUserId, isOwner, data?.page?.id]);

  const abVariantsRef = useRef<Record<string, "A" | "B">>({});

  const handleLinkClick = useCallback((itemId: string) => {
    const variant = abVariantsRef.current[itemId];
    if (variant === "B") {
      supabase.rpc("increment_field" as any, { table_name: "social_link_items", field_name: "ab_variant_click_count", row_id: itemId }).then(() => {});
    } else {
      supabase.rpc("increment_field" as any, { table_name: "social_link_items", field_name: "click_count", row_id: itemId }).then(() => {});
    }
    if (data?.page?.id) {
      const ua = navigator.userAgent;
      const isMobile = /Mobi|Android|iPhone/i.test(ua);
      const isTablet = /iPad|Tablet/i.test(ua);
      const deviceType = isMobile ? "mobile" : isTablet ? "tablet" : "desktop";
      const browser = /Firefox/i.test(ua) ? "Firefox" : /Edg/i.test(ua) ? "Edge" : /Chrome/i.test(ua) ? "Chrome" : /Safari/i.test(ua) ? "Safari" : "Other";
      supabase.from("social_link_clicks" as any).insert({ page_id: data.page.id, link_id: itemId, device_type: deviceType, browser, referrer: document.referrer || null } as any).then(() => {});
    }
  }, [data?.page?.id]);

  const copyLink = useCallback(async () => {
    if (!username) return;
    await navigator.clipboard.writeText(buildSocialLinksUrl(username));
    setCopied(true); toast({ title: tl("linkCopied", lang) }); setTimeout(() => setCopied(false), 2000);
  }, [username, lang, toast]);

  const shareNative = useCallback(async () => {
    if (navigator.share) { try { await navigator.share({ title: `${username} - Altoha`, url: buildSocialLinksUrl(username) }); } catch {} }
    else { copyLink(); }
  }, [username, copyLink]);

  const handleFollow = useCallback(() => {
    if (!user) return;
    toggleFollow.mutate(!!isFollowing, { onSuccess: (result: any) => { if (result?.type === "request_sent") toast({ title: tl("requested", lang) }); } });
  }, [user, isFollowing, toggleFollow, lang, toast]);

  const googleFontLink = useMemo(() => {
    const ff = data?.page?.font_family;
    if (!ff || ff === "default") return null;
    const name = ff === "playfair" ? "Playfair Display" : ff === "cairo" ? "Cairo" : ff === "tajawal" ? "Tajawal" : ff === "montserrat" ? "Montserrat" : ff === "poppins" ? "Poppins" : ff === "roboto" ? "Roboto" : "Inter";
    return `https://fonts.googleapis.com/css2?family=${encodeURIComponent(name)}:wght@400;600;700&display=swap`;
  }, [data?.page?.font_family]);

  const getCountryName = useCallback((code: string | null | undefined): string => {
    if (!code || !countries) return "";
    const c = countries.find(c => c.code === code);
    return c ? (isRtl ? (c.name_ar || c.name) : c.name) : code;
  }, [countries, isRtl]);

  const items = data?.items || [];
  useMemo(() => {
    const map: Record<string, "A" | "B"> = {};
    for (const item of items) { if ((item as any).ab_enabled && (item as any).ab_variant_title) map[item.id] = abVariantsRef.current[item.id] || (Math.random() < 0.5 ? "A" : "B"); }
    abVariantsRef.current = map;
  }, [items]);

  const filteredItems = useMemo(() => {
    const now = new Date();
    return items.filter(item => {
      if (activePage !== "main") { const itemTab = (item as any).page_tab || "main"; if (itemTab !== activePage) return false; }
      const start = (item as any).scheduled_start; const end = (item as any).scheduled_end;
      if (start && new Date(start) > now) return false;
      if (end && new Date(end) < now) return false;
      return true;
    });
  }, [items, activePage]);

  const [passwordUnlocked, setPasswordUnlocked] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState(false);
  const extra_pre = data?.page?.custom_css ? parseExtra(data.page.custom_css) : ({} as any);
  const handlePasswordSubmit = useCallback(() => {
    if (passwordInput === extra_pre.page_password) { setPasswordUnlocked(true); setPasswordError(false); }
    else setPasswordError(true);
  }, [passwordInput, extra_pre.page_password]);

  // ── Loading ──
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: "linear-gradient(180deg, #0a0a12 0%, #0d0d18 100%)" }}>
        <div className="w-full max-w-md space-y-5 p-6">
          <div className="flex flex-col items-center gap-4">
            <Skeleton className="h-28 w-28 rounded-full" style={{ background: "rgba(255,255,255,0.04)" }} />
            <Skeleton className="h-7 w-44" style={{ background: "rgba(255,255,255,0.04)" }} />
            <Skeleton className="h-4 w-56" style={{ background: "rgba(255,255,255,0.04)" }} />
            <div className="flex gap-3 mt-2">{[1,2,3,4].map(i => <Skeleton key={i} className="h-11 w-11 rounded-full" style={{ background: "rgba(255,255,255,0.04)" }} />)}</div>
          </div>
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full rounded-2xl" style={{ background: "rgba(255,255,255,0.04)" }} />)}
        </div>
      </div>
    );
  }

  // ── Error ──
  if (error || !data?.profile) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-5 p-4" dir={dir} style={{ background: "linear-gradient(180deg, #0a0a12 0%, #0d0d18 100%)" }}>
        <div className="rounded-full p-6" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
          <User className="h-10 w-10" style={{ color: "rgba(255,255,255,0.15)" }} />
        </div>
        <div className="text-center">
          <h1 className="text-xl font-bold" style={{ color: "#ffffff" }}>{tl("notFound", lang)}</h1>
          <p className="mt-2 text-sm max-w-xs" style={{ color: "rgba(255,255,255,0.35)" }}>{tl("notFoundDesc", lang)}</p>
        </div>
        <Button asChild variant="outline" size="sm" className="mt-2" style={{ borderColor: "rgba(255,255,255,0.12)", color: "#ffffff", background: "rgba(255,255,255,0.04)" }}>
          <Link to="/"><ArrowLeft className="me-1.5 h-3.5 w-3.5" />{tl("goHome", lang)}</Link>
        </Button>
      </div>
    );
  }

  const { profile, page } = data;
  const extra = parseExtra(page?.custom_css);
  const themeId = resolveActiveTheme(page?.theme || "default", extra);
  const theme = THEME_COLORS[themeId] || THEME_COLORS.default;
  const btnStyle = BUTTON_STYLES_MAP[page?.button_style || "rounded"] || BUTTON_STYLES_MAP.rounded;
  const fontSize = FONT_SIZE_MAP[extra.font_size] || FONT_SIZE_MAP.md;
  const fontFamily = FONT_MAP[page?.font_family || "default"] || "inherit";

  const displayName = pickLocalizedText(isRtl, profile.display_name_ar || profile.full_name_ar || null, profile.display_name || profile.full_name || null) || (isRtl ? "الملف الشخصي" : "Profile");
  const bio = pickLocalizedText(isRtl, page?.bio_ar || (profile as any).bio_ar || null, page?.bio || (profile as any).bio || null);
  const title = pickLocalizedText(isRtl, page?.page_title_ar || null, page?.page_title || null) || displayName;
  const specialization = pickLocalizedText(isRtl, (profile as any).specialization_ar || null, (profile as any).specialization || null);
  const jobTitle = pickLocalizedText(isRtl, (profile as any).job_title_ar || null, (profile as any).job_title || null);

  const socialPlatforms = [
    { key: "instagram", value: profile.instagram }, { key: "twitter", value: profile.twitter },
    { key: "facebook", value: profile.facebook }, { key: "linkedin", value: profile.linkedin },
    { key: "youtube", value: profile.youtube }, { key: "tiktok", value: (profile as any).tiktok },
    { key: "snapchat", value: (profile as any).snapchat }, { key: "website", value: profile.website },
  ].filter(s => s.value);

  const whatsapp = (profile as any).whatsapp;
  const phone = (profile as any).phone;
  const buttonColorStyle = page?.button_color && page.button_color !== "#000000" ? { backgroundColor: page.button_color, color: page.text_color || "#ffffff" } : {};
  const coverImage = extra.cover_image_url || (profile as any).cover_image_url || page?.background_image_url;
  const isVerified = (profile as any).is_verified;
  const yearsExp = (profile as any).years_of_experience;
  const city = (profile as any).city;
  const countryCode = (profile as any).country_code;
  const nationalityCode = (profile as any).nationality;
  const secondNationalityCode = (profile as any).second_nationality;
  const showNationality = (profile as any).show_nationality !== false;
  const membershipTier = (profile as any).membership_tier;
  const globalAwards = (profile as any).global_awards;
  const viewCount = (profile as any).view_count || 0;
  const hasCover = !!coverImage;
  const followersCount = followStats?.followers || 0;

  const textAlignClass = extra.text_align === "start" ? "text-start" : extra.text_align === "end" ? "text-end" : "text-center";
  const justifyClass = extra.text_align === "start" ? "justify-start" : extra.text_align === "end" ? "justify-end" : "justify-center";
  const contentDir = extra.text_direction === "auto" ? dir : extra.text_direction;
  const hasSocialIcons = socialPlatforms.length > 0 || whatsapp || phone;
  const hasStats = yearsExp || (extra.show_views && viewCount > 0);
  const isLight = themeId === "minimal";
  const hasMultiPages = extra.pages && extra.pages.length > 0;
  const needsPassword = extra.enable_password && extra.page_password && !isOwner && !passwordUnlocked;

  // Password gate
  if (needsPassword) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6" dir={contentDir} style={{ background: theme.bg, fontFamily, color: theme.text }}>
        {googleFontLink && <link rel="stylesheet" href={googleFontLink} />}
        <div className="w-full max-w-xs space-y-6 text-center">
          <div className="mx-auto rounded-full p-5" style={{ background: theme.card, border: `1px solid ${theme.border}` }}><Lock className="h-8 w-8 mx-auto" style={{ color: theme.accent }} /></div>
          <div><h1 className="text-lg font-bold mb-1" style={{ color: theme.text }}>{tl("passwordProtected", lang)}</h1><p className="text-xs" style={{ color: theme.textMuted }}>{displayName}</p></div>
          <div className="space-y-3">
            <input type="password" value={passwordInput} onChange={e => { setPasswordInput(e.target.value); setPasswordError(false); }} onKeyDown={e => e.key === "Enter" && handlePasswordSubmit()}
              placeholder={tl("enterPassword", lang)} className="w-full rounded-xl px-4 py-3 text-sm text-center outline-none transition-all"
              style={{ background: theme.btnBg, border: `1px solid ${passwordError ? "#ef4444" : theme.border}`, color: theme.text }} />
            {passwordError && <p className="text-xs" style={{ color: "#ef4444" }}>{tl("wrongPassword", lang)}</p>}
            <button onClick={handlePasswordSubmit} className="w-full py-3 rounded-xl text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent}dd)`, color: isLight ? "#ffffff" : "#0a0a12" }}>{tl("unlock", lang)}</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center relative" dir={contentDir} style={{ background: theme.bg, fontFamily, color: theme.text }}>
      {extra.enable_particles && <FloatingParticles color={extra.particle_color || theme.accent} />}
      {extra.custom_user_css && <style dangerouslySetInnerHTML={{ __html: extra.custom_user_css }} />}
      {googleFontLink && <link rel="stylesheet" href={googleFontLink} />}
      <SEOHead
        title={(lang === "ar" ? extra.seo_title_ar || extra.seo_title : extra.seo_title) || `${displayName} (@${username}) - Altoha`}
        description={(lang === "ar" ? extra.seo_description_ar || extra.seo_description : extra.seo_description) || (bio ? `${bio.slice(0, 150)}` : `${displayName}'s links, bio & contact on Altoha`)}
        ogImage={extra.og_image_url || coverImage || profile.avatar_url || undefined} ogType="profile"
        canonical={buildSocialLinksUrl(username)} lang={lang}
        keywords={[displayName, username, jobTitle, specialization, "bio", "links", "altoha"].filter(Boolean).join(", ")} author={displayName}
        jsonLd={{
          "@context": "https://schema.org", "@type": "ProfilePage", name: displayName, description: bio || `${displayName}'s links on Altoha`,
          url: buildSocialLinksUrl(username), image: coverImage || profile.avatar_url || undefined, dateModified: page?.updated_at || undefined,
          mainEntity: {
            "@type": "Person", name: displayName, alternateName: `@${username}`, jobTitle: jobTitle || specialization || undefined,
            url: buildSocialLinksUrl(username), image: profile.avatar_url || undefined,
            ...(city && countryCode ? { address: { "@type": "PostalAddress", addressLocality: city, addressCountry: countryCode } } : {}),
            sameAs: socialPlatforms.map(s => { const info = SOCIAL_ICONS[s.key]; return s.value?.startsWith("http") ? s.value : (info?.urlPrefix ? `${info.urlPrefix}${s.value}` : undefined); }).filter(Boolean),
          },
          ...(items.length > 0 ? { hasPart: items.slice(0, 10).map(item => ({ "@type": "WebPage", name: item.title, url: item.url })) } : {}),
        }}
      />

      {/* Cover */}
      <div className="relative w-full" style={{ height: hasCover ? "280px" : "160px" }}>
        {hasCover ? (
          <><img src={coverImage} alt="" className="absolute inset-0 w-full h-full object-cover" loading="eager" /><div className="absolute inset-0" style={{ background: `linear-gradient(to bottom, transparent 0%, ${isLight ? "#ffffff" : "#0a0a12"} 100%)` }} /></>
        ) : (
          <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at 50% 0%, ${theme.accentLight} 0%, transparent 60%)` }} />
        )}

        {/* Top Actions */}
        <div className={`absolute top-4 ${contentDir === "rtl" ? "left-4" : "right-4"} z-20 flex gap-2 transition-all duration-700 ${animated ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"}`}>
          {isOwner && (
            <Link to="/social-links" className="flex h-9 w-9 items-center justify-center rounded-full backdrop-blur-xl transition-all duration-300 hover:scale-110 active:scale-95"
              style={{ backgroundColor: theme.accentLight, border: `1px solid ${theme.accentMedium}`, color: theme.accent }} title={tl("editPage", lang)}><Pencil className="h-3.5 w-3.5" /></Link>
          )}
          <button onClick={shareNative} className="flex h-9 w-9 items-center justify-center rounded-full backdrop-blur-xl transition-all duration-300 hover:scale-110 active:scale-95"
            style={{ backgroundColor: theme.btnBg, border: `1px solid ${theme.border}`, color: theme.text }}>
            {copied ? <Check className="h-3.5 w-3.5" /> : <Share2 className="h-3.5 w-3.5" />}
          </button>
        </div>

        {/* Language Switcher */}
        {extra.show_language_switcher && (
          <div className={`absolute top-4 ${contentDir === "rtl" ? "right-4" : "left-4"} z-20 transition-all duration-700 ${animated ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"}`}>
            <div className="relative group">
              <button className="flex h-9 w-9 items-center justify-center rounded-full backdrop-blur-xl transition-all duration-300 hover:scale-110 active:scale-95"
                style={{ backgroundColor: theme.btnBg, border: `1px solid ${theme.border}`, color: theme.text }}><Globe className="h-3.5 w-3.5" /></button>
              <div className="absolute top-11 start-0 min-w-[140px] rounded-xl overflow-hidden opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:pointer-events-auto transition-all duration-200 z-50 shadow-2xl"
                style={{ background: isLight ? "rgba(255,255,255,0.95)" : "rgba(20,20,30,0.95)", border: `1px solid ${theme.border}`, backdropFilter: "blur(20px)" }}>
                {SUPPORTED_LANGUAGES.map(l => (
                  <button key={l.code} onClick={() => setLang(l.code)} className="w-full text-start px-4 py-2 text-xs font-medium transition-colors flex items-center justify-between"
                    style={{ color: lang === l.code ? theme.accent : theme.textMuted, backgroundColor: lang === l.code ? theme.accentLight : "transparent" }}
                    onMouseEnter={e => { if (lang !== l.code) (e.target as HTMLElement).style.backgroundColor = theme.btnHover; }}
                    onMouseLeave={e => { if (lang !== l.code) (e.target as HTMLElement).style.backgroundColor = "transparent"; }}>
                    <span>{l.label}</span>{lang === l.code && <Check className="h-3 w-3" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Avatar */}
        <div className={`absolute -bottom-14 left-1/2 -translate-x-1/2 z-20 transition-all duration-700 delay-150 ${animated ? "opacity-100 scale-100" : "opacity-0 scale-75"}`}>
          {(page?.show_avatar !== false) && (
            <div className="relative">
              <div className="absolute -inset-1.5 rounded-full animate-pulse" style={{ background: `radial-gradient(circle, ${theme.accentLight} 0%, transparent 70%)`, opacity: 0.5 }} />
              <Avatar className="h-28 w-28 shadow-2xl relative" style={{ boxShadow: `0 0 0 3px ${isLight ? "#ffffff" : "#0a0a12"}, 0 0 40px ${theme.accentLight}` }}>
                <AvatarImage src={profile.avatar_url || ""} alt={displayName} className="object-cover" />
                <AvatarFallback className="text-2xl font-bold" style={{ background: theme.accentLight, color: theme.accent }}>{displayName?.charAt(0)}</AvatarFallback>
              </Avatar>
              {isVerified && (
                <div className="absolute -bottom-0.5 -end-0.5 h-7 w-7 rounded-full flex items-center justify-center shadow-lg"
                  style={{ background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent}dd)`, boxShadow: `0 0 0 2.5px ${isLight ? "#ffffff" : "#0a0a12"}, 0 4px 12px ${theme.accentLight}` }}>
                  <BadgeCheck className="h-4 w-4 text-white" />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-lg px-5 pt-20 pb-12">
        {/* Name & Meta */}
        <div className={`${textAlignClass} mb-4 transition-all duration-700 delay-250 ${animated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <h1 className={`font-bold tracking-tight ${fontSize.name}`} style={{ color: theme.text, textShadow: isLight ? "none" : "0 2px 20px rgba(0,0,0,0.3)" }}>{title}</h1>
          <p className="mt-1 font-medium" style={{ fontSize: "11px", color: theme.textMuted, letterSpacing: "1.5px" }}>@{profile.username}</p>
          {extra.show_job_title && (jobTitle || specialization) && (
            <p className={`mt-2.5 flex items-center ${justifyClass} gap-1.5 font-medium ${fontSize.meta}`} style={{ color: theme.textMuted }}><Briefcase className="h-3 w-3" style={{ color: theme.accent }} />{jobTitle || specialization}</p>
          )}
          {extra.show_location && (city || countryCode) && (
            <p className={`mt-1 flex items-center ${justifyClass} gap-1.5 font-medium ${fontSize.meta}`} style={{ color: theme.textMuted }}>
              <MapPin className="h-3 w-3" style={{ color: theme.accent }} />{city}{city && countryCode ? ", " : ""}{countryCode && getCountryName(countryCode)} {countryCode && countryFlag(countryCode)}
            </p>
          )}
          {extra.show_flags && showNationality && (nationalityCode || secondNationalityCode) && (
            <div className={`flex items-center ${justifyClass} flex-wrap gap-2 mt-2.5`}>
              {[nationalityCode, secondNationalityCode !== nationalityCode ? secondNationalityCode : null].filter(Boolean).map(code => (
                <span key={code} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium" style={{ background: theme.card, border: `1px solid ${theme.border}`, color: theme.textMuted }}>
                  <span className="text-sm leading-none">{countryFlag(code!)}</span>{getCountryName(code)}
                </span>
              ))}
            </div>
          )}
          {extra.show_membership && membershipTier && membershipTier !== "free" && (
            <div className="mt-2.5">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-[10px] font-semibold rounded-full capitalize tracking-wide"
                style={{ background: `linear-gradient(135deg, ${theme.accentLight}, ${theme.accentLight}88)`, color: theme.accent, border: `1px solid ${theme.accentMedium}` }}>✦ {membershipTier}</span>
            </div>
          )}
        </div>

        {/* Stats */}
        {(extra.show_followers || (extra.show_stats && hasStats)) && (
          <div className={`transition-all duration-700 delay-300 ${animated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
            <div className={`flex items-center ${justifyClass} gap-0 rounded-2xl overflow-hidden mb-5`} style={{ background: theme.card, border: `1px solid ${theme.border}` }}>
              {extra.show_followers && <div className="flex-1 text-center py-3.5 px-3"><p className="text-lg font-bold tabular-nums" style={{ color: theme.text }}>{formatCompact(followersCount)}</p><p className="text-[9px] uppercase tracking-[0.15em] font-medium" style={{ color: theme.textMuted }}>{tl("followers", lang)}</p></div>}
              {extra.show_stats && yearsExp && <><div className="w-px h-8" style={{ background: theme.border }} /><div className="flex-1 text-center py-3.5 px-3"><p className="text-lg font-bold tabular-nums" style={{ color: theme.text }}><AnimatedNumber value={yearsExp} /><span style={{ color: theme.accent }}>+</span></p><p className="text-[9px] uppercase tracking-[0.15em] font-medium" style={{ color: theme.textMuted }}>{tl("yearsExp", lang)}</p></div></>}
              {extra.show_stats && extra.show_views && viewCount > 0 && <><div className="w-px h-8" style={{ background: theme.border }} /><div className="flex-1 text-center py-3.5 px-3"><p className="text-lg font-bold tabular-nums" style={{ color: theme.text }}><AnimatedNumber value={viewCount} /></p><p className="text-[9px] uppercase tracking-[0.15em] font-medium" style={{ color: theme.textMuted }}>{tl("views", lang)}</p></div></>}
            </div>
          </div>
        )}

        {/* Follow */}
        {extra.show_followers && !isOwner && (
          <div className={`flex ${justifyClass} mb-5 transition-all duration-700 delay-320 ${animated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
            <button onClick={handleFollow} disabled={toggleFollow.isPending || !user}
              className="group relative inline-flex items-center gap-2 px-7 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50"
              style={{ background: isFollowing ? theme.card : `linear-gradient(135deg, ${theme.accent}, ${theme.accent}dd)`, border: isFollowing ? `1px solid ${theme.border}` : "none", color: isFollowing ? theme.textMuted : (isLight ? "#ffffff" : "#0a0a12"), boxShadow: isFollowing ? "none" : `0 4px 20px ${theme.accentLight}` }}>
              {toggleFollow.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : isFollowing ? <UserCheck className="h-4 w-4" /> : pendingRequest ? <User className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
              {toggleFollow.isPending ? "..." : isFollowing ? tl("following", lang) : pendingRequest ? tl("requested", lang) : tl("follow", lang)}
            </button>
          </div>
        )}

        {/* Bio */}
        {extra.show_bio && bio && (
          <div className={`mb-5 transition-all duration-700 delay-350 ${animated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
            {extra.enable_typing_animation ? (
              <TypingText text={bio} speed={35} className={`leading-relaxed ${textAlignClass} ${fontSize.bio} block`} style={{ color: theme.textMuted }} />
            ) : (
              <p className={`leading-relaxed ${textAlignClass} ${fontSize.bio}`} dir="auto" style={{ color: theme.textMuted }}>{bio}</p>
            )}
          </div>
        )}

        {/* Awards */}
        {extra.show_awards && globalAwards && Array.isArray(globalAwards) && globalAwards.length > 0 && (
          <div className={`mb-5 transition-all duration-700 delay-400 ${animated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
            <h3 className={`text-[9px] font-semibold uppercase tracking-[0.2em] mb-3 ${textAlignClass}`} style={{ color: theme.accent }}>{tl("awards", lang)}</h3>
            <div className="space-y-1.5">
              {globalAwards.map((award: any, i: number) => (
                <div key={i} className="flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200" style={{ background: theme.card, border: `1px solid ${theme.border}` }}>
                  <span className="text-base">{award.icon === "gold" ? "🏅" : award.icon === "tabakh" ? "👨‍🍳" : "🏆"}</span>
                  <span className="flex-1 text-xs font-medium" style={{ color: theme.textMuted }}>{isRtl ? (award.name_ar || award.name) : (award.name || award.name_ar)}</span>
                  {award.year && <span className="text-[10px] font-medium tabular-nums" style={{ color: `${theme.textMuted}88` }}>{award.year}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Career */}
        {profileUserId && <BioCareerSections userId={profileUserId} theme={theme} isRtl={isRtl} animated={animated} />}

        {/* Social Icons */}
        {page?.show_social_icons !== false && hasSocialIcons && (
          <div className={`mb-5 transition-all duration-700 delay-450 ${animated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
            <div className={`flex ${justifyClass} flex-wrap gap-2.5`}>
              {socialPlatforms.map(({ key, value }) => {
                const info = SOCIAL_ICONS[key];
                if (!info) return null;
                const Icon = info.icon;
                const href = value?.startsWith("http") ? value : (info.urlPrefix ? `${info.urlPrefix}${value}` : `https://${value}`);
                return (
                  <a key={key} href={href} target="_blank" rel="noopener noreferrer" title={info.label}
                    className="group relative flex h-11 w-11 items-center justify-center rounded-full transition-all duration-300 hover:scale-110 active:scale-95"
                    style={{ background: theme.btnBg, border: `1px solid ${theme.border}`, color: theme.text }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = `${info.hoverColor}22`; (e.currentTarget as HTMLElement).style.borderColor = `${info.hoverColor}44`; (e.currentTarget as HTMLElement).style.color = info.hoverColor; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = theme.btnBg; (e.currentTarget as HTMLElement).style.borderColor = theme.border; (e.currentTarget as HTMLElement).style.color = theme.text; }}>
                    <Icon className="h-[18px] w-[18px]" />
                  </a>
                );
              })}
              {whatsapp && <a href={`https://wa.me/${whatsapp.replace(/[^0-9+]/g, "")}`} target="_blank" rel="noopener noreferrer" title="WhatsApp" className="group relative flex h-11 w-11 items-center justify-center rounded-full transition-all duration-300 hover:scale-110 active:scale-95" style={{ background: "rgba(37,211,102,0.08)", border: "1px solid rgba(37,211,102,0.15)", color: "#25d366" }}><MessageCircle className="h-[18px] w-[18px]" /></a>}
              {phone && <a href={`tel:${phone}`} title={isRtl ? "اتصل" : "Call"} className="group relative flex h-11 w-11 items-center justify-center rounded-full transition-all duration-300 hover:scale-110 active:scale-95" style={{ background: theme.btnBg, border: `1px solid ${theme.border}`, color: theme.text }}><Phone className="h-[18px] w-[18px]" /></a>}
              {extra.show_vcard_btn && (displayName || phone || whatsapp) && (
                <button onClick={() => {
                  const fn = (profile.full_name || profile.display_name || "").split(" ");
                  const lines = ["BEGIN:VCARD", "VERSION:3.0", `FN:${displayName}`, `N:${fn.slice(1).join(" ") || ""};${fn[0] || ""};;;`];
                  if (jobTitle) lines.push(`TITLE:${jobTitle}`);
                  if (phone) lines.push(`TEL;TYPE=CELL:${phone}`);
                  if (whatsapp && whatsapp !== phone) lines.push(`TEL;TYPE=CELL:${whatsapp}`);
                  if (profile.website) lines.push(`URL:${profile.website}`);
                  if (profile.avatar_url) lines.push(`PHOTO;VALUE=URI:${profile.avatar_url}`);
                  lines.push(`URL:${window.location.origin}/bio/${profile.username}`);
                  if (bio) lines.push(`NOTE:${bio.replace(/\n/g, "\\n").slice(0, 200)}`);
                  lines.push("END:VCARD");
                  const blob = new Blob([lines.join("\r\n")], { type: "text/vcard;charset=utf-8" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a"); a.href = url; a.download = `${profile.username || "contact"}.vcf`; a.click(); URL.revokeObjectURL(url);
                }} className="group relative flex h-11 w-11 items-center justify-center rounded-full transition-all duration-300 hover:scale-110 active:scale-95"
                  style={{ background: theme.accentLight, border: `1px solid ${theme.accentMedium}`, color: theme.accent }} title={isRtl ? "حفظ جهة اتصال" : "Save Contact"}>
                  <UserPlus className="h-[18px] w-[18px]" />
                </button>
              )}
            </div>
          </div>
        )}

        {items.length > 0 && hasSocialIcons && <SectionDivider color={theme.border} />}

        {/* Multi-Page Tabs */}
        {hasMultiPages && (
          <div className={`mb-5 transition-all duration-700 delay-470 ${animated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
            <div className={`flex ${justifyClass} flex-wrap gap-1.5`}>
              <button onClick={() => setActivePage("main")} className="px-4 py-2 rounded-full text-xs font-semibold transition-all duration-300"
                style={{ background: activePage === "main" ? `linear-gradient(135deg, ${theme.accentLight}, ${theme.accentMedium})` : theme.btnBg, border: `1px solid ${activePage === "main" ? theme.accentMedium : theme.border}`, color: activePage === "main" ? theme.accent : theme.textMuted }}>{tl("all", lang)}</button>
              {extra.pages.map((pg: any) => (
                <button key={pg.id} onClick={() => setActivePage(pg.id)} className="px-4 py-2 rounded-full text-xs font-semibold transition-all duration-300"
                  style={{ background: activePage === pg.id ? `linear-gradient(135deg, ${theme.accentLight}, ${theme.accentMedium})` : theme.btnBg, border: `1px solid ${activePage === pg.id ? theme.accentMedium : theme.border}`, color: activePage === pg.id ? theme.accent : theme.textMuted }}>
                  {isRtl ? (pg.label_ar || pg.label) : pg.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Links */}
        {filteredItems.length > 0 && (
          <div className="mb-5">
            <div className={`${extra.link_layout === "grid" ? "grid grid-cols-2 gap-2.5" : "space-y-2.5"}`}>
              {filteredItems.map((item, index) => (
                <div key={item.id}>
                  <a href={item.url.startsWith("http") ? item.url : `https://${item.url}`} target="_blank" rel="noopener noreferrer" onClick={() => handleLinkClick(item.id)}
                    className={`group relative flex ${extra.link_layout === "grid" ? "flex-col items-center text-center py-5" : "items-center"} gap-3 px-5 py-3.5 ${btnStyle} backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] overflow-hidden`}
                    style={{ background: buttonColorStyle.backgroundColor || theme.card, border: `1px solid ${buttonColorStyle.backgroundColor ? "transparent" : theme.border}`, color: buttonColorStyle.color || theme.text, opacity: animated ? 1 : 0, transform: animated ? "translateY(0)" : "translateY(16px)", transition: `all 0.5s cubic-bezier(0.4,0,0.2,1) ${500 + index * 80}ms`, ...(!buttonColorStyle.backgroundColor ? getButtonStyleOverrides(page?.button_style || "rounded", theme.accent, theme.card, theme.border) : {}) }}
                    onMouseEnter={e => { if (!buttonColorStyle.backgroundColor) { (e.currentTarget as HTMLElement).style.background = theme.btnHover; (e.currentTarget as HTMLElement).style.borderColor = theme.accentMedium; } }}
                    onMouseLeave={e => { if (!buttonColorStyle.backgroundColor) { (e.currentTarget as HTMLElement).style.background = theme.card; (e.currentTarget as HTMLElement).style.borderColor = theme.border; } }}>
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: `linear-gradient(90deg, transparent 0%, ${theme.btnHover} 50%, transparent 100%)` }} />
                    {item.thumbnail_url && <img src={item.thumbnail_url} alt="" className={`${extra.link_layout === "grid" ? "h-10 w-10" : "h-9 w-9"} rounded-lg object-cover shrink-0 relative z-10`} loading="lazy" />}
                    {(() => { const abIcon = abVariantsRef.current[item.id] === "B" ? (item as any).ab_variant_icon : null; const displayIcon = abIcon || item.icon; return displayIcon && !item.thumbnail_url ? <span className={`${extra.link_layout === "grid" ? "text-xl" : "text-lg"} shrink-0 relative z-10`}>{displayIcon}</span> : null; })()}
                    <span className={`${extra.link_layout === "grid" ? "" : "flex-1"} font-medium ${textAlignClass} relative z-10 ${fontSize.link}`}>
                      {(() => { const isB = abVariantsRef.current[item.id] === "B"; return isB ? (isRtl ? ((item as any).ab_variant_title_ar || (item as any).ab_variant_title || item.title) : ((item as any).ab_variant_title || item.title)) : (isRtl ? (item.title_ar || item.title) : item.title); })()}
                    </span>
                    {extra.link_layout !== "grid" && <ExternalLink className="h-3.5 w-3.5 opacity-20 group-hover:opacity-50 transition-opacity shrink-0 relative z-10" />}
                  </a>
                  {extra.show_video_embeds && isVideoLink(item.url) && <VideoEmbed url={item.url} theme={theme} />}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Contact Form */}
        {extra.show_contact_form && profileUserId && !isOwner && (
          <div className={`mb-5 transition-all duration-700 delay-500 ${animated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
            <SectionDivider color={theme.border} />
            <h3 className={`text-[9px] font-semibold uppercase tracking-[0.2em] mb-3 ${textAlignClass}`} style={{ color: theme.accent }}>
              {isRtl ? (extra.contact_form_title_ar || extra.contact_form_title) : (extra.contact_form_title || tl("contactTitle", lang))}
            </h3>
            <ContactFormSection theme={theme} lang={lang} isRtl={isRtl} profileUserId={profileUserId} ownerName={displayName} />
          </div>
        )}

        {/* Email Collection */}
        {extra.enable_email_collection && profileUserId && !isOwner && data?.page?.id && (
          <div className={`mb-5 transition-all duration-700 delay-600 ${animated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
            <SectionDivider color={theme.border} />
            <EmailSubscriptionSection theme={theme} lang={lang} isRtl={isRtl} profileUserId={profileUserId} pageId={data.page.id} extra={extra} />
          </div>
        )}

        {items.length === 0 && !hasSocialIcons && (
          <div className={`text-center py-8 mb-5 rounded-2xl transition-all duration-700 delay-400 ${animated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`} style={{ background: theme.card, border: `1px solid ${theme.border}` }}>
            <Link2 className="h-7 w-7 mx-auto mb-2.5" style={{ color: theme.textMuted }} /><p className="text-xs font-medium" style={{ color: theme.textMuted }}>{tl("noLinks", lang)}</p>
          </div>
        )}

        {/* View Full Profile */}
        {extra.show_full_profile_btn && (
          <div className={`mt-6 transition-all duration-700 delay-550 ${animated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            <Link to={`/${profile.username}`} className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl text-sm font-semibold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: `linear-gradient(135deg, ${theme.accentLight}, ${theme.accentLight}66)`, border: `1px solid ${theme.accentMedium}`, color: theme.accent }}>
              <User className="h-4 w-4" />{tl("viewProfile", lang)}
            </Link>
          </div>
        )}

        {/* Owner / Login CTAs */}
        {isOwner && (
          <div className={`mt-3 transition-all duration-700 delay-600 ${animated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            <Link to="/social-links" className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl text-xs font-semibold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]" style={{ background: theme.card, border: `1px solid ${theme.border}`, color: theme.text }}>
              <Pencil className="h-3.5 w-3.5" />{tl("editPage", lang)}
            </Link>
          </div>
        )}
        {!user && (
          <div className={`mt-3 transition-all duration-700 delay-600 ${animated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            <Link to="/auth" className="flex items-center justify-center gap-2 w-full py-2.5 rounded-2xl text-xs font-medium transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]" style={{ background: theme.card, border: `1px solid ${theme.border}`, color: theme.textMuted }}>
              <LogIn className="h-3 w-3" />{tl("createPage", lang)}
            </Link>
          </div>
        )}

        {/* Footer */}
        {extra.show_footer && (extra.footer_text || extra.footer_text_ar) && (
          <div className={`mt-8 mb-4 text-center transition-all duration-700 delay-650 ${animated ? "opacity-100" : "opacity-0"}`}>
            <p className="text-xs" style={{ color: theme.textMuted }}>{isRtl ? (extra.footer_text_ar || extra.footer_text) : (extra.footer_text || extra.footer_text_ar)}</p>
          </div>
        )}
        <div className={`mt-${extra.show_footer ? '4' : '14'} text-center transition-all duration-700 delay-700 ${animated ? "opacity-100" : "opacity-0"}`}>
          <div className="inline-flex flex-col items-center gap-2">
            <div className="h-px w-12 mx-auto" style={{ background: `linear-gradient(90deg, transparent, ${theme.border}, transparent)` }} />
            <Link to="/" className="group inline-flex items-center gap-2 py-2 px-4 rounded-full transition-all duration-300 hover:scale-105" style={{ color: `${theme.textMuted}66` }}>
              <div className="h-5 w-5 rounded-md flex items-center justify-center transition-all duration-300 group-hover:shadow-lg" style={{ background: `linear-gradient(135deg, ${theme.accentLight}, ${theme.accentMedium})`, boxShadow: `0 0 12px ${theme.accentLight}` }}>
                <span className="text-[8px] font-extrabold" style={{ color: theme.accent }}>A</span>
              </div>
              <span className="text-[9px] font-semibold uppercase tracking-[0.25em] transition-colors group-hover:text-current" style={{ opacity: 0.5 }}>Altoha</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
