import { useEffect, memo, forwardRef } from "react";
import { useLocation } from "react-router-dom";

export const ScrollToTop = memo(forwardRef<HTMLDivElement>(function ScrollToTop(_props, _ref) {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);

  return null;
}));
