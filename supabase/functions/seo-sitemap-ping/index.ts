import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Auth check
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

    // Check admin
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
    const results: Array<{ engine: string; status: string; code?: number }> = [];

    // Ping Google
    try {
      const googleUrl = `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`;
      const googleRes = await fetch(googleUrl);
      const googleBody = await googleRes.text();
      results.push({ engine: "Google", status: googleRes.ok ? "success" : "error", code: googleRes.status });

      await supabaseAdmin.from("seo_crawl_log").insert({
        action: "sitemap_ping",
        target_url: sitemapUrl,
        search_engine: "google",
        status: googleRes.ok ? "success" : "error",
        response_code: googleRes.status,
        response_body: googleBody.slice(0, 500),
      });
    } catch (e) {
      results.push({ engine: "Google", status: "error" });
      await supabaseAdmin.from("seo_crawl_log").insert({
        action: "sitemap_ping", target_url: sitemapUrl, search_engine: "google",
        status: "error", response_body: String(e).slice(0, 500),
      });
    }

    // Ping Bing (IndexNow style)
    try {
      const bingUrl = `https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`;
      const bingRes = await fetch(bingUrl);
      const bingBody = await bingRes.text();
      results.push({ engine: "Bing", status: bingRes.ok ? "success" : "error", code: bingRes.status });

      await supabaseAdmin.from("seo_crawl_log").insert({
        action: "sitemap_ping",
        target_url: sitemapUrl,
        search_engine: "bing",
        status: bingRes.ok ? "success" : "error",
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

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("seo-sitemap-ping error:", e);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
