import { useLanguage } from "@/i18n/LanguageContext";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";
import type { ExhibitionFormData } from "./types";

const typeOptions = [
  { value: "exhibition", en: "Exhibition", ar: "معرض" },
  { value: "conference", en: "Conference", ar: "مؤتمر" },
  { value: "summit", en: "Summit", ar: "قمة" },
  { value: "workshop", en: "Workshop", ar: "ورشة عمل" },
  { value: "food_festival", en: "Food Festival", ar: "مهرجان طعام" },
  { value: "trade_show", en: "Trade Show", ar: "معرض تجاري" },
  { value: "competition_event", en: "Competition Event", ar: "حدث تنافسي" },
];

interface Props {
  data: ExhibitionFormData;
  onChange: (updates: Partial<ExhibitionFormData>) => void;
}

export function ExhibitionBasicInfoStep({ data, onChange }: Props) {
  const { language } = useLanguage();
  const isAr = language === "ar";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          {isAr ? "المعلومات الأساسية" : "Basic Information"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>{isAr ? "العنوان (إنجليزي)" : "Title (EN)"} *</Label>
            <Input
              value={data.title}
              onChange={(e) => onChange({ title: e.target.value })}
              placeholder={isAr ? "عنوان الفعالية" : "Event title"}
            />
          </div>
          <div>
            <Label>{isAr ? "العنوان (عربي)" : "Title (AR)"}</Label>
            <Input
              value={data.titleAr}
              onChange={(e) => onChange({ titleAr: e.target.value })}
              dir="rtl"
              placeholder="عنوان الفعالية بالعربي"
            />
          </div>
        </div>

        <div>
          <Label>{isAr ? "نوع الفعالية" : "Event Type"}</Label>
          <Select value={data.type} onValueChange={(v) => onChange({ type: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {typeOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {isAr ? opt.ar : opt.en}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>{isAr ? "الوصف (إنجليزي)" : "Description (EN)"}</Label>
            <Textarea
              value={data.description}
              onChange={(e) => onChange({ description: e.target.value })}
              rows={4}
              placeholder={isAr ? "وصف الفعالية" : "Event description"}
            />
          </div>
          <div>
            <Label>{isAr ? "الوصف (عربي)" : "Description (AR)"}</Label>
            <Textarea
              value={data.descriptionAr}
              onChange={(e) => onChange({ descriptionAr: e.target.value })}
              rows={4}
              dir="rtl"
              placeholder="وصف الفعالية بالعربي"
            />
          </div>
        </div>

        <div>
          <Label>{isAr ? "رابط صورة الغلاف" : "Cover Image URL"}</Label>
          <Input
            value={data.coverImageUrl}
            onChange={(e) => onChange({ coverImageUrl: e.target.value })}
            placeholder="https://example.com/cover.jpg"
          />
        </div>
      </CardContent>
    </Card>
  );
}
