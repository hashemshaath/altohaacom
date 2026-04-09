import { memo, forwardRef } from "react";

/**
 * Resource hints for critical third-party origins.
 */
export const ResourceHints = memo(forwardRef<HTMLDivElement>(function ResourceHints(_props, _ref) {
  return (
    <>
      <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
      <link rel="preconnect" href="https://www.googletagmanager.com" crossOrigin="anonymous" />
      <link rel="dns-prefetch" href="https://www.google-analytics.com" />
      <link rel="preconnect" href="https://www.google-analytics.com" crossOrigin="anonymous" />
      <link rel="dns-prefetch" href="https://connect.facebook.net" />
      <link rel="dns-prefetch" href="https://analytics.tiktok.com" />
      <link rel="dns-prefetch" href="https://sc-static.net" />
      <link rel="dns-prefetch" href="https://snap.licdn.com" />
      <link rel="dns-prefetch" href="https://static.hotjar.com" />
    </>
  );
}));
