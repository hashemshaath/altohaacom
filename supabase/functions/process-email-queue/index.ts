import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ error: "RESEND_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resend = new Resend(resendApiKey);
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch pending email queue items
    const { data: queueItems, error: fetchError } = await supabase
      .from("notification_queue")
      .select("*")
      .eq("channel", "email")
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(50);

    if (fetchError) throw fetchError;

    if (!queueItems || queueItems.length === 0) {
      return new Response(
        JSON.stringify({ message: "No pending emails", processed: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let processed = 0;
    let failed = 0;

    for (const item of queueItems) {
      try {
        // Get user email
        const { data: userData } = await supabase.auth.admin.getUserById(item.user_id);
        const userEmail = userData?.user?.email;

        if (!userEmail) {
          await supabase
            .from("notification_queue")
            .update({ status: "failed", error_message: "User email not found", last_attempt_at: new Date().toISOString() })
            .eq("id", item.id);
          failed++;
          continue;
        }

        const payload = item.payload as Record<string, any>;

        const emailResult = await resend.emails.send({
          from: "Altohaa <noreply@altohaa.com>",
          to: [userEmail],
          subject: payload.subject || payload.title || "Notification from Altohaa",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="text-align: center; margin-bottom: 20px;">
                <h2 style="color: #8B4513; margin: 0;">Altohaa</h2>
              </div>
              <div style="background: #fff; border-radius: 8px; padding: 24px; border: 1px solid #eee;">
                <h3 style="margin-top: 0; color: #333;">${payload.title || ""}</h3>
                <p style="color: #666; line-height: 1.6;">${payload.body || ""}</p>
                ${payload.link ? `<p style="margin-top: 20px;"><a href="${payload.link}" style="background: #8B4513; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none;">View Details</a></p>` : ""}
              </div>
              <p style="text-align: center; color: #999; font-size: 12px; margin-top: 20px;">
                &copy; ${new Date().getFullYear()} Altohaa. All rights reserved.
              </p>
            </div>
          `,
        });

        await supabase
          .from("notification_queue")
          .update({ status: "sent", last_attempt_at: new Date().toISOString() })
          .eq("id", item.id);

        processed++;
      } catch (emailError) {
        console.error(`Failed to send email for queue item ${item.id}:`, emailError);
        await supabase
          .from("notification_queue")
          .update({
            status: "failed",
            error_message: emailError instanceof Error ? emailError.message : "Unknown error",
            attempts: (item.attempts || 0) + 1,
            last_attempt_at: new Date().toISOString(),
          })
          .eq("id", item.id);
        failed++;
      }
    }

    console.log(`Email queue processed: ${processed} sent, ${failed} failed`);

    return new Response(
      JSON.stringify({ processed, failed, total: queueItems.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Process email queue error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
