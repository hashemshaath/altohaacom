import { FileImage, File, Image, FileText, FolderOpen, type LucideIcon } from "lucide-react";

export type CompanyType = "sponsor" | "supplier" | "partner" | "vendor";
export type CompanyStatus = "active" | "inactive" | "pending" | "suspended";

export interface Company {
  id: string;
  name: string;
  name_ar: string | null;
  type: CompanyType;
  status: CompanyStatus;
  company_number: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  country: string | null;
  country_code: string | null;
  operating_countries: string[] | null;
  logo_url: string | null;
  created_at: string;
  import_source: string | null;
  rating: number | null;
  neighborhood: string | null;
  google_maps_url: string | null;
  latitude: number | null;
  longitude: number | null;
}

export const COMPANY_TYPES: { value: CompanyType; label: string; labelAr: string }[] = [
  { value: "sponsor", label: "Sponsor", labelAr: "راعي" },
  { value: "supplier", label: "Supplier", labelAr: "مورد" },
  { value: "partner", label: "Partner", labelAr: "شريك" },
  { value: "vendor", label: "Vendor", labelAr: "بائع" },
];

export const STATUS_COLORS: Record<CompanyStatus, string> = {
  active: "bg-chart-5",
  inactive: "bg-muted-foreground",
  pending: "bg-chart-4",
  suspended: "bg-destructive",
};

export const DAYS = [
  { en: "Monday", ar: "الاثنين" },
  { en: "Tuesday", ar: "الثلاثاء" },
  { en: "Wednesday", ar: "الأربعاء" },
  { en: "Thursday", ar: "الخميس" },
  { en: "Friday", ar: "الجمعة" },
  { en: "Saturday", ar: "السبت" },
  { en: "Sunday", ar: "الأحد" },
];

export const MEDIA_CATEGORIES: { value: string; label: string; labelAr: string; icon: LucideIcon }[] = [
  { value: "logo", label: "Logo", labelAr: "الشعار", icon: FileImage },
  { value: "documents", label: "Documents", labelAr: "المستندات", icon: File },
  { value: "product_images", label: "Product Images", labelAr: "صور المنتجات", icon: Image },
  { value: "certificates", label: "Certificates", labelAr: "الشهادات", icon: FileText },
  { value: "other", label: "Other", labelAr: "أخرى", icon: FolderOpen },
];

export function getTypeLabel(type: CompanyType, isAr: boolean): string | undefined {
  const t = COMPANY_TYPES.find(ct => ct.value === type);
  return isAr ? t?.labelAr : t?.label;
}

export function getStatusLabel(status: CompanyStatus, isAr: boolean): string {
  const labels: Record<CompanyStatus, { en: string; ar: string }> = {
    active: { en: "Active", ar: "نشط" },
    inactive: { en: "Inactive", ar: "غير نشط" },
    pending: { en: "Pending", ar: "قيد الانتظار" },
    suspended: { en: "Suspended", ar: "معلق" },
  };
  return isAr ? labels[status].ar : labels[status].en;
}
