import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

/**
 * Announces route changes to screen readers via a live region.
 * Also manages focus: moves focus to the main content area on navigation.
 */
export function RouteAnnouncer() {
  const location = useLocation();
  const announcerRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // Derive page title from document or path
    const title = document.title || location.pathname.replace(/\//g, " ").trim() || "Page";

    // Announce to screen readers
    if (announcerRef.current) {
      announcerRef.current.textContent = `Navigated to ${title}`;
    }

    // Move focus to main content for keyboard users
    const main = document.getElementById("main-content");
    if (main) {
      main.setAttribute("tabindex", "-1");
      main.focus({ preventScroll: true });
      // Remove tabindex after focus so it doesn't interfere with natural tab order
      const cleanup = () => main.removeAttribute("tabindex");
      main.addEventListener("blur", cleanup, { once: true });
    }
  }, [location.pathname]);

  return (
    <div
      ref={announcerRef}
      role="status"
      aria-live="assertive"
      aria-atomic="true"
      className="sr-only"
    />
  );
}
