import { useState, useEffect, useCallback } from "react";
import { MS_PER_WEEK } from "@/lib/constants";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/** Minimum page views before showing install prompt */
const MIN_INTERACTIONS = 3;
const INTERACTION_KEY = "pwa_interaction_count";
const DISMISS_KEY = "pwa_banner_dismissed";

function getInteractionCount(): number {
  try { return parseInt(localStorage.getItem(INTERACTION_KEY) || "0", 10); }
  catch { return 0; }
}

function incrementInteraction(): number {
  try {
    const count = getInteractionCount() + 1;
    localStorage.setItem(INTERACTION_KEY, String(count));
    return count;
  } catch { return 0; }
}

function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [hasEnoughInteraction, setHasEnoughInteraction] = useState(
    () => getInteractionCount() >= MIN_INTERACTIONS
  );
  const [dismissed, setDismissed] = useState(() => {
    try {
      const ts = localStorage.getItem(DISMISS_KEY);
      if (!ts) return false;
      return Date.now() - parseInt(ts) < MS_PER_WEEK;
    } catch { return false; }
  });

  // Track page navigations as meaningful interactions
  useEffect(() => {
    const count = incrementInteraction();
    if (count >= MIN_INTERACTIONS) setHasEnoughInteraction(true);
  }, []);

  useEffect(() => {
    // Check standalone mode (covers iOS)
    if (
      window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in navigator && (navigator as { standalone?: boolean }).standalone)
    ) {
      setIsInstalled(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setIsInstalled(true);
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    if (!deferredPrompt) return false;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    if (outcome === "accepted") setIsInstalled(true);
    return outcome === "accepted";
  }, [deferredPrompt]);

  const dismiss = useCallback(() => {
    setDismissed(true);
    try { localStorage.setItem(DISMISS_KEY, Date.now().toString()); } catch { /* restricted */ }
  }, []);

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) &&
    !("MSStream" in window);

  return {
    canInstall: hasEnoughInteraction && !isInstalled && !dismissed && (!!deferredPrompt || isIOS),
    isInstalled,
    install,
    dismiss,
    isIOS,
    /** True when browser supports native install prompt (not iOS) */
    hasNativePrompt: !!deferredPrompt,
  };
}

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  return isOnline;
}

function usePWAUpdate() {
  const [needsUpdate, setNeedsUpdate] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    let cancelled = false;
    let reg: ServiceWorkerRegistration | null = null;
    let newSW: ServiceWorker | null = null;

    const onStateChange = () => {
      if (newSW?.state === "installed" && navigator.serviceWorker.controller) {
        setNeedsUpdate(true);
      }
    };
    const onUpdateFound = () => {
      newSW = reg?.installing ?? null;
      if (!newSW) return;
      newSW.addEventListener("statechange", onStateChange);
    };

    const check = async () => {
      reg = (await navigator.serviceWorker.getRegistration()) ?? null;
      if (!reg || cancelled) return;
      setRegistration(reg);
      reg.addEventListener("updatefound", onUpdateFound);
    };
    check().then(null, () => {});

    return () => {
      cancelled = true;
      reg?.removeEventListener("updatefound", onUpdateFound);
      newSW?.removeEventListener("statechange", onStateChange);
    };
  }, []);

  const update = useCallback(() => {
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: "SKIP_WAITING" });
    }
    window.location.reload();
  }, [registration]);

  return { needsUpdate, update };
}

export { useInstallPrompt, usePWAUpdate };
export type { BeforeInstallPromptEvent };
