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

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000).toISOString();
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 86400000).toISOString();

    // Get user post IDs first (needed for reactions query)
    const { data: userPostIds } = await supabase
      .from("posts").select("id").eq("author_id", userId).limit(200);
    const postIds = userPostIds?.map((p: any) => p.id) || [];

    // Gather all user data in parallel
    const [
      postsRes, postsPrevRes,
      reactionsReceivedRes, reactionsGivenRes,
      followersRes, followingRes, newFollowersRes,
      compsRes, recipesRes,
      profileRes, pointsRes, bookmarksRes,
      storiesRes, storyViewsRes,
    ] = await Promise.all([
      supabase.from("posts").select("id, created_at, likes_count, comments_count, content")
        .eq("author_id", userId).gte("created_at", thirtyDaysAgo).order("created_at", { ascending: true }),
      supabase.from("posts").select("id").eq("author_id", userId)
        .gte("created_at", sixtyDaysAgo).lt("created_at", thirtyDaysAgo),
      postIds.length > 0
        ? supabase.from("post_reactions").select("id, reaction_type, created_at, post_id")
            .in("post_id", postIds).gte("created_at", thirtyDaysAgo)
        : Promise.resolve({ data: [] }),
      supabase.from("post_reactions").select("id, created_at")
        .eq("user_id", userId).gte("created_at", thirtyDaysAgo),
      supabase.from("user_follows").select("id").eq("following_id", userId),
      supabase.from("user_follows").select("id").eq("follower_id", userId),
      supabase.from("user_follows").select("id, created_at")
        .eq("following_id", userId).gte("created_at", thirtyDaysAgo),
      supabase.from("competition_registrations")
        .select("id, registered_at, status, competitions(title, category)")
        .eq("participant_id", userId).order("registered_at", { ascending: false }).limit(20),
      supabase.from("recipes").select("id, title, save_count, created_at")
        .eq("author_id", userId).order("created_at", { ascending: false }).limit(30),
      supabase.from("profiles")
        .select("view_count, loyalty_points, specialization, account_type, created_at")
        .eq("user_id", userId).single(),
      supabase.from("points_ledger").select("points, action_type, created_at")
        .eq("user_id", userId).gte("created_at", thirtyDaysAgo).order("created_at", { ascending: true }),
      supabase.from("bookmark_collection_items")
        .select("id, collection_id, bookmark_collections!inner(user_id)")
        .eq("bookmark_collections.user_id", userId),
      supabase.from("community_stories").select("id, created_at")
        .eq("user_id", userId).gte("created_at", thirtyDaysAgo),
      supabase.from("story_views").select("id, story_id, community_stories!inner(user_id)")
        .eq("community_stories.user_id", userId).gte("created_at", thirtyDaysAgo),
    ]);

    // Build daily activity chart
    const dailyPosts: Record<string, number> = {};
    const dailyReactions: Record<string, number> = {};
    const dailyPoints: Record<string, number> = {};

    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000).toISOString().split("T")[0];
      dailyPosts[d] = 0;
      dailyReactions[d] = 0;
      dailyPoints[d] = 0;
    }

    for (const p of postsRes.data || []) {
      const day = p.created_at?.split("T")[0];
      if (day && dailyPosts[day] !== undefined) dailyPosts[day]++;
    }
    for (const r of (reactionsReceivedRes as any).data || []) {
      const day = r.created_at?.split("T")[0];
      if (day && dailyReactions[day] !== undefined) dailyReactions[day]++;
    }
    for (const p of pointsRes.data || []) {
      const day = p.created_at?.split("T")[0];
      if (day && dailyPoints[day] !== undefined) dailyPoints[day] += p.points;
    }

    const activityChart = Object.keys(dailyPosts).map((date) => ({
      date,
      posts: dailyPosts[date],
      reactions: dailyReactions[date],
      points: dailyPoints[date],
    }));

    // Aggregations
    const reactionBreakdown: Record<string, number> = {};
    for (const r of (reactionsReceivedRes as any).data || []) {
      const t = r.reaction_type || "like";
      reactionBreakdown[t] = (reactionBreakdown[t] || 0) + 1;
    }

    const pointsByAction: Record<string, number> = {};
    for (const p of pointsRes.data || []) {
      const t = p.action_type || "other";
      pointsByAction[t] = (pointsByAction[t] || 0) + p.points;
    }

    const topPosts = (postsRes.data || [])
      .sort((a: any, b: any) => ((b.likes_count || 0) + (b.comments_count || 0)) - ((a.likes_count || 0) + (a.comments_count || 0)))
      .slice(0, 5)
      .map((p: any) => ({
        id: p.id,
        preview: (p.content || "").slice(0, 80),
        likes: p.likes_count || 0,
        comments: p.comments_count || 0,
      }));

    const hashtags: Record<string, number> = {};
    for (const p of postsRes.data || []) {
      for (const m of p.content?.match(/#([^\s#]+)/g) || []) {
        const tag = m.replace("#", "").toLowerCase();
        hashtags[tag] = (hashtags[tag] || 0) + 1;
      }
    }
    const topHashtags = Object.entries(hashtags)
      .sort(([, a], [, b]) => b - a).slice(0, 10)
      .map(([tag, count]) => ({ tag, count }));

    // Summary stats
    const totalPosts30d = postsRes.data?.length || 0;
    const totalPostsPrev = postsPrevRes.data?.length || 0;
    const totalReactionsReceived = (reactionsReceivedRes as any).data?.length || 0;
    const totalReactionsGiven = reactionsGivenRes.data?.length || 0;
    const totalFollowers = followersRes.data?.length || 0;
    const newFollowers30d = newFollowersRes.data?.length || 0;
    const totalFollowing = followingRes.data?.length || 0;
    const totalComps = compsRes.data?.length || 0;
    const totalRecipes = recipesRes.data?.length || 0;
    const totalRecipeSaves = recipesRes.data?.reduce((s: number, r: any) => s + (r.save_count || 0), 0) || 0;
    const totalPointsEarned = (pointsRes.data || []).reduce((s: number, p: any) => s + Math.max(0, p.points), 0);
    const totalStories = storiesRes.data?.length || 0;
    const totalStoryViews = storyViewsRes.data?.length || 0;

    const engagementRate = totalPosts30d > 0
      ? Math.round((totalReactionsReceived / totalPosts30d) * 100) / 100
      : 0;
    const postGrowth = totalPostsPrev > 0
      ? Math.round(((totalPosts30d - totalPostsPrev) / totalPostsPrev) * 100)
      : totalPosts30d > 0 ? 100 : 0;

    // AI insight (optional, non-blocking)
    let aiInsight = { summary: "", summary_ar: "", tips: [] as string[], tips_ar: [] as string[] };
    try {
      const response = await callAI({
        messages: [
          { role: "system", content: "You are a culinary social media analytics coach. Be concise and actionable." },
          {
            role: "user",
            content: `Analyze this chef's 30-day stats and give personalized growth tips:
- Posts: ${totalPosts30d} (${postGrowth > 0 ? "+" : ""}${postGrowth}% vs prev month)
- Reactions received: ${totalReactionsReceived}, Engagement rate: ${engagementRate}/post
- Followers: ${totalFollowers} (+${newFollowers30d} new)
- Top hashtags: ${topHashtags.slice(0, 5).map((h) => "#" + h.tag).join(", ") || "none"}
- Competitions: ${totalComps}, Recipes: ${totalRecipes} (${totalRecipeSaves} saves)
- Stories: ${totalStories}, Story views: ${totalStoryViews}
- Points earned: ${totalPointsEarned}
- Specialization: ${profileRes.data?.specialization || "general"}`,
          },
        ],
        tools: [{
          type: "function",
          function: {
            name: "provide_insights",
            description: "Return analytics insights",
            parameters: {
              type: "object",
              properties: {
                summary: { type: "string", description: "2-sentence performance summary in English" },
                summary_ar: { type: "string", description: "Same summary in Arabic" },
                tips: { type: "array", items: { type: "string" }, description: "3 actionable tips in English" },
                tips_ar: { type: "array", items: { type: "string" }, description: "Same 3 tips in Arabic" },
              },
              required: ["summary", "summary_ar", "tips", "tips_ar"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "provide_insights" } },
      });

      const parsed = parseToolCallArgs<typeof aiInsight>(response);
      if (parsed) aiInsight = parsed;
    } catch { /* AI is optional */ }

    return jsonResponse({
      summary: {
        totalPosts30d, postGrowth, totalReactionsReceived, totalReactionsGiven,
        engagementRate, totalFollowers, newFollowers30d, totalFollowing,
        totalComps, totalRecipes, totalRecipeSaves, totalPointsEarned,
        totalStories, totalStoryViews,
        profileViews: profileRes.data?.view_count || 0,
        loyaltyPoints: profileRes.data?.loyalty_points || 0,
        memberSince: profileRes.data?.created_at,
      },
      activityChart, reactionBreakdown, pointsByAction,
      topPosts, topHashtags, aiInsight,
    });
  } catch (e) {
    console.error("personal-analytics error:", e);
    return errorResponse(e);
  }
});
