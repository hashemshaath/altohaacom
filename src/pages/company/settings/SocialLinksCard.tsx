import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Share2 } from "lucide-react";

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

const SOCIAL_FIELDS: { key: keyof SocialLinks; label: string; labelAr: string; placeholder: string }[] = [
  { key: "twitter", label: "X (Twitter)", labelAr: "إكس (تويتر)", placeholder: "https://x.com/..." },
  { key: "instagram", label: "Instagram", labelAr: "إنستقرام", placeholder: "https://instagram.com/..." },
  { key: "linkedin", label: "LinkedIn", labelAr: "لينكدإن", placeholder: "https://linkedin.com/company/..." },
  { key: "facebook", label: "Facebook", labelAr: "فيسبوك", placeholder: "https://facebook.com/..." },
  { key: "tiktok", label: "TikTok", labelAr: "تيك توك", placeholder: "https://tiktok.com/@..." },
  { key: "snapchat", label: "Snapchat", labelAr: "سناب شات", placeholder: "https://snapchat.com/add/..." },
];

export function SocialLinksCard({ socialLinks, setSocialLinks, isAr }: Props) {
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
          {isAr ? "ربط حسابات التواصل الاجتماعي بملف الشركة" : "Connect social media accounts to your company profile"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 px-6 pb-6">
        <div className="grid gap-4 sm:grid-cols-2">
          {SOCIAL_FIELDS.map((field) => (
            <div key={field.key} className="space-y-2">
              <Label className="text-xs font-semibold">{isAr ? field.labelAr : field.label}</Label>
              <Input
                className="rounded-xl border-border/20 bg-muted/5"
                value={socialLinks[field.key] || ""}
                onChange={(e) => setSocialLinks({ ...socialLinks, [field.key]: e.target.value })}
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
