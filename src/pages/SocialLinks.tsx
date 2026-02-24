import { useParams, useSearchParams } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { useSocialLinkPageByUsername } from "@/hooks/useSocialLinkPage";
import { SEOHead } from "@/components/SEOHead";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ExternalLink, Instagram, Twitter, Facebook, Linkedin, Youtube, Globe,
  User, ArrowLeft, Share2, Check, BadgeCheck, MapPin, Briefcase, Award, Link2,
  Pencil, LogIn, Phone, MessageCircle, Eye, Users, UserPlus, UserCheck, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect, useMemo, useCallback, memo } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { buildSocialLinksUrl } from "@/lib/publicAppUrl";
import { useFollowStats, useIsFollowing, useToggleFollow, usePendingFollowRequest } from "@/hooks/useFollow";
import { countryFlag } from "@/lib/countryFlag";
import { useCountries } from "@/hooks/useCountries";

// ── Multi-language support (10 languages) ──
const SUPPORTED_LANGUAGES = [
  { code: "ar", label: "العربية", dir: "rtl" },
  { code: "en", label: "English", dir: "ltr" },
  { code: "fr", label: "Français", dir: "ltr" },
  { code: "es", label: "Español", dir: "ltr" },
  { code: "de", label: "Deutsch", dir: "ltr" },
  { code: "tr", label: "Türkçe", dir: "ltr" },
  { code: "pt", label: "Português", dir: "ltr" },
  { code: "zh", label: "中文", dir: "ltr" },
  { code: "ja", label: "日本語", dir: "ltr" },
  { code: "ko", label: "한국어", dir: "ltr" },
] as const;

type LangCode = typeof SUPPORTED_LANGUAGES[number]["code"];

