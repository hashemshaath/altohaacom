import { memo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Briefcase, Eye, MapPin, DollarSign, Globe } from "lucide-react";

const JOB_TYPES = [
  { value: "full_time", en: "Full-time", ar: "دوام كامل" },
  { value: "part_time", en: "Part-time", ar: "دوام جزئي" },
  { value: "freelance", en: "Freelance", ar: "عمل حر" },
  { value: "contract", en: "Contract", ar: "عقد مؤقت" },
  { value: "consulting", en: "Consulting", ar: "استشارات" },
];

const VISIBILITY_OPTIONS = [
  { value: "public", en: "Public (Visible to everyone)", ar: "عام (مرئي للجميع)" },
  { value: "connections", en: "Connections Only", ar: "المتابعون فقط" },
  { value: "private", en: "Private (Only you)", ar: "خاص (أنت فقط)" },
];

interface JobAvailabilitySectionProps {
  form: Record<string, any>;
  update: (k: string, v: any) => void;
  isAr: boolean;
}

export const JobAvailabilitySection = memo(function JobAvailabilitySection({ form, update, isAr }: JobAvailabilitySectionProps) {
  const toggleJobType = (type: string) => {
    const current: string[] = form.preferred_job_types || [];
    if (current.includes(type)) {
      update("preferred_job_types", current.filter(t => t !== type));
    } else {
      update("preferred_job_types", [...current, type]);
    }
  };

  return (
    <Card className="rounded-2xl border-border/20 bg-card/60 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-300">
      <CardHeader className="pb-3 px-6 pt-5">
        <CardTitle className="flex items-center gap-2.5 text-base">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-chart-2/10">
            <Briefcase className="h-4 w-4 text-chart-2" />
          </div>
          {isAr ? "حالة التوظيف" : "Job Availability"}
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground/70 ms-[46px]">
          {isAr ? "أظهر لأصحاب العمل أنك متاح للعمل" : "Let employers know you're open to opportunities"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5 px-6 pb-6">
        {/* Open to Work Toggle */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-muted/5 border border-border/10">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${form.is_open_to_work ? "bg-chart-2/15" : "bg-muted/10"}`}>
              <Briefcase className={`h-5 w-5 transition-colors ${form.is_open_to_work ? "text-chart-2" : "text-muted-foreground/50"}`} />
            </div>
            <div>
              <p className="text-sm font-semibold">{isAr ? "متاح للعمل" : "Open to Work"}</p>
              <p className="text-xs text-muted-foreground/70">
                {isAr ? "أظهر شارة متاح للعمل في ملفك الشخصي" : "Show an 'Open to Work' badge on your profile"}
              </p>
            </div>
          </div>
          <Switch
            checked={form.is_open_to_work || false}
            onCheckedChange={(v) => update("is_open_to_work", v)}
          />
        </div>

        {form.is_open_to_work && (
          <>
            {/* Visibility Control */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <Eye className="h-3 w-3 text-muted-foreground/60" />
                {isAr ? "من يمكنه رؤية حالتك" : "Who can see your status"}
              </Label>
              <Select value={form.job_availability_visibility || "private"} onValueChange={(v) => update("job_availability_visibility", v)}>
                <SelectTrigger className="rounded-xl border-border/20 bg-muted/5"><SelectValue /></SelectTrigger>
                <SelectContent className="rounded-xl">
                  {VISIBILITY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{isAr ? opt.ar : opt.en}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Preferred Job Types */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold">{isAr ? "أنواع العمل المفضلة" : "Preferred Job Types"}</Label>
              <div className="flex flex-wrap gap-2">
                {JOB_TYPES.map((jt) => {
                  const selected = (form.preferred_job_types || []).includes(jt.value);
                  return (
                    <Badge
                      key={jt.value}
                      variant={selected ? "default" : "outline"}
                      className="cursor-pointer transition-all hover:scale-105 select-none"
                      onClick={() => toggleJobType(jt.value)}
                    >
                      {isAr ? jt.ar : jt.en}
                    </Badge>
                  );
                })}
              </div>
            </div>

            {/* Preferred Locations */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <MapPin className="h-3 w-3 text-muted-foreground/60" />
                {isAr ? "المواقع المفضلة (فاصل بالفاصلة)" : "Preferred Locations (comma-separated)"}
              </Label>
              <Input
                className="rounded-xl border-border/20 bg-muted/5"
                placeholder={isAr ? "الرياض، جدة، دبي" : "Riyadh, Jeddah, Dubai"}
                value={(form.preferred_work_locations || []).join(", ")}
                onChange={(e) => update("preferred_work_locations", e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
              />
            </div>

            {/* Willing to Relocate */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/5 border border-border/10">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground/60" />
                <span className="text-sm">{isAr ? "مستعد للانتقال" : "Willing to Relocate"}</span>
              </div>
              <Switch
                checked={form.willing_to_relocate || false}
                onCheckedChange={(v) => update("willing_to_relocate", v)}
              />
            </div>

            {/* Salary Range */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <DollarSign className="h-3 w-3 text-muted-foreground/60" />
                {isAr ? "نطاق الراتب المتوقع (شهري)" : "Expected Salary Range (monthly)"}
              </Label>
              <div className="grid gap-3 sm:grid-cols-3">
                <Input
                  className="rounded-xl border-border/20 bg-muted/5"
                  type="number"
                  min="0"
                  placeholder={isAr ? "الحد الأدنى" : "Min"}
                  value={form.salary_range_min || ""}
                  onChange={(e) => update("salary_range_min", e.target.value)}
                  dir="ltr"
                />
                <Input
                  className="rounded-xl border-border/20 bg-muted/5"
                  type="number"
                  min="0"
                  placeholder={isAr ? "الحد الأقصى" : "Max"}
                  value={form.salary_range_max || ""}
                  onChange={(e) => update("salary_range_max", e.target.value)}
                  dir="ltr"
                />
                <Select value={form.salary_currency || "SAR"} onValueChange={(v) => update("salary_currency", v)}>
                  <SelectTrigger className="rounded-xl border-border/20 bg-muted/5"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="SAR">SAR</SelectItem>
                    <SelectItem value="AED">AED</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                    <SelectItem value="KWD">KWD</SelectItem>
                    <SelectItem value="QAR">QAR</SelectItem>
                    <SelectItem value="BHD">BHD</SelectItem>
                    <SelectItem value="OMR">OMR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Availability Note */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-xs font-semibold">{isAr ? "ملاحظة (إنجليزي)" : "Note (English)"}</Label>
                <Input
                  className="rounded-xl border-border/20 bg-muted/5"
                  placeholder={isAr ? "متاح فوراً..." : "Available immediately..."}
                  value={form.work_availability_note || ""}
                  onChange={(e) => update("work_availability_note", e.target.value)}
                  dir="ltr"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold">{isAr ? "ملاحظة (عربي)" : "Note (Arabic)"}</Label>
                <Input
                  className="rounded-xl border-border/20 bg-muted/5"
                  placeholder={isAr ? "متاح فوراً..." : "متاح فوراً..."}
                  value={form.work_availability_note_ar || ""}
                  onChange={(e) => update("work_availability_note_ar", e.target.value)}
                  dir="rtl"
                />
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
});
