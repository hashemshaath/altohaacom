import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No auth");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    // Gather user context
    const [profileRes, userPostsRes, reactionsRes, followingRes, registrationsRes, savedRecipesRes] = await Promise.all([
      supabase.from("profiles").select("specialization, country_code, city, account_type, bio").eq("user_id", user.id).single(),
      supabase.from("posts").select("content").eq("author_id", user.id).order("created_at", { ascending: false }).limit(30),
      supabase.from("post_reactions").select("posts(content)").eq("user_id", user.id).order("created_at", { ascending: false }).limit(30),
      supabase.from("user_follows").select("following_id").eq("follower_id", user.id).limit(50),
      supabase.from("competition_registrations").select("competitions(title, category, country_code)").eq("participant_id", user.id).limit(20),
      supabase.from("recipe_saves").select("recipes(title, cuisine_type, difficulty)").eq("user_id", user.id).limit(20),
    ]);

    // Extract interests
    const hashtags = new Set<string>();
    userPostsRes.data?.forEach((p: any) => {
      p.content?.match(/#([^\s#]+)/g)?.forEach((m: string) => hashtags.add(m.replace("#", "").toLowerCase()));
    });
    reactionsRes.data?.forEach((r: any) => {
      r.posts?.content?.match(/#([^\s#]+)/g)?.forEach((m: string) => hashtags.add(m.replace("#", "").toLowerCase()));
    });

    const compCategories = registrationsRes.data?.map((r: any) => r.competitions?.category).filter(Boolean) || [];
    const cuisineTypes = savedRecipesRes.data?.map((r: any) => r.recipes?.cuisine_type).filter(Boolean) || [];
    const followingIds = followingRes.data?.map((f: any) => f.following_id) || [];
    const profile = profileRes.data;

    // Build user profile summary for AI
    const userContext = {
      specialization: profile?.specialization || "general",
      country: profile?.country_code || "unknown",
      accountType: profile?.account_type || "user",
      interests: Array.from(hashtags).slice(0, 15),
      compCategories: [...new Set(compCategories)].slice(0, 5),
      cuisineTypes: [...new Set(cuisineTypes)].slice(0, 5),
    };

    // Fetch candidate content
    const [compsRes, recipesRes, articlesRes, chefsRes] = await Promise.all([
      supabase.from("competitions")
        .select("id, title, title_ar, category, country_code, competition_start, image_url, slug")
        .eq("status", "published")
        .gte("competition_start", new Date().toISOString())
        .order("competition_start", { ascending: true })
        .limit(20),
      supabase.from("recipes")
        .select("id, title, title_ar, cuisine_type, difficulty, image_url, slug, save_count")
        .eq("is_published", true)
        .order("created_at", { ascending: false })
        .limit(30),
      supabase.from("articles")
        .select("id, title, title_ar, type, slug, featured_image_url, view_count")
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(20),
      supabase.from("profiles")
        .select("user_id, full_name, full_name_ar, username, avatar_url, specialization, is_verified")
        .eq("is_verified", true)
        .not("user_id", "in", `(${[user.id, ...followingIds.slice(0, 20)].join(",")})`)
        .limit(15),
    ]);

    // Use AI to rank and personalize
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const prompt = `Given a culinary professional with these interests:
- Specialization: ${userContext.specialization}
- Country: ${userContext.country}
- Hashtags used: ${userContext.interests.join(", ") || "none"}
- Competition categories: ${userContext.compCategories.join(", ") || "none"}
- Cuisine preferences: ${userContext.cuisineTypes.join(", ") || "none"}

Select the BEST recommendations from these candidates:

COMPETITIONS (pick top 4): ${JSON.stringify(compsRes.data?.map((c: any, i: number) => ({ i, title: c.title, category: c.category, country: c.country_code })) || [])}

RECIPES (pick top 4): ${JSON.stringify(recipesRes.data?.map((r: any, i: number) => ({ i, title: r.title, cuisine: r.cuisine_type, difficulty: r.difficulty })) || [])}

ARTICLES (pick top 3): ${JSON.stringify(articlesRes.data?.map((a: any, i: number) => ({ i, title: a.title, type: a.type })) || [])}

CHEFS (pick top 4): ${JSON.stringify(chefsRes.data?.map((c: any, i: number) => ({ i, name: c.full_name, spec: c.specialization })) || [])}

Return the indices of the best matches for each category, plus a short personalized tip.`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are a culinary recommendation engine. Return structured recommendations." },
          { role: "user", content: prompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "recommend",
            description: "Return personalized recommendations",
            parameters: {
              type: "object",
              properties: {
                competition_indices: { type: "array", items: { type: "integer" } },
                recipe_indices: { type: "array", items: { type: "integer" } },
                article_indices: { type: "array", items: { type: "integer" } },
                chef_indices: { type: "array", items: { type: "integer" } },
                tip: { type: "string", description: "Short personalized tip in English" },
                tip_ar: { type: "string", description: "Same tip in Arabic" },
              },
              required: ["competition_indices", "recipe_indices", "article_indices", "chef_indices", "tip", "tip_ar"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "recommend" } },
      }),
    });

    if (!aiRes.ok) {
      const status = aiRes.status;
      if (status === 429) return new Response(JSON.stringify({ error: "Rate limited" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (status === 402) return new Response(JSON.stringify({ error: "Credits exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      // Fallback: return first items without AI ranking
      return new Response(JSON.stringify({
        competitions: (compsRes.data || []).slice(0, 4),
        recipes: (recipesRes.data || []).slice(0, 4),
        articles: (articlesRes.data || []).slice(0, 3),
        chefs: (chefsRes.data || []).slice(0, 4),
        tip: "Explore new culinary content tailored for you!",
        tip_ar: "اكتشف محتوى طهي جديد مخصص لك!",
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const aiData = await aiRes.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    let parsed: any = {};
    try {
      parsed = JSON.parse(toolCall?.function?.arguments || "{}");
    } catch { /* fallback */ }

    const pick = (arr: any[], indices: number[]) => 
      (indices || []).map(i => arr?.[i]).filter(Boolean);

    return new Response(JSON.stringify({
      competitions: pick(compsRes.data || [], parsed.competition_indices || [0, 1, 2, 3]),
      recipes: pick(recipesRes.data || [], parsed.recipe_indices || [0, 1, 2, 3]),
      articles: pick(articlesRes.data || [], parsed.article_indices || [0, 1, 2]),
      chefs: pick(chefsRes.data || [], parsed.chef_indices || [0, 1, 2, 3]),
      tip: parsed.tip || "Explore new culinary content!",
      tip_ar: parsed.tip_ar || "اكتشف محتوى طهي جديد!",
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("smart-recommendations error:", e);
    return new Response(JSON.stringify({ error: "Service temporarily unavailable" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
