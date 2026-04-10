import { toEnglishDigits } from "@/lib/formatNumber";

/** Detect Arabic characters in a string */
export const containsArabic = (text?: string | null) => !!text && /[\u0600-\u06FF]/.test(text);

/** Detect Latin characters in a string */
export const containsLatin = (text?: string | null) => !!text && /[A-Za-z]/.test(text);

/**
 * Pick the correct localized text based on current language, with character-detection fallbacks
 * to prevent empty data cards.
 */
export const pickLocalizedText = (isAr: boolean, arText?: string | null, enText?: string | null) => {
  const ar = (arText || "").trim();
  const en = (enText || "").trim();
  if (isAr) return ar || (en && containsArabic(en) ? en : en) || "";
  if (en && !containsArabic(en)) return en;
  if (ar && containsLatin(ar)) return ar;
  return en || ar || "";
};

export const formatDate = (date: string | null, isAr: boolean) => {
  if (!date) return "";
  return toEnglishDigits(new Date(date).toLocaleDateString(isAr ? "ar-SA" : "en-US", { year: "numeric", month: "short" }));
};

export const formatPeriodRange = (startDate: string | null, endDate: string | null, isCurrent: boolean, isAr: boolean) => {
  const fmt = (d: string | null) => {
    if (!d) return "";
    const parts = d.split("-");
    return parts.length === 1 && parts[0].length === 4 ? parts[0] : formatDate(d, isAr);
  };
  const start = fmt(startDate);
  const end = fmt(endDate);
  if (!start && !end) return isCurrent ? (isAr ? "لا يزال مستمراً" : "Still ongoing") : "";
  if (isCurrent) return `${start} – ${isAr ? "مستمر" : "Ongoing"}`;
  if (start && end && start !== end) return `${start} – ${end}`;
  return start || end || "";
};

export const roleLabels: Record<string, { en: string; ar: string }> = {
  chef: { en: "Chef", ar: "طاهٍ" },
  judge: { en: "Judge", ar: "حكم" },
  organizer: { en: "Organizer", ar: "منظم" },
  student: { en: "Student", ar: "طالب" },
  sponsor: { en: "Sponsor", ar: "راعي" },
  supervisor: { en: "Super Admin", ar: "مسؤول أعلى" },
  admin: { en: "Admin", ar: "مسؤول" },
};
