import { useParams, useSearchParams } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { useSocialLinkPageByUsername } from "@/hooks/useSocialLinkPage";
import { SEOHead } from "@/components/SEOHead";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ExternalLink, Instagram, Twitter, Facebook, Linkedin, Youtube, Globe,
  User, ArrowLeft, Share2, Check, BadgeCheck, MapPin, Briefcase, Award, Link2,
  Pencil, LogIn, Phone, MessageCircle, Eye, Users, UserPlus, UserCheck, Loader2,
  Lock, Mail
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
import {
  THEME_COLORS, BUTTON_STYLES_MAP, FONT_MAP, FONT_SIZE_MAP,
  parseExtra, getButtonStyleOverrides, getVideoEmbedUrl, isVideoLink,
  type ExtraSettings,
} from "@/lib/socialLinksConstants";

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
  editPage: { ar: "تعديل الصفحة", en: "Edit Page", fr: "Modifier", es: "Editar", de: "Bearbeiten", tr: "Düzenle", pt: "Editar", zh: "编辑", ja: "編集", ko: "편집" },
  createPage: { ar: "أنشئ صفحتك", en: "Create your page", fr: "Créez votre page", es: "Crea tu página", de: "Erstelle deine Seite", tr: "Sayfanı oluştur", pt: "Crie sua página", zh: "创建页面", ja: "ページを作る", ko: "페이지 만들기" },
  notFound: { ar: "الصفحة غير موجودة", en: "Page not found", fr: "Page introuvable", es: "Página no encontrada", de: "Seite nicht gefunden", tr: "Sayfa bulunamadı", pt: "Página não encontrada", zh: "页面未找到", ja: "ページが見つかりません", ko: "페이지를 찾을 수 없습니다" },
  notFoundDesc: { ar: "هذه الصفحة غير موجودة أو لم يتم إنشاؤها بعد", en: "This page doesn't exist or hasn't been created yet", fr: "Cette page n'existe pas", es: "Esta página no existe", de: "Diese Seite existiert nicht", tr: "Bu sayfa mevcut değil", pt: "Esta página não existe", zh: "此页面不存在", ja: "このページは存在しません", ko: "이 페이지가 존재하지 않습니다" },
  goHome: { ar: "الرئيسية", en: "Home", fr: "Accueil", es: "Inicio", de: "Start", tr: "Ana Sayfa", pt: "Início", zh: "首页", ja: "ホーム", ko: "홈" },
  linkCopied: { ar: "تم نسخ الرابط", en: "Link copied!", fr: "Lien copié !", es: "¡Enlace copiado!", de: "Link kopiert!", tr: "Kopyalandı!", pt: "Link copiado!", zh: "已复制！", ja: "コピーしました！", ko: "복사되었습니다!" },
  noLinks: { ar: "لا توجد روابط بعد", en: "No links yet", fr: "Aucun lien", es: "Sin enlaces", de: "Keine Links", tr: "Henüz bağlantı yok", pt: "Sem links", zh: "暂无链接", ja: "リンクなし", ko: "링크 없음" },
  nationality: { ar: "الجنسية", en: "Nationality", fr: "Nationalité", es: "Nacionalidad", de: "Nationalität", tr: "Uyruk", pt: "Nacionalidade", zh: "国籍", ja: "国籍", ko: "국적" },
  residence: { ar: "الإقامة", en: "Residence", fr: "Résidence", es: "Residencia", de: "Wohnsitz", tr: "İkamet", pt: "Residência", zh: "居住地", ja: "居住地", ko: "거주지" },
  about: { ar: "نبذة", en: "About", fr: "À propos", es: "Acerca de", de: "Über", tr: "Hakkında", pt: "Sobre", zh: "关于", ja: "紹介", ko: "소개" },
  contactTitle: { ar: "تواصل معي", en: "Get in Touch", fr: "Contactez-moi", es: "Contáctame", de: "Kontakt", tr: "İletişim", pt: "Contato", zh: "联系我", ja: "お問い合わせ", ko: "연락하기" },
  contactName: { ar: "الاسم", en: "Name", fr: "Nom", es: "Nombre", de: "Name", tr: "Ad", pt: "Nome", zh: "姓名", ja: "名前", ko: "이름" },
  contactEmail: { ar: "البريد الإلكتروني", en: "Email", fr: "Email", es: "Email", de: "E-Mail", tr: "E-posta", pt: "Email", zh: "邮箱", ja: "メール", ko: "이메일" },
  contactMessage: { ar: "الرسالة", en: "Message", fr: "Message", es: "Mensaje", de: "Nachricht", tr: "Mesaj", pt: "Mensagem", zh: "消息", ja: "メッセージ", ko: "메시지" },
  contactSend: { ar: "إرسال", en: "Send", fr: "Envoyer", es: "Enviar", de: "Senden", tr: "Gönder", pt: "Enviar", zh: "发送", ja: "送信", ko: "보내기" },
  contactSent: { ar: "تم الإرسال ✓", en: "Sent ✓", fr: "Envoyé ✓", es: "Enviado ✓", de: "Gesendet ✓", tr: "Gönderildi ✓", pt: "Enviado ✓", zh: "已发送 ✓", ja: "送信済 ✓", ko: "전송됨 ✓" },
  all: { ar: "الكل", en: "All", fr: "Tout", es: "Todo", de: "Alle", tr: "Tümü", pt: "Tudo", zh: "全部", ja: "すべて", ko: "전체" },
  passwordProtected: { ar: "هذه الصفحة محمية بكلمة مرور", en: "This page is password protected", fr: "Page protégée par mot de passe", es: "Página protegida con contraseña", de: "Passwortgeschützte Seite", tr: "Şifre korumalı sayfa", pt: "Página protegida por senha", zh: "此页面受密码保护", ja: "パスワード保護ページ", ko: "비밀번호 보호 페이지" },
  enterPassword: { ar: "أدخل كلمة المرور", en: "Enter password", fr: "Entrez le mot de passe", es: "Ingrese contraseña", de: "Passwort eingeben", tr: "Şifre girin", pt: "Digite a senha", zh: "输入密码", ja: "パスワードを入力", ko: "비밀번호 입력" },
  unlock: { ar: "فتح", en: "Unlock", fr: "Déverrouiller", es: "Desbloquear", de: "Entsperren", tr: "Aç", pt: "Desbloquear", zh: "解锁", ja: "ロック解除", ko: "잠금 해제" },
  wrongPassword: { ar: "كلمة المرور غير صحيحة", en: "Wrong password", fr: "Mot de passe incorrect", es: "Contraseña incorrecta", de: "Falsches Passwort", tr: "Yanlış şifre", pt: "Senha incorreta", zh: "密码错误", ja: "パスワードが違います", ko: "비밀번호가 틀렸습니다" },
  subscribe: { ar: "اشتراك", en: "Subscribe", fr: "S'abonner", es: "Suscribirse", de: "Abonnieren", tr: "Abone Ol", pt: "Inscrever-se", zh: "订阅", ja: "登録", ko: "구독" },
  subscribed: { ar: "تم الاشتراك ✓", en: "Subscribed ✓", fr: "Abonné ✓", es: "Suscrito ✓", de: "Abonniert ✓", tr: "Abone Olundu ✓", pt: "Inscrito ✓", zh: "已订阅 ✓", ja: "登録済 ✓", ko: "구독됨 ✓" },
};

