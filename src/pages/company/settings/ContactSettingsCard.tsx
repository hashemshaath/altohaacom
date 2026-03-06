import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Phone, Mail, Globe, MapPin } from "lucide-react";

interface Props {
  form: Record<string, any>;
  setForm: (f: Record<string, any>) => void;
  isAr: boolean;
}

export function ContactSettingsCard({ form, setForm, isAr }: Props) {
  return (
    <Card className="rounded-2xl border-border/20 bg-card/60 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-300">
      <CardHeader className="pb-3 px-6 pt-5">
        <CardTitle className="flex items-center gap-2.5 text-base">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-chart-3/10">
            <Phone className="h-4 w-4 text-chart-3" />
          </div>
          {isAr ? "معلومات الاتصال" : "Contact Information"}
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground/70 ms-[46px]">
          {isAr ? "بيانات التواصل والموقع الإلكتروني" : "Communication details and website"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 px-6 pb-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-xs font-semibold flex items-center gap-1.5">
              <Mail className="h-3 w-3 text-muted-foreground/60" />
              {isAr ? "البريد الإلكتروني" : "Email"}
            </Label>
            <Input
              className="rounded-xl border-border/20 bg-muted/5"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="info@company.com"
              dir="ltr"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold flex items-center gap-1.5">
              <Globe className="h-3 w-3 text-muted-foreground/60" />
              {isAr ? "الموقع الإلكتروني" : "Website"}
            </Label>
            <Input
              className="rounded-xl border-border/20 bg-muted/5"
              value={form.website}
              onChange={(e) => setForm({ ...form, website: e.target.value })}
              placeholder="https://www.example.com"
              dir="ltr"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold flex items-center gap-1.5">
              <Phone className="h-3 w-3 text-muted-foreground/60" />
              {isAr ? "الهاتف الرئيسي" : "Primary Phone"}
            </Label>
            <Input
              className="rounded-xl border-border/20 bg-muted/5"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+966 5X XXX XXXX"
              dir="ltr"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold flex items-center gap-1.5">
              <Phone className="h-3 w-3 text-muted-foreground/60" />
              {isAr ? "الهاتف الثانوي" : "Secondary Phone"}
            </Label>
            <Input
              className="rounded-xl border-border/20 bg-muted/5"
              value={form.phone_secondary}
              onChange={(e) => setForm({ ...form, phone_secondary: e.target.value })}
              placeholder="+966 5X XXX XXXX"
              dir="ltr"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold">{isAr ? "الفاكس" : "Fax"}</Label>
            <Input
              className="rounded-xl border-border/20 bg-muted/5"
              value={form.fax}
              onChange={(e) => setForm({ ...form, fax: e.target.value })}
              dir="ltr"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold flex items-center gap-1.5">
              <MapPin className="h-3 w-3 text-muted-foreground/60" />
              {isAr ? "رابط خرائط قوقل" : "Google Maps URL"}
            </Label>
            <Input
              className="rounded-xl border-border/20 bg-muted/5"
              value={form.google_maps_url}
              onChange={(e) => setForm({ ...form, google_maps_url: e.target.value })}
              placeholder="https://maps.google.com/..."
              dir="ltr"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
