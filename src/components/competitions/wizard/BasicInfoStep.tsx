import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CoverImageUpload } from "@/components/competitions/CoverImageUpload";
import type { CompetitionFormData } from "./types";

interface BasicInfoStepProps {
  data: CompetitionFormData;
  onChange: (updates: Partial<CompetitionFormData>) => void;
}

export function BasicInfoStep({ data, onChange }: BasicInfoStepProps) {
  const { language } = useLanguage();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{language === "ar" ? "المعلومات الأساسية" : "Basic Information"}</CardTitle>
        <CardDescription>
          {language === "ar"
            ? "أدخل عنوان ووصف المسابقة"
            : "Enter the competition title and description"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>
              {language === "ar" ? "العنوان (إنجليزي)" : "Title (English)"} *
            </Label>
            <Input
              value={data.title}
              onChange={(e) => onChange({ title: e.target.value })}
              placeholder={language === "ar" ? "اسم المسابقة" : "Competition name"}
            />
          </div>
          <div className="space-y-2">
            <Label>{language === "ar" ? "العنوان (عربي)" : "Title (Arabic)"}</Label>
            <Input
              value={data.titleAr}
              onChange={(e) => onChange({ titleAr: e.target.value })}
              placeholder="اسم المسابقة"
              dir="rtl"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>{language === "ar" ? "الوصف (إنجليزي)" : "Description (English)"}</Label>
            <Textarea
              value={data.description}
              onChange={(e) => onChange({ description: e.target.value })}
              placeholder={language === "ar" ? "وصف المسابقة..." : "Describe your competition..."}
              rows={4}
            />
          </div>
          <div className="space-y-2">
            <Label>{language === "ar" ? "الوصف (عربي)" : "Description (Arabic)"}</Label>
            <Textarea
              value={data.descriptionAr}
              onChange={(e) => onChange({ descriptionAr: e.target.value })}
              placeholder="وصف المسابقة..."
              rows={4}
              dir="rtl"
            />
          </div>
        </div>

        <CoverImageUpload currentUrl={data.coverImageUrl} onUrlChange={(url) => onChange({ coverImageUrl: url })} />

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>{language === "ar" ? "ملخص القواعد (إنجليزي)" : "Rules Summary (English)"}</Label>
            <Textarea
              value={data.rulesSummary}
              onChange={(e) => onChange({ rulesSummary: e.target.value })}
              placeholder={language === "ar" ? "قواعد المسابقة..." : "Competition rules..."}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label>{language === "ar" ? "ملخص القواعد (عربي)" : "Rules Summary (Arabic)"}</Label>
            <Textarea
              value={data.rulesSummaryAr}
              onChange={(e) => onChange({ rulesSummaryAr: e.target.value })}
              placeholder="قواعد المسابقة..."
              rows={3}
              dir="rtl"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>{language === "ar" ? "ملاحظات التقييم (إنجليزي)" : "Scoring Notes (English)"}</Label>
            <Textarea
              value={data.scoringNotes}
              onChange={(e) => onChange({ scoringNotes: e.target.value })}
              placeholder={language === "ar" ? "كيف سيتم التقييم..." : "How scoring will work..."}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label>{language === "ar" ? "ملاحظات التقييم (عربي)" : "Scoring Notes (Arabic)"}</Label>
            <Textarea
              value={data.scoringNotesAr}
              onChange={(e) => onChange({ scoringNotesAr: e.target.value })}
              placeholder="كيف سيتم التقييم..."
              rows={3}
              dir="rtl"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
