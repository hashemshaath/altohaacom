import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { pushToDataLayer } from "./useGoogleTracking";

/**
 * Pushes page_view events to GTM dataLayer on route changes.
 * 
 * NOTE: DB logging for page views is handled by:
 * - useSEOTracking → seo_page_views (global, in AppContent)
 * - useAdTracking → ad_user_behaviors (per-page, where used)
 * This hook only handles GTM/dataLayer to avoid duplicate DB inserts.
 */
export function usePageTracking() {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    const category = detectCategory(path);

    // Push to GTM only — DB logging handled by dedicated hooks
    pushToDataLayer("page_view", {
      page_path: path,
      page_category: category,
    });
  }, [location.pathname]);
}

function detectCategory(path: string): string {
  if (path === "/" || path === "") return "home";
  const segment = path.split("/").filter(Boolean)[0];
  const map: Record<string, string> = {
    competitions: "competitions",
    community: "community",
    recipes: "recipes",
    shop: "shop",
    articles: "articles",
    masterclasses: "masterclasses",
    exhibitions: "exhibitions",
    knowledge: "knowledge",
    mentorship: "mentorship",
    "chefs-table": "chefs-table",
    profile: "profile",
    admin: "admin",
    company: "company",
  };
  return map[segment] || "other";
}
