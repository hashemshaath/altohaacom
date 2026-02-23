import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface SearchResultItem {
  place_id: string;
  name: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  rating: number | null;
  total_reviews: number | null;
  types: string[];
  business_status: string | null;
  google_maps_url: string | null;
}

// ─── Search Google Maps via Firecrawl ───
async function searchGoogleMapsViaFirecrawl(query: string, firecrawlKey: string, location?: string): Promise<SearchResultItem[]> {
  const searchQuery = location ? `${query} ${location} site:google.com/maps` : `${query} site:google.com/maps`;

  const res = await fetch('https://api.firecrawl.dev/v1/search', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${firecrawlKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: searchQuery,
      limit: 10,
    }),
  });
  const data = await res.json();
  console.log('Firecrawl search response status:', res.status);

  if (!data?.success || !data?.data?.length) {
    // Fallback: search without site restriction
    const fallbackRes = await fetch('https://api.firecrawl.dev/v1/search', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${firecrawlKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: location ? `${query} ${location} google maps` : `${query} google maps`,
        limit: 10,
      }),
    });
    const fallbackData = await fallbackRes.json();
    if (!fallbackData?.success || !fallbackData?.data?.length) return [];
    return parseFirecrawlResults(fallbackData.data);
  }

  return parseFirecrawlResults(data.data);
}

function parseFirecrawlResults(results: any[]): SearchResultItem[] {
  return results
    .filter((r: any) => r.url || r.title)
    .slice(0, 10)
    .map((r: any, i: number) => {
      // Try to extract coordinates from URL
      const coordMatch = r.url?.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
      const lat = coordMatch ? parseFloat(coordMatch[1]) : null;
      const lng = coordMatch ? parseFloat(coordMatch[2]) : null;

      // Try to extract rating from description/markdown
      const ratingMatch = (r.description || r.markdown || '').match(/(\d\.\d)\s*(?:stars?|⭐|rating)/i);
      const reviewMatch = (r.description || r.markdown || '').match(/(\d[\d,]*)\s*(?:reviews?|تقييم)/i);

      // Extract a clean name from the title (remove " - Google Maps" suffix)
      const name = (r.title || '').replace(/\s*[-–]\s*Google\s*Maps?$/i, '').trim() || r.url || 'Unknown';

      return {
        place_id: `fc_${i}_${Date.now()}`,
        name,
        address: r.description || '',
        latitude: lat,
        longitude: lng,
        rating: ratingMatch ? parseFloat(ratingMatch[1]) : null,
        total_reviews: reviewMatch ? parseInt(reviewMatch[1].replace(/,/g, '')) : null,
        types: [],
        business_status: null,
        google_maps_url: r.url?.includes('google.com/maps') ? r.url : null,
      };
    });
}

// ─── Scrape a Google Maps page or website via Firecrawl ───
async function scrapeWithFirecrawl(url: string, firecrawlKey: string): Promise<string | null> {
  try {
    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith('http')) formattedUrl = `https://${formattedUrl}`;
    const res = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${firecrawlKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: formattedUrl, formats: ['markdown'], onlyMainContent: true }),
    });
    const data = await res.json();
    return data?.data?.markdown || null;
  } catch (e) {
    console.error('Firecrawl scrape error:', e);
    return null;
  }
}

// ─── Search the web for supplementary info ───
async function searchWebForDetails(query: string, firecrawlKey: string, location?: string): Promise<string | null> {
  try {
    const searchQuery = location ? `${query} ${location}` : query;
    const res = await fetch('https://api.firecrawl.dev/v1/search', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${firecrawlKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: searchQuery, limit: 5, scrapeOptions: { formats: ['markdown'] } }),
    });
    const data = await res.json();
    if (!data?.success || !data?.data?.length) return null;

    return data.data.slice(0, 5).map((r: any) =>
      `## ${r.title || ''}\nURL: ${r.url}\n${r.description || ''}\n${(r.markdown || '').substring(0, 1500)}`
    ).join('\n\n---\n\n');
  } catch (e) {
    console.error('Web search error:', e);
    return null;
  }
}

