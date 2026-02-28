import { sendNotification, type SendNotificationParams } from "@/lib/notifications";
import { supabase } from "@/integrations/supabase/client";

/**
 * Auto-trigger notification helpers for key platform events.
 * Call these from mutation onSuccess handlers throughout the app.
 */

export async function notifyRegistrationApproved(params: {
  userId: string;
  competitionTitle: string;
  competitionTitleAr?: string;
  competitionId: string;
}) {
  return sendNotification({
    userId: params.userId,
    title: `Registration Approved: ${params.competitionTitle}`,
    titleAr: params.competitionTitleAr
      ? `تمت الموافقة على التسجيل: ${params.competitionTitleAr}`
      : undefined,
    body: `Your registration for "${params.competitionTitle}" has been approved. Good luck!`,
    bodyAr: params.competitionTitleAr
      ? `تمت الموافقة على تسجيلك في "${params.competitionTitleAr}". بالتوفيق!`
      : undefined,
    type: "success",
    link: `/competitions/${params.competitionId}`,
    channels: ["in_app", "email"],
  });
}

export async function notifyRegistrationRejected(params: {
  userId: string;
  competitionTitle: string;
  competitionTitleAr?: string;
  competitionId: string;
  reason?: string;
}) {
  return sendNotification({
    userId: params.userId,
    title: `Registration Declined: ${params.competitionTitle}`,
    titleAr: params.competitionTitleAr
      ? `تم رفض التسجيل: ${params.competitionTitleAr}`
      : undefined,
    body: params.reason
      ? `Your registration was declined: ${params.reason}`
      : `Your registration for "${params.competitionTitle}" was not approved.`,
    bodyAr: params.competitionTitleAr
      ? `تم رفض تسجيلك في "${params.competitionTitleAr}".`
      : undefined,
    type: "warning",
    link: `/competitions/${params.competitionId}`,
    channels: ["in_app", "email"],
  });
}

export async function notifySponsorshipRequestSent(params: {
  userId: string;
  requestTitle: string;
  competitionTitle: string;
}) {
  return sendNotification({
    userId: params.userId,
    title: `New Sponsorship Request: ${params.requestTitle}`,
    titleAr: `طلب رعاية جديد: ${params.requestTitle}`,
    body: `You have received a sponsorship request for "${params.competitionTitle}".`,
    bodyAr: `لقد تلقيت طلب رعاية لـ "${params.competitionTitle}".`,
    type: "info",
    link: `/competitions`,
    channels: ["in_app", "email"],
  });
}

export async function notifySponsorshipRequestStatusChanged(params: {
  userId: string;
  requestTitle: string;
  status: string;
}) {
  const statusLabel = params.status.replace(/_/g, " ");
  return sendNotification({
    userId: params.userId,
    title: `Sponsorship Request ${statusLabel}: ${params.requestTitle}`,
    titleAr: `تحديث طلب الرعاية: ${params.requestTitle}`,
    body: `Your sponsorship request "${params.requestTitle}" has been ${statusLabel}.`,
    bodyAr: `تم تحديث حالة طلب الرعاية "${params.requestTitle}" إلى ${statusLabel}.`,
    type: params.status === "accepted" || params.status === "fulfilled" ? "success" : params.status === "declined" ? "warning" : "info",
    channels: ["in_app"],
  });
}

export async function notifyListAssigned(params: {
  userId: string;
  listTitle: string;
  competitionTitle: string;
  role: string;
}) {
  return sendNotification({
    userId: params.userId,
    title: `You've been assigned: ${params.listTitle}`,
    titleAr: `تم تعيينك: ${params.listTitle}`,
    body: `You've been assigned as ${params.role} for the requirement list "${params.listTitle}" in "${params.competitionTitle}".`,
    bodyAr: `تم تعيينك كـ ${params.role} لقائمة المتطلبات "${params.listTitle}" في "${params.competitionTitle}".`,
    type: "info",
    channels: ["in_app"],
  });
}

