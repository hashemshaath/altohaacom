import { forwardRef } from "react";
import { usePageTracking } from "@/hooks/usePageTracking";

/**
 * Invisible component that auto-tracks page views on route changes.
 */
export const PageTracker = forwardRef<HTMLDivElement>(function PageTracker(_props, _ref) {
  usePageTracking();
  return null;
});
