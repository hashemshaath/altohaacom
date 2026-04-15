/* ─── Lightweight error tracking ─── */

interface ErrorReport {
  message: string;
  stack?: string;
  url: string;
  timestamp: string;
  userAgent: string;
}

function reportError(error: Error, context?: Record<string, unknown>): void {
  if (import.meta.env.DEV) {
    console.error("[Error Report]", error, context);
    return;
  }

  const _report: ErrorReport = {
    message: error.message,
    stack: error.stack,
    url: window.location.href,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
  };

  // Ready for Sentry / custom endpoint:
  // Sentry.captureException(error, { extra: { ...context, ..._report } });
  void _report; // suppress unused warning until endpoint is wired
}

/** Attach global handlers — call once at app startup */
export function initErrorTracking(): void {
  window.addEventListener("error", (event) => {
    reportError(event.error || new Error(event.message));
  });

  window.addEventListener("unhandledrejection", (event) => {
    reportError(
      event.reason instanceof Error ? event.reason : new Error(String(event.reason))
    );
  });
}
