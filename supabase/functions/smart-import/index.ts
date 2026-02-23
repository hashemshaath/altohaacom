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
}

async function searchGooglePlaces(query: string, apiKey: string, location?: string): Promise<PlaceResult | null> {
  const searchQuery = location ? `${query} ${location}` : query;
  const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchQuery)}&key=${apiKey}`;
  const searchRes = await fetch(searchUrl);
  const searchData = await searchRes.json();
  if (!searchData.results?.length) return null;
  const placeId = searchData.results[0].place_id;
  const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,formatted_phone_number,international_phone_number,website,opening_hours,address_components,geometry,types,business_status,rating,user_ratings_total,url,photos&key=${apiKey}`;
  const detailsRes = await fetch(detailsUrl);
  const detailsData = await detailsRes.json();
  return detailsData.result || null;
}

async function searchWithFirecrawl(query: string, firecrawlKey: string, location?: string): Promise<{ websiteUrl: string | null; searchContent: string | null }> {
  try {
    const searchQuery = location ? `${query} ${location}` : query;
    console.log('Firecrawl web search:', searchQuery);
    
    const res = await fetch('https://api.firecrawl.dev/v1/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: searchQuery,
        limit: 5,
        scrapeOptions: { formats: ['markdown'] },
      }),
    });
    
    const data = await res.json();
    if (!data?.success || !data?.data?.length) {
      console.log('Firecrawl search returned no results');
      return { websiteUrl: null, searchContent: null };
    }

    // Collect content from search results
    const results = data.data.slice(0, 3);
    const combinedContent = results.map((r: any) => {
      const title = r.title || '';
      const desc = r.description || '';
      const md = r.markdown ? r.markdown.substring(0, 1500) : '';
      return `## ${title}\nURL: ${r.url}\n${desc}\n${md}`;
    }).join('\n\n---\n\n');

    // First result URL as the main website
    const mainUrl = results[0]?.url || null;
    
    return { websiteUrl: mainUrl, searchContent: combinedContent };
  } catch (e) {
    console.error('Firecrawl search error:', e);
    return { websiteUrl: null, searchContent: null };
  }
}

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

  const hasRealData = Object.keys(placeData).length > 0 || websiteContent || searchContent;

  const prompt = `You are a bilingual data enrichment assistant (Arabic & English). Given raw business data and web search results, produce a clean, structured JSON object with REAL data only. 

IMPORTANT RULES:
- Only include data you can verify from the provided sources
- If a field has no real data, set it to null (NOT placeholder text)
- The original search query was: "${originalQuery}"
- Extract real business information from the search results and website content

${Object.keys(placeData).length > 0 ? `RAW PLACE DATA:\n${JSON.stringify(placeData, null, 2)}` : ''}

${searchContent ? `WEB SEARCH RESULTS:\n${searchContent.substring(0, 4000)}` : ''}

${websiteContent ? `WEBSITE CONTENT (first 3000 chars):\n${websiteContent.substring(0, 3000)}` : ''}

Return ONLY valid JSON with this exact structure (no markdown, no comments). Use null for unknown fields, NOT placeholder text:
{
  "name_en": "English business name or null",
  "name_ar": "Arabic business name or null",
  "description_en": "Real description from sources or null",
  "description_ar": "Real Arabic description or null",
  "city_en": null,
  "city_ar": null,
  "neighborhood_en": null,
  "neighborhood_ar": null,
  "street_en": null,
  "street_ar": null,
  "full_address_en": null,
  "full_address_ar": null,
  "postal_code": null,
  "country_en": null,
  "country_ar": null,
  "country_code": null,
  "phone": null,
  "phone_secondary": null,
  "email": null,
  "website": null,
  "business_hours": [],
  "business_type_en": null,
  "business_type_ar": null,
  "rating": null,
  "total_reviews": null,
  "latitude": null,
  "longitude": null,
  "google_maps_url": null,
  "national_id": null,
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabaseClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { data: roles } = await supabaseClient.from('user_roles').select('role').eq('user_id', user.id).eq('role', 'supervisor');
    if (!roles?.length) {
      return new Response(JSON.stringify({ success: false, error: "Admin access required" }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { query, location, website_url } = await req.json();
    if (!query) {
      return new Response(JSON.stringify({ success: false, error: "Search query is required" }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    let placeData: any = {};
    let websiteContent: string | null = null;
    let searchContent: string | null = null;
    const sourcesUsed = { google_places: false, firecrawl_search: false, website: false, ai: true };

    // Get configs
    const adminClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: placesConfig } = await adminClient.from('integration_settings').select('config, is_active').eq('integration_type', 'google_places').single();
    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');

    const hasGooglePlaces = placesConfig?.is_active && (placesConfig.config as any)?.api_key;

    // Run Google Places and Firecrawl search in parallel
    const googlePlacesPromise = (async () => {
      if (!hasGooglePlaces) return {};
      console.log('Searching Google Places for:', query);
      const place = await searchGooglePlaces(query, (placesConfig!.config as any).api_key, location);
      if (place) {
        sourcesUsed.google_places = true;
        const addr = extractAddressComponents(place.address_components);
        return {
          name_en: place.name,
          formatted_address: place.formatted_address,
          phone: place.international_phone_number || place.formatted_phone_number,
          website: place.website,
          business_hours_raw: place.opening_hours?.weekday_text,
          business_hours_periods: place.opening_hours?.periods,
          ...addr,
          latitude: place.geometry?.location?.lat,
          longitude: place.geometry?.location?.lng,
          rating: place.rating,
          total_reviews: place.user_ratings_total,
          google_maps_url: place.url,
          business_status: place.business_status,
          types: place.types,
        };
      }
      return {};
    })();

    // Firecrawl web search — always run for additional data
    const firecrawlSearchPromise = (async () => {
      if (!firecrawlKey) return { websiteUrl: null, searchContent: null };
      return await searchWithFirecrawl(query, firecrawlKey, location);
    })();

    const [googleResult, firecrawlSearchResult] = await Promise.all([googlePlacesPromise, firecrawlSearchPromise]);
    placeData = googleResult;

    if (firecrawlSearchResult.searchContent) {
      searchContent = firecrawlSearchResult.searchContent;
      sourcesUsed.firecrawl_search = true;
    }

    // Scrape the website (from Google, user input, or Firecrawl search)
    const targetUrl = website_url || placeData.website || firecrawlSearchResult.websiteUrl;
    if (firecrawlKey && targetUrl) {
      console.log('Scraping website:', targetUrl);
      websiteContent = await scrapeWebsite(targetUrl, firecrawlKey);
      if (websiteContent) sourcesUsed.website = true;
    }

    // AI Enrichment with all collected data
    console.log('Enriching with AI...', { google: sourcesUsed.google_places, search: sourcesUsed.firecrawl_search, website: sourcesUsed.website });
    const enrichedData = await enrichWithAI(placeData, websiteContent, searchContent, query);

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
  } catch (error) {
    console.error('Smart import error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Import service error: ' + (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
