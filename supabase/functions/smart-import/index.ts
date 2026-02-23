import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface PlaceResult {
  name?: string;
  formatted_address?: string;
  formatted_phone_number?: string;
  international_phone_number?: string;
  website?: string;
  opening_hours?: { weekday_text?: string[]; periods?: any[] };
  address_components?: { long_name: string; short_name: string; types: string[] }[];
  geometry?: { location: { lat: number; lng: number } };
  types?: string[];
  business_status?: string;
  rating?: number;
  user_ratings_total?: number;
  url?: string;
  photos?: any[];
  place_id?: string;
}

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
}

// ─── Search: returns multiple results ───
async function searchPlaces(query: string, apiKey: string, location?: string): Promise<SearchResultItem[]> {
  const searchQuery = location ? `${query} ${location}` : query;
  const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchQuery)}&key=${apiKey}`;
  const res = await fetch(searchUrl);
  const data = await res.json();
  if (!data.results?.length) return [];
  return data.results.slice(0, 10).map((r: any) => ({
    place_id: r.place_id,
    name: r.name || '',
    address: r.formatted_address || '',
    latitude: r.geometry?.location?.lat || null,
    longitude: r.geometry?.location?.lng || null,
    rating: r.rating || null,
    total_reviews: r.user_ratings_total || null,
    types: r.types || [],
    business_status: r.business_status || null,
  }));
}

// ─── Details: full info for one place ───
async function getPlaceDetails(placeId: string, apiKey: string): Promise<PlaceResult | null> {
  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,formatted_phone_number,international_phone_number,website,opening_hours,address_components,geometry,types,business_status,rating,user_ratings_total,url,photos&key=${apiKey}`;
  const res = await fetch(url);
  const data = await res.json();
  return data.result || null;
}

// ─── Firecrawl search ───
async function searchWithFirecrawl(query: string, firecrawlKey: string, location?: string): Promise<{ websiteUrl: string | null; searchContent: string | null; results: SearchResultItem[] }> {
  try {
    const searchQuery = location ? `${query} ${location}` : query;
    const res = await fetch('https://api.firecrawl.dev/v1/search', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${firecrawlKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: searchQuery, limit: 5, scrapeOptions: { formats: ['markdown'] } }),
    });
    const data = await res.json();
    if (!data?.success || !data?.data?.length) return { websiteUrl: null, searchContent: null, results: [] };

    const items = data.data.slice(0, 5);
    const combinedContent = items.map((r: any) => `## ${r.title || ''}\nURL: ${r.url}\n${r.description || ''}\n${(r.markdown || '').substring(0, 1500)}`).join('\n\n---\n\n');
    const firecrawlResults: SearchResultItem[] = items.map((r: any, i: number) => ({
      place_id: `fc_${i}_${Date.now()}`,
      name: r.title || r.url || 'Unknown',
      address: r.description || r.url || '',
      latitude: null,
      longitude: null,
      rating: null,
      total_reviews: null,
      types: [],
      business_status: null,
    }));
    return { websiteUrl: items[0]?.url || null, searchContent: combinedContent, results: firecrawlResults };
  } catch (e) {
    console.error('Firecrawl search error:', e);
    return { websiteUrl: null, searchContent: null, results: [] };
  }
}

