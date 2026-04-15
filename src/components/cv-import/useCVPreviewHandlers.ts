import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";
import { downloadCSV } from "@/lib/exportUtils";
import type { CVData } from "./types";
import { getFlag, ROLE_LABELS } from "./types";
import { normalizeDate } from "./CVPreviewHelpers";
import { handleSupabaseError } from "@/lib/supabaseErrorHandler";

// ─── Smart Translate Hook ───
export function useSmartTranslate() {
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
      if (error) throw handleSupabaseError(error);
      if (data?.translated) {
        onResult(data.translated);
        toast({ title: fromLang === "ar" ? "Translated ✓" : "✓ تمت الترجمة" });
      }
    } catch (err: unknown) {
      toast({ title: "Translation Error", description: err instanceof Error ? err.message : String(err), variant: "destructive" });
    } finally {
      setTranslatingKey(null);
    }
  }, [toast]);

  return { translate, translatingKey };
}

// ─── Normalize experience level ───
const normalizeExperienceLevel = (level?: string, years?: number | null): "beginner" | "amateur" | "professional" | null => {
  const normalized = (level || "").toLowerCase().trim();
  if (normalized === "beginner" || normalized === "amateur" || normalized === "professional") return normalized;
  if (normalized === "expert" || normalized === "advanced") return "professional";
  if (normalized === "intermediate") return "amateur";
  if (typeof years === "number") {
    if (years < 3) return "beginner";
    if (years < 10) return "amateur";
    return "professional";
  }
  return null;
};