export async function notifyListShared(params: {
  userId: string;
  listTitle: string;
  sharedByName: string;
}) {
  return sendNotification({
    userId: params.userId,
    title: `List shared with you: ${params.listTitle}`,
    titleAr: `تمت مشاركة قائمة معك: ${params.listTitle}`,
    body: `${params.sharedByName} shared the requirement list "${params.listTitle}" with you.`,
    bodyAr: `شارك ${params.sharedByName} قائمة المتطلبات "${params.listTitle}" معك.`,
    type: "info",
    channels: ["in_app"],
  });
}

export async function notifyScoreSubmitted(params: {
  userId: string;
  judgeName: string;
  competitionTitle: string;
  competitionId: string;
}) {
  return sendNotification({
    userId: params.userId,
    title: `New Score Submitted`,
    titleAr: `تم تقديم تقييم جديد`,
    body: `${params.judgeName} submitted scores for "${params.competitionTitle}".`,
    bodyAr: `قدم ${params.judgeName} تقييمات لـ "${params.competitionTitle}".`,
    type: "info",
    link: `/competitions/${params.competitionId}/results`,
    channels: ["in_app"],
  });
}

export async function notifyCompetitionStatusChanged(params: {
  userId: string;
  competitionTitle: string;
  competitionTitleAr?: string;
  competitionId: string;
  newStatus: string;
}) {
  return sendNotification({
    userId: params.userId,
    title: `Competition Update: ${params.competitionTitle}`,
    titleAr: params.competitionTitleAr
      ? `تحديث المسابقة: ${params.competitionTitleAr}`
      : undefined,
    body: `"${params.competitionTitle}" status changed to ${params.newStatus.replace(/_/g, " ")}.`,
    bodyAr: params.competitionTitleAr
      ? `تم تغيير حالة "${params.competitionTitleAr}" إلى ${params.newStatus}.`
      : undefined,
    type: "info",
    link: `/competitions/${params.competitionId}`,
    channels: ["in_app", "email"],
  });
}

export async function notifyReportResolved(params: {
  userId: string;
  status: string;
}) {
  return sendNotification({
    userId: params.userId,
    title: `Your report has been ${params.status}`,
    titleAr: `تم ${params.status === "resolved" ? "حل" : "رفض"} بلاغك`,
    body: `An admin has reviewed your content report and marked it as ${params.status}.`,
    bodyAr: `قام المسؤول بمراجعة بلاغك وتم وضعه كـ ${params.status}.`,
    type: params.status === "resolved" ? "success" : "info",
    channels: ["in_app"],
  });
}

// ── Invoice Notifications ──

export async function notifyInvoiceCreated(params: {
  userId: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
}) {
  return sendNotification({
    userId: params.userId,
    title: `New Invoice: ${params.invoiceNumber}`,
    titleAr: `فاتورة جديدة: ${params.invoiceNumber}`,
    body: `A new invoice for ${params.amount.toLocaleString()} ${params.currency} has been issued to you.`,
    bodyAr: `تم إصدار فاتورة جديدة بمبلغ ${params.amount.toLocaleString()} ${params.currency}.`,
    type: "info",
    channels: ["in_app", "email"],
  });
}

export async function notifyInvoiceSent(params: {
  userId: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
}) {
  return sendNotification({
    userId: params.userId,
    title: `Invoice Sent: ${params.invoiceNumber}`,
    titleAr: `تم إرسال الفاتورة: ${params.invoiceNumber}`,
    body: `Invoice ${params.invoiceNumber} for ${params.amount.toLocaleString()} ${params.currency} has been sent.`,
    bodyAr: `تم إرسال الفاتورة ${params.invoiceNumber} بمبلغ ${params.amount.toLocaleString()} ${params.currency}.`,
    type: "info",
    channels: ["in_app", "email"],
  });
}

export async function notifyInvoicePaid(params: {
  userId: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
}) {
  return sendNotification({
    userId: params.userId,
    title: `Payment Received: ${params.invoiceNumber}`,
    titleAr: `تم استلام الدفع: ${params.invoiceNumber}`,
    body: `Payment of ${params.amount.toLocaleString()} ${params.currency} for invoice ${params.invoiceNumber} has been confirmed.`,
    bodyAr: `تم تأكيد دفع ${params.amount.toLocaleString()} ${params.currency} للفاتورة ${params.invoiceNumber}.`,
    type: "success",
    channels: ["in_app", "email"],
  });
}

