/**
 * Centralized typed error class for the entire application.
 * Every caught error should be normalized into an AppError before processing.
 */

export const ErrorCode = {
  NETWORK: "NETWORK",
  AUTH: "AUTH",
  VALIDATION: "VALIDATION",
  NOT_FOUND: "NOT_FOUND",
  SERVER: "SERVER",
  UNKNOWN: "UNKNOWN",
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

export interface AppErrorOptions {
  code: ErrorCode;
  message: string;
  /** Original error for stack-trace preservation */
  cause?: unknown;
  /** HTTP status if applicable */
  status?: number;
  /** Machine-readable sub-code for downstream handling */
  detail?: string;
}

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status?: number;
  readonly detail?: string;
  readonly originalError?: unknown;

  constructor(opts: AppErrorOptions) {
    super(opts.message);
    this.name = "AppError";
    this.code = opts.code;
    this.status = opts.status;
    this.detail = opts.detail;
    this.originalError = opts.cause;
  }

  /** True when the user's session is invalid and they should re-authenticate */
  get isAuthError(): boolean {
    return this.code === ErrorCode.AUTH;
  }

  /** True for transient failures worth retrying */
  get isRetryable(): boolean {
    return this.code === ErrorCode.NETWORK || this.code === ErrorCode.SERVER;
  }

  // ── Factory helpers ──────────────────────────────────────────────────

  static network(message = "Network request failed", cause?: unknown): AppError {
    return new AppError({ code: ErrorCode.NETWORK, message, cause });
  }

  static timeout(message = "Request timed out", cause?: unknown): AppError {
    return new AppError({
      code: ErrorCode.NETWORK,
      message,
      cause,
      detail: "TIMEOUT",
    });
  }

  static unauthorized(message = "Session expired — please sign in again", cause?: unknown): AppError {
    return new AppError({ code: ErrorCode.AUTH, message, cause, status: 401 });
  }

  static forbidden(message = "You don't have permission to do this", cause?: unknown): AppError {
    return new AppError({ code: ErrorCode.AUTH, message, cause, status: 403, detail: "FORBIDDEN" });
  }

  static notFound(message = "The requested resource was not found", cause?: unknown): AppError {
    return new AppError({ code: ErrorCode.NOT_FOUND, message, cause, status: 404 });
  }

  static server(message = "An unexpected server error occurred", cause?: unknown): AppError {
    return new AppError({ code: ErrorCode.SERVER, message, cause, status: 500 });
  }

  static validation(message: string, cause?: unknown): AppError {
    return new AppError({ code: ErrorCode.VALIDATION, message, cause, status: 422 });
  }

  // ── Normalizer ───────────────────────────────────────────────────────

  /** Convert any thrown value into a typed AppError */
  static from(error: unknown): AppError {
    if (error instanceof AppError) return error;

    // Supabase / fetch errors often carry a `status` or `code` field
    const status = (error as { status?: number })?.status;
    const code = (error as { code?: string })?.code;
    const message =
      error instanceof Error
        ? error.message
        : typeof error === "string"
          ? error
          : "An unexpected error occurred";

    // Network / timeout heuristics
    if (
      code === "ECONNABORTED" ||
      code === "TIMEOUT" ||
      message.toLowerCase().includes("timeout") ||
      message.toLowerCase().includes("network")
    ) {
      return AppError.timeout(message, error);
    }

    // HTTP-status mapping
    if (status === 401) return AppError.unauthorized(message, error);
    if (status === 403) return AppError.forbidden(message, error);
    if (status === 404) return AppError.notFound(message, error);
    if (status && status >= 500) return AppError.server(message, error);
    if (status === 422 || status === 400) return AppError.validation(message, error);

    return new AppError({ code: ErrorCode.UNKNOWN, message, cause: error, status });
  }
}
