import { handleCors } from "../_shared/cors.ts";
import { getServiceClient } from "../_shared/auth.ts";

const BASE = "https://altoha.com";
const XML_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/xml; charset=utf-8",
  "Cache-Control": "public, max-age=10800, s-maxage=10800",
};

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

function urlTag(loc: string, priority: string, changefreq: string, lastmod?: string): string {
  const e = esc(loc);
  return `<url>
  <loc>${e}</loc>${lastmod ? `\n  <lastmod>${lastmod}</lastmod>` : ""}
  <changefreq>${changefreq}</changefreq>
  <priority>${priority}</priority>
  <xhtml:link rel="alternate" hreflang="ar" href="${e}"/>
  <xhtml:link rel="alternate" hreflang="en" href="${e}?lang=en"/>
  <xhtml:link rel="alternate" hreflang="x-default" href="${e}"/>
</url>`;
}

function wrapUrlset(urls: string[]): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join("\n")}
</urlset>`;
}

function wrapImageUrlset(urls: string[]): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls.join("\n")}
</urlset>`;
}

function sitemapIndex(sitemaps: string[]): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps.map(s => `<sitemap><loc>${esc(s)}</loc></sitemap>`).join("\n")}
</sitemapindex>`;
}

const STATIC_PAGES = [
  { path: "/", p: "1.0", f: "daily" }, { path: "/competitions", p: "0.8", f: "daily" },
  { path: "/exhibitions", p: "0.8", f: "daily" }, { path: "/blog", p: "0.8", f: "daily" },
  { path: "/masterclasses", p: "0.8", f: "daily" }, { path: "/recipes", p: "0.8", f: "daily" },
  { path: "/establishments", p: "0.8", f: "daily" }, { path: "/mentorship", p: "0.8", f: "daily" },
  { path: "/jobs", p: "0.8", f: "daily" }, { path: "/pro-suppliers", p: "0.8", f: "daily" },
  { path: "/entities", p: "0.8", f: "daily" }, { path: "/organizers", p: "0.8", f: "daily" },
  { path: "/events-calendar", p: "0.8", f: "daily" }, { path: "/membership", p: "0.8", f: "weekly" },
  { path: "/about", p: "0.5", f: "monthly" }, { path: "/contact", p: "0.5", f: "monthly" },
  { path: "/rankings", p: "0.8", f: "weekly" }, { path: "/discover", p: "0.7", f: "daily" },
  { path: "/chefs-table", p: "0.7", f: "weekly" }, { path: "/shop", p: "0.7", f: "daily" },
  { path: "/for-chefs", p: "0.6", f: "monthly" }, { path: "/for-companies", p: "0.6", f: "monthly" },
  { path: "/for-organizers", p: "0.6", f: "monthly" }, { path: "/sponsors", p: "0.6", f: "monthly" },
  { path: "/help", p: "0.3", f: "monthly" }, { path: "/privacy", p: "0.3", f: "monthly" },
  { path: "/terms", p: "0.3", f: "monthly" }, { path: "/cookies", p: "0.3", f: "monthly" },
  { path: "/verify/certificate", p: "0.3", f: "monthly" }, { path: "/install", p: "0.3", f: "monthly" },
];

async function buildDynamic(table: string, slugField: string, pathPrefix: string, priority: string, freq: string, filter?: (q: any) => any): Promise<string> {
  const sb = getServiceClient();
  let query = sb.from(table).select(`${slugField}, updated_at`).not(slugField, "is", null).order("updated_at", { ascending: false }).limit(5000);
  if (filter) query = filter(query);
  const { data } = await query;
  return wrapUrlset((data || []).filter(r => r[slugField]).map(r => urlTag(`${BASE}${pathPrefix}/${r[slugField]}`, priority, freq, r.updated_at?.split("T")[0])));
}

async function buildImages(): Promise<string> {
  const sb = getServiceClient();
  const [chefs, comps, exhs] = await Promise.all([
    sb.from("profiles").select("username, full_name, profile_photo_url").not("username", "is", null).not("profile_photo_url", "is", null).limit(2000),
    sb.from("competitions").select("slug, title, cover_image_url").not("cover_image_url", "is", null).not("slug", "is", null).limit(2000),
    sb.from("exhibitions").select("slug, title, cover_image_url").not("cover_image_url", "is", null).not("slug", "is", null).limit(2000),
  ]);

  const urls: string[] = [];
  for (const c of chefs.data || []) {
    if (!c.username || !c.profile_photo_url) continue;
    urls.push(`<url><loc>${esc(`${BASE}/${c.username}`)}</loc><image:image><image:loc>${esc(c.profile_photo_url)}</image:loc><image:title>${esc(c.full_name || c.username)}</image:title></image:image></url>`);
  }
  for (const c of comps.data || []) {
    if (!c.slug) continue;
    urls.push(`<url><loc>${esc(`${BASE}/competitions/${c.slug}`)}</loc><image:image><image:loc>${esc(c.cover_image_url)}</image:loc><image:title>${esc(c.title || "Competition")}</image:title></image:image></url>`);
  }
  for (const e of exhs.data || []) {
    urls.push(`<url><loc>${esc(`${BASE}/exhibitions/${e.slug}`)}</loc><image:image><image:loc>${esc(e.cover_image_url)}</image:loc><image:title>${esc(e.title || "Exhibition")}</image:title></image:image></url>`);
  }
  return wrapImageUrlset(urls);
}

const FN_BASE_URL = Deno.env.get("SUPABASE_URL")! + "/functions/v1/generate-sitemap";

Deno.serve(async (req) => {
  const corsRes = handleCors(req);
  if (corsRes) return corsRes;

  const url = new URL(req.url);
  const type = url.searchParams.get("type") || "index";

  try {
    let xml: string;

    switch (type) {
      case "static": xml = wrapUrlset(STATIC_PAGES.map(p => urlTag(`${BASE}${p.path}`, p.p, p.f))); break;
      case "chefs": xml = await buildDynamic("profiles", "username", "", "0.6", "weekly"); break;
      case "competitions": xml = await buildDynamic("competitions", "slug", "/competitions", "0.8", "weekly"); break;
      case "exhibitions": xml = await buildDynamic("exhibitions", "slug", "/exhibitions", "0.8", "weekly"); break;
      case "blog": xml = await buildDynamic("articles", "slug", "/blog", "0.7", "weekly", q => q.eq("status", "published")); break;
      case "masterclasses": xml = await buildDynamic("masterclasses", "id", "/masterclasses", "0.5", "weekly", q => q.eq("status", "published")); break;
      case "recipes": xml = await buildDynamic("recipes", "slug", "/recipes", "0.5", "weekly", q => q.eq("is_published", true)); break;
      case "establishments": xml = await buildDynamic("establishments", "id", "/establishments", "0.5", "weekly", q => q.eq("is_active", true)); break;
      case "mentorship": xml = await buildDynamic("mentorship_programs", "id", "/mentorship", "0.5", "weekly", q => q.eq("status", "active")); break;
      case "entities": xml = await buildDynamic("culinary_entities", "slug", "/entities", "0.5", "monthly", q => q.eq("status", "active")); break;
      case "images": xml = await buildImages(); break;
      default: {
        xml = sitemapIndex([
          "static", "chefs", "competitions", "exhibitions", "blog",
          "masterclasses", "recipes", "establishments", "mentorship", "entities", "images",
        ].map(t => `${FN_BASE_URL}?type=${t}`));
        try { fetch(`https://www.google.com/ping?sitemap=${encodeURIComponent(`${BASE}/sitemap.xml`)}`).catch(() => {}); } catch { /* ignore */ }
      }
    }

    return new Response(xml, { headers: XML_HEADERS });
  } catch (error) {
    console.error("Sitemap error:", error);
    return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`, { status: 500, headers: XML_HEADERS });
  }
});
