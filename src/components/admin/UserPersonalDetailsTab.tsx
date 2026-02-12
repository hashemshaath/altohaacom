import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CountrySelector } from "@/components/auth/CountrySelector";
import { EntitySelector } from "@/components/admin/EntitySelector";

interface PersonalDetailsForm {
  dateOfBirth: string;
  gender: string;
  preferredLanguage: string;
  nationality: string;
  educationLevel: string;
  educationInstitution: string;
  educationEntityId: string;
  yearsOfExperience: string;
  experienceLevel: string;
}

interface Props {
  form: PersonalDetailsForm;
  onChange: (updates: Partial<PersonalDetailsForm>) => void;
  isAr: boolean;
}

const EDUCATION_LEVELS = [
  { value: "high_school", en: "High School", ar: "ثانوية عامة" },
  { value: "diploma", en: "Diploma", ar: "دبلوم" },
  { value: "bachelors", en: "Bachelor's Degree", ar: "بكالوريوس" },
  { value: "masters", en: "Master's Degree", ar: "ماجستير" },
  { value: "doctorate", en: "Doctorate / PhD", ar: "دكتوراه" },
  { value: "culinary_certificate", en: "Culinary Certificate", ar: "شهادة طهي" },
  { value: "other", en: "Other", ar: "أخرى" },
];

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

const EXPERIENCE_LEVELS = [
  { value: "beginner", en: "Beginner", ar: "مبتدئ" },
  { value: "amateur", en: "Amateur", ar: "هاوٍ" },
  { value: "professional", en: "Professional", ar: "محترف" },
];

export function UserPersonalDetailsTab({ form, onChange, isAr }: Props) {
  return (
    <div className="space-y-5">
      {/* Date of Birth & Gender */}
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

      {/* Language & Nationality */}
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

      {/* Education */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>{isAr ? "المستوى التعليمي" : "Education Level"}</Label>
          <Select value={form.educationLevel} onValueChange={(v) => onChange({ educationLevel: v })}>
            <SelectTrigger>
              <SelectValue placeholder={isAr ? "اختر المستوى" : "Select level"} />
            </SelectTrigger>
            <SelectContent>
              {EDUCATION_LEVELS.map((e) => (
                <SelectItem key={e.value} value={e.value}>
                  {isAr ? e.ar : e.en}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <EntitySelector
          value={form.educationEntityId || null}
          entityName={form.educationInstitution}
          onChange={(entityId, entityName) => {
            onChange({
              educationEntityId: entityId || "",
              educationInstitution: entityName,
            });
          }}
        />
      </div>

      {/* Experience */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>{isAr ? "مستوى الخبرة" : "Experience Level"}</Label>
          <Select value={form.experienceLevel} onValueChange={(v) => onChange({ experienceLevel: v })}>
            <SelectTrigger>
              <SelectValue placeholder={isAr ? "اختر المستوى" : "Select level"} />
            </SelectTrigger>
            <SelectContent>
              {EXPERIENCE_LEVELS.map((e) => (
                <SelectItem key={e.value} value={e.value}>
                  {isAr ? e.ar : e.en}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>{isAr ? "سنوات الخبرة" : "Years of Experience"}</Label>
          <Input
            type="number"
            min="0"
            max="60"
            value={form.yearsOfExperience}
            onChange={(e) => onChange({ yearsOfExperience: e.target.value })}
            placeholder={isAr ? "عدد السنوات" : "Number of years"}
            dir="ltr"
          />
        </div>
      </div>
    </div>
  );
}
