/**
 * Network-aware quality helpers.
 *
 * Adapts image quality and prefetch behavior based on
 * the user's connection speed and data-saver preferences.
 */

interface NetworkInfo {
  effectiveType?: string;
  saveData?: boolean;
  downlink?: number;
}

function getConnection(): NetworkInfo | null {
  return (navigator as unknown as { connection?: NetworkInfo }).connection ?? null;
}

export type QualityTier = "high" | "medium" | "low";

/**
 * Returns an appropriate image quality tier based on network conditions.
 *
 * - `high`: Wi-Fi / 4G+ → quality 80, full srcSet
 * - `medium`: 3G → quality 60, reduced srcSet
 * - `low`: 2G / save-data → quality 40, single src only
 */
export function getQualityTier(): QualityTier {
  const conn = getConnection();
  if (!conn) return "high";

  if (conn.saveData) return "low";

  switch (conn.effectiveType) {
    case "slow-2g":
    case "2g":
      return "low";
    case "3g":
      return "medium";
    default:
      return "high";
  }
}

/** Maps quality tier to numeric image quality (1-100) */
export function getAdaptiveQuality(base: number = 80): number {
  const tier = getQualityTier();
  switch (tier) {
    case "low":
      return Math.min(base, 40);
    case "medium":
      return Math.min(base, 60);
    default:
      return base;
  }
}

/** Whether heavy prefetching is advisable */
export function shouldPrefetch(): boolean {
  const conn = getConnection();
  if (!conn) return true;
  if (conn.saveData) return false;
  return conn.effectiveType !== "slow-2g" && conn.effectiveType !== "2g";
}
