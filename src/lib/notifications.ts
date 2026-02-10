import { supabase } from "@/integrations/supabase/client";

interface SendNotificationParams {
  userId: string;
  title?: string;
  titleAr?: string;
  body?: string;
  bodyAr?: string;
  type?: "info" | "success" | "warning" | "error";
  link?: string;
  channels?: string[];
  templateSlug?: string;
  variables?: Record<string, string>;
  phone?: string;
}

export async function sendNotification(params: SendNotificationParams) {
  try {
    const { data, error } = await supabase.functions.invoke("send-notification", {
      body: {
        userId: params.userId,
        title: params.title,
        titleAr: params.titleAr,
        body: params.body,
        bodyAr: params.bodyAr,
        type: params.type || "info",
        link: params.link,
        channels: params.channels || ["in_app"],
        templateSlug: params.templateSlug,
        variables: params.variables,
        phone: params.phone,
      },
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Failed to send notification:", error);
  }
}

export async function sendBulkNotifications(params: {
  userIds: string[];
  title: string;
  titleAr?: string;
  body: string;
  bodyAr?: string;
  type?: "info" | "success" | "warning" | "error";
  link?: string;
  channels?: string[];
}) {
  const results = await Promise.allSettled(
    params.userIds.map((userId) =>
      sendNotification({
        ...params,
        userId,
      })
    )
  );
  
  const succeeded = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.filter((r) => r.status === "rejected").length;
  
  return { succeeded, failed, total: params.userIds.length };
}
