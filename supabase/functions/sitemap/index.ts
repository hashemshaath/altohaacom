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

  const origin = req.headers.get("origin") || "https://altohaacom.lovable.app";

  // Fetch dynamic content for sitemap
  const [
    { data: competitions },
    { data: exhibitions },
    { data: articles },
    { data: profiles },
  ] = await Promise.all([
    supabase.from("competitions").select("id, updated_at").limit(500),
    supabase.from("exhibitions").select("slug, id, updated_at").limit(500),
    supabase.from("articles").select("slug, updated_at").eq("status", "published").limit(500),
    supabase.from("profiles").select("username, updated_at").not("username", "is", null).limit(1000),
  ]);

  const staticPages = [
    { loc: "/", priority: "1.0", changefreq: "daily" },
    { loc: "/competitions", priority: "0.9", changefreq: "daily" },
    { loc: "/exhibitions", priority: "0.9", changefreq: "daily" },
    { loc: "/articles", priority: "0.8", changefreq: "daily" },
    { loc: "/chefs-table", priority: "0.7", changefreq: "weekly" },
    { loc: "/search", priority: "0.6", changefreq: "weekly" },
    { loc: "/register", priority: "0.7", changefreq: "monthly" },
    { loc: "/events-calendar", priority: "0.7", changefreq: "daily" },
  ];

  let urls = staticPages.map(p => 
    `<url><loc>${origin}${p.loc}</loc><changefreq>${p.changefreq}</changefreq><priority>${p.priority}</priority></url>`
  );

  // Competitions
  (competitions || []).forEach(c => {
    urls.push(`<url><loc>${origin}/competitions/${c.id}</loc><lastmod>${c.updated_at?.substring(0, 10)}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>`);
  });

  // Exhibitions
  (exhibitions || []).forEach(e => {
    const slug = e.slug || e.id;
    urls.push(`<url><loc>${origin}/exhibitions/${slug}</loc><lastmod>${e.updated_at?.substring(0, 10)}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>`);
  });

  // Articles
  (articles || []).forEach(a => {
    urls.push(`<url><loc>${origin}/articles/${a.slug}</loc><lastmod>${a.updated_at?.substring(0, 10)}</lastmod><changefreq>weekly</changefreq><priority>0.7</priority></url>`);
  });

  // Profiles
  (profiles || []).forEach(p => {
    if (p.username) {
      urls.push(`<url><loc>${origin}/profile/${p.username}</loc><changefreq>monthly</changefreq><priority>0.5</priority></url>`);
    }
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;

  return new Response(xml, { headers: corsHeaders });
});
