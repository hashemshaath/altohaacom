import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Content-Type": "application/xml; charset=utf-8",
  "Cache-Control": "public, max-age=3600, s-maxage=3600",
};

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const origin = "https://altoha.com";

  // Fetch dynamic content for sitemap
  const [
    { data: competitions },
    { data: exhibitions },
    { data: articles },
    { data: profiles },
    { data: recipes },
  ] = await Promise.all([
    supabase.from("competitions").select("id, updated_at").limit(500),
    supabase.from("exhibitions").select("slug, id, updated_at").limit(500),
    supabase.from("articles").select("slug, updated_at").eq("status", "published").limit(500),
    supabase.from("profiles").select("username, updated_at").not("username", "is", null).limit(1000),
    supabase.from("recipes").select("id, updated_at").limit(500),
  ]);

  const staticPages = [
    { loc: "/", priority: "1.0", changefreq: "daily" },
    { loc: "/competitions", priority: "0.9", changefreq: "daily" },
    { loc: "/exhibitions", priority: "0.9", changefreq: "daily" },
    { loc: "/news", priority: "0.8", changefreq: "daily" },
    { loc: "/recipes", priority: "0.8", changefreq: "daily" },
    { loc: "/community", priority: "0.7", changefreq: "weekly" },
    { loc: "/masterclasses", priority: "0.8", changefreq: "weekly" },
    { loc: "/rankings", priority: "0.7", changefreq: "weekly" },
    { loc: "/pro-suppliers", priority: "0.7", changefreq: "weekly" },
    { loc: "/jobs", priority: "0.8", changefreq: "daily" },
    { loc: "/establishments", priority: "0.7", changefreq: "weekly" },
    { loc: "/organizers", priority: "0.7", changefreq: "weekly" },
    { loc: "/events-calendar", priority: "0.7", changefreq: "daily" },
    { loc: "/chefs-table", priority: "0.7", changefreq: "weekly" },
    { loc: "/mentorship", priority: "0.7", changefreq: "weekly" },
    { loc: "/search", priority: "0.6", changefreq: "weekly" },
    { loc: "/membership", priority: "0.7", changefreq: "monthly" },
    { loc: "/about", priority: "0.6", changefreq: "monthly" },
    { loc: "/contact", priority: "0.6", changefreq: "monthly" },
    { loc: "/for-chefs", priority: "0.7", changefreq: "monthly" },
    { loc: "/for-companies", priority: "0.7", changefreq: "monthly" },
    { loc: "/for-organizers", priority: "0.7", changefreq: "monthly" },
    { loc: "/sponsors", priority: "0.7", changefreq: "monthly" },
    { loc: "/help", priority: "0.5", changefreq: "monthly" },
    { loc: "/privacy", priority: "0.3", changefreq: "yearly" },
    { loc: "/terms", priority: "0.3", changefreq: "yearly" },
    { loc: "/cookies", priority: "0.3", changefreq: "yearly" },
    { loc: "/register", priority: "0.7", changefreq: "monthly" },
    { loc: "/discover", priority: "0.8", changefreq: "daily" },
    { loc: "/shop", priority: "0.8", changefreq: "daily" },
    { loc: "/install", priority: "0.5", changefreq: "monthly" },
    { loc: "/verify/certificate", priority: "0.5", changefreq: "monthly" },
  ];

  let urls = staticPages.map(p => {
    const enUrl = `${origin}${p.loc}`;
    const arUrl = `${origin}${p.loc}?lang=ar`;
    return `<url>
  <loc>${enUrl}</loc>
  <changefreq>${p.changefreq}</changefreq>
  <priority>${p.priority}</priority>
  <xhtml:link rel="alternate" hreflang="en" href="${enUrl}" />
  <xhtml:link rel="alternate" hreflang="ar" href="${arUrl}" />
  <xhtml:link rel="alternate" hreflang="x-default" href="${enUrl}" />
</url>`;
  });

  // Competitions
  (competitions || []).forEach(c => {
    const loc = `${origin}/competitions/${c.id}`;
    urls.push(`<url><loc>${loc}</loc><lastmod>${c.updated_at?.substring(0, 10)}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>`);
  });

  // Exhibitions
  (exhibitions || []).forEach(e => {
    const slug = e.slug || e.id;
    urls.push(`<url><loc>${origin}/exhibitions/${slug}</loc><lastmod>${e.updated_at?.substring(0, 10)}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>`);
  });

  // Articles
  (articles || []).forEach(a => {
    urls.push(`<url><loc>${origin}/news/${a.slug}</loc><lastmod>${a.updated_at?.substring(0, 10)}</lastmod><changefreq>weekly</changefreq><priority>0.7</priority></url>`);
  });

  // Recipes
  (recipes || []).forEach(r => {
    urls.push(`<url><loc>${origin}/recipes/${r.id}</loc><lastmod>${r.updated_at?.substring(0, 10)}</lastmod><changefreq>monthly</changefreq><priority>0.6</priority></url>`);
  });

  // Profiles
  (profiles || []).forEach(p => {
    if (p.username) {
      urls.push(`<url><loc>${origin}/u/${p.username}</loc><changefreq>monthly</changefreq><priority>0.5</priority></url>`);
    }
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join("\n")}
</urlset>`;

  return new Response(xml, { headers: corsHeaders });
});
