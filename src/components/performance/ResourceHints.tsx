import { memo } from "react";

/**
 * Resource hints for critical third-party origins.
 * Preconnect with crossorigin="anonymous" ensures cookie-free requests.
 *
 * NOTE: Google Fonts and Supabase preconnect are already in index.html <head>
 * for earliest possible discovery. This component adds tracking-related
 * origins that are only needed after the app boots.
 */
export const ResourceHints = memo(function ResourceHints() {
  return (
    <>
      {/* Google Tag Manager / Analytics — preconnect for tracking scripts */}
      <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
      <link rel="preconnect" href="https://www.googletagmanager.com" crossOrigin="anonymous" />

      {/* Google Analytics beacon endpoint */}
      <link rel="dns-prefetch" href="https://www.google-analytics.com" />
      <link rel="preconnect" href="https://www.google-analytics.com" crossOrigin="anonymous" />

      {/* Meta Pixel */}
      <link rel="dns-prefetch" href="https://connect.facebook.net" />

      {/* TikTok Pixel */}
      <link rel="dns-prefetch" href="https://analytics.tiktok.com" />

      {/* Snap Pixel */}
      <link rel="dns-prefetch" href="https://sc-static.net" />

      {/* LinkedIn Insight */}
      <link rel="dns-prefetch" href="https://snap.licdn.com" />

      {/* Hotjar */}
      <link rel="dns-prefetch" href="https://static.hotjar.com" />
    </>
  );
});
