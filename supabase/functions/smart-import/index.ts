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

// ─── Firecrawl helpers ───
async function firecrawlSearch(query: string, apiKey: string, limit = 10): Promise<any[]> {
  const res = await fetch('https://api.firecrawl.dev/v1/search', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, limit }),
  });
  const data = await res.json();
  if (!data?.success) return [];
  return data.data || [];
}

async function firecrawlScrape(url: string, apiKey: string): Promise<string | null> {
  try {
    let formatted = url.trim();
    if (!formatted.startsWith('http')) formatted = `https://${formatted}`;
    const res = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: formatted, formats: ['markdown'], onlyMainContent: true }),
    });
    const data = await res.json();
    return data?.data?.markdown || null;
  } catch (e) {
    console.error('[SmartImport] Scrape error:', e);
    return null;
  }
}

// ─── Parse search results ───
function parseSearchResults(raw: any[]): SearchResult[] {
  return raw.slice(0, 10).map((item: any, i: number) => {
    const url = item.url || '';
    const title = (item.title || '').replace(/\s*[-–|]\s*Google\s*Maps?$/i, '').trim();
    const desc = item.description || '';

    // Extract coordinates from Google Maps URLs
    const coordMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    const ratingMatch = desc.match(/(\d\.\d)\s*(?:star|⭐|rating|نجوم)/i);
    const reviewMatch = desc.match(/(\d[\d,]*)\s*(?:review|تقييم)/i);

    const isGoogleMaps = /google\.\w+\/maps/i.test(url);

    return {
      id: `sr_${i}_${Date.now()}`,
      name: title || url || 'Unknown',
      description: desc,
      url,
      latitude: coordMatch ? parseFloat(coordMatch[1]) : null,
      longitude: coordMatch ? parseFloat(coordMatch[2]) : null,
      rating: ratingMatch ? parseFloat(ratingMatch[1]) : null,
      total_reviews: reviewMatch ? parseInt(reviewMatch[1].replace(/,/g, '')) : null,
      google_maps_url: isGoogleMaps ? url : null,
    };
  });
}

// ─── MODE: SEARCH ───
async function handleSearch(query: string, apiKey: string, location?: string): Promise<SearchResult[]> {
  const searchQuery = location ? `${query} ${location}` : query;
  console.log('[SmartImport] Search:', searchQuery);

  // Run two searches in parallel: general + Google Maps specific
  const [generalResults, mapsResults] = await Promise.all([
    firecrawlSearch(searchQuery, apiKey, 5),
    firecrawlSearch(`${searchQuery} site:google.com/maps`, apiKey, 5),
  ]);

  // Merge: maps results first, then general, deduplicate by URL
  const combined = [...mapsResults, ...generalResults];
  const seen = new Set<string>();
  const unique = combined.filter(item => {
    const url = item.url || '';
    if (seen.has(url)) return false;
    seen.add(url);
    return true;
  });

  return parseSearchResults(unique);
}

// ─── MODE: DETAILS ───
async function handleDetails(
  query: string,
  apiKey: string,
  resultUrl?: string,
  websiteUrl?: string,
  location?: string,
  latitude?: number,
  longitude?: number,
): Promise<{ data: any; sources_used: Record<string, boolean> }> {
  const sources = { scrape: false, web_search: false, website: false, ai: true };

  // Run scrape + search + website in parallel
  const scrapePromise = resultUrl ? firecrawlScrape(resultUrl, apiKey) : Promise.resolve(null);
  
  const searchQuery = location ? `${query} ${location} contact address phone` : `${query} contact address phone`;
  const searchPromise = firecrawlSearch(searchQuery, apiKey, 5);
  
  const websitePromise = websiteUrl ? firecrawlScrape(websiteUrl, apiKey) : Promise.resolve(null);

  const [scraped, searchRaw, websiteContent] = await Promise.all([scrapePromise, searchPromise, websitePromise]);

  if (scraped) sources.scrape = true;
  if (websiteContent) sources.website = true;

  let searchContent: string | null = null;
  if (searchRaw.length) {
    sources.web_search = true;
    searchContent = searchRaw.slice(0, 5).map((r: any) =>
      `## ${r.title || ''}\nURL: ${r.url}\n${r.description || ''}\n${(r.markdown || '').substring(0, 2000)}`
    ).join('\n\n---\n\n');
  }

  console.log('[SmartImport] Sources:', sources);
  const enriched = await enrichWithAI(scraped, searchContent, websiteContent, query, latitude, longitude);
  return { data: enriched, sources_used: sources };
}

