import { handleCors } from "../_shared/cors.ts";
import { getServiceClient } from "../_shared/auth.ts";
import { jsonResponse, errorResponse } from "../_shared/response.ts";

Deno.serve(async (req) => {
  const corsRes = handleCors(req);
  if (corsRes) return corsRes;

  try {
    const supabase = getServiceClient();
    const { trigger_event, user_id, metadata } = await req.json();

    if (!trigger_event) return jsonResponse({ error: "trigger_event required" }, 400);

    const { data: triggers } = await supabase
      .from("lifecycle_triggers")
      .select("id, name, name_ar, trigger_event, action_type, channels, delay_minutes, template_slug, notification_title, notification_title_ar, notification_body, notification_body_ar, is_active")
      .eq("trigger_event", trigger_event)
      .eq("is_active", true);

    if (!triggers?.length) return jsonResponse({ processed: 0 });

    let processed = 0;

    const notificationMap: Record<string, { title: string; title_ar: string; body: string; body_ar: string }> = {
      user_signup: { title: `Welcome to Altoha!`, title_ar: `مرحباً بك في الطهاة!`, body: "Complete your profile to unlock all features.", body_ar: "أكمل ملفك الشخصي لفتح جميع المميزات." },
      profile_incomplete: { title: "Complete your profile", title_ar: "أكمل ملفك الشخصي", body: "Add your specialization and bio to connect with other chefs.", body_ar: "أضف تخصصك وسيرتك للتواصل مع الطهاة الآخرين." },
      cart_abandoned: { title: "You left something behind!", title_ar: "لديك منتجات في السلة!", body: "Complete your purchase before items sell out.", body_ar: "أكمل عملية الشراء قبل نفاد المنتجات." },
      user_inactive_7d: { title: "We miss you!", title_ar: "نفتقدك!", body: "Check out what's new in the community.", body_ar: "اطلع على الجديد في المجتمع." },
      order_completed: { title: "Thank you for your order!", title_ar: "شكراً لطلبك!", body: "Rate your experience and earn bonus points.", body_ar: "قيّم تجربتك واكسب نقاط إضافية." },
      competition_upcoming: { title: "Competition starting soon!", title_ar: "المسابقة تبدأ قريباً!", body: "Don't miss out—register now.", body_ar: "لا تفوت الفرصة—سجّل الآن." },
      new_follower_milestone: { title: "Congratulations on your growing network!", title_ar: "تهانينا على شبكتك المتنامية!", body: `You now have ${metadata?.follower_count || "more"} followers.`, body_ar: `لديك الآن ${metadata?.follower_count || "المزيد من"} متابعين.` },
      points_milestone: { title: "Points milestone reached!", title_ar: "وصلت إلى مرحلة جديدة من النقاط!", body: `You've earned ${metadata?.points || ""} points. Keep going!`, body_ar: `حصلت على ${metadata?.points || ""} نقطة. استمر!` },
    };

    for (const trigger of triggers) {
      if (trigger.action_type === "notification" && user_id) {
        const content = notificationMap[trigger_event] || { title: trigger.name, title_ar: trigger.name_ar || trigger.name, body: "", body_ar: "" };

        await supabase.from("notifications").insert({
          user_id, title: content.title, title_ar: content.title_ar, body: content.body, body_ar: content.body_ar,
          type: "lifecycle",
          link: trigger_event === "cart_abandoned" ? "/shop/cart" : trigger_event === "profile_incomplete" ? "/profile/edit" : "/community",
          metadata: { trigger_event, trigger_id: trigger.id, ...metadata },
        });
        processed++;
      }
    }

    return jsonResponse({ processed, triggers: triggers.length });
  } catch (error) {
    console.error("Lifecycle trigger error:", error);
    return errorResponse(error);
  }
});
