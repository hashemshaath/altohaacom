import {
  GraduationCap, Briefcase, Trophy, Medal, Award, Users, Building2, FileText, MapPin,
  Scale, Tv, CalendarCheck,
} from "lucide-react";
import { toEnglishDigits } from "@/lib/formatNumber";

// ── Types ──────────────────────────────────────
export interface SectionConfig {
  key: string;
  icon: string;
  en: string;
  ar: string;
  color: string;
  isCustom: boolean;
}

export interface CareerRecord {
  id: string; user_id: string; record_type: string; entity_id: string | null; entity_name: string | null;
  title: string; title_ar: string | null; education_level: string | null; field_of_study: string | null;
  field_of_study_ar: string | null; grade: string | null; department: string | null; department_ar: string | null;
  employment_type: string | null; start_date: string | null; end_date: string | null; is_current: boolean;
  description: string | null; description_ar: string | null; location: string | null; sort_order: number; created_at: string;
  entity_name_ar?: string | null;
  country_code?: string | null;
}

// ── Lookup Tables ──────────────────────────────────────

export const EDUCATION_LEVELS = [
  { value: "high_school", en: "High School", ar: "ثانوية عامة" },
  { value: "diploma", en: "Diploma", ar: "دبلوم" },
  { value: "bachelors", en: "Bachelor's", ar: "بكالوريوس" },
  { value: "masters", en: "Master's", ar: "ماجستير" },
  { value: "doctorate", en: "PhD", ar: "دكتوراه" },
  { value: "culinary_certificate", en: "Culinary Certificate", ar: "شهادة طهي" },
  { value: "professional_diploma", en: "Professional Diploma", ar: "دبلوم مهني" },
  { value: "other", en: "Other", ar: "أخرى" },
];

export const EMPLOYMENT_TYPES = [
  { value: "full_time", en: "Full-time", ar: "دوام كامل" },
  { value: "part_time", en: "Part-time", ar: "دوام جزئي" },
  { value: "contract", en: "Contract", ar: "عقد" },
  { value: "internship", en: "Internship", ar: "تدريب" },
  { value: "freelance", en: "Freelance", ar: "عمل حر" },
  { value: "volunteer", en: "Volunteer", ar: "تطوعي" },
];

export const MEMBERSHIP_TYPES = [
  { value: "member", en: "Member", ar: "عضو" },
  { value: "associate", en: "Associate", ar: "منتسب" },
  { value: "honorary", en: "Honorary", ar: "شرفي" },
  { value: "student", en: "Student", ar: "طالب" },
  { value: "professional", en: "Professional", ar: "محترف" },
];

export const CERTIFICATE_TYPES = [
  { value: "participation", en: "Participation", ar: "مشاركة", emoji: "📋" },
  { value: "achievement", en: "Achievement", ar: "إنجاز", emoji: "⭐" },
  { value: "winner", en: "Winner", ar: "فائز", emoji: "🏆" },
  { value: "judge", en: "Judging", ar: "تحكيم", emoji: "⚖️" },
];

export const COMPETITION_ROLES = [
  { value: "participant", en: "Participant", ar: "مشارك" },
  { value: "organizer", en: "Organizer", ar: "منظّم" },
  { value: "judge", en: "Judge", ar: "حَكَم" },
  { value: "volunteer", en: "Volunteer", ar: "متطوع" },
  { value: "sponsor", en: "Sponsor", ar: "راعي" },
  { value: "coordinator", en: "Coordinator", ar: "منسّق" },
  { value: "speaker", en: "Speaker", ar: "متحدث" },
];

export const JUDGING_POSITIONS = [
  { value: "head_judge", en: "Head Judge", ar: "رئيس لجنة التحكيم" },
  { value: "judge", en: "Judge", ar: "حَكَم" },
  { value: "assistant_judge", en: "Assistant Judge", ar: "مساعد حكم" },
  { value: "technical_judge", en: "Technical Judge", ar: "حكم تقني" },
];

export const MEDAL_TYPES = [
  { value: "gold", en: "Gold Medal", ar: "ميدالية ذهبية", emoji: "🥇" },
  { value: "silver", en: "Silver Medal", ar: "ميدالية فضية", emoji: "🥈" },
  { value: "bronze", en: "Bronze Medal", ar: "ميدالية برونزية", emoji: "🥉" },
  { value: "diploma", en: "Diploma", ar: "دبلوم", emoji: "📜" },
  { value: "best_in_show", en: "Best in Show", ar: "الأفضل", emoji: "🏆" },
  { value: "other", en: "Other", ar: "أخرى", emoji: "" },
];

