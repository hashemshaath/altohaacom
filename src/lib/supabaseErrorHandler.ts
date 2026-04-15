/**
 * Supabase error handling utilities.
 *
 * - Maps Supabase/PostgREST error codes to AppError types
 * - Provides `supabaseQuery` wrapper with timeout + exponential backoff retry
 * - Provides `handleSupabaseError` for normalising raw errors
 */

import { AppError, ErrorCode } from "@/lib/AppError";

/* ─── PostgREST / Postgres error code → AppError mapping ─── */

interface SupabaseRawError {
  message?: string;
  code?: string;
  details?: string;
  hint?: string;
  status?: number;
  statusCode?: number;
}

const PG_ERROR_MAP: Record<string, { code: ErrorCode; message: string }> = {
  // PostgREST
  PGRST116: { code: ErrorCode.NOT_FOUND, message: "Record not found" },
  PGRST301: { code: ErrorCode.SERVER, message: "Row-level security prevented access" },

  // Postgres constraint violations
  "23505": { code: ErrorCode.VALIDATION, message: "A record with this information already exists" },
  "23503": { code: ErrorCode.VALIDATION, message: "This record is referenced by other data" },
  "23502": { code: ErrorCode.VALIDATION, message: "A required field is missing" },
  "23514": { code: ErrorCode.VALIDATION, message: "The data does not meet the required constraints" },

  // Permission
  "42501": { code: ErrorCode.AUTH, message: "You don't have permission to perform this action" },
  "42000": { code: ErrorCode.AUTH, message: "Insufficient privileges" },

  // Auth errors from Supabase GoTrue
  invalid_credentials: { code: ErrorCode.AUTH, message: "Invalid email or password" },
  user_not_found: { code: ErrorCode.AUTH, message: "No account found with these credentials" },
  email_not_confirmed: { code: ErrorCode.AUTH, message: "Please verify your email before signing in" },
  session_not_found: { code: ErrorCode.AUTH, message: "Your session has expired — please sign in again" },
};

/**
 * Normalize a raw Supabase error into an AppError with a user-friendly message.
 *
 * ```ts
 * const { data, error } = await supabase.from("x").select();
 * if (error) throw handleSupabaseError(error);
 * ```
 */
export function handleSupabaseError(raw: unknown): AppError {
  if (raw instanceof AppError) return raw;

  const err = raw as SupabaseRawError;
  const code = err.code ?? "";
  const status = err.status ?? err.statusCode;

  // Check known PG / PostgREST codes
  const mapped = PG_ERROR_MAP[code];
  if (mapped) {
    return new AppError({
      code: mapped.code,
      message: mapped.message,
      cause: raw,
      status,
      detail: code,
    });
  }

  // HTTP status heuristics
  if (status === 401 || status === 403) {
    return status === 401
      ? AppError.unauthorized(err.message ?? "Session expired", raw)
      : AppError.forbidden(err.message ?? "Access denied", raw);
  }
  if (status === 404) return AppError.notFound(err.message, raw);
  if (status && status >= 500) return AppError.server(err.message, raw);

  // Network / timeout heuristics
  const msg = (err.message ?? "").toLowerCase();
  if (msg.includes("fetch") || msg.includes("network") || msg.includes("failed to fetch")) {
    return AppError.network(err.message, raw);
  }
  if (msg.includes("timeout") || msg.includes("aborted")) {
    return AppError.timeout(err.message, raw);
  }

  // Fallback
  return AppError.from(raw);
}

/* ─── Retry + timeout wrapper ─── */

interface QueryOptions {
  /** Max retries for network/server errors. Default: 3 */
  maxRetries?: number;
  /** Request timeout in ms. Default: 10 000 */
  timeoutMs?: number;
  /** Label for dev logs */
  label?: string;
}

const DEFAULT_TIMEOUT = 10_000;
const DEFAULT_MAX_RETRIES = 3;
const BASE_DELAY = 500; // ms

/**
 * Wraps an async Supabase call with:
 *  - Timeout (AbortController-aware where possible)
 *  - Exponential backoff retry for network/server errors
 *
 * ```ts
 * const data = await supabaseQuery(
 *   () => supabase.from("profiles").select("*").eq("id", id).single(),
 *   { label: "fetchProfile" },
 * );
 * ```
 */
export async function supabaseQuery<T>(
  fn: (signal?: AbortSignal) => PromiseLike<{ data: T; error: unknown }>,
  opts?: QueryOptions,
): Promise<T> {
  const maxRetries = opts?.maxRetries ?? DEFAULT_MAX_RETRIES;
  const timeoutMs = opts?.timeoutMs ?? DEFAULT_TIMEOUT;
  const label = opts?.label ?? "supabaseQuery";

  let lastError: AppError | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const { data, error } = await fn(controller.signal);
      clearTimeout(timer);

      if (error) {
        throw handleSupabaseError(error);
      }
      return data;
    } catch (raw: unknown) {
      clearTimeout(timer);
      const appError = raw instanceof AppError ? raw : handleSupabaseError(raw);
      lastError = appError;

      // Only retry on network / server errors
      if (!appError.isRetryable || attempt >= maxRetries) {
        throw appError;
      }

      // Exponential backoff: 500 → 1000 → 2000 ms
      const delay = BASE_DELAY * Math.pow(2, attempt);
      if (import.meta.env.DEV) {
        console.warn(`[${label}] Retry ${attempt + 1}/${maxRetries} in ${delay}ms`, appError.message);
      }
      await new Promise((r) => setTimeout(r, delay));
    }
  }

  // Should never reach here, but satisfy TS
  throw lastError ?? new AppError({ code: ErrorCode.UNKNOWN, message: "Query failed" });
}

/* ─── Session-expiry handler ─── */

/**
 * Call from `onError` callbacks when you detect an auth error.
 * Redirects to /login with a return URL.
 */
export function redirectOnSessionExpiry(error: unknown): boolean {
  const appError = error instanceof AppError ? error : handleSupabaseError(error);
  if (appError.isAuthError && (appError.status === 401 || appError.detail === "session_not_found")) {
    const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.href = `/login?returnTo=${returnUrl}`;
    return true;
  }
  return false;
}
