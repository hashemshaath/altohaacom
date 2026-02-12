import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { EntitySelector } from "@/components/admin/EntitySelector";
import { toast } from "@/hooks/use-toast";
import {
  GraduationCap, Briefcase, Plus, Pencil, Trash2, X, Check, Calendar,
  Building2, MapPin, Trophy, Award, Medal, Users, ChefHat,
} from "lucide-react";

// ── Constants ──────────────────────────────────────

const EDUCATION_LEVELS = [
  { value: "high_school", en: "High School", ar: "ثانوية عامة" },
  { value: "diploma", en: "Diploma", ar: "دبلوم" },
  { value: "bachelors", en: "Bachelor's", ar: "بكالوريوس" },
  { value: "masters", en: "Master's", ar: "ماجستير" },
  { value: "doctorate", en: "PhD", ar: "دكتوراه" },
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

const SECTIONS = [
  { key: "education" as const, icon: GraduationCap, en: "Education", ar: "التعليم" },
  { key: "work" as const, icon: Briefcase, en: "Experience", ar: "الخبرات" },
  { key: "memberships" as const, icon: Users, en: "Memberships", ar: "العضويات" },
  { key: "competitions" as const, icon: Trophy, en: "Competitions", ar: "المسابقات" },
  { key: "awards" as const, icon: Medal, en: "Awards & Medals", ar: "الجوائز والميداليات" },
];

type SectionKey = typeof SECTIONS[number]["key"];

// ── Types ──────────────────────────────────────

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
  record_type: string;
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
  entity_id: null, entity_name: "",
  title: "", title_ar: "",
  education_level: "", field_of_study: "", field_of_study_ar: "", grade: "",
  department: "", department_ar: "", employment_type: "",
  start_date: "", end_date: "", is_current: false,
  description: "", description_ar: "", location: "",
};

interface Props {
  userId: string;
  isAr: boolean;
}

// ── Helpers ──────────────────────────────────────

const formatDateShort = (date: string | null, isAr: boolean) => {
  if (!date) return isAr ? "الحالي" : "Present";
  const d = new Date(date);
  return d.toLocaleDateString(isAr ? "ar-SA" : "en-US", { year: "numeric", month: "short" });
};

const labelFor = (key: string, list: { value: string; en: string; ar: string }[], isAr: boolean) => {
  const item = list.find(l => l.value === key);
  return item ? (isAr ? item.ar : item.en) : key;
};

// ── Main Component ──────────────────────────────────────

