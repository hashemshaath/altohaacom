import { Instagram, Twitter, Facebook, Linkedin, Youtube, Globe } from "lucide-react";

// ── Multi-language support (10 languages) ──
export const SUPPORTED_LANGUAGES = [
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

export type LangCode = typeof SUPPORTED_LANGUAGES[number]["code"];

export const T: Record<string, Record<LangCode, string>> = {
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

export function tl(key: string, lang: LangCode): string {
  return T[key]?.[lang] || T[key]?.en || key;
}

export const SOCIAL_ICONS: Record<string, { icon: typeof Instagram; label: string; urlPrefix?: string; hoverColor: string }> = {
  instagram: { icon: Instagram, label: "Instagram", urlPrefix: "https://instagram.com/", hoverColor: "#E1306C" },
  twitter: { icon: Twitter, label: "X / Twitter", urlPrefix: "https://x.com/", hoverColor: "#1DA1F2" },
  facebook: { icon: Facebook, label: "Facebook", urlPrefix: "https://facebook.com/", hoverColor: "#1877F2" },
  linkedin: { icon: Linkedin, label: "LinkedIn", urlPrefix: "https://linkedin.com/in/", hoverColor: "#0A66C2" },
  youtube: { icon: Youtube, label: "YouTube", urlPrefix: "https://youtube.com/@", hoverColor: "#FF0000" },
  tiktok: { icon: Globe, label: "TikTok", urlPrefix: "https://tiktok.com/@", hoverColor: "#ffffff" },
  snapchat: { icon: Globe, label: "Snapchat", urlPrefix: "https://snapchat.com/add/", hoverColor: "#FFFC00" },
  website: { icon: Globe, label: "Website", hoverColor: "#10B981" },
};

export const containsArabic = (text?: string | null) => !!text && /[\u0600-\u06FF]/.test(text);
export const containsLatin = (text?: string | null) => !!text && /[A-Za-z]/.test(text);

export const pickLocalizedText = (isArabicUi: boolean, arText?: string | null, enText?: string | null) => {
  const ar = (arText || "").trim();
  const en = (enText || "").trim();
  if (isArabicUi) return ar || (en && containsArabic(en) ? en : en) || "";
  if (en && !containsArabic(en)) return en;
  if (ar && containsLatin(ar)) return ar;
  return en || ar || "";
};

export function formatCompact(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return n.toString();
}