export const COUNTRIES = [
  { code: "SA", en: "Saudi Arabia", ar: "السعودية", flag: "🇸🇦" },
  { code: "AE", en: "UAE", ar: "الإمارات", flag: "🇦🇪" },
  { code: "KW", en: "Kuwait", ar: "الكويت", flag: "🇰🇼" },
  { code: "BH", en: "Bahrain", ar: "البحرين", flag: "🇧🇭" },
  { code: "QA", en: "Qatar", ar: "قطر", flag: "🇶🇦" },
  { code: "OM", en: "Oman", ar: "عُمان", flag: "🇴🇲" },
  { code: "EG", en: "Egypt", ar: "مصر", flag: "🇪🇬" },
  { code: "JO", en: "Jordan", ar: "الأردن", flag: "🇯🇴" },
  { code: "LB", en: "Lebanon", ar: "لبنان", flag: "🇱🇧" },
  { code: "IQ", en: "Iraq", ar: "العراق", flag: "🇮🇶" },
  { code: "MA", en: "Morocco", ar: "المغرب", flag: "🇲🇦" },
  { code: "TN", en: "Tunisia", ar: "تونس", flag: "🇹🇳" },
  { code: "TR", en: "Turkey", ar: "تركيا", flag: "🇹🇷" },
  { code: "GB", en: "United Kingdom", ar: "بريطانيا", flag: "🇬🇧" },
  { code: "US", en: "United States", ar: "أمريكا", flag: "🇺🇸" },
  { code: "FR", en: "France", ar: "فرنسا", flag: "🇫🇷" },
  { code: "DE", en: "Germany", ar: "ألمانيا", flag: "🇩🇪" },
  { code: "IT", en: "Italy", ar: "إيطاليا", flag: "🇮🇹" },
  { code: "ES", en: "Spain", ar: "إسبانيا", flag: "🇪🇸" },
  { code: "AU", en: "Australia", ar: "أستراليا", flag: "🇦🇺" },
  { code: "CA", en: "Canada", ar: "كندا", flag: "🇨🇦" },
  { code: "JP", en: "Japan", ar: "اليابان", flag: "🇯🇵" },
  { code: "IN", en: "India", ar: "الهند", flag: "🇮🇳" },
  { code: "SG", en: "Singapore", ar: "سنغافورة", flag: "🇸🇬" },
  { code: "MY", en: "Malaysia", ar: "ماليزيا", flag: "🇲🇾" },
];

// ── Section Defaults ──────────────────────────────────────

export const DEFAULT_SECTIONS: SectionConfig[] = [
  { key: "work", icon: "Briefcase", en: "Experience", ar: "الخبرة المهنية", color: "bg-chart-3/10 text-chart-3", isCustom: false },
  { key: "education", icon: "GraduationCap", en: "Education", ar: "التعليم", color: "bg-chart-2/10 text-chart-2", isCustom: false },
  { key: "judging", icon: "Scale", en: "Judging Competitions", ar: "تحكيم المسابقات", color: "bg-amber-500/10 text-amber-600", isCustom: false },
  { key: "memberships", icon: "Users", en: "Memberships", ar: "العضويات", color: "bg-primary/10 text-primary", isCustom: false },
  { key: "competitions", icon: "Trophy", en: "Competitions Participated", ar: "المسابقات المشارك فيها", color: "bg-chart-4/10 text-chart-4", isCustom: false },
  { key: "awards", icon: "Medal", en: "Awards & Medals", ar: "الجوائز والميداليات", color: "bg-chart-1/10 text-chart-1", isCustom: false },
  { key: "media", icon: "Tv", en: "Television Interviews", ar: "المقابلات التلفزيونية", color: "bg-blue-500/10 text-blue-600", isCustom: false },
  { key: "organizing", icon: "CalendarCheck", en: "Organizing Events", ar: "تنظيم الفعاليات والمسابقات", color: "bg-green-500/10 text-green-600", isCustom: false },
];

export const ICON_MAP: Record<string, any> = {
  GraduationCap, Briefcase, Users, Trophy, Medal, Award, Building2, FileText, MapPin, Scale, Tv, CalendarCheck,
};

export const AVAILABLE_ICONS = [
  { key: "GraduationCap", label: "Education", icon: GraduationCap },
  { key: "Briefcase", label: "Work", icon: Briefcase },
  { key: "Users", label: "Group", icon: Users },
  { key: "Trophy", label: "Trophy", icon: Trophy },
  { key: "Medal", label: "Medal", icon: Medal },
  { key: "Award", label: "Award", icon: Award },
  { key: "Building2", label: "Building", icon: Building2 },
  { key: "FileText", label: "Document", icon: FileText },
  { key: "MapPin", label: "Location", icon: MapPin },
  { key: "Scale", label: "Judging", icon: Scale },
  { key: "Tv", label: "Media", icon: Tv },
  { key: "CalendarCheck", label: "Events", icon: CalendarCheck },
];

