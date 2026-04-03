import { handleCors } from "../_shared/cors.ts";
import { authenticateRequest } from "../_shared/auth.ts";
import { jsonResponse, errorResponse } from "../_shared/response.ts";

Deno.serve(async (req) => {
  const corsRes = handleCors(req);
  if (corsRes) return corsRes;

  try {
    await authenticateRequest(req);
    const { url, options } = await req.json();

    if (!url) return jsonResponse({ success: false, error: 'URL is required' }, 400);

    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!apiKey) return jsonResponse({ success: false, error: 'Firecrawl connector not configured' }, 500);

    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = `https://${formattedUrl}`;
    }

    console.log('Scraping URL:', formattedUrl);

    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: formattedUrl,
        formats: options?.formats || ['markdown'],
        onlyMainContent: options?.onlyMainContent ?? true,
        waitFor: options?.waitFor,
        location: options?.location,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('Firecrawl API error:', data);
      return jsonResponse({ success: false, error: data.error || `Request failed with status ${response.status}` }, response.status);
    }

    console.log('Scrape successful');
    return jsonResponse(data);
  } catch (error) {
    console.error('Error scraping:', error);
    return errorResponse(error);
  }
});
