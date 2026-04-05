import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { pushToDataLayer } from "./useGoogleTracking";

/**
 * Automatically tracks page views on route changes.
 * Logs to ad_user_behaviors and pushes to GTM dataLayer.
 */
export function usePageTracking() {
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    const path = location.pathname;
    const category = detectCategory(path);

    // Log to internal DB (fire-and-forget)
    supabase.from("ad_user_behaviors").insert({
      event_type: "page_view",
      page_url: path,
      page_category: category,
      user_id: user?.id || null,
      session_id: sessionStorage.getItem("ad_session_id") || null,
      device_type: getDeviceType(),
      browser: navigator.userAgent.slice(0, 100),
    }).then(() => {});

    // Push to GTM
    pushToDataLayer("page_view", {
      page_path: path,
      page_category: category,
      userId: user?.id,
    });
  }, [location.pathname, user?.id]);
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

function getDeviceType(): string {
  const w = window.innerWidth;
  if (w < 768) return "mobile";
  if (w < 1024) return "tablet";
  return "desktop";
}
