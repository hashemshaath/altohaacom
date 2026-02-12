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
  Building2, MapPin, Trophy, Award, Medal, Users, ChevronDown, ChevronUp,
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

const MEMBERSHIP_TYPES = [
  { value: "member", en: "Member", ar: "عضو" },
  { value: "associate", en: "Associate", ar: "منتسب" },
  { value: "honorary", en: "Honorary", ar: "شرفي" },
  { value: "student", en: "Student", ar: "طالب" },
  { value: "professional", en: "Professional", ar: "محترف" },
];

const CERTIFICATE_TYPES = [
  { value: "participation", en: "Participation", ar: "مشاركة" },
  { value: "achievement", en: "Achievement", ar: "إنجاز" },
  { value: "winner", en: "Winner", ar: "فائز" },
  { value: "judge", en: "Judging", ar: "تحكيم" },
];

const SECTIONS = [
  { key: "education" as const, icon: GraduationCap, en: "Education", ar: "التعليم", color: "bg-chart-2/10 text-chart-2" },
  { key: "work" as const, icon: Briefcase, en: "Experience", ar: "الخبرات", color: "bg-chart-3/10 text-chart-3" },
  { key: "memberships" as const, icon: Users, en: "Memberships", ar: "العضويات", color: "bg-primary/10 text-primary" },
  { key: "competitions" as const, icon: Trophy, en: "Competitions", ar: "المسابقات", color: "bg-chart-4/10 text-chart-4" },
  { key: "awards" as const, icon: Medal, en: "Awards", ar: "الجوائز", color: "bg-chart-1/10 text-chart-1" },
];

type SectionKey = typeof SECTIONS[number]["key"];

// ── Types ──────────────────────────────────────

interface CareerRecord {
  id: string; user_id: string; record_type: string; entity_id: string | null; entity_name: string | null;
  title: string; title_ar: string | null; education_level: string | null; field_of_study: string | null;
  field_of_study_ar: string | null; grade: string | null; department: string | null; department_ar: string | null;
  employment_type: string | null; start_date: string | null; end_date: string | null; is_current: boolean;
  description: string | null; description_ar: string | null; location: string | null; sort_order: number; created_at: string;
}

