import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { EntitySelector } from "@/components/admin/EntitySelector";
import { toast } from "@/hooks/use-toast";
import {
  GraduationCap, Briefcase, Plus, Pencil, Trash2, X, Check, Calendar,
  Building2, MapPin, ChevronDown, ChevronUp,
} from "lucide-react";

const EDUCATION_LEVELS = [
  { value: "high_school", en: "High School", ar: "ثانوية عامة" },
  { value: "diploma", en: "Diploma", ar: "دبلوم" },
  { value: "bachelors", en: "Bachelor's Degree", ar: "بكالوريوس" },
  { value: "masters", en: "Master's Degree", ar: "ماجستير" },
  { value: "doctorate", en: "Doctorate / PhD", ar: "دكتوراه" },
  { value: "culinary_certificate", en: "Culinary Certificate", ar: "شهادة طهي" },
  { value: "professional_diploma", en: "Professional Diploma", ar: "دبلوم مهني" },
  { value: "other", en: "Other", ar: "أخرى" },
];

const EMPLOYMENT_TYPES = [
  { value: "full_time", en: "Full-time", ar: "دوام كامل" },
  { value: "part_time", en: "Part-time", ar: "دوام جزئي" },
  { value: "contract", en: "Contract", ar: "عقد" },
  { value: "internship", en: "Internship", ar: "تدريب" },
  { value: "freelance", en: "Freelance", ar: "عمل حر" },
  { value: "volunteer", en: "Volunteer", ar: "تطوعي" },
];

interface CareerRecord {
  id: string;
  user_id: string;
  record_type: string;
  entity_id: string | null;
  entity_name: string | null;
  title: string;
  title_ar: string | null;
  education_level: string | null;
  field_of_study: string | null;
  field_of_study_ar: string | null;
  grade: string | null;
  department: string | null;
  department_ar: string | null;
  employment_type: string | null;
  start_date: string | null;
  end_date: string | null;
  is_current: boolean;
  description: string | null;
  description_ar: string | null;
  location: string | null;
  sort_order: number;
  created_at: string;
}

interface EmptyForm {
  record_type: "education" | "work";
  entity_id: string | null;
  entity_name: string;
  title: string;
  title_ar: string;
  education_level: string;
  field_of_study: string;
  field_of_study_ar: string;
  grade: string;
  department: string;
  department_ar: string;
  employment_type: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  description: string;
  description_ar: string;
  location: string;
}

const emptyForm: EmptyForm = {
  record_type: "education",
  entity_id: null,
  entity_name: "",
  title: "",
  title_ar: "",
  education_level: "",
  field_of_study: "",
  field_of_study_ar: "",
  grade: "",
  department: "",
  department_ar: "",
  employment_type: "",
  start_date: "",
  end_date: "",
  is_current: false,
  description: "",
  description_ar: "",
  location: "",
};

interface Props {
  userId: string;
  isAr: boolean;
}

