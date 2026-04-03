import { handleCors } from "../_shared/cors.ts";
import { authenticateRequest } from "../_shared/auth.ts";
import { jsonResponse, errorResponse } from "../_shared/response.ts";
import { callAI, parseToolCallArgs } from "../_shared/ai.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  const corsRes = handleCors(req);
  if (corsRes) return corsRes;

  try {
    const { userId } = await authenticateRequest(req);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
    );

    // Gather user context in parallel
    const [profileRes, userPostsRes, reactionsRes, followingRes, registrationsRes, savedRecipesRes] = await Promise.all([
      supabase.from("profiles").select("specialization, country_code, city, account_type, bio").eq("user_id", userId).single(),
      supabase.from("posts").select("content").eq("author_id", userId).order("created_at", { ascending: false }).limit(30),
      supabase.from("post_reactions").select("posts(content)").eq("user_id", userId).order("created_at", { ascending: false }).limit(30),
      supabase.from("user_follows").select("following_id").eq("follower_id", userId).limit(50),
      supabase.from("competition_registrations").select("competitions(title, category, country_code)").eq("participant_id", userId).limit(20),
      supabase.from("recipe_saves").select("recipes(title, cuisine_type, difficulty)").eq("user_id", userId).limit(20),
    ]);

    // Extract interests
    const hashtags = new Set<string>();
    for (const p of userPostsRes.data || []) {
      for (const m of p.content?.match(/#([^\s#]+)/g) || []) hashtags.add(m.replace("#", "").toLowerCase());
    }
    for (const r of reactionsRes.data || []) {
      for (const m of (r as any).posts?.content?.match(/#([^\s#]+)/g) || []) hashtags.add(m.replace("#", "").toLowerCase());
    }

    const followingIds = followingRes.data?.map((f: any) => f.following_id) || [];
    const profile = profileRes.data;
    const userContext = {
      specialization: profile?.specialization || "general",
      country: profile?.country_code || "unknown",
      interests: Array.from(hashtags).slice(0, 15),
      compCategories: [...new Set((registrationsRes.data || []).map((r: any) => r.competitions?.category).filter(Boolean))].slice(0, 5),
      cuisineTypes: [...new Set((savedRecipesRes.data || []).map((r: any) => r.recipes?.cuisine_type).filter(Boolean))].slice(0, 5),
    };

    // Fetch candidate content in parallel
    const [compsRes, recipesRes, articlesRes, chefsRes, exhibitionsRes] = await Promise.all([
      supabase.from("competitions").select("id, title, title_ar, category, country_code, competition_start, image_url, slug")
        .eq("status", "published").gte("competition_start", new Date().toISOString()).order("competition_start", { ascending: true }).limit(20),
      supabase.from("recipes").select("id, title, title_ar, cuisine_type, difficulty, image_url, slug, save_count")
        .eq("is_published", true).order("created_at", { ascending: false }).limit(30),
      supabase.from("articles").select("id, title, title_ar, type, slug, featured_image_url, view_count")
        .eq("status", "published").order("published_at", { ascending: false }).limit(20),
      supabase.from("profiles").select("user_id, full_name, full_name_ar, username, avatar_url, specialization, is_verified")
        .eq("is_verified", true).not("user_id", "in", `(${[userId, ...followingIds.slice(0, 20)].join(",")})`).limit(15),
      supabase.from("exhibitions").select("id, title, title_ar, slug, start_date, end_date, venue, venue_ar, city, country_code, image_url, status")
        .eq("status", "published").eq("is_cancelled", false).gte("end_date", new Date().toISOString()).order("start_date", { ascending: true }).limit(15),
    ]);

    const prompt = `Given a culinary professional with:
- Specialization: ${userContext.specialization}, Country: ${userContext.country}
- Hashtags: ${userContext.interests.join(", ") || "none"}
- Competition categories: ${userContext.compCategories.join(", ") || "none"}
- Cuisine preferences: ${userContext.cuisineTypes.join(", ") || "none"}

Select BEST recommendations from:
COMPETITIONS (top 4): ${JSON.stringify(compsRes.data?.map((c: any, i: number) => ({ i, title: c.title, category: c.category, country: c.country_code })) || [])}
RECIPES (top 4): ${JSON.stringify(recipesRes.data?.map((r: any, i: number) => ({ i, title: r.title, cuisine: r.cuisine_type, difficulty: r.difficulty })) || [])}
ARTICLES (top 3): ${JSON.stringify(articlesRes.data?.map((a: any, i: number) => ({ i, title: a.title, type: a.type })) || [])}
CHEFS (top 4): ${JSON.stringify(chefsRes.data?.map((c: any, i: number) => ({ i, name: c.full_name, spec: c.specialization })) || [])}
EXHIBITIONS (top 4): ${JSON.stringify(exhibitionsRes.data?.map((e: any, i: number) => ({ i, title: e.title, city: e.city, country: e.country_code })) || [])}`;

    try {
      const response = await callAI({
        messages: [
          { role: "system", content: "You are a culinary recommendation engine. Return structured recommendations with reasons." },
          { role: "user", content: prompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "recommend",
            description: "Return personalized recommendations with reasons",
            parameters: {
              type: "object",
              properties: {
                competition_indices: { type: "array", items: { type: "integer" } },
                competition_reasons: { type: "array", items: { type: "string" } },
                recipe_indices: { type: "array", items: { type: "integer" } },
                recipe_reasons: { type: "array", items: { type: "string" } },
                article_indices: { type: "array", items: { type: "integer" } },
                article_reasons: { type: "array", items: { type: "string" } },
                chef_indices: { type: "array", items: { type: "integer" } },
                chef_reasons: { type: "array", items: { type: "string" } },
                exhibition_indices: { type: "array", items: { type: "integer" } },
                exhibition_reasons: { type: "array", items: { type: "string" } },
                tip: { type: "string" },
                tip_ar: { type: "string" },
              },
              required: ["competition_indices", "recipe_indices", "article_indices", "chef_indices", "exhibition_indices", "tip", "tip_ar"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "recommend" } },
      });

      const parsed = parseToolCallArgs<any>(response) || {};
      const pick = (arr: any[], indices: number[], reasons?: string[]) =>
        (indices || []).map((idx, i) => {
          const item = arr?.[idx];
          return item ? { ...item, _reason: reasons?.[i] || null } : null;
        }).filter(Boolean);

      return jsonResponse({
        competitions: pick(compsRes.data || [], parsed.competition_indices || [0, 1, 2, 3], parsed.competition_reasons),
        recipes: pick(recipesRes.data || [], parsed.recipe_indices || [0, 1, 2, 3], parsed.recipe_reasons),
        articles: pick(articlesRes.data || [], parsed.article_indices || [0, 1, 2], parsed.article_reasons),
        chefs: pick(chefsRes.data || [], parsed.chef_indices || [0, 1, 2, 3], parsed.chef_reasons),
        exhibitions: pick(exhibitionsRes.data || [], parsed.exhibition_indices || [0, 1, 2, 3], parsed.exhibition_reasons),
        tip: parsed.tip || "Explore new culinary content!",
        tip_ar: parsed.tip_ar || "اكتشف محتوى طهي جديد!",
      });
    } catch {
      // Fallback without AI
      return jsonResponse({
        competitions: (compsRes.data || []).slice(0, 4),
        recipes: (recipesRes.data || []).slice(0, 4),
        articles: (articlesRes.data || []).slice(0, 3),
        chefs: (chefsRes.data || []).slice(0, 4),
        exhibitions: (exhibitionsRes.data || []).slice(0, 4),
        tip: "Explore new culinary content tailored for you!",
        tip_ar: "اكتشف محتوى طهي جديد مخصص لك!",
      });
    }
  } catch (e) {
    console.error("smart-recommendations error:", e);
    return errorResponse(e);
  }
});
