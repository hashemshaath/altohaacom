/**
 * Derive the real-time registration/competition status from dates.
 * This is the single source of truth for status display across the app.
 */

export type DerivedStatus =
  | "registration_upcoming"
  | "registration_open"
  | "registration_closing_soon"
  | "registration_closed"
  | "competition_starting_soon"
  | "in_progress"
  | "ended";

export interface StatusResult {
  status: DerivedStatus;
  label: string;
  labelAr: string;
  color: string;      // tailwind token class
  dot: string;        // dot color
  daysLeft?: number;
  urgent: boolean;     // true when < 3 days left for a deadline
}

export function deriveCompetitionStatus(params: {
  registrationStart?: string | null;
  registrationEnd?: string | null;
  competitionStart?: string | null;
  competitionEnd?: string | null;
  dbStatus?: string;
}): StatusResult {
  const now = Date.now();
  const regStart = params.registrationStart ? new Date(params.registrationStart).getTime() : null;
  const regEnd = params.registrationEnd ? new Date(params.registrationEnd).getTime() : null;
  const compStart = params.competitionStart ? new Date(params.competitionStart).getTime() : null;
  const compEnd = params.competitionEnd ? new Date(params.competitionEnd).getTime() : null;

  const dayMs = 1000 * 60 * 60 * 24;

  // Competition already ended
  if (compEnd && now > compEnd) {
    return {
      status: "ended",
      label: "Completed",
      labelAr: "مكتملة",
      color: "bg-chart-5/10 text-chart-5",
      dot: "bg-chart-5",
      urgent: false,
    };
  }

  // Competition in progress
  if (compStart && now >= compStart && compEnd && now <= compEnd) {
    const daysLeft = Math.ceil((compEnd - now) / dayMs);
    return {
      status: "in_progress",
      label: "In Progress",
      labelAr: "جارية",
      color: "bg-chart-3/10 text-chart-3",
      dot: "bg-chart-3",
      daysLeft,
      urgent: daysLeft <= 3,
    };
  }

  // Registration not started yet
  if (regStart && now < regStart) {
    const daysLeft = Math.ceil((regStart - now) / dayMs);
    return {
      status: "registration_upcoming",
      label: "Registration Opens Soon",
      labelAr: "التسجيل يفتح قريباً",
      color: "bg-accent/10 text-accent-foreground",
      dot: "bg-accent",
      daysLeft,
      urgent: daysLeft <= 3,
    };
  }

  // Registration open
  if (regEnd && now < regEnd) {
    const daysLeft = Math.ceil((regEnd - now) / dayMs);
    if (daysLeft <= 3) {
      return {
        status: "registration_closing_soon",
        label: `Registration Closes in ${daysLeft}d`,
        labelAr: `التسجيل يغلق خلال ${daysLeft} أيام`,
        color: "bg-chart-4/10 text-chart-4",
        dot: "bg-chart-4",
        daysLeft,
        urgent: true,
      };
    }
    return {
      status: "registration_open",
      label: "Registration Open",
      labelAr: "التسجيل مفتوح",
      color: "bg-primary/10 text-primary",
      dot: "bg-primary",
      daysLeft,
      urgent: false,
    };
  }

  // Registration ended but competition not started
  if (regEnd && now >= regEnd && compStart && now < compStart) {
    const daysLeft = Math.ceil((compStart - now) / dayMs);
    return {
      status: "competition_starting_soon",
      label: `Starts in ${daysLeft}d`,
      labelAr: `تبدأ خلال ${daysLeft} أيام`,
      color: "bg-chart-3/10 text-chart-3",
      dot: "bg-chart-3",
      daysLeft,
      urgent: daysLeft <= 3,
    };
  }

  // Registration closed (fallback)
  if (regEnd && now >= regEnd) {
    return {
      status: "registration_closed",
      label: "Registration Closed",
      labelAr: "التسجيل مغلق",
      color: "bg-muted/60 text-muted-foreground",
      dot: "bg-muted-foreground",
      urgent: false,
    };
  }

  // Default: use DB status
  return {
    status: "registration_open",
    label: "Open",
    labelAr: "مفتوح",
    color: "bg-primary/10 text-primary",
    dot: "bg-primary",
    urgent: false,
  };
}