interface Props { userId: string; isAr: boolean; }

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
  const [expandedSections, setExpandedSections] = useState<Set<SectionKey>>(new Set(["education", "work"]));
  const [addingSection, setAddingSection] = useState<SectionKey | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Career form state
  const [careerForm, setCareerForm] = useState({
    record_type: "education", entity_id: null as string | null, entity_name: "",
    title: "", title_ar: "", education_level: "", field_of_study: "", field_of_study_ar: "", grade: "",
    department: "", department_ar: "", employment_type: "", start_date: "", end_date: "",
    is_current: false, description: "", description_ar: "", location: "",
  });

  // Membership form state
  const [membershipForm, setMembershipForm] = useState({
    entity_id: "", membership_type: "member", title: "", title_ar: "",
    enrollment_date: "", notes: "",
  });

  // Award form state
  const [awardForm, setAwardForm] = useState({
    event_name: "", event_name_ar: "", achievement: "", achievement_ar: "",
    type: "participation" as string, event_date: "",
  });

  const toggleSection = (key: SectionKey) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  // ── Data Queries ──────────────────────────────────────

  const { data: records = [], isLoading } = useQuery({
    queryKey: ["career-records", userId],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_career_records").select("*")
        .eq("user_id", userId).order("is_current", { ascending: false })
        .order("end_date", { ascending: false, nullsFirst: true }).order("start_date", { ascending: false });
      if (error) throw error;
      return (data || []) as CareerRecord[];
    },
  });

  const { data: memberships = [] } = useQuery({
    queryKey: ["user-entity-memberships", userId],
    queryFn: async () => {
      const { data, error } = await supabase.from("entity_memberships")
        .select("*, culinary_entities(name, name_ar, logo_url, type)")
        .eq("user_id", userId).order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: competitions = [] } = useQuery({
    queryKey: ["user-competition-history", userId],
    queryFn: async () => {
      const { data, error } = await supabase.from("competition_registrations")
        .select("id, registered_at, status, competitions(title, title_ar, competition_start, country_code, status)")
        .eq("participant_id", userId).order("registered_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: certificates = [] } = useQuery({
    queryKey: ["user-certificates-awards", userId],
    queryFn: async () => {
      const { data, error } = await supabase.from("certificates")
        .select("id, issued_at, event_name, event_name_ar, achievement, achievement_ar, type, status")
        .eq("recipient_id", userId).eq("status", "issued").order("issued_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Available competitions for adding
  const { data: availableCompetitions = [] } = useQuery({
    queryKey: ["available-competitions-for-user"],
    queryFn: async () => {
      const { data, error } = await supabase.from("competitions")
        .select("id, title, title_ar, competition_start, country_code")
        .in("status", ["upcoming", "registration_open", "registration_closed", "in_progress", "completed"])
        .order("competition_start", { ascending: false }).limit(50);
      if (error) throw error;
      return data || [];
    },
    enabled: addingSection === "competitions",
  });

  const [selectedCompetitionId, setSelectedCompetitionId] = useState("");

  const educationRecords = useMemo(() => records.filter(r => r.record_type === "education"), [records]);
  const workRecords = useMemo(() => records.filter(r => r.record_type === "work"), [records]);

  const sectionCounts: Record<SectionKey, number> = {
    education: educationRecords.length,
    work: workRecords.length,
    memberships: memberships.length,
    competitions: competitions.length,
    awards: certificates.length,
  };

  // ── Mutations ──────────────────────────────────────

  const saveCareerMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        user_id: userId, record_type: careerForm.record_type,
        entity_id: careerForm.entity_id || null, entity_name: careerForm.entity_name || null,
        title: careerForm.title, title_ar: careerForm.title_ar || null,
        education_level: careerForm.education_level || null,
        field_of_study: careerForm.field_of_study || null, field_of_study_ar: careerForm.field_of_study_ar || null,
        grade: careerForm.grade || null, department: careerForm.department || null, department_ar: careerForm.department_ar || null,
        employment_type: careerForm.employment_type || null,
        start_date: careerForm.start_date || null, end_date: careerForm.is_current ? null : (careerForm.end_date || null),
        is_current: careerForm.is_current, description: careerForm.description || null,
        description_ar: careerForm.description_ar || null, location: careerForm.location || null,
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
      closeForm();
    },
    onError: (err: any) => toast({ title: isAr ? "خطأ" : "Error", description: err.message, variant: "destructive" }),
  });

  const saveMembershipMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("entity_memberships").insert({
        user_id: userId, entity_id: membershipForm.entity_id,
        membership_type: membershipForm.membership_type, title: membershipForm.title || null,
        title_ar: membershipForm.title_ar || null, enrollment_date: membershipForm.enrollment_date || null,
        notes: membershipForm.notes || null, status: "active",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-entity-memberships", userId] });
      toast({ title: isAr ? "تمت إضافة العضوية" : "Membership added" });
      closeForm();
    },
    onError: (err: any) => toast({ title: isAr ? "خطأ" : "Error", description: err.message, variant: "destructive" }),
  });

  const addCompetitionMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("competition_registrations").insert({
        participant_id: userId, competition_id: selectedCompetitionId, status: "approved",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-competition-history", userId] });
      toast({ title: isAr ? "تمت إضافة المسابقة" : "Competition added" });
      closeForm();
    },
    onError: (err: any) => toast({ title: isAr ? "خطأ" : "Error", description: err.message, variant: "destructive" }),
  });

  const addAwardMutation = useMutation({
    mutationFn: async () => {
      // Get or create a default template
      const { data: templates } = await supabase.from("certificate_templates")
        .select("id").limit(1);
      const templateId = templates?.[0]?.id;
      if (!templateId) throw new Error("No certificate template found");

      const { error } = await supabase.from("certificates").insert({
        recipient_id: userId, recipient_name: "User",
        template_id: templateId,
        type: awardForm.type as any,
        event_name: awardForm.event_name, event_name_ar: awardForm.event_name_ar || null,
        achievement: awardForm.achievement || null, achievement_ar: awardForm.achievement_ar || null,
        event_date: awardForm.event_date || null,
        status: "issued", verification_code: crypto.randomUUID().substring(0, 8).toUpperCase(),
        issued_at: new Date().toISOString(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-certificates-awards", userId] });
      toast({ title: isAr ? "تمت إضافة الجائزة" : "Award added" });
      closeForm();
    },
    onError: (err: any) => toast({ title: isAr ? "خطأ" : "Error", description: err.message, variant: "destructive" }),
  });

  const deleteCareerMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("user_career_records").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["career-records", userId] });
      toast({ title: isAr ? "تم الحذف" : "Deleted" });
    },
  });

  const deleteMembershipMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("entity_memberships").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-entity-memberships", userId] });
      toast({ title: isAr ? "تم الحذف" : "Deleted" });
    },
  });

  // ── Form Helpers ──────────────────────────────────────

  const closeForm = () => {
    setAddingSection(null);
    setEditingId(null);
    setSelectedCompetitionId("");
  };

  const startAddCareer = (type: "education" | "work") => {
    setCareerForm({
      record_type: type, entity_id: null, entity_name: "", title: "", title_ar: "",
      education_level: "", field_of_study: "", field_of_study_ar: "", grade: "",
      department: "", department_ar: "", employment_type: "", start_date: "", end_date: "",
      is_current: false, description: "", description_ar: "", location: "",
    });
    setEditingId(null);
    setAddingSection(type);
  };

  const startEditCareer = (record: CareerRecord) => {
    setCareerForm({
      record_type: record.record_type, entity_id: record.entity_id, entity_name: record.entity_name || "",
      title: record.title, title_ar: record.title_ar || "",
      education_level: record.education_level || "", field_of_study: record.field_of_study || "",
      field_of_study_ar: record.field_of_study_ar || "", grade: record.grade || "",
      department: record.department || "", department_ar: record.department_ar || "",
      employment_type: record.employment_type || "",
      start_date: record.start_date || "", end_date: record.end_date || "",
      is_current: record.is_current, description: record.description || "",
      description_ar: record.description_ar || "", location: record.location || "",
    });
    setEditingId(record.id);
    setAddingSection(record.record_type as SectionKey);
  };

  const startAddMembership = () => {
    setMembershipForm({ entity_id: "", membership_type: "member", title: "", title_ar: "", enrollment_date: "", notes: "" });
    setAddingSection("memberships");
  };

  const startAddAward = () => {
    setAwardForm({ event_name: "", event_name_ar: "", achievement: "", achievement_ar: "", type: "participation", event_date: "" });
    setAddingSection("awards");
  };

  // ── Render ──────────────────────────────────────

  return (
    <div className="space-y-3">
      {SECTIONS.map(section => {
        const Icon = section.icon;
        const count = sectionCounts[section.key];
        const isExpanded = expandedSections.has(section.key);
        const isAddingHere = addingSection === section.key;

        return (
          <div key={section.key} className="rounded-xl border bg-card/50 overflow-hidden transition-all hover:shadow-sm">
            {/* Section Header */}
            <button
              onClick={() => toggleSection(section.key)}
              className="w-full flex items-center gap-3 px-5 py-4 hover:bg-muted/40 transition-all group"
            >
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl shrink-0 ${section.color} group-hover:scale-110 transition-transform`}>
                <Icon className="h-4.5 w-4.5" />
              </div>
              <div className="flex-1 text-start">
                <span className="text-sm font-semibold">{isAr ? section.ar : section.en}</span>
              </div>
              {count > 0 && (
                <Badge variant="outline" className="text-xs h-6 px-2.5 font-medium">{count}</Badge>
              )}
              {isExpanded ? <ChevronUp className="h-5 w-5 text-muted-foreground transition-transform" /> : <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform" />}
            </button>

            {/* Section Content */}
            {isExpanded && (
              <div className="border-t px-5 py-4 space-y-2.5">
                {/* ═══ EDUCATION ═══ */}
                {section.key === "education" && (
                  <>
                    {educationRecords.length === 0 && !isAddingHere && (
                      <EmptyState icon={GraduationCap} message={isAr ? "لا يوجد سجل تعليمي" : "No education records"} />
                    )}
                    {educationRecords.map(r => (
                      <CompactRow key={r.id} icon={GraduationCap} color={section.color}
                        title={isAr ? (r.title_ar || r.title) : r.title}
                        subtitle={r.entity_name || ""}
                        meta={`${formatDateShort(r.start_date, isAr)} – ${r.is_current ? (isAr ? "الحالي" : "Present") : formatDateShort(r.end_date, isAr)}${r.education_level ? ` · ${labelFor(r.education_level, EDUCATION_LEVELS, isAr)}` : ""}`}
                        isCurrent={r.is_current} isAr={isAr}
                        onEdit={() => startEditCareer(r)} onDelete={() => deleteCareerMutation.mutate(r.id)}
                      />
                    ))}
                    {isAddingHere ? (
                      <CareerForm form={careerForm} editingId={editingId} isAr={isAr}
                        isPending={saveCareerMutation.isPending}
                        onUpdate={(k, v) => setCareerForm(prev => ({ ...prev, [k]: v }))}
                        onSave={() => saveCareerMutation.mutate()} onCancel={closeForm} />
                    ) : (
                      <AddButton label={isAr ? "إضافة تعليم" : "Add Education"} onClick={() => startAddCareer("education")} />
                    )}
                  </>
                )}

                {/* ═══ EXPERIENCE ═══ */}
                {section.key === "work" && (
                  <>
                    {workRecords.length === 0 && !isAddingHere && (
                      <EmptyState icon={Briefcase} message={isAr ? "لا يوجد سجل خبرات" : "No work experience"} />
                    )}
                    {workRecords.map(r => (
                      <CompactRow key={r.id} icon={Briefcase} color={section.color}
                        title={isAr ? (r.title_ar || r.title) : r.title}
                        subtitle={r.entity_name || ""}
                        meta={`${formatDateShort(r.start_date, isAr)} — ${r.is_current ? (isAr ? "الحالي" : "Present") : formatDateShort(r.end_date, isAr)}${r.employment_type ? ` · ${labelFor(r.employment_type, EMPLOYMENT_TYPES, isAr)}` : ""}${r.location ? ` · ${r.location}` : ""}`}
                        isCurrent={r.is_current} isAr={isAr}
                        onEdit={() => startEditCareer(r)} onDelete={() => deleteCareerMutation.mutate(r.id)}
                      />
                    ))}
                    {isAddingHere ? (
                      <CareerForm form={careerForm} editingId={editingId} isAr={isAr}
                        isPending={saveCareerMutation.isPending}
                        onUpdate={(k, v) => setCareerForm(prev => ({ ...prev, [k]: v }))}
                        onSave={() => saveCareerMutation.mutate()} onCancel={closeForm} />
                    ) : (
                      <AddButton label={isAr ? "إضافة خبرة" : "Add Experience"} onClick={() => startAddCareer("work")} />
                    )}
                  </>
                )}

                {/* ═══ MEMBERSHIPS ═══ */}
                {section.key === "memberships" && (
                  <>
                    {memberships.length === 0 && !isAddingHere && (
                      <EmptyState icon={Users} message={isAr ? "لا توجد عضويات" : "No memberships"} />
                    )}
                    {memberships.map((m: any) => (
                      <CompactRow key={m.id} icon={Users} color={section.color}
                        logoUrl={m.culinary_entities?.logo_url}
                        title={isAr ? (m.culinary_entities?.name_ar || m.culinary_entities?.name) : m.culinary_entities?.name}
                        subtitle={[m.title && (isAr ? m.title_ar || m.title : m.title), m.membership_type && labelFor(m.membership_type, MEMBERSHIP_TYPES, isAr)].filter(Boolean).join(" · ")}
                        meta={m.enrollment_date ? formatDateShort(m.enrollment_date, isAr) : formatDateShort(m.created_at, isAr)}
                        badge={m.status === "active" ? (isAr ? "نشط" : "Active") : m.status}
                        badgeVariant={m.status === "active" ? "default" : "secondary"}
                        isAr={isAr}
                        onDelete={() => deleteMembershipMutation.mutate(m.id)}
                      />
                    ))}
                    {isAddingHere ? (
                      <MembershipForm form={membershipForm} isAr={isAr}
                        isPending={saveMembershipMutation.isPending}
                        onUpdate={(k, v) => setMembershipForm(prev => ({ ...prev, [k]: v }))}
                        onSave={() => saveMembershipMutation.mutate()} onCancel={closeForm} />
                    ) : (
                      <AddButton label={isAr ? "إضافة عضوية" : "Add Membership"} onClick={startAddMembership} />
                    )}
                  </>
                )}

                {/* ═══ COMPETITIONS ═══ */}
                {section.key === "competitions" && (
                  <>
                    {competitions.length === 0 && !isAddingHere && (
                      <EmptyState icon={Trophy} message={isAr ? "لا توجد مشاركات" : "No competitions"} />
                    )}
                    {competitions.map((reg: any) => (
                      <CompactRow key={reg.id} icon={Trophy} color={section.color}
                        title={isAr ? (reg.competitions?.title_ar || reg.competitions?.title) : reg.competitions?.title}
                        subtitle=""
                        meta={`${reg.competitions?.competition_start ? formatDateShort(reg.competitions.competition_start, isAr) : ""}${reg.competitions?.country_code ? ` · ${reg.competitions.country_code}` : ""}`}
                        badge={reg.status === "approved" ? (isAr ? "مقبول" : "Approved") : reg.status === "pending" ? (isAr ? "قيد المراجعة" : "Pending") : reg.status}
                        badgeVariant={reg.status === "approved" ? "default" : "secondary"}
                        isAr={isAr}
                      />
                    ))}
                    {isAddingHere ? (
                      <CompetitionAddForm
                        competitions={availableCompetitions} selectedId={selectedCompetitionId}
                        onSelect={setSelectedCompetitionId} isAr={isAr}
                        isPending={addCompetitionMutation.isPending}
                        onSave={() => addCompetitionMutation.mutate()} onCancel={closeForm}
                      />
                    ) : (
                      <AddButton label={isAr ? "إضافة مسابقة" : "Add Competition"} onClick={() => setAddingSection("competitions")} />
                    )}
                  </>
                )}

                {/* ═══ AWARDS ═══ */}
                {section.key === "awards" && (
                  <>
                    {certificates.length === 0 && !isAddingHere && (
                      <EmptyState icon={Medal} message={isAr ? "لا توجد جوائز" : "No awards"} />
                    )}
                    {certificates.map((cert: any) => (
                      <CompactRow key={cert.id} icon={Award} color={section.color}
                        title={isAr ? (cert.event_name_ar || cert.event_name) : cert.event_name}
                        subtitle={isAr ? (cert.achievement_ar || cert.achievement || "") : (cert.achievement || "")}
                        meta={cert.issued_at ? formatDateShort(cert.issued_at, isAr) : ""}
                        badge={cert.type} badgeVariant="outline"
                        isAr={isAr}
                      />
                    ))}
                    {isAddingHere ? (
                      <AwardAddForm form={awardForm} isAr={isAr}
                        isPending={addAwardMutation.isPending}
                        onUpdate={(k, v) => setAwardForm(prev => ({ ...prev, [k]: v }))}
                        onSave={() => addAwardMutation.mutate()} onCancel={closeForm} />
                    ) : (
                      <AddButton label={isAr ? "إضافة جائزة" : "Add Award"} onClick={startAddAward} />
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Sub-Components ──────────────────────────────────────

function EmptyState({ icon: Icon, message }: { icon: any; message: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border/50 p-6 text-center bg-muted/20">
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-muted/40 mb-2">
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
      <p className="text-xs text-muted-foreground font-medium">{message}</p>
    </div>
  );
}

function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Button variant="outline" size="sm" className="w-full gap-2 text-xs h-9 border-dashed hover:bg-muted/50 hover:border-border/80 transition-all" onClick={onClick}>
      <Plus className="h-3.5 w-3.5" />{label}
    </Button>
  );
}

function CompactRow({ icon: Icon, color, logoUrl, title, subtitle, meta, badge, badgeVariant, isCurrent, isAr, onEdit, onDelete }: {
  icon: any; color: string; logoUrl?: string; title: string; subtitle: string; meta: string;
  badge?: string; badgeVariant?: "default" | "secondary" | "outline"; isCurrent?: boolean; isAr: boolean;
  onEdit?: () => void; onDelete?: () => void;
}) {
  // Build single-line content
  const mainContent = [title, subtitle, meta].filter(Boolean).join(" · ");
  
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border/50 px-4 py-2.5 hover:bg-muted/50 transition-all hover:border-border/80 group">
      {logoUrl ? (
        <img src={logoUrl} className="h-8 w-8 rounded-lg object-cover shrink-0" alt="" />
      ) : (
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg shrink-0 ${color}`}>
          <Icon className="h-4 w-4" />
        </div>
      )}
      <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
        <p className="text-sm font-medium truncate">{mainContent}</p>
        {isCurrent && <Badge variant="default" className="text-[10px] h-5 px-1.5 shrink-0 whitespace-nowrap">{isAr ? "حالي" : "Current"}</Badge>}
        {badge && <Badge variant={badgeVariant || "secondary"} className="text-[10px] h-5 px-1.5 shrink-0 capitalize whitespace-nowrap">{badge}</Badge>}
      </div>
      {(onEdit || onDelete) && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ms-2">
          {onEdit && <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={onEdit}><Pencil className="h-3.5 w-3.5" /></Button>}
          {onDelete && <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive/60 hover:text-destructive hover:bg-destructive/5" onClick={onDelete}><Trash2 className="h-3.5 w-3.5" /></Button>}
        </div>
      )}
    </div>
  );
}

