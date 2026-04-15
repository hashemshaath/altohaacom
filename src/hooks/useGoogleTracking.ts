import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CACHE } from "@/lib/queryConfig";

/**
 * Unified tracking injector.
 * Reads ALL tracking configs from `integration_settings` (single source of truth).
 * Injects GTM, GA4, Google Ads, AdSense, GSC, Meta Pixel, TikTok Pixel,
 * Snap Pixel, LinkedIn, and Hotjar scripts dynamically.
 *
 * All external scripts use crossorigin="anonymous" so the browser sends
 * cookie-free requests — eliminating unnecessary network traffic.
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
  const injectedTypes = useRef<Set<string>>(new Set());

  const { data: configs } = useQuery({
    queryKey: ["integration-settings-tracking-active"],
    queryFn: async () => {
      // Use RPC for public access (works without auth)
      const { data, error } = await supabase.rpc("get_public_tracking_config");
      if (error) {
        console.error("[Tracking] Failed to load integration settings:", error.message);
        return [];
      }
      return (data || []).map((d: { integration_type: string; config: unknown }) => ({
        integration_type: d.integration_type,
        config: d.config,
        is_active: true,
      }));
    },
    ...CACHE.medium,
    retry: 2,
  });

  useEffect(() => {
    if (!configs || configs.length === 0) return;

    // Ensure dataLayer exists once before any script needs it
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- GTM global requires window extension
    window.dataLayer = window.dataLayer || [];
    console.info(`[Tracking] Injecting ${configs.length} tracking script(s):`, configs.map(c => c.integration_type).join(", "));


    configs.forEach((row) => {
      // Skip if this type was already injected
      if (injectedTypes.current.has(row.integration_type)) return;
      injectedTypes.current.add(row.integration_type);
      let cfg: Record<string, string> = {};
      try {
        cfg = (typeof row.config === "string" ? JSON.parse(row.config as string) : row.config as Record<string, string>) || {};
      } catch { /* malformed config — skip */ }
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
   Helper: create a cookie-free async script
   ═══════════════════════════════════════════ */

function createAsyncScript(src: string, attrs?: Record<string, string>): HTMLScriptElement {
  const s = document.createElement("script");
  s.async = true;
  s.crossOrigin = "anonymous";
  s.src = src;
  if (attrs) Object.entries(attrs).forEach(([k, v]) => s.setAttribute(k, v));
  return s;
}

/* ═══════════════════════════════════════════
   Shared gtag bootstrap — ensures the global
   `gtag()` function exists exactly once.
   ═══════════════════════════════════════════ */

function ensureGtag() {
  if (typeof window.gtag === "function") return;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer.push(arguments);
  };
  window.gtag("js", new Date());
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
    'https://www.googletagmanager.com/gtm.js?id='+i+dl;
    j.crossOrigin='anonymous';f.parentNode.insertBefore(j,f);
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
  document.head.appendChild(
    createAsyncScript(`https://www.googletagmanager.com/gtag/js?id=${measurementId}`)
  );
  ensureGtag();
  window.gtag("config", measurementId, { send_page_view: true });
}

function injectGoogleAds(conversionId: string) {
  // Reuse gtag/js loader if GA4 already loaded it
  if (!document.querySelector('script[src*="gtag/js"]')) {
    document.head.appendChild(
      createAsyncScript(`https://www.googletagmanager.com/gtag/js?id=${conversionId}`)
    );
  }
  ensureGtag();
  window.gtag("config", conversionId);
}

function injectAdSense(publisherId: string) {
  if (document.querySelector(`script[data-ad-client="${publisherId}"]`)) return;
  document.head.appendChild(
    createAsyncScript(
      `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${publisherId}`,
      { "data-ad-client": publisherId }
    )
  );
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
    t.crossOrigin='anonymous';t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)}(window,
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
    var o=document.createElement("script");o.type="text/javascript",o.async=!0,
    o.crossOrigin='anonymous',o.src=i+"?sdkid="+e+"&lib="+t;
    var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
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
    var r=t.createElement(s);r.async=!0;r.crossOrigin='anonymous';r.src=n;
    var u=t.getElementsByTagName(s)[0];
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
      b.crossOrigin = "anonymous";
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
      r.crossOrigin='anonymous';
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
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(payload);
  if (import.meta.env.DEV) {
    console.debug("[DataLayer]", event, params);
  }
}

/** Alias kept for backward compatibility */
export const pushToDataLayer = pushDataLayer;

/** Send conversion events to Google gtag */
export function sendGoogleConversion(eventName: string, params?: Record<string, unknown>) {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", eventName, params);
  }
}