// ── Template-based notifications ──

export async function notifyFromTemplate(params: {
  userId: string;
  templateSlug: string;
  variables?: Record<string, string>;
  channels?: string[];
  link?: string;
  phone?: string;
}) {
  return sendNotification({
    userId: params.userId,
    templateSlug: params.templateSlug,
    variables: params.variables,
    channels: params.channels || ["in_app", "email"],
    link: params.link,
    phone: params.phone,
  });
}

// ── Company invitation notification ──

// ── Order Item Request Notifications ──

export async function notifyItemRequestSubmitted(params: {
  competitionId: string;
  competitionTitle: string;
  competitionTitleAr?: string;
  requesterName: string;
  itemName: string;
}) {
  return notifyAllAdmins({
    title: `New Item Request: ${params.itemName}`,
    titleAr: `طلب عنصر جديد: ${params.itemName}`,
    body: `${params.requesterName} requested "${params.itemName}" for "${params.competitionTitle}".`,
    bodyAr: `طلب ${params.requesterName} "${params.itemName}" لـ "${params.competitionTitleAr || params.competitionTitle}".`,
    type: "info",
    link: `/admin/order-center`,
    channels: ["in_app"],
  });
}

export async function notifyItemRequestReviewed(params: {
  userId: string;
  itemName: string;
  status: "approved" | "rejected";
  reason?: string;
  competitionTitle: string;
  competitionTitleAr?: string;
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
    type: isApproved ? "success" : "warning",
    channels: ["in_app"],
  });
}

export async function notifyItemRequestFulfilled(params: {
  userId: string;
  itemName: string;
  competitionTitle: string;
  competitionTitleAr?: string;
}) {
  return sendNotification({
    userId: params.userId,
    title: `Item Delivered: ${params.itemName}`,
    titleAr: `تم تسليم العنصر: ${params.itemName}`,
    body: `Your requested item "${params.itemName}" for "${params.competitionTitle}" has been delivered.`,
    bodyAr: `تم تسليم العنصر المطلوب "${params.itemName}" لـ "${params.competitionTitleAr || params.competitionTitle}".`,
    type: "success",
    channels: ["in_app"],
  });
}

export async function notifyCompanyInvitation(params: {
  userId: string;
  companyName: string;
  invitationType: string;
  competitionTitle?: string;
}) {
  return sendNotification({
    userId: params.userId,
    templateSlug: "company-invitation",
    variables: {
      company_name: params.companyName,
      invitation_type: params.invitationType,
      competition_title: params.competitionTitle || "",
    },
    channels: ["in_app", "email"],
  });
}

// ── Deadline Reminders ──

export async function notifyRegistrationDeadline(params: {
  userId: string;
  competitionTitle: string;
  competitionTitleAr?: string;
  competitionId: string;
  daysLeft: number;
}) {
  return sendNotification({
    userId: params.userId,
    title: `Registration Closing Soon: ${params.competitionTitle}`,
    titleAr: params.competitionTitleAr
      ? `التسجيل يغلق قريباً: ${params.competitionTitleAr}`
      : undefined,
    body: `Only ${params.daysLeft} day${params.daysLeft > 1 ? "s" : ""} left to register for "${params.competitionTitle}". Don't miss out!`,
    bodyAr: params.competitionTitleAr
      ? `بقي ${params.daysLeft} يوم للتسجيل في "${params.competitionTitleAr}". لا تفوت الفرصة!`
      : undefined,
    type: "warning",
    link: `/competitions/${params.competitionId}`,
    channels: ["in_app", "email"],
  });
}

export async function notifyCompetitionStartingSoon(params: {
  userId: string;
  competitionTitle: string;
  competitionTitleAr?: string;
  competitionId: string;
  daysLeft: number;
}) {
  return sendNotification({
    userId: params.userId,
    title: `Competition Starts Soon: ${params.competitionTitle}`,
    titleAr: params.competitionTitleAr
      ? `المسابقة تبدأ قريباً: ${params.competitionTitleAr}`
      : undefined,
    body: `"${params.competitionTitle}" starts in ${params.daysLeft} day${params.daysLeft > 1 ? "s" : ""}. Get ready!`,
    bodyAr: params.competitionTitleAr
      ? `"${params.competitionTitleAr}" تبدأ خلال ${params.daysLeft} أيام. استعد!`
      : undefined,
    type: "info",
    link: `/competitions/${params.competitionId}`,
    channels: ["in_app", "email"],
  });
}

