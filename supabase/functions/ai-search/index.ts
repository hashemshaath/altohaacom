import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { query, language } = await req.json();
    if (!query || typeof query !== "string" || query.trim().length < 2) {
      return new Response(JSON.stringify({ error: "Query too short" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch relevant data from the platform to give context to the AI
    const searchTerm = `%${query}%`;
    const isAr = language === "ar";

    const [competitions, articles, members, recipes] = await Promise.all([
      supabase
        .from("competitions")
        .select("id, title, title_ar, country_code, city, status, competition_start, competition_end, type, is_virtual")
        .or(`title.ilike.${searchTerm},title_ar.ilike.${searchTerm},description.ilike.${searchTerm}`)
        .limit(5),
      supabase
        .from("articles")
        .select("id, title, title_ar, excerpt, excerpt_ar, slug, type, published_at")
        .or(`title.ilike.${searchTerm},title_ar.ilike.${searchTerm},content.ilike.${searchTerm}`)
        .eq("status", "published")
        .limit(5),
      supabase
        .from("profiles")
        .select("user_id, full_name, full_name_ar, username, specialization, specialization_ar, country_code, avatar_url")
        .or(`full_name.ilike.${searchTerm},full_name_ar.ilike.${searchTerm},username.ilike.${searchTerm},specialization.ilike.${searchTerm}`)
        .eq("account_status", "active")
        .limit(5),
      supabase
        .from("recipes")
        .select("id, title, title_ar, description, description_ar, cuisine_type, difficulty, prep_time, cook_time")
        .or(`title.ilike.${searchTerm},title_ar.ilike.${searchTerm},description.ilike.${searchTerm}`)
        .eq("is_published", true)
        .limit(5),
    ]);

    const contextData = {
      competitions: competitions.data || [],
      articles: articles.data || [],
      members: members.data || [],
      recipes: recipes.data || [],
    };

    const hasResults =
      contextData.competitions.length > 0 ||
      contextData.articles.length > 0 ||
      contextData.members.length > 0 ||
      contextData.recipes.length > 0;

    const systemPrompt = `You are an intelligent search assistant for "Altoha" (الطهاة), a professional culinary platform for chefs, competitions, exhibitions, recipes, and culinary arts.

Your role:
- Analyze the user's search query and the matching platform data provided below
- Provide a helpful, concise summary of the most relevant results
- If results exist, highlight the best matches and explain WHY they're relevant
- If no results match, suggest related searches or helpful tips
- Always respond in ${isAr ? "Arabic" : "English"}
- Use markdown formatting: **bold** for names, bullet points for lists
- Keep responses under 200 words
- Include relevant emojis for visual appeal

Platform data matching "${query}":
${JSON.stringify(contextData, null, 2)}

${!hasResults ? "No direct matches found. Provide helpful suggestions based on the query." : ""}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: query },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI usage limit reached." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI service unavailable" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("ai-search error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
