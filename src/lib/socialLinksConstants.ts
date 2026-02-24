// ── Shared constants for Social Links bio page & editor ──

export interface ThemeColors {
  bg: string;
  card: string;
  text: string;
  textMuted: string;
  accent: string;
  accentLight: string;
  accentMedium: string;
  border: string;
  btnBg: string;
  btnHover: string;
}

export const THEME_COLORS: Record<string, ThemeColors> = {
  default: { bg: "linear-gradient(180deg, #0a0a12 0%, #0d0d18 50%, #0a0a12 100%)", card: "rgba(255,255,255,0.04)", text: "#f5f5f5", textMuted: "rgba(255,255,255,0.4)", accent: "#c4a265", accentLight: "rgba(196,162,101,0.12)", accentMedium: "rgba(196,162,101,0.25)", border: "rgba(255,255,255,0.08)", btnBg: "rgba(255,255,255,0.05)", btnHover: "rgba(255,255,255,0.08)" },
  dark: { bg: "linear-gradient(180deg, #0a0a0a 0%, #111111 50%, #0a0a0a 100%)", card: "rgba(255,255,255,0.03)", text: "#ffffff", textMuted: "rgba(255,255,255,0.35)", accent: "#818cf8", accentLight: "rgba(129,140,248,0.12)", accentMedium: "rgba(129,140,248,0.25)", border: "rgba(255,255,255,0.06)", btnBg: "rgba(255,255,255,0.04)", btnHover: "rgba(255,255,255,0.07)" },
  ocean: { bg: "linear-gradient(180deg, #0a1628 0%, #0c1e3a 50%, #0a1628 100%)", card: "rgba(255,255,255,0.05)", text: "#e0f0ff", textMuted: "rgba(224,240,255,0.4)", accent: "#38bdf8", accentLight: "rgba(56,189,248,0.12)", accentMedium: "rgba(56,189,248,0.25)", border: "rgba(56,189,248,0.1)", btnBg: "rgba(56,189,248,0.06)", btnHover: "rgba(56,189,248,0.12)" },
  sunset: { bg: "linear-gradient(180deg, #1a0a1e 0%, #2d1030 50%, #1a0a1e 100%)", card: "rgba(255,255,255,0.05)", text: "#ffe8f0", textMuted: "rgba(255,232,240,0.4)", accent: "#f472b6", accentLight: "rgba(244,114,182,0.12)", accentMedium: "rgba(244,114,182,0.25)", border: "rgba(244,114,182,0.1)", btnBg: "rgba(244,114,182,0.06)", btnHover: "rgba(244,114,182,0.12)" },
  forest: { bg: "linear-gradient(180deg, #0a1a0e 0%, #0e2a14 50%, #0a1a0e 100%)", card: "rgba(255,255,255,0.05)", text: "#e0ffe8", textMuted: "rgba(224,255,232,0.4)", accent: "#34d399", accentLight: "rgba(52,211,153,0.12)", accentMedium: "rgba(52,211,153,0.25)", border: "rgba(52,211,153,0.1)", btnBg: "rgba(52,211,153,0.06)", btnHover: "rgba(52,211,153,0.12)" },
  minimal: { bg: "linear-gradient(180deg, #ffffff 0%, #f8f9fa 50%, #ffffff 100%)", card: "rgba(0,0,0,0.03)", text: "#1a1a1a", textMuted: "rgba(0,0,0,0.45)", accent: "#3b82f6", accentLight: "rgba(59,130,246,0.1)", accentMedium: "rgba(59,130,246,0.2)", border: "rgba(0,0,0,0.08)", btnBg: "rgba(0,0,0,0.04)", btnHover: "rgba(0,0,0,0.07)" },
  candy: { bg: "linear-gradient(135deg, #ec4899 0%, #8b5cf6 50%, #6366f1 100%)", card: "rgba(255,255,255,0.15)", text: "#ffffff", textMuted: "rgba(255,255,255,0.7)", accent: "#fbbf24", accentLight: "rgba(251,191,36,0.2)", accentMedium: "rgba(251,191,36,0.35)", border: "rgba(255,255,255,0.2)", btnBg: "rgba(255,255,255,0.12)", btnHover: "rgba(255,255,255,0.2)" },
  gold: { bg: "linear-gradient(180deg, #1a1408 0%, #2a1f0e 50%, #1a1408 100%)", card: "rgba(196,162,101,0.06)", text: "#fef3c7", textMuted: "rgba(254,243,199,0.45)", accent: "#c4a265", accentLight: "rgba(196,162,101,0.15)", accentMedium: "rgba(196,162,101,0.3)", border: "rgba(196,162,101,0.12)", btnBg: "rgba(196,162,101,0.08)", btnHover: "rgba(196,162,101,0.15)" },
};

// Simplified preview theme for the editor (subset of ThemeColors)
export interface PreviewTheme {
  bg: string;
  card: string;
  text: string;
  accent: string;
  border: string;
}

export const THEME_PREVIEW_MAP: Record<string, PreviewTheme> = Object.fromEntries(
  Object.entries(THEME_COLORS).map(([k, v]) => [k, { bg: v.bg, card: v.card, text: v.text, accent: v.accent, border: v.border }])
);

