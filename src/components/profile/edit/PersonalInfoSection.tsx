import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User } from "lucide-react";

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
          <div className="space-y-1.5">
            <Label className="text-xs">{isAr ? "الاسم الكامل (إنجليزي)" : "Full Name (English)"}</Label>
            <Input value={form.full_name} onChange={(e) => update("full_name", e.target.value)} dir="ltr" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{isAr ? "الاسم الكامل (عربي)" : "Full Name (Arabic)"}</Label>
            <Input value={form.full_name_ar} onChange={(e) => update("full_name_ar", e.target.value)} dir="rtl" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{isAr ? "الاسم المعروض (إنجليزي)" : "Display Name (English)"}</Label>
            <Input value={form.display_name} onChange={(e) => update("display_name", e.target.value)} dir="ltr" placeholder="Chef John" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{isAr ? "الاسم المعروض (عربي)" : "Display Name (Arabic)"}</Label>
            <Input value={form.display_name_ar} onChange={(e) => update("display_name_ar", e.target.value)} dir="rtl" placeholder="الشيف جون" />
          </div>
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
          <div className="space-y-1.5">
            <Label className="text-xs">{isAr ? "النبذة (إنجليزي)" : "Bio (English)"}</Label>
            <Textarea value={form.bio} onChange={(e) => update("bio", e.target.value)} rows={3} dir="ltr" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{isAr ? "النبذة (عربي)" : "Bio (Arabic)"}</Label>
            <Textarea value={form.bio_ar} onChange={(e) => update("bio_ar", e.target.value)} rows={3} dir="rtl" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
