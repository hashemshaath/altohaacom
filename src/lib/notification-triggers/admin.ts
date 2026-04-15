import { sendNotification, notifyAllAdmins } from "./shared";

export async function notifyAdminEntityReview(params: { entityName: string; entityNameAr?: string; submittedBy: string }) {
  return notifyAllAdmins({
    title: `Entity Review Required: ${params.entityName}`,
    titleAr: `مراجعة جهة مطلوبة: ${params.entityNameAr || params.entityName}`,
    body: `A new entity "${params.entityName}" has been submitted and requires admin review.`,
    bodyAr: `تم إرسال جهة جديدة "${params.entityNameAr || params.entityName}" وتحتاج لمراجعة الإدارة.`,
    type: "info", link: "/admin/establishments", channels: ["in_app", "email"],
  });
}

export async function notifyEntityStatusChanged(params: {
  entityId: string; entityName: string; entityNameAr?: string; newStatus: string; createdBy?: string | null;
}) {
  const statusLabels: Record<string, { en: string; ar: string }> = {
    active: { en: "approved and activated", ar: "تمت الموافقة والتفعيل" },
    pending: { en: "set to pending review", ar: "في انتظار المراجعة" },
    suspended: { en: "suspended", ar: "تم تعليقها" },
    inactive: { en: "deactivated", ar: "تم إلغاء تفعيلها" },
  };
  const label = statusLabels[params.newStatus] || { en: params.newStatus, ar: params.newStatus };

  await notifyAllAdmins({
    title: `Entity ${label.en}: ${params.entityName}`,
    titleAr: `الجهة ${label.ar}: ${params.entityNameAr || params.entityName}`,
    body: `The entity "${params.entityName}" has been ${label.en}.`,
    bodyAr: `الجهة "${params.entityNameAr || params.entityName}" ${label.ar}.`,
    type: params.newStatus === "active" ? "success" : params.newStatus === "suspended" ? "warning" : "info",
    link: "/admin/establishments", channels: ["in_app"],
  });

  if (params.createdBy) {
    await sendNotification({
      userId: params.createdBy,
      title: `Your entity "${params.entityName}" has been ${label.en}`,
      titleAr: `جهتك "${params.entityNameAr || params.entityName}" ${label.ar}`,
      body: `The entity you submitted has been ${label.en} by the administration.`,
      bodyAr: `الجهة التي قدمتها ${label.ar} من قبل الإدارة.`,
      type: params.newStatus === "active" ? "success" : params.newStatus === "suspended" ? "warning" : "info",
      link: "/admin/establishments", channels: ["in_app"],
    });
  }
}

export async function notifyAdminExhibitionReview(params: { exhibitionName: string; exhibitionNameAr?: string; submittedBy: string }) {
  return notifyAllAdmins({
    title: `Exhibition Review Required: ${params.exhibitionName}`,
    titleAr: `مراجعة معرض مطلوبة: ${params.exhibitionNameAr || params.exhibitionName}`,
    body: `A new exhibition "${params.exhibitionName}" has been submitted via ${params.submittedBy} and requires admin review.`,
    bodyAr: `تم إرسال معرض جديد "${params.exhibitionNameAr || params.exhibitionName}" عبر ${params.submittedBy} ويحتاج لمراجعة الإدارة.`,
    type: "info", link: "/admin/exhibitions", channels: ["in_app", "email"],
  });
}

export async function notifyAdminCompetitionReview(params: { competitionName: string; competitionNameAr?: string; submittedBy: string }) {
  return notifyAllAdmins({
    title: `Competition Review Required: ${params.competitionName}`,
    titleAr: `مراجعة مسابقة مطلوبة: ${params.competitionNameAr || params.competitionName}`,
    body: `A new competition "${params.competitionName}" has been submitted via ${params.submittedBy} and requires admin review.`,
    bodyAr: `تم إرسال مسابقة جديدة "${params.competitionNameAr || params.competitionName}" عبر ${params.submittedBy} وتحتاج لمراجعة الإدارة.`,
    type: "info", link: "/admin/competitions", channels: ["in_app", "email"],
  });
}

