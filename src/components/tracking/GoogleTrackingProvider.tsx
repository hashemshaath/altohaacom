import { useGoogleTracking } from "@/hooks/useGoogleTracking";

/**
 * Invisible component that injects all tracking scripts
 * (Google, Meta, TikTok, Snap, LinkedIn, Hotjar)
 * based on admin-configured integration_settings table.
 */
export function GoogleTrackingProvider() {
  useGoogleTracking();
  return null;
}
