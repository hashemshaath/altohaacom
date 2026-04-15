import { toEnglishDigits } from "@/lib/formatNumber";

/**
 * Centralized date formatting utilities.
 * All date display in the app should go through these functions
 * to ensure consistent English numerals and locale handling.
 */

type DateInput = string | Date | null | undefined;

const toDate = (input: DateInput): Date | null => {
  if (!input) return null;
  const d = typeof input === "string" ? new Date(input) : input;
  return isNaN(d.getTime()) ? null : d;
};

/** Short date: "Jan 5, 2025" or "٥ يناير ٢٠٢٥" → always English digits */
function formatDate(input: DateInput, isAr = false): string {
  const d = toDate(input);
  if (!d) return "";
  return toEnglishDigits(
    d.toLocaleDateString(isAr ? "ar-SA" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  );
}

/** Month + year only: "Jan 2025" */
function formatMonthYear(input: DateInput, isAr = false): string {
  const d = toDate(input);
  if (!d) return "";
  return toEnglishDigits(
    d.toLocaleDateString(isAr ? "ar-SA" : "en-US", {
      year: "numeric",
      month: "short",
    })
  );
}

/** Short date without year: "Jan 5" */
function formatShortDate(input: DateInput, isAr = false): string {
  const d = toDate(input);
  if (!d) return "";
  return toEnglishDigits(
    d.toLocaleDateString(isAr ? "ar-SA" : "en-US", {
      month: "short",
      day: "numeric",
    })
  );
}

/** Full date: "Monday, January 5, 2025" */
function formatFullDate(input: DateInput, isAr = false): string {
  const d = toDate(input);
  if (!d) return "";
  return toEnglishDigits(
    d.toLocaleDateString(isAr ? "ar-SA" : "en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  );
}

/** Weekday + short date: "Mon, Jan 5" */
export function formatWeekdayShort(input: DateInput, isAr = false): string {
  const d = toDate(input);
  if (!d) return "";
  return toEnglishDigits(
    d.toLocaleDateString(isAr ? "ar-SA" : "en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    })
  );
}

/** Date + time: "Jan 5, 2025, 3:30 PM" */
function formatDateTime(input: DateInput, isAr = false): string {
  const d = toDate(input);
  if (!d) return "";
  return toEnglishDigits(
    d.toLocaleString(isAr ? "ar-SA" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  );
}

/** Short date + time: "Jan 5, 3:30 PM" (no year) */
export function formatShortDateTime(input: DateInput, isAr = false): string {
  const d = toDate(input);
  if (!d) return "";
  return toEnglishDigits(
    d.toLocaleString(isAr ? "ar-SA" : "en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  );
}

/** Time only: "3:30 PM" */
export function formatTime(input: DateInput, isAr = false): string {
  const d = toDate(input);
  if (!d) return "";
  return toEnglishDigits(
    d.toLocaleTimeString(isAr ? "ar-SA" : "en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })
  );
}

/** Relative time: "2 hours ago", "3 days ago", "just now" */
function formatRelativeTime(input: DateInput, isAr = false): string {
  const d = toDate(input);
  if (!d) return "";
  const now = Date.now();
  const diffMs = now - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return isAr ? "الآن" : "just now";
  if (diffMin < 60) return isAr ? `منذ ${diffMin} دقيقة` : `${diffMin}m ago`;
  if (diffHr < 24) return isAr ? `منذ ${diffHr} ساعة` : `${diffHr}h ago`;
  if (diffDay < 7) return isAr ? `منذ ${diffDay} يوم` : `${diffDay}d ago`;
  return formatDate(d, isAr);
}

/** ISO string for DB writes: always use this instead of new Date().toISOString() */
function nowISO(): string {
  return new Date().toISOString();
}

/** Date-only ISO: "2025-01-05" */
function toISODate(input: DateInput): string {
  const d = toDate(input);
  if (!d) return "";
  return d.toISOString().slice(0, 10);
}

/** Plain date string for default locale (no locale, just date) */
export function formatSimpleDate(input: DateInput): string {
  const d = toDate(input);
  if (!d) return "";
  return toEnglishDigits(d.toLocaleDateString());
}