// ─── Save handler ───
export async function handleCVSave(
  data: CVData,
  sections: Record<string, boolean>,
  targetUserId: string,
  toast: ReturnType<typeof useToast>["toast"],
  isAr: boolean,
  onSaved: () => void,
) {
  const pi = data.personal_info;
  const hasPersonal = pi && Object.values(pi).some(v => v);
  const hasEdu = (data.education?.length || 0) > 0;
  const hasWork = (data.work_experience?.length || 0) > 0;
  const hasComp = (data.competitions?.length || 0) > 0;
  const hasCert = (data.certifications?.length || 0) > 0;
  const hasMedia = (data.media_appearances?.length || 0) > 0;

  let recordsCreated = 0;
  const sectionsImported: string[] = [];

  try {
    if (sections.personal && hasPersonal) {
      const profileUpdate: Record<string, unknown> = {};
      const keys = ["full_name","full_name_ar","phone","nationality","second_nationality","country_code","city","location","job_title","job_title_ar","specialization","specialization_ar","bio","bio_ar","years_of_experience","date_of_birth","gender","website","linkedin","instagram","twitter"];
      keys.forEach((k) => {
        const val = (pi as Record<string, unknown>)[k];
        if (val !== undefined && val !== null && `${val}`.trim() !== "") profileUpdate[k] = val;
      });
      const normalizedExpLevel = normalizeExperienceLevel((pi as Record<string, unknown>)?.experience_level as string | undefined, (pi as Record<string, unknown>)?.years_of_experience as number | undefined);
      if (normalizedExpLevel) profileUpdate.experience_level = normalizedExpLevel;

      if (Object.keys(profileUpdate).length > 0) {
        const { error } = await supabase.from("profiles").update(profileUpdate).eq("user_id", targetUserId);
        if (error) throw handleSupabaseError(error);
        recordsCreated++;
        sectionsImported.push("personal");
      }

      const { data: existingPage, error: pageLookupError } = await supabase
        .from("social_link_pages").select("id").eq("user_id", targetUserId).maybeSingle();
      if (pageLookupError) throw pageLookupError;

      const bioPageUpdate: Record<string, unknown> = {};
      if (pi.full_name) bioPageUpdate.page_title = pi.full_name;
      if (pi.full_name_ar) bioPageUpdate.page_title_ar = pi.full_name_ar;
      if (pi.bio) bioPageUpdate.bio = pi.bio;
      if (pi.bio_ar) bioPageUpdate.bio_ar = pi.bio_ar;

      if (Object.keys(bioPageUpdate).length > 0) {
        if (existingPage) {
          const { error: pageUpdateError } = await supabase
            .from("social_link_pages").update({ ...bioPageUpdate, updated_at: new Date().toISOString() }).eq("id", existingPage.id);
          if (pageUpdateError) throw pageUpdateError;
        } else {
          const { error: pageInsertError } = await supabase.from("social_link_pages").insert({
            user_id: targetUserId, ...bioPageUpdate, is_published: true, show_avatar: true, show_social_icons: true, theme: "default",
          });
          if (pageInsertError) throw pageInsertError;
        }
      }
    }

    const sectionsToDelete: string[] = [];
    if (sections.education && hasEdu) sectionsToDelete.push("education");
    if (sections.work && hasWork) sectionsToDelete.push("work");
    if (sections.competitions && hasComp) sectionsToDelete.push("competitions");
    if (sections.media && hasMedia) sectionsToDelete.push("media");
    if (sections.certifications && hasCert) sectionsToDelete.push("certification");

    const uniqueTypes = [...new Set(sectionsToDelete)];
    if (uniqueTypes.length > 0) {
      const { error: deleteError } = await supabase.from("user_career_records").delete().eq("user_id", targetUserId).in("record_type", uniqueTypes);
      if (deleteError) throw deleteError;
    }

    if (sections.education && hasEdu) {
      const eduRecords = data.education!.map((edu) => ({
        user_id: targetUserId, record_type: "education",
        entity_name: edu.institution, entity_name_ar: edu.institution_ar || null,
        title: edu.degree, title_ar: edu.degree_ar || null,
        education_level: edu.education_level || null,
        field_of_study: edu.field_of_study || null, field_of_study_ar: edu.field_of_study_ar || null,
        grade: edu.grade || null,
        start_date: normalizeDate(edu.start_date), end_date: normalizeDate(edu.end_date),
        is_current: edu.is_current === true && !edu.end_date, location: edu.location || null,
      }));
      const { error } = await supabase.from("user_career_records").insert(eduRecords);
      if (error) throw handleSupabaseError(error);
      recordsCreated += eduRecords.length;
      sectionsImported.push("education");
    }

    if (sections.work && hasWork) {
      const workRecords = data.work_experience!.map((work) => {
        const enParts = [...(work.tasks?.map(t => t.trim()).filter(Boolean) || []), ...(work.achievements?.map(a => a.trim()).filter(Boolean) || [])];
        const arParts = [...(work.tasks_ar?.map(t => t.trim()).filter(Boolean) || []), ...(work.achievements_ar?.map(a => a.trim()).filter(Boolean) || [])];
        return {
          user_id: targetUserId, record_type: "work",
          entity_name: work.company, entity_name_ar: work.company_ar || null,
          title: work.title, title_ar: work.title_ar || null,
          employment_type: work.employment_type || null,
          department: work.department || null, department_ar: work.department_ar || null,
          start_date: normalizeDate(work.start_date), end_date: normalizeDate(work.end_date),
          is_current: work.is_current === true && !work.end_date,
          description: enParts.length ? enParts.join("\n") : null,
          description_ar: arParts.length ? arParts.join("\n") : null,
          location: work.location || null,
        };
      });
      const { error } = await supabase.from("user_career_records").insert(workRecords);
      if (error) throw handleSupabaseError(error);
      recordsCreated += workRecords.length;
      sectionsImported.push("work");
    }

    if (sections.competitions && hasComp) {
      const compRecords = data.competitions!.map((comp) => ({
        user_id: targetUserId, record_type: "competitions",
        entity_name: comp.name, entity_name_ar: comp.name_ar || null,
        title: `${comp.name}${comp.year ? ` ${comp.year}` : ""}${comp.edition ? ` (${comp.edition})` : ""}`.trim(),
        title_ar: comp.name_ar ? `${comp.name_ar}${comp.year ? ` ${comp.year}` : ""}${comp.edition ? ` (${comp.edition})` : ""}`.trim() : null,
        employment_type: comp.role || null,
        description: comp.achievement || null, description_ar: comp.achievement_ar || null,
        start_date: comp.year ? `${comp.year}-01-01` : null, end_date: comp.year ? `${comp.year}-12-31` : null,
        is_current: false, location: comp.city || null, country_code: comp.country_code || null,
      }));
      const { error } = await supabase.from("user_career_records").insert(compRecords);
      if (error) throw handleSupabaseError(error);
      recordsCreated += compRecords.length;
      sectionsImported.push("competitions");
    }

    if (sections.media && hasMedia) {
      const mediaRecords = data.media_appearances!.map((m) => ({
        user_id: targetUserId, record_type: "media",
        entity_name: m.channel_name, entity_name_ar: m.channel_name_ar || null,
        title: m.program_name || m.channel_name, title_ar: m.program_name_ar || null,
        department: null, description: m.description || null, description_ar: m.description_ar || null,
        start_date: normalizeDate(m.date), is_current: false, country_code: m.country_code || null,
      }));
      const { error } = await supabase.from("user_career_records").insert(mediaRecords);
      if (error) throw handleSupabaseError(error);
      recordsCreated += mediaRecords.length;
      sectionsImported.push("media");
    }

    if (sections.certifications && hasCert) {
      const certRecords = data.certifications!.map((cert) => ({
        user_id: targetUserId, record_type: "certification",
        entity_name: cert.issuer || "—", entity_name_ar: null,
        title: cert.name, title_ar: cert.name_ar || null,
        description: cert.description || null,
        start_date: normalizeDate(cert.date), is_current: false,
      }));
      const { error } = await supabase.from("user_career_records").insert(certRecords);
      if (error) throw handleSupabaseError(error);
      recordsCreated += certRecords.length;
      sectionsImported.push("certifications");
    }

    if (data.skills?.length) {
      const skillObjects = data.skills.map((s) => typeof s === "string" ? { name: s, name_ar: "" } : s);
      const skillsEn = skillObjects.map((s) => s.name).filter(Boolean).join(", ");
      const skillsAr = skillObjects.map((s) => s.name_ar).filter(Boolean).join("، ");
      const { error: skillsError } = await supabase.from("profiles").update({
        specialization: data.personal_info?.specialization || skillsEn || null,
        specialization_ar: data.personal_info?.specialization_ar || skillsAr || null,
      }).eq("user_id", targetUserId);
      if (skillsError) throw skillsError;
    }

    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) {
        await supabase.from("cv_imports").insert({
          chef_id: targetUserId, imported_by: currentUser.id, status: "completed",
          sections_imported: sectionsImported, extracted_data: data as unknown as Json,
          records_created: recordsCreated, input_method: "paste",
        });
      }
    } catch (logErr: unknown) {
      console.error("Failed to log import:", logErr);
    }

    toast({ title: isAr ? `✅ تم استيراد ${recordsCreated} سجل وتحديث صفحة Bio تلقائياً` : `✅ Imported ${recordsCreated} records & Bio page auto-updated` });
    onSaved();
  } catch (err: unknown) {
    toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: err instanceof Error ? err.message : String(err) });
  }
}

