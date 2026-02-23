import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};
const jsonHeaders = { ...corsHeaders, 'Content-Type': 'application/json' };

// ─── Types ───
interface SearchResult {
  id: string;
  name: string;
  description: string;
  url: string;
  latitude: number | null;
  longitude: number | null;
  rating: number | null;
  total_reviews: number | null;
  google_maps_url: string | null;
  place_type: string | null;
}

// ─── In-memory cache (per cold start) ───
const cache = new Map<string, { data: any; ts: number }>();
const CACHE_TTL = 5 * 60 * 1000;

function getCached(key: string): any | null {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.ts < CACHE_TTL) return entry.data;
  cache.delete(key);
  return null;
}
function setCache(key: string, data: any) {
  if (cache.size > 200) {
    const oldest = cache.keys().next().value;
    if (oldest) cache.delete(oldest);
  }
  cache.set(key, { data, ts: Date.now() });
}

// ─── Auth ───
async function authenticateAdmin(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) throw new Error("Unauthorized");
  const client = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );
  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user) throw new Error("Unauthorized");
  const { data: roles } = await client.from('user_roles').select('role').eq('user_id', user.id).eq('role', 'supervisor');
  if (!roles?.length) throw new Error("Admin access required");
  return client;
}

// ─── Firecrawl with timeout + retry ───
async function firecrawlFetch(url: string, body: any, apiKey: string, timeoutMs: number, retries = 1): Promise<any> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      const data = await res.json();
      if (res.ok) return data;
      if (attempt < retries && res.status >= 500) {
        console.warn(`[SmartImport] Retry ${attempt + 1} for ${url}`);
        await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
        continue;
      }
      return data;
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') {
        console.warn(`[SmartImport] Timed out (attempt ${attempt + 1}): ${url}`);
        if (attempt < retries) continue;
      } else {
        console.error(`[SmartImport] Fetch error:`, e);
      }
      return null;
    } finally { clearTimeout(timer); }
  }
  return null;
}

async function firecrawlSearch(query: string, apiKey: string, limit = 10, timeoutMs = 12000): Promise<any[]> {
  const data = await firecrawlFetch('https://api.firecrawl.dev/v1/search', { query, limit }, apiKey, timeoutMs);
  return data?.success ? (data.data || []) : [];
}

async function firecrawlScrape(url: string, apiKey: string, timeoutMs = 15000, formats: string[] = ['markdown']): Promise<any> {
  const cacheKey = `scrape:${url}:${formats.join(',')}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  let formatted = url.trim();
  if (!formatted.startsWith('http')) formatted = `https://${formatted}`;
  const data = await firecrawlFetch('https://api.firecrawl.dev/v1/scrape', {
    url: formatted, formats, onlyMainContent: formats.length === 1 && formats[0] === 'markdown',
  }, apiKey, timeoutMs);
  
  if (formats.includes('links') && formats.length > 1) {
    const result = {
      markdown: data?.data?.markdown || null,
      links: data?.data?.links || [],
      metadata: data?.data?.metadata || {},
    };
    setCache(cacheKey, result);
    return result;
  }
  
  const md = data?.data?.markdown || null;
  if (md) setCache(cacheKey, md);
  return md;
}

// Scrape with branding format for auto logo detection
async function firecrawlScrapeWithBranding(url: string, apiKey: string, timeoutMs = 18000): Promise<any> {
  const cacheKey = `scrape_branding:${url}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  let formatted = url.trim();
  if (!formatted.startsWith('http')) formatted = `https://${formatted}`;
  const data = await firecrawlFetch('https://api.firecrawl.dev/v1/scrape', {
    url: formatted, formats: ['markdown', 'links', 'branding'], onlyMainContent: false,
  }, apiKey, timeoutMs);
  
  const result = {
    markdown: data?.data?.markdown || null,
    links: data?.data?.links || [],
    metadata: data?.data?.metadata || {},
    branding: data?.data?.branding || data?.branding || null,
  };
  setCache(cacheKey, result);
  return result;
}