// ─── AI Enrichment ───
async function enrichWithAI(
  scraped: string | null,
  search: string | null,
  website: string | null,
  query: string,
  lat?: number | null,
  lng?: number | null,
): Promise<any> {
  const apiKey = Deno.env.get('LOVABLE_API_KEY');
  if (!apiKey) { console.error('LOVABLE_API_KEY not set'); return {}; }

  const prompt = `You are a bilingual data enrichment assistant (Arabic & English). Given raw scraped data and web search results, produce a clean, structured JSON object with REAL data only.

RULES:
- Only include data you can verify from the provided sources
- If a field has no real data, set it to null
- The original search query was: "${query}"
${lat && lng ? `- Known coordinates: ${lat}, ${lng}` : ''}

${scraped ? `SCRAPED CONTENT:\n${scraped.substring(0, 4000)}` : ''}
${search ? `WEB SEARCH RESULTS:\n${search.substring(0, 4000)}` : ''}
${website ? `WEBSITE CONTENT:\n${website.substring(0, 3000)}` : ''}

Return ONLY valid JSON:
{
  "name_en": null, "name_ar": null, "description_en": null, "description_ar": null,
  "city_en": null, "city_ar": null, "neighborhood_en": null, "neighborhood_ar": null,
  "street_en": null, "street_ar": null, "full_address_en": null, "full_address_ar": null,
  "postal_code": null, "country_en": null, "country_ar": null, "country_code": null,
  "phone": null, "phone_secondary": null, "email": null, "website": null,
  "business_hours": [], "business_type_en": null, "business_type_ar": null,
  "rating": ${lat ? 'null' : 'null'}, "total_reviews": null,
  "latitude": ${lat || 'null'}, "longitude": ${lng || 'null'},
  "google_maps_url": null, "national_id": null,
  "social_media": { "instagram": null, "twitter": null, "facebook": null, "linkedin": null, "tiktok": null }
}`;

  try {
    const res = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'google/gemini-2.5-flash', messages: [{ role: 'user', content: prompt }], temperature: 0.1 }),
    });
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || '';
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
  } catch (e) { console.error('[SmartImport] AI error:', e); }
  return {};
}

// ─── Main handler ───
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    await authenticateAdmin(req);
    const body = await req.json();
    const { query, location, website_url, mode = 'search', result_url, latitude, longitude } = body;

    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!firecrawlKey) {
      return new Response(
        JSON.stringify({ success: false, error: "Firecrawl is not configured. Please connect the Firecrawl connector." }),
        { status: 400, headers: jsonHeaders }
      );
    }

    if (!query?.trim()) {
      return new Response(JSON.stringify({ success: false, error: "Query is required" }), { status: 400, headers: jsonHeaders });
    }

    if (mode === 'search') {
      const results = await handleSearch(query.trim(), firecrawlKey, location?.trim());
      return new Response(JSON.stringify({ success: true, results }), { headers: jsonHeaders });
    }

    if (mode === 'details') {
      const result = await handleDetails(query.trim(), firecrawlKey, result_url, website_url, location?.trim(), latitude, longitude);
      return new Response(JSON.stringify({ success: true, ...result }), { headers: jsonHeaders });
    }

    return new Response(JSON.stringify({ success: false, error: "Invalid mode. Use 'search' or 'details'." }), { status: 400, headers: jsonHeaders });
  } catch (error) {
    console.error('[SmartImport] Error:', error);
    const msg = (error as Error).message;
    const status = msg === "Unauthorized" ? 401 : msg === "Admin access required" ? 403 : 500;
    return new Response(JSON.stringify({ success: false, error: msg }), { status, headers: jsonHeaders });
  }
});