export async function notifyCompetitionResults(params: {
  userId: string;
  competitionTitle: string;
  competitionTitleAr?: string;
  competitionId: string;
  placement?: string;
}) {
  return sendNotification({
    userId: params.userId,
    title: `Results Available: ${params.competitionTitle}`,
    titleAr: params.competitionTitleAr
      ? `النتائج متاحة: ${params.competitionTitleAr}`
      : undefined,
    body: params.placement
      ? `Congratulations! You placed ${params.placement} in "${params.competitionTitle}". View your results now.`
      : `Results for "${params.competitionTitle}" are now available. Check your performance!`,
    bodyAr: params.competitionTitleAr
      ? `تم نشر نتائج "${params.competitionTitleAr}". اطلع على أدائك الآن!`
      : undefined,
    type: "success",
    link: `/competitions/${params.competitionId}/results`,
    channels: ["in_app", "email"],
  });
}

export async function notifyWelcomeUser(params: {
  userId: string;
  userName: string;
}) {
  return sendNotification({
    userId: params.userId,
    templateSlug: "welcome-user",
    variables: {
      user_name: params.userName,
    },
    channels: ["in_app", "email"],
  });
}

export async function notifyCertificateIssued(params: {
  userId: string;
  certificateNumber: string;
  competitionTitle: string;
  competitionTitleAr?: string;
}) {
  return sendNotification({
    userId: params.userId,
    title: `Certificate Issued: ${params.competitionTitle}`,
    titleAr: params.competitionTitleAr
      ? `تم إصدار شهادة: ${params.competitionTitleAr}`
      : undefined,
    body: `Your certificate #${params.certificateNumber} for "${params.competitionTitle}" is ready. Download it from your profile.`,
    bodyAr: params.competitionTitleAr
      ? `شهادتك رقم #${params.certificateNumber} لـ "${params.competitionTitleAr}" جاهزة. حملها من ملفك الشخصي.`
      : undefined,
    type: "success",
    link: `/profile`,
    channels: ["in_app", "email"],
  });
}

export async function notifyJudgeAssigned(params: {
  userId: string;
  competitionTitle: string;
  competitionTitleAr?: string;
  competitionId: string;
}) {
  return sendNotification({
    userId: params.userId,
    title: `You've been assigned as Judge: ${params.competitionTitle}`,
    titleAr: params.competitionTitleAr
      ? `تم تعيينك كحكم: ${params.competitionTitleAr}`
      : undefined,
    body: `You have been assigned as a judge for "${params.competitionTitle}". Review the competition details and criteria.`,
    bodyAr: params.competitionTitleAr
      ? `تم تعيينك كحكم في "${params.competitionTitleAr}". راجع تفاصيل المسابقة والمعايير.`
      : undefined,
    type: "info",
    link: `/competitions/${params.competitionId}`,
    channels: ["in_app", "email"],
  });
}

export async function notifyProfileVerified(params: {
  userId: string;
  userName: string;
}) {
  return sendNotification({
    userId: params.userId,
    title: `Profile Verified`,
    titleAr: `تم التحقق من الملف الشخصي`,
    body: `Congratulations ${params.userName}! Your professional profile has been verified. You now have access to verified member features.`,
    bodyAr: `تهانينا ${params.userName}! تم التحقق من ملفك المهني. يمكنك الآن الوصول إلى ميزات العضو الموثق.`,
    type: "success",
    channels: ["in_app", "email"],
  });
}

// ═══════════════════════════════════════════════
// ── Admin Review Notification System ──
// Sends notifications to all supervisor-role users only.
// Only supervisors have full admin privileges.
// ═══════════════════════════════════════════════

