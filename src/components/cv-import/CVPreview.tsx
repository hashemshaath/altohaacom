import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft, Save, Loader2, User, GraduationCap, Briefcase,
  Trophy, Award, Tv, Globe2, Languages, CheckCircle2, MapPin, Calendar,
  Edit3, X, Trash2,
} from "lucide-react";
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
  try {
    const date = new Date(d);
    return date.toLocaleDateString("en-US", { year: "numeric", month: "short" });
  } catch { return d; }
};

/** Bilingual display: EN / AR with flag */
const BilingualText = ({ en, ar, flag }: { en?: string; ar?: string; flag?: string }) => {
  if (!en && !ar) return <span className="text-muted-foreground/40">—</span>;
  return (
    <div className="flex flex-col gap-0.5">
      {en && <span className="text-xs font-medium" dir="ltr">{flag && <span className="me-1">{flag}</span>}{en}</span>}
      {ar && <span className="text-xs text-muted-foreground" dir="rtl">{flag && !en && <span className="me-1">{flag}</span>}{ar}</span>}
    </div>
  );
};

/** Location display: flag + city, country */
const LocationDisplay = ({ city, countryCode }: { city?: string; countryCode?: string }) => {
  if (!city && !countryCode) return null;
  const flag = getFlag(countryCode);
  const parts = [city, countryCode?.toUpperCase()].filter(Boolean).join(", ");
  return (
    <span className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
      {flag && <span>{flag}</span>}
      {parts}
    </span>
  );
};

// Inline editable field component
function EditableText({
  value, onChange, label, multiline, className = "",
}: {
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
      className={`cursor-pointer hover:bg-muted/50 rounded px-1 -mx-1 transition-colors group inline-flex items-center gap-1 ${className}`}
      onClick={() => { setDraft(value); setEditing(true); }}
      title={label || "Click to edit"}
    >
      {value || <span className="text-muted-foreground/50 italic text-[10px]">—</span>}
      <Edit3 className="h-2.5 w-2.5 opacity-0 group-hover:opacity-50 shrink-0" />
    </span>
  );
}

/** Alternating row style helper */
const rowBg = (i: number) => i % 2 === 0 ? "bg-muted/20" : "bg-muted/50";

