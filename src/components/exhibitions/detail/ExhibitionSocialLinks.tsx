import { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Globe, ExternalLink } from "lucide-react";
import type { Json } from "@/integrations/supabase/types";

const SOCIAL_PLATFORMS: Record<string, { label: string; labelAr: string; color: string; icon: string }> = {
  twitter: { label: "X (Twitter)", labelAr: "إكس (تويتر)", color: "hover:bg-foreground/10", icon: "𝕏" },
  x: { label: "X", labelAr: "إكس", color: "hover:bg-foreground/10", icon: "𝕏" },
  instagram: { label: "Instagram", labelAr: "إنستغرام", color: "hover:bg-pink-500/10 text-pink-600", icon: "📷" },
  facebook: { label: "Facebook", labelAr: "فيسبوك", color: "hover:bg-blue-600/10 text-blue-600", icon: "📘" },
  linkedin: { label: "LinkedIn", labelAr: "لينكدإن", color: "hover:bg-blue-700/10 text-blue-700", icon: "💼" },
  youtube: { label: "YouTube", labelAr: "يوتيوب", color: "hover:bg-red-600/10 text-red-600", icon: "▶️" },
  tiktok: { label: "TikTok", labelAr: "تيك توك", color: "hover:bg-foreground/10", icon: "🎵" },
  snapchat: { label: "Snapchat", labelAr: "سناب شات", color: "hover:bg-yellow-500/10 text-yellow-600", icon: "👻" },
  whatsapp: { label: "WhatsApp", labelAr: "واتساب", color: "hover:bg-green-600/10 text-green-600", icon: "💬" },
  telegram: { label: "Telegram", labelAr: "تيليغرام", color: "hover:bg-blue-500/10 text-blue-500", icon: "✈️" },
  website: { label: "Website", labelAr: "الموقع", color: "hover:bg-primary/10 text-primary", icon: "🌐" },
};

interface Props {
  socialLinks: Json;
  websiteUrl?: string | null;
  isAr: boolean;
}

export function ExhibitionSocialLinks({ socialLinks, websiteUrl, isAr }: Props) {
  if (!socialLinks || typeof socialLinks !== "object" || Array.isArray(socialLinks)) {
    if (!websiteUrl) return null;
  }

  const links = socialLinks && typeof socialLinks === "object" && !Array.isArray(socialLinks)
    ? Object.entries(socialLinks as Record<string, string>).filter(
        ([, url]) => url && typeof url === "string" && url.trim().length > 0
      )
    : [];

  if (websiteUrl) {
    links.push(["website", websiteUrl]);
  }

  if (links.length === 0) return null;

  return (
    <Card className="overflow-hidden">
      <div className="border-b bg-muted/30 px-4 py-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10">
            <Globe className="h-3.5 w-3.5 text-primary" />
          </div>
          {isAr ? "تواصل معنا" : "Connect With Us"}
        </h3>
      </div>
      <CardContent className="p-3 space-y-1.5">
        {links.map(([platform, url]) => {
          const info = SOCIAL_PLATFORMS[platform.toLowerCase()] || {
            label: platform,
            labelAr: platform,
            color: "hover:bg-muted",
            icon: "🔗",
          };
          return (
            <a
              key={platform}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${info.color} group`}
            >
              <span className="text-base">{info.icon}</span>
              <span className="flex-1 truncate">{isAr ? info.labelAr : info.label}</span>
              <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>
          );
        })}
      </CardContent>
    </Card>
  );
}
