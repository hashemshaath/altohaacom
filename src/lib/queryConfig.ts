/**
 * Centralised React-Query cache presets.
 *
 * Usage:
 *   import { CACHE } from "@/lib/queryConfig";
 *   useQuery({ queryKey: [...], queryFn, ...CACHE.short });
 */
import { MS_PER_MINUTE } from "./constants";

/** Re-usable staleTime + gcTime combos */
export const CACHE = {
  /** 1 min stale — fast-changing data (live feeds, sessions) */
  realtime: { staleTime: MS_PER_MINUTE, gcTime: 5 * MS_PER_MINUTE },

  /** 2 min stale — frequently updated data (entities, lists) */
  short: { staleTime: 2 * MS_PER_MINUTE, gcTime: 10 * MS_PER_MINUTE },

  /** 3 min stale — default app data */
  default: { staleTime: 3 * MS_PER_MINUTE, gcTime: 30 * MS_PER_MINUTE },

  /** 5 min stale — moderately static data (roles, permissions, configs) */
  medium: { staleTime: 5 * MS_PER_MINUTE, gcTime: 30 * MS_PER_MINUTE },

  /** 10 min stale — slow-changing data (features, profile, auth slides) */
  long: { staleTime: 10 * MS_PER_MINUTE, gcTime: 30 * MS_PER_MINUTE },

  /** 30 min stale — near-static reference data (countries, lookups) */
  static: { staleTime: 30 * MS_PER_MINUTE, gcTime: 60 * MS_PER_MINUTE },
} as const;
