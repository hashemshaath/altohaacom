import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const SW_RECOVERY_VERSION = "2026-03-12-v16";

function safeStorageGet(storage: Storage, key: string): string | null {
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

function safeStorageSet(storage: Storage, key: string, value: string): void {
  try {
    storage.setItem(key, value);
  } catch {
    // no-op for restricted environments
  }
}

function shouldForceRecovery(): boolean {
  if (typeof window === "undefined") return false;
  const params = new URLSearchParams(window.location.search);
  return params.has("sw-reset") || params.has("reset-cache") || params.has("boot-retry");
}

function isChunkLoadFailure(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? "");
  return /ChunkLoadError|Loading chunk\s+\S+\s+failed|Failed to fetch dynamically imported module|Importing a module script failed|dynamically imported module/i.test(
    message
  );
}

function showEmergencyStartupFallback(): void {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  const root = document.getElementById("root");
  if (!root || root.dataset.startupFallback === "shown") return;

  root.dataset.startupFallback = "shown";
  root.innerHTML = `
    <main class="min-h-screen bg-background text-foreground flex items-center justify-center p-4" role="main" aria-live="polite">
      <section class="w-full max-w-lg rounded-2xl border border-border bg-card p-6 text-center shadow-[var(--shadow-lg)]">
        <h1 class="text-2xl font-bold">We’re restoring the homepage</h1>
        <p class="mt-2 text-sm text-muted-foreground">A startup error blocked rendering. You can retry now, or run a full cache reset.</p>
        <div class="mt-5 flex flex-wrap items-center justify-center gap-2">
          <button id="boot-reload-btn" class="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Retry</button>
          <button id="boot-reset-btn" class="inline-flex items-center justify-center rounded-lg border border-border bg-secondary px-4 py-2 text-sm font-semibold text-secondary-foreground">Reset cache</button>
        </div>
      </section>
    </main>
  `;

  document.getElementById("boot-reload-btn")?.addEventListener("click", () => {
    window.location.reload();
  });

  document.getElementById("boot-reset-btn")?.addEventListener("click", () => {
    const url = new URL(window.location.href);
    url.searchParams.set("sw-reset", "1");
    url.searchParams.set("boot-retry", SW_RECOVERY_VERSION);
    window.location.replace(url.toString());
  });
}

function registerChunkRecovery(): void {
  if (typeof window === "undefined") return;

  const chunkRecoveryKey = `altoha-chunk-recovery-${SW_RECOVERY_VERSION}`;

  const recover = async (reason: unknown) => {
    if (!isChunkLoadFailure(reason)) return;

    try {
      if (window.sessionStorage.getItem(chunkRecoveryKey) === "triggered") return;
      window.sessionStorage.setItem(chunkRecoveryKey, "triggered");
    } catch {
      // no-op for restricted browsers
    }

    const recovered = await recoverFromStalePwaCache(true);
    if (!recovered) {
      const url = new URL(window.location.href);
      const retriedForCurrentVersion = url.searchParams.get("boot-retry") === SW_RECOVERY_VERSION;

      if (!retriedForCurrentVersion) {
        url.searchParams.set("sw-reset", "1");
        url.searchParams.set("boot-retry", SW_RECOVERY_VERSION);
        window.location.replace(url.toString());
        return;
      }

      showEmergencyStartupFallback();
    }
  };

  window.addEventListener("error", (event) => {
    void recover(event.error ?? event.message);
  });

  window.addEventListener("unhandledrejection", (event) => {
    void recover(event.reason);
  });
}

async function recoverFromStalePwaCache(force = false): Promise<boolean> {
...
function hasActiveLoadingFallback(): boolean {
  if (typeof document === "undefined") return false;

  const main = document.getElementById("main-content");
  if (!main) return false;

  return Boolean(main.querySelector('[role="status"][aria-label="Loading"], [aria-busy="true"]'));
}

function scheduleBootWatchdog(): void {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  const watchdogKey = `altoha-boot-watchdog-${SW_RECOVERY_VERSION}`;

  try {
    if (window.sessionStorage.getItem(watchdogKey) === "triggered") return;
  } catch {
    // continue without persistent watchdog state
  }

  const attemptRecovery = async () => {
    try {
      window.sessionStorage.setItem(watchdogKey, "triggered");
    } catch {
      // no-op for restricted browsers
    }

    const recovered = await recoverFromStalePwaCache(true);
    if (!recovered) {
      const url = new URL(window.location.href);
      const retriedForCurrentVersion = url.searchParams.get("boot-retry") === SW_RECOVERY_VERSION;
      if (!retriedForCurrentVersion) {
        url.searchParams.set("sw-reset", "1");
        url.searchParams.set("boot-retry", SW_RECOVERY_VERSION);
        window.location.replace(url.toString());
        return;
      }

      showEmergencyStartupFallback();
    }
  };

  window.setTimeout(() => {
    if (isAppBootReady() && hasRenderableHomeContent()) return;
    if (document.visibilityState === "hidden") return;

    if (hasActiveLoadingFallback()) {
      window.setTimeout(() => {
        if (isAppBootReady() && hasRenderableHomeContent()) return;
        if (document.visibilityState === "hidden") return;
        void attemptRecovery();
      }, 5000);
      return;
    }

    void attemptRecovery();
  }, 7000);
}


async function mountApp() {
  registerChunkRecovery();

  const recoveryTriggered = await recoverFromStalePwaCache(shouldForceRecovery());
  if (recoveryTriggered) return;

  const root = document.getElementById("root");
  if (!root) {
    console.error("Root element not found");
    return;
  }

  const reactRoot = createRoot(root);
  reactRoot.render(<App />);
  scheduleBootWatchdog();

  // Report paint timing for debugging
  if (import.meta.env.DEV) {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === "first-contentful-paint") {
          console.log(`⚡ FCP: ${Math.round(entry.startTime)}ms`);
        }
      }
    });
    try {
      observer.observe({ type: "paint", buffered: true });
    } catch {}
  }
}

void mountApp();