async function getAdminUserIds(): Promise<string[]> {
  const { data } = await supabase
    .from("user_roles")
    .select("user_id")
    .eq("role", "supervisor");
  return [...new Set((data || []).map((r: any) => r.user_id as string))];
}

async function notifyAllAdmins(notification: Omit<SendNotificationParams, "userId">) {
  const adminIds = await getAdminUserIds();
  await Promise.allSettled(
    adminIds.map((userId) => sendNotification({ ...notification, userId }))
  );
}

/** Notify admins when a new entity is submitted for review */
export async function notifyAdminEntityReview(params: {
  entityName: string;
  entityNameAr?: string;
  submittedBy: string;
}) {
  return notifyAllAdmins({
    title: `Entity Review Required: ${params.entityName}`,
    titleAr: `مراجعة جهة مطلوبة: ${params.entityNameAr || params.entityName}`,
    body: `A new entity "${params.entityName}" has been submitted and requires admin review.`,
    bodyAr: `تم إرسال جهة جديدة "${params.entityNameAr || params.entityName}" وتحتاج لمراجعة الإدارة.`,
    type: "info",
    link: "/admin/establishments",
    channels: ["in_app", "email"],
  });
}

/** Notify when entity status changes (pending → approved, etc.) */
export async function notifyEntityStatusChanged(params: {
  entityId: string;
  entityName: string;
  entityNameAr?: string;
  newStatus: string;
  createdBy?: string | null;
}) {
  const statusLabels: Record<string, { en: string; ar: string }> = {
    active: { en: "approved and activated", ar: "تمت الموافقة والتفعيل" },
    pending: { en: "set to pending review", ar: "في انتظار المراجعة" },
    suspended: { en: "suspended", ar: "تم تعليقها" },
    inactive: { en: "deactivated", ar: "تم إلغاء تفعيلها" },
  };

  const label = statusLabels[params.newStatus] || { en: params.newStatus, ar: params.newStatus };

  // Notify admins about the status change
  await notifyAllAdmins({
    title: `Entity ${label.en}: ${params.entityName}`,
    titleAr: `الجهة ${label.ar}: ${params.entityNameAr || params.entityName}`,
    body: `The entity "${params.entityName}" has been ${label.en}.`,
    bodyAr: `الجهة "${params.entityNameAr || params.entityName}" ${label.ar}.`,
    type: params.newStatus === "active" ? "success" : params.newStatus === "suspended" ? "warning" : "info",
    link: "/admin/establishments",
    channels: ["in_app"],
  });

  // If entity was created by a user, notify them too
  if (params.createdBy) {
    await sendNotification({
      userId: params.createdBy,
      title: `Your entity "${params.entityName}" has been ${label.en}`,
      titleAr: `جهتك "${params.entityNameAr || params.entityName}" ${label.ar}`,
      body: `The entity you submitted has been ${label.en} by the administration.`,
      bodyAr: `الجهة التي قدمتها ${label.ar} من قبل الإدارة.`,
      type: params.newStatus === "active" ? "success" : params.newStatus === "suspended" ? "warning" : "info",
      link: "/admin/establishments",
      channels: ["in_app"],
    });
  }
}

/** Notify admins when a new exhibition is submitted for review */
export async function notifyAdminExhibitionReview(params: {
  exhibitionName: string;
  exhibitionNameAr?: string;
  submittedBy: string;
}) {
  return notifyAllAdmins({
    title: `Exhibition Review Required: ${params.exhibitionName}`,
    titleAr: `مراجعة معرض مطلوبة: ${params.exhibitionNameAr || params.exhibitionName}`,
    body: `A new exhibition "${params.exhibitionName}" has been submitted via ${params.submittedBy} and requires admin review.`,
    bodyAr: `تم إرسال معرض جديد "${params.exhibitionNameAr || params.exhibitionName}" عبر ${params.submittedBy} ويحتاج لمراجعة الإدارة.`,
    type: "info",
    link: "/admin/exhibitions",
    channels: ["in_app", "email"],
  });
}

