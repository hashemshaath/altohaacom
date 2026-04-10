import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { getDeviceType } from "@/lib/deviceType";
import { getSessionId } from "@/lib/analyticsUtils";
import { queueAnalyticsInsert } from "@/lib/analyticsBatcher";

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
 * Uses batched writes to reduce network overhead.
 * Detects crawler/bot visits and logs them separately.
 */
export function useSEOTracking() {
  const location = useLocation();
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    const path = location.pathname;

    // Skip admin, auth, and API paths
    if (path.startsWith("/admin") || path.startsWith("/auth") || path.startsWith("/api")) {
      return;
    }

    // Avoid duplicate tracking for same path
    if (lastPath.current === path) return;
    lastPath.current = path;

    const ua = navigator.userAgent;
    const crawler = detectCrawler(ua);

    if (crawler) {
      queueAnalyticsInsert("seo_crawler_visits", {
        path,
        crawler_name: crawler.name,
        crawler_type: crawler.type,
        user_agent: ua.slice(0, 500),
        device_type: getDeviceType(),
      });
      return;
    }

    queueAnalyticsInsert("seo_page_views", {
      path,
      title: document.title,
      referrer: document.referrer || null,
      user_agent: ua,
      device_type: getDeviceType(),
      session_id: getSessionId(),
    });
  }, [location.pathname]);
}
