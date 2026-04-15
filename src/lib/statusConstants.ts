/**
 * Centralised status string constants.
 * Avoids hardcoded strings scattered across 500+ files.
 */

// ── Generic entity statuses ──────────────────────────────────────────
export const STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
  ACTIVE: "active",
  INACTIVE: "inactive",
  DRAFT: "draft",
  PUBLISHED: "published",
  ARCHIVED: "archived",
  SUSPENDED: "suspended",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  IN_PROGRESS: "in_progress",
  CLOSED: "closed",
} as const;

export type StatusValue = (typeof STATUS)[keyof typeof STATUS];

// ── Bilingual status labels ──────────────────────────────────────────
export const STATUS_LABELS: Record<string, { en: string; ar: string }> = {
  [STATUS.PENDING]: { en: "Pending", ar: "قيد الانتظار" },
  [STATUS.APPROVED]: { en: "Approved", ar: "معتمد" },
  [STATUS.REJECTED]: { en: "Rejected", ar: "مرفوض" },
  [STATUS.ACTIVE]: { en: "Active", ar: "نشط" },
  [STATUS.INACTIVE]: { en: "Inactive", ar: "غير نشط" },
  [STATUS.DRAFT]: { en: "Draft", ar: "مسودة" },
  [STATUS.PUBLISHED]: { en: "Published", ar: "منشور" },
  [STATUS.ARCHIVED]: { en: "Archived", ar: "مؤرشف" },
  [STATUS.SUSPENDED]: { en: "Suspended", ar: "معلق" },
  [STATUS.COMPLETED]: { en: "Completed", ar: "مكتمل" },
  [STATUS.CANCELLED]: { en: "Cancelled", ar: "ملغي" },
  [STATUS.IN_PROGRESS]: { en: "In Progress", ar: "قيد التنفيذ" },
  [STATUS.CLOSED]: { en: "Closed", ar: "مغلق" },
};

/** Get bilingual label for a status, falls back to the raw key */
export function getStatusLabel(status: string, lang: string): string {
  const entry = STATUS_LABELS[status];
  if (!entry) return status;
  return lang === "ar" ? entry.ar : entry.en;
}

// ── Order / payment statuses ─────────────────────────────────────────
export const ORDER_STATUS = {
  PENDING: "pending",
  PAID: "paid",
  FAILED: "failed",
  REFUNDED: "refunded",
  CANCELLED: "cancelled",
} as const;

// ── Competition role statuses ────────────────────────────────────────
export const ROLE_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  PENDING: "pending",
} as const;
