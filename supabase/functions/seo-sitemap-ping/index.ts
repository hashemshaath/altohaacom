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

    // Bing IndexNow / Webmaster ping — still supported
    try {
      const bingUrl = `https://www.bing.com/indexnow?url=${encodeURIComponent(sitemapUrl)}&urlList=${encodeURIComponent(sitemapUrl)}`;
      const bingRes = await fetch(bingUrl);
      const bingBody = await bingRes.text();
      // Bing returns 200 or 202 for accepted
      const bingOk = bingRes.status >= 200 && bingRes.status < 300;
      results.push({ engine: "Bing", status: bingOk ? "success" : "error", code: bingRes.status });

      await supabaseAdmin.from("seo_crawl_log").insert({
        action: "sitemap_ping",
        target_url: sitemapUrl,
        search_engine: "bing",
        status: bingOk ? "success" : "error",
        response_code: bingRes.status,
        response_body: bingBody.slice(0, 500),
      });
    } catch (e) {
      results.push({ engine: "Bing", status: "error" });
      await supabaseAdmin.from("seo_crawl_log").insert({
        action: "sitemap_ping", target_url: sitemapUrl, search_engine: "bing",
        status: "error", response_body: String(e).slice(0, 500),
      });
    }

    // Google — ping endpoint deprecated since 2023. 
    // Notify via Search Console API if service account is configured, otherwise inform user.
    const googleServiceAccount = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_JSON");
    if (googleServiceAccount) {
      try {
        const sa = JSON.parse(googleServiceAccount);
        // Build JWT for Google API
        const header = btoa(JSON.stringify({ alg: "RS256", typ: "JWT" }));
        const now = Math.floor(Date.now() / 1000);
        const claim = btoa(JSON.stringify({
          iss: sa.client_email,
          scope: "https://www.googleapis.com/auth/webmasters",
          aud: "https://oauth2.googleapis.com/token",
          exp: now + 3600,
          iat: now,
        }));

        // Import private key and sign
        const keyData = sa.private_key.replace(/-----BEGIN PRIVATE KEY-----/g, "").replace(/-----END PRIVATE KEY-----/g, "").replace(/\s/g, "");
        const binaryKey = Uint8Array.from(atob(keyData), (c) => c.charCodeAt(0));
        const cryptoKey = await crypto.subtle.importKey("pkcs8", binaryKey, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
        const signInput = new TextEncoder().encode(`${header}.${claim}`);
        const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", cryptoKey, signInput);
        const sig = btoa(String.fromCharCode(...new Uint8Array(signature)));
        const jwt = `${header}.${claim}.${sig}`;

        // Get access token
        const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
        });
        const tokenData = await tokenRes.json();

        if (tokenData.access_token) {
          // Submit sitemap via Search Console API
          const gscUrl = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent("https://altoha.com")}/sitemaps/${encodeURIComponent(sitemapUrl)}`;
          const gscRes = await fetch(gscUrl, {
            method: "PUT",
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
          });
          const gscOk = gscRes.status >= 200 && gscRes.status < 300;
          const gscBody = await gscRes.text();
          results.push({ engine: "Google", status: gscOk ? "success" : "error", code: gscRes.status });

          await supabaseAdmin.from("seo_crawl_log").insert({
            action: "sitemap_submit",
            target_url: sitemapUrl,
            search_engine: "google",
            status: gscOk ? "success" : "error",
            response_code: gscRes.status,
            response_body: gscBody.slice(0, 500),
          });
        } else {
          results.push({ engine: "Google", status: "error", message: "Token exchange failed" });
        }
      } catch (e) {
        results.push({ engine: "Google", status: "error", message: String(e).slice(0, 200) });
        await supabaseAdmin.from("seo_crawl_log").insert({
          action: "sitemap_submit", target_url: sitemapUrl, search_engine: "google",
          status: "error", response_body: String(e).slice(0, 500),
        });
      }
    } else {
      // No service account — inform that Google ping is deprecated
      results.push({
        engine: "Google",
        status: "info",
        message: "Google sitemap ping is deprecated. Sitemap is auto-discovered via robots.txt.",
      });
      await supabaseAdmin.from("seo_crawl_log").insert({
        action: "sitemap_ping",
        target_url: sitemapUrl,
        search_engine: "google",
        status: "info",
        response_body: "Google ping deprecated. Sitemap listed in robots.txt for auto-discovery.",
      });
    }

    const hasError = results.some(r => r.status === "error");
    const allInfo = results.every(r => r.status === "info" || r.status === "success");

    return new Response(JSON.stringify({ success: !hasError, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("seo-sitemap-ping error:", e);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
