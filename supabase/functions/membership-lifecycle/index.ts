import { handleCors } from "../_shared/cors.ts";
import { getServiceClient } from "../_shared/auth.ts";
import { jsonResponse, errorResponse } from "../_shared/response.ts";

const GRACE_PERIOD_DAYS = 7;
const EXPIRY_MILESTONES = [14, 7, 3, 1];
const ANNIVERSARY_MILESTONES = [30, 180, 365];

Deno.serve(async (req) => {
  const corsRes = handleCors(req);
  if (corsRes) return corsRes;

  try {
    const supabase = getServiceClient();
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const now = new Date();
    const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);

    const stats = { welcome: 0, milestones: 0, expiry_warnings: 0, expired: 0, suspended: 0, trial_reminders: 0, emails_queued: 0 };

    const alreadySent = async (userId: string, type: string) => {
      const { data } = await supabase.from("notifications").select("id")
        .eq("user_id", userId).eq("type", type).gte("created_at", todayStart.toISOString()).limit(1);
      return (data?.length || 0) > 0;
    };

    const notify = async (userId: string, title: string, titleAr: string, body: string, bodyAr: string, type: string, link = "/profile?tab=membership", metadata?: Record<string, any>) => {
      await supabase.from("notifications").insert({ user_id: userId, title, title_ar: titleAr, body, body_ar: bodyAr, type, link, metadata: metadata || null });
    };

    const sendEmail = async (userId: string, emailType: string, data?: Record<string, any>) => {
      try {
        const resp = await fetch(`${supabaseUrl}/functions/v1/send-membership-email`, {
          method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${serviceKey}` },
          body: JSON.stringify({ type: emailType, user_id: userId, data }),
        });
        if (resp.ok) stats.emails_queued++;
      } catch (e) { console.error("Email send failed for", userId, emailType, e); }
    };

    // ═══════════ 1. WELCOME NOTIFICATIONS ═══════════
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const { data: newMembers } = await supabase.from("profiles")
      .select("user_id, full_name, membership_tier, membership_started_at")
      .neq("membership_tier", "basic").eq("membership_status", "active")
      .not("membership_started_at", "is", null)
      .gte("membership_started_at", yesterday.toISOString()).lte("membership_started_at", now.toISOString());

    for (const m of newMembers || []) {
      if (await alreadySent(m.user_id, "membership_welcome")) continue;
      const tierAr = m.membership_tier === "professional" ? "الاحترافية" : "المؤسسية";
      const tierEn = m.membership_tier === "professional" ? "Professional" : "Enterprise";
      await notify(m.user_id, `🎉 Welcome to ${tierEn}!`, `🎉 مرحباً بك في العضوية ${tierAr}!`,
        `You're now a ${tierEn} member. Explore your new benefits and make the most of your membership.`,
        `أنت الآن عضو ${tierAr}. استكشف مميزاتك الجديدة واستفد من عضويتك.`,
        "membership_welcome", "/profile?tab=membership", { tier: m.membership_tier });
      await sendEmail(m.user_id, "welcome", { tier: m.membership_tier, full_name: m.full_name });
      stats.welcome++;
    }

    // ═══════════ 2. ANNIVERSARY MILESTONES ═══════════
    const { data: activeMembers } = await supabase.from("profiles")
      .select("user_id, full_name, membership_tier, membership_started_at")
      .neq("membership_tier", "basic").eq("membership_status", "active").not("membership_started_at", "is", null);

    for (const m of activeMembers || []) {
      const daysSinceStart = Math.floor((now.getTime() - new Date(m.membership_started_at).getTime()) / (1000 * 60 * 60 * 24));
      for (const milestone of ANNIVERSARY_MILESTONES) {
        if (daysSinceStart !== milestone) continue;
        const type = `membership_milestone_${milestone}d`;
        if (await alreadySent(m.user_id, type)) continue;
        const labelEn = milestone === 30 ? "1 month" : milestone === 180 ? "6 months" : "1 year";
        const labelAr = milestone === 30 ? "شهر واحد" : milestone === 180 ? "6 أشهر" : "سنة كاملة";
        await notify(m.user_id, `🏆 ${labelEn} as a ${m.membership_tier} member!`,
          `🏆 مرت ${labelAr} على عضويتك ${m.membership_tier === "professional" ? "الاحترافية" : "المؤسسية"}!`,
          `Congratulations on ${labelEn} of membership! Thank you for being part of our community.`,
          `تهانينا بمرور ${labelAr} على عضويتك! شكراً لكونك جزءاً من مجتمعنا.`,
          type, "/profile?tab=membership", { milestone, tier: m.membership_tier, days: daysSinceStart });
        stats.milestones++;
      }
    }

    // ═══════════ 3. EXPIRY WARNINGS ═══════════
    const { data: expiringProfiles } = await supabase.from("profiles")
      .select("user_id, full_name, membership_tier, membership_expires_at")
      .eq("membership_status", "active").neq("membership_tier", "basic").not("membership_expires_at", "is", null)
      .gt("membership_expires_at", now.toISOString())
      .lte("membership_expires_at", new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString());

    for (const p of expiringProfiles || []) {
      const daysLeft = Math.ceil((new Date(p.membership_expires_at).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const milestone = EXPIRY_MILESTONES.find((m) => daysLeft <= m && daysLeft > (EXPIRY_MILESTONES[EXPIRY_MILESTONES.indexOf(m) + 1] || 0));
      if (!milestone) continue;
      const type = `membership_expiry_${milestone}d`;
      if (await alreadySent(p.user_id, type)) continue;
      const tierAr = p.membership_tier === "professional" ? "الاحترافية" : "المؤسسية";
      const urgencyEmoji = daysLeft <= 1 ? "🚨" : daysLeft <= 3 ? "⚠️" : "⏰";
      await notify(p.user_id,
        daysLeft <= 1 ? `${urgencyEmoji} Your ${p.membership_tier} membership expires tomorrow!` : `${urgencyEmoji} Your ${p.membership_tier} membership expires in ${daysLeft} days`,
        daysLeft <= 1 ? `${urgencyEmoji} عضويتك ${tierAr} تنتهي غداً!` : `${urgencyEmoji} عضويتك ${tierAr} تنتهي خلال ${daysLeft} يوم`,
        "Renew now to keep your premium features and uninterrupted access.",
        "جدد الآن للحفاظ على ميزاتك المميزة ووصولك المستمر.",
        type, "/membership/checkout?renew=true",
        { tier: p.membership_tier, expires_at: p.membership_expires_at, days_left: daysLeft });
      await sendEmail(p.user_id, "expiry_warning", { tier: p.membership_tier, days_left: daysLeft, full_name: p.full_name, expires_at: p.membership_expires_at });
      stats.expiry_warnings++;
    }

    // ═══════════ 4. MARK EXPIRED ═══════════
    const { data: toExpire } = await supabase.from("profiles")
      .select("user_id, full_name, membership_tier, membership_expires_at")
      .eq("membership_status", "active").lt("membership_expires_at", now.toISOString()).neq("membership_tier", "basic");

    for (const p of toExpire || []) {
      await supabase.from("profiles").update({ membership_status: "expired" }).eq("user_id", p.user_id);
      await supabase.from("membership_history").insert({ user_id: p.user_id, previous_tier: p.membership_tier, new_tier: p.membership_tier, reason: `Membership expired — ${GRACE_PERIOD_DAYS}-day grace period started` });
      await notify(p.user_id, "🔴 Your membership has expired", "🔴 انتهت صلاحية عضويتك",
        `Your ${p.membership_tier} membership has expired. Renew within ${GRACE_PERIOD_DAYS} days to keep your benefits.`,
        `انتهت صلاحية عضويتك. جدد خلال ${GRACE_PERIOD_DAYS} أيام للاحتفاظ بمميزاتك.`,
        "membership_expired", "/membership/checkout?renew=true", { tier: p.membership_tier, expired_at: p.membership_expires_at });
      await sendEmail(p.user_id, "expired", { tier: p.membership_tier, full_name: p.full_name });
      stats.expired++;
    }

    // ═══════════ 5. SUSPEND AFTER GRACE PERIOD ═══════════
    const graceCutoff = new Date(now.getTime() - GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000);
    const { data: toSuspend } = await supabase.from("profiles")
      .select("user_id, full_name, membership_tier, membership_expires_at")
      .eq("membership_status", "expired").lt("membership_expires_at", graceCutoff.toISOString()).neq("membership_tier", "basic");

    for (const p of toSuspend || []) {
      await Promise.all([
        supabase.from("profiles").update({ membership_status: "suspended", membership_tier: "basic" as any }).eq("user_id", p.user_id),
        supabase.from("membership_cards").update({ card_status: "suspended" }).eq("user_id", p.user_id),
        supabase.from("membership_history").insert({ user_id: p.user_id, previous_tier: p.membership_tier, new_tier: "basic", reason: "Auto-suspended after grace period expired" }),
        supabase.from("invoices").update({ status: "void" }).eq("user_id", p.user_id).eq("status", "pending").ilike("title", "%membership%"),
      ]);
      await notify(p.user_id, "Membership suspended", "تم تعليق العضوية",
        `Your ${p.membership_tier} membership has been suspended due to non-renewal. Renew to restore access.`,
        `تم تعليق عضويتك بسبب عدم التجديد. جدد لاستعادة الوصول.`,
        "membership_suspended", "/membership/checkout?renew=true", { previous_tier: p.membership_tier });
      await sendEmail(p.user_id, "suspended", { tier: p.membership_tier, full_name: p.full_name, reason: "Non-renewal after grace period" });
      stats.suspended++;
    }

    // ═══════════ 6. TRIAL EXPIRY REMINDERS ═══════════
    const { data: trialCards } = await supabase.from("membership_cards")
      .select("user_id, trial_ends_at").eq("is_trial", true).eq("card_status", "active").not("trial_ends_at", "is", null);

    for (const card of trialCards || []) {
      const diffDays = Math.ceil((new Date(card.trial_ends_at).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays !== 3 && diffDays !== 1) continue;
      const type = `trial_expiry_${diffDays}d`;
      if (await alreadySent(card.user_id, type)) continue;
      await notify(card.user_id,
        diffDays === 1 ? "🚨 Your trial expires tomorrow!" : "⏰ Your trial expires in 3 days",
        diffDays === 1 ? "🚨 تنتهي فترتك التجريبية غداً!" : "⏰ تنتهي فترتك التجريبية خلال 3 أيام",
        diffDays === 1 ? "Last chance to upgrade and keep your benefits." : "Upgrade now to keep all your membership benefits.",
        diffDays === 1 ? "فرصتك الأخيرة للترقية والحفاظ على مميزاتك." : "قم بالترقية الآن للحفاظ على جميع مميزات عضويتك.",
        type, "/membership/checkout", { trial_ends_at: card.trial_ends_at, days_remaining: diffDays });
      await sendEmail(card.user_id, "trial_ending", { days_left: diffDays });
      stats.trial_reminders++;
    }

    // ═══════════ 7. HANDLE EXPIRED TRIALS ═══════════
    const { data: expiredTrials } = await supabase.from("profiles")
      .select("user_id, full_name, membership_tier, trial_tier, trial_ends_at")
      .eq("trial_expired", false).not("trial_ends_at", "is", null).lt("trial_ends_at", now.toISOString());

    for (const t of expiredTrials || []) {
      if (await alreadySent(t.user_id, "trial_auto_expired")) continue;
      await supabase.from("profiles").update({ membership_tier: "basic" as any, trial_expired: true, membership_status: "active" }).eq("user_id", t.user_id);
      await supabase.from("membership_history").insert({ user_id: t.user_id, previous_tier: t.trial_tier || t.membership_tier, new_tier: "basic", reason: "Trial period auto-expired" });
      await notify(t.user_id, "⏳ Your free trial has ended", "⏳ انتهت تجربتك المجانية",
        "Your trial has ended. Upgrade to keep your premium features.",
        "انتهت تجربتك المجانية. قم بالترقية للاحتفاظ بالمميزات.",
        "trial_auto_expired", "/membership/checkout");
      await sendEmail(t.user_id, "trial_expired", { full_name: t.full_name });
    }

    console.log("Membership lifecycle complete:", stats);
    return jsonResponse({ success: true, stats });
  } catch (error: any) {
    console.error("Membership lifecycle error:", error);
    return errorResponse(error);
  }
});
