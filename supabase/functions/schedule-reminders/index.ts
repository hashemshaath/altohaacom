import { handleCors } from "../_shared/cors.ts";
import { getServiceClient } from "../_shared/auth.ts";
import { jsonResponse, errorResponse } from "../_shared/response.ts";

Deno.serve(async (req) => {
  const corsRes = handleCors(req);
  if (corsRes) return corsRes;

  try {
    const supabase = getServiceClient();
    const now = new Date();
    const tomorrow = new Date(now); tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date(now); dayAfter.setDate(dayAfter.getDate() + 2);

    const { data: upcomingEvents, error } = await supabase
      .from("chef_schedule_events")
      .select("id, chef_id, title, title_ar, start_date, end_date, event_type, city, venue, status")
      .neq("status", "cancelled")
      .gte("start_date", tomorrow.toISOString()).lt("start_date", dayAfter.toISOString());
    if (error) throw error;

    let notificationCount = 0;
    for (const event of upcomingEvents || []) {
      const formattedDate = new Date(event.start_date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
      const locationInfo = event.city ? ` in ${event.city}` : "";

      const { error: notifError } = await supabase.from("notifications").insert({
        user_id: event.chef_id,
        title: `Reminder: ${event.title} tomorrow`,
        title_ar: `تذكير: ${event.title_ar || event.title} غداً`,
        body: `Your ${event.event_type} "${event.title}" is scheduled for ${formattedDate}${locationInfo}.`,
        body_ar: `${event.title_ar || event.title} مقرر في ${formattedDate}${event.city ? ` في ${event.city}` : ""}.`,
        type: "schedule_reminder", link: "/profile?tab=schedule",
        metadata: { event_id: event.id, event_type: event.event_type, reminder_type: "24h" },
      });
      if (!notifError) notificationCount++;
    }

    return jsonResponse({ success: true, reminders_sent: notificationCount, events_found: upcomingEvents?.length || 0 });
  } catch (err: unknown) {
    console.error("Schedule reminders error:", err);
    return errorResponse(err);
  }
});
