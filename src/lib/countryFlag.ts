/**
 * Convert a country name or ISO code to a flag emoji.
 * Handles both ISO 2-letter codes and common country names (EN/AR).
 */
const COUNTRY_TO_CODE: Record<string, string> = {
  // English names
  "saudi arabia": "SA", "saudi": "SA", "ksa": "SA",
  "united arab emirates": "AE", "uae": "AE", "emirates": "AE",
  "qatar": "QA", "bahrain": "BH", "kuwait": "KW", "oman": "OM",
  "jordan": "JO", "lebanon": "LB", "egypt": "EG", "iraq": "IQ",
  "syria": "SY", "palestine": "PS", "yemen": "YE", "libya": "LY",
  "tunisia": "TN", "algeria": "DZ", "morocco": "MA", "sudan": "SD",
  "mauritania": "MR", "somalia": "SO", "djibouti": "DJ", "comoros": "KM",
  "turkey": "TR", "iran": "IR", "pakistan": "PK", "india": "IN",
  "bangladesh": "BD", "sri lanka": "LK", "malaysia": "MY",
  "indonesia": "ID", "philippines": "PH", "thailand": "TH",
  "south korea": "KR", "japan": "JP", "china": "CN",
  "united states": "US", "usa": "US", "uk": "GB", "united kingdom": "GB",
  "france": "FR", "germany": "DE", "italy": "IT", "spain": "ES",
  "canada": "CA", "australia": "AU", "brazil": "BR", "mexico": "MX",
  "nigeria": "NG", "south africa": "ZA", "kenya": "KE",
  // Arabic names
  "السعودية": "SA", "المملكة العربية السعودية": "SA",
  "الإمارات": "AE", "الإمارات العربية المتحدة": "AE",
  "قطر": "QA", "البحرين": "BH", "الكويت": "KW", "عمان": "OM",
  "الأردن": "JO", "لبنان": "LB", "مصر": "EG", "العراق": "IQ",
  "سوريا": "SY", "فلسطين": "PS", "اليمن": "YE", "ليبيا": "LY",
  "تونس": "TN", "الجزائر": "DZ", "المغرب": "MA", "السودان": "SD",
  "تركيا": "TR", "إيران": "IR", "باكستان": "PK", "الهند": "IN",
  "فرنسا": "FR", "ألمانيا": "DE", "إيطاليا": "IT", "إسبانيا": "ES",
  "بريطانيا": "GB", "أمريكا": "US", "كندا": "CA", "أستراليا": "AU",
};

export function countryFlag(countryOrCode: string | null | undefined): string {
  if (!countryOrCode) return "";
  const trimmed = countryOrCode.trim();
  
  // If already a 2-letter ISO code
  if (/^[A-Z]{2}$/i.test(trimmed)) {
    return isoToFlag(trimmed.toUpperCase());
  }
  
  // Look up by name
  const code = COUNTRY_TO_CODE[trimmed.toLowerCase()];
  if (code) return isoToFlag(code);
  
  return "";
}

function isoToFlag(code: string): string {
  return String.fromCodePoint(
    ...code.toUpperCase().split("").map((c) => 0x1f1e6 + c.charCodeAt(0) - 65)
  );
}
