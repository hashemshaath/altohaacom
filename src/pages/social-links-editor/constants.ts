import {
  Instagram, Twitter, Facebook, Linkedin, Youtube, Globe,
  Video, MessageCircle, Phone, Link as LinkIcon, ShoppingBag,
  CalendarDays, Briefcase, Music,
} from "lucide-react";

export const SOCIAL_PLATFORMS = [
  { key: "instagram", label: "Instagram", labelAr: "انستقرام", icon: Instagram, prefix: "https://instagram.com/", placeholder: "username", color: "from-pink-500 to-purple-600" },
  { key: "twitter", label: "X / Twitter", labelAr: "إكس / تويتر", icon: Twitter, prefix: "https://x.com/", placeholder: "username", color: "from-sky-400 to-blue-500" },
  { key: "tiktok", label: "TikTok", labelAr: "تيك توك", icon: Video, prefix: "https://tiktok.com/@", placeholder: "username", color: "from-gray-700 to-gray-900" },
  { key: "youtube", label: "YouTube", labelAr: "يوتيوب", icon: Youtube, prefix: "https://youtube.com/@", placeholder: "channel", color: "from-red-500 to-red-700" },
  { key: "snapchat", label: "Snapchat", labelAr: "سناب شات", icon: Globe, prefix: "https://snapchat.com/add/", placeholder: "username", color: "from-yellow-400 to-yellow-600" },
  { key: "facebook", label: "Facebook", labelAr: "فيسبوك", icon: Facebook, prefix: "https://facebook.com/", placeholder: "username", color: "from-blue-500 to-blue-700" },
  { key: "linkedin", label: "LinkedIn", labelAr: "لينكدإن", icon: Linkedin, prefix: "https://linkedin.com/in/", placeholder: "username", color: "from-blue-600 to-blue-800" },
  { key: "website", label: "Website", labelAr: "الموقع", icon: Globe, prefix: "", placeholder: "https://example.com", color: "from-emerald-500 to-teal-600" },
] as const;

export const CONTACT_FIELDS = [
  { key: "whatsapp", label: "WhatsApp", labelAr: "واتساب", icon: MessageCircle, placeholder: "5XXXXXXXX", color: "from-green-500 to-green-700" },
  { key: "phone", label: "Phone", labelAr: "الهاتف", icon: Phone, placeholder: "5XXXXXXXX", color: "from-blue-400 to-blue-600" },
  { key: "phone2", label: "Phone 2", labelAr: "الهاتف ٢", icon: Phone, placeholder: "5XXXXXXXX", color: "from-indigo-400 to-indigo-600" },
] as const;

export const THEMES = [
  { id: "default", label: "Default", labelAr: "افتراضي", preview: "bg-gradient-to-br from-background to-muted/30" },
  { id: "dark", label: "Dark", labelAr: "داكن", preview: "bg-gradient-to-br from-gray-950 to-gray-900" },
  { id: "ocean", label: "Ocean", labelAr: "محيط", preview: "bg-gradient-to-br from-blue-950 to-teal-950" },
  { id: "sunset", label: "Sunset", labelAr: "غروب", preview: "bg-gradient-to-br from-orange-950 to-purple-950" },
  { id: "forest", label: "Forest", labelAr: "غابة", preview: "bg-gradient-to-br from-green-950 to-teal-950" },
  { id: "minimal", label: "Minimal", labelAr: "بسيط", preview: "bg-white dark:bg-gray-950" },
  { id: "candy", label: "Candy", labelAr: "حلوى", preview: "bg-gradient-to-br from-pink-400 to-indigo-500" },
  { id: "gold", label: "Gold", labelAr: "ذهبي", preview: "bg-gradient-to-br from-yellow-900 to-yellow-950" },
];

export const BUTTON_STYLES = [
  { id: "rounded", label: "Rounded", labelAr: "مستدير" },
  { id: "pill", label: "Pill", labelAr: "كبسولة" },
  { id: "square", label: "Square", labelAr: "مربع" },
  { id: "sharp", label: "Sharp", labelAr: "حاد" },
  { id: "outline", label: "Outline", labelAr: "إطار" },
  { id: "gradient", label: "Gradient", labelAr: "تدرج" },
  { id: "glass", label: "Glass", labelAr: "زجاجي" },
  { id: "neon", label: "Neon", labelAr: "نيون" },
];

export const FONT_SIZES = [
  { id: "sm", label: "Small", labelAr: "صغير" },
  { id: "md", label: "Medium", labelAr: "متوسط" },
  { id: "lg", label: "Large", labelAr: "كبير" },
  { id: "xl", label: "Extra Large", labelAr: "كبير جداً" },
];

const SOCIAL_ICONS: Record<string, typeof Instagram> = {
  instagram: Instagram, twitter: Twitter, facebook: Facebook,
  linkedin: Linkedin, youtube: Youtube, website: Globe,
};

export const LINK_TYPE_ICONS: Record<string, typeof Globe> = {
  custom: LinkIcon, menu: ShoppingBag, store: ShoppingBag,
  booking: CalendarDays, portfolio: Briefcase, video: Video, music: Music,
};

export function normalizeSocialUrl(value: string, platform: typeof SOCIAL_PLATFORMS[number]): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (platform.key === "website") {
    if (trimmed.includes(".") && !trimmed.startsWith("http")) return "https://" + trimmed;
    return trimmed;
  }
  if (!trimmed.includes("/") && !trimmed.includes(".")) {
    return platform.prefix + trimmed.replace(/^@/, "");
  }
  if (trimmed.includes(".") && !trimmed.startsWith("http")) {
    return "https://" + trimmed;
  }
  return trimmed;
}

function extractUsername(value: string, platform: typeof SOCIAL_PLATFORMS[number]): string {
  if (!value) return "";
  if (platform.prefix && value.startsWith(platform.prefix)) {
    return value.slice(platform.prefix.length).replace(/\/$/, "");
  }
  try {
    const url = new URL(value.startsWith("http") ? value : "https://" + value);
    const path = url.pathname.replace(/^\//, "").replace(/\/$/, "");
    if (path) return path.replace(/^@/, "");
  } catch {}
  return value;
}
