/**
 * Connection-aware prefetch utility.
 * Skips heavy prefetching on slow/metered connections (2G, slow 3G, data-saver).
 */

interface NetworkInfo {
  effectiveType?: string;
  saveData?: boolean;
  downlink?: number;
}

function getConnection(): NetworkInfo | null {
  const nav = navigator as any;
  return nav.connection || nav.mozConnection || nav.webkitConnection || null;
}

/** Returns true if prefetching is safe (fast connection, not metered) */
export function canPrefetch(): boolean {
  const conn = getConnection();
  if (!conn) return true; // Unknown — assume OK

  if (conn.saveData) return false;
  if (conn.effectiveType === "slow-2g" || conn.effectiveType === "2g") return false;
  if (typeof conn.downlink === "number" && conn.downlink < 0.5) return false;

  return true;
}

/** Returns "fast" | "medium" | "slow" */
export function getConnectionTier(): "fast" | "medium" | "slow" {
  const conn = getConnection();
  if (!conn) return "fast";

  if (conn.saveData) return "slow";
  if (conn.effectiveType === "slow-2g" || conn.effectiveType === "2g") return "slow";
  if (conn.effectiveType === "3g") return "medium";
  return "fast";
}