/** Notify admins when a new competition is submitted for review */
export async function notifyAdminCompetitionReview(params: {
  competitionName: string;
  competitionNameAr?: string;
  submittedBy: string;
}) {
  return notifyAllAdmins({
    title: `Competition Review Required: ${params.competitionName}`,
    titleAr: `مراجعة مسابقة مطلوبة: ${params.competitionNameAr || params.competitionName}`,
    body: `A new competition "${params.competitionName}" has been submitted via ${params.submittedBy} and requires admin review.`,
    bodyAr: `تم إرسال مسابقة جديدة "${params.competitionNameAr || params.competitionName}" عبر ${params.submittedBy} وتحتاج لمراجعة الإدارة.`,
    type: "info",
    link: "/admin/competitions",
    channels: ["in_app", "email"],
  });
}

/** Notify admins when a Michelin Star / award request is submitted */
export async function notifyAdminAwardRequest(params: {
  userName: string;
  awardName: string;
  awardNameAr?: string;
  documentUrl?: string;
}) {
  return notifyAllAdmins({
    title: `Award Request: ${params.awardName} by ${params.userName}`,
    titleAr: `طلب جائزة: ${params.awardNameAr || params.awardName} من ${params.userName}`,
    body: `${params.userName} has requested "${params.awardName}" approval. ${params.documentUrl ? "Supporting document attached." : "Review required."}`,
    bodyAr: `${params.userName} طلب الموافقة على "${params.awardNameAr || params.awardName}". ${params.documentUrl ? "المستند المرفق متاح." : "مطلوب مراجعة."}`,
    type: "warning",
    link: "/admin/users",
    channels: ["in_app", "email"],
  });
}

/** Notify admins when a verification request is submitted */
export async function notifyAdminVerificationRequest(params: {
  userName: string;
  verificationType: string;
  userId: string;
}) {
  return notifyAllAdmins({
    title: `Verification Request: ${params.userName}`,
    titleAr: `طلب توثيق: ${params.userName}`,
    body: `${params.userName} submitted a ${params.verificationType} verification request. Please review.`,
    bodyAr: `قدّم ${params.userName} طلب توثيق من نوع ${params.verificationType}. يرجى المراجعة.`,
    type: "info",
    link: "/admin/verification",
    channels: ["in_app", "email"],
  });
}

/** Notify admins when a career record references an unregistered entity */
export async function notifyAdminUnregisteredEntity(params: {
  userName: string;
  entityName: string;
}) {
  return notifyAllAdmins({
    title: `Unregistered Entity Referenced: ${params.entityName}`,
    titleAr: `جهة غير مسجلة: ${params.entityName}`,
    body: `${params.userName} referenced "${params.entityName}" in their career record, but this entity is not yet registered in the system.`,
    bodyAr: `أشار ${params.userName} إلى "${params.entityName}" في سجله المهني، لكن هذه الجهة غير مسجلة بعد في النظام.`,
    type: "info",
    link: "/admin/establishments",
    channels: ["in_app"],
  });
}

/** Notify admins when a new company registration request is submitted */
export async function notifyAdminCompanyRegistration(params: {
  companyName: string;
  companyNameAr?: string;
  submittedBy: string;
}) {
  return notifyAllAdmins({
    title: `Company Registration: ${params.companyName}`,
    titleAr: `تسجيل شركة: ${params.companyNameAr || params.companyName}`,
    body: `A new company "${params.companyName}" registration has been submitted by ${params.submittedBy} and requires approval.`,
    bodyAr: `تم تقديم تسجيل شركة جديدة "${params.companyNameAr || params.companyName}" من ${params.submittedBy} ويحتاج للموافقة.`,
    type: "info",
    link: "/admin/companies",
    channels: ["in_app", "email"],
  });
}

/** Notify admins when content is reported */
export async function notifyAdminContentReport(params: {
  reportedBy: string;
  contentType: string;
  reason: string;
}) {
  return notifyAllAdmins({
    title: `Content Report: ${params.contentType}`,
    titleAr: `بلاغ محتوى: ${params.contentType}`,
    body: `${params.reportedBy} reported ${params.contentType} content. Reason: ${params.reason}`,
    bodyAr: `أبلغ ${params.reportedBy} عن محتوى ${params.contentType}. السبب: ${params.reason}`,
    type: "warning",
    link: "/admin/moderation",
    channels: ["in_app"],
  });
}