// ─── Scrape website ───
async function scrapeWebsite(url: string, firecrawlKey: string): Promise<string | null> {
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

function extractAddressComponents(components: PlaceResult['address_components']) {
  if (!components) return {};
  const get = (type: string) => components.find(c => c.types.includes(type));
  return {
    street_number: get('street_number')?.long_name || '',
    street: get('route')?.long_name || '',
    neighborhood: get('neighborhood')?.long_name || get('sublocality_level_1')?.long_name || get('sublocality')?.long_name || '',
    city: get('locality')?.long_name || get('administrative_area_level_2')?.long_name || '',
    state: get('administrative_area_level_1')?.long_name || '',
    country: get('country')?.long_name || '',
    country_code: get('country')?.short_name || '',
    postal_code: get('postal_code')?.long_name || '',
  };
}

async function enrichWithAI(placeData: any, websiteContent: string | null, searchContent: string | null, originalQuery: string): Promise<any> {
  const apiKey = Deno.env.get('LOVABLE_API_KEY');
  if (!apiKey) { console.error('LOVABLE_API_KEY not set'); return placeData; }

  const prompt = `You are a bilingual data enrichment assistant (Arabic & English). Given raw business data and web search results, produce a clean, structured JSON object with REAL data only. 

IMPORTANT RULES:
- Only include data you can verify from the provided sources
- If a field has no real data, set it to null (NOT placeholder text)
- The original search query was: "${originalQuery}"

${Object.keys(placeData).length > 0 ? `RAW PLACE DATA:\n${JSON.stringify(placeData, null, 2)}` : ''}
${searchContent ? `WEB SEARCH RESULTS:\n${searchContent.substring(0, 4000)}` : ''}
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
  return placeData;
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

    if (!query && mode !== 'details') {
      return new Response(JSON.stringify({ success: false, error: "Search query is required" }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const adminClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: placesConfig } = await adminClient.from('integration_settings').select('config, is_active').eq('integration_type', 'google_places').single();
    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
    const hasGooglePlaces = placesConfig?.is_active && (placesConfig.config as any)?.api_key;
    const googleApiKey = hasGooglePlaces ? (placesConfig!.config as any).api_key : null;

    // ═══════ MODE: SEARCH — return list of results ═══════
    if (mode === 'search') {
      let results: SearchResultItem[] = [];
      const sourcesUsed = { google_places: false, firecrawl_search: false };

      const googlePromise = googleApiKey
        ? searchPlaces(query, googleApiKey, location).then(r => { if (r.length) { sourcesUsed.google_places = true; } return r; })
        : Promise.resolve([]);

      const firecrawlPromise = firecrawlKey
        ? searchWithFirecrawl(query, firecrawlKey, location).then(r => { if (r.results.length) { sourcesUsed.firecrawl_search = true; } return r; })
        : Promise.resolve({ results: [] as SearchResultItem[], websiteUrl: null, searchContent: null });

      const [googleResults, firecrawlResult] = await Promise.all([googlePromise, firecrawlPromise]);

      // Prefer Google results; add Firecrawl results that aren't duplicates
      results = googleResults;
      if (!results.length) {
        results = firecrawlResult.results;
      }

      console.log(`Search returned ${results.length} results (Google: ${sourcesUsed.google_places}, Firecrawl: ${sourcesUsed.firecrawl_search})`);

      return new Response(
        JSON.stringify({ success: true, results, sources_used: sourcesUsed }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ═══════ MODE: DETAILS — full data for one place ═══════
    if (mode === 'details') {
      let placeData: any = {};
      let websiteContent: string | null = null;
      let searchContent: string | null = null;
      const sourcesUsed = { google_places: false, firecrawl_search: false, website: false, ai: true };

      // If we have a Google place_id, fetch details directly
      if (place_id && googleApiKey && !place_id.startsWith('fc_')) {
        console.log('Fetching Google Place details for:', place_id);
        const place = await getPlaceDetails(place_id, googleApiKey);
        if (place) {
          sourcesUsed.google_places = true;
          const addr = extractAddressComponents(place.address_components);
          placeData = {
            name_en: place.name, formatted_address: place.formatted_address,
            phone: place.international_phone_number || place.formatted_phone_number,
            website: place.website, business_hours_raw: place.opening_hours?.weekday_text,
            ...addr,
            latitude: place.geometry?.location?.lat, longitude: place.geometry?.location?.lng,
            rating: place.rating, total_reviews: place.user_ratings_total,
            google_maps_url: place.url, business_status: place.business_status, types: place.types,
          };
        }
      }

      // Web search for supplementary data
      if (firecrawlKey && query) {
        const fcResult = await searchWithFirecrawl(query, firecrawlKey, location);
        if (fcResult.searchContent) { searchContent = fcResult.searchContent; sourcesUsed.firecrawl_search = true; }
        const targetUrl = website_url || placeData.website || fcResult.websiteUrl;
        if (targetUrl) {
          websiteContent = await scrapeWebsite(targetUrl, firecrawlKey);
          if (websiteContent) sourcesUsed.website = true;
        }
      }

      // AI Enrichment
      console.log('Enriching with AI...', { google: sourcesUsed.google_places, search: sourcesUsed.firecrawl_search, website: sourcesUsed.website });
      const enrichedData = await enrichWithAI(placeData, websiteContent, searchContent, query || '');

      // Preserve precise Google fields
      if (placeData.latitude) enrichedData.latitude = placeData.latitude;
      if (placeData.longitude) enrichedData.longitude = placeData.longitude;
      if (placeData.rating) enrichedData.rating = placeData.rating;
      if (placeData.total_reviews) enrichedData.total_reviews = placeData.total_reviews;
      if (placeData.google_maps_url) enrichedData.google_maps_url = placeData.google_maps_url;

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
