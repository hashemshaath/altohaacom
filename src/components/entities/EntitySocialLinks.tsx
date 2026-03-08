import { memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Globe, ExternalLink } from "lucide-react";
import type { Json } from "@/integrations/supabase/types";

const socialPlatforms: Record<string, { label: string; color: string }> = {
  twitter: { label: "X (Twitter)", color: "text-foreground" },
  x: { label: "X", color: "text-foreground" },
  instagram: { label: "Instagram", color: "text-pink-500" },
  facebook: { label: "Facebook", color: "text-blue-600" },
  linkedin: { label: "LinkedIn", color: "text-blue-700" },
  youtube: { label: "YouTube", color: "text-red-600" },
  tiktok: { label: "TikTok", color: "text-foreground" },
  snapchat: { label: "Snapchat", color: "text-yellow-500" },
  whatsapp: { label: "WhatsApp", color: "text-green-600" },
  telegram: { label: "Telegram", color: "text-blue-500" },
};

interface Props {
  socialLinks: Json;
}

export const EntitySocialLinks = memo(function EntitySocialLinks({ socialLinks }: Props) {
  const { language } = useLanguage();
  const isAr = language === "ar";

  if (!socialLinks || typeof socialLinks !== "object" || Array.isArray(socialLinks)) return null;

  const links = Object.entries(socialLinks as Record<string, string>).filter(
    ([, url]) => url && typeof url === "string" && url.trim().length > 0
  );

  if (links.length === 0) return null;

  return (
    <Card className="overflow-hidden">
      <div className="border-b bg-muted/30 px-4 py-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <div className="flex h-6 w-6 items-center justify-center rounded-xl bg-primary/10">
            <Globe className="h-3.5 w-3.5 text-primary" />
          </div>
          {isAr ? "التواصل الاجتماعي" : "Social Media"}
        </h3>
      </div>
      <CardContent className="grid grid-cols-2 gap-2 p-3">
        {links.map(([platform, url]) => {
          const info = socialPlatforms[platform.toLowerCase()] || { label: platform, color: "text-foreground" };
          return (
            <a
              key={platform}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-xl border border-border/50 bg-muted/20 px-3 py-2 text-xs font-medium transition-all hover:bg-muted/50 hover:shadow-sm"
            >
              <ExternalLink className={`h-3 w-3 shrink-0 ${info.color}`} />
              <span className="truncate">{info.label}</span>
            </a>
          );
        })}
      </CardContent>
    </Card>
  );
}
