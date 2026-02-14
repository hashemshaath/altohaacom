import { usePageTracking } from "@/hooks/usePageTracking";

/**
 * Invisible component that auto-tracks page views on route changes.
 */
export function PageTracker() {
  usePageTracking();
  return null;
}
