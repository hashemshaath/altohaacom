import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { CountrySelector } from "@/components/auth/CountrySelector";
import { Globe } from "lucide-react";

interface LocationSectionProps {
  form: Record<string, any>;
  update: (k: string, v: any) => void;
  isAr: boolean;
}

export function LocationSection({ form, update, isAr }: LocationSectionProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Globe className="h-4 w-4 text-chart-5" />
          {isAr ? "الموقع" : "Location"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <CountrySelector value={form.country_code} onChange={(c) => update("country_code", c)} label={isAr ? "بلد الإقامة" : "Country of Residence"} />
          <CountrySelector value={form.nationality} onChange={(c) => update("nationality", c)} label={isAr ? "الجنسية" : "Nationality"} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <CountrySelector value={form.second_nationality} onChange={(c) => update("second_nationality", c)} label={isAr ? "الجنسية الثانية" : "Second Nationality"} />
          <div className="flex items-center gap-3 pt-6">
            <Switch checked={form.show_nationality} onCheckedChange={(v) => update("show_nationality", v)} id="show-nationality" />
            <Label htmlFor="show-nationality" className="text-xs cursor-pointer">
              {isAr ? "إظهار الجنسية في الملف الشخصي" : "Show nationality on profile"}
            </Label>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs">{isAr ? "المدينة" : "City"}</Label>
            <Input value={form.city} onChange={(e) => update("city", e.target.value)} dir={isAr ? "rtl" : "ltr"} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{isAr ? "العنوان" : "Location"}</Label>
            <Input value={form.location} onChange={(e) => update("location", e.target.value)} dir={isAr ? "rtl" : "ltr"} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">{isAr ? "الهاتف" : "Phone"}</Label>
          <Input value={form.phone} onChange={(e) => update("phone", e.target.value)} dir="ltr" />
        </div>
      </CardContent>
    </Card>
  );
}
