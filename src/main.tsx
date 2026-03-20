import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

const root = document.getElementById("root");
const CHUNK_RELOAD_KEY = "altoha-chunk-reload-once";

const getChunkReloaded = () => {
  try {
    return window.sessionStorage.getItem(CHUNK_RELOAD_KEY) === "1";
  } catch {
    return false;
  }
};

const setChunkReloaded = (value: boolean) => {
  try {
    if (value) {
      window.sessionStorage.setItem(CHUNK_RELOAD_KEY, "1");
    } else {
      window.sessionStorage.removeItem(CHUNK_RELOAD_KEY);
    }
  } catch {
    // Ignore restricted storage environments
  }
};

const mountEmergencyFallback = (message: string) => {
  if (!root) return;
  root.innerHTML = `
    <div style="display:flex;min-height:100vh;align-items:center;justify-content:center;padding:24px;background:#fff;font-family:system-ui,sans-serif">
      <div style="max-width:460px;text-align:center">
        <h1 style="margin:0 0 8px;font-size:22px;color:#111">App failed to start</h1>
        <p style="margin:0 0 16px;color:#555;line-height:1.5">${message}</p>
        <button id="boot-retry" style="border:0;border-radius:10px;padding:10px 16px;background:#111;color:#fff;cursor:pointer;font-weight:600">Reload</button>
      </div>
    </div>
  `;
  const retry = document.getElementById("boot-retry");
  retry?.addEventListener("click", () => window.location.reload());
};

const handleBootFailure = (message: string) => {
  if (document.documentElement.getAttribute("data-app-boot") === "ready") return;
  mountEmergencyFallback(message);
};

window.addEventListener("error", (event) => {
  handleBootFailure(event.message || "A startup error occurred.");
});

window.addEventListener("unhandledrejection", (event) => {
  const reason = event.reason instanceof Error ? event.reason.message : "A startup promise failed.";
  handleBootFailure(reason);
});

window.addEventListener("vite:preloadError", (event: Event) => {
  const viteEvent = event as Event & { payload?: unknown; preventDefault?: () => void };
  viteEvent.preventDefault?.();

  if (!getChunkReloaded()) {
    setChunkReloaded(true);
    window.location.reload();
    return;
  }

  const message =
    viteEvent.payload instanceof Error
      ? viteEvent.payload.message
      : "Failed to load the latest app files.";

  handleBootFailure(message);
});

const cleanupLegacyRuntime = async () => {
  const cleanups: Promise<unknown>[] = [];

  if ("serviceWorker" in navigator) {
    cleanups.push(
      navigator.serviceWorker
        .getRegistrations()
        .then((registrations) => Promise.allSettled(registrations.map((registration) => registration.unregister())))
    );
  }

  if ("caches" in window) {
    cleanups.push(
      caches
        .keys()
        .then((keys) => Promise.allSettled(keys.map((key) => caches.delete(key))))
    );
  }

  await Promise.allSettled(cleanups);
};

void cleanupLegacyRuntime();

if (!root) {
  console.error("[boot] #root element not found");
} else {
  createRoot(root).render(<App />);
}
