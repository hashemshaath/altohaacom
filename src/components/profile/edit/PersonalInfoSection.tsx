import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User } from "lucide-react";
import { TranslatableInput } from "./TranslatableInput";

const GENDERS = [
  { value: "male", en: "Male", ar: "ذكر" },
  { value: "female", en: "Female", ar: "أنثى" },
  { value: "prefer_not_to_say", en: "Prefer not to say", ar: "أفضل عدم التحديد" },
];

interface PersonalInfoSectionProps {
  form: Record<string, any>;
  update: (k: string, v: any) => void;
  isAr: boolean;
}

export function PersonalInfoSection({ form, update, isAr }: PersonalInfoSectionProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <User className="h-4 w-4 text-primary" />
          {isAr ? "المعلومات الشخصية" : "Personal Information"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <TranslatableInput
            label={isAr ? "الاسم الكامل (إنجليزي)" : "Full Name (English)"}
            value={form.full_name} onChange={(v) => update("full_name", v)}
            dir="ltr" lang="en"
            pairedValue={form.full_name_ar} onTranslated={(v) => update("full_name_ar", v)}
          />
          <TranslatableInput
            label={isAr ? "الاسم الكامل (عربي)" : "Full Name (Arabic)"}
            value={form.full_name_ar} onChange={(v) => update("full_name_ar", v)}
            dir="rtl" lang="ar"
            pairedValue={form.full_name} onTranslated={(v) => update("full_name", v)}
          />
          <TranslatableInput
            label={isAr ? "الاسم المعروض (إنجليزي)" : "Display Name (English)"}
            value={form.display_name} onChange={(v) => update("display_name", v)}
            dir="ltr" lang="en" placeholder="Chef John"
            pairedValue={form.display_name_ar} onTranslated={(v) => update("display_name_ar", v)}
          />
          <TranslatableInput
            label={isAr ? "الاسم المعروض (عربي)" : "Display Name (Arabic)"}
            value={form.display_name_ar} onChange={(v) => update("display_name_ar", v)}
            dir="rtl" lang="ar" placeholder="الشيف جون"
            pairedValue={form.display_name} onTranslated={(v) => update("display_name", v)}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label className="text-xs">{isAr ? "تاريخ الميلاد" : "Date of Birth"}</Label>
            <Input type="date" value={form.date_of_birth} onChange={(e) => update("date_of_birth", e.target.value)} dir="ltr" max={new Date().toISOString().split("T")[0]} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{isAr ? "الجنس" : "Gender"}</Label>
            <Select value={form.gender} onValueChange={(v) => update("gender", v)}>
              <SelectTrigger><SelectValue placeholder={isAr ? "اختر" : "Select"} /></SelectTrigger>
              <SelectContent>
                {GENDERS.map((g) => <SelectItem key={g.value} value={g.value}>{isAr ? g.ar : g.en}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{isAr ? "اللغة المفضلة" : "Preferred Language"}</Label>
            <Select value={form.preferred_language} onValueChange={(v) => update("preferred_language", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ar">{isAr ? "العربية" : "Arabic"}</SelectItem>
                <SelectItem value="en">{isAr ? "الإنجليزية" : "English"}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <TranslatableInput
            label={isAr ? "النبذة (إنجليزي)" : "Bio (English)"}
            value={form.bio} onChange={(v) => update("bio", v)}
            dir="ltr" lang="en" multiline rows={3}
            pairedValue={form.bio_ar} onTranslated={(v) => update("bio_ar", v)}
          />
          <TranslatableInput
            label={isAr ? "النبذة (عربي)" : "Bio (Arabic)"}
            value={form.bio_ar} onChange={(v) => update("bio_ar", v)}
            dir="rtl" lang="ar" multiline rows={3}
            pairedValue={form.bio} onTranslated={(v) => update("bio", v)}
          />
        </div>
      </CardContent>
    </Card>
  );
}
