import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface BroadcastPayload {
  title: string;
  titleAr?: string;
  body: string;
  bodyAr?: string;
  type?: string;
  link?: string;
  channels?: string[];
  targetAll?: boolean;
  targetUserIds?: string[];
  targetRole?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify the caller is an admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check admin role
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const isAdmin = roles?.some((r) => r.role === "organizer" || r.role === "supervisor");
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload: BroadcastPayload = await req.json();
    const {
      title,
      titleAr,
      body,
      bodyAr,
      type = "info",
      link,
      channels = ["in_app"],
      targetAll = true,
      targetUserIds = [],
      targetRole,
    } = payload;

    if (!title || !body) {
      return new Response(JSON.stringify({ error: "Title and body are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let userIds: string[] = [];

    if (targetAll) {
      // Get all user IDs from profiles
      const { data: profiles } = await supabase.from("profiles").select("user_id");
      userIds = profiles?.map((p) => p.user_id) || [];
    } else if (targetRole) {
      // Get users with specific role
      const { data: roleUsers } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", targetRole);
      userIds = roleUsers?.map((r) => r.user_id) || [];
    } else if (targetUserIds.length > 0) {
      userIds = targetUserIds;
    }

    if (userIds.length === 0) {
      return new Response(JSON.stringify({ error: "No target users found" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create in-app notifications in batch
    let sentCount = 0;
    let failedCount = 0;

    if (channels.includes("in_app")) {
      const notifications = userIds.map((userId) => ({
        user_id: userId,
        title,
        title_ar: titleAr,
        body,
        body_ar: bodyAr,
        type,
        link,
        channel: "in_app",
        status: "sent",
      }));

      // Insert in batches of 100
      for (let i = 0; i < notifications.length; i += 100) {
        const batch = notifications.slice(i, i + 100);
        const { error } = await supabase.from("notifications").insert(batch);
        if (error) {
          console.error("Batch insert error:", error);
          failedCount += batch.length;
        } else {
          sentCount += batch.length;
        }
      }
    }

    // Queue email notifications
    if (channels.includes("email")) {
      const queueItems = userIds.map((userId) => ({
        user_id: userId,
        channel: "email",
        payload: { title, title_ar: titleAr, body, body_ar: bodyAr, type, link },
        status: "pending",
      }));

      for (let i = 0; i < queueItems.length; i += 100) {
        const batch = queueItems.slice(i, i + 100);
        await supabase.from("notification_queue").insert(batch);
      }
    }

    console.log(`Broadcast sent: ${sentCount} notifications to ${userIds.length} users`);

    return new Response(
      JSON.stringify({
        success: true,
        sent: sentCount,
        failed: failedCount,
        totalUsers: userIds.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Broadcast error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
