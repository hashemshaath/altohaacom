/**
 * Converts any Arabic/Eastern numerals (٠-٩) to Western/English numerals (0-9).
 * Use this wrapper around any number formatting to ensure consistent English digits.
 */
export function toEnglishDigits(value: string | number): string {
  return String(value).replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
}

/**
 * Formats a number with English digits and optional locale-style separators.
 * Always outputs Western/English numerals regardless of locale.
 */
export function formatNumber(value: number, options?: Intl.NumberFormatOptions): string {
  return toEnglishDigits(value.toLocaleString("en-US", options));
}

/**
 * Formats a date string to a localized display, but forces English numerals.
 */
export function formatLocalizedDate(
  dateStr: string | Date,
  locale: string,
  options?: Intl.DateTimeFormatOptions
): string {
  const date = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
  // Use the locale for month/day names but force English digits
  return toEnglishDigits(date.toLocaleDateString(locale, options));
}
