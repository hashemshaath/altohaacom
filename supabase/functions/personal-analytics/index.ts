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

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000).toISOString();
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 86400000).toISOString();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000).toISOString();

    // Gather all user data in parallel
    const [
      postsRes, postsPrevRes,
      reactionsReceivedRes, reactionsGivenRes,
      followersRes, followingRes, newFollowersRes,
      compsRes, recipesRes, recipeSavesRes,
      profileRes, pointsRes, bookmarksRes,
      storiesRes, storyViewsRes,
    ] = await Promise.all([
      // Posts (last 30 days)
      supabase.from("posts").select("id, created_at, likes_count, comments_count, content").eq("author_id", user.id).gte("created_at", thirtyDaysAgo).order("created_at", { ascending: true }),
      // Posts (previous 30 days for comparison)
      supabase.from("posts").select("id").eq("author_id", user.id).gte("created_at", sixtyDaysAgo).lt("created_at", thirtyDaysAgo),
      // Reactions received on user's posts
      supabase.from("post_reactions").select("id, reaction_type, created_at, post_id").in("post_id", (await supabase.from("posts").select("id").eq("author_id", user.id).limit(200)).data?.map((p: any) => p.id) || []).gte("created_at", thirtyDaysAgo),
      // Reactions given
      supabase.from("post_reactions").select("id, created_at").eq("user_id", user.id).gte("created_at", thirtyDaysAgo),
      // Followers
      supabase.from("user_follows").select("id").eq("following_id", user.id),
      supabase.from("user_follows").select("id").eq("follower_id", user.id),
      supabase.from("user_follows").select("id, created_at").eq("following_id", user.id).gte("created_at", thirtyDaysAgo),
      // Competition registrations
      supabase.from("competition_registrations").select("id, registered_at, status, competitions(title, category)").eq("participant_id", user.id).order("registered_at", { ascending: false }).limit(20),
      // Recipes
      supabase.from("recipes").select("id, title, save_count, created_at").eq("author_id", user.id).order("created_at", { ascending: false }).limit(30),
      // Recipe saves by user
      supabase.from("recipe_saves").select("id").eq("user_id", user.id),
      // Profile
      supabase.from("profiles").select("view_count, loyalty_points, specialization, account_type, created_at").eq("user_id", user.id).single(),
      // Points ledger
      supabase.from("points_ledger").select("points, action_type, created_at").eq("user_id", user.id).gte("created_at", thirtyDaysAgo).order("created_at", { ascending: true }),
      // Bookmarks
      supabase.from("bookmark_collection_items").select("id, collection_id, bookmark_collections!inner(user_id)").eq("bookmark_collections.user_id", user.id),
      // Stories
      supabase.from("community_stories").select("id, created_at").eq("user_id", user.id).gte("created_at", thirtyDaysAgo),
      // Story views received
      supabase.from("story_views").select("id, story_id, community_stories!inner(user_id)").eq("community_stories.user_id", user.id).gte("created_at", thirtyDaysAgo),
    ]);

    // Build daily post activity chart
    const dailyPosts: Record<string, number> = {};
    const dailyReactionsReceived: Record<string, number> = {};
    const dailyPoints: Record<string, number> = {};
    
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000).toISOString().split("T")[0];
      dailyPosts[d] = 0;
      dailyReactionsReceived[d] = 0;
      dailyPoints[d] = 0;
    }

    (postsRes.data || []).forEach((p: any) => {
      const day = p.created_at?.split("T")[0];
      if (day && dailyPosts[day] !== undefined) dailyPosts[day]++;
    });

    (reactionsReceivedRes.data || []).forEach((r: any) => {
      const day = r.created_at?.split("T")[0];
      if (day && dailyReactionsReceived[day] !== undefined) dailyReactionsReceived[day]++;
    });

    (pointsRes.data || []).forEach((p: any) => {
      const day = p.created_at?.split("T")[0];
      if (day && dailyPoints[day] !== undefined) dailyPoints[day] += p.points;
    });

    const activityChart = Object.keys(dailyPosts).map(date => ({
      date,
      posts: dailyPosts[date],
      reactions: dailyReactionsReceived[date],
      points: dailyPoints[date],
    }));

    // Reaction type breakdown
    const reactionBreakdown: Record<string, number> = {};
    (reactionsReceivedRes.data || []).forEach((r: any) => {
      const t = r.reaction_type || "like";
      reactionBreakdown[t] = (reactionBreakdown[t] || 0) + 1;
    });

    // Points by action type
    const pointsByAction: Record<string, number> = {};
    (pointsRes.data || []).forEach((p: any) => {
      const t = p.action_type || "other";
      pointsByAction[t] = (pointsByAction[t] || 0) + p.points;
    });

    // Top performing posts
    const topPosts = (postsRes.data || [])
      .sort((a: any, b: any) => ((b.likes_count || 0) + (b.comments_count || 0)) - ((a.likes_count || 0) + (a.comments_count || 0)))
      .slice(0, 5)
      .map((p: any) => ({
        id: p.id,
        preview: (p.content || "").slice(0, 80),
        likes: p.likes_count || 0,
        comments: p.comments_count || 0,
      }));

    // Hashtag analysis
    const hashtags: Record<string, number> = {};
    (postsRes.data || []).forEach((p: any) => {
      p.content?.match(/#([^\s#]+)/g)?.forEach((m: string) => {
        const tag = m.replace("#", "").toLowerCase();
        hashtags[tag] = (hashtags[tag] || 0) + 1;
      });
    });
    const topHashtags = Object.entries(hashtags)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count }));

    // Calculate summary stats
    const totalPosts30d = postsRes.data?.length || 0;
    const totalPostsPrev = postsPrevRes.data?.length || 0;
    const totalReactionsReceived = reactionsReceivedRes.data?.length || 0;
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

    // Generate AI insight
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    let aiInsight = { summary: "", summary_ar: "", tips: [] as string[], tips_ar: [] as string[] };

    if (LOVABLE_API_KEY) {
      try {
        const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-lite",
            messages: [
              { role: "system", content: "You are a culinary social media analytics coach. Be concise and actionable." },
              { role: "user", content: `Analyze this chef's 30-day stats and give personalized growth tips:
- Posts: ${totalPosts30d} (${postGrowth > 0 ? "+" : ""}${postGrowth}% vs prev month)
- Reactions received: ${totalReactionsReceived}, Engagement rate: ${engagementRate}/post
- Followers: ${totalFollowers} (+${newFollowers30d} new)
- Top hashtags: ${topHashtags.slice(0, 5).map(h => "#" + h.tag).join(", ") || "none"}
- Competitions: ${totalComps}, Recipes: ${totalRecipes} (${totalRecipeSaves} saves)
- Stories: ${totalStories}, Story views: ${totalStoryViews}
- Points earned: ${totalPointsEarned}
- Specialization: ${profileRes.data?.specialization || "general"}` },
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
          }),
        });

        if (aiRes.ok) {
          const aiData = await aiRes.json();
          const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
          if (toolCall?.function?.arguments) {
            try { aiInsight = JSON.parse(toolCall.function.arguments); } catch {}
          }
        }
      } catch { /* AI is optional */ }
    }

    return new Response(JSON.stringify({
      summary: {
        totalPosts30d,
        postGrowth,
        totalReactionsReceived,
        totalReactionsGiven,
        engagementRate,
        totalFollowers,
        newFollowers30d,
        totalFollowing,
        totalComps,
        totalRecipes,
        totalRecipeSaves,
        totalPointsEarned,
        totalStories,
        totalStoryViews,
        profileViews: profileRes.data?.view_count || 0,
        loyaltyPoints: profileRes.data?.loyalty_points || 0,
        memberSince: profileRes.data?.created_at,
      },
      activityChart,
      reactionBreakdown,
      pointsByAction,
      topPosts,
      topHashtags,
      aiInsight,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("personal-analytics error:", e);
    return new Response(JSON.stringify({ error: "Service temporarily unavailable" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
