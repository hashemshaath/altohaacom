/**
 * Derive the real-time exhibition/event status from dates.
 * This is the single source of truth for exhibition status display across the app.
 * 
 * When the DB status is "active" (published), the displayed status is derived from dates:
 *   - "ended" if end_date has passed
 *   - "started" if currently between start_date and end_date
 *   - "registration_open" if registration_deadline exists and hasn't passed yet, and start_date is in the future
 *   - "registration_closed" if registration_deadline has passed but start_date is in the future
 *   - "upcoming" if start_date is in the future (no registration_deadline)
 * 
 * Other DB statuses (draft, pending, cancelled, completed) are passed through as-is.
 */

export type DerivedExhibitionStatus =
  | "pending"
  | "draft"
  | "upcoming"
  | "registration_open"
  | "registration_closed"
  | "started"
  | "ended"
  | "cancelled";

export interface ExhibitionStatusResult {
  status: DerivedExhibitionStatus;
  label: string;
  labelAr: string;
  color: string;
  dot: string;
  daysLeft?: number;
  urgent: boolean;
}

export function deriveExhibitionStatus(params: {
  dbStatus: string;
  startDate?: string | null;
  endDate?: string | null;
  registrationDeadline?: string | null;
}): ExhibitionStatusResult {
  const { dbStatus, startDate, endDate, registrationDeadline } = params;
  const now = Date.now();
  const dayMs = 1000 * 60 * 60 * 24;

  // Non-active statuses pass through
  if (dbStatus === "draft") {
    return {
      status: "draft",
      label: "Draft",
      labelAr: "مسودة",
      color: "bg-muted text-muted-foreground",
      dot: "bg-muted-foreground",
      urgent: false,
    };
  }

  if (dbStatus === "pending") {
    return {
      status: "pending",
      label: "Pending Approval",
      labelAr: "بانتظار الموافقة",
      color: "bg-chart-4/10 text-chart-4",
      dot: "bg-chart-4",
      urgent: false,
    };
  }

  if (dbStatus === "cancelled") {
    return {
      status: "cancelled",
      label: "Cancelled",
      labelAr: "ملغاة",
      color: "bg-destructive/10 text-destructive",
      dot: "bg-destructive",
      urgent: false,
    };
  }

  // For "active", "upcoming", or "completed" — derive from dates
  const start = startDate ? new Date(startDate).getTime() : null;
  const end = endDate ? new Date(endDate).getTime() : null;
  const regDeadline = registrationDeadline ? new Date(registrationDeadline).getTime() : null;

  // Ended
  if (end && now > end) {
    return {
      status: "ended",
      label: "Ended",
      labelAr: "انتهت",
      color: "bg-chart-5/10 text-chart-5",
      dot: "bg-chart-5",
      urgent: false,
    };
  }

  // Started (in progress)
  if (start && end && now >= start && now <= end) {
    const daysLeft = Math.ceil((end - now) / dayMs);
    return {
      status: "started",
      label: "Started",
      labelAr: "بدأت",
      color: "bg-chart-3/10 text-chart-3",
      dot: "bg-chart-3",
      daysLeft,
      urgent: daysLeft <= 3,
    };
  }

  // Future event — check registration
  if (start && now < start) {
    // Registration open
    if (regDeadline && now < regDeadline) {
      const daysLeft = Math.ceil((regDeadline - now) / dayMs);
      return {
        status: "registration_open",
        label: "Open for Registration",
        labelAr: "التسجيل مفتوح",
        color: "bg-primary/10 text-primary",
        dot: "bg-primary",
        daysLeft,
        urgent: daysLeft <= 3,
      };
    }

    // Registration closed (deadline passed but event not started)
    if (regDeadline && now >= regDeadline) {
      const daysLeft = Math.ceil((start - now) / dayMs);
      return {
        status: "registration_closed",
        label: "Registration Closed",
        labelAr: "التسجيل مغلق",
        color: "bg-chart-4/10 text-chart-4",
        dot: "bg-chart-4",
        daysLeft,
        urgent: daysLeft <= 3,
      };
    }

    // No registration deadline — just upcoming
    const daysLeft = Math.ceil((start - now) / dayMs);
    return {
      status: "upcoming",
      label: "Upcoming",
      labelAr: "قادمة",
      color: "bg-chart-2/10 text-chart-2",
      dot: "bg-chart-2",
      daysLeft,
      urgent: daysLeft <= 3,
    };
  }

  // Fallback
  return {
    status: "upcoming",
    label: "Upcoming",
    labelAr: "قادمة",
    color: "bg-chart-2/10 text-chart-2",
    dot: "bg-chart-2",
    urgent: false,
  };
}

/** All possible derived statuses for the legend */
export const EXHIBITION_STATUS_LEGEND: { status: DerivedExhibitionStatus; label: string; labelAr: string; color: string; dot: string }[] = [
  { status: "draft", label: "Draft", labelAr: "مسودة", color: "bg-muted text-muted-foreground", dot: "bg-muted-foreground" },
  { status: "pending", label: "Pending", labelAr: "معلقة", color: "bg-chart-4/10 text-chart-4", dot: "bg-chart-4" },
  { status: "upcoming", label: "Upcoming", labelAr: "قادمة", color: "bg-chart-2/10 text-chart-2", dot: "bg-chart-2" },
  { status: "registration_open", label: "Open for Registration", labelAr: "التسجيل مفتوح", color: "bg-primary/10 text-primary", dot: "bg-primary" },
  { status: "registration_closed", label: "Registration Closed", labelAr: "التسجيل مغلق", color: "bg-chart-4/10 text-chart-4", dot: "bg-chart-4" },
  { status: "started", label: "Started", labelAr: "بدأت", color: "bg-chart-3/10 text-chart-3", dot: "bg-chart-3" },
  { status: "ended", label: "Ended", labelAr: "انتهت", color: "bg-chart-5/10 text-chart-5", dot: "bg-chart-5" },
  { status: "cancelled", label: "Cancelled", labelAr: "ملغاة", color: "bg-destructive/10 text-destructive", dot: "bg-destructive" },
];
