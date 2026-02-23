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

// ─── MODE: SEARCH ───
async function handleSearch(query: string, apiKey: string, lovableKey: string, location?: string): Promise<SearchResult[]> {
  const searchTerm = location ? `${query} ${location}` : query;
  console.log('[SmartImport] Searching Google Maps for:', searchTerm);

  const mapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(searchTerm)}`;
  const scraped = await firecrawlScrape(mapsUrl, apiKey);

  if (!scraped || scraped.length < 50) {
    console.log('[SmartImport] Google Maps scrape returned little content, trying search API fallback');
    const searchResults = await firecrawlSearch(`"${query}" ${location || ''} site:google.com/maps`, apiKey, 15);
    if (searchResults.length) {
      return extractEntitiesFromSearchResults(searchResults);
    }
    return [];
  }

  console.log(`[SmartImport] Scraped ${scraped.length} chars from Google Maps`);
  const entities = await extractEntitiesWithAI(scraped, searchTerm, lovableKey);
  return entities;
}

// ─── Extract entities from Firecrawl search results ───
function extractEntitiesFromSearchResults(raw: any[]): SearchResult[] {
  const seen = new Set<string>();
  return raw.filter(item => {
    const url = item.url || '';
    if (!url || seen.has(url)) return false;
    seen.add(url);
    return true;
  }).slice(0, 15).map((item, i) => {
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
      rating: null,
      total_reviews: null,
      google_maps_url: /google\.\w+\/maps/i.test(url) ? url : null,
      place_type: null,
    };
  });
}

// ─── Use AI to extract entity list from scraped Google Maps content ───
async function extractEntitiesWithAI(scraped: string, searchTerm: string, lovableKey: string): Promise<SearchResult[]> {
  const prompt = `You are a data extraction assistant. From the following Google Maps search results page content, extract ALL business/entity listings found.

SEARCH TERM: "${searchTerm}"

SCRAPED GOOGLE MAPS CONTENT:
${scraped.substring(0, 8000)}

Extract each entity and return a JSON array. Each entity should have:
- name: Business/entity name (clean, no extra characters)
- description: Short description or category (e.g. "Restaurant", "Hotel", "Kitchen supplies store")
- rating: Google rating number (e.g. 4.5) or null
- total_reviews: Number of reviews or null  
- place_type: Category/type of business or null
- latitude: latitude if found in any URL or data, or null
- longitude: longitude if found in any URL or data, or null
- google_maps_url: Direct Google Maps URL for this place if available, or null
- address: Short address if visible, or null

IMPORTANT:
- Extract ALL entities/businesses listed, not just the first one
- Only include REAL businesses found in the content
- Do NOT make up or hallucinate businesses
- Return ONLY a valid JSON array, nothing else

Return format: [{"name":"...","description":"...","rating":4.5,"total_reviews":100,"place_type":"...","latitude":null,"longitude":null,"google_maps_url":null,"address":"..."}]`;

  try {
    const res = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${lovableKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        model: 'google/gemini-2.5-flash', 
        messages: [{ role: 'user', content: prompt }], 
        temperature: 0.1 
      }),
    });
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || '';
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const entities = JSON.parse(jsonMatch[0]);
      return entities.map((e: any, i: number) => ({
        id: `sr_${i}_${Date.now()}`,
        name: e.name || 'Unknown',
        description: e.address ? `${e.description || e.place_type || ''} • ${e.address}`.trim() : (e.description || e.place_type || ''),
        url: e.google_maps_url || `https://www.google.com/maps/search/${encodeURIComponent(e.name)}`,
        latitude: e.latitude || null,
        longitude: e.longitude || null,
        rating: e.rating || null,
        total_reviews: e.total_reviews || null,
        google_maps_url: e.google_maps_url || null,
        place_type: e.place_type || e.description || null,
      }));
    }
  } catch (e) {
    console.error('[SmartImport] AI entity extraction error:', e);
  }
  return [];
}

