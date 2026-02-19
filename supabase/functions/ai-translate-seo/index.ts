import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Recommended lengths per field type
const FIELD_TYPE_LIMITS: Record<string, { max: number; guideline: string }> = {
  title:            { max: 60,   guideline: "concise title, max 60 characters" },
  meta_title:       { max: 60,   guideline: "SEO meta title, max 60 characters" },
  meta_description: { max: 160,  guideline: "SEO meta description, max 160 characters" },
  excerpt:          { max: 200,  guideline: "brief excerpt/summary, max 200 characters" },
  description:      { max: 500,  guideline: "detailed description, max 500 characters" },
  bio:              { max: 300,  guideline: "professional bio, max 300 characters" },
  tag:              { max: 30,   guideline: "short tag/label, max 30 characters" },
  slug:             { max: 80,   guideline: "URL-friendly slug, max 80 characters, lowercase with hyphens" },
  body:             { max: 10000, guideline: "full body content, no strict limit" },
  text:             { max: 500,  guideline: "general text, max 500 characters" },
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { text, source_lang, target_lang, optimize_seo, optimize_only, field_type, max_length } = await req.json();

    if (!text) {
      return new Response(JSON.stringify({ error: "No text provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Determine length constraints
    const ftConfig = FIELD_TYPE_LIMITS[field_type || "text"] || FIELD_TYPE_LIMITS.text;
    const effectiveMax = max_length || ftConfig.max;
    const lengthInstruction = `The output MUST be a ${ftConfig.guideline}. STRICTLY keep the result under ${effectiveMax} characters. If the original text is already shorter, keep it concise — do NOT expand it.`;

    let systemPrompt: string;
    
    if (optimize_only) {
      systemPrompt = `You are an SEO optimization expert. Optimize the following ${source_lang === "ar" ? "Arabic" : "English"} text for search engines while keeping the meaning intact. Make it more discoverable, use relevant keywords naturally.

FIELD CONTEXT: ${lengthInstruction}

IMPORTANT RULES:
- NEVER use special characters like **, ##, __, --, etc.
- NEVER use markdown formatting symbols
- Preserve proper spacing and punctuation
- Do NOT add unnecessary words or filler to reach a length — be concise and impactful
- Return ONLY the optimized text, nothing else.`;
    } else {
      const fromLang = source_lang === "ar" ? "Arabic" : "English";
      const toLang = target_lang === "en" ? "English" : "Arabic";
      systemPrompt = `You are a professional translator and SEO expert. Translate the following ${fromLang} text to ${toLang}. ${optimize_seo ? "Also optimize the translation for search engines — use relevant keywords naturally, ensure readability." : ""}

FIELD CONTEXT: ${lengthInstruction}

IMPORTANT RULES:
- NEVER use special characters like **, ##, __, --, etc.
- NEVER use markdown formatting symbols
- Preserve proper spacing and punctuation
- Do NOT add unnecessary words or filler to reach a length — be concise and impactful
- Return ONLY the translated text, nothing else.`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: text },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const result = data.choices?.[0]?.message?.content?.trim();

    return new Response(
      JSON.stringify(optimize_only ? { optimized: result } : { translated: result }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("ai-translate-seo error:", e);
    return new Response(
      JSON.stringify({ error: "Service temporarily unavailable" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
