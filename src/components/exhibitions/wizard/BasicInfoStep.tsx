import { useLanguage } from "@/i18n/LanguageContext";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FileText, Image, Type, Sparkles } from "lucide-react";
import type { ExhibitionFormData } from "./types";

const typeOptions = [
  { value: "exhibition", en: "Exhibition", ar: "معرض", emoji: "🎨" },
  { value: "conference", en: "Conference", ar: "مؤتمر", emoji: "🎤" },
  { value: "summit", en: "Summit", ar: "قمة", emoji: "🏔️" },
  { value: "workshop", en: "Workshop", ar: "ورشة عمل", emoji: "🛠️" },
  { value: "food_festival", en: "Food Festival", ar: "مهرجان طعام", emoji: "🍽️" },
  { value: "trade_show", en: "Trade Show", ar: "معرض تجاري", emoji: "📊" },
  { value: "competition_event", en: "Competition Event", ar: "حدث تنافسي", emoji: "🏆" },
];

interface Props {
  data: ExhibitionFormData;
  onChange: (updates: Partial<ExhibitionFormData>) => void;
}

export function ExhibitionBasicInfoStep({ data, onChange }: Props) {
  const { language } = useLanguage();
  const isAr = language === "ar";

  return (
    <div className="space-y-6">
      {/* Title & Type */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Type className="h-4 w-4 text-primary" />
            </div>
            {isAr ? "العنوان والنوع" : "Title & Type"}
          </CardTitle>
          <CardDescription>
            {isAr ? "اختر عنوانًا جذابًا لفعاليتك" : "Choose a compelling title for your event"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {isAr ? "العنوان (إنجليزي)" : "Title (English)"} <span className="text-destructive">*</span>
              </Label>
              <Input
                value={data.title}
                onChange={(e) => onChange({ title: e.target.value })}
                placeholder={isAr ? "عنوان الفعالية" : "e.g. International Culinary Summit 2025"}
                className="h-11"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {isAr ? "العنوان (عربي)" : "Title (Arabic)"}
              </Label>
              <Input
                value={data.titleAr}
                onChange={(e) => onChange({ titleAr: e.target.value })}
                dir="rtl"
                placeholder="عنوان الفعالية بالعربي"
                className="h-11"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {isAr ? "نوع الفعالية" : "Event Type"}
            </Label>
            <Select value={data.type} onValueChange={(v) => onChange({ type: v })}>
              <SelectTrigger className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {typeOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    <span className="flex items-center gap-2">
                      <span>{opt.emoji}</span>
                      {isAr ? opt.ar : opt.en}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Description */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <FileText className="h-4 w-4 text-primary" />
            </div>
            {isAr ? "الوصف" : "Description"}
          </CardTitle>
          <CardDescription>
            {isAr ? "صف فعاليتك بالتفصيل لجذب الحضور" : "Describe your event in detail to attract attendees"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {isAr ? "الوصف (إنجليزي)" : "English"}
              </Label>
              <Textarea
                value={data.description}
                onChange={(e) => onChange({ description: e.target.value })}
                rows={5}
                placeholder={isAr ? "وصف الفعالية" : "Tell people what makes this event special..."}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                {data.description.length}/500
              </p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {isAr ? "الوصف (عربي)" : "Arabic"}
              </Label>
              <Textarea
                value={data.descriptionAr}
                onChange={(e) => onChange({ descriptionAr: e.target.value })}
                rows={5}
                dir="rtl"
                placeholder="وصف الفعالية بالعربي"
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                {data.descriptionAr.length}/500
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cover Image */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Image className="h-4 w-4 text-primary" />
            </div>
            {isAr ? "صورة الغلاف" : "Cover Image"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            value={data.coverImageUrl}
            onChange={(e) => onChange({ coverImageUrl: e.target.value })}
            placeholder="https://example.com/cover.jpg"
            className="h-11"
          />
          {data.coverImageUrl && (
            <div className="overflow-hidden rounded-xl border">
              <img
                src={data.coverImageUrl}
                alt="Cover preview"
                className="aspect-[21/9] w-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
          )}
          {!data.coverImageUrl && (
            <div className="flex aspect-[21/9] items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/20 bg-muted/30">
              <div className="text-center">
                <Sparkles className="mx-auto mb-2 h-8 w-8 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground/50">
                  {isAr ? "أضف رابط صورة لعرض المعاينة" : "Add an image URL to see a preview"}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