/** Notify admins about new support ticket */
export async function notifyAdminSupportTicket(params: {
  ticketNumber: string;
  subject: string;
  priority: string;
  userName: string;
}) {
  return notifyAllAdmins({
    title: `Support Ticket ${params.ticketNumber}: ${params.subject}`,
    titleAr: `تذكرة دعم ${params.ticketNumber}: ${params.subject}`,
    body: `New ${params.priority} priority support ticket from ${params.userName}. Subject: ${params.subject}`,
    bodyAr: `تذكرة دعم جديدة بأولوية ${params.priority} من ${params.userName}. الموضوع: ${params.subject}`,
    type: params.priority === "urgent" || params.priority === "high" ? "warning" : "info",
    link: "/admin/support-tickets",
    channels: ["in_app", "email"],
  });
}

// ═══════════════════════════════════════════════
// ── Order Center Notification Triggers ──
// ═══════════════════════════════════════════════

/** Notify organizer when a new quote request is sent */
export async function notifyQuoteRequestSent(params: {
  userId: string;
  companyName: string;
  requestTitle: string;
  competitionId: string;
  itemCount: number;
}) {
  return sendNotification({
    userId: params.userId,
    title: `Quote Request Sent: ${params.requestTitle}`,
    titleAr: `تم إرسال طلب أسعار: ${params.requestTitle}`,
    body: `Quote request with ${params.itemCount} items sent to "${params.companyName}".`,
    bodyAr: `تم إرسال طلب أسعار يحتوي على ${params.itemCount} عنصر إلى "${params.companyName}".`,
    type: "success",
    link: `/competitions/${params.competitionId}`,
    channels: ["in_app"],
  });
}

/** Notify when a suggestion is submitted */
export async function notifySuggestionSubmitted(params: {
  competitionId: string;
  itemName: string;
  suggestedByName: string;
}) {
  const { data: roles } = await supabase
    .from("competition_roles")
    .select("user_id")
    .eq("competition_id", params.competitionId)
    .in("role", ["organizer", "coordinator"])
    .eq("status", "active");

  if (roles?.length) {
    await Promise.allSettled(
      roles.map((r: any) =>
        sendNotification({
          userId: r.user_id,
          title: `New Item Suggestion: ${params.itemName}`,
          titleAr: `اقتراح عنصر جديد: ${params.itemName}`,
          body: `${params.suggestedByName} suggested "${params.itemName}" for the competition requirements.`,
          bodyAr: `${params.suggestedByName} اقترح "${params.itemName}" لمتطلبات المسابقة.`,
          type: "info",
          link: `/competitions/${params.competitionId}`,
          channels: ["in_app"],
        })
      )
    );
  }
}

/** Notify when a suggestion is reviewed */
export async function notifySuggestionReviewed(params: {
  userId: string;
  itemName: string;
  status: string;
  competitionId: string;
}) {
  return sendNotification({
    userId: params.userId,
    title: `Suggestion ${params.status}: ${params.itemName}`,
    titleAr: `تم ${params.status === "approved" ? "قبول" : "رفض"} الاقتراح: ${params.itemName}`,
    body: `Your suggestion "${params.itemName}" has been ${params.status}.`,
    bodyAr: `تم ${params.status === "approved" ? "قبول" : "رفض"} اقتراحك "${params.itemName}".`,
    type: params.status === "approved" ? "success" : "warning",
    link: `/competitions/${params.competitionId}`,
    channels: ["in_app"],
  });
}

/** Notify when a delivery item is marked as delivered */
export async function notifyItemDelivered(params: {
  competitionId: string;
  itemName: string;
  deliveredCount: number;
  totalCount: number;
}) {
  const { data: roles } = await supabase
    .from("competition_roles")
    .select("user_id")
    .eq("competition_id", params.competitionId)
    .in("role", ["organizer", "coordinator"])
    .eq("status", "active");

  if (roles?.length) {
    await Promise.allSettled(
      roles.map((r: any) =>
        sendNotification({
          userId: r.user_id,
          title: `Item Delivered: ${params.itemName}`,
          titleAr: `تم تسليم: ${params.itemName}`,
          body: `${params.deliveredCount}/${params.totalCount} items delivered for the competition.`,
          bodyAr: `${params.deliveredCount}/${params.totalCount} عناصر تم تسليمها للمسابقة.`,
          type: "success",
          channels: ["in_app"],
        })
      )
    );
  }
}

