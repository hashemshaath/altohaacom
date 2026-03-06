import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin } from "lucide-react";

interface Props {
  form: Record<string, any>;
  setForm: (f: Record<string, any>) => void;
  isAr: boolean;
}

const COUNTRIES = [
  { value: "SA", label: "🇸🇦 Saudi Arabia", labelAr: "🇸🇦 المملكة العربية السعودية" },
  { value: "AE", label: "🇦🇪 UAE", labelAr: "🇦🇪 الإمارات" },
  { value: "KW", label: "🇰🇼 Kuwait", labelAr: "🇰🇼 الكويت" },
  { value: "BH", label: "🇧🇭 Bahrain", labelAr: "🇧🇭 البحرين" },
  { value: "QA", label: "🇶🇦 Qatar", labelAr: "🇶🇦 قطر" },
  { value: "OM", label: "🇴🇲 Oman", labelAr: "🇴🇲 عمان" },
  { value: "EG", label: "🇪🇬 Egypt", labelAr: "🇪🇬 مصر" },
  { value: "JO", label: "🇯🇴 Jordan", labelAr: "🇯🇴 الأردن" },
  { value: "LB", label: "🇱🇧 Lebanon", labelAr: "🇱🇧 لبنان" },
  { value: "TN", label: "🇹🇳 Tunisia", labelAr: "🇹🇳 تونس" },
  { value: "MA", label: "🇲🇦 Morocco", labelAr: "🇲🇦 المغرب" },
  { value: "US", label: "🇺🇸 United States", labelAr: "🇺🇸 الولايات المتحدة" },
  { value: "GB", label: "🇬🇧 United Kingdom", labelAr: "🇬🇧 المملكة المتحدة" },
];

export function AddressSettingsCard({ form, setForm, isAr }: Props) {
  return (
    <Card className="rounded-2xl border-border/20 bg-card/60 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-300">
      <CardHeader className="pb-3 px-6 pt-5">
        <CardTitle className="flex items-center gap-2.5 text-base">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-chart-5/10">
            <MapPin className="h-4 w-4 text-chart-5" />
          </div>
          {isAr ? "العنوان والموقع" : "Address & Location"}
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground/70 ms-[46px]">
          {isAr ? "العنوان التفصيلي وموقع الشركة الجغرافي" : "Detailed address and geographic location"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 px-6 pb-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-xs font-semibold">{isAr ? "الدولة" : "Country"}</Label>
            <Select value={form.country_code || ""} onValueChange={(v) => setForm({ ...form, country_code: v })}>
              <SelectTrigger className="rounded-xl border-border/20 bg-muted/5">
                <SelectValue placeholder={isAr ? "اختر الدولة" : "Select country"} />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {COUNTRIES.map(c => (
                  <SelectItem key={c.value} value={c.value}>{isAr ? c.labelAr : c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold">{isAr ? "المدينة" : "City"}</Label>
            <Input
              className="rounded-xl border-border/20 bg-muted/5"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              placeholder={isAr ? "الرياض" : "Riyadh"}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold">{isAr ? "الحي" : "District"}</Label>
            <Input
              className="rounded-xl border-border/20 bg-muted/5"
              value={form.district}
              onChange={(e) => setForm({ ...form, district: e.target.value })}
              dir="ltr"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold">{isAr ? "الحي (عربي)" : "District (Arabic)"}</Label>
            <Input
              className="rounded-xl border-border/20 bg-muted/5"
              value={form.district_ar}
              onChange={(e) => setForm({ ...form, district_ar: e.target.value })}
              dir="rtl"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold">{isAr ? "الشارع" : "Street"}</Label>
            <Input
              className="rounded-xl border-border/20 bg-muted/5"
              value={form.street}
              onChange={(e) => setForm({ ...form, street: e.target.value })}
              dir="ltr"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold">{isAr ? "الشارع (عربي)" : "Street (Arabic)"}</Label>
            <Input
              className="rounded-xl border-border/20 bg-muted/5"
              value={form.street_ar}
              onChange={(e) => setForm({ ...form, street_ar: e.target.value })}
              dir="rtl"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold">{isAr ? "الرمز البريدي" : "Postal Code"}</Label>
            <Input
              className="rounded-xl border-border/20 bg-muted/5"
              value={form.postal_code}
              onChange={(e) => setForm({ ...form, postal_code: e.target.value })}
              dir="ltr"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold">{isAr ? "العنوان الوطني" : "National Address"}</Label>
            <Input
              className="rounded-xl border-border/20 bg-muted/5"
              value={form.national_address}
              onChange={(e) => setForm({ ...form, national_address: e.target.value })}
              dir="ltr"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
