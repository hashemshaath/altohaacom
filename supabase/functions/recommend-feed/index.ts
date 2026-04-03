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

    // Get user interests from their activity
    const [followingRes, userPostsRes, reactionsRes] = await Promise.all([
      supabase.from("social_follows").select("following_id").eq("follower_id", userId).limit(100),
      supabase.from("posts").select("content").eq("author_id", userId).order("created_at", { ascending: false }).limit(50),
      supabase.from("post_reactions").select("post_id, posts(author_id, content)").eq("user_id", userId).order("created_at", { ascending: false }).limit(50),
    ]);

    // Extract hashtags
    const userHashtags = new Set<string>();
    for (const p of userPostsRes.data || []) {
      for (const m of p.content?.match(/#([^\s#]+)/g) || []) {
        userHashtags.add(m.replace("#", "").toLowerCase());
      }
    }

    const userInterests = Array.from(userHashtags).slice(0, 15).join(", ");

    const response = await callAI({
      messages: [
        { role: "system", content: "You are a culinary content recommendation engine. Return only valid JSON arrays." },
        { role: "user", content: `Based on a user interested in these culinary topics: ${userInterests || "general cooking"}, suggest 5 content themes they might enjoy. Return a JSON array of objects with "theme" (short topic name) and "hashtag" (suggested hashtag without #). Keep it culinary-focused.` },
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
                  properties: { theme: { type: "string" }, hashtag: { type: "string" } },
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
    });

    const parsed = parseToolCallArgs<{ suggestions: Array<{ theme: string; hashtag: string }> }>(response);
    const suggestions = parsed?.suggestions || [];

    // Get recommended posts
    const { data: recommendedPosts } = await supabase
      .from("posts")
      .select("id, content, author_id, created_at, image_url, video_url, profiles:author_id(full_name, avatar_url, username)")
      .eq("moderation_status", "approved")
      .is("reply_to_post_id", null)
      .neq("author_id", userId)
      .order("created_at", { ascending: false })
      .limit(10);

    return jsonResponse({
      suggestions,
      recommended_posts: recommendedPosts || [],
      user_interests: Array.from(userHashtags).slice(0, 10),
    });
  } catch (e) {
    console.error("recommend-feed error:", e);
    return errorResponse(e);
  }
});
