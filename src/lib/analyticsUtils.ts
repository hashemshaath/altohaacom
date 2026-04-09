/**
 * Shared browser/session utilities for analytics and tracking hooks.
 * Eliminates duplication across useAdTracking, useSEOTracking, useEcommerceTracking, etc.
 */

const SESSION_KEY = "ad_session_id";

/** Get or create a persistent session ID for analytics tracking */
export function getSessionId(): string {
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return crypto.randomUUID();
  }
}

/** Detect browser name from user agent */
export function getBrowser(): string {
  const ua = navigator.userAgent;
  if (ua.includes("Firefox")) return "Firefox";
  if (ua.includes("Edg/")) return "Edge";
  if (ua.includes("OPR/") || ua.includes("Opera")) return "Opera";
  if (ua.includes("Chrome")) return "Chrome";
  if (ua.includes("Safari")) return "Safari";
  return "Other";
}