const T: Record<string, Record<LangCode, string>> = {
  follow: { ar: "متابعة", en: "Follow", fr: "Suivre", es: "Seguir", de: "Folgen", tr: "Takip Et", pt: "Seguir", zh: "关注", ja: "フォロー", ko: "팔로우" },
  following: { ar: "متابَع", en: "Following", fr: "Abonné", es: "Siguiendo", de: "Folgend", tr: "Takip", pt: "Seguindo", zh: "已关注", ja: "フォロー中", ko: "팔로잉" },
  followers: { ar: "متابع", en: "Followers", fr: "Abonnés", es: "Seguidores", de: "Follower", tr: "Takipçi", pt: "Seguidores", zh: "粉丝", ja: "フォロワー", ko: "팔로워" },
  requested: { ar: "تم الطلب", en: "Requested", fr: "Demandé", es: "Solicitado", de: "Angefragt", tr: "İstendi", pt: "Solicitado", zh: "已请求", ja: "リクエスト済", ko: "요청됨" },
  views: { ar: "مشاهدة", en: "Views", fr: "Vues", es: "Vistas", de: "Aufrufe", tr: "Görüntüleme", pt: "Visualizações", zh: "浏览", ja: "閲覧", ko: "조회" },
  yearsExp: { ar: "سنوات خبرة", en: "Years Exp.", fr: "Ans d'exp.", es: "Años Exp.", de: "Jahre Erf.", tr: "Yıl Den.", pt: "Anos Exp.", zh: "年经验", ja: "年経験", ko: "년 경력" },
  followMe: { ar: "تابعني", en: "Follow Me", fr: "Suivez-moi", es: "Sígueme", de: "Folge mir", tr: "Beni Takip Et", pt: "Siga-me", zh: "关注我", ja: "フォローする", ko: "팔로우하기" },
  links: { ar: "الروابط", en: "Links", fr: "Liens", es: "Enlaces", de: "Links", tr: "Bağlantılar", pt: "Links", zh: "链接", ja: "リンク", ko: "링크" },
  awards: { ar: "الجوائز والإنجازات", en: "Awards & Achievements", fr: "Prix & Réalisations", es: "Premios y Logros", de: "Auszeichnungen", tr: "Ödüller", pt: "Prêmios", zh: "奖项与成就", ja: "受賞歴", ko: "수상 경력" },
  viewProfile: { ar: "عرض البروفايل الكامل", en: "View Full Profile", fr: "Voir le profil complet", es: "Ver perfil completo", de: "Vollständiges Profil", tr: "Tam Profili Gör", pt: "Ver perfil completo", zh: "查看完整资料", ja: "プロフィール全体を見る", ko: "전체 프로필 보기" },
  editPage: { ar: "تعديل ونشر الصفحة", en: "Edit & Publish Page", fr: "Modifier et publier", es: "Editar y publicar", de: "Bearbeiten & Veröffentlichen", tr: "Düzenle & Yayınla", pt: "Editar e publicar", zh: "编辑并发布", ja: "編集して公開", ko: "편집 및 게시" },
  createPage: { ar: "أنشئ صفحتك الخاصة", en: "Create your own page", fr: "Créez votre page", es: "Crea tu propia página", de: "Erstelle deine Seite", tr: "Kendi sayfanı oluştur", pt: "Crie sua página", zh: "创建你的页面", ja: "自分のページを作る", ko: "나만의 페이지 만들기" },
  notFound: { ar: "الصفحة غير موجودة", en: "Page not found", fr: "Page introuvable", es: "Página no encontrada", de: "Seite nicht gefunden", tr: "Sayfa bulunamadı", pt: "Página não encontrada", zh: "页面未找到", ja: "ページが見つかりません", ko: "페이지를 찾을 수 없습니다" },
  notFoundDesc: { ar: "هذه الصفحة غير موجودة أو لم يتم إنشاؤها بعد", en: "This page doesn't exist or hasn't been created yet", fr: "Cette page n'existe pas ou n'a pas encore été créée", es: "Esta página no existe o no ha sido creada aún", de: "Diese Seite existiert nicht oder wurde noch nicht erstellt", tr: "Bu sayfa mevcut değil veya henüz oluşturulmamış", pt: "Esta página não existe ou ainda não foi criada", zh: "此页面不存在或尚未创建", ja: "このページは存在しないか、まだ作成されていません", ko: "이 페이지가 존재하지 않거나 아직 생성되지 않았습니다" },
  goHome: { ar: "الرئيسية", en: "Go Home", fr: "Accueil", es: "Inicio", de: "Startseite", tr: "Ana Sayfa", pt: "Início", zh: "首页", ja: "ホームへ", ko: "홈으로" },
  linkCopied: { ar: "تم نسخ الرابط", en: "Link copied!", fr: "Lien copié !", es: "¡Enlace copiado!", de: "Link kopiert!", tr: "Bağlantı kopyalandı!", pt: "Link copiado!", zh: "链接已复制！", ja: "リンクをコピーしました！", ko: "링크가 복사되었습니다!" },
  noLinks: { ar: "لا توجد روابط بعد", en: "No links yet", fr: "Aucun lien encore", es: "Sin enlaces aún", de: "Noch keine Links", tr: "Henüz bağlantı yok", pt: "Sem links ainda", zh: "暂无链接", ja: "リンクはまだありません", ko: "아직 링크가 없습니다" },
  nationality: { ar: "الجنسية", en: "Nationality", fr: "Nationalité", es: "Nacionalidad", de: "Nationalität", tr: "Uyruk", pt: "Nacionalidade", zh: "国籍", ja: "国籍", ko: "국적" },
  residence: { ar: "الإقامة", en: "Residence", fr: "Résidence", es: "Residencia", de: "Wohnsitz", tr: "İkamet", pt: "Residência", zh: "居住地", ja: "居住地", ko: "거주지" },
};

function t(key: string, lang: LangCode): string {
  return T[key]?.[lang] || T[key]?.en || key;
}

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
  show_followers: boolean;
  show_flags: boolean;
  show_views: boolean;
  show_language_switcher: boolean;
  text_align: "start" | "center" | "end";
  text_direction: "auto" | "ltr" | "rtl";
  link_layout: "list" | "grid";
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
  show_followers: true,
  show_flags: true,
  show_views: true,
  show_language_switcher: true,
  text_align: "center",
  text_direction: "auto",
  link_layout: "list",
};

function parseExtra(customCss: string | null | undefined): ExtraSettings {
  if (!customCss) return { ...DEFAULT_EXTRA };
  try {
    return { ...DEFAULT_EXTRA, ...JSON.parse(customCss) };
  } catch {
    return { ...DEFAULT_EXTRA };
  }
}

// ── Lightweight animated counter using RAF ──
const AnimatedNumber = memo(function AnimatedNumber({ value, duration = 1200 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (value === 0) { setDisplay(0); return; }
    const start = performance.now();
    let raf: number;
    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * value));
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return <>{display.toLocaleString()}</>;
});