// ─── Print CV ───
export function printCV(data: CVData) {
  const win = window.open("", "_blank", "noopener,noreferrer");
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

  const skillsHtml = data.skills?.length ? `<h2>Skills / المهارات</h2>
    <table><tr><th>English</th><th>العربية</th></tr>
    ${data.skills.map(s => {
      const en = typeof s === "string" ? s : s.name;
      const ar = typeof s === "string" ? "" : (s.name_ar || "");
      return `<tr><td>${en}</td><td dir="rtl">${ar}</td></tr>`;
    }).join("")}
    </table>` : "";

  const langsHtml = data.languages?.length ? `<h2>Languages / اللغات</h2>
    <table><tr><th>Language</th><th>اللغة</th><th>Level</th><th>المستوى</th></tr>
    ${data.languages.map(l => `<tr><td>${l.language}</td><td dir="rtl">${l.language_ar || ""}</td><td>${l.level || ""}</td><td dir="rtl">${l.level_ar || ""}</td></tr>`).join("")}
    </table>` : "";

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
}

// ─── Export helpers ───
export function exportCVAsCSV(data: CVData, targetUserId: string) {
  const rows: Record<string, unknown>[] = [];
  if (data.personal_info) rows.push({ section: "Personal", ...data.personal_info });
  data.education?.forEach(e => rows.push({ section: "Education", ...e }));
  data.work_experience?.forEach(w => rows.push({ section: "Work", ...w, tasks: w.tasks?.join("; "), achievements: w.achievements?.join("; ") }));
  data.competitions?.forEach(c => rows.push({ section: "Competition", ...c }));
  data.certifications?.forEach(c => rows.push({ section: "Certification", ...c }));
  data.media_appearances?.forEach(m => rows.push({ section: "Media", ...m }));
  downloadCSV(rows, `cv-data-${targetUserId.slice(0, 8)}`);
}
