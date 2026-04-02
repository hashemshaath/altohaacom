import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Unified tracking injector.
 * Reads ALL tracking configs from `integration_settings` (single source of truth).
 * Injects GTM, GA4, Google Ads, AdSense, GSC, Meta Pixel, TikTok Pixel,
 * Snap Pixel, LinkedIn, and Hotjar scripts dynamically.
 *
 * IMPORTANT: When GTM is active it manages the dataLayer. GA4 and Google Ads
 * are typically configured *inside* GTM — but if they are also enabled here
 * they will be loaded standalone (safe; gtag deduplicates automatically).
 */

const ALL_TRACKING_TYPES = [
  "google_analytics",
  "google_tag_manager",
  "google_ads",
  "google_adsense",
  "google_search_console",
  "facebook_pixel",
  "tiktok_pixel",
  "snap_pixel",
  "linkedin_insight",
  "hotjar",
];

export function useGoogleTracking() {
  const injected = useRef(false);

  const { data: configs } = useQuery({
    queryKey: ["integration-settings-tracking-active"],
    queryFn: async () => {
      const { data } = await supabase
        .from("integration_settings")
        .select("integration_type, config, is_active")
        .eq("is_active", true)
        .in("integration_type", ALL_TRACKING_TYPES);
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (!configs || configs.length === 0 || injected.current) return;
    injected.current = true;

    // Ensure dataLayer exists once before any script needs it
    (window as any).dataLayer = (window as any).dataLayer || [];

    configs.forEach((row: any) => {
      const cfg = (typeof row.config === "string" ? JSON.parse(row.config) : row.config) || {};
      switch (row.integration_type) {
        case "google_tag_manager":
          if (cfg.container_id) injectGTM(cfg.container_id);
          break;
        case "google_analytics":
          if (cfg.measurement_id) injectGA4(cfg.measurement_id);
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
        case "facebook_pixel":
          if (cfg.pixel_id) injectMetaPixel(cfg.pixel_id);
          break;
        case "tiktok_pixel":
          if (cfg.pixel_id) injectTikTokPixel(cfg.pixel_id);
          break;
        case "snap_pixel":
          if (cfg.pixel_id) injectSnapchatPixel(cfg.pixel_id);
          break;
        case "linkedin_insight":
          if (cfg.partner_id) injectLinkedIn(cfg.partner_id);
          break;
        case "hotjar":
          if (cfg.site_id) injectHotjar(cfg.site_id);
          break;
      }
    });
  }, [configs]);
}

/* ═══════════════════════════════════════════
   Shared gtag bootstrap — ensures the global
   `gtag()` function exists exactly once.
   ═══════════════════════════════════════════ */

function ensureGtag() {
  if (typeof (window as any).gtag === "function") return;
  (window as any).dataLayer = (window as any).dataLayer || [];
  (window as any).gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    (window as any).dataLayer.push(arguments);
  };
  (window as any).gtag("js", new Date());
}

/* ═══════════════════════════════════════════
   Script Injectors
   ═══════════════════════════════════════════ */

function injectGTM(containerId: string) {
  if (document.querySelector(`script[data-gtm-id="${containerId}"]`)) return;
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

  // GTM noscript fallback
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

function injectGA4(measurementId: string) {
  if (document.querySelector(`script[src*="gtag/js?id=${measurementId}"]`)) return;
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);

  ensureGtag();
  (window as any).gtag("config", measurementId, { send_page_view: true });
}

function injectGoogleAds(conversionId: string) {
  // If GA4 already loaded gtag/js we can skip the loader script
  if (!document.querySelector('script[src*="gtag/js"]')) {
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${conversionId}`;
    document.head.appendChild(script);
  }

  ensureGtag();
  (window as any).gtag("config", conversionId);
}

function injectAdSense(publisherId: string) {
  if (document.querySelector(`script[data-ad-client="${publisherId}"]`)) return;
  const script = document.createElement("script");
  script.async = true;
  script.crossOrigin = "anonymous";
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${publisherId}`;
  script.setAttribute("data-ad-client", publisherId);
  document.head.appendChild(script);
}

function injectSearchConsoleVerification(code: string) {
  if (document.querySelector('meta[name="google-site-verification"]')) return;
  const meta = document.createElement("meta");
  meta.name = "google-site-verification";
  meta.content = code;
  document.head.appendChild(meta);
}

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

function injectTikTokPixel(pixelId: string) {
  if (document.querySelector(`script[data-pixel="tiktok-${pixelId}"]`)) return;
  const script = document.createElement("script");
  script.setAttribute("data-pixel", `tiktok-${pixelId}`);
  script.textContent = `
    !function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=
    ["page","track","identify","instances","debug","on","off","once","ready","alias",
    "group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){
    t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;
    i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],
    n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};ttq.load=function(e,n){
    var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],
    ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};
    var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+
    "&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
    ttq.load('${pixelId}');ttq.page()}(window,document,'ttq');
  `;
  document.head.appendChild(script);
}

function injectSnapchatPixel(pixelId: string) {
  if (document.querySelector(`script[data-pixel="snap-${pixelId}"]`)) return;
  const script = document.createElement("script");
  script.setAttribute("data-pixel", `snap-${pixelId}`);
  script.textContent = `
    (function(e,t,n){if(e.snaptr)return;var a=e.snaptr=function(){a.handleRequest?
    a.handleRequest.apply(a,arguments):a.queue.push(arguments)};a.queue=[];var s='script';
    var r=t.createElement(s);r.async=!0;r.src=n;var u=t.getElementsByTagName(s)[0];
    u.parentNode.insertBefore(r,u)})(window,document,'https://sc-static.net/scevent.min.js');
    snaptr('init', '${pixelId}', {});
    snaptr('track', 'PAGE_VIEW');
  `;
  document.head.appendChild(script);
}

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
   Public Utilities — single canonical source
   for pushing events to the GTM dataLayer.
   ═══════════════════════════════════════════ */

export function pushDataLayer(event: string, params?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  const payload = { event, ...params };
  (window as any).dataLayer = (window as any).dataLayer || [];
  (window as any).dataLayer.push(payload);
  if (import.meta.env.DEV) {
    console.debug("[DataLayer]", event, params);
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
