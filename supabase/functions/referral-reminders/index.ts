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
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Find pending invitations older than 3 days that haven't been reminded yet
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const { data: pendingInvitations, error: fetchErr } = await supabase
      .from("referral_invitations")
      .select("id, referrer_id, invitee_email, invitee_phone, channel, referral_code_id, reminder_sent_at")
      .eq("status", "sent")
      .lte("sent_at", threeDaysAgo.toISOString())
      .is("reminder_sent_at", null)
      .limit(100);

    if (fetchErr) {
      console.error("Fetch error:", fetchErr);
      return new Response(
        JSON.stringify({ error: fetchErr.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!pendingInvitations?.length) {
      return new Response(
        JSON.stringify({ message: "No pending invitations to remind", reminded: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let reminded = 0;
    const errors: string[] = [];

    for (const inv of pendingInvitations) {
      try {
        // Send in-app notification to the referrer
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, username")
          .eq("user_id", inv.referrer_id)
          .single();

        const referrerName = profile?.full_name || profile?.username || "User";

        // Notify the referrer that their invitation is still pending
        await supabase.from("notifications").insert({
          user_id: inv.referrer_id,
          title: "Your referral is waiting! 🔔",
          title_ar: "إحالتك في انتظار الرد! 🔔",
          body: `Your invitation to ${inv.invitee_email || inv.invitee_phone || "a friend"} is still pending. Share your link again to boost your chances!`,
          body_ar: `دعوتك لـ ${inv.invitee_email || inv.invitee_phone || "صديق"} لا تزال معلقة. شارك رابطك مرة أخرى!`,
          type: "reminder",
          link: "/referrals",
        });

        // If email invitation, resend via email
        if (inv.invitee_email && inv.channel === "email") {
          const { data: codeData } = await supabase
            .from("referral_codes")
            .select("code")
            .eq("id", inv.referral_code_id)
            .single();

          if (codeData?.code) {
            const referralLink = `${supabaseUrl.replace('.supabase.co', '.lovable.app')}/auth?ref=${codeData.code}`;

            await supabase.functions.invoke("send-referral-email", {
              body: {
                to: inv.invitee_email,
                referrerName,
                referralLink,
                referralCode: codeData.code,
                language: "en",
                isReminder: true,
              },
            });
          }
        }

        // Mark as reminded
        await supabase
          .from("referral_invitations")
          .update({ reminder_sent_at: new Date().toISOString() })
          .eq("id", inv.id);

        reminded++;
      } catch (e) {
        errors.push(`Failed for invitation ${inv.id}: ${e instanceof Error ? e.message : "Unknown"}`);
      }
    }

    console.log(`Referral reminders sent: ${reminded}/${pendingInvitations.length}`);

    return new Response(
      JSON.stringify({ reminded, total: pendingInvitations.length, errors }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Referral reminders error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
