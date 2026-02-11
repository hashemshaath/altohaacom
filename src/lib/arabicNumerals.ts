/**
 * Convert Arabic/Eastern Arabic numerals (٠١٢٣٤٥٦٧٨٩) to Western (0123456789).
 * Also strips anything that's not a digit or +.
 */
export function normalizePhoneInput(value: string): string {
  // Map Arabic-Indic digits to Western
  const arabicMap: Record<string, string> = {
    "٠": "0", "١": "1", "٢": "2", "٣": "3", "٤": "4",
    "٥": "5", "٦": "6", "٧": "7", "٨": "8", "٩": "9",
  };

  let result = "";
  for (const ch of value) {
    if (arabicMap[ch]) {
      result += arabicMap[ch];
    } else if (/[0-9+]/.test(ch)) {
      result += ch;
    }
    // Skip letters, symbols, spaces
  }
  return result;
}

/**
 * Normalize a phone number for storage/lookup:
 * strips all non-digit chars except leading +
 * e.g. "+966-50-631-5300" → "+966506315300"
 */
export function normalizePhoneForStorage(phone: string): string {
  if (!phone) return "";
  const hasPlus = phone.startsWith("+");
  const digits = phone.replace(/[^\d]/g, "");
  return (hasPlus ? "+" : "") + digits;
}