// ── Compact number formatter ──
function formatCompact(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return n.toString();
}

export default function SocialLinks() {
  const { username } = useParams<{ username: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { language: appLanguage } = useLanguage();
  const { toast } = useToast();
  const { user } = useAuth();
  const { data, isLoading, error } = useSocialLinkPageByUsername(username);
  const [copied, setCopied] = useState(false);
  const [animated, setAnimated] = useState(false);

  // Language from URL param or app language
  const langParam = searchParams.get("lang") as LangCode | null;
  const lang: LangCode = SUPPORTED_LANGUAGES.find(l => l.code === langParam)?.code || (appLanguage === "ar" ? "ar" : "en");
  const isRtl = lang === "ar";
  const dir = isRtl ? "rtl" : "ltr";

  const setLang = useCallback((code: LangCode) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.set("lang", code);
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  const profileUserId = data?.profile?.user_id;
  const isOwner = !!(user && profileUserId && user.id === profileUserId);

  // Follow hooks
  const { data: followStats } = useFollowStats(profileUserId || undefined);
  const { data: isFollowing } = useIsFollowing(profileUserId || undefined);
  const { data: pendingRequest } = usePendingFollowRequest(profileUserId || undefined);
  const toggleFollow = useToggleFollow(profileUserId || undefined);

  // Countries for flag resolution
  const { data: countries } = useCountries();

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleLinkClick = useCallback((itemId: string) => {
    supabase.rpc("increment_field" as any, { table_name: "social_link_items", field_name: "click_count", row_id: itemId }).then(() => {});
  }, []);

  const copyLink = useCallback(async () => {
    if (!username) return;
    await navigator.clipboard.writeText(buildSocialLinksUrl(username));
    setCopied(true);
    toast({ title: t("linkCopied", lang) });
    setTimeout(() => setCopied(false), 2000);
  }, [username, lang, toast]);

  const shareNative = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: `${username} - Altoha`, url: buildSocialLinksUrl(username) });
      } catch {}
    } else {
      copyLink();
    }
  }, [username, copyLink]);

  const handleFollow = useCallback(() => {
    if (!user) return;
    toggleFollow.mutate(!!isFollowing, {
      onSuccess: (result: any) => {
        if (result?.type === "request_sent") {
          toast({ title: t("requested", lang) });
        }
      },
    });
  }, [user, isFollowing, toggleFollow, lang, toast]);

  const googleFontLink = useMemo(() => {
    const ff = data?.page?.font_family;
    if (!ff || ff === "default") return null;
    const name = ff === "playfair" ? "Playfair Display" : ff === "cairo" ? "Cairo" : ff === "tajawal" ? "Tajawal" : ff === "montserrat" ? "Montserrat" : ff === "poppins" ? "Poppins" : ff === "roboto" ? "Roboto" : "Inter";
    return `https://fonts.googleapis.com/css2?family=${encodeURIComponent(name)}:wght@400;600;700&display=swap`;
  }, [data?.page?.font_family]);

  // Resolve country name from code
  const getCountryName = useCallback((code: string | null | undefined): string => {
    if (!code || !countries) return "";
    const c = countries.find(c => c.code === code);
    if (!c) return code;
    return isRtl ? (c.name_ar || c.name) : c.name;
  }, [countries, isRtl]);

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
      <div className="flex min-h-screen flex-col items-center justify-center gap-5 p-4" dir={dir} style={{ background: "linear-gradient(180deg, #0a0a12 0%, #0d0d18 100%)" }}>
        <div className="rounded-full p-6" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
          <User className="h-10 w-10" style={{ color: "rgba(255,255,255,0.15)" }} />
        </div>
        <div className="text-center">
          <h1 className="text-xl font-bold" style={{ color: "#ffffff" }}>{t("notFound", lang)}</h1>
          <p className="mt-2 text-sm max-w-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
            {t("notFoundDesc", lang)}
          </p>
        </div>
        <Button asChild variant="outline" size="sm" className="mt-2" style={{ borderColor: "rgba(255,255,255,0.12)", color: "#ffffff", background: "rgba(255,255,255,0.04)" }}>
          <Link to="/"><ArrowLeft className="me-1.5 h-3.5 w-3.5" />{t("goHome", lang)}</Link>
        </Button>
      </div>
    );
  }

  const { profile, page, items } = data;
  const btnStyle = BUTTON_STYLES[page?.button_style || "rounded"] || BUTTON_STYLES.rounded;
  const extra = parseExtra(page?.custom_css);
  const fontSize = FONT_SIZE_MAP[extra.font_size] || FONT_SIZE_MAP.md;
  const fontFamily = FONT_MAP[page?.font_family || "default"] || "inherit";

  const displayName = isRtl
    ? (profile.display_name_ar || profile.full_name_ar || profile.display_name || profile.full_name || "")
    : (profile.display_name || profile.full_name || profile.display_name_ar || profile.full_name_ar || "");

  const bio = isRtl
    ? ((profile as any).bio_ar || (profile as any).bio || page?.bio_ar || page?.bio)
    : ((profile as any).bio || (profile as any).bio_ar || page?.bio || page?.bio_ar);

  const title = isRtl ? (page?.page_title_ar || page?.page_title || displayName) : (page?.page_title || page?.page_title_ar || displayName);

  const specialization = isRtl
    ? ((profile as any).specialization_ar || (profile as any).specialization)
    : ((profile as any).specialization || (profile as any).specialization_ar);

  const jobTitle = isRtl
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
  const nationalityCode = (profile as any).nationality;
  const secondNationalityCode = (profile as any).second_nationality;
  const showNationality = (profile as any).show_nationality !== false;
  const membershipTier = (profile as any).membership_tier;
  const globalAwards = (profile as any).global_awards;
  const viewCount = (profile as any).view_count;
  const hasCover = !!coverImage;

  const accentColor = "#c4a265";
  const accentLight = "rgba(196,162,101,0.12)";
  const accentMedium = "rgba(196,162,101,0.25)";

  const followersCount = followStats?.followers || 0;

  // Compute layout classes from extra settings
  const textAlignClass = extra.text_align === "start" ? "text-start" : extra.text_align === "end" ? "text-end" : "text-center";
  const justifyClass = extra.text_align === "start" ? "justify-start" : extra.text_align === "end" ? "justify-end" : "justify-center";
  const contentDir = extra.text_direction === "auto" ? dir : extra.text_direction;

  return (
    <div
      className="flex min-h-screen flex-col items-center"
      dir={contentDir}
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
        <div className={`absolute top-4 ${isRtl ? "left-4" : "right-4"} z-20 flex gap-2 transition-all duration-700 ${animated ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"}`}>
          {isOwner && (
            <Link
              to="/social-links"
              className="flex h-10 w-10 items-center justify-center rounded-full backdrop-blur-xl transition-all duration-300 hover:scale-110 active:scale-95"
              style={{ backgroundColor: "rgba(196,162,101,0.2)", border: "1px solid rgba(196,162,101,0.35)", color: accentColor }}
              title={isRtl ? "تعديل" : "Edit"}
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

        {/* Language Switcher */}
        {extra.show_language_switcher && (
          <div className={`absolute top-4 ${isRtl ? "right-4" : "left-4"} z-20 transition-all duration-700 ${animated ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"}`}>
            <div className="relative group">
              <button
                className="flex h-10 w-10 items-center justify-center rounded-full backdrop-blur-xl transition-all duration-300 hover:scale-110 active:scale-95"
                style={{ backgroundColor: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }}
              >
                <Globe className="h-4 w-4" />
              </button>
              <div className="absolute top-12 start-0 min-w-[140px] rounded-xl overflow-hidden opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:pointer-events-auto transition-all duration-200 z-50"
                style={{ background: "rgba(20,20,30,0.95)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(20px)" }}
              >
                {SUPPORTED_LANGUAGES.map(l => (
                  <button
                    key={l.code}
                    onClick={() => setLang(l.code)}
                    className="w-full text-start px-4 py-2 text-xs font-medium transition-colors hover:bg-white/5 flex items-center justify-between"
                    style={{ color: lang === l.code ? accentColor : "rgba(255,255,255,0.6)" }}
                  >
                    <span>{l.label}</span>
                    {lang === l.code && <Check className="h-3 w-3" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

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
        <div className={`${textAlignClass} mb-6 transition-all duration-700 delay-250 ${animated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <h1 className={`font-bold tracking-tight ${fontSize.name}`} style={{ color: "#ffffff", textShadow: "0 2px 20px rgba(0,0,0,0.3)" }}>
            {title}
          </h1>

          <p className="mt-2 font-medium" style={{ fontSize: "13px", color: "rgba(255,255,255,0.3)", letterSpacing: "1px" }}>
            @{profile.username}
          </p>

          {/* Nationality Flags */}
          {extra.show_flags && showNationality && (nationalityCode || countryCode) && (
            <div className={`flex items-center ${justifyClass} flex-wrap gap-3 mt-3`}>
              {nationalityCode && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.55)" }}>
                  <span className="text-base leading-none">{countryFlag(nationalityCode)}</span>
                  {getCountryName(nationalityCode)}
                </span>
              )}
              {countryCode && countryCode !== nationalityCode && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.55)" }}>
                  <MapPin className="h-3 w-3" style={{ color: accentColor }} />
                  <span className="text-base leading-none">{countryFlag(countryCode)}</span>
                  {getCountryName(countryCode)}
                </span>
              )}
              {secondNationalityCode && secondNationalityCode !== nationalityCode && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.55)" }}>
                  <span className="text-base leading-none">{countryFlag(secondNationalityCode)}</span>
                </span>
              )}
            </div>
          )}

          {/* Job & Location */}
          {(extra.show_job_title || extra.show_location) && (
            <div className={`flex items-center ${justifyClass} flex-wrap gap-x-5 gap-y-1.5 mt-3`}>
              {extra.show_job_title && (jobTitle || specialization) && (
                <span className={`flex items-center gap-1.5 font-medium ${fontSize.meta}`} style={{ color: "rgba(255,255,255,0.5)" }}>
                  <Briefcase className="h-3.5 w-3.5" style={{ color: accentColor }} />
                  {jobTitle || specialization}
                </span>
              )}
              {extra.show_location && (city || countryCode) && (
                <span className={`flex items-center gap-1.5 font-medium ${fontSize.meta}`} style={{ color: "rgba(255,255,255,0.5)" }}>
                  <MapPin className="h-3.5 w-3.5" style={{ color: accentColor }} />
                  {city}{city && countryCode ? ", " : ""}{countryCode && countryFlag(countryCode)}
                </span>
              )}
            </div>
          )}

          {/* Membership */}
          {extra.show_membership && membershipTier && membershipTier !== "free" && (
            <div className="mt-3">
              <span className="inline-flex items-center gap-1.5 px-4 py-1.5 text-[11px] font-semibold rounded-full capitalize tracking-wide"
                style={{ background: `linear-gradient(135deg, ${accentLight}, rgba(196,162,101,0.08))`, color: accentColor, border: `1px solid ${accentMedium}`, backdropFilter: "blur(10px)" }}>
                ✦ {membershipTier}
              </span>
            </div>
          )}
        </div>

        {/* Follow Button + Follower Count */}
        {extra.show_followers && (
          <div className={`flex items-center ${justifyClass} gap-4 mb-6 transition-all duration-700 delay-280 ${animated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
            {/* Follow / Unfollow Button */}
            {!isOwner && (
              <button
                onClick={handleFollow}
                disabled={toggleFollow.isPending || !user}
                className="group relative inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50"
                style={{
                  background: isFollowing
                    ? "rgba(255,255,255,0.06)"
                    : `linear-gradient(135deg, ${accentColor}, #d4b576)`,
                  border: isFollowing ? "1px solid rgba(255,255,255,0.12)" : "none",
                  color: isFollowing ? "rgba(255,255,255,0.7)" : "#0a0a12",
                  boxShadow: isFollowing ? "none" : `0 4px 20px rgba(196,162,101,0.3)`,
                }}
              >
                {toggleFollow.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isFollowing ? (
                  <UserCheck className="h-4 w-4" />
                ) : pendingRequest ? (
                  <User className="h-4 w-4" />
                ) : (
                  <UserPlus className="h-4 w-4" />
                )}
                {toggleFollow.isPending
                  ? "..."
                  : isFollowing
                    ? t("following", lang)
                    : pendingRequest
                      ? t("requested", lang)
                      : t("follow", lang)
                }
              </button>
            )}

            {/* Follower count */}
            <div className="flex items-center gap-1.5 text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
              <Users className="h-3.5 w-3.5" />
              <span className="font-semibold tabular-nums" style={{ color: "rgba(255,255,255,0.7)" }}>{formatCompact(followersCount)}</span>
              <span className="text-xs">{t("followers", lang)}</span>
            </div>
          </div>
        )}

        {/* Stats */}
        {extra.show_stats && (yearsExp || (extra.show_views && viewCount > 0)) && (
          <div className={`flex ${justifyClass} gap-2 mb-8 transition-all duration-700 delay-300 ${animated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
            {yearsExp && (
              <div className="text-center px-7 py-4 rounded-2xl backdrop-blur-sm" style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.05)" }}>
                <p className="text-2xl font-bold tabular-nums" style={{ color: "#fff" }}>
                  <AnimatedNumber value={yearsExp} /><span style={{ color: accentColor }}>+</span>
                </p>
                <p className="text-[10px] uppercase tracking-[0.15em] mt-1.5 font-medium" style={{ color: "rgba(255,255,255,0.3)" }}>
                  {t("yearsExp", lang)}
                </p>
              </div>
            )}
            {extra.show_views && viewCount > 0 && (
              <div className="text-center px-7 py-4 rounded-2xl backdrop-blur-sm" style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.05)" }}>
                <p className="text-2xl font-bold tabular-nums" style={{ color: "#fff" }}>
                  <AnimatedNumber value={viewCount} />
                </p>
                <p className="text-[10px] uppercase tracking-[0.15em] mt-1.5 font-medium" style={{ color: "rgba(255,255,255,0.3)" }}>
                  {t("views", lang)}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Bio */}
        {extra.show_bio && bio && (
          <div className={`mb-8 transition-all duration-700 delay-350 ${animated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
            <div className="rounded-2xl px-5 py-4 backdrop-blur-sm" style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <p className={`leading-relaxed ${textAlignClass} ${fontSize.bio}`} dir="auto" style={{ color: "rgba(255,255,255,0.65)" }}>
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
                {t("awards", lang)}
              </h3>
              <div className="space-y-2">
                {globalAwards.map((award: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 hover:translate-x-1"
                    style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                    <span className="text-lg">
                      {award.icon === "gold" ? "🏅" : award.icon === "tabakh" ? "👨‍🍳" : "🏆"}
                    </span>
                    <span className="flex-1 text-sm font-medium" style={{ color: "rgba(255,255,255,0.75)" }}>
                      {isRtl ? (award.name_ar || award.name) : (award.name || award.name_ar)}
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
            <h3 className={`text-[10px] font-semibold uppercase tracking-[0.2em] mb-4 ${textAlignClass}`} style={{ color: "rgba(255,255,255,0.25)" }}>
              {t("followMe", lang)}
            </h3>
            <div className={`flex ${justifyClass} flex-wrap gap-3`}>
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
                  title={isRtl ? "اتصل" : "Call"}
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
          <div className={`${extra.link_layout === "grid" ? "grid grid-cols-2 gap-3" : "space-y-3"} mb-8 transition-all duration-700 delay-500 ${animated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
            <h3 className={`text-[10px] font-semibold uppercase tracking-[0.2em] mb-4 ${textAlignClass} ${extra.link_layout === "grid" ? "col-span-2" : ""}`} style={{ color: "rgba(255,255,255,0.25)" }}>
              {t("links", lang)}
            </h3>
            {items.map((item, index) => (
              <a
                key={item.id}
                href={item.url.startsWith("http") ? item.url : `https://${item.url}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => handleLinkClick(item.id)}
                className={`group relative flex ${extra.link_layout === "grid" ? "flex-col items-center text-center py-5" : "items-center"} gap-3 px-5 py-4 ${btnStyle} backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] overflow-hidden`}
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
                  <img src={item.thumbnail_url} alt="" className={`${extra.link_layout === "grid" ? "h-12 w-12" : "h-10 w-10"} rounded-lg object-cover shrink-0 relative z-10`} loading="lazy" />
                )}
                {item.icon && !item.thumbnail_url && (
                  <span className={`${extra.link_layout === "grid" ? "text-2xl" : "text-xl"} shrink-0 relative z-10`}>{item.icon}</span>
                )}
                <span className={`${extra.link_layout === "grid" ? "" : "flex-1"} font-medium ${textAlignClass} relative z-10 ${fontSize.link}`}>
                  {isRtl ? (item.title_ar || item.title) : item.title}
                </span>
                {extra.link_layout !== "grid" && (
                  <ExternalLink className="h-4 w-4 opacity-20 group-hover:opacity-60 transition-opacity shrink-0 relative z-10" />
                )}
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
              {t("noLinks", lang)}
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
              {t("viewProfile", lang)}
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
              {t("editPage", lang)}
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
              {t("createPage", lang)}
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
