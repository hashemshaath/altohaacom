import { useCallback, useMemo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";

/**
 * Hook providing common bilingual text helpers to reduce duplication 
 * across components that need AR/EN text selection.
 */
export function useBilingual() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  /** Pick Arabic or English text based on current language */
  const t = useCallback(
    (en: string, ar: string) => (isAr ? ar : en),
    [isAr]
  );

  /** Pick localized field from an object: { name, name_ar } → picks correct one */
  const pick = useCallback(
    (en?: string | null, ar?: string | null) => {
      if (isAr) return ar || en || "";
      return en || ar || "";
    },
    [isAr]
  );

  /** Format a number in localized compact form (1.2K, 3.4M) */
  const formatCompact = useCallback(
    (num: number) => {
      if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
      if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
      return num.toLocaleString(isAr ? "ar-SA" : "en-US");
    },
    [isAr]
  );

  /** Date formatting helpers */
  const formatDate = useCallback(
    (date: string | Date, options?: Intl.DateTimeFormatOptions) => {
      const d = typeof date === "string" ? new Date(date) : date;
      return d.toLocaleDateString(
        isAr ? "ar-SA" : "en-US",
        options || { year: "numeric", month: "short", day: "numeric" }
      );
    },
    [isAr]
  );

  const formatRelative = useCallback(
    (date: string | Date) => {
      const d = typeof date === "string" ? new Date(date) : date;
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffMin = Math.floor(diffMs / 60000);
      const diffHr = Math.floor(diffMs / 3600000);
      const diffDay = Math.floor(diffMs / 86400000);

      if (diffMin < 1) return isAr ? "الآن" : "Just now";
      if (diffMin < 60) return isAr ? `منذ ${diffMin} دقيقة` : `${diffMin}m ago`;
      if (diffHr < 24) return isAr ? `منذ ${diffHr} ساعة` : `${diffHr}h ago`;
      if (diffDay < 7) return isAr ? `منذ ${diffDay} يوم` : `${diffDay}d ago`;
      return formatDate(d);
    },
    [isAr, formatDate]
  );

  return useMemo(
    () => ({ isAr, language, t, pick, formatCompact, formatDate, formatRelative }),
    [isAr, language, t, pick, formatCompact, formatDate, formatRelative]
  );
}
