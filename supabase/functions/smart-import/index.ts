import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface SearchResultItem {
  id: string;
  name: string;
  description: string;
  url: string;
  latitude: number | null;
  longitude: number | null;
  rating: number | null;
  total_reviews: number | null;
}

// ─── Auth helper ───
async function authenticateAdmin(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) throw new Error("Unauthorized");
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );
  const { data: { user }, error } = await supabaseClient.auth.getUser();
  if (error || !user) throw new Error("Unauthorized");
  const { data: roles } = await supabaseClient.from('user_roles').select('role').eq('user_id', user.id).eq('role', 'supervisor');
  if (!roles?.length) throw new Error("Admin access required");
  return supabaseClient;
}

// ─── MODE: SEARCH via Firecrawl ───
async function handleSearch(query: string, firecrawlKey: string, location?: string): Promise<SearchResultItem[]> {
  const searchQuery = location ? `${query} ${location}` : query;

  console.log('[SmartImport] Firecrawl search:', searchQuery);
  const res = await fetch('https://api.firecrawl.dev/v1/search', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${firecrawlKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: searchQuery, limit: 10 }),
  });
  const data = await res.json();
  console.log('[SmartImport] Firecrawl search status:', res.status, 'results:', data?.data?.length || 0);

  if (!data?.success || !data?.data?.length) return [];

  return data.data.slice(0, 10).map((item: any, i: number) => {
    // Extract coords from Google Maps URLs if present
    const coordMatch = item.url?.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    const ratingMatch = (item.description || '').match(/(\d\.\d)\s*(?:star|⭐|rating)/i);
    const reviewMatch = (item.description || '').match(/(\d[\d,]*)\s*(?:review|تقييم)/i);

    return {
      id: `fc_${i}_${Date.now()}`,
      name: (item.title || '').replace(/\s*[-–|]\s*Google\s*Maps?$/i, '').trim() || item.url || 'Unknown',
      description: item.description || '',
      url: item.url || '',
      latitude: coordMatch ? parseFloat(coordMatch[1]) : null,
      longitude: coordMatch ? parseFloat(coordMatch[2]) : null,
      rating: ratingMatch ? parseFloat(ratingMatch[1]) : null,
      total_reviews: reviewMatch ? parseInt(reviewMatch[1].replace(/,/g, '')) : null,
    };
  });
}

// ─── MODE: DETAILS — scrape + AI enrich ───
async function handleDetails(
  query: string,
  firecrawlKey: string,
  resultUrl?: string,
  websiteUrl?: string,
  location?: string,
  latitude?: number,
  longitude?: number,
): Promise<{ data: any; sources_used: Record<string, boolean> }> {
  const sourcesUsed = { firecrawl_scrape: false, web_search: false, website: false, ai: true };
  let scrapedContent: string | null = null;
  let searchContent: string | null = null;
  let websiteContent: string | null = null;

  // 1. Scrape the result URL (could be a Google Maps page, a business page, etc.)
  if (resultUrl) {
    console.log('[SmartImport] Scraping result URL:', resultUrl);
    scrapedContent = await scrapeUrl(resultUrl, firecrawlKey);
    if (scrapedContent) sourcesUsed.firecrawl_scrape = true;
  }

  // 2. Web search for more context
  const searchQuery = location ? `${query} ${location}` : query;
  console.log('[SmartImport] Web search for details:', searchQuery);
  const searchRes = await fetch('https://api.firecrawl.dev/v1/search', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${firecrawlKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: searchQuery,
      limit: 5,
      scrapeOptions: { formats: ['markdown'] },
    }),
  });
  const searchData = await searchRes.json();
  if (searchData?.success && searchData?.data?.length) {
    searchContent = searchData.data.slice(0, 5).map((r: any) =>
      `## ${r.title || ''}\nURL: ${r.url}\n${r.description || ''}\n${(r.markdown || '').substring(0, 2000)}`
    ).join('\n\n---\n\n');
    sourcesUsed.web_search = true;
  }

  // 3. Scrape a dedicated website if provided
  if (websiteUrl) {
    console.log('[SmartImport] Scraping website:', websiteUrl);
    websiteContent = await scrapeUrl(websiteUrl, firecrawlKey);
    if (websiteContent) sourcesUsed.website = true;
  }

  // 4. AI enrichment
  console.log('[SmartImport] AI enrichment. Sources:', sourcesUsed);
  const enrichedData = await enrichWithAI(scrapedContent, searchContent, websiteContent, query, latitude, longitude);

  return { data: enrichedData, sources_used: sourcesUsed };
}

