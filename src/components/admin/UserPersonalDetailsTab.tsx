import { memo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CountrySelector } from "@/components/auth/CountrySelector";

interface PersonalDetailsForm {
  dateOfBirth: string;
  gender: string;
  preferredLanguage: string;
  nationality: string;
}

interface Props {
  form: PersonalDetailsForm;
  onChange: (updates: Partial<PersonalDetailsForm>) => void;
  isAr: boolean;
}

const GENDERS = [
  { value: "male", en: "Male", ar: "ذكر" },
  { value: "female", en: "Female", ar: "أنثى" },
  { value: "prefer_not_to_say", en: "Prefer not to say", ar: "أفضل عدم التحديد" },
];

const LANGUAGES = [
  { value: "ar", en: "Arabic", ar: "العربية" },
  { value: "en", en: "English", ar: "الإنجليزية" },
  { value: "fr", en: "French", ar: "الفرنسية" },
  { value: "es", en: "Spanish", ar: "الإسبانية" },
  { value: "tr", en: "Turkish", ar: "التركية" },
  { value: "ur", en: "Urdu", ar: "الأردية" },
  { value: "hi", en: "Hindi", ar: "الهندية" },
  { value: "zh", en: "Chinese", ar: "الصينية" },
];

export function UserPersonalDetailsTab({ form, onChange, isAr }: Props) {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>{isAr ? "تاريخ الميلاد" : "Date of Birth"}</Label>
          <Input
            type="date"
            value={form.dateOfBirth}
            onChange={(e) => onChange({ dateOfBirth: e.target.value })}
            dir="ltr"
            max={new Date().toISOString().split("T")[0]}
          />
        </div>
        <div className="space-y-2">
          <Label>{isAr ? "الجنس" : "Gender"}</Label>
          <Select value={form.gender} onValueChange={(v) => onChange({ gender: v })}>
            <SelectTrigger>
              <SelectValue placeholder={isAr ? "اختر الجنس" : "Select gender"} />
            </SelectTrigger>
            <SelectContent>
              {GENDERS.map((g) => (
                <SelectItem key={g.value} value={g.value}>
                  {isAr ? g.ar : g.en}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>{isAr ? "اللغة المفضلة" : "Preferred Language"}</Label>
          <Select value={form.preferredLanguage} onValueChange={(v) => onChange({ preferredLanguage: v })}>
            <SelectTrigger>
              <SelectValue placeholder={isAr ? "اختر اللغة" : "Select language"} />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map((l) => (
                <SelectItem key={l.value} value={l.value}>
                  {isAr ? l.ar : l.en}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <CountrySelector
          value={form.nationality}
          onChange={(code) => onChange({ nationality: code })}
          label={isAr ? "الجنسية" : "Nationality"}
        />
      </div>
    </div>
  );
}
