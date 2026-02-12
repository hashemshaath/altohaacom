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
  phone?: string;
  category?: string;
}

// Fetch user's preferred language from profile
async function getUserLanguage(supabase: any, userId: string): Promise<"ar" | "en"> {
  try {
    const { data } = await supabase
      .from("profiles")
      .select("preferred_language")
      .eq("user_id", userId)
      .single();
    return data?.preferred_language === "en" ? "en" : "ar"; // Default to Arabic
  } catch {
    return "ar"; // Default to Arabic
  }
}

// Fetch user's display name
async function getUserName(supabase: any, userId: string, lang: "ar" | "en"): Promise<string> {
  try {
    const { data } = await supabase
      .from("profiles")
      .select("full_name, full_name_ar, display_name, display_name_ar, username")
      .eq("user_id", userId)
      .single();
    if (!data) return "";
    if (lang === "ar") {
      return data.display_name_ar || data.full_name_ar || data.display_name || data.full_name || data.username || "";
    }
    return data.display_name || data.full_name || data.username || "";
  } catch {
    return "";
  }
}

function replaceVariables(text: string | null | undefined, variables: Record<string, string>): string {
  if (!text) return "";
  let result = text;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`{{${key}}}`, "g"), value);
  }
  return result;
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
    const {
      userId, templateName, templateSlug,
      title, titleAr, body, bodyAr,
      type = "info", link, channels = ["in_app"],
      variables = {}, phone, category,
    } = payload;

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "userId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Auto-detect user language
    const userLang = await getUserLanguage(supabase, userId);

    // Auto-inject user_name if not provided
    if (!variables.user_name) {
      const userName = await getUserName(supabase, userId, userLang);
      if (userName) variables.user_name = userName;
    }

    let finalTitle = title;
    let finalTitleAr = titleAr;
    let finalBody = body;
    let finalBodyAr = bodyAr;
    let finalChannels = channels;
    let emailSubject = title;
    let emailSubjectAr = titleAr;
    let finalCategory = category;

    // Template-based notifications (slug)
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
        finalCategory = finalCategory || template.category;

        // Replace variables in all fields
        finalTitle = replaceVariables(finalTitle, variables);
        finalTitleAr = replaceVariables(finalTitleAr, variables);
        finalBody = replaceVariables(finalBody, variables);
        finalBodyAr = replaceVariables(finalBodyAr, variables);
        emailSubject = replaceVariables(emailSubject, variables);
        emailSubjectAr = replaceVariables(emailSubjectAr, variables);
      }
    }

    // Legacy template support
    if (templateName && !templateSlug) {
      const { data: template, error: templateError } = await supabase
        .from("notification_templates")
        .select("*")
        .eq("name", templateName)
        .single();

      if (!templateError && template) {
        finalTitle = replaceVariables(template.title, variables);
        finalTitleAr = replaceVariables(template.title_ar, variables);
        finalBody = replaceVariables(template.body, variables);
        finalBodyAr = replaceVariables(template.body_ar, variables);
        finalChannels = template.channels || channels;
      }
    }

    // Select content based on user's preferred language
    // Always store both languages, but the "primary" display uses the user's language
    const displayTitle = userLang === "ar" ? (finalTitleAr || finalTitle) : (finalTitle || finalTitleAr);
    const displayBody = userLang === "ar" ? (finalBodyAr || finalBody) : (finalBody || finalBodyAr);

    if (!displayTitle || !displayBody) {
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
      (preferences || []).filter((p: any) => p.enabled).map((p: any) => p.channel)
    );

    const channelsToUse = preferences?.length
      ? finalChannels.filter((c: string) => enabledChannels.has(c))
      : finalChannels;

    const results: Record<string, any> = {};

    for (const channel of channelsToUse) {
      switch (channel) {
        case "in_app": {
          const { data: notification, error: notifError } = await supabase
            .from("notifications")
            .insert({
              user_id: userId,
              title: finalTitle || displayTitle,
              title_ar: finalTitleAr || displayTitle,
              body: finalBody || displayBody,
              body_ar: finalBodyAr || displayBody,
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
          const displaySubject = userLang === "ar"
            ? (emailSubjectAr || emailSubject || displayTitle)
            : (emailSubject || emailSubjectAr || displayTitle);

          const { data: queueItem, error: queueError } = await supabase
            .from("notification_queue")
            .insert({
              user_id: userId,
              channel,
              payload: {
                title: displayTitle,
                title_ar: finalTitleAr,
                subject: displaySubject,
                subject_ar: emailSubjectAr || displaySubject,
                body: displayBody,
                body_ar: finalBodyAr,
                type,
                link,
                variables,
                user_language: userLang,
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
          const { data: queueItem, error: queueError } = await supabase
            .from("notification_queue")
            .insert({
              user_id: userId,
              channel,
              payload: {
                title: displayTitle,
                title_ar: finalTitleAr,
                body: displayBody,
                body_ar: finalBodyAr,
                phone: phone || null,
                type,
                link,
                variables,
                user_language: userLang,
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

    console.log("Notification sent:", { userId, userLang, channels: channelsToUse, results });

    return new Response(
      JSON.stringify({ success: true, userLanguage: userLang, results }),
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
