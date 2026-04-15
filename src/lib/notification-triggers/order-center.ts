import { sendNotification, supabase, notifyAllAdmins } from "./shared";

export async function notifyItemRequestSubmitted(params: {
  competitionId: string; competitionTitle: string; competitionTitleAr?: string; requesterName: string; itemName: string;
}) {
  return notifyAllAdmins({
    title: `New Item Request: ${params.itemName}`, titleAr: `طلب عنصر جديد: ${params.itemName}`,
    body: `${params.requesterName} requested "${params.itemName}" for "${params.competitionTitle}".`,
    bodyAr: `طلب ${params.requesterName} "${params.itemName}" لـ "${params.competitionTitleAr || params.competitionTitle}".`,
    type: "info", link: `/admin/order-center`, channels: ["in_app"],
  });
}

export async function notifyItemRequestReviewed(params: {
  userId: string; itemName: string; status: "approved" | "rejected"; reason?: string; competitionTitle: string; competitionTitleAr?: string;
}) {
  const isApproved = params.status === "approved";
  return sendNotification({
    userId: params.userId,
    title: isApproved ? `Request Approved: ${params.itemName}` : `Request Declined: ${params.itemName}`,
    titleAr: isApproved ? `تمت الموافقة على الطلب: ${params.itemName}` : `تم رفض الطلب: ${params.itemName}`,
    body: isApproved
      ? `Your request for "${params.itemName}" in "${params.competitionTitle}" has been approved.`
      : `Your request for "${params.itemName}" was declined${params.reason ? `: ${params.reason}` : ""}.`,
    bodyAr: isApproved
      ? `تمت الموافقة على طلبك "${params.itemName}" في "${params.competitionTitleAr || params.competitionTitle}".`
      : `تم رفض طلبك "${params.itemName}"${params.reason ? `: ${params.reason}` : ""}.`,
    type: isApproved ? "success" : "warning", channels: ["in_app"],
  });
}

export async function notifyItemRequestFulfilled(params: {
  userId: string; itemName: string; competitionTitle: string; competitionTitleAr?: string;
}) {
  return sendNotification({
    userId: params.userId,
    title: `Item Delivered: ${params.itemName}`, titleAr: `تم تسليم العنصر: ${params.itemName}`,
    body: `Your requested item "${params.itemName}" for "${params.competitionTitle}" has been delivered.`,
    bodyAr: `تم تسليم العنصر المطلوب "${params.itemName}" لـ "${params.competitionTitleAr || params.competitionTitle}".`,
    type: "success", channels: ["in_app"],
  });
}

export async function notifyQuoteRequestSent(params: {
  userId: string; companyName: string; requestTitle: string; competitionId: string; itemCount: number;
}) {
  return sendNotification({
    userId: params.userId,
    title: `Quote Request Sent: ${params.requestTitle}`, titleAr: `تم إرسال طلب أسعار: ${params.requestTitle}`,
    body: `Quote request with ${params.itemCount} items sent to "${params.companyName}".`,
    bodyAr: `تم إرسال طلب أسعار يحتوي على ${params.itemCount} عنصر إلى "${params.companyName}".`,
    type: "success", link: `/competitions/${params.competitionId}`, channels: ["in_app"],
  });
}

export async function notifySuggestionSubmitted(params: { competitionId: string; itemName: string; suggestedByName: string }) {
  const { data: roles } = await supabase
    .from("competition_roles").select("user_id")
    .eq("competition_id", params.competitionId).in("role", ["organizer", "coordinator"]).eq("status", "active");

  if (roles?.length) {
    await Promise.allSettled(roles.map((r) => sendNotification({
      userId: r.user_id, title: `New Item Suggestion: ${params.itemName}`, titleAr: `اقتراح عنصر جديد: ${params.itemName}`,
      body: `${params.suggestedByName} suggested "${params.itemName}" for the competition requirements.`,
      bodyAr: `${params.suggestedByName} اقترح "${params.itemName}" لمتطلبات المسابقة.`,
      type: "info", link: `/competitions/${params.competitionId}`, channels: ["in_app"],
    })));
  }
}

export async function notifySuggestionReviewed(params: { userId: string; itemName: string; status: string; competitionId: string }) {
  return sendNotification({
    userId: params.userId,
    title: `Suggestion ${params.status}: ${params.itemName}`,
    titleAr: `تم ${params.status === "approved" ? "قبول" : "رفض"} الاقتراح: ${params.itemName}`,
    body: `Your suggestion "${params.itemName}" has been ${params.status}.`,
    bodyAr: `تم ${params.status === "approved" ? "قبول" : "رفض"} اقتراحك "${params.itemName}".`,
    type: params.status === "approved" ? "success" : "warning",
    link: `/competitions/${params.competitionId}`, channels: ["in_app"],
  });
}

export async function notifyItemDelivered(params: { competitionId: string; itemName: string; deliveredCount: number; totalCount: number }) {
  const { data: roles } = await supabase
    .from("competition_roles").select("user_id")
    .eq("competition_id", params.competitionId).in("role", ["organizer", "coordinator"]).eq("status", "active");

  if (roles?.length) {
    await Promise.allSettled(roles.map((r) => sendNotification({
      userId: r.user_id, title: `Item Delivered: ${params.itemName}`, titleAr: `تم تسليم: ${params.itemName}`,
      body: `${params.deliveredCount}/${params.totalCount} items delivered for the competition.`,
      bodyAr: `${params.deliveredCount}/${params.totalCount} عناصر تم تسليمها للمسابقة.`,
      type: "success", channels: ["in_app"],
    })));
  }
}

export async function notifyDeadlineApproaching(params: { userId: string; competitionId: string; itemName: string; deadline: string }) {
  return sendNotification({
    userId: params.userId,
    title: `Deadline Approaching: ${params.itemName}`, titleAr: `اقتراب الموعد النهائي: ${params.itemName}`,
    body: `The delivery deadline for "${params.itemName}" is ${params.deadline}. Please ensure timely delivery.`,
    bodyAr: `الموعد النهائي لتسليم "${params.itemName}" هو ${params.deadline}. يرجى ضمان التسليم في الوقت المناسب.`,
    type: "warning", link: `/competitions/${params.competitionId}`, channels: ["in_app"],
  });
}
