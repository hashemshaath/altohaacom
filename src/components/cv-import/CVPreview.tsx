import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowLeft, Save, Loader2, User, GraduationCap, Briefcase,
  Trophy, Award, Tv, Globe2, Languages, CheckCircle2, MapPin, Calendar,
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
}

const formatDate = (d?: string) => {
  if (!d) return "";
  try {
    const date = new Date(d);
    return date.toLocaleDateString("en-US", { year: "numeric", month: "short" });
  } catch { return d; }
};

const DateRange = ({ start, end, isCurrent, isAr }: { start?: string; end?: string; isCurrent?: boolean; isAr: boolean }) => (
  <span className="text-[11px] text-muted-foreground flex items-center gap-1">
    <Calendar className="h-3 w-3" />
    {formatDate(start)} — {isCurrent ? (isAr ? "الحالي" : "Present") : formatDate(end)}
  </span>
);

const LocationBadge = ({ location, countryCode }: { location?: string; countryCode?: string }) => {
  if (!location && !countryCode) return null;
  return (
    <span className="text-[11px] text-muted-foreground flex items-center gap-0.5">
      {countryCode && <span>{getFlag(countryCode)}</span>}
      <MapPin className="h-3 w-3" />
      {location}
    </span>
  );
};

export function CVPreview({ data, targetUserId, isAr, onBack, onSaved }: Props) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [sections, setSections] = useState({
    personal: true,
    education: true,
    work: true,
    competitions: true,
    certifications: true,
    media: true,
  });

  const toggle = (key: keyof typeof sections) =>
    setSections((p) => ({ ...p, [key]: !p[key] }));

  const pi = data.personal_info;
  const hasPersonal = pi && Object.values(pi).some(v => v);
  const hasEdu = (data.education?.length || 0) > 0;
  const hasWork = (data.work_experience?.length || 0) > 0;
  const hasComp = (data.competitions?.length || 0) > 0;
  const hasCert = (data.certifications?.length || 0) > 0;
  const hasMedia = (data.media_appearances?.length || 0) > 0;

  const handleSave = async () => {
    setSaving(true);
    try {
      // 1. Update profile personal info
      if (sections.personal && hasPersonal) {
        const profileUpdate: Record<string, any> = {};
        if (pi.full_name) profileUpdate.full_name = pi.full_name;
        if (pi.full_name_ar) profileUpdate.full_name_ar = pi.full_name_ar;
        if (pi.phone) profileUpdate.phone = pi.phone;
        if (pi.nationality) profileUpdate.nationality = pi.nationality;
        if (pi.second_nationality) profileUpdate.second_nationality = pi.second_nationality;
        if (pi.country_code) profileUpdate.country_code = pi.country_code;
        if (pi.city) profileUpdate.city = pi.city;
        if (pi.location) profileUpdate.location = pi.location;
        if (pi.job_title) profileUpdate.job_title = pi.job_title;
        if (pi.job_title_ar) profileUpdate.job_title_ar = pi.job_title_ar;
        if (pi.specialization) profileUpdate.specialization = pi.specialization;
        if (pi.specialization_ar) profileUpdate.specialization_ar = pi.specialization_ar;
        if (pi.bio) profileUpdate.bio = pi.bio;
        if (pi.bio_ar) profileUpdate.bio_ar = pi.bio_ar;
        if (pi.years_of_experience) profileUpdate.years_of_experience = pi.years_of_experience;
        if (pi.experience_level) profileUpdate.experience_level = pi.experience_level;
        if (pi.date_of_birth) profileUpdate.date_of_birth = pi.date_of_birth;
        if (pi.gender) profileUpdate.gender = pi.gender;
        if (pi.website) profileUpdate.website = pi.website;
        if (pi.linkedin) profileUpdate.linkedin = pi.linkedin;
        if (pi.instagram) profileUpdate.instagram = pi.instagram;
        if (pi.twitter) profileUpdate.twitter = pi.twitter;

        if (Object.keys(profileUpdate).length > 0) {
          const { error } = await supabase.from("profiles").update(profileUpdate).eq("user_id", targetUserId);
          if (error) console.error("Profile update error:", error);
        }
      }

      // 2. Insert education records
      if (sections.education && hasEdu) {
        const eduRecords = data.education!.map((edu: CVEducation) => ({
          user_id: targetUserId,
          record_type: "education",
          entity_name: edu.institution,
          title: edu.degree,
          title_ar: edu.degree_ar || null,
          education_level: edu.education_level || null,
          field_of_study: edu.field_of_study || null,
          field_of_study_ar: edu.field_of_study_ar || null,
          grade: edu.grade || null,
          start_date: edu.start_date || null,
          end_date: edu.end_date || null,
          is_current: edu.is_current || false,
          location: edu.location ? `${edu.country_code ? getFlag(edu.country_code) + " " : ""}${edu.location}` : null,
        }));
        const { error } = await supabase.from("user_career_records").insert(eduRecords);
        if (error) console.error("Education insert error:", error);
      }

      // 3. Insert work experience records
      if (sections.work && hasWork) {
        const workRecords = data.work_experience!.map((work: CVWorkExperience) => {
          const desc = [
            ...(work.tasks?.map(t => `• ${t}`) || []),
            ...(work.achievements?.length ? [`\n${isAr ? "الإنجازات:" : "Achievements:"}`, ...work.achievements.map(a => `★ ${a}`)] : []),
          ].join("\n");

          return {
            user_id: targetUserId,
            record_type: "work",
            entity_name: work.company,
            title: work.title,
            title_ar: work.title_ar || null,
            employment_type: work.employment_type || null,
            department: work.department || null,
            department_ar: work.department_ar || null,
            start_date: work.start_date || null,
            end_date: work.end_date || null,
            is_current: work.is_current || false,
            description: desc || null,
            location: work.location ? `${work.country_code ? getFlag(work.country_code) + " " : ""}${work.location}` : null,
          };
        });
        const { error } = await supabase.from("user_career_records").insert(workRecords);
        if (error) console.error("Work insert error:", error);
      }

      // 4. Insert competitions as career records (type: work with competition context)
      if (sections.competitions && hasComp) {
        const compRecords = data.competitions!.map((comp: CVCompetition) => ({
          user_id: targetUserId,
          record_type: "work",
          entity_name: comp.name,
          title: `${comp.name} ${comp.edition ? `(${comp.edition})` : ""}`.trim(),
          title_ar: comp.name_ar || null,
          description: [
            comp.role ? `${isAr ? "الدور:" : "Role:"} ${isAr ? (ROLE_LABELS[comp.role]?.ar || comp.role) : (ROLE_LABELS[comp.role]?.en || comp.role)}` : "",
            comp.achievement ? `${isAr ? "الإنجاز:" : "Achievement:"} ${isAr ? (comp.achievement_ar || comp.achievement) : comp.achievement}` : "",
          ].filter(Boolean).join("\n") || null,
          start_date: comp.year ? `${comp.year}-01-01` : null,
          end_date: comp.year ? `${comp.year}-12-31` : null,
          is_current: false,
          location: comp.city ? `${comp.country_code ? getFlag(comp.country_code) + " " : ""}${comp.city}` : null,
        }));
        const { error } = await supabase.from("user_career_records").insert(compRecords);
        if (error) console.error("Competitions insert error:", error);
      }

      // 5. Insert media appearances as career records
      if (sections.media && hasMedia) {
        const mediaRecords = data.media_appearances!.map((m: CVMediaAppearance) => ({
          user_id: targetUserId,
          record_type: "work",
          entity_name: m.channel_name,
          title: m.program_name || m.channel_name,
          description: [
            m.type ? `${MEDIA_TYPE_LABELS[m.type]?.icon || "📺"} ${isAr ? (MEDIA_TYPE_LABELS[m.type]?.ar || m.type) : (MEDIA_TYPE_LABELS[m.type]?.en || m.type)}` : "",
            m.description || "",
          ].filter(Boolean).join("\n") || null,
          start_date: m.date || null,
          is_current: false,
          location: m.country_code ? `${getFlag(m.country_code)}` : null,
        }));
        const { error } = await supabase.from("user_career_records").insert(mediaRecords);
        if (error) console.error("Media insert error:", error);
      }

      toast({ title: isAr ? "✅ تم استيراد السيرة الذاتية بنجاح" : "✅ CV imported successfully" });
      onSaved();
    } catch (err: any) {
      toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: err.message });
    }
    setSaving(false);
  };

  const sectionHeader = (
    icon: React.ReactNode,
    titleEn: string,
    titleAr: string,
    count: number,
    key: keyof typeof sections,
    colorClass: string
  ) => (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${colorClass}`}>
          {icon}
        </div>
        <span className="text-sm font-semibold">{isAr ? titleAr : titleEn}</span>
        <Badge variant="secondary" className="text-[10px] h-5">{count}</Badge>
      </div>
      <Checkbox checked={sections[key]} onCheckedChange={() => toggle(key)} />
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1">
          <ArrowLeft className="h-4 w-4" />
          {isAr ? "رجوع" : "Back"}
        </Button>
        <Badge variant="outline" className="text-xs gap-1">
          <CheckCircle2 className="h-3 w-3 text-chart-2" />
          {isAr ? "تم التحليل" : "Parsed"}
        </Badge>
      </div>

      {/* Personal Info */}
      {hasPersonal && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-2">
            {sectionHeader(<User className="h-4 w-4" />, "Personal Info", "المعلومات الشخصية", 1, "personal", "bg-primary/10 text-primary")}
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
              {[
                [isAr ? "الاسم" : "Name", pi.full_name],
                [isAr ? "الاسم بالعربية" : "Name (AR)", pi.full_name_ar],
                [isAr ? "المسمى الوظيفي" : "Job Title", pi.job_title],
                [isAr ? "المسمى (عربي)" : "Job Title (AR)", pi.job_title_ar],
                [isAr ? "الهاتف" : "Phone", pi.phone],
                [isAr ? "البريد" : "Email", pi.email],
                [isAr ? "الجنسية" : "Nationality", pi.nationality ? `${getFlag(pi.nationality)} ${pi.nationality}` : ""],
                [isAr ? "المدينة" : "City", pi.city],
                [isAr ? "الدولة" : "Country", pi.country_code ? `${getFlag(pi.country_code)} ${pi.country_code}` : ""],
                [isAr ? "العنوان الوطني" : "National Address", pi.national_address],
                [isAr ? "سنوات الخبرة" : "Years of Exp.", pi.years_of_experience?.toString()],
                [isAr ? "التخصص" : "Specialization", pi.specialization],
              ].filter(([, v]) => v).map(([label, value], i) => (
                <div key={i} className="text-xs">
                  <span className="text-muted-foreground">{label}: </span>
                  <span className="font-medium">{value}</span>
                </div>
              ))}
            </div>
            {pi.bio && (
              <p className="text-xs text-muted-foreground mt-2 italic border-t pt-2 border-border/20">
                {pi.bio}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Education */}
      {hasEdu && (
        <Card>
          <CardHeader className="pb-2">
            {sectionHeader(<GraduationCap className="h-4 w-4" />, "Education", "التعليم", data.education!.length, "education", "bg-chart-2/10 text-chart-2")}
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            {data.education!.map((edu, i) => (
              <div key={i} className="flex gap-3 p-2.5 rounded-lg bg-muted/30 border border-border/20">
                <div className="w-1 rounded-full bg-chart-2/40 shrink-0" />
                <div className="flex-1 min-w-0 space-y-0.5">
                  <p className="text-sm font-semibold leading-tight">{edu.degree}</p>
                  <p className="text-xs text-muted-foreground">{edu.institution}</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    <DateRange start={edu.start_date} end={edu.end_date} isCurrent={edu.is_current} isAr={isAr} />
                    <LocationBadge location={edu.location} countryCode={edu.country_code} />
                    {edu.education_level && (
                      <Badge variant="outline" className="text-[10px] h-5">
                        {isAr ? (EDUCATION_LEVEL_LABELS[edu.education_level]?.ar || edu.education_level) : (EDUCATION_LEVEL_LABELS[edu.education_level]?.en || edu.education_level)}
                      </Badge>
                    )}
                    {edu.field_of_study && <Badge variant="secondary" className="text-[10px] h-5">{edu.field_of_study}</Badge>}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Work Experience */}
      {hasWork && (
        <Card>
          <CardHeader className="pb-2">
            {sectionHeader(<Briefcase className="h-4 w-4" />, "Experience", "الخبرات المهنية", data.work_experience!.length, "work", "bg-chart-3/10 text-chart-3")}
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            {data.work_experience!.map((work, i) => (
              <div key={i} className="flex gap-3 p-2.5 rounded-lg bg-muted/30 border border-border/20">
                <div className="w-1 rounded-full bg-chart-3/40 shrink-0" />
                <div className="flex-1 min-w-0 space-y-1">
                  <p className="text-sm font-semibold leading-tight">{work.title}</p>
                  <p className="text-xs text-muted-foreground font-medium">{work.company}</p>
                  <div className="flex flex-wrap gap-2">
                    <DateRange start={work.start_date} end={work.end_date} isCurrent={work.is_current} isAr={isAr} />
                    <LocationBadge location={work.location} countryCode={work.country_code} />
                    {work.employment_type && (
                      <Badge variant="outline" className="text-[10px] h-5">
                        {isAr ? (EMPLOYMENT_TYPE_LABELS[work.employment_type]?.ar || work.employment_type) : (EMPLOYMENT_TYPE_LABELS[work.employment_type]?.en || work.employment_type)}
                      </Badge>
                    )}
                  </div>
                  {work.tasks && work.tasks.length > 0 && (
                    <div className="mt-1.5 space-y-0.5">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{isAr ? "المهام" : "Tasks"}</p>
                      {work.tasks.map((t, j) => (
                        <p key={j} className="text-[11px] text-foreground/80 ps-3 relative before:content-['•'] before:absolute before:start-0 before:text-primary">{t}</p>
                      ))}
                    </div>
                  )}
                  {work.achievements && work.achievements.length > 0 && (
                    <div className="mt-1.5 space-y-0.5">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{isAr ? "الإنجازات" : "Achievements"}</p>
                      {work.achievements.map((a, j) => (
                        <p key={j} className="text-[11px] text-foreground/80 ps-3 relative before:content-['★'] before:absolute before:start-0 before:text-chart-4">{a}</p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Competitions */}
      {hasComp && (
        <Card>
          <CardHeader className="pb-2">
            {sectionHeader(<Trophy className="h-4 w-4" />, "Competitions", "المسابقات", data.competitions!.length, "competitions", "bg-chart-4/10 text-chart-4")}
          </CardHeader>
          <CardContent className="pt-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border/30">
                    <th className="text-start py-1.5 font-medium text-muted-foreground">{isAr ? "المسابقة" : "Competition"}</th>
                    <th className="text-start py-1.5 font-medium text-muted-foreground">{isAr ? "الدور" : "Role"}</th>
                    <th className="text-start py-1.5 font-medium text-muted-foreground">{isAr ? "النسخة" : "Edition"}</th>
                    <th className="text-start py-1.5 font-medium text-muted-foreground">{isAr ? "الموقع" : "Location"}</th>
                    <th className="text-start py-1.5 font-medium text-muted-foreground">{isAr ? "الإنجاز" : "Achievement"}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.competitions!.map((comp, i) => (
                    <tr key={i} className="border-b border-border/10 hover:bg-muted/20">
                      <td className="py-2 font-medium">
                        {isAr ? (comp.name_ar || comp.name) : comp.name}
                      </td>
                      <td className="py-2">
                        {comp.role && (
                          <Badge variant="secondary" className="text-[10px] h-5">
                            {isAr ? (ROLE_LABELS[comp.role]?.ar || comp.role) : (ROLE_LABELS[comp.role]?.en || comp.role)}
                          </Badge>
                        )}
                      </td>
                      <td className="py-2">{comp.edition || comp.year}</td>
                      <td className="py-2">
                        {comp.country_code && <span>{getFlag(comp.country_code)} </span>}
                        {comp.city}
                      </td>
                      <td className="py-2">{isAr ? (comp.achievement_ar || comp.achievement) : comp.achievement}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Media Appearances */}
      {hasMedia && (
        <Card>
          <CardHeader className="pb-2">
            {sectionHeader(<Tv className="h-4 w-4" />, "Media Appearances", "الظهور الإعلامي", data.media_appearances!.length, "media", "bg-chart-1/10 text-chart-1")}
          </CardHeader>
          <CardContent className="pt-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border/30">
                    <th className="text-start py-1.5 font-medium text-muted-foreground">{isAr ? "النوع" : "Type"}</th>
                    <th className="text-start py-1.5 font-medium text-muted-foreground">{isAr ? "القناة" : "Channel"}</th>
                    <th className="text-start py-1.5 font-medium text-muted-foreground">{isAr ? "البرنامج" : "Program"}</th>
                    <th className="text-start py-1.5 font-medium text-muted-foreground">{isAr ? "التاريخ" : "Date"}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.media_appearances!.map((m, i) => (
                    <tr key={i} className="border-b border-border/10 hover:bg-muted/20">
                      <td className="py-2">
                        {m.type && (
                          <span>{MEDIA_TYPE_LABELS[m.type]?.icon || "📺"} {isAr ? (MEDIA_TYPE_LABELS[m.type]?.ar || m.type) : (MEDIA_TYPE_LABELS[m.type]?.en || m.type)}</span>
                        )}
                      </td>
                      <td className="py-2 font-medium">
                        {m.country_code && <span>{getFlag(m.country_code)} </span>}
                        {m.channel_name}
                      </td>
                      <td className="py-2">{m.program_name}</td>
                      <td className="py-2">{formatDate(m.date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Skills & Languages */}
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
        <Button variant="outline" onClick={onBack} disabled={saving}>
          {isAr ? "رجوع" : "Back"}
        </Button>
        <Button onClick={handleSave} disabled={saving} className="gap-1.5">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? (isAr ? "جاري الحفظ..." : "Saving...") : (isAr ? "حفظ في الملف الشخصي" : "Save to Profile")}
        </Button>
      </div>
    </div>
  );
}
