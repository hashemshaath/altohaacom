import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { CompetitionFormData } from "./types";

interface DatesLocationStepProps {
  data: CompetitionFormData;
  onChange: (updates: Partial<CompetitionFormData>) => void;
  competitionNumber?: string | null;
}

export function DatesLocationStep({ data, onChange, competitionNumber }: DatesLocationStepProps) {
  const { language } = useLanguage();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{language === "ar" ? "التواريخ والموقع" : "Schedule & Location"}</CardTitle>
        <CardDescription>
          {language === "ar"
            ? "حدد الجدول الزمني وتفاصيل المكان"
            : "Set the timeline and venue details"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Registration Dates */}
        <div>
          <p className="mb-3 text-sm font-medium text-muted-foreground">
            {language === "ar" ? "فترة التسجيل" : "Registration Period"}
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>{language === "ar" ? "بداية التسجيل" : "Registration Start"}</Label>
              <Input
                type="datetime-local"
                value={data.registrationStart}
                onChange={(e) => onChange({ registrationStart: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>{language === "ar" ? "نهاية التسجيل" : "Registration End"}</Label>
              <Input
                type="datetime-local"
                value={data.registrationEnd}
                onChange={(e) => onChange({ registrationEnd: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Competition Dates */}
        <div>
          <p className="mb-3 text-sm font-medium text-muted-foreground">
            {language === "ar" ? "فترة المسابقة" : "Competition Period"}
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>{language === "ar" ? "بداية المسابقة" : "Competition Start"} *</Label>
              <Input
                type="datetime-local"
                value={data.competitionStart}
                onChange={(e) => onChange({ competitionStart: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>{language === "ar" ? "نهاية المسابقة" : "Competition End"} *</Label>
              <Input
                type="datetime-local"
                value={data.competitionEnd}
                onChange={(e) => onChange({ competitionEnd: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Virtual Toggle */}
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div>
            <p className="font-medium">
              {language === "ar" ? "مسابقة افتراضية" : "Virtual Competition"}
            </p>
            <p className="text-sm text-muted-foreground">
              {language === "ar" ? "تقام عبر الإنترنت" : "This competition takes place online"}
            </p>
          </div>
          <Switch checked={data.isVirtual} onCheckedChange={(v) => onChange({ isVirtual: v })} />
        </div>

        {/* Venue */}
        {!data.isVirtual && (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{language === "ar" ? "المكان (إنجليزي)" : "Venue (English)"}</Label>
                <Input
                  value={data.venue}
                  onChange={(e) => onChange({ venue: e.target.value })}
                  placeholder={language === "ar" ? "اسم المكان" : "Venue name"}
                />
              </div>
              <div className="space-y-2">
                <Label>{language === "ar" ? "المكان (عربي)" : "Venue (Arabic)"}</Label>
                <Input
                  value={data.venueAr}
                  onChange={(e) => onChange({ venueAr: e.target.value })}
                  placeholder="اسم المكان"
                  dir="rtl"
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{language === "ar" ? "المدينة" : "City"}</Label>
                <Input value={data.city} onChange={(e) => onChange({ city: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>{language === "ar" ? "الدولة" : "Country"}</Label>
                <Input value={data.country} onChange={(e) => onChange({ country: e.target.value })} />
              </div>
            </div>
          </>
        )}

        {/* Country Code & Edition */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>{language === "ar" ? "رمز الدولة (حرفين)" : "Country Code (ISO 2-letter)"} *</Label>
            <Input
              value={data.countryCode}
              onChange={(e) => onChange({ countryCode: e.target.value.toUpperCase().slice(0, 2) })}
              placeholder="SA, TN, AE..."
              maxLength={2}
            />
            <p className="text-xs text-muted-foreground">
              {competitionNumber
                ? `${language === "ar" ? "الحالي" : "Current"}: ${competitionNumber}`
                : language === "ar"
                ? "يُستخدم لإنشاء رقم المسابقة"
                : "Used to generate competition number"}
            </p>
          </div>
          <div className="space-y-2">
            <Label>{language === "ar" ? "سنة الإصدار" : "Edition Year"}</Label>
            <Input
              type="number"
              value={data.editionYear}
              onChange={(e) => onChange({ editionYear: parseInt(e.target.value) || new Date().getFullYear() })}
              min={2020}
              max={2050}
            />
          </div>
        </div>

        {/* Max Participants */}
        <div className="space-y-2">
          <Label>{language === "ar" ? "الحد الأقصى للمشاركين" : "Max Participants"}</Label>
          <Input
            type="number"
            value={data.maxParticipants}
            onChange={(e) => onChange({ maxParticipants: e.target.value ? parseInt(e.target.value) : "" })}
            placeholder={language === "ar" ? "اتركه فارغاً لعدد غير محدود" : "Leave empty for unlimited"}
          />
        </div>
      </CardContent>
    </Card>
  );
}
