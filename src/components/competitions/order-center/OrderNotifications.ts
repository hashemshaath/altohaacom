import { sendNotification } from "@/lib/notifications";
import { supabase } from "@/integrations/supabase/client";

/**
 * Order Center notification triggers.
 * Called from mutation onSuccess handlers in Order Center panels.
 */

async function getCompetitionOrganizerIds(competitionId: string): Promise<string[]> {
  // Get organizer from competition roles
  const { data } = await supabase
    .from("competition_roles")
    .select("user_id")
    .eq("competition_id", competitionId)
    .in("role", ["organizer", "coordinator", "head_judge"])
    .eq("status", "active");
  return [...new Set((data || []).map((r: any) => r.user_id as string))];
}

export async function notifyVendorAssigned(params: {
  competitionId: string;
  assignedBy: string;
  vendorName: string;
  itemName: string;
}) {
  const orgIds = await getCompetitionOrganizerIds(params.competitionId);
  const recipients = orgIds.filter((id) => id !== params.assignedBy);
  await Promise.allSettled(
    recipients.map((userId) =>
      sendNotification({
        userId,
        title: `Vendor Assigned: ${params.vendorName}`,
        titleAr: `تم تعيين مورد: ${params.vendorName}`,
        body: `"${params.vendorName}" has been assigned to "${params.itemName}".`,
        bodyAr: `تم تعيين "${params.vendorName}" لـ "${params.itemName}".`,
        type: "info",
        link: `/competitions/${params.competitionId}`,
        channels: ["in_app"],
      })
    )
  );
}

export async function notifyDeliveryConfirmed(params: {
  competitionId: string;
  confirmedBy: string;
  itemName: string;
  totalDelivered: number;
  totalItems: number;
}) {
  const orgIds = await getCompetitionOrganizerIds(params.competitionId);
  const recipients = orgIds.filter((id) => id !== params.confirmedBy);
  const progress = params.totalItems > 0 ? Math.round((params.totalDelivered / params.totalItems) * 100) : 0;
  await Promise.allSettled(
    recipients.map((userId) =>
      sendNotification({
        userId,
        title: `Delivery Confirmed (${progress}%)`,
        titleAr: `تم تأكيد التسليم (${progress}%)`,
        body: `"${params.itemName}" has been delivered. ${params.totalDelivered}/${params.totalItems} items complete.`,
        bodyAr: `تم تسليم "${params.itemName}". ${params.totalDelivered}/${params.totalItems} عنصر مكتمل.`,
        type: "success",
        link: `/competitions/${params.competitionId}`,
        channels: ["in_app"],
      })
    )
  );
}

export async function notifyNewSuggestion(params: {
  competitionId: string;
  suggestedBy: string;
  itemName: string;
}) {
  const orgIds = await getCompetitionOrganizerIds(params.competitionId);
  const recipients = orgIds.filter((id) => id !== params.suggestedBy);
  await Promise.allSettled(
    recipients.map((userId) =>
      sendNotification({
        userId,
        title: `New Item Suggestion: ${params.itemName}`,
        titleAr: `اقتراح عنصر جديد: ${params.itemName}`,
        body: `A new item "${params.itemName}" has been suggested for this competition.`,
        bodyAr: `تم اقتراح عنصر جديد "${params.itemName}" لهذه المسابقة.`,
        type: "info",
        link: `/competitions/${params.competitionId}`,
        channels: ["in_app"],
      })
    )
  );
}

export async function notifyOverdueItems(params: {
  competitionId: string;
  overdueCount: number;
}) {
  const orgIds = await getCompetitionOrganizerIds(params.competitionId);
  await Promise.allSettled(
    orgIds.map((userId) =>
      sendNotification({
        userId,
        title: `${params.overdueCount} Overdue Items`,
        titleAr: `${params.overdueCount} عناصر متأخرة`,
        body: `${params.overdueCount} items have passed their deadline and are not yet delivered.`,
        bodyAr: `${params.overdueCount} عنصر تجاوز الموعد النهائي ولم يتم تسليمه بعد.`,
        type: "warning",
        link: `/competitions/${params.competitionId}`,
        channels: ["in_app"],
      })
    )
  );
}
