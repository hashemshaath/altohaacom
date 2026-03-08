import { memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { CountrySelector } from "@/components/auth/CountrySelector";
import { AITextOptimizer } from "@/components/admin/AITextOptimizer";
import { DollarSign, Users, UserPlus, Building2 } from "lucide-react";
import type { CompetitionFormData } from "./types";
import { useCountries } from "@/hooks/useCountries";

interface DatesLocationStepProps {
  data: CompetitionFormData;
  onChange: (updates: Partial<CompetitionFormData>) => void;
  competitionNumber?: string | null;
}

const ENTRY_TYPES = [
  { value: "individual", labelEn: "Individual", labelAr: "فردي", icon: UserPlus },
  { value: "team", labelEn: "Team / Group", labelAr: "فريق / مجموعة", icon: Users },
  { value: "organization", labelEn: "Organization", labelAr: "منظمة / جهة", icon: Building2 },
];

export const DatesLocationStep = memo(function DatesLocationStep({ data, onChange, competitionNumber }: DatesLocationStepProps) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { data: countries } = useCountries();

  const handleCountryChange = (code: string, country: any) => {
    const name = isAr ? (country?.name_ar || country?.name || "") : (country?.name || "");
    const updates: Partial<CompetitionFormData> = { countryCode: code, country: name };
    if (country) {
      const countryData = countries?.find((c: any) => c.code === code);
      if (countryData) {
        updates.registrationCurrency = countryData.currency_code || "SAR";
        updates.registrationTaxRate = Number(countryData.tax_rate) || 0;
        updates.registrationTaxName = countryData.tax_name || "VAT";
        updates.registrationTaxNameAr = countryData.tax_name_ar || "ضريبة القيمة المضافة";
      }
    }
    onChange(updates);
  };

  const toggleEntryType = (type: string) => {
    const current = data.allowedEntryTypes || ["individual"];
    const updated = current.includes(type) ? current.filter((t) => t !== type) : [...current, type];
    if (updated.length === 0) return;
    onChange({ allowedEntryTypes: updated });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>{isAr ? "التواريخ والموقع" : "Schedule & Location"}</CardTitle>
          <CardDescription>{isAr ? "حدد الجدول الزمني وتفاصيل المكان" : "Set the timeline and venue details"}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <p className="mb-2 text-sm font-medium text-muted-foreground">{isAr ? "فترة التسجيل" : "Registration Period"}</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs">{isAr ? "بداية التسجيل" : "Registration Start"}</Label>
                <Input type="datetime-local" value={data.registrationStart} onChange={(e) => onChange({ registrationStart: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{isAr ? "نهاية التسجيل" : "Registration End"}</Label>
                <Input type="datetime-local" value={data.registrationEnd} onChange={(e) => onChange({ registrationEnd: e.target.value })} />
              </div>
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-muted-foreground">{isAr ? "فترة المسابقة" : "Competition Period"}</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs">{isAr ? "بداية المسابقة" : "Competition Start"} *</Label>
                <Input type="datetime-local" value={data.competitionStart} onChange={(e) => onChange({ competitionStart: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{isAr ? "نهاية المسابقة" : "Competition End"} *</Label>
                <Input type="datetime-local" value={data.competitionEnd} onChange={(e) => onChange({ competitionEnd: e.target.value })} />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl border p-3">
            <div>
              <p className="font-medium text-sm">{isAr ? "مسابقة افتراضية" : "Virtual Competition"}</p>
              <p className="text-xs text-muted-foreground">{isAr ? "تقام عبر الإنترنت" : "This competition takes place online"}</p>
            </div>
            <Switch checked={data.isVirtual} onCheckedChange={(v) => onChange({ isVirtual: v })} />
          </div>

          {!data.isVirtual && (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">{isAr ? "المكان (إنجليزي)" : "Venue (English)"}</Label>
                    <AITextOptimizer text={data.venue} lang="en" compact onOptimized={(v) => onChange({ venue: v })} onTranslated={(v) => onChange({ venueAr: v })} />
                  </div>
                  <Input value={data.venue} onChange={(e) => onChange({ venue: e.target.value })} placeholder={isAr ? "اسم المكان" : "Venue name"} />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">{isAr ? "المكان (عربي)" : "Venue (Arabic)"}</Label>
                    <AITextOptimizer text={data.venueAr} lang="ar" compact onOptimized={(v) => onChange({ venueAr: v })} onTranslated={(v) => onChange({ venue: v })} />
                  </div>
                  <Input value={data.venueAr} onChange={(e) => onChange({ venueAr: e.target.value })} placeholder="اسم المكان" dir="rtl" />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">{isAr ? "المدينة" : "City"}</Label>
                  <Input value={data.city} onChange={(e) => onChange({ city: e.target.value })} />
                </div>
                <CountrySelector value={data.countryCode} onChange={handleCountryChange} label={isAr ? "الدولة" : "Country"} />
              </div>
            </>
          )}

          {data.isVirtual && (
            <CountrySelector value={data.countryCode} onChange={handleCountryChange} label={isAr ? "الدولة (للترقيم)" : "Country (for numbering)"} required />
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">{isAr ? "رمز الدولة" : "Country Code"}</Label>
              <Input value={data.countryCode} readOnly className="bg-muted/50" />
              <p className="text-[10px] text-muted-foreground">
                {competitionNumber
                  ? `${isAr ? "الحالي" : "Current"}: ${competitionNumber}`
                  : isAr ? "يتم تعبئته تلقائياً" : "Auto-filled from country"}
              </p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{isAr ? "سنة الإصدار" : "Edition Year"}</Label>
              <Input type="number" value={data.editionYear} onChange={(e) => onChange({ editionYear: parseInt(e.target.value) || new Date().getFullYear() })} min={2020} max={2050} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">{isAr ? "الحد الأقصى للمشاركين" : "Max Participants"}</Label>
            <Input type="number" value={data.maxParticipants} onChange={(e) => onChange({ maxParticipants: e.target.value ? parseInt(e.target.value) : "" })} placeholder={isAr ? "اتركه فارغاً لعدد غير محدود" : "Leave empty for unlimited"} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4 text-primary" />
            {isAr ? "أنواع المشاركة" : "Entry Types"}
          </CardTitle>
          <CardDescription className="text-xs">{isAr ? "حدد كيف يمكن للمتسابقين التسجيل" : "Define how contestants can register"}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2 sm:grid-cols-3">
            {ENTRY_TYPES.map((type) => {
              const isChecked = (data.allowedEntryTypes || ["individual"]).includes(type.value);
              return (
                <label
                  key={type.value}
                  className={`flex items-center gap-2 rounded-xl border p-2.5 cursor-pointer transition-all text-sm ${isChecked ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}
                >
                  <Checkbox checked={isChecked} onCheckedChange={() => toggleEntryType(type.value)} />
                  <type.icon className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium">{isAr ? type.labelAr : type.labelEn}</span>
                </label>
              );
            })}
          </div>

          {(data.allowedEntryTypes || []).includes("team") && (
            <div className="grid gap-3 sm:grid-cols-2 pt-2 border-t">
              <div className="space-y-1.5">
                <Label className="text-xs">{isAr ? "الحد الأدنى لحجم الفريق" : "Min Team Size"}</Label>
                <Input type="number" value={data.minTeamSize} onChange={(e) => onChange({ minTeamSize: parseInt(e.target.value) || 2 })} min={2} max={20} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{isAr ? "الحد الأقصى لحجم الفريق" : "Max Team Size"}</Label>
                <Input type="number" value={data.maxTeamSize} onChange={(e) => onChange({ maxTeamSize: parseInt(e.target.value) || 5 })} min={2} max={50} />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <DollarSign className="h-4 w-4 text-primary" />
            {isAr ? "رسوم التسجيل" : "Registration Fee"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            {(["free", "paid"] as const).map((type) => (
              <label
                key={type}
                className={`flex-1 flex items-center justify-center gap-2 rounded-xl border p-2.5 cursor-pointer transition-all ${data.registrationFeeType === type ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}
              >
                <input type="radio" name="feeType" value={type} checked={data.registrationFeeType === type} onChange={() => onChange({ registrationFeeType: type })} className="sr-only" />
                <Badge variant={data.registrationFeeType === type ? "default" : "outline"} className="text-xs">
                  {type === "free" ? (isAr ? "مجاني" : "Free") : (isAr ? "مدفوع" : "Paid")}
                </Badge>
              </label>
            ))}
          </div>

          {data.registrationFeeType === "paid" && (
            <div className="space-y-3 pt-2 border-t">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">{isAr ? "رسوم التسجيل" : "Fee Amount"}</Label>
                  <Input type="number" value={data.registrationFee} onChange={(e) => onChange({ registrationFee: parseFloat(e.target.value) || 0 })} min={0} step={0.01} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">{isAr ? "العملة" : "Currency"}</Label>
                  <Input value={data.registrationCurrency} readOnly className="bg-muted/50" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">{isAr ? "نسبة الضريبة %" : "Tax Rate %"}</Label>
                  <Input type="number" value={data.registrationTaxRate} readOnly className="bg-muted/50" />
                </div>
              </div>

              {data.registrationFee > 0 && (
                <div className="rounded-xl bg-muted/50 p-2.5 text-xs">
                  <div className="flex justify-between">
                    <span>{isAr ? "الرسوم" : "Fee"}</span>
                    <span>{data.registrationFee} {data.registrationCurrency}</span>
                  </div>
                  {data.registrationTaxRate > 0 && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>{isAr ? data.registrationTaxNameAr : data.registrationTaxName} ({data.registrationTaxRate}%)</span>
                      <span>{(data.registrationFee * data.registrationTaxRate / 100).toFixed(2)} {data.registrationCurrency}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold border-t pt-1 mt-1">
                    <span>{isAr ? "المجموع" : "Total"}</span>
                    <span>{(data.registrationFee * (1 + data.registrationTaxRate / 100)).toFixed(2)} {data.registrationCurrency}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
