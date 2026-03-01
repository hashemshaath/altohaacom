import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { CountrySelector } from "@/components/auth/CountrySelector";
import { Globe, MapPin, Phone } from "lucide-react";

interface LocationSectionProps {
  form: Record<string, any>;
  update: (k: string, v: any) => void;
  isAr: boolean;
}

export function LocationSection({ form, update, isAr }: LocationSectionProps) {
  return (
    <Card className="rounded-2xl border-border/20 bg-card/60 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-300">
      <CardHeader className="pb-3 px-6 pt-5">
        <CardTitle className="flex items-center gap-2.5 text-base">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-chart-5/10">
            <Globe className="h-4 w-4 text-chart-5" />
          </div>
          {isAr ? "الموقع والتواصل" : "Location & Contact"}
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground/70 ms-[46px]">
          {isAr ? "بلد الإقامة والجنسية ومعلومات الاتصال" : "Your residence, nationality, and contact details"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5 px-6 pb-6">
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
          <div className="space-y-2">
            <Label className="text-xs font-semibold flex items-center gap-1.5">
              <MapPin className="h-3 w-3 text-muted-foreground/60" />
              {isAr ? "المدينة" : "City"}
            </Label>
            <Input className="rounded-xl border-border/20 bg-muted/5" value={form.city} onChange={(e) => update("city", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold">{isAr ? "العنوان" : "Location"}</Label>
            <Input className="rounded-xl border-border/20 bg-muted/5" value={form.location} onChange={(e) => update("location", e.target.value)} />
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-semibold flex items-center gap-1.5">
            <Phone className="h-3 w-3 text-muted-foreground/60" />
            {isAr ? "الهاتف" : "Phone"}
          </Label>
          <Input className="rounded-xl border-border/20 bg-muted/5 max-w-sm" value={form.phone} onChange={(e) => update("phone", e.target.value)} dir="ltr" />
        </div>
      </CardContent>
    </Card>
  );
}
