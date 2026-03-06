import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Palette } from "lucide-react";

interface Props {
  form: Record<string, any>;
  setForm: (f: Record<string, any>) => void;
  isAr: boolean;
}

export function BrandingSettingsCard({ form, setForm, isAr }: Props) {
  return (
    <Card className="rounded-2xl border-border/20 bg-card/60 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-300">
      <CardHeader className="pb-3 px-6 pt-5">
        <CardTitle className="flex items-center gap-2.5 text-base">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10">
            <Palette className="h-4 w-4 text-accent-foreground" />
          </div>
          {isAr ? "العلامة التجارية" : "Branding & Identity"}
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground/70 ms-[46px]">
          {isAr ? "الشعار والوصف والتعريف بالشركة" : "Tagline, description, and company identity"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 px-6 pb-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-xs font-semibold">{isAr ? "الشعار النصي (إنجليزي)" : "Tagline (English)"}</Label>
            <Input
              className="rounded-xl border-border/20 bg-muted/5"
              value={form.tagline}
              onChange={(e) => setForm({ ...form, tagline: e.target.value })}
              placeholder="Your company's tagline..."
              dir="ltr"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold">{isAr ? "الشعار النصي (عربي)" : "Tagline (Arabic)"}</Label>
            <Input
              className="rounded-xl border-border/20 bg-muted/5"
              value={form.tagline_ar}
              onChange={(e) => setForm({ ...form, tagline_ar: e.target.value })}
              placeholder="شعار شركتك..."
              dir="rtl"
            />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-xs font-semibold">{isAr ? "الوصف (إنجليزي)" : "Description (English)"}</Label>
            <Textarea
              className="rounded-xl border-border/20 bg-muted/5 resize-none"
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Brief company description..."
              dir="ltr"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold">{isAr ? "الوصف (عربي)" : "Description (Arabic)"}</Label>
            <Textarea
              className="rounded-xl border-border/20 bg-muted/5 resize-none"
              rows={3}
              value={form.description_ar}
              onChange={(e) => setForm({ ...form, description_ar: e.target.value })}
              placeholder="وصف مختصر عن الشركة..."
              dir="rtl"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-semibold">{isAr ? "سنة التأسيس" : "Founded Year"}</Label>
          <Input
            className="rounded-xl border-border/20 bg-muted/5 w-32"
            type="number" min="1900" max={new Date().getFullYear()}
            value={form.founded_year}
            onChange={(e) => setForm({ ...form, founded_year: parseInt(e.target.value) || null })}
            dir="ltr"
          />
        </div>
      </CardContent>
    </Card>
  );
}
