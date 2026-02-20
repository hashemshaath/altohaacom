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
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Heart className="h-4 w-4 text-chart-1" />
          {isAr ? "وسائل التواصل الاجتماعي" : "Social Media"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input placeholder="Instagram" value={form.instagram} onChange={(e) => update("instagram", e.target.value)} dir="ltr" />
          <Input placeholder="Twitter / X" value={form.twitter} onChange={(e) => update("twitter", e.target.value)} dir="ltr" />
          <Input placeholder="Facebook" value={form.facebook} onChange={(e) => update("facebook", e.target.value)} dir="ltr" />
          <Input placeholder="LinkedIn" value={form.linkedin} onChange={(e) => update("linkedin", e.target.value)} dir="ltr" />
          <Input placeholder="YouTube" value={form.youtube} onChange={(e) => update("youtube", e.target.value)} dir="ltr" />
          <Input placeholder="TikTok" value={form.tiktok} onChange={(e) => update("tiktok", e.target.value)} dir="ltr" />
          <Input placeholder="Snapchat" value={form.snapchat} onChange={(e) => update("snapchat", e.target.value)} dir="ltr" />
          <Input placeholder={isAr ? "الموقع الإلكتروني" : "Website"} value={form.website} onChange={(e) => update("website", e.target.value)} dir="ltr" />
        </div>
      </CardContent>
    </Card>
  );
}
