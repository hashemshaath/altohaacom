import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Briefcase } from "lucide-react";

interface ProfessionalInfoSectionProps {
  form: Record<string, any>;
  update: (k: string, v: any) => void;
  isAr: boolean;
}

export function ProfessionalInfoSection({ form, update, isAr }: ProfessionalInfoSectionProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Briefcase className="h-4 w-4 text-chart-3" />
          {isAr ? "المعلومات المهنية" : "Professional Information"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs">{isAr ? "المسمى الوظيفي (إنجليزي)" : "Job Title (English)"}</Label>
            <Input value={form.job_title} onChange={(e) => update("job_title", e.target.value)} dir="ltr" placeholder="Executive Chef" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{isAr ? "المسمى الوظيفي (عربي)" : "Job Title (Arabic)"}</Label>
            <Input value={form.job_title_ar} onChange={(e) => update("job_title_ar", e.target.value)} dir="rtl" placeholder="الشيف التنفيذي" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{isAr ? "التخصص (إنجليزي)" : "Specialization (English)"}</Label>
            <Input value={form.specialization} onChange={(e) => update("specialization", e.target.value)} dir="ltr" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{isAr ? "التخصص (عربي)" : "Specialization (Arabic)"}</Label>
            <Input value={form.specialization_ar} onChange={(e) => update("specialization_ar", e.target.value)} dir="rtl" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs">{isAr ? "مستوى الخبرة" : "Experience Level"}</Label>
            <Select value={form.experience_level} onValueChange={(v) => update("experience_level", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">{isAr ? "مبتدئ" : "Beginner"}</SelectItem>
                <SelectItem value="amateur">{isAr ? "هاوي" : "Amateur"}</SelectItem>
                <SelectItem value="professional">{isAr ? "محترف" : "Professional"}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{isAr ? "سنوات الخبرة" : "Years of Experience"}</Label>
            <Input type="number" min="0" max="60" value={form.years_of_experience} onChange={(e) => update("years_of_experience", e.target.value)} dir="ltr" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