function t(key: string, lang: LangCode): string {
  return T[key]?.[lang] || T[key]?.en || key;
}

const SOCIAL_ICONS: Record<string, { icon: typeof Instagram; label: string; urlPrefix?: string; hoverColor: string }> = {
  instagram: { icon: Instagram, label: "Instagram", urlPrefix: "https://instagram.com/", hoverColor: "#E1306C" },
  twitter: { icon: Twitter, label: "X / Twitter", urlPrefix: "https://x.com/", hoverColor: "#1DA1F2" },
  facebook: { icon: Facebook, label: "Facebook", urlPrefix: "https://facebook.com/", hoverColor: "#1877F2" },
  linkedin: { icon: Linkedin, label: "LinkedIn", urlPrefix: "https://linkedin.com/in/", hoverColor: "#0A66C2" },
  youtube: { icon: Youtube, label: "YouTube", urlPrefix: "https://youtube.com/@", hoverColor: "#FF0000" },
  tiktok: { icon: Globe, label: "TikTok", urlPrefix: "https://tiktok.com/@", hoverColor: "#ffffff" },
  snapchat: { icon: Globe, label: "Snapchat", urlPrefix: "https://snapchat.com/add/", hoverColor: "#FFFC00" },
  website: { icon: Globe, label: "Website", hoverColor: "#10B981" },
};

// Note: BUTTON_STYLES_MAP, FONT_MAP, FONT_SIZE_MAP, THEME_COLORS, ExtraSettings, parseExtra
// are all imported from @/lib/socialLinksConstants

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

function formatCompact(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return n.toString();
}

// ── Floating Particles ──
const FloatingParticles = memo(function FloatingParticles({ color, count = 20 }: { color: string; count?: number }) {
  const particles = useMemo(() => Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 2 + Math.random() * 3,
    duration: 8 + Math.random() * 12,
    delay: Math.random() * 5,
  })), [count]);

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute rounded-full animate-pulse"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            background: color || "rgba(255,255,255,0.15)",
            opacity: 0.3,
            animation: `float-particle ${p.duration}s ease-in-out ${p.delay}s infinite alternate`,
          }}
        />
      ))}
      <style>{`
        @keyframes float-particle {
          0% { transform: translateY(0) translateX(0); opacity: 0.1; }
          50% { opacity: 0.4; }
          100% { transform: translateY(-80px) translateX(30px); opacity: 0.05; }
        }
      `}</style>
    </div>
  );
});

// ── Typing Text Animation ──
const TypingText = memo(function TypingText({ text, speed = 40, style, className }: { text: string; speed?: number; style?: React.CSSProperties; className?: string }) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!text) return;
    setDisplayed("");
    setDone(false);
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) { clearInterval(interval); setDone(true); }
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed]);

  return (
    <span className={className} style={style}>
      {displayed}
      {!done && <span className="animate-pulse">|</span>}
    </span>
  );
});

// ── Video Embed ──
const VideoEmbed = memo(function VideoEmbed({ url, theme }: { url: string; theme: any }) {
  const embedUrl = getVideoEmbedUrl(url);
  if (!embedUrl) return null;
  return (
    <div className="rounded-2xl overflow-hidden mb-3" style={{ border: `1px solid ${theme.border}`, background: theme.card }}>
      <div className="relative" style={{ paddingBottom: "56.25%" }}>
        <iframe
          src={embedUrl}
          className="absolute inset-0 w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
          style={{ border: "none" }}
        />
      </div>
    </div>
  );
});

