import { sendNotification } from "@/lib/notifications";

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
