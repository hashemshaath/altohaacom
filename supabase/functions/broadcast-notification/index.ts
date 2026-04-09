import { handleCors } from "../_shared/cors.ts";
import { authenticateRequest, getServiceClient } from "../_shared/auth.ts";
import { jsonResponse, errorResponse } from "../_shared/response.ts";

Deno.serve(async (req) => {
  const corsRes = handleCors(req);
  if (corsRes) return corsRes;

  try {
    const { userId } = await authenticateRequest(req);
    const supabase = getServiceClient();

    // Verify admin role
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    const isAdmin = roles?.some((r: any) => r.role === "organizer" || r.role === "supervisor");
    if (!isAdmin) throw new Error("Forbidden");

    const {
      title, titleAr, body, bodyAr,
      type = "info", link,
      channels = ["in_app"],
      targetAll = true,
      targetUserIds = [],
      targetRole,
    } = await req.json();

    if (!title || !body) {
      return jsonResponse({ error: "Title and body are required" }, 400);
    }

    let userIds: string[] = [];

    if (targetAll) {
      const { data: profiles } = await supabase.from("profiles").select("user_id");
      userIds = profiles?.map((p: any) => p.user_id) || [];
    } else if (targetRole) {
      const { data: roleUsers } = await supabase
        .from("user_roles").select("user_id").eq("role", targetRole);
      userIds = roleUsers?.map((r: any) => r.user_id) || [];
    } else if (targetUserIds.length > 0) {
      userIds = targetUserIds;
    }

    if (userIds.length === 0) {
      return jsonResponse({ error: "No target users found" }, 400);
    }

    let sentCount = 0;
    let failedCount = 0;

    if (channels.includes("in_app")) {
      const notifications = userIds.map((uid: string) => ({
        user_id: uid, title, title_ar: titleAr, body, body_ar: bodyAr,
        type, link, channel: "in_app", status: "sent",
      }));

      for (let i = 0; i < notifications.length; i += 100) {
        const batch = notifications.slice(i, i + 100);
        const { error } = await supabase.from("notifications").insert(batch);
        if (error) { failedCount += batch.length; } else { sentCount += batch.length; }
      }
    }

    if (channels.includes("email")) {
      const queueItems = userIds.map((uid: string) => ({
        user_id: uid, channel: "email",
        payload: { title, title_ar: titleAr, body, body_ar: bodyAr, type, link },
        status: "pending",
      }));
      for (let i = 0; i < queueItems.length; i += 100) {
        await supabase.from("notification_queue").insert(queueItems.slice(i, i + 100));
      }
    }

    console.log(`Broadcast sent: ${sentCount} notifications to ${userIds.length} users`);

    return jsonResponse({ success: true, sent: sentCount, failed: failedCount, totalUsers: userIds.length });
  } catch (error: unknown) {
    console.error("Broadcast error:", error);
    return errorResponse(error);
  }
});
