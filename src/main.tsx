import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Non-blocking SW cleanup
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then((regs) =>
    regs.forEach((r) => r.unregister())
  ).catch(() => {});
}

// Mount React immediately
const root = document.getElementById("root");
if (root) {
  createRoot(root).render(<App />);
}
