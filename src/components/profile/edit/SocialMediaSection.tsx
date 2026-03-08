import { memo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Share2, Globe, Instagram, Twitter, Facebook, Linkedin, Youtube } from "lucide-react";

interface SocialMediaSectionProps {
  form: Record<string, any>;
  update: (k: string, v: any) => void;
  isAr: boolean;
}

const SOCIAL_FIELDS = [
  { key: "instagram", placeholder: "Instagram", icon: Instagram },
  { key: "twitter", placeholder: "Twitter / X", icon: Twitter },
  { key: "facebook", placeholder: "Facebook", icon: Facebook },
  { key: "linkedin", placeholder: "LinkedIn", icon: Linkedin },
  { key: "youtube", placeholder: "YouTube", icon: Youtube },
  { key: "tiktok", placeholder: "TikTok", icon: Share2 },
  { key: "snapchat", placeholder: "Snapchat", icon: Share2 },
  { key: "website", placeholder: "Website", icon: Globe },
];

export const SocialMediaSection = memo(function SocialMediaSection({ form, update, isAr }: SocialMediaSectionProps) {
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
          {isAr ? "أضف روابط حساباتك على وسائل التواصل" : "Add your social media profile links"}
        </CardDescription>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        <div className="grid gap-3 sm:grid-cols-2">
          {SOCIAL_FIELDS.map(({ key, placeholder, icon: Icon }) => (
            <div key={key} className="relative group">
              <div className="absolute start-3 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-xl bg-muted/30 text-muted-foreground/60 transition-colors group-focus-within:bg-primary/10 group-focus-within:text-primary">
                <Icon className="h-3.5 w-3.5" />
              </div>
              <Input
                className="rounded-xl ps-12 border-border/20 bg-muted/5 focus:bg-background transition-colors"
                placeholder={key === "website" ? (isAr ? "الموقع الإلكتروني" : placeholder) : placeholder}
                value={form[key]}
                onChange={(e) => update(key, e.target.value)}
                dir="ltr"
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
