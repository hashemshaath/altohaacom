export interface OrderItem {
  name: string;
  name_ar?: string;
  quantity: number;
  unit?: string;
  unit_price: number;
  total: number;
}

export interface CompanyOrder {
  id: string;
  order_number: string;
  company_id: string;
  direction: "outgoing" | "incoming";
  category: string;
  title: string;
  title_ar: string | null;
  description: string | null;
  description_ar: string | null;
  items: OrderItem[] | null;
  subtotal: number | null;
  tax_amount: number | null;
  discount_amount: number | null;
  total_amount: number | null;
  currency: string | null;
  order_date: string | null;
  delivery_date: string | null;
  due_date: string | null;
  status: string | null;
  notes: string | null;
  rejection_reason: string | null;
  created_at: string | null;
  created_by: string | null;
  approved_at: string | null;
  completed_at: string | null;
  branch_id: string | null;
  driver_id: string | null;
  competition_id: string | null;
}

export interface OrderFormData {
  title: string;
  title_ar: string;
  description: string;
  description_ar: string;
  direction: "outgoing" | "incoming";
  category: string;
  currency: string;
  delivery_date: string;
  due_date: string;
  notes: string;
  items: OrderItem[];
}

export const defaultOrderForm: OrderFormData = {
  title: "",
  title_ar: "",
  description: "",
  description_ar: "",
  direction: "outgoing",
  category: "materials",
  currency: "SAR",
  delivery_date: "",
  due_date: "",
  notes: "",
  items: [{ name: "", quantity: 1, unit: "", unit_price: 0, total: 0 }],
};

export const ORDER_STATUSES = [
  { value: "draft", en: "Draft", ar: "مسودة" },
  { value: "pending", en: "Pending", ar: "قيد الانتظار" },
  { value: "approved", en: "Approved", ar: "معتمد" },
  { value: "rejected", en: "Rejected", ar: "مرفوض" },
  { value: "in_progress", en: "In Progress", ar: "قيد التنفيذ" },
  { value: "completed", en: "Completed", ar: "مكتمل" },
  { value: "cancelled", en: "Cancelled", ar: "ملغي" },
] as const;

export const ORDER_CATEGORIES = [
  { value: "promotional", en: "Promotional", ar: "ترويجي" },
  { value: "equipment", en: "Equipment", ar: "معدات" },
  { value: "materials", en: "Materials", ar: "مواد" },
  { value: "services", en: "Services", ar: "خدمات" },
  { value: "catering", en: "Catering", ar: "تموين" },
  { value: "venue", en: "Venue", ar: "مكان" },
  { value: "transport", en: "Transport", ar: "نقل" },
  { value: "other", en: "Other", ar: "أخرى" },
] as const;
