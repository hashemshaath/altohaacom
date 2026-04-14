export type OrderStatus = "draft" | "pending" | "approved" | "rejected" | "in_progress" | "completed" | "cancelled";
export type OrderDirection = "outgoing" | "incoming";
export type OrderCategory = "promotional" | "equipment" | "materials" | "services" | "catering" | "venue" | "transport" | "other";

export const statusColors: Record<string, string> = {
  draft: "bg-muted-foreground/15 text-muted-foreground",
  pending: "bg-chart-4/15 text-chart-4",
  approved: "bg-chart-1/15 text-chart-1",
  rejected: "bg-destructive/15 text-destructive",
  in_progress: "bg-chart-3/15 text-chart-3",
  completed: "bg-chart-5/15 text-chart-5",
  cancelled: "bg-muted text-muted-foreground",
  confirmed: "bg-primary/15 text-primary",
  processing: "bg-chart-3/15 text-chart-3",
  shipped: "bg-chart-1/15 text-chart-1",
  delivered: "bg-chart-5/15 text-chart-5",
  refunded: "bg-muted text-muted-foreground",
};

export const categoryLabels: Record<OrderCategory, { en: string; ar: string }> = {
  promotional: { en: "Promotional", ar: "ترويجية" },
  equipment: { en: "Equipment", ar: "معدات" },
  materials: { en: "Materials", ar: "مواد" },
  services: { en: "Services", ar: "خدمات" },
  catering: { en: "Catering", ar: "تموين" },
  venue: { en: "Venue", ar: "مكان" },
  transport: { en: "Transport", ar: "نقل" },
  other: { en: "Other", ar: "أخرى" },
};

export const defaultOrderForm = {
  company_id: "",
  direction: "outgoing" as OrderDirection,
  category: "other" as OrderCategory,
  title: "",
  title_ar: "",
  description: "",
  description_ar: "",
  total_amount: 0,
  subtotal: 0,
  tax_amount: 0,
  discount_amount: 0,
  currency: "SAR",
  order_date: new Date().toISOString().split("T")[0],
  delivery_date: "",
  due_date: "",
  notes: "",
  internal_notes: "",
  items: [] as { name: string; quantity: number; price: number }[],
};

export type OrderFormType = typeof defaultOrderForm;

export function getStatusLabel(status: string, isAr: boolean): string {
  const labels: Record<string, { en: string; ar: string }> = {
    draft: { en: "Draft", ar: "مسودة" },
    pending: { en: "Pending", ar: "قيد الانتظار" },
    approved: { en: "Approved", ar: "معتمد" },
    rejected: { en: "Rejected", ar: "مرفوض" },
    in_progress: { en: "In Progress", ar: "قيد التنفيذ" },
    completed: { en: "Completed", ar: "مكتمل" },
    cancelled: { en: "Cancelled", ar: "ملغي" },
    confirmed: { en: "Confirmed", ar: "مؤكد" },
    processing: { en: "Processing", ar: "قيد المعالجة" },
    shipped: { en: "Shipped", ar: "تم الشحن" },
    delivered: { en: "Delivered", ar: "تم التوصيل" },
    refunded: { en: "Refunded", ar: "مسترد" },
  };
  return isAr ? labels[status]?.ar || status : labels[status]?.en || status;
}

export function getCategoryLabel(category: string, isAr: boolean): string {
  const c = categoryLabels[category as OrderCategory];
  return c ? (isAr ? c.ar : c.en) : category;
}
