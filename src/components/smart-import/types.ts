import type { Database } from "@/integrations/supabase/types";
import type { ImportedData } from "./SmartImportDialog";
import {
  MapPin, Globe, ExternalLink, Sparkles, Building2, Briefcase,
} from "lucide-react";

export type EntityType = Database["public"]["Enums"]["entity_type"];
export type CompanyType = Database["public"]["Enums"]["company_type"];
export type TargetTable = "culinary_entities" | "companies" | "establishments";
export type Step = "search" | "results" | "details";

export interface SearchResultItem {
  id: string;
  name: string;
  description: string;
  url: string;
  latitude: number | null;
  longitude: number | null;
  rating: number | null;
  total_reviews: number | null;
  google_maps_url: string | null;
  place_type: string | null;
}

export interface ExistingRecord {
  id: string;
  name: string;
  name_ar: string | null;
  identifier: string;
  sub_type: string;
  city: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  table: TargetTable;
}

export const SOURCE_CHANNELS = {
  google_maps: { label_en: "Google Maps", label_ar: "خرائط جوجل", icon: MapPin, color: "bg-red-500/10 text-red-600 border-red-500/20" },
  web_search: { label_en: "Web Search", label_ar: "بحث الويب", icon: Globe, color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  website: { label_en: "Official Website", label_ar: "الموقع الرسمي", icon: ExternalLink, color: "bg-green-500/10 text-green-600 border-green-500/20" },
  ai: { label_en: "AI Enrichment", label_ar: "تحليل ذكي", icon: Sparkles, color: "bg-purple-500/10 text-purple-600 border-purple-500/20" },
} as const;

export const TARGET_TABLE_OPTIONS: {
  value: TargetTable;
  label_en: string;
  label_ar: string;
  icon: typeof Building2;
  description_en: string;
  description_ar: string;
}[] = [
  { value: "culinary_entities", label_en: "Culinary Entity", label_ar: "كيان طهوي", icon: Building2, description_en: "Associations, academies, government entities", description_ar: "جمعيات، أكاديميات، جهات حكومية" },
  { value: "companies", label_en: "Company", label_ar: "شركة", icon: Briefcase, description_en: "Sponsors, suppliers, partners, vendors", description_ar: "رعاة، موردون، شركاء" },
  { value: "establishments", label_en: "Establishment", label_ar: "منشأة", icon: MapPin, description_en: "Hotels, restaurants, kitchens", description_ar: "فنادق، مطاعم، مطابخ" },
];

export const ENTITY_TYPE_LABELS: Record<EntityType, { en: string; ar: string }> = {
  culinary_association: { en: "Culinary Association", ar: "جمعية طهي" },
  government_entity: { en: "Government Entity", ar: "جهة حكومية" },
  private_association: { en: "Private Association", ar: "جمعية خاصة" },
  culinary_academy: { en: "Culinary Academy", ar: "أكاديمية طهي" },
  industry_body: { en: "Industry Body", ar: "هيئة صناعية" },
  university: { en: "University", ar: "جامعة" },
  college: { en: "College", ar: "كلية" },
  training_center: { en: "Training Center", ar: "مركز تدريب" },
};

export const COMPANY_TYPE_LABELS: Record<CompanyType, { en: string; ar: string }> = {
  sponsor: { en: "Sponsor", ar: "راعي" },
  supplier: { en: "Supplier", ar: "مورد" },
  partner: { en: "Partner", ar: "شريك" },
  vendor: { en: "Vendor", ar: "بائع" },
};

export const ESTABLISHMENT_TYPES = [
  { value: "restaurant", en: "Restaurant", ar: "مطعم" },
  { value: "hotel", en: "Hotel", ar: "فندق" },
  { value: "cafe", en: "Café", ar: "مقهى" },
  { value: "catering", en: "Catering", ar: "تموين" },
  { value: "bakery", en: "Bakery", ar: "مخبز" },
  { value: "kitchen", en: "Kitchen", ar: "مطبخ" },
  { value: "resort", en: "Resort", ar: "منتجع" },
  { value: "club", en: "Club", ar: "نادي" },
  { value: "other", en: "Other", ar: "أخرى" },
];

/** Count how many detail fields are populated */
export const countFields = (d: ImportedData | null) => {
  if (!d) return 0;
  let count = 0;
  const check = (v: any) => {
    if (v !== null && v !== undefined && v !== '' && !(Array.isArray(v) && v.length === 0)) count++;
  };
  Object.values(d).forEach(v => {
    if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
      Object.values(v).forEach(sv => check(sv));
    } else {
      check(v);
    }
  });
  return count;
};
