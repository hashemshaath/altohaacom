import { handleCors } from "../_shared/cors.ts";
import { jsonResponse, errorResponse, streamResponse } from "../_shared/response.ts";
import { callAIStream } from "../_shared/ai.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  const corsRes = handleCors(req);
  if (corsRes) return corsRes;

  try {
    const { query, language } = await req.json();
    if (!query || typeof query !== "string" || query.trim().length < 2) {
      return jsonResponse({ error: "Query too short" }, 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const searchTerm = `%${query}%`;
    const isAr = language === "ar";

    // Search across platform data in parallel
    const [competitions, articles, members, recipes] = await Promise.all([
      supabase.from("competitions")
        .select("id, title, title_ar, country_code, city, status, competition_start, competition_end, type, is_virtual")
        .or(`title.ilike.${searchTerm},title_ar.ilike.${searchTerm},description.ilike.${searchTerm}`)
        .limit(5),
      supabase.from("articles")
        .select("id, title, title_ar, excerpt, excerpt_ar, slug, type, published_at")
        .or(`title.ilike.${searchTerm},title_ar.ilike.${searchTerm},content.ilike.${searchTerm}`)
        .eq("status", "published").limit(5),
      supabase.from("profiles")
        .select("user_id, full_name, full_name_ar, username, specialization, specialization_ar, country_code, avatar_url")
        .or(`full_name.ilike.${searchTerm},full_name_ar.ilike.${searchTerm},username.ilike.${searchTerm},specialization.ilike.${searchTerm}`)
        .eq("account_status", "active").limit(5),
      supabase.from("recipes")
        .select("id, title, title_ar, description, description_ar, cuisine_type, difficulty, prep_time, cook_time")
        .or(`title.ilike.${searchTerm},title_ar.ilike.${searchTerm},description.ilike.${searchTerm}`)
        .eq("is_published", true).limit(5),
    ]);

    const contextData = {
      competitions: competitions.data || [],
      articles: articles.data || [],
      members: members.data || [],
      recipes: recipes.data || [],
    };

    const hasResults = Object.values(contextData).some((arr) => arr.length > 0);

    const systemPrompt = `You are an intelligent search assistant for "Altoha" (الطهاة), a professional culinary platform for chefs, competitions, exhibitions, recipes, and culinary arts.

Your role:
- Analyze the user's search query and the matching platform data
- Provide a helpful, concise summary of the most relevant results
- If results exist, highlight the best matches and explain WHY they're relevant
- If no results match, suggest related searches or helpful tips
- Always respond in ${isAr ? "Arabic" : "English"}
- Use markdown formatting: **bold** for names, bullet points for lists
- Keep responses under 200 words
- Include relevant emojis

Platform data matching "${query}":
${JSON.stringify(contextData, null, 2)}
${!hasResults ? "\nNo direct matches found. Provide helpful suggestions." : ""}`;

    const aiRes = await callAIStream({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: query },
      ],
    });

    return streamResponse(aiRes.body);
  } catch (e) {
    console.error("ai-search error:", e);
    return errorResponse(e);
  }
});
