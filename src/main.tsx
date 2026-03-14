import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

console.log("[boot] main.tsx executing");

// Non-blocking SW cleanup
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then((regs) =>
    regs.forEach((r) => r.unregister())
  ).catch(() => {});
}

// Mount React immediately
const root = document.getElementById("root");
if (root) {
  console.log("[boot] mounting React app");
  createRoot(root).render(<App />);
} else {
  console.error("[boot] #root element not found!");
}
