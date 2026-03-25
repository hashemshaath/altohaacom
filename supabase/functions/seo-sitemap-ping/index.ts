import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await userClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "supervisor")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sitemapUrl = "https://altoha.com/sitemap.xml";
    const results: Array<{ engine: string; status: string; code?: number; message?: string }> = [];

    // Step 1: Verify the sitemap is actually accessible
    let sitemapAccessible = false;
    try {
      const sitemapRes = await fetch(sitemapUrl, { method: "HEAD" });
      sitemapAccessible = sitemapRes.status >= 200 && sitemapRes.status < 300;
      results.push({
        engine: "Sitemap",
        status: sitemapAccessible ? "success" : "error",
        code: sitemapRes.status,
        message: sitemapAccessible ? "Sitemap is accessible" : `Sitemap returned ${sitemapRes.status}`,
      });
    } catch (e) {
      results.push({ engine: "Sitemap", status: "error", message: "Could not reach sitemap" });
    }

    // Step 2: Google — use Search Console API if configured, otherwise info
    const googleServiceAccount = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_JSON");
    if (googleServiceAccount) {
      try {
        const sa = JSON.parse(googleServiceAccount);
        const header = btoa(JSON.stringify({ alg: "RS256", typ: "JWT" }));
        const now = Math.floor(Date.now() / 1000);
        const claim = btoa(JSON.stringify({
          iss: sa.client_email,
          scope: "https://www.googleapis.com/auth/webmasters",
          aud: "https://oauth2.googleapis.com/token",
          exp: now + 3600, iat: now,
        }));
        const keyData = sa.private_key.replace(/-----BEGIN PRIVATE KEY-----/g, "").replace(/-----END PRIVATE KEY-----/g, "").replace(/\s/g, "");
        const binaryKey = Uint8Array.from(atob(keyData), (c) => c.charCodeAt(0));
        const cryptoKey = await crypto.subtle.importKey("pkcs8", binaryKey, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
        const signInput = new TextEncoder().encode(`${header}.${claim}`);
        const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", cryptoKey, signInput);
        const sig = btoa(String.fromCharCode(...new Uint8Array(signature)));
        const jwt = `${header}.${claim}.${sig}`;

        const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
        });
        const tokenData = await tokenRes.json();

        if (tokenData.access_token) {
          const gscUrl = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent("https://altoha.com")}/sitemaps/${encodeURIComponent(sitemapUrl)}`;
          const gscRes = await fetch(gscUrl, { method: "PUT", headers: { Authorization: `Bearer ${tokenData.access_token}` } });
          const gscOk = gscRes.status >= 200 && gscRes.status < 300;
          results.push({ engine: "Google", status: gscOk ? "success" : "error", code: gscRes.status });
          await supabaseAdmin.from("seo_crawl_log").insert({
            action: "sitemap_submit", target_url: sitemapUrl, search_engine: "google",
            status: gscOk ? "success" : "error", response_code: gscRes.status,
            response_body: (await gscRes.text()).slice(0, 500),
          });
        } else {
          results.push({ engine: "Google", status: "error", message: "Token exchange failed" });
        }
      } catch (e) {
        results.push({ engine: "Google", status: "error", message: String(e).slice(0, 200) });
      }
    } else {
      results.push({ engine: "Google", status: "info", message: "Auto-discovered via robots.txt" });
      await supabaseAdmin.from("seo_crawl_log").insert({
        action: "sitemap_ping", target_url: sitemapUrl, search_engine: "google",
        status: "info", response_body: "No GSC service account. Sitemap auto-discovered via robots.txt.",
      });
    }

    // Step 3: Bing — ping endpoints are deprecated (410). Log as info.
    results.push({ engine: "Bing", status: "info", message: "Ping deprecated. Auto-discovered via robots.txt" });
    await supabaseAdmin.from("seo_crawl_log").insert({
      action: "sitemap_ping", target_url: sitemapUrl, search_engine: "bing",
      status: "info", response_body: "Bing sitemap ping deprecated (410). Auto-discovered via robots.txt.",
    });

    // Overall success = sitemap is accessible
    return new Response(JSON.stringify({ success: sitemapAccessible, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("seo-sitemap-ping error:", e);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
