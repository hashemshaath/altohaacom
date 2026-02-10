import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface NotificationPayload {
  userId: string;
  templateName?: string;
  templateSlug?: string;
  title?: string;
  titleAr?: string;
  body?: string;
  bodyAr?: string;
  type?: string;
  link?: string;
  channels?: string[];
  variables?: Record<string, string>;
  // For WhatsApp/SMS
  phone?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const payload: NotificationPayload = await req.json();
    const { userId, templateName, templateSlug, title, titleAr, body, bodyAr, type = "info", link, channels = ["in_app"], variables = {}, phone } = payload;

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "userId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let finalTitle = title;
    let finalTitleAr = titleAr;
    let finalBody = body;
    let finalBodyAr = bodyAr;
    let finalChannels = channels;
    let emailSubject = title;
    let emailSubjectAr = titleAr;

    // If using a communication template (slug-based), fetch from communication_templates
    if (templateSlug) {
      const { data: template, error: templateError } = await supabase
        .from("communication_templates")
        .select("*")
        .eq("slug", templateSlug)
        .eq("is_active", true)
        .single();

      if (!templateError && template) {
        emailSubject = template.subject || template.name;
        emailSubjectAr = template.subject_ar || template.name_ar;
        finalBody = template.body;
        finalBodyAr = template.body_ar;
        finalTitle = template.name;
        finalTitleAr = template.name_ar;

        // Replace variables
        for (const [key, value] of Object.entries(variables)) {
          const regex = new RegExp(`{{${key}}}`, "g");
          finalTitle = finalTitle?.replace(regex, value);
          finalTitleAr = finalTitleAr?.replace(regex, value);
          finalBody = finalBody?.replace(regex, value);
          finalBodyAr = finalBodyAr?.replace(regex, value);
          if (emailSubject) emailSubject = emailSubject.replace(regex, value);
          if (emailSubjectAr) emailSubjectAr = emailSubjectAr.replace(regex, value);
        }
      }
    }

    // Legacy: notification_templates support
    if (templateName && !templateSlug) {
      const { data: template, error: templateError } = await supabase
        .from("notification_templates")
        .select("*")
        .eq("name", templateName)
        .single();

      if (!templateError && template) {
        finalTitle = template.title;
        finalTitleAr = template.title_ar;
        finalBody = template.body;
        finalBodyAr = template.body_ar;
        finalChannels = template.channels || channels;

        for (const [key, value] of Object.entries(variables)) {
          const regex = new RegExp(`{{${key}}}`, "g");
          finalTitle = finalTitle?.replace(regex, value);
          finalTitleAr = finalTitleAr?.replace(regex, value);
          finalBody = finalBody?.replace(regex, value);
          finalBodyAr = finalBodyAr?.replace(regex, value);
        }
      }
    }

    if (!finalTitle || !finalBody) {
      return new Response(
        JSON.stringify({ error: "Title and body are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user notification preferences
    const { data: preferences } = await supabase
      .from("notification_preferences")
      .select("channel, enabled")
      .eq("user_id", userId);

    const enabledChannels = new Set(
      (preferences || []).filter(p => p.enabled).map(p => p.channel)
    );

    const channelsToUse = preferences?.length
      ? finalChannels.filter(c => enabledChannels.has(c))
      : finalChannels;

    const results: Record<string, any> = {};

    for (const channel of channelsToUse) {
      switch (channel) {
        case "in_app": {
          const { data: notification, error: notifError } = await supabase
            .from("notifications")
            .insert({
              user_id: userId,
              title: finalTitle,
              title_ar: finalTitleAr,
              body: finalBody,
              body_ar: finalBodyAr,
              type,
              link,
              channel: "in_app",
              status: "sent",
            })
            .select()
            .single();

          results.in_app = notifError
            ? { success: false, error: notifError.message }
            : { success: true, id: notification.id };
          break;
        }

        case "email":
        case "push": {
          const { data: queueItem, error: queueError } = await supabase
            .from("notification_queue")
            .insert({
              user_id: userId,
              channel,
              payload: {
                title: finalTitle,
                title_ar: finalTitleAr,
                subject: emailSubject || finalTitle,
                subject_ar: emailSubjectAr || finalTitleAr,
                body: finalBody,
                body_ar: finalBodyAr,
                type,
                link,
                variables,
              },
              status: "pending",
            })
            .select()
            .single();

          results[channel] = queueError
            ? { success: false, error: queueError.message }
            : { success: true, queued: true, id: queueItem.id };
          break;
        }

        case "sms":
        case "whatsapp": {
          // Queue SMS/WhatsApp — will be processed when provider keys are configured
          const { data: queueItem, error: queueError } = await supabase
            .from("notification_queue")
            .insert({
              user_id: userId,
              channel,
              payload: {
                title: finalTitle,
                title_ar: finalTitleAr,
                body: finalBody,
                body_ar: finalBodyAr,
                phone: phone || null,
                type,
                link,
                variables,
              },
              status: "pending",
            })
            .select()
            .single();

          results[channel] = queueError
            ? { success: false, error: queueError.message }
            : { success: true, queued: true, id: queueItem.id };
          break;
        }
      }
    }

    // Trigger email processor if emails were queued
    if (results.email?.queued) {
      try {
        const emailProcessUrl = `${supabaseUrl}/functions/v1/process-email-queue`;
        fetch(emailProcessUrl, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${supabaseKey}`,
            "Content-Type": "application/json",
          },
        }).catch((e) => console.error("Failed to trigger email processor:", e));
      } catch (e) {
        console.error("Failed to trigger email processor:", e);
      }
    }

    console.log("Notification sent:", { userId, channels: channelsToUse, results });

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Send notification error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