// ─── AI call with retry ───
async function callAI(prompt: string, lovableKey: string, model = 'google/gemini-2.5-flash-lite', temperature = 0.1, timeoutMs = 30000): Promise<string> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${lovableKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          messages: [{ role: 'system', content: 'You are a precise data extraction assistant. Return ONLY valid JSON. No markdown, no explanations.' }, { role: 'user', content: prompt }],
          temperature,
        }),
        signal: controller.signal,
      });
      if (!res.ok) {
        console.error('[SmartImport] AI error:', res.status);
        if (attempt === 0 && res.status >= 500) { await new Promise(r => setTimeout(r, 1500)); continue; }
        return '';
      }
      const data = await res.json();
      return data.choices?.[0]?.message?.content || '';
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') {
        console.warn(`[SmartImport] AI timed out (attempt ${attempt + 1})`);
        if (attempt === 0) continue;
      } else console.error('[SmartImport] AI error:', e);
      return '';
    } finally { clearTimeout(timer); }
  }
  return '';
}

// ─── MODE: SEARCH ───
async function handleSearch(query: string, apiKey: string, lovableKey: string, location?: string): Promise<SearchResult[]> {
  const searchTerm = location ? `${query} ${location}` : query;
  const cacheKey = `search:${searchTerm}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  console.log('[SmartImport] Searching:', searchTerm);
  const mapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(searchTerm)}`;

  // Parallel: scrape maps + fallback search + web search
  const [scraped, fallbackResults, webResults] = await Promise.all([
    firecrawlScrape(mapsUrl, apiKey, 18000),
    firecrawlSearch(`"${query}" ${location || ''} site:google.com/maps`, apiKey, 20, 10000),
    firecrawlSearch(`${query} ${location || ''} official website`, apiKey, 5, 8000),
  ]);

  let results: SearchResult[] = [];

  // Build fallback results from search APIs first (always available as backup)
  const fallbackParsed = fallbackResults.length ? extractEntitiesFromSearchResults(fallbackResults) : [];
  const webParsed = webResults.length ? extractEntitiesFromSearchResults(webResults) : [];

  if (scraped && scraped.length >= 50) {
    const aiResults = await extractEntitiesWithAI(scraped, searchTerm, lovableKey);
    // If AI succeeded, use its results; otherwise fall back
    results = aiResults.length > 0 ? aiResults : fallbackParsed;
    // Merge any extras from fallback
    if (aiResults.length > 0 && fallbackParsed.length) {
      const existingNames = new Set(results.map(r => r.name.toLowerCase()));
      for (const fb of fallbackParsed) {
        if (!existingNames.has(fb.name.toLowerCase())) results.push(fb);
      }
    }
  } else if (fallbackParsed.length) {
    results = fallbackParsed;
  } else if (webParsed.length) {
    results = webParsed;
  }

  // Last resort: merge web results
  if (results.length === 0 && webParsed.length) {
    results = webParsed;
  } else if (webParsed.length) {
    const existingNames = new Set(results.map(r => r.name.toLowerCase()));
    for (const wp of webParsed) {
      if (!existingNames.has(wp.name.toLowerCase())) results.push(wp);
    }
  }

  if (results.length) setCache(cacheKey, results);
  return results;
}

function extractEntitiesFromSearchResults(raw: any[]): SearchResult[] {
  const seen = new Set<string>();
  return raw.filter(item => {
    const url = item.url || '';
    if (!url || seen.has(url)) return false;
    seen.add(url);
    return true;
  }).map((item, i) => {
    const url = item.url || '';
    const title = (item.title || '').replace(/\s*[-–|]\s*Google\s*Maps?$/i, '').trim();
    const coordMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    return {
      id: `sr_${i}_${Date.now()}`,
      name: title || 'Unknown',
      description: (item.description || '').substring(0, 200),
      url,
      latitude: coordMatch ? parseFloat(coordMatch[1]) : null,
      longitude: coordMatch ? parseFloat(coordMatch[2]) : null,
      rating: null, total_reviews: null,
      google_maps_url: /google\.\w+\/maps/i.test(url) ? url : null,
      place_type: null,
    };
  });
}

