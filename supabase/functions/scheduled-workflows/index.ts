import { handleCors } from "../_shared/cors.ts";
import { getServiceClient } from "../_shared/auth.ts";
import { jsonResponse, errorResponse } from "../_shared/response.ts";

Deno.serve(async (req) => {
  const corsRes = handleCors(req);
  if (corsRes) return corsRes;

  try {
    const supabase = getServiceClient();
    const results: Record<string, any> = {};

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];
    const now = new Date().toISOString();

    // 1. Competition reminders
    const { data: startingSoon } = await supabase
      .from("competitions").select("id, title, title_ar")
      .in("status", ["registration_open", "upcoming"])
      .gte("start_date", `${tomorrowStr}T00:00:00`).lte("start_date", `${tomorrowStr}T23:59:59`);

    let remindersCount = 0;
    for (const comp of startingSoon || []) {
      const { data: regs } = await supabase.from("competition_registrations").select("participant_id").eq("competition_id", comp.id).eq("status", "approved");
      for (const uid of (regs?.map(r => r.participant_id) || [])) {
        await supabase.from("notifications").insert({
          user_id: uid, title: `Starting Tomorrow: ${comp.title}`, title_ar: `تبدأ غداً: ${comp.title_ar || comp.title}`,
          body: `"${comp.title}" starts tomorrow. Make sure you're ready!`, body_ar: `"${comp.title_ar || comp.title}" تبدأ غداً. تأكد من جاهزيتك!`,
          type: "info", link: `/competitions/${comp.id}`,
        });
        remindersCount++;
      }
    }
    results.competitionReminders = { competitions: startingSoon?.length || 0, notified: remindersCount };

    // 2. Overdue deliveries
    const { data: overdueOrders } = await supabase.from("competition_order_items").select("id, item_name, competition_id, status").eq("status", "approved").lt("needed_by", now) as any;
    let overdueNotifications = 0;
    for (const order of overdueOrders || []) {
      const { data: roles } = await supabase.from("competition_roles").select("user_id").eq("competition_id", order.competition_id).eq("role", "organizer").eq("status", "active").limit(1);
      if (roles?.[0]) {
        await supabase.from("notifications").insert({
          user_id: roles[0].user_id, title: `Overdue Delivery: ${order.item_name}`, title_ar: `تسليم متأخر: ${order.item_name}`,
          body: `The delivery for "${order.item_name}" is overdue.`, body_ar: `تسليم "${order.item_name}" متأخر.`,
          type: "warning", link: `/competitions/${order.competition_id}`,
        });
        overdueNotifications++;
      }
    }
    results.overdueDeliveries = { overdue: overdueOrders?.length || 0, notified: overdueNotifications };

    // 3. Exhibition reminders
    const { data: startingExhibitions } = await supabase.from("exhibitions").select("id, title, title_ar, organizer_id").gte("start_date", `${tomorrowStr}T00:00:00`).lte("start_date", `${tomorrowStr}T23:59:59`);
    for (const exh of startingExhibitions || []) {
      if (exh.organizer_id) {
        await supabase.from("notifications").insert({
          user_id: exh.organizer_id, title: `Exhibition Starting Tomorrow: ${exh.title}`, title_ar: `المعرض يبدأ غداً: ${exh.title_ar || exh.title}`,
          body: `Your exhibition "${exh.title}" starts tomorrow.`, body_ar: `معرضك "${exh.title_ar || exh.title}" يبدأ غداً.`,
          type: "info", link: `/exhibitions/${exh.id}`,
        });
      }
    }
    results.exhibitionReminders = startingExhibitions?.length || 0;

    // 4. Auto-close expired competitions
    const { data: expired } = await supabase.from("competitions").select("id").eq("status", "in_progress").lt("end_date", now);
    if (expired?.length) {
      await supabase.from("competitions").update({ status: "completed", updated_at: now }).in("id", expired.map(c => c.id));
    }
    results.autoCompleted = expired?.length || 0;

    console.log("Scheduled workflows completed:", results);
    return jsonResponse({ success: true, ...results });
  } catch (error: unknown) {
    console.error("Scheduled workflows error:", error);
    return errorResponse(error);
  }
});
