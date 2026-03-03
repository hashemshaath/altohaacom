import "./index.css";

async function bootstrap() {
  try {
    const { createRoot } = await import("react-dom/client");
    const { default: App } = await import("./App.tsx");
    const root = document.getElementById("root");
    if (!root) throw new Error("Root element not found");
    createRoot(root).render(<App />);
  } catch (err: any) {
    console.error("Bootstrap error:", err);
    const root = document.getElementById("root");
    if (root) {
      root.innerHTML = `<div style="padding:2rem;font-family:system-ui;text-align:center">
        <h2>Failed to load application</h2>
        <p style="color:#666">${err?.message || "Unknown error"}</p>
        <button onclick="location.reload()" style="margin-top:1rem;padding:8px 16px;cursor:pointer">Reload</button>
      </div>`;
    }
  }
}

bootstrap();