async function extractEntitiesWithAI(scraped: string, searchTerm: string, lovableKey: string): Promise<SearchResult[]> {
  // Use less content to avoid timeouts
  const truncated = scraped.substring(0, 10000);
  const prompt = `Extract ALL business/entity listings from this Google Maps page.
SEARCH: "${searchTerm}"
CONTENT:
${truncated}

Return JSON array: [{"name":"...","description":"short desc","rating":4.5,"total_reviews":100,"place_type":"...","address":"..."}]
Rules: Every listing. No filtering. No hallucination. ONLY valid JSON array.`;

  // Use flash (not lite) with longer timeout for reliability
  const content = await callAI(prompt, lovableKey, 'google/gemini-2.5-flash', 0.1, 45000);
  if (!content) return [];
  try {
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const entities = JSON.parse(jsonMatch[0]);
      return entities.map((e: any, i: number) => ({
        id: `sr_${i}_${Date.now()}`,
        name: e.name || 'Unknown',
        description: e.address ? `${e.description || e.place_type || ''} • ${e.address}`.trim() : (e.description || e.place_type || ''),
        url: e.google_maps_url || `https://www.google.com/maps/search/${encodeURIComponent(e.name)}`,
        latitude: e.latitude || null, longitude: e.longitude || null,
        rating: e.rating || null, total_reviews: e.total_reviews || null,
        google_maps_url: e.google_maps_url || null, place_type: e.place_type || e.description || null,
      }));
    }
  } catch (e) { console.error('[SmartImport] AI parse error:', e); }
  return [];
}

// ─── MODE: DETAILS ───
async function handleDetails(
  query: string, apiKey: string, resultUrl?: string, websiteUrl?: string,
  location?: string, latitude?: number, longitude?: number,
): Promise<{ data: any; sources_used: Record<string, boolean>; data_quality: number; suggested_target: any }> {
  const cacheKey = `details:${query}:${resultUrl || ''}:${websiteUrl || ''}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const sources = { google_maps: false, web_search: false, website: false, ai: true };

  // Auto-detect website from result page if not provided
  let effectiveWebsiteUrl = websiteUrl;

  // Scrape website with branding format for automatic logo detection
  const [scrapedRaw, searchRaw, websiteRaw] = await Promise.all([
    resultUrl ? firecrawlScrape(resultUrl, apiKey, 18000, ['markdown', 'links']).catch(() => null) : Promise.resolve(null),
    firecrawlSearch(
      location ? `${query} ${location} contact address phone email` : `${query} contact address phone email`,
      apiKey, 8, 10000
    ).catch(() => []),
    effectiveWebsiteUrl ? firecrawlScrapeWithBranding(effectiveWebsiteUrl, apiKey, 18000).catch(() => null) : Promise.resolve(null),
  ]);

  const scraped = typeof scrapedRaw === 'string' ? scrapedRaw : scrapedRaw?.markdown || null;
  const websiteContent = typeof websiteRaw === 'string' ? websiteRaw : websiteRaw?.markdown || null;
  
  // Extract image URLs from scraped pages for logo/cover detection
  const allLinks: string[] = [];
  if (scrapedRaw?.links) allLinks.push(...scrapedRaw.links);
  if (websiteRaw?.links) allLinks.push(...websiteRaw.links);
  const imageUrls = allLinks.filter((l: string) => /\.(png|jpg|jpeg|svg|webp|gif)/i.test(l)).slice(0, 20);

  // Extract branding data (logo from Firecrawl's branding format)
  const brandingLogo = websiteRaw?.branding?.logo || websiteRaw?.branding?.images?.logo || null;
  const brandingFavicon = websiteRaw?.branding?.images?.favicon || null;
  const brandingOgImage = websiteRaw?.branding?.images?.ogImage || null;

  if (scraped) sources.google_maps = true;
  if (websiteContent) sources.website = true;

  // If no website was scraped, try to find official website from search results
  let extraWebsite: string | null = null;
  let searchContent: string | null = null;
  if (searchRaw.length) {
    sources.web_search = true;
    // Find official website (not google maps, not social media)
    const officialSite = searchRaw.find((r: any) => {
      const u = (r.url || '').toLowerCase();
      return !u.includes('google.com/maps') && !u.includes('facebook.com') && !u.includes('instagram.com') && !u.includes('twitter.com') && !u.includes('linkedin.com') && !u.includes('yelp.com') && !u.includes('tripadvisor.com');
    });
    if (officialSite && !websiteContent) {
      extraWebsite = await firecrawlScrape(officialSite.url, apiKey, 12000).catch(() => null);
      if (extraWebsite) sources.website = true;
    }
    searchContent = searchRaw.slice(0, 8).map((r: any) =>
      `## ${r.title || ''}\nURL: ${r.url}\n${r.description || ''}\n${(r.markdown || '').substring(0, 2000)}`
    ).join('\n\n---\n\n');
  }

  const lovableKey = Deno.env.get('LOVABLE_API_KEY')!;
  const enriched = await enrichWithAI(scraped, searchContent, websiteContent || extraWebsite, query, latitude, longitude, lovableKey, imageUrls);
  
  // Apply branding logo/cover if AI didn't find them
  if (!enriched.logo_url && brandingLogo) enriched.logo_url = brandingLogo;
  if (!enriched.logo_url && brandingFavicon) enriched.logo_url = brandingFavicon;
  if (!enriched.cover_url && brandingOgImage) enriched.cover_url = brandingOgImage;
  const dataQuality = calculateDataQuality(enriched, sources);
  const suggestion = autoDetectTargetTable(enriched);
  const result = { data: enriched, sources_used: sources, data_quality: dataQuality, suggested_target: suggestion };
  setCache(cacheKey, result);
  return result;
}