// ── Contact Form ──
function ContactFormSection({ theme, lang, isRtl, profileUserId, ownerName }: {
  theme: any; lang: LangCode; isRtl: boolean; profileUserId: string; ownerName: string;
}) {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  const handleSend = useCallback(async () => {
    if (!form.name || !form.email || !form.message) return;
    setSending(true);
    try {
      // Store message in notifications table as contact_form type
      const { error } = await supabase.from("notifications").insert({
        user_id: profileUserId,
        title: `📩 ${form.name}`,
        title_ar: `📩 ${form.name}`,
        body: `${form.email}: ${form.message}`,
        body_ar: `${form.email}: ${form.message}`,
        type: "contact_form",
        metadata: { sender_name: form.name, sender_email: form.email, message: form.message },
      });
      if (error) throw error;
      setSent(true);
      setForm({ name: "", email: "", message: "" });
      toast({ title: t("contactSent", lang) });
    } catch {
      toast({ title: "Error", variant: "destructive" });
    } finally {
      setSending(false);
    }
  }, [form, profileUserId, lang, toast]);

  if (sent) {
    return (
      <div className="text-center py-6 rounded-2xl" style={{ background: theme.card, border: `1px solid ${theme.border}` }}>
        <Check className="h-8 w-8 mx-auto mb-2" style={{ color: theme.accent }} />
        <p className="text-sm font-semibold" style={{ color: theme.text }}>{t("contactSent", lang)}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-2xl p-5" style={{ background: theme.card, border: `1px solid ${theme.border}` }}>
      <input
        value={form.name}
        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
        placeholder={t("contactName", lang)}
        className="w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all duration-200"
        style={{ background: theme.btnBg, border: `1px solid ${theme.border}`, color: theme.text }}
        onFocus={e => (e.target.style.borderColor = theme.accent)}
        onBlur={e => (e.target.style.borderColor = theme.border)}
      />
      <input
        type="email"
        value={form.email}
        onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
        placeholder={t("contactEmail", lang)}
        className="w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all duration-200"
        dir="ltr"
        style={{ background: theme.btnBg, border: `1px solid ${theme.border}`, color: theme.text }}
        onFocus={e => (e.target.style.borderColor = theme.accent)}
        onBlur={e => (e.target.style.borderColor = theme.border)}
      />
      <textarea
        value={form.message}
        onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
        placeholder={t("contactMessage", lang)}
        rows={3}
        className="w-full rounded-xl px-4 py-2.5 text-sm outline-none resize-none transition-all duration-200"
        style={{ background: theme.btnBg, border: `1px solid ${theme.border}`, color: theme.text }}
        onFocus={e => (e.target.style.borderColor = theme.accent)}
        onBlur={e => (e.target.style.borderColor = theme.border)}
      />
      <button
        onClick={handleSend}
        disabled={sending || !form.name || !form.email || !form.message}
        className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
        style={{
          background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent}dd)`,
          color: theme.bg.includes("fff") ? "#ffffff" : "#0a0a12",
          boxShadow: `0 4px 20px ${theme.accentLight}`,
        }}
      >
        {sending ? "..." : t("contactSend", lang)}
      </button>
    </div>
  );
}

// ── Divider component ──
function SectionDivider({ color }: { color: string }) {
  return (
    <div className="flex items-center justify-center gap-3 my-5">
      <div className="h-px flex-1 max-w-[60px]" style={{ background: `linear-gradient(to right, transparent, ${color})` }} />
      <div className="h-1 w-1 rounded-full" style={{ background: color }} />
      <div className="h-px flex-1 max-w-[60px]" style={{ background: `linear-gradient(to left, transparent, ${color})` }} />
    </div>
  );
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
  const [activePage, setActivePage] = useState("main");

  const langParam = searchParams.get("lang") as LangCode | null;
  const lang: LangCode = SUPPORTED_LANGUAGES.find(l => l.code === langParam)?.code || (appLanguage === "ar" ? "ar" : "en");
  const isRtl = SUPPORTED_LANGUAGES.find(l => l.code === lang)?.dir === "rtl";
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

  const { data: followStats } = useFollowStats(profileUserId || undefined);
  const { data: isFollowing } = useIsFollowing(profileUserId || undefined);
  const { data: pendingRequest } = usePendingFollowRequest(profileUserId || undefined);
  const toggleFollow = useToggleFollow(profileUserId || undefined);
  const { data: countries } = useCountries();

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Fire-and-forget: increment view count and record visit
  useEffect(() => {
    if (!profileUserId || isOwner) return;
    supabase.rpc("increment_field" as any, {
      table_name: "profiles_public",
      field_name: "view_count",
      row_id: profileUserId,
    }).then(() => {});

    // Record visit for advanced analytics
    if (data?.page?.id) {
      const ua = navigator.userAgent;
      const isMobile = /Mobi|Android|iPhone/i.test(ua);
      const isTablet = /iPad|Tablet/i.test(ua);
      const deviceType = isMobile ? "mobile" : isTablet ? "tablet" : "desktop";
      const browser = /Firefox/i.test(ua) ? "Firefox" : /Edg/i.test(ua) ? "Edge" : /Chrome/i.test(ua) ? "Chrome" : /Safari/i.test(ua) ? "Safari" : "Other";
      supabase.from("social_link_visits").insert({
        page_id: data.page.id,
        device_type: deviceType,
        browser,
        referrer: document.referrer || null,
        page_url: window.location.href,
      } as any).then(() => {});
    }
  }, [profileUserId, isOwner, data?.page?.id]);

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
      try { await navigator.share({ title: `${username} - Altoha`, url: buildSocialLinksUrl(username) }); } catch {}
    } else { copyLink(); }
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
          <p className="mt-2 text-sm max-w-xs" style={{ color: "rgba(255,255,255,0.35)" }}>{t("notFoundDesc", lang)}</p>
        </div>
        <Button asChild variant="outline" size="sm" className="mt-2" style={{ borderColor: "rgba(255,255,255,0.12)", color: "#ffffff", background: "rgba(255,255,255,0.04)" }}>
          <Link to="/"><ArrowLeft className="me-1.5 h-3.5 w-3.5" />{t("goHome", lang)}</Link>
        </Button>
      </div>
    );
  }

  const { profile, page, items } = data;
  const themeId = page?.theme || "default";
  const theme = THEME_COLORS[themeId] || THEME_COLORS.default;
  const btnStyle = BUTTON_STYLES_MAP[page?.button_style || "rounded"] || BUTTON_STYLES_MAP.rounded;
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

  // Filter items by active page
  const filteredItems = activePage === "main" || !extra.pages.length ? items : items;

  const hasMultiPages = extra.pages && extra.pages.length > 0;

  // Password protection state
  const [passwordUnlocked, setPasswordUnlocked] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState(false);
  const needsPassword = extra.enable_password && extra.page_password && !isOwner && !passwordUnlocked;

  const handlePasswordSubmit = useCallback(() => {
    if (passwordInput === extra.page_password) {
      setPasswordUnlocked(true);
      setPasswordError(false);
    } else {
      setPasswordError(true);
    }
  }, [passwordInput, extra.page_password]);

  // Email subscription state
  const [subEmail, setSubEmail] = useState("");
  const [subName, setSubName] = useState("");
  const [subscribing, setSubscribing] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = useCallback(async () => {
    if (!subEmail || !data?.page?.id || !profileUserId) return;
    setSubscribing(true);
    try {
      const { error } = await supabase.from("bio_subscribers").insert({
        page_id: data.page.id,
        page_owner_id: profileUserId,
        email: subEmail,
        name: subName || null,
      } as any);
      if (error) {
        if (error.code === "23505") {
          toast({ title: t("subscribed", lang) });
          setSubscribed(true);
        } else throw error;
      } else {
        setSubscribed(true);
        toast({ title: t("subscribed", lang) });
        setSubEmail("");
        setSubName("");
      }
    } catch {
      toast({ title: "Error", variant: "destructive" });
    } finally {
      setSubscribing(false);
    }
  }, [subEmail, subName, data?.page?.id, profileUserId, lang, toast]);

  // Password gate
  if (needsPassword) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6" dir={contentDir} style={{ background: theme.bg, fontFamily, color: theme.text }}>
        {googleFontLink && <link rel="stylesheet" href={googleFontLink} />}
        <div className="w-full max-w-xs space-y-6 text-center">
          <div className="mx-auto rounded-full p-5" style={{ background: theme.card, border: `1px solid ${theme.border}` }}>
            <Lock className="h-8 w-8 mx-auto" style={{ color: theme.accent }} />
          </div>
          <div>
            <h1 className="text-lg font-bold mb-1" style={{ color: theme.text }}>{t("passwordProtected", lang)}</h1>
            <p className="text-xs" style={{ color: theme.textMuted }}>{displayName}</p>
          </div>
          <div className="space-y-3">
            <input
              type="password"
              value={passwordInput}
              onChange={e => { setPasswordInput(e.target.value); setPasswordError(false); }}
              onKeyDown={e => e.key === "Enter" && handlePasswordSubmit()}
              placeholder={t("enterPassword", lang)}
              className="w-full rounded-xl px-4 py-3 text-sm text-center outline-none transition-all"
              style={{ background: theme.btnBg, border: `1px solid ${passwordError ? "#ef4444" : theme.border}`, color: theme.text }}
            />
            {passwordError && <p className="text-xs" style={{ color: "#ef4444" }}>{t("wrongPassword", lang)}</p>}
            <button
              onClick={handlePasswordSubmit}
              className="w-full py-3 rounded-xl text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent}dd)`, color: isLight ? "#ffffff" : "#0a0a12" }}
            >
              {t("unlock", lang)}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex min-h-screen flex-col items-center relative"
      dir={contentDir}
      style={{ background: theme.bg, fontFamily, color: theme.text }}
    >
      {/* Floating Particles */}
      {extra.enable_particles && (
        <FloatingParticles color={extra.particle_color || theme.accent} />
      )}
      {/* Custom CSS */}
      {extra.custom_user_css && (
        <style dangerouslySetInnerHTML={{ __html: extra.custom_user_css }} />
      )}
      {googleFontLink && <link rel="stylesheet" href={googleFontLink} />}
      <SEOHead
        title={`${displayName} (@${username}) - Altoha`}
        description={bio ? `${bio.slice(0, 150)}` : `${displayName}'s links, bio & contact on Altoha`}
        ogImage={coverImage || profile.avatar_url || undefined}
        ogType="profile"
        canonical={buildSocialLinksUrl(username)}
        lang={lang}
        keywords={[displayName, username, jobTitle, specialization, "bio", "links", "altoha"].filter(Boolean).join(", ")}
        author={displayName}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "ProfilePage",
          name: displayName,
          description: bio || `${displayName}'s links on Altoha`,
          url: buildSocialLinksUrl(username),
          image: coverImage || profile.avatar_url || undefined,
          dateModified: page?.updated_at || undefined,
          mainEntity: {
            "@type": "Person",
            name: displayName,
            alternateName: `@${username}`,
            jobTitle: jobTitle || specialization || undefined,
            url: buildSocialLinksUrl(username),
            image: profile.avatar_url || undefined,
            ...(city && countryCode ? { address: { "@type": "PostalAddress", addressLocality: city, addressCountry: countryCode } } : {}),
            sameAs: socialPlatforms.map(s => {
              const info = SOCIAL_ICONS[s.key];
              return s.value?.startsWith("http") ? s.value : (info?.urlPrefix ? `${info.urlPrefix}${s.value}` : undefined);
            }).filter(Boolean),
          },
          ...(items.length > 0 ? {
            hasPart: items.slice(0, 10).map(item => ({
              "@type": "WebPage",
              name: item.title,
              url: item.url,
            })),
          } : {}),
        }}
      />

      {/* Cover / Hero */}
      <div className="relative w-full" style={{ height: hasCover ? "280px" : "160px" }}>
        {hasCover ? (
          <>
            <img src={coverImage} alt="" className="absolute inset-0 w-full h-full object-cover" loading="eager" />
            <div className="absolute inset-0" style={{ background: `linear-gradient(to bottom, transparent 0%, ${isLight ? "#ffffff" : "#0a0a12"} 100%)` }} />
          </>
        ) : (
          <div className="absolute inset-0" style={{
            background: `radial-gradient(ellipse at 50% 0%, ${theme.accentLight} 0%, transparent 60%)`
          }} />
        )}

        {/* Top Actions */}
        <div className={`absolute top-4 ${contentDir === "rtl" ? "left-4" : "right-4"} z-20 flex gap-2 transition-all duration-700 ${animated ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"}`}>
          {isOwner && (
            <Link
              to="/social-links"
              className="flex h-9 w-9 items-center justify-center rounded-full backdrop-blur-xl transition-all duration-300 hover:scale-110 active:scale-95"
              style={{ backgroundColor: theme.accentLight, border: `1px solid ${theme.accentMedium}`, color: theme.accent }}
              title={t("editPage", lang)}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Link>
          )}
          <button
            onClick={shareNative}
            className="flex h-9 w-9 items-center justify-center rounded-full backdrop-blur-xl transition-all duration-300 hover:scale-110 active:scale-95"
            style={{ backgroundColor: theme.btnBg, border: `1px solid ${theme.border}`, color: theme.text }}
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Share2 className="h-3.5 w-3.5" />}
          </button>
        </div>

        {/* Language Switcher */}
        {extra.show_language_switcher && (
          <div className={`absolute top-4 ${contentDir === "rtl" ? "right-4" : "left-4"} z-20 transition-all duration-700 ${animated ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"}`}>
            <div className="relative group">
              <button
                className="flex h-9 w-9 items-center justify-center rounded-full backdrop-blur-xl transition-all duration-300 hover:scale-110 active:scale-95"
                style={{ backgroundColor: theme.btnBg, border: `1px solid ${theme.border}`, color: theme.text }}
              >
                <Globe className="h-3.5 w-3.5" />
              </button>
              <div className="absolute top-11 start-0 min-w-[140px] rounded-xl overflow-hidden opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:pointer-events-auto transition-all duration-200 z-50 shadow-2xl"
                style={{ background: isLight ? "rgba(255,255,255,0.95)" : "rgba(20,20,30,0.95)", border: `1px solid ${theme.border}`, backdropFilter: "blur(20px)" }}
              >
                {SUPPORTED_LANGUAGES.map(l => (
                  <button
                    key={l.code}
                    onClick={() => setLang(l.code)}
                    className="w-full text-start px-4 py-2 text-xs font-medium transition-colors flex items-center justify-between"
                    style={{
                      color: lang === l.code ? theme.accent : theme.textMuted,
                      backgroundColor: lang === l.code ? theme.accentLight : "transparent",
                    }}
                    onMouseEnter={e => { if (lang !== l.code) (e.target as HTMLElement).style.backgroundColor = theme.btnHover; }}
                    onMouseLeave={e => { if (lang !== l.code) (e.target as HTMLElement).style.backgroundColor = "transparent"; }}
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
          <h1 className={`font-bold tracking-tight ${fontSize.name}`} style={{ color: theme.text, textShadow: isLight ? "none" : "0 2px 20px rgba(0,0,0,0.3)" }}>
            {title}
          </h1>

          <p className="mt-1 font-medium" style={{ fontSize: "11px", color: theme.textMuted, letterSpacing: "1.5px" }}>
            @{profile.username}
          </p>

          {extra.show_job_title && (jobTitle || specialization) && (
            <p className={`mt-2.5 flex items-center ${justifyClass} gap-1.5 font-medium ${fontSize.meta}`} style={{ color: theme.textMuted }}>
              <Briefcase className="h-3 w-3" style={{ color: theme.accent }} />
              {jobTitle || specialization}
            </p>
          )}

          {extra.show_location && (city || countryCode) && (
            <p className={`mt-1 flex items-center ${justifyClass} gap-1.5 font-medium ${fontSize.meta}`} style={{ color: theme.textMuted }}>
              <MapPin className="h-3 w-3" style={{ color: theme.accent }} />
              {city}{city && countryCode ? ", " : ""}{countryCode && getCountryName(countryCode)} {countryCode && countryFlag(countryCode)}
            </p>
          )}

          {extra.show_flags && showNationality && (nationalityCode || secondNationalityCode) && (
            <div className={`flex items-center ${justifyClass} flex-wrap gap-2 mt-2.5`}>
              {nationalityCode && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium"
                  style={{ background: theme.card, border: `1px solid ${theme.border}`, color: theme.textMuted }}>
                  <span className="text-sm leading-none">{countryFlag(nationalityCode)}</span>
                  {getCountryName(nationalityCode)}
                </span>
              )}
              {secondNationalityCode && secondNationalityCode !== nationalityCode && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium"
                  style={{ background: theme.card, border: `1px solid ${theme.border}`, color: theme.textMuted }}>
                  <span className="text-sm leading-none">{countryFlag(secondNationalityCode)}</span>
                  {getCountryName(secondNationalityCode)}
                </span>
              )}
            </div>
          )}

          {extra.show_membership && membershipTier && membershipTier !== "free" && (
            <div className="mt-2.5">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-[10px] font-semibold rounded-full capitalize tracking-wide"
                style={{ background: `linear-gradient(135deg, ${theme.accentLight}, ${theme.accentLight}88)`, color: theme.accent, border: `1px solid ${theme.accentMedium}` }}>
                ✦ {membershipTier}
              </span>
            </div>
          )}
        </div>

        {/* Stats Row */}
        {(extra.show_followers || (extra.show_stats && hasStats)) && (
          <div className={`transition-all duration-700 delay-300 ${animated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
            <div className={`flex items-center ${justifyClass} gap-0 rounded-2xl overflow-hidden mb-5`}
              style={{ background: theme.card, border: `1px solid ${theme.border}` }}>
              {extra.show_followers && (
                <div className="flex-1 text-center py-3.5 px-3">
                  <p className="text-lg font-bold tabular-nums" style={{ color: theme.text }}>{formatCompact(followersCount)}</p>
                  <p className="text-[9px] uppercase tracking-[0.15em] font-medium" style={{ color: theme.textMuted }}>{t("followers", lang)}</p>
                </div>
              )}
              {extra.show_stats && yearsExp && (
                <>
                  <div className="w-px h-8" style={{ background: theme.border }} />
                  <div className="flex-1 text-center py-3.5 px-3">
                    <p className="text-lg font-bold tabular-nums" style={{ color: theme.text }}>
                      <AnimatedNumber value={yearsExp} /><span style={{ color: theme.accent }}>+</span>
                    </p>
                    <p className="text-[9px] uppercase tracking-[0.15em] font-medium" style={{ color: theme.textMuted }}>{t("yearsExp", lang)}</p>
                  </div>
                </>
              )}
              {extra.show_stats && extra.show_views && viewCount > 0 && (
                <>
                  <div className="w-px h-8" style={{ background: theme.border }} />
                  <div className="flex-1 text-center py-3.5 px-3">
                    <p className="text-lg font-bold tabular-nums" style={{ color: theme.text }}>
                      <AnimatedNumber value={viewCount} />
                    </p>
                    <p className="text-[9px] uppercase tracking-[0.15em] font-medium" style={{ color: theme.textMuted }}>{t("views", lang)}</p>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Follow Button */}
        {extra.show_followers && !isOwner && (
          <div className={`flex ${justifyClass} mb-5 transition-all duration-700 delay-320 ${animated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
            <button
              onClick={handleFollow}
              disabled={toggleFollow.isPending || !user}
              className="group relative inline-flex items-center gap-2 px-7 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50"
              style={{
                background: isFollowing ? theme.card : `linear-gradient(135deg, ${theme.accent}, ${theme.accent}dd)`,
                border: isFollowing ? `1px solid ${theme.border}` : "none",
                color: isFollowing ? theme.textMuted : (isLight ? "#ffffff" : "#0a0a12"),
                boxShadow: isFollowing ? "none" : `0 4px 20px ${theme.accentLight}`,
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
              {toggleFollow.isPending ? "..." : isFollowing ? t("following", lang) : pendingRequest ? t("requested", lang) : t("follow", lang)}
            </button>
          </div>
        )}

        {/* Bio */}
        {extra.show_bio && bio && (
          <div className={`mb-5 transition-all duration-700 delay-350 ${animated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
            {extra.enable_typing_animation ? (
              <TypingText
                text={bio}
                speed={35}
                className={`leading-relaxed ${textAlignClass} ${fontSize.bio} block`}
                style={{ color: theme.textMuted }}
              />
            ) : (
              <p className={`leading-relaxed ${textAlignClass} ${fontSize.bio}`} dir="auto" style={{ color: theme.textMuted }}>
                {bio}
              </p>
            )}
          </div>
        )}

        {/* Awards */}
        {extra.show_awards && globalAwards && Array.isArray(globalAwards) && globalAwards.length > 0 && (
          <div className={`mb-5 transition-all duration-700 delay-400 ${animated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
            <h3 className={`text-[9px] font-semibold uppercase tracking-[0.2em] mb-3 ${textAlignClass}`} style={{ color: theme.accent }}>
              {t("awards", lang)}
            </h3>
            <div className="space-y-1.5">
              {globalAwards.map((award: any, i: number) => (
                <div key={i} className="flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200"
                  style={{ background: theme.card, border: `1px solid ${theme.border}` }}>
                  <span className="text-base">
                    {award.icon === "gold" ? "🏅" : award.icon === "tabakh" ? "👨‍🍳" : "🏆"}
                  </span>
                  <span className="flex-1 text-xs font-medium" style={{ color: theme.textMuted }}>
                    {isRtl ? (award.name_ar || award.name) : (award.name || award.name_ar)}
                  </span>
                  {award.year && <span className="text-[10px] font-medium tabular-nums" style={{ color: `${theme.textMuted}88` }}>{award.year}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

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
                  <a
                    key={key}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative flex h-11 w-11 items-center justify-center rounded-full transition-all duration-300 hover:scale-110 active:scale-95"
                    style={{ background: theme.btnBg, border: `1px solid ${theme.border}`, color: theme.text }}
                    title={info.label}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.backgroundColor = `${info.hoverColor}22`;
                      (e.currentTarget as HTMLElement).style.borderColor = `${info.hoverColor}44`;
                      (e.currentTarget as HTMLElement).style.color = info.hoverColor;
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.backgroundColor = theme.btnBg;
                      (e.currentTarget as HTMLElement).style.borderColor = theme.border;
                      (e.currentTarget as HTMLElement).style.color = theme.text;
                    }}
                  >
                    <Icon className="h-[18px] w-[18px]" />
                  </a>
                );
              })}
              {whatsapp && (
                <a
                  href={`https://wa.me/${whatsapp.replace(/[^0-9+]/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative flex h-11 w-11 items-center justify-center rounded-full transition-all duration-300 hover:scale-110 active:scale-95"
                  style={{ background: "rgba(37,211,102,0.08)", border: "1px solid rgba(37,211,102,0.15)", color: "#25d366" }}
                  title="WhatsApp"
                >
                  <MessageCircle className="h-[18px] w-[18px]" />
                </a>
              )}
              {phone && (
                <a
                  href={`tel:${phone}`}
                  className="group relative flex h-11 w-11 items-center justify-center rounded-full transition-all duration-300 hover:scale-110 active:scale-95"
                  style={{ background: theme.btnBg, border: `1px solid ${theme.border}`, color: theme.text }}
                  title={isRtl ? "اتصل" : "Call"}
                >
                  <Phone className="h-[18px] w-[18px]" />
                </a>
              )}
            </div>
          </div>
        )}

        {/* Divider before links */}
        {items.length > 0 && hasSocialIcons && (
          <SectionDivider color={theme.border} />
        )}

        {/* Multi-Page Tabs */}
        {hasMultiPages && (
          <div className={`mb-5 transition-all duration-700 delay-470 ${animated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
            <div className={`flex ${justifyClass} flex-wrap gap-1.5`}>
              <button
                onClick={() => setActivePage("main")}
                className="px-4 py-2 rounded-full text-xs font-semibold transition-all duration-300"
                style={{
                  background: activePage === "main" ? `linear-gradient(135deg, ${theme.accentLight}, ${theme.accentMedium})` : theme.btnBg,
                  border: `1px solid ${activePage === "main" ? theme.accentMedium : theme.border}`,
                  color: activePage === "main" ? theme.accent : theme.textMuted,
                }}
              >
                {t("all", lang)}
              </button>
              {extra.pages.map(pg => (
                <button
                  key={pg.id}
                  onClick={() => setActivePage(pg.id)}
                  className="px-4 py-2 rounded-full text-xs font-semibold transition-all duration-300"
                  style={{
                    background: activePage === pg.id ? `linear-gradient(135deg, ${theme.accentLight}, ${theme.accentMedium})` : theme.btnBg,
                    border: `1px solid ${activePage === pg.id ? theme.accentMedium : theme.border}`,
                    color: activePage === pg.id ? theme.accent : theme.textMuted,
                  }}
                >
                  {isRtl ? (pg.label_ar || pg.label) : pg.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Link Items */}
        {filteredItems.length > 0 && (
          <div className="mb-5">
            <div className={`${extra.link_layout === "grid" ? "grid grid-cols-2 gap-2.5" : "space-y-2.5"}`}>
              {filteredItems.filter(item => {
                // Schedule filtering
                const now = new Date();
                if ((item as any).scheduled_start && new Date((item as any).scheduled_start) > now) return false;
                if ((item as any).scheduled_end && new Date((item as any).scheduled_end) < now) return false;
                return true;
              }).map((item, index) => (
                <div key={item.id}>
                  <a
                    href={item.url.startsWith("http") ? item.url : `https://${item.url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => handleLinkClick(item.id)}
                    className={`group relative flex ${extra.link_layout === "grid" ? "flex-col items-center text-center py-5" : "items-center"} gap-3 px-5 py-3.5 ${btnStyle} backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] overflow-hidden`}
                    style={{
                      background: buttonColorStyle.backgroundColor || theme.card,
                      border: `1px solid ${buttonColorStyle.backgroundColor ? "transparent" : theme.border}`,
                      color: buttonColorStyle.color || theme.text,
                      opacity: animated ? 1 : 0,
                      transform: animated ? "translateY(0)" : "translateY(16px)",
                      transition: `all 0.5s cubic-bezier(0.4,0,0.2,1) ${500 + index * 80}ms`,
                      ...(!buttonColorStyle.backgroundColor ? getButtonStyleOverrides(page?.button_style || "rounded", theme.accent, theme.card, theme.border) : {}),
                    }}
                    onMouseEnter={e => {
                      if (!buttonColorStyle.backgroundColor) {
                        (e.currentTarget as HTMLElement).style.background = theme.btnHover;
                        (e.currentTarget as HTMLElement).style.borderColor = theme.accentMedium;
                      }
                    }}
                    onMouseLeave={e => {
                      if (!buttonColorStyle.backgroundColor) {
                        (e.currentTarget as HTMLElement).style.background = theme.card;
                        (e.currentTarget as HTMLElement).style.borderColor = theme.border;
                      }
                    }}
                  >
                    {/* Hover shine */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{
                      background: `linear-gradient(90deg, transparent 0%, ${theme.btnHover} 50%, transparent 100%)`
                    }} />

                    {item.thumbnail_url && (
                      <img src={item.thumbnail_url} alt="" className={`${extra.link_layout === "grid" ? "h-10 w-10" : "h-9 w-9"} rounded-lg object-cover shrink-0 relative z-10`} loading="lazy" />
                    )}
                    {item.icon && !item.thumbnail_url && (
                      <span className={`${extra.link_layout === "grid" ? "text-xl" : "text-lg"} shrink-0 relative z-10`}>{item.icon}</span>
                    )}
                    <span className={`${extra.link_layout === "grid" ? "" : "flex-1"} font-medium ${textAlignClass} relative z-10 ${fontSize.link}`}>
                      {isRtl ? (item.title_ar || item.title) : item.title}
                    </span>
                    {extra.link_layout !== "grid" && (
                      <ExternalLink className="h-3.5 w-3.5 opacity-20 group-hover:opacity-50 transition-opacity shrink-0 relative z-10" />
                    )}
                  </a>
                  {/* Video Embed Preview */}
                  {extra.show_video_embeds && isVideoLink(item.url) && (
                    <VideoEmbed url={item.url} theme={theme} />
                  )}
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
              {isRtl ? (extra.contact_form_title_ar || extra.contact_form_title) : (extra.contact_form_title || t("contactTitle", lang))}
            </h3>
            <ContactFormSection
              theme={theme}
              lang={lang}
              isRtl={isRtl}
              profileUserId={profileUserId}
              ownerName={displayName}
            />
          </div>
        )}

        {/* Email Collection */}
        {extra.enable_email_collection && profileUserId && !isOwner && (
          <div className={`mb-5 transition-all duration-700 delay-600 ${animated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
            <SectionDivider color={theme.border} />
            <div className="rounded-2xl p-5 space-y-3" style={{ background: theme.card, border: `1px solid ${theme.border}` }}>
              <div className="flex items-center gap-2 mb-1" style={{ justifyContent: extra.text_align === "start" ? "flex-start" : extra.text_align === "end" ? "flex-end" : "center" }}>
                <Mail className="h-4 w-4" style={{ color: theme.accent }} />
                <h3 className="text-sm font-semibold" style={{ color: theme.text }}>
                  {isRtl ? (extra.email_collection_title_ar || extra.email_collection_title) : (extra.email_collection_title || "Stay Connected")}
                </h3>
              </div>
              <p className="text-xs" style={{ color: theme.textMuted }}>
                {isRtl ? (extra.email_collection_description_ar || extra.email_collection_description) : (extra.email_collection_description || "Subscribe to get updates")}
              </p>
              {subscribed ? (
                <div className="text-center py-3">
                  <Check className="h-6 w-6 mx-auto mb-1" style={{ color: theme.accent }} />
                  <p className="text-xs font-semibold" style={{ color: theme.text }}>{t("subscribed", lang)}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <input
                    value={subName}
                    onChange={e => setSubName(e.target.value)}
                    placeholder={t("contactName", lang)}
                    className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
                    style={{ background: theme.btnBg, border: `1px solid ${theme.border}`, color: theme.text }}
                  />
                  <input
                    type="email"
                    value={subEmail}
                    onChange={e => setSubEmail(e.target.value)}
                    placeholder={t("contactEmail", lang)}
                    dir="ltr"
                    className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
                    style={{ background: theme.btnBg, border: `1px solid ${theme.border}`, color: theme.text }}
                  />
                  <button
                    onClick={handleSubscribe}
                    disabled={subscribing || !subEmail}
                    className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                    style={{
                      background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent}dd)`,
                      color: theme.bg.includes("fff") ? "#ffffff" : "#0a0a12",
                    }}
                  >
                    {subscribing ? <Loader2 className="h-4 w-4 mx-auto animate-spin" /> : t("subscribe", lang)}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {items.length === 0 && socialPlatforms.length === 0 && !whatsapp && !phone && (
          <div className={`text-center py-8 mb-5 rounded-2xl transition-all duration-700 delay-400 ${animated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
            style={{ background: theme.card, border: `1px solid ${theme.border}` }}>
            <Link2 className="h-7 w-7 mx-auto mb-2.5" style={{ color: theme.textMuted }} />
            <p className="text-xs font-medium" style={{ color: theme.textMuted }}>{t("noLinks", lang)}</p>
          </div>
        )}

        {/* View Full Profile */}
        {extra.show_full_profile_btn && (
          <div className={`mt-6 transition-all duration-700 delay-550 ${animated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            <Link
              to={`/${profile.username}`}
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl text-sm font-semibold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: `linear-gradient(135deg, ${theme.accentLight}, ${theme.accentLight}66)`,
                border: `1px solid ${theme.accentMedium}`,
                color: theme.accent,
              }}
            >
              <User className="h-4 w-4" />
              {t("viewProfile", lang)}
            </Link>
          </div>
        )}

        {/* Owner Edit Banner */}
        {isOwner && (
          <div className={`mt-3 transition-all duration-700 delay-600 ${animated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            <Link
              to="/social-links"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl text-xs font-semibold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: theme.card, border: `1px solid ${theme.border}`, color: theme.text }}
            >
              <Pencil className="h-3.5 w-3.5" />
              {t("editPage", lang)}
            </Link>
          </div>
        )}

        {/* Login CTA */}
        {!user && (
          <div className={`mt-3 transition-all duration-700 delay-600 ${animated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            <Link
              to="/auth"
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-2xl text-xs font-medium transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: theme.card, border: `1px solid ${theme.border}`, color: theme.textMuted }}
            >
              <LogIn className="h-3 w-3" />
              {t("createPage", lang)}
            </Link>
          </div>
        )}

        {/* Custom Footer */}
        {extra.show_footer && (extra.footer_text || extra.footer_text_ar) && (
          <div className={`mt-8 mb-4 text-center transition-all duration-700 delay-650 ${animated ? "opacity-100" : "opacity-0"}`}>
            <p className="text-xs" style={{ color: theme.textMuted }}>
              {isRtl ? (extra.footer_text_ar || extra.footer_text) : (extra.footer_text || extra.footer_text_ar)}
            </p>
          </div>
        )}

        {/* Footer Watermark */}
        <div className={`mt-${extra.show_footer ? '4' : '14'} text-center transition-all duration-700 delay-700 ${animated ? "opacity-100" : "opacity-0"}`}>
          <div className="inline-flex flex-col items-center gap-2">
            <div className="h-px w-12 mx-auto" style={{ background: `linear-gradient(90deg, transparent, ${theme.border}, transparent)` }} />
            <Link to="/" className="group inline-flex items-center gap-2 py-2 px-4 rounded-full transition-all duration-300 hover:scale-105"
              style={{ color: `${theme.textMuted}66` }}>
              <div className="h-5 w-5 rounded-md flex items-center justify-center transition-all duration-300 group-hover:shadow-lg"
                style={{ background: `linear-gradient(135deg, ${theme.accentLight}, ${theme.accentMedium})`, boxShadow: `0 0 12px ${theme.accentLight}` }}>
                <span className="text-[8px] font-extrabold" style={{ color: theme.accent }}>A</span>
              </div>
              <span className="text-[9px] font-semibold uppercase tracking-[0.25em] transition-colors group-hover:text-current" style={{ opacity: 0.5 }}>
                Altoha
              </span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
