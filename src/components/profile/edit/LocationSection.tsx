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
    <Card className="rounded-2xl border-border/30 bg-card/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-300">
      <CardHeader className="pb-3 px-6 pt-5">
        <CardTitle className="flex items-center gap-2.5 text-base">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-chart-5/10">
            <Globe className="h-4 w-4 text-chart-5" />
          </div>
          {isAr ? "الموقع" : "Location"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 px-6 pb-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <CountrySelector value={form.country_code} onChange={(c) => update("country_code", c)} label={isAr ? "بلد الإقامة" : "Country of Residence"} />
          <CountrySelector value={form.nationality} onChange={(c) => update("nationality", c)} label={isAr ? "الجنسية" : "Nationality"} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <CountrySelector value={form.second_nationality} onChange={(c) => update("second_nationality", c)} label={isAr ? "الجنسية الثانية" : "Second Nationality"} />
          <div className="flex items-center gap-3 pt-6">
            <Switch checked={form.show_nationality} onCheckedChange={(v) => update("show_nationality", v)} id="show-nationality" />
            <Label htmlFor="show-nationality" className="text-xs cursor-pointer font-medium">
              {isAr ? "إظهار الجنسية في الملف الشخصي" : "Show nationality on profile"}
            </Label>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">{isAr ? "المدينة" : "City"}</Label>
            <Input className="rounded-xl" value={form.city} onChange={(e) => update("city", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">{isAr ? "العنوان" : "Location"}</Label>
            <Input className="rounded-xl" value={form.location} onChange={(e) => update("location", e.target.value)} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">{isAr ? "الهاتف" : "Phone"}</Label>
          <Input className="rounded-xl" value={form.phone} onChange={(e) => update("phone", e.target.value)} dir="ltr" />
        </div>
      </CardContent>
    </Card>
  );
}
