import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Share2 } from "lucide-react";
import { useCallback } from "react";

/**
 * TYPOGRAPHY POLICY — ALTOHA DESIGN SYSTEM
 * Minimum font size: 11px (0.6875rem) desktop / 13px (0.8125rem) mobile.
 * Do NOT use `text-xs` on body text — only on badges & labels.
 * Scale: display(48) h1(36) h2(28) h3(22) h4(18) body-lg(18) body(16) body-sm(14) caption(13) label(12) overline(11).
 * IBM Plex Arabic required on all text.
 * See src/styles/typography.css for the complete policy.
 */

interface SocialLinks {
  twitter?: string;
  instagram?: string;
  linkedin?: string;
  facebook?: string;
  tiktok?: string;
  snapchat?: string;
}

interface Props {
  socialLinks: SocialLinks;
  setSocialLinks: (s: SocialLinks) => void;
  isAr: boolean;
}

const SOCIAL_FIELDS: { key: keyof SocialLinks; label: string; labelAr: string; placeholder: string; autoPrefix: string }[] = [
  { key: "twitter", label: "X (Twitter)", labelAr: "إكس (تويتر)", placeholder: "https://x.com/...", autoPrefix: "https://x.com/" },
  { key: "instagram", label: "Instagram", labelAr: "إنستقرام", placeholder: "https://instagram.com/...", autoPrefix: "https://instagram.com/" },
  { key: "linkedin", label: "LinkedIn", labelAr: "لينكدإن", placeholder: "https://linkedin.com/company/...", autoPrefix: "https://linkedin.com/company/" },
  { key: "facebook", label: "Facebook", labelAr: "فيسبوك", placeholder: "https://facebook.com/...", autoPrefix: "https://facebook.com/" },
  { key: "tiktok", label: "TikTok", labelAr: "تيك توك", placeholder: "https://tiktok.com/@...", autoPrefix: "https://tiktok.com/@" },
  { key: "snapchat", label: "Snapchat", labelAr: "سناب شات", placeholder: "https://snapchat.com/add/...", autoPrefix: "https://snapchat.com/add/" },
];

function normalizeUrl(value: string, autoPrefix: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (!trimmed.includes("/") && !trimmed.includes(".")) {
    return autoPrefix + trimmed.replace(/^@/, "");
  }
  if (trimmed.includes(".") && !trimmed.startsWith("http")) {
    return "https://" + trimmed;
  }
  return trimmed;
}

export function SocialLinksCard({ socialLinks, setSocialLinks, isAr }: Props) {
  const handleBlur = useCallback((key: keyof SocialLinks, value: string, autoPrefix: string) => {
    const normalized = normalizeUrl(value, autoPrefix);
    if (normalized !== value) {
      setSocialLinks({ ...socialLinks, [key]: normalized });
    }
  }, [socialLinks, setSocialLinks]);

  return (
    <Card className="rounded-2xl border-border/20 bg-card/60 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-300">
      <CardHeader className="pb-3 px-6 pt-5">
        <CardTitle className="flex items-center gap-2.5 text-base">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-chart-4/10">
            <Share2 className="h-4 w-4 text-chart-4" />
          </div>
          {isAr ? "روابط التواصل الاجتماعي" : "Social Media Links"}
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground/70 ms-[46px]">
          {isAr ? "أدخل اسم المستخدم أو الرابط الكامل — سيتم إكمال الرابط تلقائياً" : "Enter username or full URL — links auto-complete on blur"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 px-6 pb-6">
        <div className="grid gap-4 sm:grid-cols-2">
          {SOCIAL_FIELDS.map((field) => (
            <div key={field.key} className="space-y-1.5">
              <label className="text-xs font-semibold">{isAr ? field.labelAr : field.label}</label>
              <Input
                className="rounded-xl border-border/20 bg-muted/5"
                value={socialLinks[field.key] || ""}
                onChange={(e) => setSocialLinks({ ...socialLinks, [field.key]: e.target.value })}
                onBlur={(e) => handleBlur(field.key, e.target.value, field.autoPrefix)}
                placeholder={field.placeholder}
                dir="ltr"
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
