import { useEffect, memo } from "react";
import { useLocation } from "react-router-dom";

export const ScrollToTop = memo(function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);

  return null;
}