export function UserCareerTimeline({ userId, isAr }: Props) {
  const queryClient = useQueryClient();
  const [activeSection, setActiveSection] = useState<SectionKey>("education");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<EmptyForm>(emptyForm);

  // ── Data ──────────────────────────────────────

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

  const { data: competitions = [] } = useQuery({
    queryKey: ["user-competition-history", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("competition_registrations")
        .select("id, registered_at, status, competitions(title, title_ar, competition_start, country_code, status)")
        .eq("participant_id", userId)
        .order("registered_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: certificates = [] } = useQuery({
    queryKey: ["user-certificates-awards", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("certificates")
        .select("id, issued_at, event_name, event_name_ar, achievement, achievement_ar, type, status")
        .eq("recipient_id", userId)
        .eq("status", "issued")
        .order("issued_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: memberships = [] } = useQuery({
    queryKey: ["user-entity-memberships", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("entity_memberships")
        .select("*, culinary_entities(name, name_ar, logo_url, type)")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const sectionRecords = useMemo(() => records.filter(r => r.record_type === activeSection), [records, activeSection]);

  const sectionCounts: Record<SectionKey, number> = {
    education: records.filter(r => r.record_type === "education").length,
    work: records.filter(r => r.record_type === "work").length,
    memberships: memberships.length,
    competitions: competitions.length,
    awards: certificates.length,
  };

  // ── Mutations ──────────────────────────────────────

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        user_id: userId, record_type: form.record_type,
        entity_id: form.entity_id || null, entity_name: form.entity_name || null,
        title: form.title, title_ar: form.title_ar || null,
        education_level: form.education_level || null,
        field_of_study: form.field_of_study || null, field_of_study_ar: form.field_of_study_ar || null,
        grade: form.grade || null, department: form.department || null, department_ar: form.department_ar || null,
        employment_type: form.employment_type || null,
        start_date: form.start_date || null, end_date: form.is_current ? null : (form.end_date || null),
        is_current: form.is_current,
        description: form.description || null, description_ar: form.description_ar || null,
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
    onError: (err: any) => toast({ title: isAr ? "خطأ" : "Error", description: err.message, variant: "destructive" }),
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

  // ── Form Helpers ──────────────────────────────────────

  const resetForm = () => { setForm({ ...emptyForm, record_type: activeSection }); setEditingId(null); setShowForm(false); };

  const startEdit = (record: CareerRecord) => {
    setForm({
      record_type: record.record_type,
      entity_id: record.entity_id, entity_name: record.entity_name || "",
      title: record.title, title_ar: record.title_ar || "",
      education_level: record.education_level || "", field_of_study: record.field_of_study || "",
      field_of_study_ar: record.field_of_study_ar || "", grade: record.grade || "",
      department: record.department || "", department_ar: record.department_ar || "",
      employment_type: record.employment_type || "",
      start_date: record.start_date || "", end_date: record.end_date || "",
      is_current: record.is_current,
      description: record.description || "", description_ar: record.description_ar || "",
      location: record.location || "",
    });
    setActiveSection(record.record_type as SectionKey);
    setEditingId(record.id);
    setShowForm(true);
  };

  const startAdd = () => { setForm({ ...emptyForm, record_type: activeSection }); setEditingId(null); setShowForm(true); };
  const updateField = (key: keyof EmptyForm, value: any) => setForm(prev => ({ ...prev, [key]: value }));

  // ── Editable sections (education / work) ──────────────────────────────────────

  const isEditable = activeSection === "education" || activeSection === "work";

  return (
    <div className="space-y-4">
      {/* Section Nav - compact pills */}
      <div className="flex flex-wrap gap-1.5">
        {SECTIONS.map(s => {
          const Icon = s.icon;
          const count = sectionCounts[s.key];
          const active = activeSection === s.key;
          return (
            <button
              key={s.key}
              onClick={() => { setActiveSection(s.key); setShowForm(false); }}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {isAr ? s.ar : s.en}
              {count > 0 && (
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] leading-none ${
                  active ? "bg-primary-foreground/20 text-primary-foreground" : "bg-background text-foreground"
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <Separator />

      {/* ── Education & Work Records ──────────────────────── */}
      {isEditable && (
        <>
          {isLoading ? (
            <p className="text-sm text-muted-foreground text-center py-4">{isAr ? "جاري التحميل..." : "Loading..."}</p>
          ) : sectionRecords.length === 0 && !showForm ? (
            <EmptyState
              icon={activeSection === "education" ? GraduationCap : Briefcase}
              message={activeSection === "education"
                ? (isAr ? "لا يوجد سجل تعليمي بعد" : "No education records yet")
                : (isAr ? "لا يوجد سجل خبرات بعد" : "No work experience yet")}
              actionLabel={activeSection === "education" ? (isAr ? "إضافة تعليم" : "Add Education") : (isAr ? "إضافة خبرة" : "Add Experience")}
              onAction={startAdd}
            />
          ) : (
            <div className="space-y-1.5">
              {sectionRecords.map(record => (
                <CompactRecordRow
                  key={record.id}
                  record={record}
                  isAr={isAr}
                  onEdit={() => startEdit(record)}
                  onDelete={() => deleteMutation.mutate(record.id)}
                />
              ))}
            </div>
          )}

          {sectionRecords.length > 0 && !showForm && (
            <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs" onClick={startAdd}>
              <Plus className="h-3.5 w-3.5" />
              {activeSection === "education" ? (isAr ? "إضافة تعليم" : "Add Education") : (isAr ? "إضافة خبرة" : "Add Experience")}
            </Button>
          )}

          {showForm && (
            <InlineForm
              form={form}
              editingId={editingId}
              isAr={isAr}
              isPending={saveMutation.isPending}
              onUpdate={updateField}
              onSave={() => saveMutation.mutate()}
              onCancel={resetForm}
            />
          )}
        </>
      )}

      {/* ── Memberships (read-only from entity_memberships) ──────── */}
      {activeSection === "memberships" && (
        <div className="space-y-1.5">
          {memberships.length === 0 ? (
            <EmptyState icon={Users} message={isAr ? "لا توجد عضويات" : "No memberships"} />
          ) : memberships.map((m: any) => (
            <div key={m.id} className="flex items-center gap-3 rounded-lg border px-3 py-2.5 hover:bg-muted/30 transition-colors">
              {m.culinary_entities?.logo_url ? (
                <img src={m.culinary_entities.logo_url} className="h-8 w-8 rounded-md object-cover shrink-0" alt="" />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 shrink-0">
                  <Users className="h-4 w-4 text-primary" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {isAr ? (m.culinary_entities?.name_ar || m.culinary_entities?.name) : m.culinary_entities?.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {m.membership_type && <span className="capitalize">{m.membership_type}</span>}
                  {m.role && <> · {m.role}</>}
                </p>
              </div>
              {m.status && (
                <Badge variant={m.status === "active" ? "default" : "secondary"} className="text-[10px] h-5 shrink-0">
                  {m.status === "active" ? (isAr ? "نشط" : "Active") : m.status}
                </Badge>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Competitions (read-only from registrations) ──────── */}
      {activeSection === "competitions" && (
        <div className="space-y-1.5">
          {competitions.length === 0 ? (
            <EmptyState icon={Trophy} message={isAr ? "لا توجد مشاركات في مسابقات" : "No competition participations"} />
          ) : competitions.map((reg: any) => (
            <div key={reg.id} className="flex items-center gap-3 rounded-lg border px-3 py-2.5 hover:bg-muted/30 transition-colors">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-chart-4/10 shrink-0">
                <Trophy className="h-4 w-4 text-chart-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {isAr ? (reg.competitions?.title_ar || reg.competitions?.title) : reg.competitions?.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  {reg.competitions?.competition_start && formatDateShort(reg.competitions.competition_start, isAr)}
                  {reg.competitions?.country_code && <> · {reg.competitions.country_code}</>}
                </p>
              </div>
              <Badge variant={reg.status === "approved" ? "default" : "secondary"} className="text-[10px] h-5 shrink-0 capitalize">
                {reg.status === "approved" ? (isAr ? "مقبول" : "Approved") : reg.status === "pending" ? (isAr ? "قيد المراجعة" : "Pending") : reg.status}
              </Badge>
            </div>
          ))}
        </div>
      )}

      {/* ── Awards & Certificates (read-only) ──────── */}
      {activeSection === "awards" && (
        <div className="space-y-1.5">
          {certificates.length === 0 ? (
            <EmptyState icon={Medal} message={isAr ? "لا توجد جوائز أو شهادات" : "No awards or certificates"} />
          ) : certificates.map((cert: any) => (
            <div key={cert.id} className="flex items-center gap-3 rounded-lg border px-3 py-2.5 hover:bg-muted/30 transition-colors">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-chart-1/10 shrink-0">
                <Award className="h-4 w-4 text-chart-1" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {isAr ? (cert.event_name_ar || cert.event_name) : cert.event_name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {cert.achievement && <>{isAr ? (cert.achievement_ar || cert.achievement) : cert.achievement} · </>}
                  {cert.issued_at && formatDateShort(cert.issued_at, isAr)}
                </p>
              </div>
              <Badge variant="outline" className="text-[10px] h-5 shrink-0 capitalize">{cert.type}</Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────

function EmptyState({ icon: Icon, message, actionLabel, onAction }: {
  icon: any; message: string; actionLabel?: string; onAction?: () => void;
}) {
  return (
    <div className="rounded-lg border border-dashed p-6 text-center space-y-2">
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-muted">
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
      <p className="text-sm text-muted-foreground">{message}</p>
      {actionLabel && onAction && (
        <Button variant="outline" size="sm" onClick={onAction}>
          <Plus className="me-1 h-3.5 w-3.5" />{actionLabel}
        </Button>
      )}
    </div>
  );
}

function CompactRecordRow({ record, isAr, onEdit, onDelete }: {
  record: CareerRecord; isAr: boolean; onEdit: () => void; onDelete: () => void;
}) {
  const isEdu = record.record_type === "education";
  const Icon = isEdu ? GraduationCap : Briefcase;

  return (
    <div className="flex items-center gap-3 rounded-lg border px-3 py-2.5 hover:bg-muted/30 transition-colors group">
      <div className={`flex h-8 w-8 items-center justify-center rounded-md shrink-0 ${
        record.is_current ? "bg-primary/10" : "bg-muted"
      }`}>
        <Icon className={`h-4 w-4 ${record.is_current ? "text-primary" : "text-muted-foreground"}`} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium truncate">{isAr ? (record.title_ar || record.title) : record.title}</p>
          {record.is_current && <Badge variant="default" className="text-[10px] h-4 px-1.5 shrink-0">{isAr ? "حالي" : "Current"}</Badge>}
        </div>
        <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
          <Building2 className="h-3 w-3 shrink-0" />
          <span className="truncate">{record.entity_name || (isAr ? "غير محدد" : "Not specified")}</span>
          <span className="mx-0.5">·</span>
          <Calendar className="h-3 w-3 shrink-0" />
          <span>{formatDateShort(record.start_date, isAr)} — {record.is_current ? (isAr ? "الحالي" : "Present") : formatDateShort(record.end_date, isAr)}</span>
          {isEdu && record.education_level && (
            <><span className="mx-0.5">·</span><span>{labelFor(record.education_level, EDUCATION_LEVELS, isAr)}</span></>
          )}
          {!isEdu && record.employment_type && (
            <><span className="mx-0.5">·</span><span>{labelFor(record.employment_type, EMPLOYMENT_TYPES, isAr)}</span></>
          )}
          {record.location && (
            <><span className="mx-0.5">·</span><MapPin className="h-3 w-3 shrink-0" /><span className="truncate">{record.location}</span></>
          )}
        </p>
      </div>

      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onEdit}><Pencil className="h-3 w-3" /></Button>
        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={onDelete}><Trash2 className="h-3 w-3" /></Button>
      </div>
    </div>
  );
}

function InlineForm({ form, editingId, isAr, isPending, onUpdate, onSave, onCancel }: {
  form: EmptyForm; editingId: string | null; isAr: boolean; isPending: boolean;
  onUpdate: (key: keyof EmptyForm, value: any) => void; onSave: () => void; onCancel: () => void;
}) {
  const isEdu = form.record_type === "education";

  return (
    <div className="rounded-lg border p-4 space-y-3 bg-muted/10">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          {isEdu ? <GraduationCap className="h-4 w-4" /> : <Briefcase className="h-4 w-4" />}
          {editingId
            ? (isAr ? "تعديل السجل" : "Edit Record")
            : isEdu ? (isAr ? "إضافة تعليم" : "Add Education") : (isAr ? "إضافة خبرة" : "Add Experience")}
        </h3>
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onCancel}><X className="h-3.5 w-3.5" /></Button>
      </div>

      <EntitySelector
        value={form.entity_id}
        entityName={form.entity_name}
        onChange={(id, name) => { onUpdate("entity_id", id); onUpdate("entity_name", name); }}
        label={isEdu ? (isAr ? "المؤسسة التعليمية" : "Institution") : (isAr ? "جهة العمل" : "Company / Organization")}
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label className="text-xs">{isEdu ? (isAr ? "الدرجة (EN)" : "Degree (EN)") : (isAr ? "المسمى الوظيفي (EN)" : "Job Title (EN)")} *</Label>
          <Input value={form.title} onChange={(e) => onUpdate("title", e.target.value)} className="h-9 text-sm" dir="ltr" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">{isEdu ? (isAr ? "الدرجة (AR)" : "Degree (AR)") : (isAr ? "المسمى الوظيفي (AR)" : "Job Title (AR)")}</Label>
          <Input value={form.title_ar} onChange={(e) => onUpdate("title_ar", e.target.value)} className="h-9 text-sm" dir="rtl" />
        </div>
      </div>

      {isEdu ? (
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1">
            <Label className="text-xs">{isAr ? "المستوى" : "Level"}</Label>
            <Select value={form.education_level} onValueChange={(v) => onUpdate("education_level", v)}>
              <SelectTrigger className="h-9 text-sm"><SelectValue placeholder={isAr ? "اختر" : "Select"} /></SelectTrigger>
              <SelectContent>
                {EDUCATION_LEVELS.map(l => <SelectItem key={l.value} value={l.value}>{isAr ? l.ar : l.en}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">{isAr ? "التخصص" : "Field of Study"}</Label>
            <Input value={form.field_of_study} onChange={(e) => onUpdate("field_of_study", e.target.value)} className="h-9 text-sm" dir="ltr" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">{isAr ? "المعدل" : "Grade"}</Label>
            <Input value={form.grade} onChange={(e) => onUpdate("grade", e.target.value)} className="h-9 text-sm" dir="ltr" />
          </div>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label className="text-xs">{isAr ? "نوع التوظيف" : "Employment Type"}</Label>
            <Select value={form.employment_type} onValueChange={(v) => onUpdate("employment_type", v)}>
              <SelectTrigger className="h-9 text-sm"><SelectValue placeholder={isAr ? "اختر" : "Select"} /></SelectTrigger>
              <SelectContent>
                {EMPLOYMENT_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{isAr ? t.ar : t.en}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">{isAr ? "الموقع" : "Location"}</Label>
            <Input value={form.location} onChange={(e) => onUpdate("location", e.target.value)} className="h-9 text-sm" />
          </div>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label className="text-xs">{isAr ? "من" : "From"}</Label>
          <Input type="date" value={form.start_date} onChange={(e) => onUpdate("start_date", e.target.value)} className="h-9 text-sm" dir="ltr" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">{isAr ? "إلى" : "To"}</Label>
          <Input type="date" value={form.end_date} onChange={(e) => onUpdate("end_date", e.target.value)} className="h-9 text-sm" dir="ltr" disabled={form.is_current} />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Switch checked={form.is_current} onCheckedChange={(v) => onUpdate("is_current", v)} />
        <Label className="text-xs cursor-pointer">
          {isEdu ? (isAr ? "ما زلت أدرس هنا" : "Currently studying") : (isAr ? "أعمل هنا حالياً" : "Currently working")}
        </Label>
      </div>

      <div className="space-y-1">
        <Label className="text-xs">{isAr ? "ملاحظات" : "Notes"}</Label>
        <Textarea value={form.description} onChange={(e) => onUpdate("description", e.target.value)} className="min-h-[50px] text-sm" />
      </div>

      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="flex-1" onClick={onCancel}>{isAr ? "إلغاء" : "Cancel"}</Button>
        <Button size="sm" className="flex-1 gap-1" onClick={onSave} disabled={!form.title.trim() || isPending}>
          {isPending ? <span className="animate-spin h-3.5 w-3.5 border-2 border-current border-t-transparent rounded-full" /> : <Check className="h-3.5 w-3.5" />}
          {editingId ? (isAr ? "تحديث" : "Update") : (isAr ? "إضافة" : "Add")}
        </Button>
      </div>
    </div>
  );
}
