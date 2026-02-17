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

    // Get user's interests: hashtags they've used, people they follow, reactions
    const [followingRes, userPostsRes, reactionsRes] = await Promise.all([
      supabase.from("social_follows").select("following_id").eq("follower_id", user.id).limit(100),
      supabase.from("posts").select("content").eq("author_id", user.id).order("created_at", { ascending: false }).limit(50),
      supabase.from("post_reactions").select("post_id, posts(author_id, content)").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50),
    ]);

    // Extract user's hashtags
    const userHashtags = new Set<string>();
    userPostsRes.data?.forEach((p: any) => {
      const matches = p.content?.match(/#([^\s#]+)/g);
      matches?.forEach((m: string) => userHashtags.add(m.replace("#", "").toLowerCase()));
    });

    // Get authors user has interacted with
    const interactedAuthors = new Set<string>();
    reactionsRes.data?.forEach((r: any) => {
      if (r.posts?.author_id) interactedAuthors.add(r.posts.author_id);
    });
    followingRes.data?.forEach((f: any) => interactedAuthors.add(f.following_id));

    // Build AI prompt for recommendations
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const userInterests = Array.from(userHashtags).slice(0, 15).join(", ");
    const prompt = `Based on a user interested in these culinary topics: ${userInterests || "general cooking"}, suggest 5 content themes they might enjoy. Return a JSON array of objects with "theme" (short topic name) and "hashtag" (suggested hashtag without #). Keep it culinary-focused.`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are a culinary content recommendation engine. Return only valid JSON arrays." },
          { role: "user", content: prompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "suggest_themes",
            description: "Return recommended content themes",
            parameters: {
              type: "object",
              properties: {
                suggestions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      theme: { type: "string" },
                      hashtag: { type: "string" },
                    },
                    required: ["theme", "hashtag"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["suggestions"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "suggest_themes" } },
      }),
    });

    if (!aiRes.ok) {
      const status = aiRes.status;
      if (status === 429) return new Response(JSON.stringify({ error: "Rate limited" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (status === 402) return new Response(JSON.stringify({ error: "Credits exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error("AI gateway error");
    }

    const aiData = await aiRes.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    let suggestions = [];
    if (toolCall?.function?.arguments) {
      try {
        const parsed = JSON.parse(toolCall.function.arguments);
        suggestions = parsed.suggestions || [];
      } catch { suggestions = []; }
    }

    // Get recommended posts from followed authors and matching hashtags
    const { data: recommendedPosts } = await supabase
      .from("posts")
      .select("id, content, author_id, created_at, image_url, video_url, profiles:author_id(full_name, avatar_url, username)")
      .eq("moderation_status", "approved")
      .is("reply_to_post_id", null)
      .neq("author_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10);

    return new Response(JSON.stringify({
      suggestions,
      recommended_posts: recommendedPosts || [],
      user_interests: Array.from(userHashtags).slice(0, 10),
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("recommend-feed error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
