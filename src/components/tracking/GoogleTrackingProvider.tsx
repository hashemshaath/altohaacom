import { forwardRef, memo } from "react";
import { useGoogleTracking } from "@/hooks/useGoogleTracking";

/**
 * Invisible component that injects all tracking scripts
 * based on admin-configured integration_settings table.
 */
export const GoogleTrackingProvider = memo(forwardRef<HTMLDivElement>(function GoogleTrackingProvider(_props, _ref) {
  useGoogleTracking();
  return null;
}));
