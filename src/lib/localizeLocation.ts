/** Localize city/country for display */

const CITY_AR: Record<string, string> = {
  riyadh: "الرياض",
  jeddah: "جدة",
  mecca: "مكة",
  medina: "المدينة",
  dammam: "الدمام",
  khobar: "الخبر",
  dhahran: "الظهران",
  tabuk: "تبوك",
  abha: "أبها",
  taif: "الطائف",
  dubai: "دبي",
  "abu dhabi": "أبوظبي",
  sharjah: "الشارقة",
  doha: "الدوحة",
  kuwait: "الكويت",
  "kuwait city": "مدينة الكويت",
  manama: "المنامة",
  muscat: "مسقط",
  amman: "عمّان",
  beirut: "بيروت",
  cairo: "القاهرة",
  casablanca: "الدار البيضاء",
  istanbul: "إسطنبول",
  paris: "باريس",
  london: "لندن",
  milan: "ميلانو",
  rome: "روما",
  berlin: "برلين",
  madrid: "مدريد",
  barcelona: "برشلونة",
  "new york": "نيويورك",
  "los angeles": "لوس أنجلوس",
  chicago: "شيكاغو",
  tokyo: "طوكيو",
  singapore: "سنغافورة",
  mumbai: "مومباي",
  bangkok: "بانكوك",
  "kuala lumpur": "كوالالمبور",
  rabat: "الرباط",
  tunis: "تونس",
  algiers: "الجزائر",
  baghdad: "بغداد",
  damascus: "دمشق",
  bahrain: "البحرين",
  salalah: "صلالة",
  ajman: "عجمان",
  "ras al khaimah": "رأس الخيمة",
  fujairah: "الفجيرة",
  "al ain": "العين",
  yanbu: "ينبع",
  jubail: "الجبيل",
  buraidah: "بريدة",
  hail: "حائل",
  najran: "نجران",
  jizan: "جيزان",
  "al khobar": "الخبر",
};

export function localizeCity(city: string, isAr: boolean): string {
  if (!isAr) return city;
  // If already in Arabic, return as-is
  if (/[\u0600-\u06FF]/.test(city)) return city;
  return CITY_AR[city.toLowerCase()] || city;
}

const displayNamesCache: Record<string, Intl.DisplayNames> = {};

export function localizeCountry(countryCode: string, isAr: boolean): string {
  const locale = isAr ? "ar" : "en";
  if (!displayNamesCache[locale]) {
    displayNamesCache[locale] = new Intl.DisplayNames([locale], { type: "region" });
  }
  try {
    return displayNamesCache[locale].of(countryCode.toUpperCase()) || countryCode;
  } catch {
    return countryCode;
  }
}

export function localizeLocation(
  opts: { city?: string | null; country?: string | null; countryCode?: string | null },
  isAr: boolean
): string {
  const parts: string[] = [];
  if (opts.city) parts.push(localizeCity(opts.city, isAr));
  if (opts.countryCode) {
    parts.push(localizeCountry(opts.countryCode, isAr));
  } else if (opts.country) {
    parts.push(opts.country);
  }
  return parts.join(", ");
}
