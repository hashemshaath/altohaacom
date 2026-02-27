import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) throw new Error("Unauthorized");

    const client = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data, error: authErr } = await client.auth.getClaims(token);
    if (authErr || !data?.claims?.sub) throw new Error("Unauthorized");

    const { text, from, to, context } = await req.json();
    if (!text || !from || !to) {
      return new Response(JSON.stringify({ error: "Missing text, from, or to" }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("AI not configured");

    const fromLabel = from === "ar" ? "Arabic" : "English";
    const toLabel = to === "ar" ? "Arabic" : "English";

    const prompt = `You are a professional bilingual translator specializing in the culinary and food industry.

Translate the following text from ${fromLabel} to ${toLabel}.

Context: ${context || "culinary/food industry/exhibitions/events"}

RULES:
- Maintain the same tone, style, and meaning
- Use professional ${toLabel} terminology appropriate for the culinary/food industry
- Keep proper nouns (brand names, place names) as-is unless they have well-known translations
- If the text contains technical terms, use the standard ${toLabel} equivalent
- Return ONLY the translated text, no explanations

TEXT TO TRANSLATE:
${text}`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.error("AI API error:", res.status, errBody);
      if (res.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, try again later" }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error("AI translation failed");
    }

    const aiData = await res.json();
    const translated = aiData.choices?.[0]?.message?.content?.trim() || "";

    return new Response(JSON.stringify({ translated }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const msg = (error as Error).message;
    console.error("smart-translate error:", msg);
    const status = msg === "Unauthorized" ? 401 : 500;
    return new Response(JSON.stringify({ error: msg }), {
      status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
