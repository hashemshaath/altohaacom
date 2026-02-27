/**
 * Resource hints for critical third-party origins.
 * Preconnect for faster external resource loading and prefetch key API endpoints.
 */
export function ResourceHints() {
  return (
    <>
      {/* Supabase API & Storage — preconnect for both API and storage CDN */}
      <link rel="dns-prefetch" href="https://pbjhffdnzlekprmxfbnt.supabase.co" />
      <link rel="preconnect" href="https://pbjhffdnzlekprmxfbnt.supabase.co" crossOrigin="anonymous" />

      {/* Supabase Storage CDN */}
      <link rel="dns-prefetch" href="https://pbjhffdnzlekprmxfbnt.supabase.co/storage/v1" />

      {/* Google Fonts */}
      <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="anonymous" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
    </>
  );
}
