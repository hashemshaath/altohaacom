import { memo, forwardRef } from "react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseOrigin = SUPABASE_URL ? new URL(SUPABASE_URL).origin : "";

/**
 * Resource hints for critical origins.
 * Preconnect to Supabase (data + images) and analytics providers.
 */
export const ResourceHints = memo(forwardRef<HTMLDivElement>(function ResourceHints(_props, _ref) {
  return (
    <>
      {/* Supabase — critical for data + image delivery */}
      {supabaseOrigin && (
        <>
          <link rel="preconnect" href={supabaseOrigin} crossOrigin="anonymous" />
          <link rel="dns-prefetch" href={supabaseOrigin} />
        </>
      )}
      {/* Google Fonts — if used */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      {/* Analytics */}
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
