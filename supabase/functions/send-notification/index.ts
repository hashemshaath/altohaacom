import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface NotificationPayload {
  userId: string;
  templateName?: string;
  title?: string;
  titleAr?: string;
  body?: string;
  bodyAr?: string;
  type?: string;
  link?: string;
  channels?: string[];
  variables?: Record<string, string>;
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
    const { userId, templateName, title, titleAr, body, bodyAr, type = "info", link, channels = ["in_app"], variables = {} } = payload;

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

    // If using a template, fetch and process it
    if (templateName) {
      const { data: template, error: templateError } = await supabase
        .from("notification_templates")
        .select("*")
        .eq("name", templateName)
        .single();

      if (templateError || !template) {
        console.error("Template not found:", templateName);
        return new Response(
          JSON.stringify({ error: "Template not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      finalTitle = template.title;
      finalTitleAr = template.title_ar;
      finalBody = template.body;
      finalBodyAr = template.body_ar;
      finalChannels = template.channels || channels;

      // Replace variables in template
      for (const [key, value] of Object.entries(variables)) {
        const regex = new RegExp(`{{${key}}}`, "g");
        finalTitle = finalTitle?.replace(regex, value);
        finalTitleAr = finalTitleAr?.replace(regex, value);
        finalBody = finalBody?.replace(regex, value);
        finalBodyAr = finalBodyAr?.replace(regex, value);
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
      (preferences || [])
        .filter(p => p.enabled)
        .map(p => p.channel)
    );

    // Default all channels to enabled if no preferences set
    const channelsToUse = preferences?.length 
      ? finalChannels.filter(c => enabledChannels.has(c))
      : finalChannels;

    const results: Record<string, any> = {};

    // Process each channel
    for (const channel of channelsToUse) {
      switch (channel) {
        case "in_app":
          // Create in-app notification
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

          if (notifError) {
            console.error("Error creating in-app notification:", notifError);
            results.in_app = { success: false, error: notifError.message };
          } else {
            results.in_app = { success: true, id: notification.id };
          }
          break;

        case "email":
        case "sms":
        case "whatsapp":
        case "push":
          // Queue for external delivery (will be processed by separate workers when integrations are ready)
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
                type,
                link,
                variables,
              },
              status: "pending",
            })
            .select()
            .single();

          if (queueError) {
            console.error(`Error queuing ${channel} notification:`, queueError);
            results[channel] = { success: false, error: queueError.message };
          } else {
            results[channel] = { success: true, queued: true, id: queueItem.id };
          }
          break;
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
