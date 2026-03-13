import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Simple SW cleanup on first visit after deploy
(async () => {
  try {
    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.allSettled(regs.map((r) => r.unregister()));
    }
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.allSettled(keys.map((k) => caches.delete(k)));
    }
  } catch {
    // ignore
  }
})();

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(<App />);
}