function calculateDataQuality(data: any, sources: Record<string, boolean>): number {
  let score = 0;
  const sourceCount = Object.values(sources).filter(Boolean).length;
  score += Math.min(sourceCount * 5, 20);
  if (data.name_en) score += 5;
  if (data.name_ar) score += 5;
  if (data.description_en && data.description_en.length > 50) score += 5;
  if (data.description_ar && data.description_ar.length > 50) score += 5;
  if (data.phone) score += 5;
  if (data.email) score += 5;
  if (data.website) score += 5;
  if (data.city_en || data.city_ar) score += 4;
  if (data.full_address_en || data.full_address_ar) score += 4;
  if (data.country_code) score += 3;
  if (data.postal_code) score += 2;
  if (data.latitude && data.longitude) score += 2;
  if (data.services_en?.length > 0) score += 5;
  if (data.specializations_en?.length > 0) score += 5;
  if (data.founded_year) score += 3;
  if (data.registration_number || data.license_number) score += 3;
  if (data.president_name_en || data.president_name_ar) score += 2;
  if (data.member_count) score += 2;
  if (data.social_media) {
    const socialCount = Object.values(data.social_media).filter(Boolean).length;
    score += Math.min(socialCount * 2, 5);
  }
  if (data.business_hours?.length > 0) score += 5;
  if (data.logo_url) score += 3;
  if (data.cover_url) score += 2;
  return Math.min(score, 100);
}

