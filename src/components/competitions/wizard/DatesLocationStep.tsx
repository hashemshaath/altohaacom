import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { CountrySelector } from "@/components/auth/CountrySelector";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

export function DatesLocationStep({ data, onChange, competitionNumber }: DatesLocationStepProps) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { data: countries } = useCountries();

  const handleCountryChange = (code: string, country: any) => {
    const name = isAr ? (country?.name_ar || country?.name || "") : (country?.name || "");
    const updates: Partial<CompetitionFormData> = { countryCode: code, country: name };

    // Auto-fill currency and tax from country
    if (country) {
      const countryData = countries?.find((c: any) => c.code === code);
      if (countryData) {
        updates.registrationCurrency = countryData.currency_code || "USD";
        updates.registrationTaxRate = Number(countryData.tax_rate) || 0;
        updates.registrationTaxName = countryData.tax_name || "VAT";
        updates.registrationTaxNameAr = countryData.tax_name_ar || "ضريبة القيمة المضافة";
      }
    }
    onChange(updates);
  };

  const toggleEntryType = (type: string) => {
    const current = data.allowedEntryTypes || ["individual"];
    const updated = current.includes(type)
      ? current.filter((t) => t !== type)
      : [...current, type];
    if (updated.length === 0) return; // at least one required
    onChange({ allowedEntryTypes: updated });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{isAr ? "التواريخ والموقع" : "Schedule & Location"}</CardTitle>
          <CardDescription>{isAr ? "حدد الجدول الزمني وتفاصيل المكان" : "Set the timeline and venue details"}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Registration Dates */}
          <div>
            <p className="mb-3 text-sm font-medium text-muted-foreground">{isAr ? "فترة التسجيل" : "Registration Period"}</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{isAr ? "بداية التسجيل" : "Registration Start"}</Label>
                <Input type="datetime-local" value={data.registrationStart} onChange={(e) => onChange({ registrationStart: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>{isAr ? "نهاية التسجيل" : "Registration End"}</Label>
                <Input type="datetime-local" value={data.registrationEnd} onChange={(e) => onChange({ registrationEnd: e.target.value })} />
              </div>
            </div>
          </div>

          {/* Competition Dates */}
          <div>
            <p className="mb-3 text-sm font-medium text-muted-foreground">{isAr ? "فترة المسابقة" : "Competition Period"}</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{isAr ? "بداية المسابقة" : "Competition Start"} *</Label>
                <Input type="datetime-local" value={data.competitionStart} onChange={(e) => onChange({ competitionStart: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>{isAr ? "نهاية المسابقة" : "Competition End"} *</Label>
                <Input type="datetime-local" value={data.competitionEnd} onChange={(e) => onChange({ competitionEnd: e.target.value })} />
              </div>
            </div>
          </div>

          {/* Virtual Toggle */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <p className="font-medium">{isAr ? "مسابقة افتراضية" : "Virtual Competition"}</p>
              <p className="text-sm text-muted-foreground">{isAr ? "تقام عبر الإنترنت" : "This competition takes place online"}</p>
            </div>
            <Switch checked={data.isVirtual} onCheckedChange={(v) => onChange({ isVirtual: v })} />
          </div>

          {/* Venue */}
          {!data.isVirtual && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>{isAr ? "المكان (إنجليزي)" : "Venue (English)"}</Label>
                  <Input value={data.venue} onChange={(e) => onChange({ venue: e.target.value })} placeholder={isAr ? "اسم المكان" : "Venue name"} />
                </div>
                <div className="space-y-2">
                  <Label>{isAr ? "المكان (عربي)" : "Venue (Arabic)"}</Label>
                  <Input value={data.venueAr} onChange={(e) => onChange({ venueAr: e.target.value })} placeholder="اسم المكان" dir="rtl" />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>{isAr ? "المدينة" : "City"}</Label>
                  <Input value={data.city} onChange={(e) => onChange({ city: e.target.value })} />
                </div>
                <CountrySelector value={data.countryCode} onChange={handleCountryChange} label={isAr ? "الدولة" : "Country"} />
              </div>
            </>
          )}

          {data.isVirtual && (
            <CountrySelector value={data.countryCode} onChange={handleCountryChange} label={isAr ? "الدولة (للترقيم)" : "Country (for numbering)"} required />
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>{isAr ? "رمز الدولة" : "Country Code"}</Label>
              <Input value={data.countryCode} readOnly className="bg-muted/50" />
              <p className="text-xs text-muted-foreground">
                {competitionNumber
                  ? `${isAr ? "الحالي" : "Current"}: ${competitionNumber}`
                  : isAr ? "يتم تعبئته تلقائياً من اختيار الدولة" : "Auto-filled from country selection"}
              </p>
            </div>
            <div className="space-y-2">
              <Label>{isAr ? "سنة الإصدار" : "Edition Year"}</Label>
              <Input type="number" value={data.editionYear} onChange={(e) => onChange({ editionYear: parseInt(e.target.value) || new Date().getFullYear() })} min={2020} max={2050} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>{isAr ? "الحد الأقصى للمشاركين" : "Max Participants"}</Label>
            <Input type="number" value={data.maxParticipants} onChange={(e) => onChange({ maxParticipants: e.target.value ? parseInt(e.target.value) : "" })} placeholder={isAr ? "اتركه فارغاً لعدد غير محدود" : "Leave empty for unlimited"} />
          </div>
        </CardContent>
      </Card>

      {/* Entry Types Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            {isAr ? "أنواع المشاركة" : "Entry Types"}
          </CardTitle>
          <CardDescription>{isAr ? "حدد كيف يمكن للمتسابقين التسجيل" : "Define how contestants can register"}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            {ENTRY_TYPES.map((type) => {
              const isChecked = (data.allowedEntryTypes || ["individual"]).includes(type.value);
              return (
                <label
                  key={type.value}
                  className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-all ${isChecked ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}
                >
                  <Checkbox checked={isChecked} onCheckedChange={() => toggleEntryType(type.value)} />
                  <type.icon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{isAr ? type.labelAr : type.labelEn}</span>
                </label>
              );
            })}
          </div>

          {(data.allowedEntryTypes || []).includes("team") && (
            <div className="grid gap-4 sm:grid-cols-2 pt-2 border-t">
              <div className="space-y-2">
                <Label>{isAr ? "الحد الأدنى لحجم الفريق" : "Min Team Size"}</Label>
                <Input type="number" value={data.minTeamSize} onChange={(e) => onChange({ minTeamSize: parseInt(e.target.value) || 2 })} min={2} max={20} />
              </div>
              <div className="space-y-2">
                <Label>{isAr ? "الحد الأقصى لحجم الفريق" : "Max Team Size"}</Label>
                <Input type="number" value={data.maxTeamSize} onChange={(e) => onChange({ maxTeamSize: parseInt(e.target.value) || 5 })} min={2} max={50} />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Registration Fee Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            {isAr ? "رسوم التسجيل" : "Registration Fee"}
          </CardTitle>
          <CardDescription>{isAr ? "حدد ما إذا كان التسجيل مجانياً أو مدفوعاً" : "Set whether registration is free or paid"}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            {(["free", "paid"] as const).map((type) => (
              <label
                key={type}
                className={`flex-1 flex items-center justify-center gap-2 rounded-lg border p-3 cursor-pointer transition-all ${data.registrationFeeType === type ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}
              >
                <input type="radio" name="feeType" value={type} checked={data.registrationFeeType === type} onChange={() => onChange({ registrationFeeType: type })} className="sr-only" />
                <Badge variant={data.registrationFeeType === type ? "default" : "outline"}>
                  {type === "free" ? (isAr ? "مجاني" : "Free") : (isAr ? "مدفوع" : "Paid")}
                </Badge>
              </label>
            ))}
          </div>

          {data.registrationFeeType === "paid" && (
            <div className="space-y-4 pt-2 border-t">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label>{isAr ? "رسوم التسجيل" : "Fee Amount"}</Label>
                  <Input type="number" value={data.registrationFee} onChange={(e) => onChange({ registrationFee: parseFloat(e.target.value) || 0 })} min={0} step={0.01} />
                </div>
                <div className="space-y-2">
                  <Label>{isAr ? "العملة" : "Currency"}</Label>
                  <Input value={data.registrationCurrency} readOnly className="bg-muted/50" />
                  <p className="text-xs text-muted-foreground">{isAr ? "من إعدادات الدولة" : "From country settings"}</p>
                </div>
                <div className="space-y-2">
                  <Label>{isAr ? "نسبة الضريبة %" : "Tax Rate %"}</Label>
                  <Input type="number" value={data.registrationTaxRate} readOnly className="bg-muted/50" />
                  <p className="text-xs text-muted-foreground">
                    {isAr ? data.registrationTaxNameAr : data.registrationTaxName}
                  </p>
                </div>
              </div>

              {data.registrationFee > 0 && (
                <div className="rounded-lg bg-muted/50 p-3 text-sm">
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
