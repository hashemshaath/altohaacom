import { useEffect, useRef, forwardRef, memo } from "react";
import { useLocation } from "react-router-dom";

/**
 * Announces route changes to screen readers via a live region.
 */
export const RouteAnnouncer = memo(forwardRef<HTMLDivElement>(function RouteAnnouncer(_props, _ref) {
  const location = useLocation();
  const announcerRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const title = document.title || location.pathname.replace(/\//g, " ").trim() || "Page";

    if (announcerRef.current) {
      announcerRef.current.textContent = `Navigated to ${title}`;
    }

    const main = document.getElementById("main-content");
    if (main) {
      main.setAttribute("tabindex", "-1");
      main.focus({ preventScroll: true });
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
}));
