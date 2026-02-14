export interface CatalogItem {
  id: string;
  company_id: string;
  name: string;
  name_ar: string | null;
  description: string | null;
  description_ar: string | null;
  category: string;
  subcategory: string | null;
  sku: string | null;
  unit: string | null;
  unit_price: number | null;
  currency: string | null;
  quantity_available: number | null;
  in_stock: boolean | null;
  is_active: boolean | null;
  image_url: string | null;
  created_at: string | null;
}

export interface CatalogFormData {
  name: string;
  name_ar: string;
  description: string;
  description_ar: string;
  category: string;
  subcategory: string;
  sku: string;
  unit: string;
  unit_price: number;
  currency: string;
  quantity_available: number;
  in_stock: boolean;
  is_active: boolean;
  image_url: string;
}

export const defaultForm: CatalogFormData = {
  name: "",
  name_ar: "",
  description: "",
  description_ar: "",
  category: "",
  subcategory: "",
  sku: "",
  unit: "",
  unit_price: 0,
  currency: "SAR",
  quantity_available: 0,
  in_stock: true,
  is_active: true,
  image_url: "",
};

export const categories = [
  { value: "ingredients", en: "Ingredients", ar: "مكونات" },
  { value: "equipment", en: "Equipment", ar: "معدات" },
  { value: "packaging", en: "Packaging", ar: "تغليف" },
  { value: "utensils", en: "Utensils", ar: "أدوات" },
  { value: "uniforms", en: "Uniforms", ar: "أزياء" },
  { value: "cleaning", en: "Cleaning Supplies", ar: "مواد تنظيف" },
  { value: "other", en: "Other", ar: "أخرى" },
] as const;
