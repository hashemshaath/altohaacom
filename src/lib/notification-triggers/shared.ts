import { sendNotification, type SendNotificationParams } from "@/lib/notifications";
import { supabase } from "@/integrations/supabase/client";

export { sendNotification, supabase };
export type { SendNotificationParams };

export async function getAdminUserIds(): Promise<string[]> {
  const { data } = await supabase
    .from("user_roles")
    .select("user_id")
    .eq("role", "supervisor");
  return [...new Set((data || []).map((r) => r.user_id as string))];
}

export async function notifyAllAdmins(notification: Omit<SendNotificationParams, "userId">) {
  const adminIds = await getAdminUserIds();
  await Promise.allSettled(
    adminIds.map((userId) => sendNotification({ ...notification, userId }))
  );
}
