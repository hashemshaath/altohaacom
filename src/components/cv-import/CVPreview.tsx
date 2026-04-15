import { useState, useCallback, memo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { downloadJSON } from "@/lib/exportUtils";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft, Save, Loader2, User, GraduationCap, Briefcase,
  Trophy, Award, Tv, Globe2, Languages, Download, Printer,
  Trash2, Edit3, MapPin,
} from "lucide-react";
import type { CVData } from "./types";
import {
  getFlag, ROLE_LABELS, MEDIA_TYPE_LABELS,
  EMPLOYMENT_TYPE_LABELS, EDUCATION_LEVEL_LABELS,
} from "./types";
import {
  formatDate, rowBg, TranslateBtn, LocationDisplay, EditableText,
  CollapsibleSection, PAIRED_PERSONAL_FIELDS,
} from "./CVPreviewHelpers";
import {
  useSmartTranslate, handleCVSave, printCV, exportCVAsCSV,
} from "./useCVPreviewHandlers";

interface Props {
  data: CVData;
  targetUserId: string;
  isAr: boolean;
  onBack: () => void;
  onSaved: () => void;
  onDataChange?: (data: CVData) => void;
}

export const CVPreview = memo(function CVPreview({ data: initialData, targetUserId, isAr, onBack, onSaved, onDataChange }: Props) {
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

  const updatePersonal = useCallback((key: string, value: unknown) => {
    updateData(d => ({ ...d, personal_info: { ...d.personal_info, [key]: value } }));
  }, [updateData]);

  const updateWorkItem = useCallback((index: number, key: string, value: unknown) => {
    updateData(d => ({ ...d, work_experience: d.work_experience?.map((w, i) => i === index ? { ...w, [key]: value } : w) }));
  }, [updateData]);

  const updateEduItem = useCallback((index: number, key: string, value: unknown) => {
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

  const handleSave = async () => {
    setSaving(true);
    await handleCVSave(data, sections, targetUserId, toast, isAr, onSaved);
    setSaving(false);
  };

  // ─── Translate All handlers ───
  const handleTranslateAllPersonal = useCallback(async () => {
    const pairs: [string, string, string][] = [
      ["full_name", "full_name_ar", "en"], ["full_name_ar", "full_name", "ar"],
      ["job_title", "job_title_ar", "en"], ["job_title_ar", "job_title", "ar"],
      ["specialization", "specialization_ar", "en"], ["specialization_ar", "specialization", "ar"],
      ["bio", "bio_ar", "en"], ["bio_ar", "bio", "ar"],
    ];
    for (const [srcKey, tgtKey, fromLang] of pairs) {
      const srcVal = (pi as Record<string, unknown>)[srcKey];
      const tgtVal = (pi as Record<string, unknown>)[tgtKey];
      if (srcVal && !tgtVal) {
        await translate(String(srcVal), fromLang as "en" | "ar", (t) => updatePersonal(tgtKey, t), `personal_${tgtKey}`);
      }
    }
  }, [pi, translate, updatePersonal]);

  const handleTranslateAllEducation = useCallback(async () => {
    if (!data.education) return;
    for (let i = 0; i < data.education.length; i++) {
      const edu = data.education[i];
      if (edu.degree && !edu.degree_ar) await translate(edu.degree, "en", (t) => updateEduItem(i, "degree_ar", t), `edu_degree_${i}`);
      if (edu.degree_ar && !edu.degree) await translate(edu.degree_ar, "ar", (t) => updateEduItem(i, "degree", t), `edu_degree_en_${i}`);
      if (edu.institution && !edu.institution_ar) await translate(edu.institution, "en", (t) => updateEduItem(i, "institution_ar", t), `edu_inst_${i}`);
      if (edu.field_of_study && !edu.field_of_study_ar) await translate(edu.field_of_study, "en", (t) => updateEduItem(i, "field_of_study_ar", t), `edu_field_${i}`);
    }
  }, [data.education, translate, updateEduItem]);

  const handleTranslateAllWork = useCallback(async () => {
    if (!data.work_experience) return;
    for (let i = 0; i < data.work_experience.length; i++) {
      const work = data.work_experience[i];
      if (work.title && !work.title_ar) await translate(work.title, "en", (t) => updateWorkItem(i, "title_ar", t), `work_title_${i}`);
      if (work.title_ar && !work.title) await translate(work.title_ar, "ar", (t) => updateWorkItem(i, "title", t), `work_title_en_${i}`);
      if (work.company && !work.company_ar) await translate(work.company, "en", (t) => updateWorkItem(i, "company_ar", t), `work_company_${i}`);
      if (work.department && !work.department_ar) await translate(work.department, "en", (t) => updateWorkItem(i, "department_ar", t), `work_dept_${i}`);
    }
  }, [data.work_experience, translate, updateWorkItem]);

  const handleTranslateAllCompetitions = useCallback(async () => {
    if (!data.competitions) return;
    for (let i = 0; i < data.competitions.length; i++) {
      const comp = data.competitions[i];
      if (comp.name && !comp.name_ar) await translate(comp.name, "en", (t) => updateData(d => ({ ...d, competitions: d.competitions?.map((c, ci) => ci === i ? { ...c, name_ar: t } : c) })), `comp_name_${i}`);
      if (comp.name_ar && !comp.name) await translate(comp.name_ar, "ar", (t) => updateData(d => ({ ...d, competitions: d.competitions?.map((c, ci) => ci === i ? { ...c, name: t } : c) })), `comp_name_en_${i}`);
      if (comp.achievement && !comp.achievement_ar) await translate(comp.achievement, "en", (t) => updateData(d => ({ ...d, competitions: d.competitions?.map((c, ci) => ci === i ? { ...c, achievement_ar: t } : c) })), `comp_ach_${i}`);
    }
  }, [data.competitions, translate, updateData]);

  const getPersonalDisplay = (key: string): string | undefined => {
    const raw = (pi as Record<string, unknown>)[key];
    if (!raw) return undefined;
    if (key === "nationality" || key === "country_code") return `${getFlag(String(raw))} ${raw}`;
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
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-primary" onClick={handleTranslateAllPersonal} disabled={translatingKey?.startsWith("personal_")}>
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
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
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
                              String((pi as Record<string, unknown>)[key] || ""),
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
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
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
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-chart-2" onClick={handleTranslateAllEducation} disabled={translatingKey?.startsWith("edu_")}>
              {translatingKey?.startsWith("edu_") ? <Loader2 className="h-3 w-3 animate-spin" /> : <Languages className="h-3 w-3" />}
              {isAr ? "ترجمة الكل" : "Translate All"}
            </Button>
          }
        >
          <Table>
            <TableHeader>
              <TableRow className="bg-chart-2/5 border-border/10">
                <TableHead className="text-xs py-1.5 h-auto">English</TableHead>
                <TableHead className="text-xs py-1.5 h-auto">العربية</TableHead>
                <TableHead className="text-xs py-1.5 h-auto">{isAr ? "الفترة" : "Period"}</TableHead>
                <TableHead className="text-xs py-1.5 h-auto">{isAr ? "الموقع" : "Location"}</TableHead>
                <TableHead className="text-xs py-1.5 h-auto w-14"></TableHead>
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
                      <span className="text-xs text-muted-foreground block">{edu.institution || ""}</span>
                      {edu.field_of_study && <span className="text-xs text-muted-foreground/70 block">{edu.field_of_study}</span>}
                      {edu.education_level && (
                        <Badge variant="outline" className="text-xs h-4 mt-0.5">
                          {EDUCATION_LEVEL_LABELS[edu.education_level]?.en || edu.education_level}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="py-2 px-3" dir="rtl">
                    <div className="space-y-0.5">
                      <span className="text-xs font-semibold">{edu.degree_ar || <span className="text-muted-foreground/40 italic text-xs">—</span>}</span>
                      <span className="text-xs text-muted-foreground block">{edu.institution_ar || ""}</span>
                      {edu.field_of_study_ar && <span className="text-xs text-muted-foreground/70 block">{edu.field_of_study_ar}</span>}
                      {edu.education_level && (
                        <Badge variant="outline" className="text-xs h-4 mt-0.5">
                          {EDUCATION_LEVEL_LABELS[edu.education_level]?.ar || edu.education_level}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="py-2 px-3">
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
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
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-chart-3" onClick={handleTranslateAllWork} disabled={translatingKey?.startsWith("work_")}>
              {translatingKey?.startsWith("work_") ? <Loader2 className="h-3 w-3 animate-spin" /> : <Languages className="h-3 w-3" />}
              {isAr ? "ترجمة الكل" : "Translate All"}
            </Button>
          }
        >
          <Table>
            <TableHeader>
              <TableRow className="bg-chart-3/5 border-border/10">
                <TableHead className="text-xs py-1.5 h-auto">English</TableHead>
                <TableHead className="text-xs py-1.5 h-auto">العربية</TableHead>
                <TableHead className="text-xs py-1.5 h-auto">{isAr ? "النوع" : "Type"}</TableHead>
                <TableHead className="text-xs py-1.5 h-auto">{isAr ? "الفترة" : "Period"}</TableHead>
                <TableHead className="text-xs py-1.5 h-auto">{isAr ? "الموقع" : "Location"}</TableHead>
                <TableHead className="text-xs py-1.5 h-auto w-14"></TableHead>
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
                        <span className="text-xs text-muted-foreground">{work.company || ""}</span>
                        {work.company && !work.company_ar && (
                          <TranslateBtn small loading={translatingKey === `work_company_${i}`}
                            onClick={() => translate(work.company, "en", (t) => updateWorkItem(i, "company_ar", t), `work_company_${i}`)} />
                        )}
                      </div>
                      {work.department && <span className="text-xs text-muted-foreground/70 block">{work.department}</span>}
                    </div>
                  </TableCell>
                  <TableCell className="py-2 px-3" dir="rtl">
                    <div className="space-y-0.5">
                      <span className="text-xs font-semibold">{work.title_ar || <span className="text-muted-foreground/40 italic text-xs">—</span>}</span>
                      <span className="text-xs text-muted-foreground block">{work.company_ar || ""}</span>
                      {work.department_ar && <span className="text-xs text-muted-foreground/70 block">{work.department_ar}</span>}
                    </div>
                  </TableCell>
                  <TableCell className="py-2 px-3">
                    {work.employment_type && (
                      <Badge variant="outline" className="text-xs h-4">
                        {isAr ? (EMPLOYMENT_TYPE_LABELS[work.employment_type]?.ar || work.employment_type) : (EMPLOYMENT_TYPE_LABELS[work.employment_type]?.en || work.employment_type)}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="py-2 px-3">
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
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
          {data.work_experience!.some(w => (w.tasks?.length || 0) > 0 || (w.achievements?.length || 0) > 0 || (w.tasks_ar?.length || 0) > 0 || (w.achievements_ar?.length || 0) > 0) && (
            <div className="border-t border-border/20 p-3 space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{isAr ? "التفاصيل والإنجازات" : "Details & Achievements"}</p>
              {data.work_experience!.map((work, i) => {
                const tasksToShow = isAr ? (work.tasks_ar || []) : (work.tasks || []);
                const achievementsToShow = isAr ? (work.achievements_ar || []) : (work.achievements || []);
                if (!(tasksToShow.length || achievementsToShow.length)) return null;
                return (
                  <details key={i} className={`rounded-xl ${rowBg(i)} border border-border/10`}>
                    <summary className="cursor-pointer p-2.5 text-xs font-semibold text-foreground select-none hover:bg-accent/20 rounded-xl transition-colors">
                      {isAr ? (work.title_ar || work.title) : work.title} — {isAr ? (work.company_ar || work.company) : work.company}
                    </summary>
                    <div className="px-2.5 pb-2.5">
                      {tasksToShow.length > 0 && (
                        <div className="mt-1.5 space-y-0.5">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{isAr ? "المهام الرئيسية" : "Key Responsibilities"}</p>
                          {tasksToShow.map((t, j) => (
                            <p key={j} className="text-xs text-foreground/80 ps-3 relative before:content-['•'] before:absolute before:start-0 before:text-primary">{t}</p>
                          ))}
                        </div>
                      )}
                      {achievementsToShow.length > 0 && (
                        <div className="mt-1.5 space-y-0.5">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{isAr ? "الإنجازات البارزة" : "Notable Achievements"}</p>
                          {achievementsToShow.map((a, j) => (
                            <p key={j} className="text-xs text-foreground/80 ps-3 relative before:content-['★'] before:absolute before:start-0 before:text-chart-4">{a}</p>
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
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-chart-4" onClick={handleTranslateAllCompetitions} disabled={translatingKey?.startsWith("comp_")}>
              {translatingKey?.startsWith("comp_") ? <Loader2 className="h-3 w-3 animate-spin" /> : <Languages className="h-3 w-3" />}
              {isAr ? "ترجمة الكل" : "Translate All"}
            </Button>
          }
        >
          <Table>
            <TableHeader>
              <TableRow className="bg-chart-4/5 border-border/10">
                <TableHead className="text-xs py-1.5 h-auto">English</TableHead>
                <TableHead className="text-xs py-1.5 h-auto">العربية</TableHead>
                <TableHead className="text-xs py-1.5 h-auto">{isAr ? "السنة" : "Year"}</TableHead>
                <TableHead className="text-xs py-1.5 h-auto">{isAr ? "الدور" : "Role"}</TableHead>
                <TableHead className="text-xs py-1.5 h-auto">{isAr ? "الموقع" : "Location"}</TableHead>
                <TableHead className="text-xs py-1.5 h-auto w-14"></TableHead>
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
                      {comp.achievement && <span className="text-xs text-muted-foreground block">🏆 {comp.achievement}</span>}
                    </div>
                  </TableCell>
                  <TableCell className="py-2 px-3" dir="rtl">
                    <div className="space-y-0.5">
                      <span className="text-xs font-semibold">{comp.name_ar || <span className="text-muted-foreground/40 italic text-xs">—</span>}</span>
                      {comp.achievement_ar && <span className="text-xs text-muted-foreground block">🏆 {comp.achievement_ar}</span>}
                    </div>
                  </TableCell>
                  <TableCell className="py-2 px-3">
                    <span className="text-xs">{comp.year || "—"}{comp.edition ? ` (${comp.edition})` : ""}</span>
                  </TableCell>
                  <TableCell className="py-2 px-3">
                    {comp.role && (
                      <Badge variant="secondary" className="text-xs h-4">
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
                <TableHead className="text-xs py-1.5 h-auto">English</TableHead>
                <TableHead className="text-xs py-1.5 h-auto">العربية</TableHead>
                <TableHead className="text-xs py-1.5 h-auto">{isAr ? "الجهة المانحة" : "Issuer"}</TableHead>
                <TableHead className="text-xs py-1.5 h-auto">{isAr ? "التاريخ" : "Date"}</TableHead>
                <TableHead className="text-xs py-1.5 h-auto w-14"></TableHead>
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
                    {cert.description && <span className="text-xs text-muted-foreground block mt-0.5">{cert.description}</span>}
                  </TableCell>
                  <TableCell className="py-2 px-3" dir="rtl">
                    <span className="text-xs font-medium">{cert.name_ar || <span className="text-muted-foreground/40 italic text-xs">—</span>}</span>
                  </TableCell>
                  <TableCell className="py-2 px-3"><span className="text-xs">{cert.issuer || "—"}</span></TableCell>
                  <TableCell className="py-2 px-3"><span className="text-xs text-muted-foreground">{formatDate(cert.date)}</span></TableCell>
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
                <TableHead className="text-xs py-1.5 h-auto">{isAr ? "النوع" : "Type"}</TableHead>
                <TableHead className="text-xs py-1.5 h-auto">Channel (EN)</TableHead>
                <TableHead className="text-xs py-1.5 h-auto" dir="rtl">القناة (AR)</TableHead>
                <TableHead className="text-xs py-1.5 h-auto">Program (EN)</TableHead>
                <TableHead className="text-xs py-1.5 h-auto" dir="rtl">البرنامج (AR)</TableHead>
                <TableHead className="text-xs py-1.5 h-auto">{isAr ? "التاريخ" : "Date"}</TableHead>
                <TableHead className="text-xs py-1.5 h-auto">{isAr ? "البلد" : "Country"}</TableHead>
                <TableHead className="text-xs py-1.5 h-auto w-8"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.media_appearances!.map((m, i) => (
                <TableRow key={i} className={`${rowBg(i)} border-border/10 group hover:bg-accent/30`}>
                  <TableCell className="py-2 px-3">
                    <span className="text-sm">{m.type ? (MEDIA_TYPE_LABELS[m.type]?.icon || "📺") : "📺"}</span>
                    {m.type && <span className="text-xs text-muted-foreground ms-1">{isAr ? (MEDIA_TYPE_LABELS[m.type]?.ar || m.type) : (MEDIA_TYPE_LABELS[m.type]?.en || m.type)}</span>}
                  </TableCell>
                  <TableCell className="py-2 px-3"><EditableText value={m.channel_name || ""} onChange={v => updateData(d => ({ ...d, media_appearances: d.media_appearances?.map((x, xi) => xi === i ? { ...x, channel_name: v } : x) }))} className="text-xs font-medium" /></TableCell>
                  <TableCell className="py-2 px-3" dir="rtl"><EditableText value={m.channel_name_ar || ""} onChange={v => updateData(d => ({ ...d, media_appearances: d.media_appearances?.map((x, xi) => xi === i ? { ...x, channel_name_ar: v } : x) }))} className="text-xs font-medium" /></TableCell>
                  <TableCell className="py-2 px-3">
                    <EditableText value={m.program_name || ""} onChange={v => updateData(d => ({ ...d, media_appearances: d.media_appearances?.map((x, xi) => xi === i ? { ...x, program_name: v } : x) }))} className="text-xs" />
                    {m.description && <span className="text-xs text-muted-foreground block mt-0.5">{m.description}</span>}
                  </TableCell>
                  <TableCell className="py-2 px-3" dir="rtl">
                    <EditableText value={m.program_name_ar || ""} onChange={v => updateData(d => ({ ...d, media_appearances: d.media_appearances?.map((x, xi) => xi === i ? { ...x, program_name_ar: v } : x) }))} className="text-xs" />
                    {m.description_ar && <span className="text-xs text-muted-foreground block mt-0.5" dir="rtl">{m.description_ar}</span>}
                  </TableCell>
                  <TableCell className="py-2 px-3"><span className="text-xs text-muted-foreground">{formatDate(m.date)}</span></TableCell>
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
          <CardContent className="p-4 space-y-4">
            {(data.skills?.length || 0) > 0 && (
              <div>
                <p className="text-xs font-semibold mb-2 flex items-center gap-1"><Globe2 className="h-3.5 w-3.5 text-primary" />{isAr ? "المهارات" : "Skills"}</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">English</p>
                    <div className="flex flex-wrap gap-1.5">
                      {data.skills!.map((s, i) => {
                        const name = typeof s === "string" ? s : s.name;
                        return <Badge key={i} variant="secondary" className="text-xs h-5">{name}</Badge>;
                      })}
                    </div>
                  </div>
                  <div dir="rtl">
                    <p className="text-xs text-muted-foreground mb-1">العربية</p>
                    <div className="flex flex-wrap gap-1.5">
                      {data.skills!.map((s, i) => {
                        const nameAr = typeof s === "string" ? "" : (s.name_ar || "");
                        return nameAr ? <Badge key={i} variant="secondary" className="text-xs h-5">{nameAr}</Badge> : null;
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
            {(data.languages?.length || 0) > 0 && (
              <div>
                <p className="text-xs font-semibold mb-2 flex items-center gap-1"><Languages className="h-3.5 w-3.5 text-primary" />{isAr ? "اللغات" : "Languages"}</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">English</p>
                    <div className="flex flex-wrap gap-1.5">
                      {data.languages!.map((l, i) => (
                        <Badge key={i} variant="outline" className="text-xs h-5">
                          {l.language}{l.level ? ` (${l.level})` : ""}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div dir="rtl">
                    <p className="text-xs text-muted-foreground mb-1">العربية</p>
                    <div className="flex flex-wrap gap-1.5">
                      {data.languages!.map((l, i) => (
                        <Badge key={i} variant="outline" className="text-xs h-5">
                          {l.language_ar || l.language}{l.level_ar ? ` (${l.level_ar})` : ""}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
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
          <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={() => exportCVAsCSV(data, targetUserId)}>
            <Download className="h-3 w-3" /> CSV
          </Button>
          <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={() => printCV(data)}>
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
});
