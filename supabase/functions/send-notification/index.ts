import { handleCors } from "../_shared/cors.ts";
import { getServiceClient } from "../_shared/auth.ts";
import { jsonResponse, errorResponse } from "../_shared/response.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

async function getUserLanguage(supabase: any, userId: string): Promise<"ar" | "en"> {
  try {
    const { data } = await supabase.from("profiles").select("preferred_language").eq("user_id", userId).single();
    return data?.preferred_language === "en" ? "en" : "ar";
  } catch { return "ar"; }
}

async function getUserName(supabase: any, userId: string, lang: "ar" | "en"): Promise<string> {
  try {
    const { data } = await supabase.from("profiles").select("full_name, full_name_ar, display_name, display_name_ar, username").eq("user_id", userId).single();
    if (!data) return "";
    return lang === "ar" ? (data.display_name_ar || data.full_name_ar || data.display_name || data.full_name || data.username || "") : (data.display_name || data.full_name || data.username || "");
  } catch { return ""; }
}

function replaceVariables(text: string | null | undefined, variables: Record<string, string>): string {
  if (!text) return "";
  let result = text;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`{{${key}}}`, "g"), value);
  }
  return result;
}

Deno.serve(async (req) => {
  const corsRes = handleCors(req);
  if (corsRes) return corsRes;

  try {
    // Accept service role key or authenticated JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return jsonResponse({ error: "Unauthorized" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const token = authHeader.replace("Bearer ", "");

    if (token !== supabaseKey) {
      const authClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
      const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(token);
      if (claimsError || !claimsData?.claims) return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const supabase = getServiceClient();
    const payload: NotificationPayload = await req.json();
    const { userId, templateName, templateSlug, title, titleAr, body, bodyAr, type = "info", link, channels = ["in_app"], variables = {}, phone, category } = payload;

    if (!userId) return jsonResponse({ error: "userId is required" }, 400);

    const userLang = await getUserLanguage(supabase, userId);
    if (!variables.user_name) {
      const userName = await getUserName(supabase, userId, userLang);
      if (userName) variables.user_name = userName;
    }

    let finalTitle = title, finalTitleAr = titleAr, finalBody = body, finalBodyAr = bodyAr;
    let finalChannels = channels;
    let emailSubject = title, emailSubjectAr = titleAr;

    if (templateSlug) {
      const { data: template } = await supabase.from("communication_templates").select("*").eq("slug", templateSlug).eq("is_active", true).single();
      if (template) {
        emailSubject = template.subject || template.name; emailSubjectAr = template.subject_ar || template.name_ar;
        finalBody = template.body; finalBodyAr = template.body_ar;
        finalTitle = template.name; finalTitleAr = template.name_ar;
        [finalTitle, finalTitleAr, finalBody, finalBodyAr, emailSubject, emailSubjectAr].forEach((_, i, arr) => { arr[i] = replaceVariables(arr[i], variables); });
      }
    } else if (templateName) {
      const { data: template } = await supabase.from("notification_templates").select("*").eq("name", templateName).single();
      if (template) {
        finalTitle = replaceVariables(template.title, variables); finalTitleAr = replaceVariables(template.title_ar, variables);
        finalBody = replaceVariables(template.body, variables); finalBodyAr = replaceVariables(template.body_ar, variables);
        finalChannels = template.channels || channels;
      }
    }

    const displayTitle = userLang === "ar" ? (finalTitleAr || finalTitle) : (finalTitle || finalTitleAr);
    const displayBody = userLang === "ar" ? (finalBodyAr || finalBody) : (finalBody || finalBodyAr);

    if (!displayTitle || !displayBody) return jsonResponse({ error: "Title and body are required" }, 400);

    const { data: preferences } = await supabase.from("notification_preferences").select("channel, enabled").eq("user_id", userId);
    const enabledChannels = new Set((preferences || []).filter((p: any) => p.enabled).map((p: any) => p.channel));
    const channelsToUse = preferences?.length ? finalChannels.filter(c => enabledChannels.has(c)) : finalChannels;

    const results: Record<string, any> = {};

    for (const channel of channelsToUse) {
      if (channel === "in_app") {
        const { data: notification, error } = await supabase.from("notifications").insert({
          user_id: userId, title: finalTitle || displayTitle, title_ar: finalTitleAr || displayTitle,
          body: finalBody || displayBody, body_ar: finalBodyAr || displayBody,
          type, link, channel: "in_app", status: "sent",
        }).select().single();
        results.in_app = error ? { success: false, error: error.message } : { success: true, id: notification.id };
      } else {
        const queuePayload: any = { title: displayTitle, title_ar: finalTitleAr, body: displayBody, body_ar: finalBodyAr, type, link, variables, user_language: userLang };
        if (channel === "email") { queuePayload.subject = userLang === "ar" ? (emailSubjectAr || emailSubject || displayTitle) : (emailSubject || emailSubjectAr || displayTitle); }
        if ((channel === "sms" || channel === "whatsapp") && phone) queuePayload.phone = phone;

        const { data: queueItem, error } = await supabase.from("notification_queue").insert({ user_id: userId, channel, payload: queuePayload, status: "pending" }).select().single();
        results[channel] = error ? { success: false, error: error.message } : { success: true, queued: true, id: queueItem.id };
      }
    }

    // Fire-and-forget triggers for async processors
    const supabaseUrl2 = Deno.env.get("SUPABASE_URL")!;
    if (results.email?.queued) { fetch(`${supabaseUrl2}/functions/v1/process-email-queue`, { method: "POST", headers: { Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" } }).catch(() => {}); }
    if (results.push?.queued) { fetch(`${supabaseUrl2}/functions/v1/process-push-queue`, { method: "POST", headers: { Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" } }).catch(() => {}); }

    console.log("Notification sent:", { userId, userLang, channels: channelsToUse });
    return jsonResponse({ success: true, userLanguage: userLang, results });
  } catch (error) {
    console.error("Send notification error:", error);
    return errorResponse(error);
  }
});