// ─── AI Enrichment ───
async function enrichWithAI(scrapedContent: string | null, webSearchContent: string | null, websiteContent: string | null, originalQuery: string): Promise<any> {
  const apiKey = Deno.env.get('LOVABLE_API_KEY');
  if (!apiKey) { console.error('LOVABLE_API_KEY not set'); return {}; }

  const prompt = `You are a bilingual data enrichment assistant (Arabic & English). Given raw scraped data from Google Maps and web search results, produce a clean, structured JSON object with REAL data only. 

IMPORTANT RULES:
- Only include data you can verify from the provided sources
- If a field has no real data, set it to null (NOT placeholder text)
- The original search query was: "${originalQuery}"

${scrapedContent ? `GOOGLE MAPS SCRAPED CONTENT:\n${scrapedContent.substring(0, 4000)}` : ''}
${webSearchContent ? `WEB SEARCH RESULTS:\n${webSearchContent.substring(0, 4000)}` : ''}
${websiteContent ? `WEBSITE CONTENT (first 3000 chars):\n${websiteContent.substring(0, 3000)}` : ''}

Return ONLY valid JSON with this exact structure. Use null for unknown fields:
{
  "name_en": null, "name_ar": null, "description_en": null, "description_ar": null,
  "city_en": null, "city_ar": null, "neighborhood_en": null, "neighborhood_ar": null,
  "street_en": null, "street_ar": null, "full_address_en": null, "full_address_ar": null,
  "postal_code": null, "country_en": null, "country_ar": null, "country_code": null,
  "phone": null, "phone_secondary": null, "email": null, "website": null,
  "business_hours": [], "business_type_en": null, "business_type_ar": null,
  "rating": null, "total_reviews": null, "latitude": null, "longitude": null,
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
  } catch (e) { console.error('AI enrichment error:', e); }
  return {};
}

// ─── Auth helper ───
async function authenticateAdmin(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) throw new Error("Unauthorized");
  const supabaseClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
  const { data: { user }, error } = await supabaseClient.auth.getUser();
  if (error || !user) throw new Error("Unauthorized");
  const { data: roles } = await supabaseClient.from('user_roles').select('role').eq('user_id', user.id).eq('role', 'supervisor');
  if (!roles?.length) throw new Error("Admin access required");
  return supabaseClient;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    await authenticateAdmin(req);
    const body = await req.json();
    const { query, location, website_url, mode = 'search', place_id } = body;

    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!firecrawlKey) {
      return new Response(
        JSON.stringify({ success: false, error: "Firecrawl is not configured. Please connect the Firecrawl connector in settings." }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ═══════ MODE: SEARCH — search Google Maps via Firecrawl ═══════
    if (mode === 'search') {
      if (!query) {
        return new Response(JSON.stringify({ success: false, error: "Search query is required" }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      console.log('Searching Google Maps via Firecrawl:', query, location);
      const results = await searchGoogleMapsViaFirecrawl(query, firecrawlKey, location);
      console.log(`Search returned ${results.length} results`);

      return new Response(
        JSON.stringify({ success: true, results }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ═══════ MODE: DETAILS — full data for one entity ═══════
    if (mode === 'details') {
      let scrapedContent: string | null = null;
      let webSearchContent: string | null = null;
      let websiteContent: string | null = null;
      const sourcesUsed = { google_maps_scrape: false, firecrawl_search: false, website: false, ai: true };

      // Scrape the Google Maps URL if available
      const googleMapsUrl = body.google_maps_url;
      if (googleMapsUrl) {
        console.log('Scraping Google Maps page:', googleMapsUrl);
        scrapedContent = await scrapeWithFirecrawl(googleMapsUrl, firecrawlKey);
        if (scrapedContent) sourcesUsed.google_maps_scrape = true;
      }

      // Web search for supplementary data
      if (query) {
        webSearchContent = await searchWebForDetails(query, firecrawlKey, location);
        if (webSearchContent) sourcesUsed.firecrawl_search = true;
      }

      // Scrape website if provided
      const targetUrl = website_url;
      if (targetUrl) {
        websiteContent = await scrapeWithFirecrawl(targetUrl, firecrawlKey);
        if (websiteContent) sourcesUsed.website = true;
      }

      // AI Enrichment
      console.log('Enriching with AI...', sourcesUsed);
      const enrichedData = await enrichWithAI(scrapedContent, webSearchContent, websiteContent, query || '');

      // Preserve coordinates from search result if available
      if (body.latitude && !enrichedData.latitude) enrichedData.latitude = body.latitude;
      if (body.longitude && !enrichedData.longitude) enrichedData.longitude = body.longitude;
      if (googleMapsUrl && !enrichedData.google_maps_url) enrichedData.google_maps_url = googleMapsUrl;

      return new Response(
        JSON.stringify({ success: true, data: enrichedData, sources_used: sourcesUsed }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify({ success: false, error: "Invalid mode" }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Smart import error:', error);
    const msg = (error as Error).message;
    const status = msg === "Unauthorized" ? 401 : msg === "Admin access required" ? 403 : 500;
    return new Response(
      JSON.stringify({ success: false, error: msg }),
      { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
