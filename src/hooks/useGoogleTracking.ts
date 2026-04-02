import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Reads tracking IDs from TWO sources:
 *   1. `site_settings` key "seo_analytics" (primary — admin SEO & Analytics panel)
 *   2. `integration_settings` table (legacy / additional Google integrations)
 *
 * Dynamically injects GTM, GA4, LinkedIn Insight, Hotjar, GSC verification,
 * Google Ads, and AdSense scripts. No IDs are hardcoded.
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

  // Source 1: SEO Analytics settings (primary)
  const { data: seoAnalytics } = useQuery({
    queryKey: ["site-settings-seo-analytics"],
    queryFn: async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "seo_analytics")
        .maybeSingle();
      if (!data?.value) return null;
      return typeof data.value === "string" ? JSON.parse(data.value) : data.value;
    },
    staleTime: 5 * 60 * 1000,
  });

  // Source 2: Integration settings (legacy)
  const { data: integrationConfigs } = useQuery({
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
    if (injected.current) return;

    const analytics = seoAnalytics?.analytics;
    const hasSettingsData = analytics && Object.values(analytics).some((v: any) => !!v);
    const hasIntegrationData = integrationConfigs && integrationConfigs.length > 0;

    if (!hasSettingsData && !hasIntegrationData) return;
    injected.current = true;

    // ── From SEO Analytics settings (primary source) ──
    if (analytics) {
      if (analytics.gtmId) injectGTM(analytics.gtmId);
      if (analytics.gaMeasurementId) injectGA4(analytics.gaMeasurementId);
      if (analytics.gscVerification) injectSearchConsoleVerification(analytics.gscVerification);
      if (analytics.metaPixelId) injectMetaPixel(analytics.metaPixelId);
      if (analytics.linkedinInsightTagId) injectLinkedIn(analytics.linkedinInsightTagId);
      if (analytics.hotjarSiteId) injectHotjar(analytics.hotjarSiteId);
    }

    // ── From integration_settings (legacy / additional) ──
    (integrationConfigs || []).forEach((row: any) => {
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
  }, [seoAnalytics, integrationConfigs]);
}

/* ═══════════════════════════════════════════
   Script Injectors
   ═══════════════════════════════════════════ */

/** Google Tag Manager — head snippet + body noscript fallback */
function injectGTM(containerId: string) {
  if (document.querySelector(`script[data-gtm-id="${containerId}"]`)) return;

  // Head script
  const script = document.createElement("script");
  script.setAttribute("data-gtm-id", containerId);
  script.textContent = `
    (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
    new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
    j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
    'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
    })(window,document,'script','dataLayer','${containerId}');
  `;
  document.head.insertBefore(script, document.head.firstChild);

  // Body noscript fallback
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

/** Google Analytics 4 — gtag.js */
function injectGA4(measurementId: string) {
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

/** Google Ads conversion tracking */
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

/** Google AdSense */
function injectAdSense(publisherId: string) {
  if (document.querySelector(`script[data-ad-client="${publisherId}"]`)) return;

  const script = document.createElement("script");
  script.async = true;
  script.crossOrigin = "anonymous";
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${publisherId}`;
  script.setAttribute("data-ad-client", publisherId);
  document.head.appendChild(script);
}

/** Google Search Console verification */
function injectSearchConsoleVerification(code: string) {
  if (document.querySelector('meta[name="google-site-verification"]')) return;

  const meta = document.createElement("meta");
  meta.name = "google-site-verification";
  meta.content = code;
  document.head.appendChild(meta);
}

/** Meta (Facebook) Pixel */
function injectMetaPixel(pixelId: string) {
  if (document.querySelector(`script[data-pixel="meta-${pixelId}"]`)) return;

  const script = document.createElement("script");
  script.setAttribute("data-pixel", `meta-${pixelId}`);
  script.textContent = `
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
    n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
    document,'script','https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', '${pixelId}');
    fbq('track', 'PageView');
  `;
  document.head.appendChild(script);
}

/** LinkedIn Insight Tag — key for professional chef & F&B audience */
function injectLinkedIn(partnerId: string) {
  if (document.querySelector(`script[data-linkedin-id="${partnerId}"]`)) return;

  const script = document.createElement("script");
  script.setAttribute("data-linkedin-id", partnerId);
  script.textContent = `
    _linkedin_partner_id = "${partnerId}";
    window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];
    window._linkedin_data_partner_ids.push(_linkedin_partner_id);
    (function(l) {
      if (!l){window.lintrk = function(a,b){window.lintrk.q.push([a,b])};
      window.lintrk.q=[]}
      var s = document.getElementsByTagName("script")[0];
      var b = document.createElement("script");
      b.type = "text/javascript";b.async = true;
      b.src = "https://snap.licdn.com/li.lms-analytics/insight.min.js";
      s.parentNode.insertBefore(b, s);
    })(window.lintrk);
  `;
  document.head.appendChild(script);

  // LinkedIn noscript pixel
  const noscript = document.createElement("noscript");
  const img = document.createElement("img");
  img.height = 1;
  img.width = 1;
  img.style.display = "none";
  img.alt = "";
  img.src = `https://px.ads.linkedin.com/collect/?pid=${partnerId}&fmt=gif`;
  noscript.appendChild(img);
  document.body.appendChild(noscript);
}

/** Hotjar heatmap & session recording */
function injectHotjar(siteId: string) {
  if (document.querySelector(`script[data-hotjar-id="${siteId}"]`)) return;

  const script = document.createElement("script");
  script.setAttribute("data-hotjar-id", siteId);
  script.textContent = `
    (function(h,o,t,j,a,r){
      h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
      h._hjSettings={hjid:${siteId},hjsv:6};
      a=o.getElementsByTagName('head')[0];
      r=o.createElement('script');r.async=1;
      r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
      a.appendChild(r);
    })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
  `;
  document.head.appendChild(script);
}

/* ═══════════════════════════════════════════
   Public Utilities
   ═══════════════════════════════════════════ */

/**
 * Push a structured event to GTM dataLayer.
 * Logs to console in development mode only.
 */
export function pushDataLayer(event: string, params?: Record<string, unknown>) {
  if (typeof window === "undefined") return;

  const payload = { event, ...params };
  (window as any).dataLayer = (window as any).dataLayer || [];
  (window as any).dataLayer.push(payload);

  if (import.meta.env.DEV) {
    console.log("[DataLayer]", event, params);
  }
}

/** Alias kept for backward compatibility */
export const pushToDataLayer = pushDataLayer;

/** Send conversion events to Google gtag */
export function sendGoogleConversion(eventName: string, params?: Record<string, unknown>) {
  if (typeof window !== "undefined" && (window as any).gtag) {
    (window as any).gtag("event", eventName, params);
  }
}
