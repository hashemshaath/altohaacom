import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const root = document.getElementById("root");
if (root) {
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
    try { observer.observe({ type: "paint", buffered: true }); } catch {}
  }
} else {
  console.error("Root element not found");
}
