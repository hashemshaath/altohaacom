import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const SESSION_KEY = "altoha_seo_session";

function getSessionId(): string {
  let sid = sessionStorage.getItem(SESSION_KEY);
  if (!sid) {
    sid = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, sid);
  }
  return sid;
}

function getDeviceType(): string {
  const w = window.innerWidth;
  if (w < 768) return "mobile";
  if (w < 1024) return "tablet";
  return "desktop";
}

// Known crawler user-agent patterns
const CRAWLER_PATTERNS: { pattern: RegExp; name: string; type: string }[] = [
  { pattern: /Googlebot/i, name: "Googlebot", type: "search_engine" },
  { pattern: /Googlebot-Image/i, name: "Googlebot-Image", type: "search_engine" },
  { pattern: /Googlebot-Video/i, name: "Googlebot-Video", type: "search_engine" },
  { pattern: /Googlebot-News/i, name: "Googlebot-News", type: "search_engine" },
  { pattern: /Google-InspectionTool/i, name: "Google-InspectionTool", type: "search_engine" },
  { pattern: /Storebot-Google/i, name: "Storebot-Google", type: "search_engine" },
  { pattern: /AdsBot-Google/i, name: "AdsBot-Google", type: "ads" },
  { pattern: /Mediapartners-Google/i, name: "Mediapartners-Google", type: "ads" },
  { pattern: /bingbot/i, name: "Bingbot", type: "search_engine" },
  { pattern: /msnbot/i, name: "MSNBot", type: "search_engine" },
  { pattern: /Slurp/i, name: "Yahoo Slurp", type: "search_engine" },
  { pattern: /DuckDuckBot/i, name: "DuckDuckBot", type: "search_engine" },
  { pattern: /Baiduspider/i, name: "Baiduspider", type: "search_engine" },
  { pattern: /YandexBot/i, name: "YandexBot", type: "search_engine" },
  { pattern: /Sogou/i, name: "Sogou", type: "search_engine" },
  { pattern: /facebookexternalhit/i, name: "Facebook", type: "social" },
  { pattern: /Twitterbot/i, name: "Twitter", type: "social" },
  { pattern: /LinkedInBot/i, name: "LinkedIn", type: "social" },
  { pattern: /WhatsApp/i, name: "WhatsApp", type: "social" },
  { pattern: /TelegramBot/i, name: "Telegram", type: "social" },
  { pattern: /Discordbot/i, name: "Discord", type: "social" },
  { pattern: /PinterestBot/i, name: "Pinterest", type: "social" },
  { pattern: /Applebot/i, name: "Applebot", type: "search_engine" },
  { pattern: /SemrushBot/i, name: "SemrushBot", type: "seo_tool" },
  { pattern: /AhrefsBot/i, name: "AhrefsBot", type: "seo_tool" },
  { pattern: /MJ12bot/i, name: "Majestic", type: "seo_tool" },
  { pattern: /DotBot/i, name: "DotBot", type: "seo_tool" },
  { pattern: /PetalBot/i, name: "PetalBot", type: "search_engine" },
  { pattern: /GPTBot/i, name: "GPTBot", type: "ai" },
  { pattern: /ChatGPT-User/i, name: "ChatGPT", type: "ai" },
  { pattern: /Claude-Web/i, name: "Claude", type: "ai" },
  { pattern: /Bytespider/i, name: "Bytespider", type: "ai" },
  { pattern: /CCBot/i, name: "CCBot", type: "ai" },
];

function detectCrawler(ua: string): { name: string; type: string } | null {
  for (const c of CRAWLER_PATTERNS) {
    if (c.pattern.test(ua)) return { name: c.name, type: c.type };
  }
  return null;
}

/**
 * Tracks page views for SEO analytics.
 * Detects crawler/bot visits and logs them separately.
 */
export function useSEOTracking() {
  const location = useLocation();
  const startTime = useRef(Date.now());
  const lastPath = useRef<string | null>(null);
  const lastViewId = useRef<string | null>(null);

  useEffect(() => {
    const path = location.pathname;

    // Skip admin, auth, and API paths
    if (path.startsWith("/admin") || path.startsWith("/auth") || path.startsWith("/api")) {
      return;
    }

    const ua = navigator.userAgent;
    const crawler = detectCrawler(ua);

    // If it's a crawler, log to crawler visits table instead
    if (crawler) {
      const crawlerRecord = {
        path,
        crawler_name: crawler.name,
        crawler_type: crawler.type,
        user_agent: ua.slice(0, 500),
        device_type: getDeviceType(),
      };
      supabase.from("seo_crawler_visits").insert(crawlerRecord).then(() => {});
      return; // Don't count crawlers as regular page views
    }

    // Update duration of previous page view
    if (lastViewId.current && lastPath.current !== path) {
      const duration = Math.round((Date.now() - startTime.current) / 1000);
      const isBounce = duration < 10;
      supabase
        .from("seo_page_views")
        .update({ duration_seconds: duration, is_bounce: isBounce })
        .eq("id", lastViewId.current)
        .then(() => {});
    }

    // Record new page view
    startTime.current = Date.now();
    lastPath.current = path;

    const record = {
      path,
      title: document.title,
      referrer: document.referrer || null,
      user_agent: ua,
      device_type: getDeviceType(),
      session_id: getSessionId(),
    };

    supabase
      .from("seo_page_views")
      .insert(record)
      .select("id")
      .single()
      .then(({ data }) => {
        if (data?.id) lastViewId.current = data.id;
      });

    // Update duration on page unload
    const handleUnload = () => {
      if (lastViewId.current) {
        const duration = Math.round((Date.now() - startTime.current) / 1000);
        const isBounce = duration < 10;
        const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/seo_page_views?id=eq.${lastViewId.current}`;
        const headers = {
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          Prefer: "return=minimal",
        };
        fetch(url, {
          method: "PATCH",
          headers,
          body: JSON.stringify({ duration_seconds: duration, is_bounce: isBounce }),
          keepalive: true,
        }).catch(() => {});
      }
    };

    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, [location.pathname]);
}