// ─── MODE: URL ───
async function handleUrlImport(url: string, apiKey: string, lovableKey: string): Promise<{ data: any; sources_used: Record<string, boolean>; data_quality: number }> {
  const cacheKey = `url:${url}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const sources = { google_maps: false, web_search: false, website: true, ai: true };
  const scraped = await firecrawlScrape(url, apiKey, 20000);
  if (!scraped || scraped.length < 20) throw new Error('Could not scrape the provided URL');

  const titleMatch = scraped.match(/^#\s*(.+)$/m);
  const entityName = titleMatch?.[1] || url.replace(/^https?:\/\//, '').split('/')[0];

  // Parallel: search + maps check
  const [searchRaw, mapsResult] = await Promise.all([
    firecrawlSearch(`${entityName} contact phone email`, apiKey, 5, 8000).catch(() => []),
    firecrawlSearch(`${entityName} site:google.com/maps`, apiKey, 3, 8000).catch(() => []),
  ]);

  let searchContent: string | null = null;
  if (searchRaw.length) {
    sources.web_search = true;
    searchContent = searchRaw.slice(0, 5).map((r: any) =>
      `## ${r.title || ''}\n${r.description || ''}\n${(r.markdown || '').substring(0, 1500)}`
    ).join('\n\n---\n\n');
  }

  let mapsContent: string | null = null;
  if (mapsResult.length) {
    const mapsUrl = mapsResult[0]?.url;
    if (mapsUrl && /google\.\w+\/maps/i.test(mapsUrl)) {
      mapsContent = await firecrawlScrape(mapsUrl, apiKey, 12000).catch(() => null);
      if (mapsContent) sources.google_maps = true;
    }
  }

  const enriched = await enrichWithAI(mapsContent, searchContent, scraped, entityName, null, null, lovableKey);
  const dataQuality = calculateDataQuality(enriched, sources);
  const result = { data: enriched, sources_used: sources, data_quality: dataQuality };
  setCache(cacheKey, result);
  return result;
}

// ─── MODE: BULK URL ───
async function handleBulkUrl(urls: string[], apiKey: string, lovableKey: string): Promise<{ results: any[] }> {
  const results: any[] = [];
  // Process up to 5 URLs in parallel
  for (let i = 0; i < urls.length; i += 5) {
    const batch = urls.slice(i, i + 5);
    const batchResults = await Promise.allSettled(
      batch.map(async (url) => {
        try {
          const result = await handleUrlImport(url, apiKey, lovableKey);
          const suggestion = autoDetectTargetTable(result.data);
          return { success: true, url, ...result, suggested_target: suggestion };
        } catch (e) {
          return { success: false, url, error: (e as Error).message };
        }
      })
    );
    for (const r of batchResults) {
      results.push(r.status === 'fulfilled' ? r.value : { success: false, error: 'Failed' });
    }
  }
  return { results };
}