function FormActions({ isAr, isPending, editingId, canSave, onSave, onCancel }: {
  isAr: boolean; isPending: boolean; editingId?: string | null; canSave: boolean; onSave: () => void; onCancel: () => void;
}) {
  return (
    <div className="flex gap-2.5 pt-2 border-t border-border/30">
      <Button variant="outline" size="sm" className="flex-1 h-9 text-xs font-medium" onClick={onCancel}>{isAr ? "إلغاء" : "Cancel"}</Button>
      <Button size="sm" className="flex-1 h-9 text-xs font-medium gap-1.5" onClick={onSave} disabled={!canSave || isPending}>
        {isPending ? <span className="animate-spin h-3 w-3 border-2 border-current border-t-transparent rounded-full" /> : <Check className="h-3.5 w-3.5" />}
        {editingId ? (isAr ? "تحديث" : "Update") : (isAr ? "إضافة" : "Add")}
      </Button>
    </div>
  );
}

function CareerForm({ form, editingId, isAr, isPending, onUpdate, onSave, onCancel }: {
  form: any; editingId: string | null; isAr: boolean; isPending: boolean;
  onUpdate: (key: string, value: any) => void; onSave: () => void; onCancel: () => void;
}) {
  const isEdu = form.record_type === "education";
  return (
    <div className="rounded-lg border border-border/50 bg-gradient-to-br from-muted/30 to-muted/10 p-4 space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-border/30">
        <h4 className="text-sm font-semibold flex items-center gap-2">
          {isEdu ? <GraduationCap className="h-4 w-4" /> : <Briefcase className="h-4 w-4" />}
          {editingId ? (isAr ? "تعديل" : "Edit") : isEdu ? (isAr ? "إضافة تعليم" : "Add Education") : (isAr ? "إضافة خبرة" : "Add Experience")}
        </h4>
        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={onCancel}><X className="h-3.5 w-3.5" /></Button>
      </div>

      <EntitySelector value={form.entity_id} entityName={form.entity_name}
        onChange={(id, name) => { onUpdate("entity_id", id); onUpdate("entity_name", name); }}
        label={isEdu ? (isAr ? "المؤسسة التعليمية" : "Institution") : (isAr ? "جهة العمل" : "Organization")} />

      <div className="grid gap-2.5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">{isEdu ? (isAr ? "الدرجة (EN)" : "Degree (EN)") : (isAr ? "المسمى (EN)" : "Title (EN)")} *</Label>
          <Input value={form.title} onChange={(e) => onUpdate("title", e.target.value)} className="h-9 text-xs" dir="ltr" placeholder={isAr ? "باللغة الإنجليزية" : "In English"} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">{isEdu ? (isAr ? "الدرجة (AR)" : "Degree (AR)") : (isAr ? "المسمى (AR)" : "Title (AR)")}</Label>
          <Input value={form.title_ar} onChange={(e) => onUpdate("title_ar", e.target.value)} className="h-9 text-xs" dir="rtl" placeholder={isAr ? "باللغة العربية" : "In Arabic"} />
        </div>
      </div>


      {isEdu ? (
        <div className="grid gap-2.5 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">{isAr ? "المستوى" : "Level"}</Label>
            <Select value={form.education_level} onValueChange={(v) => onUpdate("education_level", v)}>
              <SelectTrigger className="h-9 text-xs"><SelectValue placeholder={isAr ? "اختر المستوى" : "Select level"} /></SelectTrigger>
              <SelectContent>{EDUCATION_LEVELS.map(l => <SelectItem key={l.value} value={l.value}>{isAr ? l.ar : l.en}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">{isAr ? "التخصص" : "Field"}</Label>
            <Input value={form.field_of_study} onChange={(e) => onUpdate("field_of_study", e.target.value)} className="h-9 text-xs" placeholder={isAr ? "مثل الطهي" : "e.g., Culinary"} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">{isAr ? "المعدل" : "Grade"}</Label>
            <Input value={form.grade} onChange={(e) => onUpdate("grade", e.target.value)} className="h-9 text-xs" placeholder={isAr ? "مثل 4.0" : "e.g., 4.0"} />
          </div>
        </div>
      ) : (
        <div className="grid gap-2.5 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">{isAr ? "نوع التوظيف" : "Employment Type"}</Label>
            <Select value={form.employment_type} onValueChange={(v) => onUpdate("employment_type", v)}>
              <SelectTrigger className="h-9 text-xs"><SelectValue placeholder={isAr ? "اختر النوع" : "Select type"} /></SelectTrigger>
              <SelectContent>{EMPLOYMENT_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{isAr ? t.ar : t.en}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">{isAr ? "الموقع" : "Location"}</Label>
            <Input value={form.location} onChange={(e) => onUpdate("location", e.target.value)} className="h-9 text-xs" placeholder={isAr ? "مثل الرياض" : "e.g., Riyadh"} />
          </div>
        </div>
      )}

      <div className="grid gap-2.5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">{isAr ? "من" : "Start Date"}</Label>
          <Input type="date" value={form.start_date} onChange={(e) => onUpdate("start_date", e.target.value)} className="h-9 text-xs" dir="ltr" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">{isAr ? "إلى" : "End Date"}</Label>
          <Input type="date" value={form.end_date} onChange={(e) => onUpdate("end_date", e.target.value)} className="h-9 text-xs" dir="ltr" disabled={form.is_current} />
        </div>
      </div>

      <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-muted/40">
        <Switch checked={form.is_current} onCheckedChange={(v) => onUpdate("is_current", v)} />
        <Label className="text-xs font-medium cursor-pointer">{isEdu ? (isAr ? "ما زلت أدرس" : "Currently studying") : (isAr ? "أعمل حالياً" : "Currently working")}</Label>
      </div>

      <FormActions isAr={isAr} isPending={isPending} editingId={editingId} canSave={!!form.title.trim()} onSave={onSave} onCancel={onCancel} />
    </div>
  );
}

function MembershipForm({ form, isAr, isPending, onUpdate, onSave, onCancel }: {
  form: any; isAr: boolean; isPending: boolean;
  onUpdate: (key: string, value: any) => void; onSave: () => void; onCancel: () => void;
}) {
  return (
    <div className="rounded-lg border border-border/50 bg-gradient-to-br from-muted/30 to-muted/10 p-4 space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-border/30">
        <h4 className="text-sm font-semibold flex items-center gap-2">
          <Users className="h-4 w-4" />{isAr ? "إضافة عضوية" : "Add Membership"}
        </h4>
        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={onCancel}><X className="h-3.5 w-3.5" /></Button>
      </div>

      <EntitySelector value={form.entity_id} entityName=""
        onChange={(id, name) => onUpdate("entity_id", id)}
        label={isAr ? "الجمعية / المنظمة" : "Association / Organization"} />

      <div className="grid gap-2.5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">{isAr ? "نوع العضوية" : "Membership Type"}</Label>
          <Select value={form.membership_type} onValueChange={(v) => onUpdate("membership_type", v)}>
            <SelectTrigger className="h-9 text-xs"><SelectValue placeholder={isAr ? "اختر النوع" : "Select type"} /></SelectTrigger>
            <SelectContent>{MEMBERSHIP_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{isAr ? t.ar : t.en}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">{isAr ? "تاريخ الانتساب" : "Enrollment Date"}</Label>
          <Input type="date" value={form.enrollment_date} onChange={(e) => onUpdate("enrollment_date", e.target.value)} className="h-9 text-xs" dir="ltr" />
        </div>
      </div>

      <div className="grid gap-2.5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">{isAr ? "المسمى (EN)" : "Title (EN)"}</Label>
          <Input value={form.title} onChange={(e) => onUpdate("title", e.target.value)} className="h-9 text-xs" dir="ltr" placeholder={isAr ? "باللغة الإنجليزية" : "In English"} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">{isAr ? "المسمى (AR)" : "Title (AR)"}</Label>
          <Input value={form.title_ar} onChange={(e) => onUpdate("title_ar", e.target.value)} className="h-9 text-xs" dir="rtl" placeholder={isAr ? "باللغة العربية" : "In Arabic"} />
        </div>
      </div>

      <FormActions isAr={isAr} isPending={isPending} canSave={!!form.entity_id} onSave={onSave} onCancel={onCancel} />
    </div>
  );
}

function CompetitionAddForm({ competitions, selectedId, onSelect, isAr, isPending, onSave, onCancel }: {
  competitions: any[]; selectedId: string; onSelect: (id: string) => void;
  isAr: boolean; isPending: boolean; onSave: () => void; onCancel: () => void;
}) {
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => {
    if (!search.trim()) return competitions.slice(0, 10);
    const q = search.toLowerCase();
    return competitions.filter(c => c.title?.toLowerCase().includes(q) || c.title_ar?.toLowerCase().includes(q));
  }, [competitions, search]);

  return (
    <div className="rounded-lg border border-border/50 bg-gradient-to-br from-muted/30 to-muted/10 p-4 space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-border/30">
        <h4 className="text-sm font-semibold flex items-center gap-2">
          <Trophy className="h-4 w-4" />{isAr ? "إضافة مسابقة" : "Add Competition"}
        </h4>
        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={onCancel}><X className="h-3.5 w-3.5" /></Button>
      </div>

      <Input placeholder={isAr ? "ابحث عن مسابقة..." : "Search competitions..."}
        value={search} onChange={(e) => setSearch(e.target.value)} className="h-9 text-xs" />

      <div className="max-h-48 overflow-y-auto space-y-1.5 rounded-lg border border-border/40 bg-muted/20 p-2">
        {filtered.length === 0 && <p className="text-xs text-muted-foreground text-center py-3">{isAr ? "لا توجد نتائج" : "No results"}</p>}
        {filtered.map(c => (
          <button key={c.id} onClick={() => onSelect(c.id)}
            className={`w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-start transition-all text-xs font-medium ${selectedId === c.id ? "bg-primary/15 border border-primary/40 text-primary" : "hover:bg-muted/50 border border-transparent"}`}>
            <Trophy className="h-4 w-4 shrink-0 text-chart-4" />
            <div className="flex-1 min-w-0">
              <p className="truncate">{isAr ? (c.title_ar || c.title) : c.title}</p>
            </div>
            {c.competition_start && <span className="text-[10px] text-muted-foreground shrink-0 whitespace-nowrap">{formatDateShort(c.competition_start, isAr)}</span>}
          </button>
        ))}
      </div>

      <FormActions isAr={isAr} isPending={isPending} canSave={!!selectedId} onSave={onSave} onCancel={onCancel} />
    </div>
  );
}

function AwardAddForm({ form, isAr, isPending, onUpdate, onSave, onCancel }: {
  form: any; isAr: boolean; isPending: boolean;
  onUpdate: (key: string, value: any) => void; onSave: () => void; onCancel: () => void;
}) {
  return (
    <div className="rounded-lg border border-border/50 bg-gradient-to-br from-muted/30 to-muted/10 p-4 space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-border/30">
        <h4 className="text-sm font-semibold flex items-center gap-2">
          <Medal className="h-4 w-4" />{isAr ? "إضافة جائزة" : "Add Award"}
        </h4>
        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={onCancel}><X className="h-3.5 w-3.5" /></Button>
      </div>

      <div className="grid gap-2.5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">{isAr ? "اسم الحدث (EN)" : "Event Name (EN)"} *</Label>
          <Input value={form.event_name} onChange={(e) => onUpdate("event_name", e.target.value)} className="h-9 text-xs" dir="ltr" placeholder={isAr ? "باللغة الإنجليزية" : "In English"} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">{isAr ? "اسم الحدث (AR)" : "Event Name (AR)"}</Label>
          <Input value={form.event_name_ar} onChange={(e) => onUpdate("event_name_ar", e.target.value)} className="h-9 text-xs" dir="rtl" placeholder={isAr ? "باللغة العربية" : "In Arabic"} />
        </div>
      </div>

      <div className="grid gap-2.5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">{isAr ? "الإنجاز (EN)" : "Achievement (EN)"}</Label>
          <Input value={form.achievement} onChange={(e) => onUpdate("achievement", e.target.value)} className="h-9 text-xs" dir="ltr" placeholder={isAr ? "مثل الفوز أو المشاركة" : "e.g., Winner or Participant"} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">{isAr ? "الإنجاز (AR)" : "Achievement (AR)"}</Label>
          <Input value={form.achievement_ar} onChange={(e) => onUpdate("achievement_ar", e.target.value)} className="h-9 text-xs" dir="rtl" placeholder={isAr ? "مثل الفوز أو المشاركة" : "e.g., Winner or Participant"} />
        </div>
      </div>

      <div className="grid gap-2.5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">{isAr ? "النوع" : "Type"}</Label>
          <Select value={form.type} onValueChange={(v) => onUpdate("type", v)}>
            <SelectTrigger className="h-9 text-xs"><SelectValue placeholder={isAr ? "اختر النوع" : "Select type"} /></SelectTrigger>
            <SelectContent>{CERTIFICATE_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{isAr ? t.ar : t.en}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">{isAr ? "التاريخ" : "Award Date"}</Label>
          <Input type="date" value={form.event_date} onChange={(e) => onUpdate("event_date", e.target.value)} className="h-9 text-xs" dir="ltr" />
        </div>
      </div>

      <FormActions isAr={isAr} isPending={isPending} canSave={!!form.event_name.trim()} onSave={onSave} onCancel={onCancel} />
    </div>
  );
}
