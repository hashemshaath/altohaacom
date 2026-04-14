/**
 * Shared application constants.
 * Eliminates magic numbers and duplicated literals across the codebase.
 */

// ── Time (milliseconds) ──────────────────────────────────────────────
export const MS_PER_SECOND = 1_000;
export const MS_PER_MINUTE = 60 * MS_PER_SECOND;
export const MS_PER_HOUR = 60 * MS_PER_MINUTE;
export const MS_PER_DAY = 24 * MS_PER_HOUR;
export const MS_PER_WEEK = 7 * MS_PER_DAY;

// ── HTTP status codes ────────────────────────────────────────────────
export const HTTP_STATUS = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CLIENT_ERROR_MIN: 400,
  CLIENT_ERROR_MAX: 499,
  SERVER_ERROR_MIN: 500,
} as const;

// ── Pagination & limits ──────────────────────────────────────────────
export const DEFAULT_PAGE_SIZE = 20;
export const SUPABASE_MAX_ROWS = 1000;

// ── Percentage helper ────────────────────────────────────────────────
export const PERCENTAGE = 100;