// ─── AI Enrichment ───
async function enrichWithAI(
  scraped: string | null, search: string | null, website: string | null,
  query: string, lat?: number | null, lng?: number | null, lovableKey?: string,
  imageUrls?: string[],
): Promise<any> {
  const apiKey = lovableKey || Deno.env.get('LOVABLE_API_KEY');
  if (!apiKey) { console.error('LOVABLE_API_KEY not set'); return {}; }

  const imageContext = imageUrls?.length
    ? `\nIMAGE URLs found on the page:\n${imageUrls.join('\n')}\n\nFrom these URLs, identify:\n- logo_url: The company/entity logo (usually small, contains "logo" in name or path, or is an SVG)\n- cover_url: A cover/banner/hero image (usually wide, large resolution, header/banner image)\nIf no suitable image found, set null.`
    : '';

  const prompt = `You are a bilingual data extraction expert (Arabic & English). Extract ALL available data from these sources into a structured JSON.

RULES:
- Every _en/_ar field pair: if only one language found, TRANSLATE to the other professionally
- If a field has no data, set null
- Search query was: "${query}"
${lat && lng ? `- Coordinates: ${lat}, ${lng}` : ''}

SEO: Write compelling keyword-rich descriptions (150-300 chars). Tags: 5-10 English SEO keywords.
${imageContext}

${scraped ? `GOOGLE MAPS:\n${scraped.substring(0, 6000)}` : ''}
${search ? `WEB SEARCH:\n${search.substring(0, 5000)}` : ''}
${website ? `WEBSITE:\n${website.substring(0, 5000)}` : ''}

Return ONLY valid JSON:
{
  "name_en": null, "name_ar": null,
  "abbreviation_en": null, "abbreviation_ar": null,
  "description_en": "SEO description 150-300 chars",
  "description_ar": "وصف محسّن 150-300 حرف",
  "mission_en": null, "mission_ar": null,
  "city_en": null, "city_ar": null,
  "neighborhood_en": null, "neighborhood_ar": null,
  "street_en": null, "street_ar": null,
  "full_address_en": null, "full_address_ar": null,
  "postal_code": null,
  "country_en": null, "country_ar": null, "country_code": null,
  "phone": null, "phone_secondary": null, "fax": null,
  "email": null, "website": null,
  "business_hours": [
    {"day_en":"Saturday","day_ar":"السبت","open":"09:00","close":"17:00","is_closed":false},
    {"day_en":"Sunday","day_ar":"الأحد","open":"09:00","close":"17:00","is_closed":false},
    {"day_en":"Monday","day_ar":"الاثنين","open":"09:00","close":"17:00","is_closed":false},
    {"day_en":"Tuesday","day_ar":"الثلاثاء","open":"09:00","close":"17:00","is_closed":false},
    {"day_en":"Wednesday","day_ar":"الأربعاء","open":"09:00","close":"17:00","is_closed":false},
    {"day_en":"Thursday","day_ar":"الخميس","open":"09:00","close":"17:00","is_closed":false},
    {"day_en":"Friday","day_ar":"الجمعة","open":"09:00","close":"17:00","is_closed":true}
  ],
  "business_type_en": null, "business_type_ar": null,
  "rating": null, "total_reviews": null,
  "latitude": ${lat || 'null'}, "longitude": ${lng || 'null'},
  "google_maps_url": null,
  "national_id": null, "registration_number": null, "license_number": null,
  "founded_year": null,
  "president_name_en": null, "president_name_ar": null,
  "secretary_name_en": null, "secretary_name_ar": null,
  "member_count": null,
  "services_en": [], "services_ar": [],
  "specializations_en": [], "specializations_ar": [],
  "affiliated_organizations": [],
  "tags": [],
  "social_media": {"instagram":null,"twitter":null,"facebook":null,"linkedin":null,"tiktok":null,"youtube":null,"snapchat":null,"whatsapp":null},
  "logo_url": null,
  "cover_url": null,
  "venue_en": null, "venue_ar": null,
  "start_date": null, "end_date": null,
  "registration_url": null, "registration_deadline": null,
  "max_attendees": null,
  "organizer_name_en": null, "organizer_name_ar": null,
  "map_url": null,
  "ticket_price": null, "is_free": null, "is_virtual": null, "virtual_link": null,
  "target_audience": [],
  "registration_fee": null,
  "rules_summary_en": null, "rules_summary_ar": null,
  "edition_year": null
}

Extract ALL data. Services & specializations in BOTH languages. Business hours from ACTUAL data (24h format). Social media links. Logo and cover images from available URLs.
For exhibitions/conferences/competitions: extract venue, dates (YYYY-MM-DD format), registration info, organizer details, ticket pricing, and target audience.`;

  const content = await callAI(prompt, apiKey, 'google/gemini-3-flash-preview', 0.1, 30000);
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
  } catch (e) { console.error('[SmartImport] AI parse error:', e); }
  return {};
}

