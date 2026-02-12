import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CoverImageUpload } from "@/components/competitions/CoverImageUpload";
import { AITextOptimizer } from "@/components/admin/AITextOptimizer";
import type { CompetitionFormData } from "./types";

interface BasicInfoStepProps {
  data: CompetitionFormData;
  onChange: (updates: Partial<CompetitionFormData>) => void;
}

export function BasicInfoStep({ data, onChange }: BasicInfoStepProps) {
  const { language } = useLanguage();
  const isAr = language === "ar";

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isAr ? "المعلومات الأساسية" : "Basic Information"}</CardTitle>
        <CardDescription>
          {isAr ? "أدخل عنوان ووصف المسابقة" : "Enter the competition title and description"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>{isAr ? "العنوان (إنجليزي)" : "Title (English)"} *</Label>
              <AITextOptimizer
                text={data.title}
                lang="en"
                compact
                onOptimized={(v) => onChange({ title: v })}
                onTranslated={(v) => onChange({ titleAr: v })}
              />
            </div>
            <Input
              value={data.title}
              onChange={(e) => onChange({ title: e.target.value })}
              placeholder={isAr ? "اسم المسابقة" : "Competition name"}
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>{isAr ? "العنوان (عربي)" : "Title (Arabic)"}</Label>
              <AITextOptimizer
                text={data.titleAr}
                lang="ar"
                compact
                onOptimized={(v) => onChange({ titleAr: v })}
                onTranslated={(v) => onChange({ title: v })}
              />
            </div>
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
            <div className="flex items-center justify-between">
              <Label>{isAr ? "الوصف (إنجليزي)" : "Description (English)"}</Label>
              <AITextOptimizer
                text={data.description}
                lang="en"
                compact
                onOptimized={(v) => onChange({ description: v })}
                onTranslated={(v) => onChange({ descriptionAr: v })}
              />
            </div>
            <Textarea
              value={data.description}
              onChange={(e) => onChange({ description: e.target.value })}
              placeholder={isAr ? "وصف المسابقة..." : "Describe your competition..."}
              rows={4}
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>{isAr ? "الوصف (عربي)" : "Description (Arabic)"}</Label>
              <AITextOptimizer
                text={data.descriptionAr}
                lang="ar"
                compact
                onOptimized={(v) => onChange({ descriptionAr: v })}
                onTranslated={(v) => onChange({ description: v })}
              />
            </div>
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
            <div className="flex items-center justify-between">
              <Label>{isAr ? "ملخص القواعد (إنجليزي)" : "Rules Summary (English)"}</Label>
              <AITextOptimizer
                text={data.rulesSummary}
                lang="en"
                compact
                onOptimized={(v) => onChange({ rulesSummary: v })}
                onTranslated={(v) => onChange({ rulesSummaryAr: v })}
              />
            </div>
            <Textarea
              value={data.rulesSummary}
              onChange={(e) => onChange({ rulesSummary: e.target.value })}
              placeholder={isAr ? "قواعد المسابقة..." : "Competition rules..."}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>{isAr ? "ملخص القواعد (عربي)" : "Rules Summary (Arabic)"}</Label>
              <AITextOptimizer
                text={data.rulesSummaryAr}
                lang="ar"
                compact
                onOptimized={(v) => onChange({ rulesSummaryAr: v })}
                onTranslated={(v) => onChange({ rulesSummary: v })}
              />
            </div>
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
            <div className="flex items-center justify-between">
              <Label>{isAr ? "ملاحظات التقييم (إنجليزي)" : "Scoring Notes (English)"}</Label>
              <AITextOptimizer
                text={data.scoringNotes}
                lang="en"
                compact
                onOptimized={(v) => onChange({ scoringNotes: v })}
                onTranslated={(v) => onChange({ scoringNotesAr: v })}
              />
            </div>
            <Textarea
              value={data.scoringNotes}
              onChange={(e) => onChange({ scoringNotes: e.target.value })}
              placeholder={isAr ? "كيف سيتم التقييم..." : "How scoring will work..."}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>{isAr ? "ملاحظات التقييم (عربي)" : "Scoring Notes (Arabic)"}</Label>
              <AITextOptimizer
                text={data.scoringNotesAr}
                lang="ar"
                compact
                onOptimized={(v) => onChange({ scoringNotesAr: v })}
                onTranslated={(v) => onChange({ scoringNotes: v })}
              />
            </div>
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