export const BUTTON_STYLES_MAP: Record<string, string> = {
  rounded: "rounded-2xl",
  pill: "rounded-full",
  square: "rounded-lg",
  sharp: "rounded-none",
  outline: "rounded-2xl border-2 bg-transparent",
};

export const FONT_MAP: Record<string, string> = {
  default: "inherit",
  inter: "'Inter', sans-serif",
  playfair: "'Playfair Display', serif",
  poppins: "'Poppins', sans-serif",
  cairo: "'Cairo', sans-serif",
  tajawal: "'Tajawal', sans-serif",
  montserrat: "'Montserrat', sans-serif",
  roboto: "'Roboto', sans-serif",
};

export const FONT_SIZE_MAP: Record<string, { name: string; bio: string; meta: string; link: string }> = {
  sm: { name: "text-lg sm:text-xl", bio: "text-xs", meta: "text-[10px]", link: "text-xs" },
  md: { name: "text-2xl sm:text-3xl", bio: "text-sm", meta: "text-xs", link: "text-sm" },
  lg: { name: "text-3xl sm:text-4xl", bio: "text-base", meta: "text-sm", link: "text-base" },
  xl: { name: "text-4xl sm:text-5xl", bio: "text-lg", meta: "text-base", link: "text-lg" },
};

export interface ExtraSettings {
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

export const DEFAULT_EXTRA: ExtraSettings = {
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

export function parseExtra(customCss: string | null | undefined): ExtraSettings {
  if (!customCss) return { ...DEFAULT_EXTRA };
  try {
    return { ...DEFAULT_EXTRA, ...JSON.parse(customCss) };
  } catch {
    return { ...DEFAULT_EXTRA };
  }
}

export const FONT_FAMILIES = [
  { id: "default", label: "Default", labelAr: "افتراضي", css: "inherit" },
  { id: "inter", label: "Inter", labelAr: "إنتر", css: "'Inter', sans-serif" },
  { id: "playfair", label: "Playfair", labelAr: "بلايفير", css: "'Playfair Display', serif" },
  { id: "poppins", label: "Poppins", labelAr: "بوبينز", css: "'Poppins', sans-serif" },
  { id: "cairo", label: "Cairo", labelAr: "القاهرة", css: "'Cairo', sans-serif" },
  { id: "tajawal", label: "Tajawal", labelAr: "تجوال", css: "'Tajawal', sans-serif" },
  { id: "montserrat", label: "Montserrat", labelAr: "مونتسيرات", css: "'Montserrat', sans-serif" },
  { id: "roboto", label: "Roboto", labelAr: "روبوتو", css: "'Roboto', sans-serif" },
];

// ── Auto-detect link type & icon from URL ──
const URL_PATTERNS: { pattern: RegExp; type: string; icon: string; label: string }[] = [
  { pattern: /youtu\.?be/i, type: "video", icon: "▶️", label: "YouTube" },
  { pattern: /spotify\.com/i, type: "music", icon: "🎵", label: "Spotify" },
  { pattern: /apple\.com\/music/i, type: "music", icon: "🎵", label: "Apple Music" },
  { pattern: /soundcloud\.com/i, type: "music", icon: "🎧", label: "SoundCloud" },
  { pattern: /tiktok\.com/i, type: "video", icon: "🎬", label: "TikTok" },
  { pattern: /github\.com/i, type: "portfolio", icon: "💻", label: "GitHub" },
  { pattern: /dribbble\.com/i, type: "portfolio", icon: "🎨", label: "Dribbble" },
  { pattern: /behance\.net/i, type: "portfolio", icon: "🎨", label: "Behance" },
  { pattern: /medium\.com/i, type: "custom", icon: "📝", label: "Medium" },
  { pattern: /wa\.me|whatsapp/i, type: "custom", icon: "💬", label: "WhatsApp" },
  { pattern: /t\.me|telegram/i, type: "custom", icon: "✈️", label: "Telegram" },
  { pattern: /calendly\.com|cal\.com/i, type: "booking", icon: "📅", label: "Booking" },
  { pattern: /gofundme|buymeacoffee|ko-fi/i, type: "custom", icon: "☕", label: "Support" },
  { pattern: /shopify|etsy|amazon/i, type: "store", icon: "🛍️", label: "Store" },
  { pattern: /docs\.google|notion\.so/i, type: "custom", icon: "📄", label: "Document" },
  { pattern: /discord\.gg|discord\.com/i, type: "custom", icon: "💬", label: "Discord" },
  { pattern: /twitch\.tv/i, type: "video", icon: "🎮", label: "Twitch" },
  { pattern: /podcast|anchor\.fm|podcasters/i, type: "music", icon: "🎙️", label: "Podcast" },
];

export function detectLinkType(url: string): { type: string; icon: string; label: string } | null {
  if (!url) return null;
  for (const { pattern, type, icon, label } of URL_PATTERNS) {
    if (pattern.test(url)) return { type, icon, label };
  }
  return null;
}
