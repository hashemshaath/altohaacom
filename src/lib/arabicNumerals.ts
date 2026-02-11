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