export function CVPreview({ data: initialData, targetUserId, isAr, onBack, onSaved, onDataChange }: Props) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<CVData>(initialData);
  const [sections, setSections] = useState({
    personal: true, education: true, work: true,
    competitions: true, certifications: true, media: true,
  });

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

  const removeWorkItem = useCallback((index: number) => {
    updateData(d => ({ ...d, work_experience: d.work_experience?.filter((_, i) => i !== index) }));
  }, [updateData]);

  const removeEduItem = useCallback((index: number) => {
    updateData(d => ({ ...d, education: d.education?.filter((_, i) => i !== index) }));
  }, [updateData]);

  const removeCompItem = useCallback((index: number) => {
    updateData(d => ({ ...d, competitions: d.competitions?.filter((_, i) => i !== index) }));
  }, [updateData]);

  const removeMediaItem = useCallback((index: number) => {
    updateData(d => ({ ...d, media_appearances: d.media_appearances?.filter((_, i) => i !== index) }));
  }, [updateData]);

  const removeCertItem = useCallback((index: number) => {
    updateData(d => ({ ...d, certifications: d.certifications?.filter((_, i) => i !== index) }));
  }, [updateData]);

  const toggle = (key: keyof typeof sections) => setSections((p) => ({ ...p, [key]: !p[key] }));

  const pi = data.personal_info;
  const hasPersonal = pi && Object.values(pi).some(v => v);
  const hasEdu = (data.education?.length || 0) > 0;
  const hasWork = (data.work_experience?.length || 0) > 0;
  const hasComp = (data.competitions?.length || 0) > 0;
  const hasCert = (data.certifications?.length || 0) > 0;
  const hasMedia = (data.media_appearances?.length || 0) > 0;

  // --- Save handler (unchanged logic) ---
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
      }
      if (sections.education && hasEdu) {
        const eduRecords = data.education!.map((edu) => ({
          user_id: targetUserId, record_type: "education", entity_name: edu.institution,
          title: edu.degree, title_ar: edu.degree_ar || null, education_level: edu.education_level || null,
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
          const desc = [...(work.tasks?.map(t => `• ${t}`) || []), ...(work.achievements?.length ? [`\n${isAr ? "الإنجازات:" : "Achievements:"}`, ...work.achievements.map(a => `★ ${a}`)] : [])].join("\n");
          return {
            user_id: targetUserId, record_type: "work", entity_name: work.company, title: work.title, title_ar: work.title_ar || null,
            employment_type: work.employment_type || null, department: work.department || null, department_ar: work.department_ar || null,
            start_date: work.start_date || null, end_date: work.end_date || null, is_current: work.is_current || false,
            description: desc || null, location: work.location ? `${work.country_code ? getFlag(work.country_code) + " " : ""}${work.location}` : null,
          };
        });
        const { error } = await supabase.from("user_career_records").insert(workRecords);
        if (!error) { recordsCreated += workRecords.length; sectionsImported.push("work"); }
      }
      if (sections.competitions && hasComp) {
        const compRecords = data.competitions!.map((comp) => ({
          user_id: targetUserId, record_type: "work", entity_name: comp.name,
          title: `${comp.name}${comp.year ? ` ${comp.year}` : ""}${comp.edition ? ` (${comp.edition})` : ""}`.trim(),
          title_ar: comp.name_ar || null,
          description: [comp.role ? `${isAr ? "الدور:" : "Role:"} ${isAr ? (ROLE_LABELS[comp.role]?.ar || comp.role) : (ROLE_LABELS[comp.role]?.en || comp.role)}` : "", comp.achievement ? `${isAr ? "الإنجاز:" : "Achievement:"} ${isAr ? (comp.achievement_ar || comp.achievement) : comp.achievement}` : ""].filter(Boolean).join("\n") || null,
          start_date: comp.year ? `${comp.year}-01-01` : null, end_date: comp.year ? `${comp.year}-12-31` : null,
          is_current: false, location: comp.city ? `${comp.country_code ? getFlag(comp.country_code) + " " : ""}${comp.city}` : null,
        }));
        const { error } = await supabase.from("user_career_records").insert(compRecords);
        if (!error) { recordsCreated += compRecords.length; sectionsImported.push("competitions"); }
      }
      if (sections.media && hasMedia) {
        const mediaRecords = data.media_appearances!.map((m) => ({
          user_id: targetUserId, record_type: "work", entity_name: m.channel_name, title: m.program_name || m.channel_name,
          description: [m.type ? `${MEDIA_TYPE_LABELS[m.type]?.icon || "📺"} ${isAr ? (MEDIA_TYPE_LABELS[m.type]?.ar || m.type) : (MEDIA_TYPE_LABELS[m.type]?.en || m.type)}` : "", m.description || ""].filter(Boolean).join("\n") || null,
          start_date: m.date || null, is_current: false, location: m.country_code ? `${getFlag(m.country_code)}` : null,
        }));
        const { error } = await supabase.from("user_career_records").insert(mediaRecords);
        if (!error) { recordsCreated += mediaRecords.length; sectionsImported.push("media"); }
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
      toast({ title: isAr ? `✅ تم استيراد ${recordsCreated} سجل بنجاح` : `✅ Successfully imported ${recordsCreated} records` });
      onSaved();
    } catch (err: any) {
      toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: err.message });
    }
    setSaving(false);
  };

  const sectionHeader = (
    icon: React.ReactNode, titleEn: string, titleAr: string,
    count: number, key: keyof typeof sections, colorClass: string,
  ) => (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${colorClass}`}>{icon}</div>
        <span className="text-sm font-semibold">{isAr ? titleAr : titleEn}</span>
        <Badge variant="secondary" className="text-[10px] h-5">{count}</Badge>
      </div>
      <Checkbox checked={sections[key]} onCheckedChange={() => toggle(key)} />
    </div>
  );

  // --- Personal info rows ---
  const personalFields: [string, string, string, string | undefined][] = [
    ["full_name", "Name", "الاسم", pi.full_name],
    ["full_name_ar", "Name (AR)", "الاسم بالعربية", pi.full_name_ar],
    ["job_title", "Job Title", "المسمى الوظيفي", pi.job_title],
    ["job_title_ar", "Job Title (AR)", "المسمى (عربي)", pi.job_title_ar],
    ["phone", "Phone", "الهاتف", pi.phone],
    ["email", "Email", "البريد", pi.email],
    ["nationality", "Nationality", "الجنسية", pi.nationality ? `${getFlag(pi.nationality)} ${pi.nationality}` : undefined],
    ["city", "City", "المدينة", pi.city],
    ["country_code", "Country", "الدولة", pi.country_code ? `${getFlag(pi.country_code)} ${pi.country_code}` : undefined],
    ["national_address", "National Address", "العنوان الوطني", pi.national_address],
    ["years_of_experience", "Years of Exp.", "سنوات الخبرة", pi.years_of_experience?.toString()],
    ["specialization", "Specialization", "التخصص", pi.specialization],
    ["linkedin", "LinkedIn", "LinkedIn", pi.linkedin],
    ["instagram", "Instagram", "Instagram", pi.instagram],
    ["website", "Website", "الموقع", pi.website],
  ];

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
            {isAr ? "انقر على أي حقل للتعديل" : "Click any field to edit"}
          </Badge>
          <Badge variant="outline" className="text-xs gap-1">
            <CheckCircle2 className="h-3 w-3 text-chart-2" />
            {isAr ? "تم التحليل" : "Parsed"}
          </Badge>
        </div>
      </div>

      {/* ========= PERSONAL INFO TABLE ========= */}
      {hasPersonal && (
        <Card className="border-primary/20 overflow-hidden">
          <CardHeader className="pb-2 bg-primary/5">
            {sectionHeader(<User className="h-4 w-4" />, "Personal Info", "المعلومات الشخصية", 1, "personal", "bg-primary/10 text-primary")}
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableBody>
                {personalFields.filter(([,,,v]) => v).map(([key, labelEn, labelAr, value], i) => (
                  <TableRow key={key} className={`${rowBg(i)} border-border/10 hover:bg-accent/30`}>
                    <TableCell className="py-1.5 px-3 w-[140px]">
                      <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                        {isAr ? labelAr : labelEn}
                      </span>
                    </TableCell>
                    <TableCell className="py-1.5 px-3">
                      <EditableText
                        value={value || ""}
                        onChange={(v) => updatePersonal(key, v || undefined)}
                        label={isAr ? labelAr : labelEn}
                        className="text-sm font-medium"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {/* Bio section */}
            {(pi.bio || pi.bio_ar) && (
              <div className="p-3 border-t border-border/20 bg-muted/10">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  {isAr ? "النبذة المهنية" : "Professional Summary"}
                </span>
                <div className="mt-1 space-y-1">
                  {pi.bio && (
                    <EditableText value={pi.bio} onChange={(v) => updatePersonal("bio", v || undefined)} multiline className="text-xs block" />
                  )}
                  {pi.bio_ar && (
                    <EditableText value={pi.bio_ar} onChange={(v) => updatePersonal("bio_ar", v || undefined)} multiline className="text-xs block text-muted-foreground" />
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ========= EDUCATION TABLE ========= */}
      {hasEdu && (
        <Card className="overflow-hidden">
          <CardHeader className="pb-2 bg-chart-2/5">
            {sectionHeader(<GraduationCap className="h-4 w-4" />, "Education", "التعليم", data.education!.length, "education", "bg-chart-2/10 text-chart-2")}
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-chart-2/5 border-border/10">
                  <TableHead className="text-[10px] py-1.5 h-auto">{isAr ? "الشهادة" : "Degree"}</TableHead>
                  <TableHead className="text-[10px] py-1.5 h-auto">{isAr ? "المؤسسة" : "Institution"}</TableHead>
                  <TableHead className="text-[10px] py-1.5 h-auto">{isAr ? "التخصص" : "Field"}</TableHead>
                  <TableHead className="text-[10px] py-1.5 h-auto">{isAr ? "الفترة" : "Period"}</TableHead>
                  <TableHead className="text-[10px] py-1.5 h-auto">{isAr ? "الموقع" : "Location"}</TableHead>
                  <TableHead className="text-[10px] py-1.5 h-auto w-8"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.education!.map((edu, i) => (
                  <TableRow key={i} className={`${rowBg(i)} border-border/10 group hover:bg-accent/30`}>
                    <TableCell className="py-2 px-3">
                      <BilingualText en={edu.degree} ar={edu.degree_ar} />
                      {edu.education_level && (
                        <Badge variant="outline" className="text-[9px] h-4 mt-0.5">
                          {isAr ? (EDUCATION_LEVEL_LABELS[edu.education_level]?.ar || edu.education_level) : (EDUCATION_LEVEL_LABELS[edu.education_level]?.en || edu.education_level)}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="py-2 px-3">
                      <BilingualText en={edu.institution} ar={edu.institution_ar} />
                    </TableCell>
                    <TableCell className="py-2 px-3">
                      <BilingualText en={edu.field_of_study} ar={edu.field_of_study_ar} />
                      {edu.grade && <span className="text-[10px] text-muted-foreground block">{edu.grade}</span>}
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
          </CardContent>
        </Card>
      )}

      {/* ========= WORK EXPERIENCE TABLE ========= */}
      {hasWork && (
        <Card className="overflow-hidden">
          <CardHeader className="pb-2 bg-chart-3/5">
            {sectionHeader(<Briefcase className="h-4 w-4" />, "Professional Experience", "الخبرات المهنية", data.work_experience!.length, "work", "bg-chart-3/10 text-chart-3")}
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-chart-3/5 border-border/10">
                  <TableHead className="text-[10px] py-1.5 h-auto">{isAr ? "المنصب" : "Position"}</TableHead>
                  <TableHead className="text-[10px] py-1.5 h-auto">{isAr ? "الجهة" : "Organization"}</TableHead>
                  <TableHead className="text-[10px] py-1.5 h-auto">{isAr ? "النوع" : "Type"}</TableHead>
                  <TableHead className="text-[10px] py-1.5 h-auto">{isAr ? "الفترة" : "Period"}</TableHead>
                  <TableHead className="text-[10px] py-1.5 h-auto">{isAr ? "الموقع" : "Location"}</TableHead>
                  <TableHead className="text-[10px] py-1.5 h-auto w-8"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.work_experience!.map((work, i) => (
                  <TableRow key={i} className={`${rowBg(i)} border-border/10 group hover:bg-accent/30 align-top`}>
                    <TableCell className="py-2 px-3">
                      <BilingualText en={work.title} ar={work.title_ar} />
                      {work.department && (
                        <span className="text-[10px] text-muted-foreground block mt-0.5">
                          {isAr ? (work.department_ar || work.department) : work.department}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="py-2 px-3">
                      <BilingualText en={work.company} ar={work.company_ar} />
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
            {/* Expandable tasks & achievements below table */}
            {data.work_experience!.some(w => (w.tasks?.length || 0) > 0 || (w.achievements?.length || 0) > 0) && (
              <div className="border-t border-border/20 p-3 space-y-3">
                {data.work_experience!.map((work, i) => {
                  if (!(work.tasks?.length || work.achievements?.length)) return null;
                  return (
                    <div key={i} className={`rounded-lg p-2.5 ${rowBg(i)} border border-border/10`}>
                      <span className="text-[11px] font-semibold text-foreground">
                        {isAr ? (work.title_ar || work.title) : work.title} — {isAr ? (work.company_ar || work.company) : work.company}
                      </span>
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
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ========= COMPETITIONS TABLE ========= */}
      {hasComp && (
        <Card className="overflow-hidden">
          <CardHeader className="pb-2 bg-chart-4/5">
            {sectionHeader(<Trophy className="h-4 w-4" />, "Competitions", "المسابقات", data.competitions!.length, "competitions", "bg-chart-4/10 text-chart-4")}
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-chart-4/5 border-border/10">
                  <TableHead className="text-[10px] py-1.5 h-auto">{isAr ? "المسابقة / السنة" : "Competition / Year"}</TableHead>
                  <TableHead className="text-[10px] py-1.5 h-auto">{isAr ? "الدور" : "Role"}</TableHead>
                  <TableHead className="text-[10px] py-1.5 h-auto">{isAr ? "الإنجاز" : "Achievement"}</TableHead>
                  <TableHead className="text-[10px] py-1.5 h-auto">{isAr ? "الموقع" : "Location"}</TableHead>
                  <TableHead className="text-[10px] py-1.5 h-auto w-8"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.competitions!.map((comp, i) => {
                  const compName = isAr ? (comp.name_ar || comp.name) : comp.name;
                  const yearStr = comp.year ? ` ${comp.year}` : "";
                  const editionStr = comp.edition ? ` (${comp.edition})` : "";
                  return (
                    <TableRow key={i} className={`${rowBg(i)} border-border/10 group hover:bg-accent/30`}>
                      <TableCell className="py-2 px-3">
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold">{compName}{yearStr}{editionStr}</span>
                          {/* Show other language if available */}
                          {comp.name_ar && !isAr && <span className="text-[10px] text-muted-foreground" dir="rtl">{comp.name_ar}</span>}
                          {comp.name && isAr && comp.name_ar && <span className="text-[10px] text-muted-foreground" dir="ltr">{comp.name}</span>}
                        </div>
                      </TableCell>
                      <TableCell className="py-2 px-3">
                        {comp.role && (
                          <Badge variant="secondary" className="text-[9px] h-4">
                            {isAr ? (ROLE_LABELS[comp.role]?.ar || comp.role) : (ROLE_LABELS[comp.role]?.en || comp.role)}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="py-2 px-3">
                        {comp.achievement && (
                          <BilingualText en={isAr ? undefined : comp.achievement} ar={isAr ? (comp.achievement_ar || comp.achievement) : comp.achievement_ar} />
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
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* ========= CERTIFICATIONS TABLE ========= */}
      {hasCert && (
        <Card className="overflow-hidden">
          <CardHeader className="pb-2 bg-chart-5/5">
            {sectionHeader(<Award className="h-4 w-4" />, "Certifications", "الشهادات المهنية", data.certifications!.length, "certifications", "bg-chart-5/10 text-chart-5")}
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-chart-5/5 border-border/10">
                  <TableHead className="text-[10px] py-1.5 h-auto">{isAr ? "الشهادة" : "Certification"}</TableHead>
                  <TableHead className="text-[10px] py-1.5 h-auto">{isAr ? "الجهة المانحة" : "Issuer"}</TableHead>
                  <TableHead className="text-[10px] py-1.5 h-auto">{isAr ? "التاريخ" : "Date"}</TableHead>
                  <TableHead className="text-[10px] py-1.5 h-auto w-8"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.certifications!.map((cert, i) => (
                  <TableRow key={i} className={`${rowBg(i)} border-border/10 group hover:bg-accent/30`}>
                    <TableCell className="py-2 px-3">
                      <BilingualText en={cert.name} ar={cert.name_ar} />
                      {cert.description && <span className="text-[10px] text-muted-foreground block mt-0.5">{cert.description}</span>}
                    </TableCell>
                    <TableCell className="py-2 px-3">
                      <span className="text-xs">{cert.issuer || "—"}</span>
                    </TableCell>
                    <TableCell className="py-2 px-3">
                      <span className="text-[11px] text-muted-foreground">{formatDate(cert.date)}</span>
                    </TableCell>
                    <TableCell className="py-2 px-1">
                      <Button size="icon" variant="ghost" className="h-5 w-5 opacity-0 group-hover:opacity-100" onClick={() => removeCertItem(i)}>
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* ========= MEDIA APPEARANCES TABLE ========= */}
      {hasMedia && (
        <Card className="overflow-hidden">
          <CardHeader className="pb-2 bg-chart-1/5">
            {sectionHeader(<Tv className="h-4 w-4" />, "Media Appearances", "الظهور الإعلامي", data.media_appearances!.length, "media", "bg-chart-1/10 text-chart-1")}
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-chart-1/5 border-border/10">
                  <TableHead className="text-[10px] py-1.5 h-auto">{isAr ? "النوع" : "Type"}</TableHead>
                  <TableHead className="text-[10px] py-1.5 h-auto">{isAr ? "القناة / المنصة" : "Channel / Platform"}</TableHead>
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
                      {m.type && (
                        <span className="text-[10px] text-muted-foreground ms-1">
                          {isAr ? (MEDIA_TYPE_LABELS[m.type]?.ar || m.type) : (MEDIA_TYPE_LABELS[m.type]?.en || m.type)}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="py-2 px-3">
                      <span className="text-xs font-medium">{m.channel_name}</span>
                    </TableCell>
                    <TableCell className="py-2 px-3">
                      <span className="text-xs">{m.program_name || "—"}</span>
                      {m.description && <span className="text-[10px] text-muted-foreground block mt-0.5">{m.description}</span>}
                    </TableCell>
                    <TableCell className="py-2 px-3">
                      <span className="text-[11px] text-muted-foreground">{formatDate(m.date)}</span>
                    </TableCell>
                    <TableCell className="py-2 px-3">
                      {m.country_code && <span>{getFlag(m.country_code)} {m.country_code}</span>}
                    </TableCell>
                    <TableCell className="py-2 px-1">
                      <Button size="icon" variant="ghost" className="h-5 w-5 opacity-0 group-hover:opacity-100" onClick={() => removeMediaItem(i)}>
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* ========= SKILLS & LANGUAGES ========= */}
      {((data.skills?.length || 0) > 0 || (data.languages?.length || 0) > 0) && (
        <Card>
          <CardContent className="p-4 space-y-3">
            {(data.skills?.length || 0) > 0 && (
              <div>
                <p className="text-xs font-semibold mb-1.5 flex items-center gap-1">
                  <Globe2 className="h-3.5 w-3.5 text-primary" />
                  {isAr ? "المهارات" : "Skills"}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {data.skills!.map((s, i) => (
                    <Badge key={i} variant="secondary" className="text-[10px] h-5">{s}</Badge>
                  ))}
                </div>
              </div>
            )}
            {(data.languages?.length || 0) > 0 && (
              <div>
                <p className="text-xs font-semibold mb-1.5 flex items-center gap-1">
                  <Languages className="h-3.5 w-3.5 text-primary" />
                  {isAr ? "اللغات" : "Languages"}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {data.languages!.map((l, i) => (
                    <Badge key={i} variant="outline" className="text-[10px] h-5">
                      {l.language} {l.level && `(${l.level})`}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Separator />

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onBack} disabled={saving}>{isAr ? "رجوع" : "Back"}</Button>
        <Button onClick={handleSave} disabled={saving} className="gap-1.5">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? (isAr ? "جاري الحفظ..." : "Saving...") : (isAr ? "حفظ في الملف الشخصي" : "Save to Profile")}
        </Button>
      </div>
    </div>
  );
}
