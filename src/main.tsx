import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const SW_RECOVERY_VERSION = "2026-03-12-v6";

function shouldForceRecovery(): boolean {
  if (typeof window === "undefined") return false;
  const params = new URLSearchParams(window.location.search);
  return params.has("sw-reset") || params.has("reset-cache");
}

async function recoverFromStalePwaCache(force = false): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (!("serviceWorker" in navigator) || !("caches" in window)) return false;

  const recoveryKey = `altoha-sw-recovery-${SW_RECOVERY_VERSION}`;

  try {
    if (!force && localStorage.getItem(recoveryKey) === "done") return false;

    const registrations = await navigator.serviceWorker.getRegistrations();
    const hasRegistrations = registrations.length > 0;

    if (!hasRegistrations && !force) {
      localStorage.setItem(recoveryKey, "done");
      return false;
    }

    if (hasRegistrations) {
      await Promise.allSettled(registrations.map((registration) => registration.unregister()));
    }

    const cacheNames = await caches.keys();
    await Promise.allSettled(cacheNames.map((cacheName) => caches.delete(cacheName)));

    localStorage.setItem(recoveryKey, "done");

    if (force) {
      const url = new URL(window.location.href);
      url.searchParams.delete("sw-reset");
      url.searchParams.delete("reset-cache");
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

function scheduleBootWatchdog(): void {
  if (typeof window === "undefined") return;

  const watchdogKey = `altoha-boot-watchdog-${SW_RECOVERY_VERSION}`;

  try {
    if (window.sessionStorage.getItem(watchdogKey) === "triggered") return;
  } catch {
    return;
  }

  window.setTimeout(async () => {
    if (isAppBootReady() && hasRenderableHomeContent()) return;

    try {
      window.sessionStorage.setItem(watchdogKey, "triggered");
    } catch {
      // no-op for restricted browsers
    }

    await recoverFromStalePwaCache(true);
  }, 7000);
}

async function mountApp() {
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
