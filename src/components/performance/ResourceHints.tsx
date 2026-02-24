/**
 * Resource hints for critical third-party origins.
 * Add dns-prefetch and preconnect for faster external resource loading.
 */
export function ResourceHints() {
  return (
    <>
      {/* Supabase API & Storage */}
      <link rel="dns-prefetch" href="https://pbjhffdnzlekprmxfbnt.supabase.co" />
      <link rel="preconnect" href="https://pbjhffdnzlekprmxfbnt.supabase.co" crossOrigin="anonymous" />
      
      {/* Google Fonts (if used) */}
      <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="anonymous" />
    </>
  );
}