export function UserCareerTimeline({ userId, isAr }: Props) {
  const queryClient = useQueryClient();
  const [activeSection, setActiveSection] = useState<"education" | "work">("education");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<EmptyForm>(emptyForm);

  const { data: records = [], isLoading } = useQuery({
    queryKey: ["career-records", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_career_records")
        .select("*")
        .eq("user_id", userId)
        .order("is_current", { ascending: false })
        .order("end_date", { ascending: false, nullsFirst: true })
        .order("start_date", { ascending: false });
      if (error) throw error;
      return (data || []) as CareerRecord[];
    },
  });

  const educationRecords = records.filter(r => r.record_type === "education");
  const workRecords = records.filter(r => r.record_type === "work");

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        user_id: userId,
        record_type: form.record_type,
        entity_id: form.entity_id || null,
        entity_name: form.entity_name || null,
        title: form.title,
        title_ar: form.title_ar || null,
        education_level: form.education_level || null,
        field_of_study: form.field_of_study || null,
        field_of_study_ar: form.field_of_study_ar || null,
        grade: form.grade || null,
        department: form.department || null,
        department_ar: form.department_ar || null,
        employment_type: form.employment_type || null,
        start_date: form.start_date || null,
        end_date: form.is_current ? null : (form.end_date || null),
        is_current: form.is_current,
        description: form.description || null,
        description_ar: form.description_ar || null,
        location: form.location || null,
      };

      if (editingId) {
        const { error } = await supabase.from("user_career_records").update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("user_career_records").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["career-records", userId] });
      toast({ title: editingId ? (isAr ? "تم التحديث" : "Updated") : (isAr ? "تمت الإضافة" : "Added") });
      resetForm();
    },
    onError: (err: any) => {
      toast({ title: isAr ? "خطأ" : "Error", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("user_career_records").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["career-records", userId] });
      toast({ title: isAr ? "تم الحذف" : "Deleted" });
    },
  });

  const resetForm = () => {
    setForm({ ...emptyForm, record_type: activeSection });
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (record: CareerRecord) => {
    setForm({
      record_type: record.record_type as "education" | "work",
      entity_id: record.entity_id,
      entity_name: record.entity_name || "",
      title: record.title,
      title_ar: record.title_ar || "",
      education_level: record.education_level || "",
      field_of_study: record.field_of_study || "",
      field_of_study_ar: record.field_of_study_ar || "",
      grade: record.grade || "",
      department: record.department || "",
      department_ar: record.department_ar || "",
      employment_type: record.employment_type || "",
      start_date: record.start_date || "",
      end_date: record.end_date || "",
      is_current: record.is_current,
      description: record.description || "",
      description_ar: record.description_ar || "",
      location: record.location || "",
    });
    setActiveSection(record.record_type as "education" | "work");
    setEditingId(record.id);
    setShowForm(true);
  };

  const startAdd = (type: "education" | "work") => {
    setActiveSection(type);
    setForm({ ...emptyForm, record_type: type });
    setEditingId(null);
    setShowForm(true);
  };

  const updateField = (key: keyof EmptyForm, value: any) => setForm(prev => ({ ...prev, [key]: value }));

  const formatDate = (date: string | null) => {
    if (!date) return isAr ? "الحالي" : "Present";
    const d = new Date(date);
    return d.toLocaleDateString(isAr ? "ar-SA" : "en-US", { year: "numeric", month: "short" });
  };

  const currentRecords = activeSection === "education" ? educationRecords : workRecords;

  return (
    <div className="space-y-4">
      {/* Section Tabs */}
      <div className="flex gap-2">
        <Button
          variant={activeSection === "education" ? "default" : "outline"}
          size="sm"
          className="gap-1.5"
          onClick={() => { setActiveSection("education"); setShowForm(false); }}
        >
          <GraduationCap className="h-4 w-4" />
          {isAr ? "التعليم" : "Education"}
          {educationRecords.length > 0 && (
            <Badge variant="secondary" className="ms-1 h-5 text-[10px]">{educationRecords.length}</Badge>
          )}
        </Button>
        <Button
          variant={activeSection === "work" ? "default" : "outline"}
          size="sm"
          className="gap-1.5"
          onClick={() => { setActiveSection("work"); setShowForm(false); }}
        >
          <Briefcase className="h-4 w-4" />
          {isAr ? "الخبرات" : "Experience"}
          {workRecords.length > 0 && (
            <Badge variant="secondary" className="ms-1 h-5 text-[10px]">{workRecords.length}</Badge>
          )}
        </Button>
      </div>

      {/* Timeline Records */}
      {isLoading ? (
        <p className="text-sm text-muted-foreground text-center py-6">{isAr ? "جاري التحميل..." : "Loading..."}</p>
      ) : currentRecords.length === 0 && !showForm ? (
        <div className="rounded-lg border border-dashed p-6 text-center space-y-2">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-muted">
            {activeSection === "education" ? <GraduationCap className="h-5 w-5 text-muted-foreground" /> : <Briefcase className="h-5 w-5 text-muted-foreground" />}
          </div>
          <p className="text-sm text-muted-foreground">
            {activeSection === "education"
              ? (isAr ? "لا يوجد سجل تعليمي بعد" : "No education records yet")
              : (isAr ? "لا يوجد سجل خبرات بعد" : "No work experience yet")}
          </p>
          <Button variant="outline" size="sm" onClick={() => startAdd(activeSection)}>
            <Plus className="me-1 h-3.5 w-3.5" />
            {activeSection === "education" ? (isAr ? "إضافة تعليم" : "Add Education") : (isAr ? "إضافة خبرة" : "Add Experience")}
          </Button>
        </div>
      ) : (
        <div className="space-y-0">
          {currentRecords.map((record, idx) => (
            <div key={record.id} className="relative flex gap-3">
              {/* Timeline line */}
              <div className="flex flex-col items-center">
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 ${
                  record.is_current ? "border-primary bg-primary/10" : "border-muted-foreground/30 bg-muted"
                }`}>
                  {record.record_type === "education"
                    ? <GraduationCap className={`h-4 w-4 ${record.is_current ? "text-primary" : "text-muted-foreground"}`} />
                    : <Briefcase className={`h-4 w-4 ${record.is_current ? "text-primary" : "text-muted-foreground"}`} />
                  }
                </div>
                {idx < currentRecords.length - 1 && <div className="w-0.5 flex-1 bg-border" />}
              </div>

              {/* Content */}
              <div className="flex-1 pb-6">
                <div className="rounded-lg border p-3 hover:shadow-sm transition-shadow group">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm">{isAr ? (record.title_ar || record.title) : record.title}</h4>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Building2 className="h-3 w-3" />
                        {record.entity_name || (isAr ? "غير محدد" : "Not specified")}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => startEdit(record)}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteMutation.mutate(record.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Meta info */}
                  <div className="flex flex-wrap items-center gap-2 mt-1.5">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(record.start_date)} — {record.is_current ? (isAr ? "الحالي" : "Present") : formatDate(record.end_date)}
                    </span>
                    {record.is_current && (
                      <Badge variant="default" className="text-[10px] h-4 px-1.5">{isAr ? "حالي" : "Current"}</Badge>
                    )}
                    {record.record_type === "education" && record.education_level && (
                      <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                        {EDUCATION_LEVELS.find(l => l.value === record.education_level)?.[isAr ? "ar" : "en"] || record.education_level}
                      </Badge>
                    )}
                    {record.record_type === "work" && record.employment_type && (
                      <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                        {EMPLOYMENT_TYPES.find(t => t.value === record.employment_type)?.[isAr ? "ar" : "en"] || record.employment_type}
                      </Badge>
                    )}
                    {record.location && (
                      <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                        <MapPin className="h-2.5 w-2.5" />{record.location}
                      </span>
                    )}
                  </div>

                  {/* Field of study / Department */}
                  {record.record_type === "education" && record.field_of_study && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {isAr ? (record.field_of_study_ar || record.field_of_study) : record.field_of_study}
                      {record.grade && ` • ${isAr ? "المعدل" : "Grade"}: ${record.grade}`}
                    </p>
                  )}
                  {record.record_type === "work" && record.department && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {isAr ? (record.department_ar || record.department) : record.department}
                    </p>
                  )}

                  {/* Description */}
                  {record.description && (
                    <p className="text-xs mt-2 text-muted-foreground line-clamp-2">
                      {isAr ? (record.description_ar || record.description) : record.description}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Button (when records exist) */}
      {currentRecords.length > 0 && !showForm && (
        <Button variant="outline" size="sm" className="w-full gap-1.5" onClick={() => startAdd(activeSection)}>
          <Plus className="h-3.5 w-3.5" />
          {activeSection === "education" ? (isAr ? "إضافة تعليم" : "Add Education") : (isAr ? "إضافة خبرة" : "Add Experience")}
        </Button>
      )}

      {/* Inline Add/Edit Form */}
      {showForm && (
        <div className="rounded-lg border p-4 space-y-4 bg-muted/10">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              {form.record_type === "education" ? <GraduationCap className="h-4 w-4" /> : <Briefcase className="h-4 w-4" />}
              {editingId
                ? (isAr ? "تعديل السجل" : "Edit Record")
                : form.record_type === "education"
                  ? (isAr ? "إضافة سجل تعليمي" : "Add Education")
                  : (isAr ? "إضافة خبرة عملية" : "Add Work Experience")
              }
            </h3>
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={resetForm}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Entity Selector */}
          <EntitySelector
            value={form.entity_id}
            entityName={form.entity_name}
            onChange={(entityId, entityName) => { updateField("entity_id", entityId); updateField("entity_name", entityName); }}
            label={form.record_type === "education" ? (isAr ? "المؤسسة التعليمية" : "Institution") : (isAr ? "جهة العمل" : "Company / Organization")}
          />

          {/* Title */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-xs">
                {form.record_type === "education" ? (isAr ? "الدرجة / الشهادة (EN)" : "Degree / Certificate (EN)") : (isAr ? "المسمى الوظيفي (EN)" : "Job Title (EN)")} *
              </Label>
              <Input value={form.title} onChange={(e) => updateField("title", e.target.value)} className="h-9 text-sm" dir="ltr" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">
                {form.record_type === "education" ? (isAr ? "الدرجة / الشهادة (AR)" : "Degree / Certificate (AR)") : (isAr ? "المسمى الوظيفي (AR)" : "Job Title (AR)")}
              </Label>
              <Input value={form.title_ar} onChange={(e) => updateField("title_ar", e.target.value)} className="h-9 text-sm" dir="rtl" />
            </div>
          </div>

          {/* Education-specific fields */}
          {form.record_type === "education" && (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-xs">{isAr ? "المستوى التعليمي" : "Education Level"}</Label>
                  <Select value={form.education_level} onValueChange={(v) => updateField("education_level", v)}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue placeholder={isAr ? "اختر" : "Select"} /></SelectTrigger>
                    <SelectContent>
                      {EDUCATION_LEVELS.map(l => (
                        <SelectItem key={l.value} value={l.value}>{isAr ? l.ar : l.en}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{isAr ? "المعدل / التقدير" : "Grade / GPA"}</Label>
                  <Input value={form.grade} onChange={(e) => updateField("grade", e.target.value)} className="h-9 text-sm" dir="ltr" />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-xs">{isAr ? "التخصص (EN)" : "Field of Study (EN)"}</Label>
                  <Input value={form.field_of_study} onChange={(e) => updateField("field_of_study", e.target.value)} className="h-9 text-sm" dir="ltr" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{isAr ? "التخصص (AR)" : "Field of Study (AR)"}</Label>
                  <Input value={form.field_of_study_ar} onChange={(e) => updateField("field_of_study_ar", e.target.value)} className="h-9 text-sm" dir="rtl" />
                </div>
              </div>
            </>
          )}

          {/* Work-specific fields */}
          {form.record_type === "work" && (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-xs">{isAr ? "نوع التوظيف" : "Employment Type"}</Label>
                  <Select value={form.employment_type} onValueChange={(v) => updateField("employment_type", v)}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue placeholder={isAr ? "اختر" : "Select"} /></SelectTrigger>
                    <SelectContent>
                      {EMPLOYMENT_TYPES.map(t => (
                        <SelectItem key={t.value} value={t.value}>{isAr ? t.ar : t.en}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{isAr ? "الموقع" : "Location"}</Label>
                  <Input value={form.location} onChange={(e) => updateField("location", e.target.value)} className="h-9 text-sm" />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-xs">{isAr ? "القسم (EN)" : "Department (EN)"}</Label>
                  <Input value={form.department} onChange={(e) => updateField("department", e.target.value)} className="h-9 text-sm" dir="ltr" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{isAr ? "القسم (AR)" : "Department (AR)"}</Label>
                  <Input value={form.department_ar} onChange={(e) => updateField("department_ar", e.target.value)} className="h-9 text-sm" dir="rtl" />
                </div>
              </div>
            </>
          )}

          {/* Period */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-xs">{isAr ? "تاريخ البداية" : "Start Date"}</Label>
              <Input type="date" value={form.start_date} onChange={(e) => updateField("start_date", e.target.value)} className="h-9 text-sm" dir="ltr" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{isAr ? "تاريخ الانتهاء" : "End Date"}</Label>
              <Input
                type="date"
                value={form.end_date}
                onChange={(e) => updateField("end_date", e.target.value)}
                className="h-9 text-sm"
                dir="ltr"
                disabled={form.is_current}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={form.is_current} onCheckedChange={(v) => updateField("is_current", v)} />
            <Label className="text-xs cursor-pointer">
              {form.record_type === "education" ? (isAr ? "ما زلت أدرس هنا" : "Currently studying here") : (isAr ? "أعمل هنا حالياً" : "Currently working here")}
            </Label>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <Label className="text-xs">{isAr ? "وصف / ملاحظات" : "Description / Notes"}</Label>
            <Textarea
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
              className="min-h-[60px] text-sm"
              placeholder={form.record_type === "education"
                ? (isAr ? "الأنشطة، الإنجازات..." : "Activities, achievements...")
                : (isAr ? "المهام والمسؤوليات..." : "Responsibilities, achievements...")}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1" onClick={resetForm}>
              {isAr ? "إلغاء" : "Cancel"}
            </Button>
            <Button
              size="sm"
              className="flex-1 gap-1"
              onClick={() => saveMutation.mutate()}
              disabled={!form.title.trim() || saveMutation.isPending}
            >
              {saveMutation.isPending ? (
                <span className="animate-spin h-3.5 w-3.5 border-2 border-current border-t-transparent rounded-full" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )}
              {editingId ? (isAr ? "تحديث" : "Update") : (isAr ? "إضافة" : "Add")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
