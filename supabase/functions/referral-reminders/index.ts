import { handleCors } from "../_shared/cors.ts";
import { getServiceClient } from "../_shared/auth.ts";
import { jsonResponse, errorResponse } from "../_shared/response.ts";

Deno.serve(async (req) => {
  const corsRes = handleCors(req);
  if (corsRes) return corsRes;

  try {
    const supabase = getServiceClient();
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;

    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const { data: pendingInvitations, error: fetchErr } = await supabase
      .from("referral_invitations")
      .select("id, referrer_id, invitee_email, invitee_phone, channel, referral_code_id, reminder_sent_at")
      .eq("status", "sent").lte("sent_at", threeDaysAgo.toISOString()).is("reminder_sent_at", null).limit(100);

    if (fetchErr) throw fetchErr;

    if (!pendingInvitations?.length) {
      return jsonResponse({ message: "No pending invitations to remind", reminded: 0 });
    }

    let reminded = 0;
    const errors: string[] = [];

    for (const inv of pendingInvitations) {
      try {
        const { data: profile } = await supabase.from("profiles").select("full_name, username").eq("user_id", inv.referrer_id).single();
        const referrerName = profile?.full_name || profile?.username || "User";

        await supabase.from("notifications").insert({
          user_id: inv.referrer_id,
          title: "Your referral is waiting! 🔔", title_ar: "إحالتك في انتظار الرد! 🔔",
          body: `Your invitation to ${inv.invitee_email || inv.invitee_phone || "a friend"} is still pending. Share your link again to boost your chances!`,
          body_ar: `دعوتك لـ ${inv.invitee_email || inv.invitee_phone || "صديق"} لا تزال معلقة. شارك رابطك مرة أخرى!`,
          type: "reminder", link: "/referrals",
        });

        if (inv.invitee_email && inv.channel === "email") {
          const { data: codeData } = await supabase.from("referral_codes").select("code").eq("id", inv.referral_code_id).single();
          if (codeData?.code) {
            const referralLink = `${supabaseUrl.replace('.supabase.co', '.lovable.app')}/auth?ref=${codeData.code}`;
            await supabase.functions.invoke("send-referral-email", {
              body: { to: inv.invitee_email, referrerName, referralLink, referralCode: codeData.code, language: "en", isReminder: true },
            });
          }
        }

        await supabase.from("referral_invitations").update({ reminder_sent_at: new Date().toISOString() }).eq("id", inv.id);
        reminded++;
      } catch (e) {
        errors.push(`Failed for invitation ${inv.id}: ${e instanceof Error ? e.message : "Unknown"}`);
      }
    }

    console.log(`Referral reminders sent: ${reminded}/${pendingInvitations.length}`);
    return jsonResponse({ reminded, total: pendingInvitations.length, errors });
  } catch (error) {
    console.error("Referral reminders error:", error);
    return errorResponse(error);
  }
});
