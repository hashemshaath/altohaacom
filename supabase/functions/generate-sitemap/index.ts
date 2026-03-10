import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BASE_URL = "https://altoha.com";

// Static routes with their SEO config
const STATIC_ROUTES: { path: string; changefreq: string; priority: number }[] = [
  { path: "/", changefreq: "daily", priority: 1.0 },
  { path: "/competitions", changefreq: "daily", priority: 0.9 },
  { path: "/discover", changefreq: "daily", priority: 0.9 },
  { path: "/exhibitions", changefreq: "daily", priority: 0.9 },
  { path: "/community", changefreq: "daily", priority: 0.8 },
  { path: "/news", changefreq: "daily", priority: 0.8 },
  { path: "/rankings", changefreq: "weekly", priority: 0.8 },
  { path: "/recipes", changefreq: "weekly", priority: 0.8 },
  { path: "/masterclasses", changefreq: "weekly", priority: 0.7 },
  { path: "/shop", changefreq: "daily", priority: 0.7 },
  { path: "/chefs-table", changefreq: "weekly", priority: 0.7 },
  { path: "/pro-suppliers", changefreq: "weekly", priority: 0.7 },
  { path: "/mentorship", changefreq: "weekly", priority: 0.7 },
  { path: "/establishments", changefreq: "weekly", priority: 0.7 },
  { path: "/organizers", changefreq: "weekly", priority: 0.7 },
  { path: "/events-calendar", changefreq: "daily", priority: 0.7 },
  { path: "/jobs", changefreq: "daily", priority: 0.7 },
  { path: "/entities", changefreq: "weekly", priority: 0.6 },
  { path: "/membership", changefreq: "monthly", priority: 0.6 },
  { path: "/search", changefreq: "daily", priority: 0.6 },
  { path: "/about", changefreq: "monthly", priority: 0.5 },
  { path: "/contact", changefreq: "monthly", priority: 0.5 },
  { path: "/help", changefreq: "monthly", priority: 0.5 },
  { path: "/for-chefs", changefreq: "monthly", priority: 0.8 },
  { path: "/for-companies", changefreq: "monthly", priority: 0.8 },
  { path: "/for-organizers", changefreq: "monthly", priority: 0.8 },
  { path: "/sponsors", changefreq: "monthly", priority: 0.8 },
  { path: "/privacy", changefreq: "monthly", priority: 0.3 },
  { path: "/terms", changefreq: "monthly", priority: 0.3 },
  { path: "/cookies", changefreq: "monthly", priority: 0.3 },
  { path: "/verify/certificate", changefreq: "monthly", priority: 0.4 },
  { path: "/install", changefreq: "monthly", priority: 0.4 },
];

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function urlEntry(loc: string, changefreq: string, priority: number, lastmod?: string): string {
  const escapedLoc = escapeXml(loc);
  return `  <url>
    <loc>${escapedLoc}</loc>
    ${lastmod ? `<lastmod>${lastmod}</lastmod>` : ""}
    <changefreq>${changefreq}</changefreq>
    <priority>${priority.toFixed(1)}</priority>
    <xhtml:link rel="alternate" hreflang="en" href="${escapedLoc}?lang=en"/>
    <xhtml:link rel="alternate" hreflang="ar" href="${escapedLoc}?lang=ar"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${escapedLoc}"/>
  </url>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch dynamic content in parallel
    const [articles, competitions, exhibitions, recipes, establishments, profiles] =
      await Promise.all([
        supabase
          .from("articles")
          .select("slug, updated_at, type")
          .eq("status", "published")
          .order("updated_at", { ascending: false })
          .limit(1000),
        supabase
          .from("competitions")
          .select("id, updated_at")
          .eq("status", "active")
          .order("updated_at", { ascending: false })
          .limit(500),
        supabase
          .from("exhibitions")
          .select("slug, updated_at")
          .eq("status", "published")
          .order("updated_at", { ascending: false })
          .limit(500),
        supabase
          .from("recipes")
          .select("slug, updated_at")
          .eq("is_published", true)
          .order("updated_at", { ascending: false })
          .limit(1000),
        supabase
          .from("establishments")
          .select("slug, updated_at")
          .eq("status", "active")
          .order("updated_at", { ascending: false })
          .limit(500),
        supabase
          .from("profiles")
          .select("username, updated_at")
          .not("username", "is", null)
          .eq("is_public", true)
          .order("updated_at", { ascending: false })
          .limit(1000),
      ]);

    const urls: string[] = [];

    // Static routes
    for (const route of STATIC_ROUTES) {
      urls.push(urlEntry(`${BASE_URL}${route.path}`, route.changefreq, route.priority));
    }

    // Articles (news, guides, etc.)
    for (const a of articles.data || []) {
      const prefix = a.type === "news" ? "/news" : "/articles";
      const lastmod = a.updated_at?.split("T")[0];
      urls.push(urlEntry(`${BASE_URL}${prefix}/${a.slug}`, "weekly", 0.7, lastmod));
    }

    // Competitions
    for (const c of competitions.data || []) {
      const lastmod = c.updated_at?.split("T")[0];
      urls.push(urlEntry(`${BASE_URL}/competitions/${c.id}`, "weekly", 0.7, lastmod));
    }

    // Exhibitions
    for (const e of exhibitions.data || []) {
      const lastmod = e.updated_at?.split("T")[0];
      urls.push(urlEntry(`${BASE_URL}/exhibitions/${e.slug}`, "weekly", 0.7, lastmod));
    }

    // Recipes
    for (const r of recipes.data || []) {
      const lastmod = r.updated_at?.split("T")[0];
      urls.push(urlEntry(`${BASE_URL}/recipes/${r.slug}`, "weekly", 0.6, lastmod));
    }

    // Establishments
    for (const est of establishments.data || []) {
      const lastmod = est.updated_at?.split("T")[0];
      urls.push(urlEntry(`${BASE_URL}/establishments/${est.slug}`, "monthly", 0.5, lastmod));
    }

    // Public profiles
    for (const p of profiles.data || []) {
      if (!p.username) continue;
      const lastmod = p.updated_at?.split("T")[0];
      urls.push(urlEntry(`${BASE_URL}/chef/${p.username}`, "monthly", 0.4, lastmod));
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join("\n")}
</urlset>`;

    return new Response(xml, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });
  } catch (error) {
    console.error("Sitemap generation error:", error);
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`,
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/xml" },
      }
    );
  }
});
