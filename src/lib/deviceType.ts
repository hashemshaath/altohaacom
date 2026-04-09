/**
 * Shared utility for detecting device type from viewport width.
 * Avoids duplicated inline checks across ad components and tracking hooks.
 */
export function getDeviceType(): "mobile" | "tablet" | "desktop" {
  const w = window.innerWidth;
  if (w < 768) return "mobile";
  if (w < 1024) return "tablet";
  return "desktop";
}
