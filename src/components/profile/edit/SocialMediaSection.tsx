import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart } from "lucide-react";

interface SocialMediaSectionProps {
  form: Record<string, any>;
  update: (k: string, v: any) => void;
  isAr: boolean;
}

export function SocialMediaSection({ form, update, isAr }: SocialMediaSectionProps) {
  return (
    <Card className="rounded-2xl border-border/30 bg-card/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-300">
      <CardHeader className="pb-3 px-6 pt-5">
        <CardTitle className="flex items-center gap-2.5 text-base">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-chart-1/10">
            <Heart className="h-4 w-4 text-chart-1" />
          </div>
          {isAr ? "وسائل التواصل الاجتماعي" : "Social Media"}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        <div className="grid gap-3 sm:grid-cols-2">
          <Input className="rounded-xl" placeholder="Instagram" value={form.instagram} onChange={(e) => update("instagram", e.target.value)} dir="ltr" />
          <Input className="rounded-xl" placeholder="Twitter / X" value={form.twitter} onChange={(e) => update("twitter", e.target.value)} dir="ltr" />
          <Input className="rounded-xl" placeholder="Facebook" value={form.facebook} onChange={(e) => update("facebook", e.target.value)} dir="ltr" />
          <Input className="rounded-xl" placeholder="LinkedIn" value={form.linkedin} onChange={(e) => update("linkedin", e.target.value)} dir="ltr" />
          <Input className="rounded-xl" placeholder="YouTube" value={form.youtube} onChange={(e) => update("youtube", e.target.value)} dir="ltr" />
          <Input className="rounded-xl" placeholder="TikTok" value={form.tiktok} onChange={(e) => update("tiktok", e.target.value)} dir="ltr" />
          <Input className="rounded-xl" placeholder="Snapchat" value={form.snapchat} onChange={(e) => update("snapchat", e.target.value)} dir="ltr" />
          <Input className="rounded-xl" placeholder={isAr ? "الموقع الإلكتروني" : "Website"} value={form.website} onChange={(e) => update("website", e.target.value)} dir="ltr" />
        </div>
      </CardContent>
    </Card>
  );
}