/** Notify about overdue delivery items */
export async function notifyDeadlineApproaching(params: {
  userId: string;
  competitionId: string;
  itemName: string;
  deadline: string;
}) {
  return sendNotification({
    userId: params.userId,
    title: `Deadline Approaching: ${params.itemName}`,
    titleAr: `اقتراب الموعد النهائي: ${params.itemName}`,
    body: `The delivery deadline for "${params.itemName}" is ${params.deadline}. Please ensure timely delivery.`,
    bodyAr: `الموعد النهائي لتسليم "${params.itemName}" هو ${params.deadline}. يرجى ضمان التسليم في الوقت المناسب.`,
    type: "warning",
    link: `/competitions/${params.competitionId}`,
    channels: ["in_app"],
  });
}

// ═══════════════════════════════════════════════
// ── Pro Supplier Notification Triggers ──
// ═══════════════════════════════════════════════

/** Notify company contacts when supplier profile is approved/featured */
export async function notifySupplierFeatured(params: {
  companyId: string;
  companyName: string;
  companyNameAr?: string;
}) {
  // Get company contact user IDs
  const { data: contacts } = await supabase
    .from("company_contacts")
    .select("user_id")
    .eq("company_id", params.companyId)
    .not("user_id", "is", null);

  if (!contacts?.length) return;

  for (const contact of contacts) {
    if (!contact.user_id) continue;
    await sendNotification({
      userId: contact.user_id,
      title: `Your company "${params.companyName}" is now featured in Pro Suppliers!`,
      titleAr: params.companyNameAr
        ? `شركتك "${params.companyNameAr}" مميّزة الآن في دليل الموردين المحترفين!`
        : undefined,
      body: "Your supplier profile is live and visible to all professional chefs.",
      bodyAr: "ملفك كمورد أصبح مباشراً ومرئياً لجميع الشيفات المحترفين.",
      type: "success",
      link: `/pro-suppliers/${params.companyId}`,
      channels: ["in_app", "email"],
    });
  }
}

/** Notify company when they receive a new review */
export async function notifySupplierNewReview(params: {
  companyId: string;
  reviewerName: string;
  rating: number;
}) {
  const { data: contacts } = await supabase
    .from("company_contacts")
    .select("user_id")
    .eq("company_id", params.companyId)
    .eq("is_primary", true)
    .not("user_id", "is", null);

  if (!contacts?.length) return;

  const stars = "★".repeat(params.rating) + "☆".repeat(5 - params.rating);
  for (const contact of contacts) {
    if (!contact.user_id) continue;
    await sendNotification({
      userId: contact.user_id,
      title: `New ${params.rating}-star review from ${params.reviewerName}`,
      titleAr: `تقييم جديد ${stars} من ${params.reviewerName}`,
      body: `${params.reviewerName} left a ${params.rating}-star review on your supplier profile`,
      bodyAr: `${params.reviewerName} ترك تقييم ${params.rating} نجوم على ملفك التعريفي`,
      type: "info",
      link: "/company/supplier-profile",
      channels: ["in_app"],
    });
  }
}

/** Notify company when they receive a contact inquiry */
export async function notifySupplierInquiry(params: {
  companyId: string;
  senderName: string;
  subject: string;
}) {
  const { data: contacts } = await supabase
    .from("company_contacts")
    .select("user_id")
    .eq("company_id", params.companyId)
    .eq("is_primary", true)
    .not("user_id", "is", null);

  if (!contacts?.length) return;

  for (const contact of contacts) {
    if (!contact.user_id) continue;
    await sendNotification({
      userId: contact.user_id,
      title: `New inquiry from ${params.senderName}`,
      titleAr: `استفسار جديد من ${params.senderName}`,
      body: params.subject,
      bodyAr: params.subject,
      type: "info",
      link: "/company/communications",
      channels: ["in_app", "email"],
    });
  }
}
