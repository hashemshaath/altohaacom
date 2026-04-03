/**
 * Standardized CORS headers for all edge functions.
 * Import this instead of defining corsHeaders in each function.
 */
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/** Standard JSON response headers including CORS */
export const jsonHeaders = {
  ...corsHeaders,
  "Content-Type": "application/json",
};

/** Standard SSE response headers including CORS */
export const sseHeaders = {
  ...corsHeaders,
  "Content-Type": "text/event-stream",
};

/** Handle OPTIONS preflight requests */
export function handleCors(req: Request): Response | null {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  return null;
}
