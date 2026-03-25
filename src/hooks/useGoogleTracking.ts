import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Reads active Google integrations from `integration_settings`
 * and dynamically injects the appropriate scripts.
 *
 * NOTE: GTM (GTM-M76WXJCC) and GA4 (G-F96L8LZWR7) are hardcoded in index.html
 * for crawler/verification compatibility. This hook handles any *additional*
 * IDs configured via admin and other platforms (Ads, AdSense, Search Console).
 */

const GOOGLE_TYPES = [
  "google_analytics",
  "google_tag_manager",
  "google_ads",
  "google_adsense",
  "google_search_console",
];

export function useGoogleTracking() {
  const injected = useRef(false);

  const { data: configs } = useQuery({
    queryKey: ["integration-settings-google-active"],
    queryFn: async () => {
      const { data } = await supabase
        .from("integration_settings")
        .select("integration_type, config, is_active")
        .eq("is_active", true)
        .in("integration_type", GOOGLE_TYPES);
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (!configs || configs.length === 0 || injected.current) return;
    injected.current = true;

    configs.forEach((row: any) => {
      const cfg = (typeof row.config === "string" ? JSON.parse(row.config) : row.config) || {};

      switch (row.integration_type) {
        case "google_analytics":
          if (cfg.measurement_id) injectGA4(cfg.measurement_id);
          break;
        case "google_tag_manager":
          if (cfg.container_id) injectGTM(cfg.container_id);
          break;
        case "google_ads":
          if (cfg.conversion_id) injectGoogleAds(cfg.conversion_id);
          break;
        case "google_adsense":
          if (cfg.publisher_id) injectAdSense(cfg.publisher_id);
          break;
        case "google_search_console":
          if (cfg.verification_code) injectSearchConsoleVerification(cfg.verification_code);
          break;
      }
    });
  }, [configs]);
}

/* ── GA4 ── */
function injectGA4(measurementId: string) {
  // Skip if already present (hardcoded or previously injected)
  if (document.querySelector(`script[src*="gtag/js?id=${measurementId}"]`)) return;

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);

  const inline = document.createElement("script");
  inline.textContent = `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${measurementId}', { send_page_view: true });
  `;
  document.head.appendChild(inline);
}

/* ── GTM ── */
function injectGTM(containerId: string) {
  // Skip if already present (hardcoded or previously injected)
  if (document.querySelector(`script[src*="gtm.js?id=${containerId}"]`)) return;

  const script = document.createElement("script");
  script.textContent = `
    (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
    new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
    j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
    'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
    })(window,document,'script','dataLayer','${containerId}');
  `;
  document.head.appendChild(script);

  const noscript = document.createElement("noscript");
  const iframe = document.createElement("iframe");
  iframe.src = `https://www.googletagmanager.com/ns.html?id=${containerId}`;
  iframe.height = "0";
  iframe.width = "0";
  iframe.style.display = "none";
  iframe.style.visibility = "hidden";
  noscript.appendChild(iframe);
  document.body.insertBefore(noscript, document.body.firstChild);
}

/* ── Google Ads ── */
function injectGoogleAds(conversionId: string) {
  if (document.querySelector(`script[src*="gtag/js?id=${conversionId}"]`)) return;

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${conversionId}`;
  document.head.appendChild(script);

  const inline = document.createElement("script");
  inline.textContent = `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${conversionId}');
  `;
  document.head.appendChild(inline);
}

/* ── AdSense ── */
function injectAdSense(publisherId: string) {
  if (document.querySelector(`script[data-ad-client="${publisherId}"]`)) return;

  const script = document.createElement("script");
  script.async = true;
  script.crossOrigin = "anonymous";
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${publisherId}`;
  script.setAttribute("data-ad-client", publisherId);
  document.head.appendChild(script);
}

/* ── Search Console Verification ── */
function injectSearchConsoleVerification(code: string) {
  if (document.querySelector('meta[name="google-site-verification"]')) return;

  const meta = document.createElement("meta");
  meta.name = "google-site-verification";
  meta.content = code;
  document.head.appendChild(meta);
}

/* ── Helpers ── */

/** Send conversion events to Google gtag */
export function sendGoogleConversion(eventName: string, params?: Record<string, unknown>) {
  if (typeof window !== "undefined" && (window as any).gtag) {
    (window as any).gtag("event", eventName, params);
  }
}

/** Push events to GTM dataLayer */
export function pushToDataLayer(event: string, data?: Record<string, unknown>) {
  if (typeof window !== "undefined") {
    (window as any).dataLayer = (window as any).dataLayer || [];
    (window as any).dataLayer.push({ event, ...data });
  }
}
