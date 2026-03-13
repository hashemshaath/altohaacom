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
      url.searchParams.set("sw-reset", "1");
      url.searchParams.set("boot-retry", SW_RECOVERY_VERSION);
      window.location.replace(url.toString());
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
  if (typeof window === "undefined") return false;
  if (!("serviceWorker" in navigator) || !("caches" in window)) return false;

  const recoveryKey = `altoha-sw-recovery-${SW_RECOVERY_VERSION}`;

  try {
    if (!force && safeStorageGet(window.localStorage, recoveryKey) === "done") return false;

    const registrations = await navigator.serviceWorker.getRegistrations();
    const hasRegistrations = registrations.length > 0;

    if (!hasRegistrations && !force) {
      safeStorageSet(window.localStorage, recoveryKey, "done");
      return false;
    }

    if (hasRegistrations) {
      await Promise.allSettled(registrations.map((registration) => registration.unregister()));
    }

    const cacheNames = await caches.keys();
    await Promise.allSettled(cacheNames.map((cacheName) => caches.delete(cacheName)));

    safeStorageSet(window.localStorage, recoveryKey, "done");

    if (force) {
      const url = new URL(window.location.href);
      url.searchParams.delete("sw-reset");
      url.searchParams.delete("reset-cache");
      url.searchParams.delete("boot-retry");
      window.location.replace(url.toString());
    } else {
      window.location.reload();
    }

    return true;
  } catch {
    return false;
  }
}

function isAppBootReady(): boolean {
  if (typeof document === "undefined") return false;
  return document.documentElement.getAttribute("data-app-boot") === "ready";
}

function hasRenderableHomeContent(): boolean {
  if (typeof window === "undefined" || typeof document === "undefined") return true;
  if (window.location.pathname !== "/") return true;

  const main = document.getElementById("main-content");
  if (!main) return false;

  const rect = main.getBoundingClientRect();
  const hasHeight = rect.height > 160;
  const hasContent = (main.textContent?.trim().length || 0) > 20;

  return hasHeight && hasContent;
}

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
      }
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
