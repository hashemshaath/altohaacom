import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ArrowLeft, Save, Loader2, User, GraduationCap, Briefcase,
  Trophy, Award, Tv, Globe2, Languages, CheckCircle2, MapPin,
  Edit3, X, Trash2, Download, Printer, ChevronDown, ChevronRight,
} from "lucide-react";
import { downloadCSV, downloadJSON } from "@/lib/exportUtils";
import type { CVData, CVWorkExperience, CVEducation, CVCompetition, CVMediaAppearance } from "./types";
import {
  getFlag, ROLE_LABELS, MEDIA_TYPE_LABELS,
  EMPLOYMENT_TYPE_LABELS, EDUCATION_LEVEL_LABELS,
} from "./types";

interface Props {
  data: CVData;
  targetUserId: string;
  isAr: boolean;
  onBack: () => void;
  onSaved: () => void;
  onDataChange?: (data: CVData) => void;
}

const formatDate = (d?: string) => {
  if (!d) return "";
  try { return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short" }); } catch { return d; }
};

// ─── Smart Translate Hook ───
function useSmartTranslate() {
  const [translatingKey, setTranslatingKey] = useState<string | null>(null);
  const { toast } = useToast();

  const translate = useCallback(async (
    text: string,
    fromLang: "ar" | "en",
    onResult: (translated: string) => void,
    key: string,
  ) => {
    if (!text.trim()) return;
    setTranslatingKey(key);
    try {
      const { data, error } = await supabase.functions.invoke("smart-translate", {
        body: { text, from: fromLang, to: fromLang === "ar" ? "en" : "ar", context: "culinary/hospitality/food industry professional CV" },
      });
      if (error) throw error;
      if (data?.translated) {
        onResult(data.translated);
        toast({ title: fromLang === "ar" ? "Translated ✓" : "✓ تمت الترجمة" });
      }
    } catch (err: any) {
      toast({ title: "Translation Error", description: err.message, variant: "destructive" });
    } finally {
      setTranslatingKey(null);
    }
  }, [toast]);

  return { translate, translatingKey };
}

// ─── Translate Button ───
const TranslateBtn = ({ onClick, loading, small }: { onClick: () => void; loading: boolean; small?: boolean }) => (
  <Button
    variant="ghost" size="icon"
    className={`${small ? "h-5 w-5" : "h-6 w-6"} shrink-0 text-primary hover:text-primary/80`}
    onClick={onClick} disabled={loading}
    title="🔤 Smart Translate"
  >
    {loading ? <Loader2 className={`${small ? "h-3 w-3" : "h-3.5 w-3.5"} animate-spin`} /> : <Languages className={`${small ? "h-3 w-3" : "h-3.5 w-3.5"}`} />}
  </Button>
);

/** Location display: flag + city, country */
const LocationDisplay = ({ city, countryCode }: { city?: string; countryCode?: string }) => {
  if (!city && !countryCode) return null;
  const flag = getFlag(countryCode);
  const parts = [city, countryCode?.toUpperCase()].filter(Boolean).join(", ");
  return (
    <span className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
      {flag && <span>{flag}</span>}{parts}
    </span>
  );
};

// Inline editable field
function EditableText({ value, onChange, label, multiline, className = "" }: {
  value: string; onChange: (v: string) => void; label?: string; multiline?: boolean; className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  if (editing) {
    const save = () => { onChange(draft); setEditing(false); };
    const cancel = () => { setDraft(value); setEditing(false); };
    return (
      <div className="flex items-start gap-1">
        {multiline ? (
          <Textarea value={draft} onChange={e => setDraft(e.target.value)} className="text-xs min-h-[60px]" dir="auto" autoFocus onKeyDown={e => e.key === "Escape" && cancel()} />
        ) : (
          <Input value={draft} onChange={e => setDraft(e.target.value)} className="text-xs h-7" dir="auto" autoFocus onKeyDown={e => { if (e.key === "Enter") save(); if (e.key === "Escape") cancel(); }} />
        )}
        <Button size="icon" variant="ghost" className="h-6 w-6 shrink-0" onClick={save}><CheckCircle2 className="h-3 w-3 text-chart-2" /></Button>
        <Button size="icon" variant="ghost" className="h-6 w-6 shrink-0" onClick={cancel}><X className="h-3 w-3" /></Button>
      </div>
    );
  }

  return (
    <span
      className={`cursor-pointer hover:bg-muted/50 rounded px-1 -mx-1 transition-colors group/edit inline-flex items-center gap-1 ${className}`}
      onClick={() => { setDraft(value); setEditing(true); }}
      title={label || "Click to edit"}
    >
      {value || <span className="text-muted-foreground/50 italic text-[10px]">—</span>}
      <Edit3 className="h-2.5 w-2.5 opacity-0 group-hover/edit:opacity-50 shrink-0" />
    </span>
  );
}

const rowBg = (i: number) => i % 2 === 0 ? "bg-muted/20" : "bg-muted/50";

// ─── Collapsible Section Wrapper ───
function CollapsibleSection({
  icon, titleEn, titleAr, count, sectionKey, colorClass, isAr, checked, onToggle,
  defaultOpen = false, extraActions, children,
}: {
  icon: React.ReactNode; titleEn: string; titleAr: string;
  count: number; sectionKey: string; colorClass: string;
  isAr: boolean; checked: boolean; onToggle: () => void;
  defaultOpen?: boolean; extraActions?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card className="overflow-hidden">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CardHeader className={`pb-2 ${colorClass.replace("text-", "bg-").split(" ")[0]}/5`}>
          <div className="flex items-center justify-between">
            <CollapsibleTrigger asChild>
              <button className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${colorClass}`}>{icon}</div>
                <span className="text-sm font-semibold">{isAr ? titleAr : titleEn}</span>
                <Badge variant="secondary" className="text-[10px] h-5">{count}</Badge>
                {open ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
              </button>
            </CollapsibleTrigger>
            <div className="flex items-center gap-1.5">
              {extraActions}
              <Checkbox checked={checked} onCheckedChange={onToggle} />
            </div>
          </div>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="p-0">
            {children}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

// ─── Paired personal field definitions ───
type PersonalFieldDef = [string, string, string, string | null];

const PAIRED_PERSONAL_FIELDS: PersonalFieldDef[] = [
  ["full_name", "Name", "الاسم", "full_name_ar"],
  ["full_name_ar", "Name (AR)", "الاسم بالعربية", "full_name"],
  ["job_title", "Job Title", "المسمى الوظيفي", "job_title_ar"],
  ["job_title_ar", "Job Title (AR)", "المسمى (عربي)", "job_title"],
  ["specialization", "Specialization", "التخصص", "specialization_ar"],
  ["specialization_ar", "Specialization (AR)", "التخصص (عربي)", "specialization"],
  ["phone", "Phone", "الهاتف", null],
  ["email", "Email", "البريد", null],
  ["nationality", "Nationality", "الجنسية", null],
  ["city", "City", "المدينة", null],
  ["country_code", "Country", "الدولة", null],
  ["national_address", "National Address", "العنوان الوطني", null],
  ["years_of_experience", "Years of Exp.", "سنوات الخبرة", null],
  ["linkedin", "LinkedIn", "LinkedIn", null],
  ["instagram", "Instagram", "Instagram", null],
  ["website", "Website", "الموقع", null],
];

export function CVPreview({ data: initialData, targetUserId, isAr, onBack, onSaved, onDataChange }: Props) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<CVData>(initialData);
  const [sections, setSections] = useState({
    personal: true, education: true, work: true,
    competitions: true, certifications: true, media: true,
  });
  const { translate, translatingKey } = useSmartTranslate();

  const updateData = useCallback((updater: (d: CVData) => CVData) => {
    setData(prev => { const next = updater(prev); onDataChange?.(next); return next; });
  }, [onDataChange]);

  const updatePersonal = useCallback((key: string, value: any) => {
    updateData(d => ({ ...d, personal_info: { ...d.personal_info, [key]: value } }));
  }, [updateData]);

  const updateWorkItem = useCallback((index: number, key: string, value: any) => {
    updateData(d => ({ ...d, work_experience: d.work_experience?.map((w, i) => i === index ? { ...w, [key]: value } : w) }));
  }, [updateData]);

  const updateEduItem = useCallback((index: number, key: string, value: any) => {
    updateData(d => ({ ...d, education: d.education?.map((e, i) => i === index ? { ...e, [key]: value } : e) }));
  }, [updateData]);

  const removeWorkItem = useCallback((index: number) => { updateData(d => ({ ...d, work_experience: d.work_experience?.filter((_, i) => i !== index) })); }, [updateData]);
  const removeEduItem = useCallback((index: number) => { updateData(d => ({ ...d, education: d.education?.filter((_, i) => i !== index) })); }, [updateData]);
  const removeCompItem = useCallback((index: number) => { updateData(d => ({ ...d, competitions: d.competitions?.filter((_, i) => i !== index) })); }, [updateData]);
  const removeMediaItem = useCallback((index: number) => { updateData(d => ({ ...d, media_appearances: d.media_appearances?.filter((_, i) => i !== index) })); }, [updateData]);
  const removeCertItem = useCallback((index: number) => { updateData(d => ({ ...d, certifications: d.certifications?.filter((_, i) => i !== index) })); }, [updateData]);

  const toggle = (key: keyof typeof sections) => setSections((p) => ({ ...p, [key]: !p[key] }));

  const pi = data.personal_info;
  const hasPersonal = pi && Object.values(pi).some(v => v);
  const hasEdu = (data.education?.length || 0) > 0;
  const hasWork = (data.work_experience?.length || 0) > 0;
  const hasComp = (data.competitions?.length || 0) > 0;
  const hasCert = (data.certifications?.length || 0) > 0;
  const hasMedia = (data.media_appearances?.length || 0) > 0;

  // ─── Save handler ───
  const handleSave = async () => {
    setSaving(true);
    let recordsCreated = 0;
    const sectionsImported: string[] = [];
    try {
      if (sections.personal && hasPersonal) {
        const profileUpdate: Record<string, any> = {};
        const keys = ["full_name","full_name_ar","phone","nationality","second_nationality","country_code","city","location","job_title","job_title_ar","specialization","specialization_ar","bio","bio_ar","years_of_experience","experience_level","date_of_birth","gender","website","linkedin","instagram","twitter"];
        keys.forEach(k => { if ((pi as any)[k]) profileUpdate[k] = (pi as any)[k]; });
        if (Object.keys(profileUpdate).length > 0) {
          const { error } = await supabase.from("profiles").update(profileUpdate).eq("user_id", targetUserId);
          if (!error) { recordsCreated++; sectionsImported.push("personal"); }
        }

        // ─── Auto-update Bio page (social_link_pages) ───
        try {
          const { data: existingPage } = await supabase
            .from("social_link_pages")
            .select("id")
            .eq("user_id", targetUserId)
            .maybeSingle();

          const bioPageUpdate: Record<string, any> = {};
          if (pi.full_name) bioPageUpdate.page_title = pi.full_name;
          if (pi.full_name_ar) bioPageUpdate.page_title_ar = pi.full_name_ar;
          if (pi.bio) bioPageUpdate.bio = pi.bio;
          if (pi.bio_ar) bioPageUpdate.bio_ar = pi.bio_ar;

          if (Object.keys(bioPageUpdate).length > 0) {
            if (existingPage) {
              await supabase.from("social_link_pages").update({ ...bioPageUpdate, updated_at: new Date().toISOString() }).eq("id", existingPage.id);
            } else {
              await supabase.from("social_link_pages").insert({
                user_id: targetUserId,
                ...bioPageUpdate,
                is_published: true,
                show_avatar: true,
                show_social_icons: true,
                theme: "default",
              });
            }
          }
        } catch (bioErr) {
          console.error("Bio page update error:", bioErr);
        }
      }
      if (sections.education && hasEdu) {
        const eduRecords = data.education!.map((edu) => ({
          user_id: targetUserId, record_type: "education",
          entity_name: edu.institution, entity_name_ar: edu.institution_ar || null,
          title: edu.degree, title_ar: edu.degree_ar || null,
          education_level: edu.education_level || null,
          field_of_study: edu.field_of_study || null, field_of_study_ar: edu.field_of_study_ar || null,
          grade: edu.grade || null, start_date: edu.start_date || null, end_date: edu.end_date || null,
          is_current: edu.is_current || false,
          location: edu.location ? `${edu.country_code ? getFlag(edu.country_code) + " " : ""}${edu.location}` : null,
        }));
        const { error } = await supabase.from("user_career_records").insert(eduRecords);
        if (!error) { recordsCreated += eduRecords.length; sectionsImported.push("education"); }
      }
      if (sections.work && hasWork) {
        const workRecords = data.work_experience!.map((work) => {
          const descEn = [...(work.tasks?.map(t => `• ${t}`) || []), ...(work.achievements?.length ? ["\nAchievements:", ...work.achievements.map(a => `★ ${a}`)] : [])].join("\n");
          return {
            user_id: targetUserId, record_type: "work",
            entity_name: work.company, entity_name_ar: work.company_ar || null,
            title: work.title, title_ar: work.title_ar || null,
            employment_type: work.employment_type || null,
            department: work.department || null, department_ar: work.department_ar || null,
            start_date: work.start_date || null, end_date: work.end_date || null, is_current: work.is_current || false,
            description: descEn || null,
            location: work.location ? `${work.country_code ? getFlag(work.country_code) + " " : ""}${work.location}` : null,
          };
        });
        const { error } = await supabase.from("user_career_records").insert(workRecords);
        if (!error) { recordsCreated += workRecords.length; sectionsImported.push("work"); }
      }
      if (sections.competitions && hasComp) {
        const compRecords = data.competitions!.map((comp) => ({
          user_id: targetUserId, record_type: "work",
          entity_name: comp.name, entity_name_ar: comp.name_ar || null,
          title: `${comp.name}${comp.year ? ` ${comp.year}` : ""}${comp.edition ? ` (${comp.edition})` : ""}`.trim(),
          title_ar: comp.name_ar ? `${comp.name_ar}${comp.year ? ` ${comp.year}` : ""}${comp.edition ? ` (${comp.edition})` : ""}`.trim() : null,
          description: [comp.role ? `Role: ${ROLE_LABELS[comp.role]?.en || comp.role}` : "", comp.achievement || ""].filter(Boolean).join("\n") || null,
          description_ar: [comp.role ? `الدور: ${ROLE_LABELS[comp.role]?.ar || comp.role}` : "", comp.achievement_ar || ""].filter(Boolean).join("\n") || null,
          start_date: comp.year ? `${comp.year}-01-01` : null, end_date: comp.year ? `${comp.year}-12-31` : null,
          is_current: false, location: comp.city ? `${comp.country_code ? getFlag(comp.country_code) + " " : ""}${comp.city}` : null,
        }));
        const { error } = await supabase.from("user_career_records").insert(compRecords);
        if (!error) { recordsCreated += compRecords.length; sectionsImported.push("competitions"); }
      }
      if (sections.media && hasMedia) {
        const mediaRecords = data.media_appearances!.map((m) => ({
          user_id: targetUserId, record_type: "work",
          entity_name: m.channel_name, title: m.program_name || m.channel_name,
          description: [m.type ? `${MEDIA_TYPE_LABELS[m.type]?.icon || "📺"} ${MEDIA_TYPE_LABELS[m.type]?.en || m.type}` : "", m.description || ""].filter(Boolean).join("\n") || null,
          description_ar: m.type ? `${MEDIA_TYPE_LABELS[m.type]?.icon || "📺"} ${MEDIA_TYPE_LABELS[m.type]?.ar || m.type}` : null,
          start_date: m.date || null, is_current: false, location: m.country_code ? `${getFlag(m.country_code)}` : null,
        }));
        const { error } = await supabase.from("user_career_records").insert(mediaRecords);
        if (!error) { recordsCreated += mediaRecords.length; sectionsImported.push("media"); }
      }
      if (sections.certifications && hasCert) {
        const certRecords = data.certifications!.map((cert) => ({
          user_id: targetUserId, record_type: "education",
          entity_name: cert.issuer || "—", entity_name_ar: null,
          title: cert.name, title_ar: cert.name_ar || null,
          description: cert.description || null,
          start_date: cert.date || null, is_current: false,
        }));
        const { error } = await supabase.from("user_career_records").insert(certRecords);
        if (!error) { recordsCreated += certRecords.length; sectionsImported.push("certifications"); }
      }
      // Save skills to profile
      if (data.skills?.length) {
        const skillsStr = data.skills.join(", ");
        await supabase.from("profiles").update({ specialization: data.personal_info?.specialization || skillsStr }).eq("user_id", targetUserId);
      }
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (currentUser) {
          await supabase.from("cv_imports").insert({
            chef_id: targetUserId, imported_by: currentUser.id, status: "completed",
            sections_imported: sectionsImported, extracted_data: data as any, records_created: recordsCreated, input_method: "paste",
          });
        }
      } catch (logErr) { console.error("Failed to log import:", logErr); }
      toast({ title: isAr ? `✅ تم استيراد ${recordsCreated} سجل وتحديث صفحة Bio تلقائياً` : `✅ Imported ${recordsCreated} records & Bio page auto-updated` });
      onSaved();
    } catch (err: any) {
      toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: err.message });
    }
    setSaving(false);
  };

  // ─── Translate All paired personal fields ───
  const handleTranslateAllPersonal = useCallback(async () => {
    const pairs: [string, string, string][] = [
      ["full_name", "full_name_ar", "en"],
      ["full_name_ar", "full_name", "ar"],
      ["job_title", "job_title_ar", "en"],
      ["job_title_ar", "job_title", "ar"],
      ["specialization", "specialization_ar", "en"],
      ["specialization_ar", "specialization", "ar"],
      ["bio", "bio_ar", "en"],
      ["bio_ar", "bio", "ar"],
    ];
    for (const [srcKey, tgtKey, fromLang] of pairs) {
      const srcVal = (pi as any)[srcKey];
      const tgtVal = (pi as any)[tgtKey];
      if (srcVal && !tgtVal) {
        await translate(srcVal, fromLang as "en" | "ar", (t) => updatePersonal(tgtKey, t), `personal_${tgtKey}`);
      }
    }
  }, [pi, translate, updatePersonal]);

  // ─── Translate All Education ───
  const handleTranslateAllEducation = useCallback(async () => {
    if (!data.education) return;
    for (let i = 0; i < data.education.length; i++) {
      const edu = data.education[i];
      if (edu.degree && !edu.degree_ar) {
        await translate(edu.degree, "en", (t) => updateEduItem(i, "degree_ar", t), `edu_degree_${i}`);
      }
      if (edu.degree_ar && !edu.degree) {
        await translate(edu.degree_ar, "ar", (t) => updateEduItem(i, "degree", t), `edu_degree_en_${i}`);
      }
      if (edu.institution && !edu.institution_ar) {
        await translate(edu.institution, "en", (t) => updateEduItem(i, "institution_ar", t), `edu_inst_${i}`);
      }
      if (edu.field_of_study && !edu.field_of_study_ar) {
        await translate(edu.field_of_study, "en", (t) => updateEduItem(i, "field_of_study_ar", t), `edu_field_${i}`);
      }
    }
  }, [data.education, translate, updateEduItem]);

  // ─── Translate All Work Experience ───
  const handleTranslateAllWork = useCallback(async () => {
    if (!data.work_experience) return;
    for (let i = 0; i < data.work_experience.length; i++) {
      const work = data.work_experience[i];
      if (work.title && !work.title_ar) {
        await translate(work.title, "en", (t) => updateWorkItem(i, "title_ar", t), `work_title_${i}`);
      }
      if (work.title_ar && !work.title) {
        await translate(work.title_ar, "ar", (t) => updateWorkItem(i, "title", t), `work_title_en_${i}`);
      }
      if (work.company && !work.company_ar) {
        await translate(work.company, "en", (t) => updateWorkItem(i, "company_ar", t), `work_company_${i}`);
      }
      if (work.department && !work.department_ar) {
        await translate(work.department, "en", (t) => updateWorkItem(i, "department_ar", t), `work_dept_${i}`);
      }
    }
  }, [data.work_experience, translate, updateWorkItem]);

  // ─── Translate All Competitions ───
  const handleTranslateAllCompetitions = useCallback(async () => {
    if (!data.competitions) return;
    for (let i = 0; i < data.competitions.length; i++) {
      const comp = data.competitions[i];
      if (comp.name && !comp.name_ar) {
        await translate(comp.name, "en", (t) => updateData(d => ({ ...d, competitions: d.competitions?.map((c, ci) => ci === i ? { ...c, name_ar: t } : c) })), `comp_name_${i}`);
      }
      if (comp.name_ar && !comp.name) {
        await translate(comp.name_ar, "ar", (t) => updateData(d => ({ ...d, competitions: d.competitions?.map((c, ci) => ci === i ? { ...c, name: t } : c) })), `comp_name_en_${i}`);
      }
      if (comp.achievement && !comp.achievement_ar) {
        await translate(comp.achievement, "en", (t) => updateData(d => ({ ...d, competitions: d.competitions?.map((c, ci) => ci === i ? { ...c, achievement_ar: t } : c) })), `comp_ach_${i}`);
      }
    }
  }, [data.competitions, translate, updateData]);

  // ─── Print CV Report ───
  const handlePrintCV = useCallback(() => {
    const win = window.open("", "_blank");
    if (!win) return;
    const p = data.personal_info;
    const formatD = (d?: string) => { if (!d) return ""; try { return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short" }); } catch { return d; } };
    
    const eduHtml = data.education?.length ? `
      <h2>Education / التعليم</h2>
      <table><tr><th>Degree</th><th>الشهادة</th><th>Institution</th><th>Field</th><th>Period</th></tr>
      ${data.education.map(e => `<tr><td>${e.degree || ""}</td><td>${e.degree_ar || ""}</td><td>${e.institution || ""}</td><td>${e.field_of_study || ""}</td><td>${formatD(e.start_date)} - ${e.is_current ? "Present" : formatD(e.end_date)}</td></tr>`).join("")}
      </table>` : "";
    
    const workHtml = data.work_experience?.length ? `
      <h2>Professional Experience / الخبرات المهنية</h2>
      <table><tr><th>Position</th><th>المنصب</th><th>Company</th><th>الشركة</th><th>Period</th></tr>
      ${data.work_experience.map(w => `<tr><td>${w.title || ""}</td><td>${w.title_ar || ""}</td><td>${w.company || ""}</td><td>${w.company_ar || ""}</td><td>${formatD(w.start_date)} - ${w.is_current ? "Present" : formatD(w.end_date)}</td></tr>`).join("")}
      </table>` : "";

    const compHtml = data.competitions?.length ? `
      <h2>Competitions / المسابقات</h2>
      <table><tr><th>Name</th><th>الاسم</th><th>Year</th><th>Role</th><th>Achievement</th></tr>
      ${data.competitions.map(c => `<tr><td>${c.name || ""}</td><td>${c.name_ar || ""}</td><td>${c.year || ""}</td><td>${ROLE_LABELS[c.role || ""]?.en || c.role || ""}</td><td>${c.achievement || ""}</td></tr>`).join("")}
      </table>` : "";

    const certHtml = data.certifications?.length ? `
      <h2>Certifications / الشهادات</h2>
      <table><tr><th>Name</th><th>الاسم</th><th>Issuer</th><th>Date</th></tr>
      ${data.certifications.map(c => `<tr><td>${c.name || ""}</td><td>${c.name_ar || ""}</td><td>${c.issuer || ""}</td><td>${formatD(c.date)}</td></tr>`).join("")}
      </table>` : "";

    const skillsHtml = data.skills?.length ? `<h2>Skills / المهارات</h2><p>${data.skills.join(" • ")}</p>` : "";
    const langsHtml = data.languages?.length ? `<h2>Languages / اللغات</h2><p>${data.languages.map(l => `${l.language}${l.level ? ` (${l.level})` : ""}`).join(" • ")}</p>` : "";

    win.document.write(`<!DOCTYPE html><html><head><title>CV - ${p.full_name || ""}</title>
      <style>
        @page { size: portrait; margin: 1.5cm; }
        body { font-family: system-ui, sans-serif; padding: 2rem; color: #1a1a1a; }
        h1 { font-size: 20px; margin: 0; border-bottom: 2px solid #c8956c; padding-bottom: 6px; }
        h2 { font-size: 14px; color: #c8956c; margin: 1.2rem 0 0.4rem; border-bottom: 1px solid #e5e5e5; padding-bottom: 3px; }
        table { width: 100%; border-collapse: collapse; margin: 0.5rem 0; font-size: 12px; }
        th, td { border: 1px solid #e0e0e0; padding: 5px 8px; text-align: start; }
        th { background: #f5f0ec; font-weight: 600; font-size: 11px; }
        tr:nth-child(even) { background: #fafafa; }
        .meta { color: #888; font-size: 11px; margin-top: 4px; }
        .bio { background: #f9f7f5; padding: 8px 12px; border-radius: 6px; margin: 8px 0; font-size: 12px; line-height: 1.5; }
        .subtitle { font-size: 13px; color: #666; margin: 2px 0 0; }
        @media print { body { padding: 0; } }
      </style>
    </head><body>
      <h1>${p.full_name || ""} ${p.full_name_ar ? `<span style="float:inline-end;font-family:serif;" dir="rtl">${p.full_name_ar}</span>` : ""}</h1>
      ${p.job_title || p.job_title_ar ? `<p class="subtitle">${p.job_title || ""} ${p.job_title_ar ? `| ${p.job_title_ar}` : ""}</p>` : ""}
      <p class="meta">${[p.email, p.phone, p.city && p.country_code ? `${getFlag(p.country_code)} ${p.city}` : p.city].filter(Boolean).join(" | ")}${p.years_of_experience ? ` | ${p.years_of_experience} years` : ""}</p>
      ${p.bio ? `<div class="bio">${p.bio}</div>` : ""}
      ${p.bio_ar ? `<div class="bio" dir="rtl">${p.bio_ar}</div>` : ""}
      ${eduHtml}${workHtml}${compHtml}${certHtml}${skillsHtml}${langsHtml}
      <p class="meta" style="margin-top:1.5rem;border-top:1px solid #ddd;padding-top:6px;">Generated: ${new Date().toLocaleString()} | Altoha Platform</p>
    </body></html>`);
    win.document.close();
    win.focus();
    win.print();
  }, [data]);

  // Helper: get display value for personal fields
  const getPersonalDisplay = (key: string): string | undefined => {
    const raw = (pi as any)[key];
    if (!raw) return undefined;
    if (key === "nationality" || key === "country_code") return `${getFlag(raw)} ${raw}`;
    return String(raw);
  };

  return (
    <div className="space-y-4">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1">
          <ArrowLeft className="h-4 w-4" />
          {isAr ? "رجوع" : "Back"}
        </Button>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs gap-1">
            <Edit3 className="h-3 w-3 text-primary" />
            {isAr ? "انقر للتعديل" : "Click to edit"}
          </Badge>
          <Badge variant="outline" className="text-xs gap-1">
            <Languages className="h-3 w-3 text-primary" />
            {isAr ? "🔤 ترجمة ذكية" : "🔤 Smart Translate"}
          </Badge>
        </div>
      </div>

      {/* ═══ PERSONAL INFO ═══ */}
      {hasPersonal && (
        <CollapsibleSection
          icon={<User className="h-4 w-4" />}
          titleEn="Personal Info" titleAr="المعلومات الشخصية"
          count={1} sectionKey="personal" colorClass="bg-primary/10 text-primary"
          isAr={isAr} checked={sections.personal} onToggle={() => toggle("personal")}
          defaultOpen={true}
          extraActions={
            <Button variant="ghost" size="sm" className="h-7 text-[10px] gap-1 text-primary" onClick={handleTranslateAllPersonal} disabled={translatingKey?.startsWith("personal_")}>
              {translatingKey?.startsWith("personal_") ? <Loader2 className="h-3 w-3 animate-spin" /> : <Languages className="h-3 w-3" />}
              {isAr ? "ترجمة الكل" : "Translate All"}
            </Button>
          }
        >
          <Table>
            <TableBody>
              {PAIRED_PERSONAL_FIELDS.map(([key, labelEn, labelAr, pairedKey], i) => {
                const value = getPersonalDisplay(key);
                if (!value) return null;
                const isArField = key.endsWith("_ar");
                return (
                  <TableRow key={key} className={`${rowBg(i)} border-border/10 hover:bg-accent/30`}>
                    <TableCell className="py-1.5 px-3 w-[140px]">
                      <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                        {isAr ? labelAr : labelEn}
                      </span>
                    </TableCell>
                    <TableCell className="py-1.5 px-3">
                      <div className="flex items-center gap-1">
                        <EditableText value={value} onChange={(v) => updatePersonal(key, v || undefined)} label={isAr ? labelAr : labelEn} className="text-sm font-medium" />
                        {pairedKey && value && (
                          <TranslateBtn
                            small
                            loading={translatingKey === `personal_${pairedKey}`}
                            onClick={() => translate(
                              (pi as any)[key] || "",
                              isArField ? "ar" : "en",
                              (t) => updatePersonal(pairedKey, t),
                              `personal_${pairedKey}`,
                            )}
                          />
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          {(pi.bio || pi.bio_ar) && (
            <div className="p-3 border-t border-border/20 bg-muted/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  {isAr ? "النبذة المهنية" : "Professional Summary"}
                </span>
                {pi.bio && !pi.bio_ar && (
                  <TranslateBtn
                    loading={translatingKey === "personal_bio_ar"}
                    onClick={() => translate(pi.bio!, "en", (t) => updatePersonal("bio_ar", t), "personal_bio_ar")}
                  />
                )}
              </div>
              {pi.bio && <EditableText value={pi.bio} onChange={(v) => updatePersonal("bio", v || undefined)} multiline className="text-xs block" />}
              {pi.bio_ar && <EditableText value={pi.bio_ar} onChange={(v) => updatePersonal("bio_ar", v || undefined)} multiline className="text-xs block text-muted-foreground" />}
            </div>
          )}
        </CollapsibleSection>
      )}

      {/* ═══ EDUCATION ═══ */}
      {hasEdu && (
        <CollapsibleSection
          icon={<GraduationCap className="h-4 w-4" />}
          titleEn="Education" titleAr="التعليم"
          count={data.education!.length} sectionKey="education" colorClass="bg-chart-2/10 text-chart-2"
          isAr={isAr} checked={sections.education} onToggle={() => toggle("education")}
          defaultOpen={true}
          extraActions={
            <Button variant="ghost" size="sm" className="h-7 text-[10px] gap-1 text-chart-2" onClick={handleTranslateAllEducation} disabled={translatingKey?.startsWith("edu_")}>
              {translatingKey?.startsWith("edu_") ? <Loader2 className="h-3 w-3 animate-spin" /> : <Languages className="h-3 w-3" />}
              {isAr ? "ترجمة الكل" : "Translate All"}
            </Button>
          }
        >
          <Table>
            <TableHeader>
              <TableRow className="bg-chart-2/5 border-border/10">
                <TableHead className="text-[10px] py-1.5 h-auto">English</TableHead>
                <TableHead className="text-[10px] py-1.5 h-auto">العربية</TableHead>
                <TableHead className="text-[10px] py-1.5 h-auto">{isAr ? "الفترة" : "Period"}</TableHead>
                <TableHead className="text-[10px] py-1.5 h-auto">{isAr ? "الموقع" : "Location"}</TableHead>
                <TableHead className="text-[10px] py-1.5 h-auto w-14"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.education!.map((edu, i) => (
                <TableRow key={i} className={`${rowBg(i)} border-border/10 group hover:bg-accent/30`}>
                  <TableCell className="py-2 px-3" dir="ltr">
                    <div className="space-y-0.5">
                      <div className="flex items-start gap-1">
                        <span className="text-xs font-semibold">{edu.degree || "—"}</span>
                        {edu.degree && !edu.degree_ar && (
                          <TranslateBtn small loading={translatingKey === `edu_degree_${i}`}
                            onClick={() => translate(edu.degree, "en", (t) => updateEduItem(i, "degree_ar", t), `edu_degree_${i}`)} />
                        )}
                      </div>
                      <span className="text-[11px] text-muted-foreground block">{edu.institution || ""}</span>
                      {edu.field_of_study && <span className="text-[10px] text-muted-foreground/70 block">{edu.field_of_study}</span>}
                      {edu.education_level && (
                        <Badge variant="outline" className="text-[9px] h-4 mt-0.5">
                          {EDUCATION_LEVEL_LABELS[edu.education_level]?.en || edu.education_level}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="py-2 px-3" dir="rtl">
                    <div className="space-y-0.5">
                      <span className="text-xs font-semibold">{edu.degree_ar || <span className="text-muted-foreground/40 italic text-[10px]">—</span>}</span>
                      <span className="text-[11px] text-muted-foreground block">{edu.institution_ar || ""}</span>
                      {edu.field_of_study_ar && <span className="text-[10px] text-muted-foreground/70 block">{edu.field_of_study_ar}</span>}
                      {edu.education_level && (
                        <Badge variant="outline" className="text-[9px] h-4 mt-0.5">
                          {EDUCATION_LEVEL_LABELS[edu.education_level]?.ar || edu.education_level}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="py-2 px-3">
                    <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                      {formatDate(edu.start_date)} — {edu.is_current ? (isAr ? "الحالي" : "Present") : formatDate(edu.end_date)}
                    </span>
                  </TableCell>
                  <TableCell className="py-2 px-3">
                    <LocationDisplay city={edu.location} countryCode={edu.country_code} />
                  </TableCell>
                  <TableCell className="py-2 px-1">
                    <Button size="icon" variant="ghost" className="h-5 w-5 opacity-0 group-hover:opacity-100" onClick={() => removeEduItem(i)}>
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CollapsibleSection>
      )}

      {/* ═══ WORK EXPERIENCE ═══ */}
      {hasWork && (
        <CollapsibleSection
          icon={<Briefcase className="h-4 w-4" />}
          titleEn="Professional Experience" titleAr="الخبرات المهنية"
          count={data.work_experience!.length} sectionKey="work" colorClass="bg-chart-3/10 text-chart-3"
          isAr={isAr} checked={sections.work} onToggle={() => toggle("work")}
          defaultOpen={true}
          extraActions={
            <Button variant="ghost" size="sm" className="h-7 text-[10px] gap-1 text-chart-3" onClick={handleTranslateAllWork} disabled={translatingKey?.startsWith("work_")}>
              {translatingKey?.startsWith("work_") ? <Loader2 className="h-3 w-3 animate-spin" /> : <Languages className="h-3 w-3" />}
              {isAr ? "ترجمة الكل" : "Translate All"}
            </Button>
          }
        >
          <Table>
            <TableHeader>
              <TableRow className="bg-chart-3/5 border-border/10">
                <TableHead className="text-[10px] py-1.5 h-auto">English</TableHead>
                <TableHead className="text-[10px] py-1.5 h-auto">العربية</TableHead>
                <TableHead className="text-[10px] py-1.5 h-auto">{isAr ? "النوع" : "Type"}</TableHead>
                <TableHead className="text-[10px] py-1.5 h-auto">{isAr ? "الفترة" : "Period"}</TableHead>
                <TableHead className="text-[10px] py-1.5 h-auto">{isAr ? "الموقع" : "Location"}</TableHead>
                <TableHead className="text-[10px] py-1.5 h-auto w-14"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.work_experience!.map((work, i) => (
                <TableRow key={i} className={`${rowBg(i)} border-border/10 group hover:bg-accent/30 align-top`}>
                  <TableCell className="py-2 px-3" dir="ltr">
                    <div className="space-y-0.5">
                      <div className="flex items-start gap-1">
                        <span className="text-xs font-semibold">{work.title || "—"}</span>
                        {work.title && !work.title_ar && (
                          <TranslateBtn small loading={translatingKey === `work_title_${i}`}
                            onClick={() => translate(work.title, "en", (t) => updateWorkItem(i, "title_ar", t), `work_title_${i}`)} />
                        )}
                      </div>
                      <div className="flex items-start gap-1">
                        <span className="text-[11px] text-muted-foreground">{work.company || ""}</span>
                        {work.company && !work.company_ar && (
                          <TranslateBtn small loading={translatingKey === `work_company_${i}`}
                            onClick={() => translate(work.company, "en", (t) => updateWorkItem(i, "company_ar", t), `work_company_${i}`)} />
                        )}
                      </div>
                      {work.department && <span className="text-[10px] text-muted-foreground/70 block">{work.department}</span>}
                    </div>
                  </TableCell>
                  <TableCell className="py-2 px-3" dir="rtl">
                    <div className="space-y-0.5">
                      <span className="text-xs font-semibold">{work.title_ar || <span className="text-muted-foreground/40 italic text-[10px]">—</span>}</span>
                      <span className="text-[11px] text-muted-foreground block">{work.company_ar || ""}</span>
                      {work.department_ar && <span className="text-[10px] text-muted-foreground/70 block">{work.department_ar}</span>}
                    </div>
                  </TableCell>
                  <TableCell className="py-2 px-3">
                    {work.employment_type && (
                      <Badge variant="outline" className="text-[9px] h-4">
                        {isAr ? (EMPLOYMENT_TYPE_LABELS[work.employment_type]?.ar || work.employment_type) : (EMPLOYMENT_TYPE_LABELS[work.employment_type]?.en || work.employment_type)}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="py-2 px-3">
                    <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                      {formatDate(work.start_date)} — {work.is_current ? (isAr ? "الحالي" : "Present") : formatDate(work.end_date)}
                    </span>
                  </TableCell>
                  <TableCell className="py-2 px-3">
                    <LocationDisplay city={work.location} countryCode={work.country_code} />
                  </TableCell>
                  <TableCell className="py-2 px-1">
                    <Button size="icon" variant="ghost" className="h-5 w-5 opacity-0 group-hover:opacity-100" onClick={() => removeWorkItem(i)}>
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {/* Tasks & Achievements - collapsible per job */}
          {data.work_experience!.some(w => (w.tasks?.length || 0) > 0 || (w.achievements?.length || 0) > 0) && (
            <div className="border-t border-border/20 p-3 space-y-1">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">{isAr ? "التفاصيل والإنجازات" : "Details & Achievements"}</p>
              {data.work_experience!.map((work, i) => {
                if (!(work.tasks?.length || work.achievements?.length)) return null;
                return (
                  <details key={i} className={`rounded-lg ${rowBg(i)} border border-border/10`}>
                    <summary className="cursor-pointer p-2.5 text-[11px] font-semibold text-foreground select-none hover:bg-accent/20 rounded-lg transition-colors">
                      {isAr ? (work.title_ar || work.title) : work.title} — {isAr ? (work.company_ar || work.company) : work.company}
                    </summary>
                    <div className="px-2.5 pb-2.5">
                      {work.tasks && work.tasks.length > 0 && (
                        <div className="mt-1.5 space-y-0.5">
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{isAr ? "المهام الرئيسية" : "Key Responsibilities"}</p>
                          {work.tasks.map((t, j) => (
                            <p key={j} className="text-[11px] text-foreground/80 ps-3 relative before:content-['•'] before:absolute before:start-0 before:text-primary">{t}</p>
                          ))}
                        </div>
                      )}
                      {work.achievements && work.achievements.length > 0 && (
                        <div className="mt-1.5 space-y-0.5">
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{isAr ? "الإنجازات البارزة" : "Notable Achievements"}</p>
                          {work.achievements.map((a, j) => (
                            <p key={j} className="text-[11px] text-foreground/80 ps-3 relative before:content-['★'] before:absolute before:start-0 before:text-chart-4">{a}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  </details>
                );
              })}
            </div>
          )}
        </CollapsibleSection>
      )}

      {/* ═══ COMPETITIONS ═══ */}
      {hasComp && (
        <CollapsibleSection
          icon={<Trophy className="h-4 w-4" />}
          titleEn="Competitions" titleAr="المسابقات"
          count={data.competitions!.length} sectionKey="competitions" colorClass="bg-chart-4/10 text-chart-4"
          isAr={isAr} checked={sections.competitions} onToggle={() => toggle("competitions")}
          extraActions={
            <Button variant="ghost" size="sm" className="h-7 text-[10px] gap-1 text-chart-4" onClick={handleTranslateAllCompetitions} disabled={translatingKey?.startsWith("comp_")}>
              {translatingKey?.startsWith("comp_") ? <Loader2 className="h-3 w-3 animate-spin" /> : <Languages className="h-3 w-3" />}
              {isAr ? "ترجمة الكل" : "Translate All"}
            </Button>
          }
        >
          <Table>
            <TableHeader>
              <TableRow className="bg-chart-4/5 border-border/10">
                <TableHead className="text-[10px] py-1.5 h-auto">English</TableHead>
                <TableHead className="text-[10px] py-1.5 h-auto">العربية</TableHead>
                <TableHead className="text-[10px] py-1.5 h-auto">{isAr ? "السنة" : "Year"}</TableHead>
                <TableHead className="text-[10px] py-1.5 h-auto">{isAr ? "الدور" : "Role"}</TableHead>
                <TableHead className="text-[10px] py-1.5 h-auto">{isAr ? "الموقع" : "Location"}</TableHead>
                <TableHead className="text-[10px] py-1.5 h-auto w-14"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.competitions!.map((comp, i) => (
                <TableRow key={i} className={`${rowBg(i)} border-border/10 group hover:bg-accent/30`}>
                  <TableCell className="py-2 px-3" dir="ltr">
                    <div className="space-y-0.5">
                      <div className="flex items-start gap-1">
                        <span className="text-xs font-semibold">{comp.name || "—"}</span>
                        {comp.name && !comp.name_ar && (
                          <TranslateBtn small loading={translatingKey === `comp_name_${i}`}
                            onClick={() => translate(comp.name, "en", (t) => updateData(d => ({ ...d, competitions: d.competitions?.map((c, ci) => ci === i ? { ...c, name_ar: t } : c) })), `comp_name_${i}`)} />
                        )}
                      </div>
                      {comp.achievement && <span className="text-[10px] text-muted-foreground block">🏆 {comp.achievement}</span>}
                    </div>
                  </TableCell>
                  <TableCell className="py-2 px-3" dir="rtl">
                    <div className="space-y-0.5">
                      <span className="text-xs font-semibold">{comp.name_ar || <span className="text-muted-foreground/40 italic text-[10px]">—</span>}</span>
                      {comp.achievement_ar && <span className="text-[10px] text-muted-foreground block">🏆 {comp.achievement_ar}</span>}
                    </div>
                  </TableCell>
                  <TableCell className="py-2 px-3">
                    <span className="text-xs">{comp.year || "—"}{comp.edition ? ` (${comp.edition})` : ""}</span>
                  </TableCell>
                  <TableCell className="py-2 px-3">
                    {comp.role && (
                      <Badge variant="secondary" className="text-[9px] h-4">
                        {isAr ? (ROLE_LABELS[comp.role]?.ar || comp.role) : (ROLE_LABELS[comp.role]?.en || comp.role)}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="py-2 px-3">
                    <LocationDisplay city={comp.city} countryCode={comp.country_code} />
                  </TableCell>
                  <TableCell className="py-2 px-1">
                    <Button size="icon" variant="ghost" className="h-5 w-5 opacity-0 group-hover:opacity-100" onClick={() => removeCompItem(i)}>
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CollapsibleSection>
      )}

      {/* ═══ CERTIFICATIONS ═══ */}
      {hasCert && (
        <CollapsibleSection
          icon={<Award className="h-4 w-4" />}
          titleEn="Certifications" titleAr="الشهادات المهنية"
          count={data.certifications!.length} sectionKey="certifications" colorClass="bg-chart-5/10 text-chart-5"
          isAr={isAr} checked={sections.certifications} onToggle={() => toggle("certifications")}
        >
          <Table>
            <TableHeader>
              <TableRow className="bg-chart-5/5 border-border/10">
                <TableHead className="text-[10px] py-1.5 h-auto">English</TableHead>
                <TableHead className="text-[10px] py-1.5 h-auto">العربية</TableHead>
                <TableHead className="text-[10px] py-1.5 h-auto">{isAr ? "الجهة المانحة" : "Issuer"}</TableHead>
                <TableHead className="text-[10px] py-1.5 h-auto">{isAr ? "التاريخ" : "Date"}</TableHead>
                <TableHead className="text-[10px] py-1.5 h-auto w-14"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.certifications!.map((cert, i) => (
                <TableRow key={i} className={`${rowBg(i)} border-border/10 group hover:bg-accent/30`}>
                  <TableCell className="py-2 px-3" dir="ltr">
                    <div className="flex items-start gap-1">
                      <span className="text-xs font-medium">{cert.name || "—"}</span>
                      {cert.name && !cert.name_ar && (
                        <TranslateBtn small loading={translatingKey === `cert_name_${i}`}
                          onClick={() => translate(cert.name, "en", (t) => updateData(d => ({ ...d, certifications: d.certifications?.map((c, ci) => ci === i ? { ...c, name_ar: t } : c) })), `cert_name_${i}`)} />
                      )}
                    </div>
                    {cert.description && <span className="text-[10px] text-muted-foreground block mt-0.5">{cert.description}</span>}
                  </TableCell>
                  <TableCell className="py-2 px-3" dir="rtl">
                    <span className="text-xs font-medium">{cert.name_ar || <span className="text-muted-foreground/40 italic text-[10px]">—</span>}</span>
                  </TableCell>
                  <TableCell className="py-2 px-3"><span className="text-xs">{cert.issuer || "—"}</span></TableCell>
                  <TableCell className="py-2 px-3"><span className="text-[11px] text-muted-foreground">{formatDate(cert.date)}</span></TableCell>
                  <TableCell className="py-2 px-1">
                    <Button size="icon" variant="ghost" className="h-5 w-5 opacity-0 group-hover:opacity-100" onClick={() => removeCertItem(i)}>
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CollapsibleSection>
      )}

      {/* ═══ MEDIA APPEARANCES ═══ */}
      {hasMedia && (
        <CollapsibleSection
          icon={<Tv className="h-4 w-4" />}
          titleEn="Media Appearances" titleAr="الظهور الإعلامي"
          count={data.media_appearances!.length} sectionKey="media" colorClass="bg-chart-1/10 text-chart-1"
          isAr={isAr} checked={sections.media} onToggle={() => toggle("media")}
        >
          <Table>
            <TableHeader>
              <TableRow className="bg-chart-1/5 border-border/10">
                <TableHead className="text-[10px] py-1.5 h-auto">{isAr ? "النوع" : "Type"}</TableHead>
                <TableHead className="text-[10px] py-1.5 h-auto">{isAr ? "القناة" : "Channel"}</TableHead>
                <TableHead className="text-[10px] py-1.5 h-auto">{isAr ? "البرنامج" : "Program"}</TableHead>
                <TableHead className="text-[10px] py-1.5 h-auto">{isAr ? "التاريخ" : "Date"}</TableHead>
                <TableHead className="text-[10px] py-1.5 h-auto">{isAr ? "البلد" : "Country"}</TableHead>
                <TableHead className="text-[10px] py-1.5 h-auto w-8"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.media_appearances!.map((m, i) => (
                <TableRow key={i} className={`${rowBg(i)} border-border/10 group hover:bg-accent/30`}>
                  <TableCell className="py-2 px-3">
                    <span className="text-sm">{m.type ? (MEDIA_TYPE_LABELS[m.type]?.icon || "📺") : "📺"}</span>
                    {m.type && <span className="text-[10px] text-muted-foreground ms-1">{isAr ? (MEDIA_TYPE_LABELS[m.type]?.ar || m.type) : (MEDIA_TYPE_LABELS[m.type]?.en || m.type)}</span>}
                  </TableCell>
                  <TableCell className="py-2 px-3"><span className="text-xs font-medium">{m.channel_name}</span></TableCell>
                  <TableCell className="py-2 px-3">
                    <span className="text-xs">{m.program_name || "—"}</span>
                    {m.description && <span className="text-[10px] text-muted-foreground block mt-0.5">{m.description}</span>}
                  </TableCell>
                  <TableCell className="py-2 px-3"><span className="text-[11px] text-muted-foreground">{formatDate(m.date)}</span></TableCell>
                  <TableCell className="py-2 px-3">{m.country_code && <span>{getFlag(m.country_code)} {m.country_code}</span>}</TableCell>
                  <TableCell className="py-2 px-1">
                    <Button size="icon" variant="ghost" className="h-5 w-5 opacity-0 group-hover:opacity-100" onClick={() => removeMediaItem(i)}>
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CollapsibleSection>
      )}

      {/* ═══ SKILLS & LANGUAGES ═══ */}
      {((data.skills?.length || 0) > 0 || (data.languages?.length || 0) > 0) && (
        <Card>
          <CardContent className="p-4 space-y-3">
            {(data.skills?.length || 0) > 0 && (
              <div>
                <p className="text-xs font-semibold mb-1.5 flex items-center gap-1"><Globe2 className="h-3.5 w-3.5 text-primary" />{isAr ? "المهارات" : "Skills"}</p>
                <div className="flex flex-wrap gap-1.5">{data.skills!.map((s, i) => <Badge key={i} variant="secondary" className="text-[10px] h-5">{s}</Badge>)}</div>
              </div>
            )}
            {(data.languages?.length || 0) > 0 && (
              <div>
                <p className="text-xs font-semibold mb-1.5 flex items-center gap-1"><Languages className="h-3.5 w-3.5 text-primary" />{isAr ? "اللغات" : "Languages"}</p>
                <div className="flex flex-wrap gap-1.5">{data.languages!.map((l, i) => <Badge key={i} variant="outline" className="text-[10px] h-5">{l.language} {l.level && `(${l.level})`}</Badge>)}</div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Separator />

      <div className="flex justify-between gap-2">
        <div className="flex gap-1.5">
          <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={() => downloadJSON(data, `cv-data-${targetUserId.slice(0, 8)}`)}>
            <Download className="h-3 w-3" /> JSON
          </Button>
          <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={() => {
            const rows: Record<string, any>[] = [];
            if (data.personal_info) rows.push({ section: "Personal", ...data.personal_info });
            data.education?.forEach(e => rows.push({ section: "Education", ...e }));
            data.work_experience?.forEach(w => rows.push({ section: "Work", ...w, tasks: w.tasks?.join("; "), achievements: w.achievements?.join("; ") }));
            data.competitions?.forEach(c => rows.push({ section: "Competition", ...c }));
            data.certifications?.forEach(c => rows.push({ section: "Certification", ...c }));
            data.media_appearances?.forEach(m => rows.push({ section: "Media", ...m }));
            downloadCSV(rows, `cv-data-${targetUserId.slice(0, 8)}`);
          }}>
            <Download className="h-3 w-3" /> CSV
          </Button>
          <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={() => handlePrintCV()}>
            <Printer className="h-3 w-3" /> {isAr ? "طباعة" : "Print"}
          </Button>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onBack} disabled={saving}>{isAr ? "رجوع" : "Back"}</Button>
          <Button onClick={handleSave} disabled={saving} className="gap-1.5">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? (isAr ? "جاري الحفظ..." : "Saving...") : (isAr ? "حفظ في الملف الشخصي" : "Save to Profile")}
          </Button>
        </div>
      </div>
    </div>
  );
}