export async function notifyAdminAwardRequest(params: { userName: string; awardName: string; awardNameAr?: string; documentUrl?: string }) {
  return notifyAllAdmins({
    title: `Award Request: ${params.awardName} by ${params.userName}`,
    titleAr: `طلب جائزة: ${params.awardNameAr || params.awardName} من ${params.userName}`,
    body: `${params.userName} has requested "${params.awardName}" approval. ${params.documentUrl ? "Supporting document attached." : "Review required."}`,
    bodyAr: `${params.userName} طلب الموافقة على "${params.awardNameAr || params.awardName}". ${params.documentUrl ? "المستند المرفق متاح." : "مطلوب مراجعة."}`,
    type: "warning", link: "/admin/users", channels: ["in_app", "email"],
  });
}

export async function notifyAdminVerificationRequest(params: { userName: string; verificationType: string; userId: string }) {
  return notifyAllAdmins({
    title: `Verification Request: ${params.userName}`, titleAr: `طلب توثيق: ${params.userName}`,
    body: `${params.userName} submitted a ${params.verificationType} verification request. Please review.`,
    bodyAr: `قدّم ${params.userName} طلب توثيق من نوع ${params.verificationType}. يرجى المراجعة.`,
    type: "info", link: "/admin/verification", channels: ["in_app", "email"],
  });
}

export async function notifyAdminUnregisteredEntity(params: { userName: string; entityName: string }) {
  return notifyAllAdmins({
    title: `Unregistered Entity Referenced: ${params.entityName}`, titleAr: `جهة غير مسجلة: ${params.entityName}`,
    body: `${params.userName} referenced "${params.entityName}" in their career record, but this entity is not yet registered in the system.`,
    bodyAr: `أشار ${params.userName} إلى "${params.entityName}" في سجله المهني، لكن هذه الجهة غير مسجلة بعد في النظام.`,
    type: "info", link: "/admin/establishments", channels: ["in_app"],
  });
}

export async function notifyAdminCompanyRegistration(params: { companyName: string; companyNameAr?: string; submittedBy: string }) {
  return notifyAllAdmins({
    title: `Company Registration: ${params.companyName}`,
    titleAr: `تسجيل شركة: ${params.companyNameAr || params.companyName}`,
    body: `A new company "${params.companyName}" registration has been submitted by ${params.submittedBy} and requires approval.`,
    bodyAr: `تم تقديم تسجيل شركة جديدة "${params.companyNameAr || params.companyName}" من ${params.submittedBy} ويحتاج للموافقة.`,
    type: "info", link: "/admin/companies", channels: ["in_app", "email"],
  });
}

export async function notifyAdminContentReport(params: { reportedBy: string; contentType: string; reason: string }) {
  return notifyAllAdmins({
    title: `Content Report: ${params.contentType}`, titleAr: `بلاغ محتوى: ${params.contentType}`,
    body: `${params.reportedBy} reported ${params.contentType} content. Reason: ${params.reason}`,
    bodyAr: `أبلغ ${params.reportedBy} عن محتوى ${params.contentType}. السبب: ${params.reason}`,
    type: "warning", link: "/admin/moderation", channels: ["in_app"],
  });
}

export async function notifyAdminSupportTicket(params: { ticketNumber: string; subject: string; priority: string; userName: string }) {
  return notifyAllAdmins({
    title: `Support Ticket ${params.ticketNumber}: ${params.subject}`,
    titleAr: `تذكرة دعم ${params.ticketNumber}: ${params.subject}`,
    body: `New ${params.priority} priority support ticket from ${params.userName}. Subject: ${params.subject}`,
    bodyAr: `تذكرة دعم جديدة بأولوية ${params.priority} من ${params.userName}. الموضوع: ${params.subject}`,
    type: params.priority === "urgent" || params.priority === "high" ? "warning" : "info",
    link: "/admin/support-tickets", channels: ["in_app", "email"],
  });
}

export async function notifyAdminMembershipCancellation(params: { userName: string; tier: string; reason?: string; userId?: string; [key: string]: unknown }) {
  return notifyAllAdmins({
    title: `Membership Cancellation: ${params.userName}`, titleAr: `إلغاء عضوية: ${params.userName}`,
    body: `${params.userName} has requested cancellation of their ${params.tier} membership.${params.reason ? ` Reason: ${params.reason}` : ""}`,
    bodyAr: `طلب ${params.userName} إلغاء عضويته ${params.tier}.${params.reason ? ` السبب: ${params.reason}` : ""}`,
    type: "warning", link: "/admin/membership", channels: ["in_app", "email"],
  });
}