// ─── Auto-detect target ───
function autoDetectTargetTable(data: any): { table: string; sub_type: string; confidence: number } {
  const bt = (data.business_type_en || data.description_en || '').toLowerCase();
  const name = (data.name_en || '').toLowerCase();
  const all = `${bt} ${name}`;

  // Exhibition / Conference patterns (check first - higher priority)
  const exhibitionPatterns: Record<string, string[]> = {
    exhibition: ['exhibition', 'expo', 'trade show', 'trade fair', 'fair', 'showcase', 'food show'],
    conference: ['conference', 'congress', 'forum', 'symposium', 'convention'],
    summit: ['summit', 'global summit'],
    workshop: ['workshop', 'seminar', 'masterclass', 'bootcamp'],
    food_festival: ['food festival', 'festival', 'culinary festival', 'gastronomy festival', 'food week'],
    trade_show: ['trade show', 'b2b event'],
    competition_event: ['competition event', 'championship event'],
  };
  for (const [type, keywords] of Object.entries(exhibitionPatterns)) {
    if (keywords.some(k => all.includes(k))) return { table: 'exhibitions', sub_type: type, confidence: 0.85 };
  }

  // Competition patterns
  const competitionKeywords = ['competition', 'championship', 'contest', 'culinary competition', 'cooking competition', 'chef competition', 'bake off', 'cook off', 'challenge', 'cup', 'prix', 'award ceremony'];
  if (competitionKeywords.some(k => all.includes(k))) return { table: 'competitions', sub_type: 'competition', confidence: 0.85 };

  const estPatterns: Record<string, string[]> = {
    restaurant: ['restaurant', 'dining', 'eatery', 'grill', 'bistro', 'pizzeria', 'sushi', 'steakhouse', 'food court'],
    hotel: ['hotel', 'motel', 'inn', 'lodge', 'hostel', 'accommodation', 'suites'],
    cafe: ['cafe', 'café', 'coffee', 'tea house', 'coffeehouse'],
    bakery: ['bakery', 'pastry', 'patisserie', 'confectionery'],
    catering: ['catering', 'banquet', 'event food'],
    kitchen: ['kitchen', 'cloud kitchen', 'ghost kitchen', 'commissary'],
    resort: ['resort', 'spa', 'wellness center'],
    club: ['club', 'lounge', 'bar', 'pub', 'nightclub'],
  };
  for (const [type, keywords] of Object.entries(estPatterns)) {
    if (keywords.some(k => all.includes(k))) return { table: 'establishments', sub_type: type, confidence: 0.85 };
  }

  const companyPatterns: Record<string, string[]> = {
    supplier: ['supplier', 'supply', 'wholesale', 'distributor', 'distribution', 'import', 'export', 'trading', 'manufacturer', 'equipment', 'packaging'],
    sponsor: ['sponsor', 'sponsorship'],
    partner: ['partner', 'consulting', 'consultancy', 'agency', 'marketing', 'media', 'advertising', 'technology', 'tech', 'software'],
    vendor: ['vendor', 'seller', 'store', 'shop', 'retail', 'market', 'supermarket', 'grocery'],
  };
  for (const [type, keywords] of Object.entries(companyPatterns)) {
    if (keywords.some(k => all.includes(k))) return { table: 'companies', sub_type: type, confidence: 0.8 };
  }

  const entityPatterns: Record<string, string[]> = {
    culinary_association: ['association', 'society', 'federation', 'union', 'guild', 'chef association'],
    government_entity: ['government', 'ministry', 'municipality', 'authority', 'department', 'bureau'],
    culinary_academy: ['academy', 'culinary school', 'culinary institute', 'cooking school'],
    university: ['university'],
    college: ['college'],
    training_center: ['training center', 'training centre', 'workshop', 'learning center'],
    industry_body: ['industry body', 'standards', 'certification body', 'accreditation'],
    private_association: ['private association', 'foundation', 'ngo', 'non-profit', 'nonprofit', 'charity'],
  };
  for (const [type, keywords] of Object.entries(entityPatterns)) {
    if (keywords.some(k => all.includes(k))) return { table: 'culinary_entities', sub_type: type, confidence: 0.8 };
  }

  if (data.rating || data.total_reviews) return { table: 'establishments', sub_type: 'restaurant', confidence: 0.5 };
  return { table: 'culinary_entities', sub_type: 'culinary_association', confidence: 0.3 };
}

