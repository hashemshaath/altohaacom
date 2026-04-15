import { sendNotification } from "./shared";

export async function notifyReportResolved(params: { userId: string; status: string }) {
  return sendNotification({
    userId: params.userId,
    title: `Your report has been ${params.status}`, titleAr: `تم ${params.status === "resolved" ? "حل" : "رفض"} بلاغك`,
    body: `An admin has reviewed your content report and marked it as ${params.status}.`,
    bodyAr: `قام المسؤول بمراجعة بلاغك وتم وضعه كـ ${params.status}.`,
    type: params.status === "resolved" ? "success" : "info", channels: ["in_app"],
  });
}

export async function notifyInvoiceCreated(params: { userId: string; invoiceNumber: string; amount: number; currency: string }) {
  return sendNotification({
    userId: params.userId,
    title: `New Invoice: ${params.invoiceNumber}`, titleAr: `فاتورة جديدة: ${params.invoiceNumber}`,
    body: `A new invoice for ${params.amount.toLocaleString()} ${params.currency} has been issued to you.`,
    bodyAr: `تم إصدار فاتورة جديدة بمبلغ ${params.amount.toLocaleString()} ${params.currency}.`,
    type: "info", channels: ["in_app", "email"],
  });
}

export async function notifyInvoiceSent(params: { userId: string; invoiceNumber: string; amount: number; currency: string }) {
  return sendNotification({
    userId: params.userId,
    title: `Invoice Sent: ${params.invoiceNumber}`, titleAr: `تم إرسال الفاتورة: ${params.invoiceNumber}`,
    body: `Invoice ${params.invoiceNumber} for ${params.amount.toLocaleString()} ${params.currency} has been sent.`,
    bodyAr: `تم إرسال الفاتورة ${params.invoiceNumber} بمبلغ ${params.amount.toLocaleString()} ${params.currency}.`,
    type: "info", channels: ["in_app", "email"],
  });
}

export async function notifyInvoicePaid(params: { userId: string; invoiceNumber: string; amount: number; currency: string }) {
  return sendNotification({
    userId: params.userId,
    title: `Payment Received: ${params.invoiceNumber}`, titleAr: `تم استلام الدفع: ${params.invoiceNumber}`,
    body: `Payment of ${params.amount.toLocaleString()} ${params.currency} for invoice ${params.invoiceNumber} has been confirmed.`,
    bodyAr: `تم تأكيد دفع ${params.amount.toLocaleString()} ${params.currency} للفاتورة ${params.invoiceNumber}.`,
    type: "success", channels: ["in_app", "email"],
  });
}

export async function notifyFromTemplate(params: {
  userId: string; templateSlug: string; variables?: Record<string, string>; channels?: string[]; link?: string; phone?: string;
}) {
  return sendNotification({
    userId: params.userId, templateSlug: params.templateSlug, variables: params.variables,
    channels: params.channels || ["in_app", "email"], link: params.link, phone: params.phone,
  });
}

export async function notifyCompanyInvitation(params: { userId: string; companyName: string; invitationType: string; competitionTitle?: string }) {
  return sendNotification({
    userId: params.userId, templateSlug: "company-invitation",
    variables: { company_name: params.companyName, invitation_type: params.invitationType, competition_title: params.competitionTitle || "" },
    channels: ["in_app", "email"],
  });
}

export async function notifyWelcomeUser(params: { userId: string; userName: string }) {
  return sendNotification({
    userId: params.userId, templateSlug: "welcome-user", variables: { user_name: params.userName }, channels: ["in_app", "email"],
  });
}

export async function notifyProfileVerified(params: { userId: string; userName: string }) {
  return sendNotification({
    userId: params.userId,
    title: `Profile Verified`, titleAr: `تم التحقق من الملف الشخصي`,
    body: `Congratulations ${params.userName}! Your professional profile has been verified. You now have access to verified member features.`,
    bodyAr: `تهانينا ${params.userName}! تم التحقق من ملفك المهني. يمكنك الآن الوصول إلى ميزات العضو الموثق.`,
    type: "success", channels: ["in_app", "email"],
  });
}
