/**
 * Shared application constants.
 * Eliminates magic numbers and duplicated literals across the codebase.
 */

// ── Time (milliseconds) ──────────────────────────────────────────────
const MS_PER_SECOND = 1_000;
export const MS_PER_MINUTE = 60 * MS_PER_SECOND;
const MS_PER_HOUR = 60 * MS_PER_MINUTE;
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
const DEFAULT_PAGE_SIZE = 20;
const SUPABASE_MAX_ROWS = 1000;

// ── Percentage helper ────────────────────────────────────────────────
const PERCENTAGE = 100;

// ── Query / cache timing ─────────────────────────────────────────────
/** Default staleTime for most queries (1 min) */
const STALE_TIME_DEFAULT = MS_PER_MINUTE;
/** Short staleTime for fast-moving data (30 s) */
const STALE_TIME_SHORT = 30 * MS_PER_SECOND;
/** Long staleTime for rarely-changing data (3 min) */
const STALE_TIME_LONG = 3 * MS_PER_MINUTE;

/** Default refetch interval for live widgets (1 min) */
export const REFETCH_INTERVAL_DEFAULT = MS_PER_MINUTE;
/** Slower refetch for non-critical widgets (2 min) */
export const REFETCH_INTERVAL_SLOW = 2 * MS_PER_MINUTE;
/** Fast refetch for near-realtime widgets (30 s) */
export const REFETCH_INTERVAL_FAST = 30 * MS_PER_SECOND;
/** Very slow refetch for background data (5 min) */
export const REFETCH_INTERVAL_BACKGROUND = 5 * MS_PER_MINUTE;

// ── Query row limits ─────────────────────────────────────────────────
/** Large dataset queries (analytics, exports) */
export const QUERY_LIMIT_LARGE = 5_000;
/** Medium dataset queries (tables, lists) */
export const QUERY_LIMIT_MEDIUM = 500;
/** Small preview/widget queries */
const QUERY_LIMIT_SMALL = 100;
/** Tiny preview (recent items, top N) */
const QUERY_LIMIT_TINY = 50;

// ── Debounce / throttle ──────────────────────────────────────────────
/** Search input debounce (ms) */
const DEBOUNCE_SEARCH = 300;
/** Form field debounce for dedup / validation (ms) */
const DEBOUNCE_FORM = 800;
/** API call debounce (ms) */
const DEBOUNCE_API = 500;

// ── Animation durations (ms) ─────────────────────────────────────────
const ANIMATION_FAST = 200;
const ANIMATION_DEFAULT = 300;
const ANIMATION_SLOW = 500;
const ANIMATION_CHART = 800;

// ── Misc thresholds ──────────────────────────────────────────────────
/** Recent-item threshold (5 min in ms) */
const RECENT_THRESHOLD = 5 * MS_PER_MINUTE;
/** Max bulk import rows */
const BULK_IMPORT_MAX_ROWS = 1_000;
