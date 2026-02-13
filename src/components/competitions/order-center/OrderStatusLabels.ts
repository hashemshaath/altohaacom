/**
 * Bilingual status labels for all order center statuses
 */

export const ITEM_STATUS_LABELS: Record<string, { en: string; ar: string }> = {
  pending: { en: "Pending", ar: "قيد الانتظار" },
  sourced: { en: "Sourced", ar: "تم التوفير" },
  sponsored: { en: "Sponsored", ar: "برعاية" },
  purchased: { en: "Purchased", ar: "تم الشراء" },
  delivered: { en: "Delivered", ar: "تم التسليم" },
};

export const LIST_STATUS_LABELS: Record<string, { en: string; ar: string }> = {
  draft: { en: "Draft", ar: "مسودة" },
  in_progress: { en: "In Progress", ar: "قيد العمل" },
  review: { en: "Under Review", ar: "قيد المراجعة" },
  approved: { en: "Approved", ar: "معتمدة" },
  sent_to_sponsors: { en: "Sent to Sponsors", ar: "أُرسلت للرعاة" },
};

export const QUOTE_STATUS_LABELS: Record<string, { en: string; ar: string }> = {
  pending: { en: "Pending", ar: "قيد الانتظار" },
  sent: { en: "Sent", ar: "تم الإرسال" },
  quoted: { en: "Quoted", ar: "تم التسعير" },
  accepted: { en: "Accepted", ar: "مقبول" },
  rejected: { en: "Rejected", ar: "مرفوض" },
};

export const SUGGESTION_STATUS_LABELS: Record<string, { en: string; ar: string }> = {
  pending: { en: "Pending", ar: "قيد المراجعة" },
  approved: { en: "Approved", ar: "مقبول" },
  rejected: { en: "Rejected", ar: "مرفوض" },
  added: { en: "Added", ar: "تمت الإضافة" },
};

export const PRIORITY_LABELS: Record<string, { en: string; ar: string }> = {
  low: { en: "Low", ar: "منخفضة" },
  medium: { en: "Medium", ar: "متوسطة" },
  high: { en: "High", ar: "عالية" },
  critical: { en: "Critical", ar: "حرجة" },
};

export function getStatusLabel(
  map: Record<string, { en: string; ar: string }>,
  status: string,
  lang: string
): string {
  const entry = map[status];
  if (!entry) return status;
  return lang === "ar" ? entry.ar : entry.en;
}
