import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const SW_RECOVERY_VERSION = "2026-03-12-v1";

async function recoverFromStalePwaCache(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (!("serviceWorker" in navigator) || !("caches" in window)) return false;

  const recoveryKey = `altoha-sw-recovery-${SW_RECOVERY_VERSION}`;

  try {
    if (localStorage.getItem(recoveryKey) === "done") return false;

    const registrations = await navigator.serviceWorker.getRegistrations();
    if (registrations.length === 0) {
      localStorage.setItem(recoveryKey, "done");
      return false;
    }

    await Promise.allSettled(registrations.map((registration) => registration.unregister()));
    const cacheNames = await caches.keys();
    await Promise.allSettled(cacheNames.map((cacheName) => caches.delete(cacheName)));

    localStorage.setItem(recoveryKey, "done");
    window.location.reload();
    return true;
  } catch {
    return false;
  }
}

async function mountApp() {
  const recoveryTriggered = await recoverFromStalePwaCache();
  if (recoveryTriggered) return;

  const root = document.getElementById("root");
  if (!root) {
    console.error("Root element not found");
    return;
  }

  const reactRoot = createRoot(root);
  reactRoot.render(<App />);

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
