import { useEffect, useRef, memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Injects Meta Pixel, TikTok Pixel, and Snapchat Pixel scripts
 * based on marketing_tracking_config table.
 */
export const TrackingScriptsInjector = memo(function TrackingScriptsInjector() {
  const injected = useRef(false);

  const { data: configs } = useQuery({
    queryKey: ["tracking-social-pixels"],
    queryFn: async () => {
      const { data } = await supabase
        .from("marketing_tracking_config")
        .select("id, platform, tracking_id, config, is_active, created_by, created_at, updated_at")
        .eq("is_active", true)
        .in("platform", ["meta_pixel", "tiktok_pixel", "snapchat_pixel"]);
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (!configs || configs.length === 0 || injected.current) return;
    injected.current = true;

    configs.forEach((cfg: any) => {
      const id = cfg.tracking_id;
      if (!id) return;

      switch (cfg.platform) {
        case "meta_pixel":
          injectMetaPixel(id);
          break;
        case "tiktok_pixel":
          injectTikTokPixel(id);
          break;
        case "snapchat_pixel":
          injectSnapchatPixel(id);
          break;
      }
    });
  }, [configs]);

  return null;
});

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
