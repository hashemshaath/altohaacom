import { differenceInDays, differenceInHours } from "date-fns";

export function getCountdown(startDate: string, isAr: boolean): { text: string; urgent: boolean; past: boolean } {
  const now = new Date();
  const start = new Date(startDate);
  const diffDays = differenceInDays(start, now);
  const diffHours = differenceInHours(start, now);

  if (diffDays < 0) return { text: isAr ? "انتهى" : "Ended", urgent: false, past: true };
  if (diffDays === 0) {
    if (diffHours <= 0) return { text: isAr ? "الآن" : "Now", urgent: true, past: false };
    return { text: isAr ? `${diffHours} ساعة` : `${diffHours}h left`, urgent: true, past: false };
  }
  if (diffDays <= 3) return { text: isAr ? `${diffDays} أيام` : `${diffDays} days`, urgent: true, past: false };
  if (diffDays <= 30) return { text: isAr ? `${diffDays} يوم` : `${diffDays} days`, urgent: false, past: false };
  const months = Math.floor(diffDays / 30);
  return { text: isAr ? `${months} شهر` : `${months}mo`, urgent: false, past: false };
}
