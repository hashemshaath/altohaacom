import { memo } from "react";
import { useGoogleTracking } from "@/hooks/useGoogleTracking";

/**
 * Invisible component that injects Google tracking scripts
 * based on admin-configured marketing_tracking_config.
 */
export const GoogleTrackingProvider = memo(function GoogleTrackingProvider() {
  useGoogleTracking();
  return null;
});