export const CUSTOM_SECTION_COLORS = [
  "bg-chart-2/10 text-chart-2",
  "bg-chart-3/10 text-chart-3",
  "bg-primary/10 text-primary",
  "bg-chart-4/10 text-chart-4",
  "bg-chart-1/10 text-chart-1",
  "bg-chart-5/10 text-chart-5",
];

// ── Utility Functions ──────────────────────────────────────

export const formatDateShort = (date: string | null, isAr: boolean) => {
  if (!date) return "";
  const parts = date.split("-");
  if (parts.length === 1) return parts[0];
  if (parts.length === 2) {
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1);
    return toEnglishDigits(d.toLocaleDateString(isAr ? "ar-SA" : "en-US", { year: "numeric", month: "short" }));
  }
  const d = new Date(date);
  return toEnglishDigits(d.toLocaleDateString(isAr ? "ar-SA" : "en-US", { year: "numeric", month: "short" }));
};

export const formatDateRange = (startDate: string | null, endDate: string | null, isCurrent: boolean, isAr: boolean) => {
  const start = formatDateShort(startDate, isAr);
  const end = isCurrent ? "" : formatDateShort(endDate, isAr);
  if (!start && !end) {
    return isCurrent ? (isAr ? "لا يزال مستمراً" : "Still ongoing") : "";
  }
  if (isCurrent) return `${start} – ${isAr ? "مستمر" : "Ongoing"}`;
  if (!end) return start;
  if (start && end && start !== end) return `${start} – ${end}`;
  return start || end || "";
};

export const labelFor = (key: string, list: { value: string; en: string; ar: string }[], isAr: boolean) => {
  const item = list.find(l => l.value === key);
  return item ? (isAr ? item.ar : item.en) : key;
};

/** Build a compact summary string for a career record row */
export const buildRecordMeta = (
  r: CareerRecord,
  sectionKey: string,
  isAr: boolean,
): { mainTitle: string; subtitle: string; meta: string; badge?: string; badgeVariant?: "default" | "secondary" | "outline" } => {
  const mainTitle = isAr ? (r.title_ar || r.title) : r.title;
  const subtitle = r.entity_name || "";

  const parts: string[] = [];
  const dateRange = formatDateRange(r.start_date, r.end_date, r.is_current, isAr);
  if (dateRange) parts.push(dateRange);

  // Section-specific metadata
  if (sectionKey === "education") {
    if (r.education_level) parts.push(labelFor(r.education_level, EDUCATION_LEVELS, isAr));
    if (r.field_of_study) parts.push(isAr ? (r.field_of_study_ar || r.field_of_study) : r.field_of_study);
    if (r.grade) parts.push(isAr ? `معدل: ${r.grade}` : `GPA: ${r.grade}`);
  }
  if (sectionKey === "work" && r.employment_type) {
    parts.push(labelFor(r.employment_type, EMPLOYMENT_TYPES, isAr));
  }
  if (sectionKey === "judging" && r.employment_type) {
    parts.push(labelFor(r.employment_type, JUDGING_POSITIONS, isAr));
  }
  if (sectionKey === "competitions" && r.employment_type) {
    parts.push(labelFor(r.employment_type, COMPETITION_ROLES, isAr));
  }
  if (sectionKey === "media") {
    if (r.department) parts.push(`${isAr ? "مقدم" : "Host"}: ${r.department}`);
    if (r.field_of_study) parts.push(`${isAr ? "ضيف" : "Guest"}: ${r.field_of_study}`);
  }
  if (r.location) parts.push(r.location);
  if (r.country_code) {
    const country = COUNTRIES.find(c => c.code === r.country_code);
    if (country) parts.push(`${country.flag} ${isAr ? country.ar : country.en}`);
  }

  // Medal badge for competitions
  let badge: string | undefined;
  let badgeVariant: "default" | "secondary" | "outline" | undefined;
  if (sectionKey === "competitions" && r.grade) {
    const medal = MEDAL_TYPES.find(m => m.value === r.grade);
    if (medal) { badge = `${medal.emoji || ""} ${isAr ? medal.ar : medal.en}`.trim(); badgeVariant = "outline"; }
  }

  return { mainTitle, subtitle, meta: parts.join(" · "), badge, badgeVariant };
};
