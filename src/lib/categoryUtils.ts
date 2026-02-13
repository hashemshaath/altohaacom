/**
 * Category gender & participant level utilities
 * Used across competition category displays, forms, and filters.
 */

export type CategoryGender = "open" | "male" | "female";
export type ParticipantLevel = "open" | "amateur" | "chef" | "professional" | "international";

export const GENDER_OPTIONS: { value: CategoryGender; symbol: string; en: string; ar: string }[] = [
  { value: "open", symbol: "♂♀", en: "Open", ar: "مفتوح" },
  { value: "male", symbol: "♂", en: "Male", ar: "ذكور" },
  { value: "female", symbol: "♀", en: "Female", ar: "إناث" },
];

export const PARTICIPANT_LEVELS: { value: ParticipantLevel; en: string; ar: string }[] = [
  { value: "open", en: "Open", ar: "مفتوح" },
  { value: "amateur", en: "Amateur", ar: "هواة" },
  { value: "chef", en: "Chef", ar: "طاهٍ" },
  { value: "professional", en: "Professional", ar: "محترف" },
  { value: "international", en: "International", ar: "دولي" },
];

/** Returns gender symbol + label */
export function genderDisplay(gender: string | null | undefined, isAr: boolean): { symbol: string; label: string } {
  // Map legacy "mixed" to "open"
  const g = gender === "mixed" || !gender ? "open" : gender;
  const opt = GENDER_OPTIONS.find(o => o.value === g) || GENDER_OPTIONS[0];
  return { symbol: opt.symbol, label: isAr ? opt.ar : opt.en };
}

/** Returns participant level label */
export function levelDisplay(level: string | null | undefined, isAr: boolean): string {
  const l = level || "open";
  const opt = PARTICIPANT_LEVELS.find(o => o.value === l) || PARTICIPANT_LEVELS[0];
  return isAr ? opt.ar : opt.en;
}

/** Combined badge text: "♂♀ Open · Amateur" */
export function categoryBadgeText(gender: string | null | undefined, level: string | null | undefined, isAr: boolean): string {
  const g = genderDisplay(gender, isAr);
  const l = levelDisplay(level, isAr);
  if (l === (isAr ? "مفتوح" : "Open") && g.label === (isAr ? "مفتوح" : "Open")) {
    return `${g.symbol} ${g.label}`;
  }
  if (g.label === (isAr ? "مفتوح" : "Open")) {
    return `${g.symbol} ${l}`;
  }
  return `${g.symbol} ${g.label} · ${l}`;
}
