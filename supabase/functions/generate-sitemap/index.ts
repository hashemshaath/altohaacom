import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const BASE = "https://altoha.com";
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const XML_HEADERS = { ...CORS, "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=10800, s-maxage=10800" };

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
  const entries = sitemaps.map(s => `<sitemap><loc>${esc(s)}</loc></sitemap>`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</sitemapindex>`;
}

function getClient() {
  return createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
}

const STATIC_PAGES = [
  { path: "/", p: "1.0", f: "daily" },
  { path: "/en/", p: "1.0", f: "daily" },
  { path: "/competitions", p: "1.0", f: "daily" },
  { path: "/exhibitions", p: "1.0", f: "daily" },
  { path: "/academies", p: "1.0", f: "daily" },
  { path: "/associations", p: "1.0", f: "daily" },
  { path: "/chefs", p: "1.0", f: "daily" },
  { path: "/events-calendar", p: "1.0", f: "daily" },
  { path: "/news", p: "1.0", f: "daily" },
  { path: "/about", p: "1.0", f: "daily" },
  { path: "/contact", p: "1.0", f: "daily" },
  { path: "/discover", p: "0.9", f: "daily" },
  { path: "/community", p: "0.8", f: "daily" },
  { path: "/rankings", p: "0.8", f: "weekly" },
  { path: "/recipes", p: "0.8", f: "weekly" },
  { path: "/masterclasses", p: "0.7", f: "weekly" },
  { path: "/shop", p: "0.7", f: "daily" },
  { path: "/chefs-table", p: "0.7", f: "weekly" },
  { path: "/pro-suppliers", p: "0.7", f: "weekly" },
  { path: "/mentorship", p: "0.7", f: "weekly" },
  { path: "/establishments", p: "0.7", f: "weekly" },
  { path: "/organizers", p: "0.7", f: "weekly" },
  { path: "/jobs", p: "0.7", f: "daily" },
  { path: "/entities", p: "0.6", f: "weekly" },
  { path: "/membership", p: "0.6", f: "monthly" },
  { path: "/search", p: "0.6", f: "daily" },
  { path: "/for-chefs", p: "0.8", f: "monthly" },
  { path: "/for-companies", p: "0.8", f: "monthly" },
  { path: "/for-organizers", p: "0.8", f: "monthly" },
  { path: "/sponsors", p: "0.8", f: "monthly" },
  { path: "/help", p: "0.5", f: "monthly" },
  { path: "/privacy", p: "0.3", f: "monthly" },
  { path: "/terms", p: "0.3", f: "monthly" },
  { path: "/cookies", p: "0.3", f: "monthly" },
  { path: "/verify/certificate", p: "0.4", f: "monthly" },
  { path: "/install", p: "0.4", f: "monthly" },
];

async function buildStatic(): Promise<string> {
  return wrapUrlset(STATIC_PAGES.map(p => urlTag(`${BASE}${p.path}`, p.p, p.f)));
}

async function buildChefs(): Promise<string> {
  const sb = getClient();
  const { data } = await sb.from("profiles").select("username, updated_at, profile_photo_url").not("username", "is", null).eq("is_public", true).order("updated_at", { ascending: false }).limit(5000);
  const urls = (data || []).filter(p => p.username).map(p => urlTag(`${BASE}/chef/${p.username}`, "0.8", "weekly", p.updated_at?.split("T")[0]));
  return wrapUrlset(urls);
}

async function buildCompetitions(): Promise<string> {
  const sb = getClient();
  const { data } = await sb.from("competitions").select("id, slug, updated_at").order("updated_at", { ascending: false }).limit(5000);
  const urls = (data || []).map(c => {
    const s = c.slug || c.id;
    return urlTag(`${BASE}/competitions/${s}`, "0.9", "daily", c.updated_at?.split("T")[0]);
  });
  return wrapUrlset(urls);
}

async function buildExhibitions(): Promise<string> {
  const sb = getClient();
  const { data } = await sb.from("exhibitions").select("slug, updated_at").order("updated_at", { ascending: false }).limit(5000);
  const urls = (data || []).map(e => urlTag(`${BASE}/exhibitions/${e.slug}`, "0.9", "weekly", e.updated_at?.split("T")[0]));
  return wrapUrlset(urls);
}

async function buildEntities(type: string, prefix: string, priority: string, freq: string): Promise<string> {
  const sb = getClient();
  const { data } = await sb.from("culinary_entities").select("slug, updated_at").eq("type", type).eq("status", "active").order("updated_at", { ascending: false }).limit(5000);
  const urls = (data || []).map(e => urlTag(`${BASE}/${prefix}/${e.slug}`, priority, freq, e.updated_at?.split("T")[0]));
  return wrapUrlset(urls);
}

async function buildBlog(): Promise<string> {
  const sb = getClient();
  const { data } = await sb.from("articles").select("slug, updated_at").eq("status", "published").order("updated_at", { ascending: false }).limit(5000);
  const urls = (data || []).map(a => urlTag(`${BASE}/news/${a.slug}`, "0.8", "never", a.updated_at?.split("T")[0]));
  return wrapUrlset(urls);
}

async function buildImages(): Promise<string> {
  const sb = getClient();
  const [chefs, comps, exhs] = await Promise.all([
    sb.from("profiles").select("username, full_name, profile_photo_url").not("username", "is", null).not("profile_photo_url", "is", null).eq("is_public", true).limit(2000),
    sb.from("competitions").select("id, slug, title, cover_image_url").not("cover_image_url", "is", null).limit(2000),
    sb.from("exhibitions").select("slug, title, cover_image_url").not("cover_image_url", "is", null).limit(2000),
  ]);

  const urls: string[] = [];
  for (const c of chefs.data || []) {
    if (!c.username || !c.profile_photo_url) continue;
    urls.push(`<url>
  <loc>${esc(`${BASE}/chef/${c.username}`)}</loc>
  <image:image>
    <image:loc>${esc(c.profile_photo_url)}</image:loc>
    <image:title>${esc(c.full_name || c.username)}</image:title>
  </image:image>
</url>`);
  }
  for (const c of comps.data || []) {
    const s = c.slug || c.id;
    urls.push(`<url>
  <loc>${esc(`${BASE}/competitions/${s}`)}</loc>
  <image:image>
    <image:loc>${esc(c.cover_image_url)}</image:loc>
    <image:title>${esc(c.title || "Competition")}</image:title>
  </image:image>
</url>`);
  }
  for (const e of exhs.data || []) {
    urls.push(`<url>
  <loc>${esc(`${BASE}/exhibitions/${e.slug}`)}</loc>
  <image:image>
    <image:loc>${esc(e.cover_image_url)}</image:loc>
    <image:title>${esc(e.title || "Exhibition")}</image:title>
  </image:image>
</url>`);
  }
  return wrapImageUrlset(urls);
}

const FN_BASE_URL = Deno.env.get("SUPABASE_URL")! + "/functions/v1/generate-sitemap";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

  const url = new URL(req.url);
  const type = url.searchParams.get("type") || "index";

  try {
    let xml: string;

    switch (type) {
      case "static":
        xml = await buildStatic();
        break;
      case "chefs":
        xml = await buildChefs();
        break;
      case "competitions":
        xml = await buildCompetitions();
        break;
      case "exhibitions":
        xml = await buildExhibitions();
        break;
      case "academies":
        xml = await buildEntities("academy", "entities", "0.8", "monthly");
        break;
      case "associations":
        xml = await buildEntities("association", "entities", "0.8", "monthly");
        break;
      case "events":
        xml = await buildEntities("event", "events-calendar", "0.9", "daily");
        break;
      case "blog":
        xml = await buildBlog();
        break;
      case "images":
        xml = await buildImages();
        break;
      case "full": {
        // Single combined sitemap (fallback)
        const sb = getClient();
        const [chefs, comps, exhs, articles] = await Promise.all([
          sb.from("profiles").select("username, updated_at").not("username", "is", null).eq("is_public", true).limit(1000),
          sb.from("competitions").select("id, slug, updated_at").limit(500),
          sb.from("exhibitions").select("slug, updated_at").limit(500),
          sb.from("articles").select("slug, updated_at").eq("status", "published").limit(1000),
        ]);
        const urls = STATIC_PAGES.map(p => urlTag(`${BASE}${p.path}`, p.p, p.f));
        for (const c of chefs.data || []) if (c.username) urls.push(urlTag(`${BASE}/chef/${c.username}`, "0.8", "weekly", c.updated_at?.split("T")[0]));
        for (const c of comps.data || []) urls.push(urlTag(`${BASE}/competitions/${c.slug || c.id}`, "0.9", "daily", c.updated_at?.split("T")[0]));
        for (const e of exhs.data || []) urls.push(urlTag(`${BASE}/exhibitions/${e.slug}`, "0.9", "weekly", e.updated_at?.split("T")[0]));
        for (const a of articles.data || []) urls.push(urlTag(`${BASE}/news/${a.slug}`, "0.8", "never", a.updated_at?.split("T")[0]));
        xml = wrapUrlset(urls);
        break;
      }
      case "index":
      default: {
        xml = sitemapIndex([
          `${FN_BASE_URL}?type=static`,
          `${FN_BASE_URL}?type=chefs`,
          `${FN_BASE_URL}?type=competitions`,
          `${FN_BASE_URL}?type=exhibitions`,
          `${FN_BASE_URL}?type=academies`,
          `${FN_BASE_URL}?type=associations`,
          `${FN_BASE_URL}?type=events`,
          `${FN_BASE_URL}?type=blog`,
          `${FN_BASE_URL}?type=images`,
        ]);

        // Auto-ping Google in the background
        try {
          fetch(`https://www.google.com/ping?sitemap=${encodeURIComponent(`${BASE}/sitemap.xml`)}`).catch(() => {});
        } catch { /* ignore */ }
        break;
      }
    }

    return new Response(xml, { headers: XML_HEADERS });
  } catch (error) {
    console.error("Sitemap error:", error);
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`,
      { status: 500, headers: XML_HEADERS }
    );
  }
});
