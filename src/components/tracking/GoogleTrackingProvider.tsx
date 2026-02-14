import { useGoogleTracking } from "@/hooks/useGoogleTracking";

/**
 * Invisible component that injects Google tracking scripts
 * based on admin-configured marketing_tracking_config.
 */
export function GoogleTrackingProvider() {
  useGoogleTracking();
  return null;
}
