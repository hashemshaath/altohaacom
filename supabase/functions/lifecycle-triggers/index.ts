import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { trigger_event, user_id, metadata } = await req.json();

    if (!trigger_event) {
      return new Response(JSON.stringify({ error: "trigger_event required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find matching active lifecycle triggers
    const { data: triggers } = await supabase
      .from("lifecycle_triggers")
      .select("*")
      .eq("trigger_event", trigger_event)
      .eq("is_active", true);

    if (!triggers || triggers.length === 0) {
      return new Response(JSON.stringify({ processed: 0 }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let processed = 0;

    for (const trigger of triggers) {
      // For triggers with delay, in production you'd use a job queue
      // For now, we process immediately and log the intended delay
      if (trigger.action_type === "notification" && user_id) {
        // Get user profile for personalization
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, username, email")
          .eq("user_id", user_id)
          .single();

        const userName = profile?.full_name || profile?.username || "User";

        // Build notification content based on trigger
        const notificationMap: Record<string, { title: string; title_ar: string; body: string; body_ar: string }> = {
          user_signup: {
            title: `Welcome to Altohaa, ${userName}!`,
            title_ar: `مرحباً بك في الطهاة، ${userName}!`,
            body: "Complete your profile to unlock all features.",
            body_ar: "أكمل ملفك الشخصي لفتح جميع المميزات.",
          },
          profile_incomplete: {
            title: "Complete your profile",
            title_ar: "أكمل ملفك الشخصي",
            body: "Add your specialization and bio to connect with other chefs.",
            body_ar: "أضف تخصصك وسيرتك للتواصل مع الطهاة الآخرين.",
          },
          cart_abandoned: {
            title: "You left something behind!",
            title_ar: "لديك منتجات في السلة!",
            body: "Complete your purchase before items sell out.",
            body_ar: "أكمل عملية الشراء قبل نفاد المنتجات.",
          },
          user_inactive_7d: {
            title: "We miss you!",
            title_ar: "نفتقدك!",
            body: "Check out what's new in the community.",
            body_ar: "اطلع على الجديد في المجتمع.",
          },
          order_completed: {
            title: "Thank you for your order!",
            title_ar: "شكراً لطلبك!",
            body: "Rate your experience and earn bonus points.",
            body_ar: "قيّم تجربتك واكسب نقاط إضافية.",
          },
          competition_upcoming: {
            title: "Competition starting soon!",
            title_ar: "المسابقة تبدأ قريباً!",
            body: "Don't miss out—register now.",
            body_ar: "لا تفوت الفرصة—سجّل الآن.",
          },
          new_follower_milestone: {
            title: "Congratulations on your growing network!",
            title_ar: "تهانينا على شبكتك المتنامية!",
            body: `You now have ${metadata?.follower_count || "more"} followers.`,
            body_ar: `لديك الآن ${metadata?.follower_count || "المزيد من"} متابعين.`,
          },
          points_milestone: {
            title: "Points milestone reached!",
            title_ar: "وصلت إلى مرحلة جديدة من النقاط!",
            body: `You've earned ${metadata?.points || ""} points. Keep going!`,
            body_ar: `حصلت على ${metadata?.points || ""} نقطة. استمر!`,
          },
        };

        const content = notificationMap[trigger_event] || {
          title: trigger.name,
          title_ar: trigger.name_ar || trigger.name,
          body: "",
          body_ar: "",
        };

        // Insert notification
        await supabase.from("notifications").insert({
          user_id,
          title: content.title,
          title_ar: content.title_ar,
          body: content.body,
          body_ar: content.body_ar,
          type: "lifecycle",
          link: trigger_event === "cart_abandoned" ? "/shop/cart"
            : trigger_event === "profile_incomplete" ? "/profile/edit"
            : "/community",
          metadata: { trigger_event, trigger_id: trigger.id, ...metadata },
        });

        processed++;
      }
    }

    return new Response(JSON.stringify({ processed, triggers: triggers.length }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("Lifecycle trigger error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
