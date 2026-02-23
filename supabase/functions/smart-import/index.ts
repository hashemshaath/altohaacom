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
  opening_hours?: {
    weekday_text?: string[];
    periods?: any[];
  };
  address_components?: {
    long_name: string;
    short_name: string;
    types: string[];
  }[];
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
  
  // Text Search
  const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchQuery)}&key=${apiKey}`;
  const searchRes = await fetch(searchUrl);
  const searchData = await searchRes.json();
  
  if (!searchData.results?.length) return null;
  
  const placeId = searchData.results[0].place_id;
  
  // Place Details
  const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,formatted_phone_number,international_phone_number,website,opening_hours,address_components,geometry,types,business_status,rating,user_ratings_total,url,photos&key=${apiKey}`;
  const detailsRes = await fetch(detailsUrl);
  const detailsData = await detailsRes.json();
  
  return detailsData.result || null;
}

async function scrapeWebsite(url: string, firecrawlKey: string): Promise<string | null> {
  try {
    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith('http')) formattedUrl = `https://${formattedUrl}`;
    
    const res = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: formattedUrl,
        formats: ['markdown'],
        onlyMainContent: true,
      }),
    });
    
    const data = await res.json();
    return data?.data?.markdown || null;
  } catch (e) {
    console.error('Firecrawl error:', e);
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

async function enrichWithAI(placeData: any, websiteContent: string | null): Promise<any> {
  const apiKey = Deno.env.get('LOVABLE_API_KEY');
  if (!apiKey) {
    console.error('LOVABLE_API_KEY not set');
    return placeData;
  }

  const prompt = `You are a bilingual data enrichment assistant (Arabic & English). Given raw business data, produce a clean, structured JSON object. Fill in missing fields intelligently.

RAW PLACE DATA:
${JSON.stringify(placeData, null, 2)}

${websiteContent ? `WEBSITE CONTENT (first 3000 chars):
${websiteContent.substring(0, 3000)}` : ''}

Return ONLY valid JSON with this exact structure (no markdown, no comments):
{
  "name_en": "English business name",
  "name_ar": "Arabic business name (translate if not available)",
  "description_en": "Brief English description (2-3 sentences about the business)",
  "description_ar": "Brief Arabic description (2-3 sentences)",
  "city_en": "City in English",
  "city_ar": "City in Arabic",
  "neighborhood_en": "Neighborhood in English",
  "neighborhood_ar": "Neighborhood in Arabic", 
  "street_en": "Street name in English",
  "street_ar": "Street name in Arabic",
  "full_address_en": "Full formatted address in English",
  "full_address_ar": "Full formatted address in Arabic",
  "postal_code": "Postal/ZIP code",
  "country_en": "Country in English",
  "country_ar": "Country in Arabic",
  "country_code": "2-letter ISO code",
  "phone": "Primary phone with country code",
  "phone_secondary": "Secondary phone if found",
  "email": "Business email if found",
  "website": "Website URL",
  "business_hours": [
    {"day_en": "Monday", "day_ar": "الاثنين", "open": "09:00", "close": "22:00", "is_closed": false}
  ],
  "business_type_en": "Type of business in English",
  "business_type_ar": "Type of business in Arabic",
  "rating": null,
  "total_reviews": null,
  "latitude": null,
  "longitude": null,
  "google_maps_url": "",
  "national_id": "Commercial/national registration if found on website",
  "social_media": {
    "instagram": "",
    "twitter": "",
    "facebook": "",
    "linkedin": "",
    "tiktok": ""
  }
}`;

  try {
    const res = await fetch('https://api.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
      }),
    });

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.error('AI enrichment error:', e);
  }
  
  return placeData;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check admin
    const { data: roles } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'supervisor');
    
    if (!roles?.length) {
      return new Response(JSON.stringify({ success: false, error: "Admin access required" }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { query, location, website_url, sources } = await req.json();

    if (!query) {
      return new Response(JSON.stringify({ success: false, error: "Search query is required" }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const useSources = sources || ['google_places', 'website', 'ai'];
    let placeData: any = {};
    let websiteContent: string | null = null;

    // 1. Google Places API
    if (useSources.includes('google_places')) {
      // Get API key from integration_settings
      const adminClient = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );
      
      const { data: placesConfig } = await adminClient
        .from('integration_settings')
        .select('config, is_active')
        .eq('integration_type', 'google_places')
        .single();

      if (placesConfig?.is_active && (placesConfig.config as any)?.api_key) {
        console.log('Searching Google Places for:', query);
        const place = await searchGooglePlaces(query, (placesConfig.config as any).api_key, location);
        
        if (place) {
          const addr = extractAddressComponents(place.address_components);
          placeData = {
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
      } else {
        console.log('Google Places API not configured or not active');
      }
    }

    // 2. Website scraping via Firecrawl
    const targetUrl = website_url || placeData.website;
    if (useSources.includes('website') && targetUrl) {
      const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
      if (firecrawlKey) {
        console.log('Scraping website:', targetUrl);
        websiteContent = await scrapeWebsite(targetUrl, firecrawlKey);
      }
    }

    // 3. AI Enrichment
    let enrichedData = placeData;
    if (useSources.includes('ai')) {
      console.log('Enriching with AI...');
      enrichedData = await enrichWithAI(placeData, websiteContent);
      
      // Merge back non-AI fields
      if (placeData.latitude) enrichedData.latitude = placeData.latitude;
      if (placeData.longitude) enrichedData.longitude = placeData.longitude;
      if (placeData.rating) enrichedData.rating = placeData.rating;
      if (placeData.total_reviews) enrichedData.total_reviews = placeData.total_reviews;
      if (placeData.google_maps_url) enrichedData.google_maps_url = placeData.google_maps_url;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: enrichedData,
        sources_used: {
          google_places: !!Object.keys(placeData).length,
          website: !!websiteContent,
          ai: useSources.includes('ai'),
        }
      }),
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
