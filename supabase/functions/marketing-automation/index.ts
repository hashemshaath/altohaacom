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
    const resendKey = Deno.env.get("RESEND_API_KEY");

    const { action } = await req.json();

    const results: Record<string, number> = {};

    // ── 1. Welcome series: new users in last 24h without welcome notification ──
    if (!action || action === "welcome") {
      const { data: newProfiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, email, preferred_language")
        .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .limit(100);

      let welcomeCount = 0;
      for (const profile of newProfiles || []) {
        // Check if welcome already sent
        const { data: existing } = await supabase
          .from("notifications")
          .select("id")
          .eq("user_id", profile.user_id)
          .eq("type", "lifecycle")
          .like("metadata->>trigger_event", "user_signup")
          .limit(1);

        if (existing && existing.length > 0) continue;

        const isAr = profile.preferred_language === "ar";
        const name = profile.full_name || "Chef";

        // Send in-app notification
        await supabase.from("notifications").insert({
          user_id: profile.user_id,
          title: isAr ? `مرحباً بك في الطهاة، ${name}! 🎉` : `Welcome to Altoha, ${name}! 🎉`,
          title_ar: `مرحباً بك في الطهاة، ${name}! 🎉`,
          body: isAr ? "أكمل ملفك الشخصي واستكشف المجتمع والمسابقات." : "Complete your profile and explore the community & competitions.",
          body_ar: "أكمل ملفك الشخصي واستكشف المجتمع والمسابقات.",
          type: "lifecycle",
          link: "/profile/edit",
          metadata: { trigger_event: "user_signup" },
        });

        // Send welcome email via Resend
        if (resendKey && profile.email) {
          try {
            await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
              body: JSON.stringify({
                from: "Altoha <noreply@altoha.com>",
                to: [profile.email],
                subject: isAr ? `مرحباً بك في الطهاة، ${name}!` : `Welcome to Altoha, ${name}!`,
                html: isAr
                  ? `<div dir="rtl" style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px"><h1>مرحباً ${name}! 🎉</h1><p>شكراً لانضمامك إلى مجتمع الطهاة. أكمل ملفك الشخصي للاستفادة من جميع المميزات.</p><a href="https://altoha.com/profile/edit" style="display:inline-block;background:#c8a97e;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;margin-top:16px">أكمل ملفك الشخصي</a></div>`
                  : `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px"><h1>Welcome ${name}! 🎉</h1><p>Thank you for joining the Altoha community. Complete your profile to unlock all features.</p><a href="https://altoha.com/profile/edit" style="display:inline-block;background:#c8a97e;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;margin-top:16px">Complete Your Profile</a></div>`,
              }),
            });
          } catch (e) {
            console.error("Welcome email error:", e);
          }
        }
        welcomeCount++;
      }
      results.welcome = welcomeCount;
    }

    // ── 2. Cart abandonment: carts abandoned > 1 hour without recovery email ──
    if (!action || action === "cart_abandonment") {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { data: abandonedCarts } = await supabase
        .from("abandoned_carts")
        .select("id, user_id, total_amount, items, session_id")
        .eq("recovery_status", "abandoned")
        .is("recovery_email_sent_at", null)
        .lt("updated_at", oneHourAgo)
        .limit(50);

      let cartCount = 0;
      for (const cart of abandonedCarts || []) {
        if (!cart.user_id) continue;

        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, email, preferred_language")
          .eq("user_id", cart.user_id)
          .single();

        if (!profile) continue;
        const isAr = profile.preferred_language === "ar";
        const name = profile.full_name || "Chef";

        // In-app notification
        await supabase.from("notifications").insert({
          user_id: cart.user_id,
          title: isAr ? "لديك منتجات في السلة! 🛒" : "You left something behind! 🛒",
          title_ar: "لديك منتجات في السلة! 🛒",
          body: isAr ? "أكمل عملية الشراء قبل نفاد المنتجات." : "Complete your purchase before items sell out.",
          body_ar: "أكمل عملية الشراء قبل نفاد المنتجات.",
          type: "lifecycle",
          link: "/shop",
          metadata: { trigger_event: "cart_abandoned", cart_id: cart.id },
        });

        // Email
        if (resendKey && profile.email) {
          try {
            const amount = Number(cart.total_amount || 0).toFixed(2);
            await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
              body: JSON.stringify({
                from: "Altoha <noreply@altoha.com>",
                to: [profile.email],
                subject: isAr ? `${name}، أكمل طلبك!` : `${name}, complete your order!`,
                html: isAr
                  ? `<div dir="rtl" style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px"><h2>لديك منتجات في السلة 🛒</h2><p>مرحباً ${name}، لديك منتجات بقيمة <strong>${amount} SAR</strong> في سلة التسوق.</p><a href="https://altoha.com/shop" style="display:inline-block;background:#c8a97e;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;margin-top:16px">أكمل الشراء</a></div>`
                  : `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px"><h2>You left items in your cart 🛒</h2><p>Hi ${name}, you have items worth <strong>${amount} SAR</strong> waiting for you.</p><a href="https://altoha.com/shop" style="display:inline-block;background:#c8a97e;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;margin-top:16px">Complete Purchase</a></div>`,
              }),
            });
          } catch (e) {
            console.error("Cart email error:", e);
          }
        }

        // Mark email sent
        await supabase.from("abandoned_carts").update({ recovery_email_sent_at: new Date().toISOString() }).eq("id", cart.id);
        cartCount++;
      }
      results.cart_abandonment = cartCount;
    }

    // ── 3. Inactivity: users inactive > 7 days ──
    if (!action || action === "inactivity") {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data: inactiveProfiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, email, preferred_language, last_active_at")
        .lt("last_active_at", sevenDaysAgo)
        .not("last_active_at", "is", null)
        .limit(50);

      let inactiveCount = 0;
      for (const profile of inactiveProfiles || []) {
        // Check if we already sent an inactivity notification in the last 7 days
        const { data: existing } = await supabase
          .from("notifications")
          .select("id")
          .eq("user_id", profile.user_id)
          .eq("type", "lifecycle")
          .like("metadata->>trigger_event", "user_inactive_7d")
          .gte("created_at", sevenDaysAgo)
          .limit(1);

        if (existing && existing.length > 0) continue;

        const isAr = profile.preferred_language === "ar";
        const name = profile.full_name || "Chef";

        await supabase.from("notifications").insert({
          user_id: profile.user_id,
          title: isAr ? `نفتقدك ${name}! 👋` : `We miss you, ${name}! 👋`,
          title_ar: `نفتقدك ${name}! 👋`,
          body: isAr ? "اطلع على الجديد في المجتمع والمسابقات." : "Check out what's new in the community & competitions.",
          body_ar: "اطلع على الجديد في المجتمع والمسابقات.",
          type: "lifecycle",
          link: "/community",
          metadata: { trigger_event: "user_inactive_7d" },
        });

        if (resendKey && profile.email) {
          try {
            await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
              body: JSON.stringify({
                from: "Altoha <noreply@altoha.com>",
                to: [profile.email],
                subject: isAr ? `${name}، نفتقدك!` : `${name}, we miss you!`,
                html: isAr
                  ? `<div dir="rtl" style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px"><h2>نفتقدك! 👋</h2><p>مرحباً ${name}، هناك الكثير من الجديد في انتظارك.</p><a href="https://altoha.com/community" style="display:inline-block;background:#c8a97e;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;margin-top:16px">استكشف الجديد</a></div>`
                  : `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px"><h2>We miss you! 👋</h2><p>Hi ${name}, there's a lot of new activity waiting for you.</p><a href="https://altoha.com/community" style="display:inline-block;background:#c8a97e;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;margin-top:16px">See What's New</a></div>`,
              }),
            });
          } catch (e) {
            console.error("Inactivity email error:", e);
          }
        }
        inactiveCount++;
      }
      results.inactivity = inactiveCount;
    }

    // ── 4. Milestone congratulations: point milestones ──
    if (!action || action === "milestones") {
      const milestones = [100, 500, 1000, 2500, 5000, 10000];
      const { data: wallets } = await supabase
        .from("user_wallets")
        .select("user_id, points_balance")
        .gt("points_balance", 0)
        .limit(200);

      let milestoneCount = 0;
      for (const wallet of wallets || []) {
        const milestone = milestones.find(m => wallet.points_balance >= m);
        if (!milestone) continue;

        // Check if already notified for this milestone
        const { data: existing } = await supabase
          .from("notifications")
          .select("id")
          .eq("user_id", wallet.user_id)
          .eq("type", "lifecycle")
          .like("metadata->>trigger_event", "points_milestone")
          .like("metadata->>milestone", String(milestone))
          .limit(1);

        if (existing && existing.length > 0) continue;

        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, preferred_language")
          .eq("user_id", wallet.user_id)
          .single();

        const isAr = profile?.preferred_language === "ar";
        const name = profile?.full_name || "Chef";

        await supabase.from("notifications").insert({
          user_id: wallet.user_id,
          title: isAr ? `تهانينا ${name}! 🏆` : `Congratulations ${name}! 🏆`,
          title_ar: `تهانينا ${name}! 🏆`,
          body: isAr ? `حققت ${milestone} نقطة! استمر في التميز.` : `You've reached ${milestone} points! Keep excelling.`,
          body_ar: `حققت ${milestone} نقطة! استمر في التميز.`,
          type: "lifecycle",
          link: "/profile",
          metadata: { trigger_event: "points_milestone", milestone: String(milestone), points: wallet.points_balance },
        });
        milestoneCount++;
      }
      results.milestones = milestoneCount;
    }

    return new Response(JSON.stringify({ success: true, results }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("Marketing automation error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