// ─── Stats endpoint ───
async function handleStats(client: any): Promise<any> {
  const [entities, companies, establishments, exhibitions, competitions, logs] = await Promise.all([
    client.from('culinary_entities').select('id', { count: 'exact', head: true }),
    client.from('companies').select('id', { count: 'exact', head: true }),
    client.from('establishments').select('id', { count: 'exact', head: true }),
    client.from('exhibitions').select('id', { count: 'exact', head: true }),
    client.from('competitions').select('id', { count: 'exact', head: true }),
    client.from('smart_import_logs').select('id, action, target_table, created_at, status').order('created_at', { ascending: false }).limit(200),
  ]);

  const logsData = logs.data || [];
  const today = new Date().toISOString().split('T')[0];
  const todayImports = logsData.filter((l: any) => l.created_at?.startsWith(today)).length;
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
  const weekImports = logsData.filter((l: any) => l.created_at >= weekAgo).length;

  return {
    totals: {
      entities: entities.count || 0,
      companies: companies.count || 0,
      establishments: establishments.count || 0,
      exhibitions: exhibitions.count || 0,
      competitions: competitions.count || 0,
    },
    imports: {
      today: todayImports,
      week: weekImports,
      total: logsData.length,
      by_table: {
        culinary_entities: logsData.filter((l: any) => l.target_table === 'culinary_entities').length,
        companies: logsData.filter((l: any) => l.target_table === 'companies').length,
        establishments: logsData.filter((l: any) => l.target_table === 'establishments').length,
        exhibitions: logsData.filter((l: any) => l.target_table === 'exhibitions').length,
        competitions: logsData.filter((l: any) => l.target_table === 'competitions').length,
      },
      by_action: {
        create: logsData.filter((l: any) => l.action === 'create').length,
        update: logsData.filter((l: any) => l.action === 'update').length,
      },
    },
    recent: logsData.slice(0, 10),
  };
}

// ─── Main handler ───
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const client = await authenticateAdmin(req);
    const body = await req.json();
    const { query, location, website_url, mode = 'search', result_url, latitude, longitude, url, urls } = body;

    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
    const lovableKey = Deno.env.get('LOVABLE_API_KEY');

    // Stats mode doesn't need API keys
    if (mode === 'stats') {
      const stats = await handleStats(client);
      return new Response(JSON.stringify({ success: true, stats }), { headers: jsonHeaders });
    }

    if (!firecrawlKey) return new Response(JSON.stringify({ success: false, error: "Firecrawl not configured." }), { status: 400, headers: jsonHeaders });
    if (!lovableKey) return new Response(JSON.stringify({ success: false, error: "AI service not configured." }), { status: 400, headers: jsonHeaders });

    // Bulk URL import
    if (mode === 'bulk_url') {
      if (!urls?.length) return new Response(JSON.stringify({ success: false, error: "URLs required" }), { status: 400, headers: jsonHeaders });
      const result = await handleBulkUrl(urls.slice(0, 10), firecrawlKey, lovableKey);
      return new Response(JSON.stringify({ success: true, ...result }), { headers: jsonHeaders });
    }

    // Direct URL
    if (mode === 'url') {
      if (!url?.trim()) return new Response(JSON.stringify({ success: false, error: "URL required" }), { status: 400, headers: jsonHeaders });
      const result = await handleUrlImport(url.trim(), firecrawlKey, lovableKey);
      const suggestion = autoDetectTargetTable(result.data);
      return new Response(JSON.stringify({ success: true, ...result, suggested_target: suggestion }), { headers: jsonHeaders });
    }

    if (!query?.trim()) return new Response(JSON.stringify({ success: false, error: "Query required" }), { status: 400, headers: jsonHeaders });

    if (mode === 'search') {
      const results = await handleSearch(query.trim(), firecrawlKey, lovableKey, location?.trim());
      return new Response(JSON.stringify({ success: true, results }), { headers: jsonHeaders });
    }

    if (mode === 'details') {
      const result = await handleDetails(query.trim(), firecrawlKey, result_url, website_url, location?.trim(), latitude, longitude);
      return new Response(JSON.stringify({ success: true, ...result }), { headers: jsonHeaders });
    }

    return new Response(JSON.stringify({ success: false, error: "Invalid mode." }), { status: 400, headers: jsonHeaders });
  } catch (error) {
    console.error('[SmartImport] Error:', error);
    const msg = (error as Error).message;
    const status = msg === "Unauthorized" ? 401 : msg === "Admin access required" ? 403 : 500;
    return new Response(JSON.stringify({ success: false, error: msg }), { status, headers: jsonHeaders });
  }
});
