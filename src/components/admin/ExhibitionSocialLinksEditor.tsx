import { memo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Globe, ExternalLink } from "lucide-react";

const SOCIAL_PLATFORMS = [
  { key: "website", en: "Website", ar: "الموقع الإلكتروني", placeholder: "https://example.com", icon: "🌐" },
  { key: "twitter", en: "X (Twitter)", ar: "إكس (تويتر)", placeholder: "https://x.com/username", icon: "𝕏" },
  { key: "instagram", en: "Instagram", ar: "إنستغرام", placeholder: "https://instagram.com/username", icon: "📷" },
  { key: "facebook", en: "Facebook", ar: "فيسبوك", placeholder: "https://facebook.com/page", icon: "📘" },
  { key: "linkedin", en: "LinkedIn", ar: "لينكدإن", placeholder: "https://linkedin.com/company/name", icon: "💼" },
  { key: "youtube", en: "YouTube", ar: "يوتيوب", placeholder: "https://youtube.com/@channel", icon: "▶️" },
  { key: "tiktok", en: "TikTok", ar: "تيك توك", placeholder: "https://tiktok.com/@username", icon: "🎵" },
  { key: "snapchat", en: "Snapchat", ar: "سناب شات", placeholder: "https://snapchat.com/add/username", icon: "👻" },
  { key: "whatsapp", en: "WhatsApp", ar: "واتساب", placeholder: "https://wa.me/966...", icon: "💬" },
  { key: "telegram", en: "Telegram", ar: "تيليغرام", placeholder: "https://t.me/username", icon: "✈️" },
  { key: "email", en: "Email", ar: "البريد الإلكتروني", placeholder: "info@example.com", icon: "📧" },
  { key: "phone", en: "Phone", ar: "الهاتف", placeholder: "+966...", icon: "📞" },
];

interface Props {
  value: Record<string, string>;
  onChange: (links: Record<string, string>) => void;
  isAr: boolean;
}

export const ExhibitionSocialLinksEditor = memo(function ExhibitionSocialLinksEditor({ value, onChange, isAr }: Props) {
  const updateLink = (key: string, val: string) => {
    onChange({ ...value, [key]: val });
  };

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        {SOCIAL_PLATFORMS.map((p) => (
          <div key={p.key} className="space-y-1">
            <Label className="text-xs flex items-center gap-1.5">
              <span className="text-sm">{p.icon}</span>
              {isAr ? p.ar : p.en}
            </Label>
            <Input
              className="h-8 text-xs"
              value={value[p.key] || ""}
              onChange={(e) => updateLink(p.key, e.target.value)}
              placeholder={p.placeholder}
              dir="ltr"
            />
          </div>
        ))}
      </div>
    </div>
  );
});