async function scrapeUrl(url: string, firecrawlKey: string): Promise<string | null> {
  try {
    let formatted = url.trim();
    if (!formatted.startsWith('http')) formatted = `https://${formatted}`;
    const res = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${firecrawlKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: formatted, formats: ['markdown'], onlyMainContent: true }),
    });
    const data = await res.json();
    return data?.data?.markdown || null;
  } catch (e) {
    console.error('[SmartImport] Scrape error:', e);
    return null;
  }
}

async function enrichWithAI(
  scrapedContent: string | null,
  searchContent: string | null,
  websiteContent: string | null,
  originalQuery: string,
  latitude?: number | null,
  longitude?: number | null,
): Promise<any> {
  const apiKey = Deno.env.get('LOVABLE_API_KEY');
  if (!apiKey) { console.error('LOVABLE_API_KEY not set'); return {}; }

  const prompt = `You are a bilingual data enrichment assistant (Arabic & English). Given raw scraped data and web search results, produce a clean, structured JSON object with REAL data only.

IMPORTANT RULES:
- Only include data you can verify from the provided sources
- If a field has no real data, set it to null (NOT placeholder text)
- The original search query was: "${originalQuery}"
${latitude && longitude ? `- Known coordinates: ${latitude}, ${longitude}` : ''}

${scrapedContent ? `SCRAPED CONTENT:\n${scrapedContent.substring(0, 4000)}` : ''}
${searchContent ? `WEB SEARCH RESULTS:\n${searchContent.substring(0, 4000)}` : ''}
${websiteContent ? `WEBSITE CONTENT:\n${websiteContent.substring(0, 3000)}` : ''}

Return ONLY valid JSON with this exact structure. Use null for unknown fields:
{
  "name_en": null, "name_ar": null, "description_en": null, "description_ar": null,
  "city_en": null, "city_ar": null, "neighborhood_en": null, "neighborhood_ar": null,
  "street_en": null, "street_ar": null, "full_address_en": null, "full_address_ar": null,
  "postal_code": null, "country_en": null, "country_ar": null, "country_code": null,
  "phone": null, "phone_secondary": null, "email": null, "website": null,
  "business_hours": [], "business_type_en": null, "business_type_ar": null,
  "rating": null, "total_reviews": null, "latitude": ${latitude || 'null'}, "longitude": ${longitude || 'null'},
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
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (mode === 'search') {
      if (!query) {
        return new Response(JSON.stringify({ success: false, error: "Search query is required" }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      const results = await handleSearch(query, firecrawlKey, location);
      return new Response(JSON.stringify({ success: true, results }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (mode === 'details') {
      if (!query) {
        return new Response(JSON.stringify({ success: false, error: "Query is required for details" }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      const result = await handleDetails(query, firecrawlKey, result_url, website_url, location, latitude, longitude);
      return new Response(JSON.stringify({ success: true, ...result }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ success: false, error: "Invalid mode" }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('[SmartImport] Error:', error);
    const msg = (error as Error).message;
    const status = msg === "Unauthorized" ? 401 : msg === "Admin access required" ? 403 : 500;
    return new Response(JSON.stringify({ success: false, error: msg }),
      { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
