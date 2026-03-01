import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Briefcase } from "lucide-react";
import { TranslatableInput } from "./TranslatableInput";

interface ProfessionalInfoSectionProps {
  form: Record<string, any>;
  update: (k: string, v: any) => void;
  isAr: boolean;
}

export function ProfessionalInfoSection({ form, update, isAr }: ProfessionalInfoSectionProps) {
  return (
    <Card className="rounded-2xl border-border/30 bg-card/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-300">
      <CardHeader className="pb-3 px-6 pt-5">
        <CardTitle className="flex items-center gap-2.5 text-base">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-chart-3/10">
            <Briefcase className="h-4 w-4 text-chart-3" />
          </div>
          {isAr ? "المعلومات المهنية" : "Professional Information"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 px-6 pb-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <TranslatableInput
            label={isAr ? "المسمى الوظيفي (إنجليزي)" : "Job Title (English)"}
            value={form.job_title} onChange={(v) => update("job_title", v)}
            dir="ltr" lang="en" placeholder="Executive Chef"
            pairedValue={form.job_title_ar} onTranslated={(v) => update("job_title_ar", v)}
          />
          <TranslatableInput
            label={isAr ? "المسمى الوظيفي (عربي)" : "Job Title (Arabic)"}
            value={form.job_title_ar} onChange={(v) => update("job_title_ar", v)}
            dir="rtl" lang="ar" placeholder="الشيف التنفيذي"
            pairedValue={form.job_title} onTranslated={(v) => update("job_title", v)}
          />
          <TranslatableInput
            label={isAr ? "التخصص (إنجليزي)" : "Specialization (English)"}
            value={form.specialization} onChange={(v) => update("specialization", v)}
            dir="ltr" lang="en"
            pairedValue={form.specialization_ar} onTranslated={(v) => update("specialization_ar", v)}
          />
          <TranslatableInput
            label={isAr ? "التخصص (عربي)" : "Specialization (Arabic)"}
            value={form.specialization_ar} onChange={(v) => update("specialization_ar", v)}
            dir="rtl" lang="ar"
            pairedValue={form.specialization} onTranslated={(v) => update("specialization", v)}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">{isAr ? "مستوى الخبرة" : "Experience Level"}</Label>
            <Select value={form.experience_level} onValueChange={(v) => update("experience_level", v)}>
              <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">{isAr ? "مبتدئ" : "Beginner"}</SelectItem>
                <SelectItem value="amateur">{isAr ? "هاوي" : "Amateur"}</SelectItem>
                <SelectItem value="professional">{isAr ? "محترف" : "Professional"}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">{isAr ? "سنوات الخبرة" : "Years of Experience"}</Label>
            <Input className="rounded-xl" type="number" min="0" max="60" value={form.years_of_experience} onChange={(e) => update("years_of_experience", e.target.value)} dir="ltr" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
