import { useCallback } from "react";
import { AppError, ErrorCode } from "@/lib/AppError";
import { toast } from "sonner";

/**
 * User-facing messages per error code (bilingual support can be added later).
 * Kept short & actionable.
 */
const USER_MESSAGES: Record<ErrorCode, string> = {
  NETWORK: "Connection problem — please check your internet and try again.",
  AUTH: "Your session has expired. Please sign in again.",
  VALIDATION: "Some information is invalid — please check and try again.",
  NOT_FOUND: "The requested item could not be found.",
  SERVER: "Something went wrong on our end. Please try again later.",
  UNKNOWN: "An unexpected error occurred.",
};

interface ErrorHandlerOptions {
  /** Override the default toast message */
  fallbackMessage?: string;
  /** Suppress the toast entirely (e.g. for silent background errors) */
  silent?: boolean;
  /** Callback after the error is processed (e.g. redirect on 401) */
  onAuth?: () => void;
}

/**
 * Centralized error handler hook.
 *
 * Usage:
 * ```ts
 * const handleError = useErrorHandler();
 * try { await doStuff(); } catch (e) { handleError(e); }
 * ```
 */
export function useErrorHandler(defaults?: ErrorHandlerOptions) {
  const handleError = useCallback(
    (error: unknown, overrides?: ErrorHandlerOptions) => {
      const opts = { ...defaults, ...overrides };
      const appError = AppError.from(error);

      // ── Logging ────────────────────────────────────────────────────
      if (import.meta.env.DEV) {
        console.error(`[AppError:${appError.code}]`, appError.message, appError.cause ?? "");
      }

      // ── Auth redirect hook ─────────────────────────────────────────
      if (appError.isAuthError && opts.onAuth) {
        opts.onAuth();
      }

      // ── User-facing toast ──────────────────────────────────────────
      if (!opts.silent) {
        const message = opts.fallbackMessage ?? USER_MESSAGES[appError.code];
        toast.error(message);
      }

      return appError;
    },
    [defaults],
  );

  return handleError;
}
