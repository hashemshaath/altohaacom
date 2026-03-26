import { memo, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Share2, Globe, Instagram, Twitter, Facebook, Linkedin, Youtube } from "lucide-react";

interface SocialMediaSectionProps {
  form: Record<string, any>;
  update: (k: string, v: any) => void;
  isAr: boolean;
}

const SOCIAL_FIELDS = [
  { key: "instagram", label: "Instagram", labelAr: "إنستقرام", placeholder: "https://instagram.com/username", icon: Instagram, color: "text-pink-500", focusBg: "group-focus-within:bg-pink-500/10 group-focus-within:text-pink-500" },
  { key: "twitter", label: "X (Twitter)", labelAr: "إكس (تويتر)", placeholder: "https://x.com/username", icon: Twitter, color: "text-foreground", focusBg: "group-focus-within:bg-foreground/10 group-focus-within:text-foreground" },
  { key: "facebook", label: "Facebook", labelAr: "فيسبوك", placeholder: "https://facebook.com/page", icon: Facebook, color: "text-blue-600", focusBg: "group-focus-within:bg-blue-600/10 group-focus-within:text-blue-600" },
  { key: "linkedin", label: "LinkedIn", labelAr: "لينكدإن", placeholder: "https://linkedin.com/in/username", icon: Linkedin, color: "text-blue-700", focusBg: "group-focus-within:bg-blue-700/10 group-focus-within:text-blue-700" },
  { key: "youtube", label: "YouTube", labelAr: "يوتيوب", placeholder: "https://youtube.com/@channel", icon: Youtube, color: "text-red-600", focusBg: "group-focus-within:bg-red-600/10 group-focus-within:text-red-600" },
  { key: "tiktok", label: "TikTok", labelAr: "تيك توك", placeholder: "https://tiktok.com/@username", icon: Share2, color: "text-foreground", focusBg: "group-focus-within:bg-foreground/10 group-focus-within:text-foreground" },
  { key: "snapchat", label: "Snapchat", labelAr: "سناب شات", placeholder: "https://snapchat.com/add/username", icon: Share2, color: "text-yellow-500", focusBg: "group-focus-within:bg-yellow-500/10 group-focus-within:text-yellow-500" },
  { key: "website", label: "Website", labelAr: "الموقع الإلكتروني", placeholder: "https://example.com", icon: Globe, color: "text-primary", focusBg: "group-focus-within:bg-primary/10 group-focus-within:text-primary" },
];

function normalizeUrl(value: string, platform: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  // If user enters just a username (no slashes, no dots), auto-prefix
  if (platform !== "website" && !trimmed.includes("/") && !trimmed.includes(".")) {
    const prefixes: Record<string, string> = {
      instagram: "https://instagram.com/",
      twitter: "https://x.com/",
      facebook: "https://facebook.com/",
      linkedin: "https://linkedin.com/in/",
      youtube: "https://youtube.com/@",
      tiktok: "https://tiktok.com/@",
      snapchat: "https://snapchat.com/add/",
    };
    const prefix = prefixes[platform];
    if (prefix) return prefix + trimmed.replace(/^@/, "");
  }
  // Auto-add https if missing
  if (trimmed.includes(".") && !trimmed.startsWith("http")) {
    return "https://" + trimmed;
  }
  return trimmed;
}

export const SocialMediaSection = memo(function SocialMediaSection({ form, update, isAr }: SocialMediaSectionProps) {
  const handleBlur = useCallback((key: string, value: string) => {
    const normalized = normalizeUrl(value, key);
    if (normalized !== value) {
      update(key, normalized);
    }
  }, [update]);

  return (
    <Card className="rounded-2xl border-border/20 bg-card/60 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-300">
      <CardHeader className="pb-3 px-6 pt-5">
        <CardTitle className="flex items-center gap-2.5 text-base">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-chart-1/10">
            <Share2 className="h-4 w-4 text-chart-1" />
          </div>
          {isAr ? "وسائل التواصل الاجتماعي" : "Social Media"}
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground/70 ms-[46px]">
          {isAr ? "أضف روابط حساباتك — يمكنك إدخال اسم المستخدم فقط وسيتم إكمال الرابط تلقائياً" : "Add your social media links — you can enter just your username and the URL will auto-complete"}
        </CardDescription>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        <div className="grid gap-3 sm:grid-cols-2">
          {SOCIAL_FIELDS.map(({ key, label, labelAr, placeholder, icon: Icon, color, focusBg }) => (
            <div key={key} className="relative group">
              <div className={`absolute start-3 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-xl bg-muted/30 text-muted-foreground/60 transition-colors ${focusBg}`}>
                <Icon className="h-3.5 w-3.5" />
              </div>
              <Input
                className="rounded-xl ps-12 border-border/20 bg-muted/5 focus:bg-background transition-colors text-sm"
                placeholder={placeholder}
                value={form[key] || ""}
                onChange={(e) => update(key, e.target.value)}
                onBlur={(e) => handleBlur(key, e.target.value)}
                dir="ltr"
                aria-label={isAr ? labelAr : label}
              />
              {form[key] && (
                <span className={`absolute end-3 top-1/2 -translate-y-1/2 text-[9px] font-medium ${color} opacity-60`}>
                  {isAr ? labelAr : label}
                </span>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
});