// ─── MODE: DETAILS — Enhanced to extract ALL culinary_entities fields ───
async function handleDetails(
  query: string,
  apiKey: string,
  resultUrl?: string,
  websiteUrl?: string,
  location?: string,
  latitude?: number,
  longitude?: number,
): Promise<{ data: any; sources_used: Record<string, boolean> }> {
  const sources = { google_maps: false, web_search: false, website: false, ai: true };

  // Use AbortController with 25s timeout to prevent edge function timeout
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);

  try {
    // Run scrapes in parallel with timeout protection
    const scrapePromise = resultUrl 
      ? firecrawlScrape(resultUrl, apiKey).catch(() => null) 
      : Promise.resolve(null);
    const searchQuery = location ? `${query} ${location} contact address phone email about` : `${query} contact address phone email about`;
    const searchPromise = firecrawlSearch(searchQuery, apiKey, 5).catch(() => []);
    const websitePromise = websiteUrl 
      ? firecrawlScrape(websiteUrl, apiKey).catch(() => null) 
      : Promise.resolve(null);

    const [scraped, searchRaw, websiteContent] = await Promise.all([scrapePromise, searchPromise, websitePromise]);

    if (scraped) sources.google_maps = true;
    if (websiteContent) sources.website = true;

    let searchContent: string | null = null;
    if (searchRaw.length) {
      sources.web_search = true;
      searchContent = searchRaw.slice(0, 5).map((r: any) =>
        `## ${r.title || ''}\nURL: ${r.url}\n${r.description || ''}\n${(r.markdown || '').substring(0, 1500)}`
      ).join('\n\n---\n\n');
    }

    const lovableKey = Deno.env.get('LOVABLE_API_KEY')!;
    const enriched = await enrichWithAI(scraped, searchContent, websiteContent, query, latitude, longitude, lovableKey);
    return { data: enriched, sources_used: sources };
  } finally {
    clearTimeout(timeout);
  }
}

