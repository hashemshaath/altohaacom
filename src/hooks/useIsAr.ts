import { useLanguage } from "@/i18n/LanguageContext";

/**
 * Convenience hook – returns true when the active UI language is Arabic.
 * Eliminates the `const isAr = language === "ar"` boilerplate repeated across files.
 */
export function useIsAr(): boolean {
  const { language } = useLanguage();
  return language === "ar";
}
