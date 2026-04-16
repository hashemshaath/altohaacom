import { useLanguage } from "@/i18n/LanguageContext";

/**
 * Tiny convenience hook that returns `true` when the active language is Arabic.
 * Eliminates the `const isAr = language === "ar"` boilerplate repeated in 700+ files.
 */
export function useIsAr(): boolean {
  const { language } = useLanguage();
  return language === "ar";
}