// ─── AI Enrichment — Comprehensive extraction matching culinary_entities schema ───
async function enrichWithAI(
  scraped: string | null,
  search: string | null,
  website: string | null,
  query: string,
  lat?: number | null,
  lng?: number | null,
  lovableKey?: string,
): Promise<any> {
  const apiKey = lovableKey || Deno.env.get('LOVABLE_API_KEY');
  if (!apiKey) { console.error('LOVABLE_API_KEY not set'); return {}; }

  const prompt = `You are a bilingual SEO expert and data enrichment assistant (Arabic & English). Given raw scraped data from Google Maps and web search results, produce a COMPREHENSIVE structured JSON object with ALL available data.

RULES:
- MANDATORY: Every _en and _ar field MUST have a value. If only one language is found, TRANSLATE to the other language professionally.
- If a field has no real data AND cannot be reasonably inferred, set it to null
- Extract as much information as possible from all sources
- Provide BOTH English and Arabic values for ALL bilingual fields — NEVER leave one language empty if the other has data
- The original search query was: "${query}"
${lat && lng ? `- Known coordinates: ${lat}, ${lng}` : ''}

SEO OPTIMIZATION RULES (CRITICAL):
- "description_en": Write a professional, SEO-optimized description (150-300 chars). Include relevant keywords naturally. Make it compelling for search engines and users. Focus on what the entity does, its location, and unique value proposition.
- "description_ar": Write the Arabic equivalent with the same SEO quality. Use relevant Arabic keywords naturally. Must be a professional Arabic description, NOT a literal translation.
- "services_en" and "services_ar": List ALL services found. Each service must be in BOTH languages. Minimum 3 services if any are found. Use industry-standard terminology.
- "specializations_en" and "specializations_ar": List ALL specializations/expertise areas. Each must be in BOTH languages. Use professional culinary/industry terms.
- "tags": Include 5-10 relevant SEO keywords in English that describe the entity (used for search indexing)
- "full_address_en": Complete formatted address in English (Street, Neighborhood, City, Country, Postal Code)
- "full_address_ar": Complete formatted address in Arabic (الشارع، الحي، المدينة، الدولة، الرمز البريدي)

${scraped ? `GOOGLE MAPS SCRAPED CONTENT:\n${scraped.substring(0, 4000)}` : ''}
${search ? `WEB SEARCH RESULTS:\n${search.substring(0, 3000)}` : ''}
${website ? `WEBSITE CONTENT:\n${website.substring(0, 2500)}` : ''}

Return ONLY valid JSON with ALL these fields:
{
  "name_en": null,
  "name_ar": null,
  "abbreviation_en": null,
  "abbreviation_ar": null,
  "description_en": "SEO-optimized description in English (150-300 chars with keywords)",
  "description_ar": "وصف محسّن لمحركات البحث بالعربية (150-300 حرف مع كلمات مفتاحية)",
  "mission_en": null,
  "mission_ar": null,
  "city_en": null,
  "city_ar": null,
  "neighborhood_en": null,
  "neighborhood_ar": null,
  "street_en": null,
  "street_ar": null,
  "full_address_en": "Full formatted address: Street, Neighborhood, City, Country, Postal Code",
  "full_address_ar": "العنوان الكامل: الشارع، الحي، المدينة، الدولة، الرمز البريدي",
  "postal_code": null,
  "country_en": null,
  "country_ar": null,
  "country_code": null,
  "phone": null,
  "phone_secondary": null,
  "fax": null,
  "email": null,
  "website": null,
  "business_hours": [
    {"day_en":"Saturday","day_ar":"السبت","open":"09:00","close":"17:00","is_closed":false},
    {"day_en":"Sunday","day_ar":"الأحد","open":"09:00","close":"17:00","is_closed":false},
    {"day_en":"Monday","day_ar":"الاثنين","open":"09:00","close":"17:00","is_closed":false},
    {"day_en":"Tuesday","day_ar":"الثلاثاء","open":"09:00","close":"17:00","is_closed":false},
    {"day_en":"Wednesday","day_ar":"الأربعاء","open":"09:00","close":"17:00","is_closed":false},
    {"day_en":"Thursday","day_ar":"الخميس","open":"09:00","close":"17:00","is_closed":false},
    {"day_en":"Friday","day_ar":"الجمعة","open":"09:00","close":"17:00","is_closed":true}
  ],
  "business_type_en": null,
  "business_type_ar": null,
  "rating": ${lat ? 'null' : 'null'},
  "total_reviews": null,
  "latitude": ${lat || 'null'},
  "longitude": ${lng || 'null'},
  "google_maps_url": null,
  "national_id": null,
  "registration_number": null,
  "license_number": null,
  "founded_year": null,
  "president_name_en": null,
  "president_name_ar": null,
  "secretary_name_en": null,
  "secretary_name_ar": null,
  "member_count": null,
  "services_en": ["Service 1", "Service 2", "Service 3"],
  "services_ar": ["الخدمة 1", "الخدمة 2", "الخدمة 3"],
  "specializations_en": ["Specialization 1", "Specialization 2"],
  "specializations_ar": ["التخصص 1", "التخصص 2"],
  "affiliated_organizations": [],
  "tags": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "social_media": {
    "instagram": null,
    "twitter": null,
    "facebook": null,
    "linkedin": null,
    "tiktok": null,
    "youtube": null,
    "snapchat": null,
    "whatsapp": null
  }
}

EXTRACTION GUIDELINES:
- "abbreviation": Short form / acronym of the entity name if commonly used
- "mission": The entity's mission statement or vision — MUST be in BOTH languages
- "founded_year": Year the entity was established (integer like 1995)
- "president_name" / "secretary_name": Leadership names if found — provide in BOTH en and ar
- "member_count": Number of members if the entity is an association
- "services": CRITICAL — List ALL services found from ALL sources. Each service MUST appear in BOTH services_en AND services_ar arrays at the same index. If only one language is found, translate professionally.
- "specializations": CRITICAL — List ALL areas of expertise. Each MUST be in BOTH languages. Use professional industry terminology.
- "affiliated_organizations": Names of partner/parent organizations
- "tags": 5-10 relevant English SEO keywords for search indexing (e.g., "restaurant", "fine dining", "Saudi cuisine", "Riyadh")
- "registration_number" / "license_number" / "national_id": Official registration/license numbers
- "fax": Fax number if available
- "description": CRITICAL SEO — Write compelling, keyword-rich descriptions. EN description should include location, type of business, and key offerings. AR description should be equally professional with Arabic SEO keywords, NOT a literal translation.
- "full_address": CRITICAL — Construct complete addresses in BOTH languages. Include all components: street, neighborhood, city, country, postal code. Format professionally.
- "business_hours": CRITICAL — Return EXACTLY 7 entries, one for each day (Saturday through Friday). Replace template hours with ACTUAL hours from scraped data. Use 24-hour format. Set is_closed=true for closed days.
- "social_media": Extract ALL social media links found (Instagram, Twitter/X, Facebook, LinkedIn, TikTok, YouTube, Snapchat, WhatsApp)`;

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

// ─── Auto-detect target table from business type ───
function autoDetectTargetTable(data: any): { table: string; sub_type: string; confidence: number } {
  const bt = (data.business_type_en || data.description_en || '').toLowerCase();
  const name = (data.name_en || '').toLowerCase();
  const all = `${bt} ${name}`;

  // Establishment patterns
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

  // Company patterns
  const companyPatterns: Record<string, string[]> = {
    supplier: ['supplier', 'supply', 'wholesale', 'distributor', 'distribution', 'import', 'export', 'trading', 'manufacturer', 'equipment', 'packaging'],
    sponsor: ['sponsor', 'sponsorship'],
    partner: ['partner', 'consulting', 'consultancy', 'agency', 'marketing', 'media', 'advertising', 'technology', 'tech', 'software'],
    vendor: ['vendor', 'seller', 'store', 'shop', 'retail', 'market', 'supermarket', 'grocery'],
  };
  for (const [type, keywords] of Object.entries(companyPatterns)) {
    if (keywords.some(k => all.includes(k))) return { table: 'companies', sub_type: type, confidence: 0.8 };
  }

  // Entity patterns
  const entityPatterns: Record<string, string[]> = {
    culinary_association: ['association', 'society', 'federation', 'union', 'guild', 'chef association', 'culinary association'],
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

  // Default: if it has rating/reviews it's likely an establishment
  if (data.rating || data.total_reviews) return { table: 'establishments', sub_type: 'restaurant', confidence: 0.5 };

  return { table: 'culinary_entities', sub_type: 'culinary_association', confidence: 0.3 };
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
        JSON.stringify({ success: false, error: "Firecrawl is not configured." }),
        { status: 400, headers: jsonHeaders }
      );
    }

    const lovableKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableKey) {
      return new Response(
        JSON.stringify({ success: false, error: "AI service not configured." }),
        { status: 400, headers: jsonHeaders }
      );
    }

    if (!query?.trim()) {
      return new Response(JSON.stringify({ success: false, error: "Query is required" }), { status: 400, headers: jsonHeaders });
    }

    if (mode === 'search') {
      const results = await handleSearch(query.trim(), firecrawlKey, lovableKey, location?.trim());
      return new Response(JSON.stringify({ success: true, results }), { headers: jsonHeaders });
    }

    if (mode === 'details') {
      const result = await handleDetails(query.trim(), firecrawlKey, result_url, website_url, location?.trim(), latitude, longitude);
      // Auto-detect target table
      const suggestion = autoDetectTargetTable(result.data);
      return new Response(JSON.stringify({ success: true, ...result, suggested_target: suggestion }), { headers: jsonHeaders });
    }

    return new Response(JSON.stringify({ success: false, error: "Invalid mode." }), { status: 400, headers: jsonHeaders });
  } catch (error) {
    console.error('[SmartImport] Error:', error);
    const msg = (error as Error).message;
    const status = msg === "Unauthorized" ? 401 : msg === "Admin access required" ? 403 : 500;
    return new Response(JSON.stringify({ success: false, error: msg }), { status, headers: jsonHeaders });
  }
});
