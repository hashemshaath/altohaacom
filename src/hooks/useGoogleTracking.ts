import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Dynamically injects Google Analytics 4, GTM, and Google Ads scripts
 * based on admin-configured marketing_tracking_config.
 */
export function useGoogleTracking() {
  const injected = useRef(false);

  const { data: configs } = useQuery({
    queryKey: ["marketing-tracking-configs"],
    queryFn: async () => {
      const { data } = await supabase
        .from("marketing_tracking_config")
        .select("platform, tracking_id, is_active")
        .eq("is_active", true);
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (!configs || configs.length === 0 || injected.current) return;
    injected.current = true;

    configs.forEach((cfg: any) => {
      const trackingId = cfg.tracking_id;
      if (!trackingId) return;

      switch (cfg.platform) {
        case "google_analytics_4":
          injectGA4(trackingId);
          break;
        case "google_tag_manager":
          injectGTM(trackingId);
          break;
        case "google_ads":
          injectGoogleAds(trackingId);
          break;
      }
    });
  }, [configs]);
}

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

function injectGTM(containerId: string) {
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

  // noscript fallback
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

// Helper to send conversion events to Google
export function sendGoogleConversion(eventName: string, params?: Record<string, unknown>) {
  if (typeof window !== "undefined" && (window as any).gtag) {
    (window as any).gtag("event", eventName, params);
  }
}

// Helper to push events to GTM dataLayer
export function pushToDataLayer(event: string, data?: Record<string, unknown>) {
  if (typeof window !== "undefined") {
    (window as any).dataLayer = (window as any).dataLayer || [];
    (window as any).dataLayer.push({ event, ...data });
  }
}
