import { supabase } from "@/integrations/supabase/client";
import { sendNotification, sendBulkNotifications } from "@/lib/notifications";

/**
 * Evaluation-specific workflow triggers for Chef's Table sessions.
 */

export type EvaluationTrigger =
  | "chef_assigned_to_session"
  | "chef_removed_from_session"
  | "evaluation_submitted"
  | "all_evaluations_complete"
  | "report_published"
  | "session_status_changed"
  | "invoice_generated";

interface EvaluationContext {
  sessionId?: string;
  chefUserId?: string;
  companyUserId?: string;
  triggeredBy?: string;
  metadata?: Record<string, any>;
}

export async function executeEvaluationWorkflow(
  trigger: EvaluationTrigger,
  ctx: EvaluationContext
) {
  try {
    switch (trigger) {
      case "chef_assigned_to_session":
        return handleChefAssigned(ctx);
      case "chef_removed_from_session":
        return handleChefRemoved(ctx);
      case "evaluation_submitted":
        return handleEvaluationSubmitted(ctx);
      case "all_evaluations_complete":
        return handleAllEvaluationsComplete(ctx);
      case "report_published":
        return handleReportPublished(ctx);
      case "session_status_changed":
        return handleSessionStatusChanged(ctx);
      case "invoice_generated":
        return handleInvoiceGenerated(ctx);
      default:
        console.warn("Unknown evaluation trigger:", trigger);
    }
  } catch (e) {
    console.error("Evaluation workflow failed:", trigger, e);
  }
}

async function getSessionInfo(sessionId: string) {
  const { data } = await supabase
    .from("chefs_table_sessions" as any)
    .select("title, title_ar, product_name, product_name_ar, company_id")
    .eq("id", sessionId)
    .single();
  return data as any;
}

async function handleChefAssigned(ctx: EvaluationContext) {
  if (!ctx.chefUserId || !ctx.sessionId) return;
  const session = await getSessionInfo(ctx.sessionId);
  if (!session) return;

  await sendNotification({
    userId: ctx.chefUserId,
    title: `You've been assigned to evaluate: ${session.product_name}`,
    titleAr: `تم تعيينك لتقييم: ${session.product_name_ar || session.product_name}`,
    body: `You have a new Chef's Table evaluation assignment for "${session.title}". Check your evaluations portal for details.`,
    bodyAr: `لديك مهمة تقييم جديدة في طاولة الشيف لـ "${session.title_ar || session.title}". تحقق من بوابة التقييمات للتفاصيل.`,
    type: "info",
    link: "/my-evaluations",
    channels: ["in_app"],
  });
}

async function handleChefRemoved(ctx: EvaluationContext) {
  if (!ctx.chefUserId || !ctx.sessionId) return;
  const session = await getSessionInfo(ctx.sessionId);
  if (!session) return;

  await sendNotification({
    userId: ctx.chefUserId,
    title: `Evaluation assignment update: ${session.product_name}`,
    titleAr: `تحديث مهمة التقييم: ${session.product_name_ar || session.product_name}`,
    body: `Your assignment for "${session.title}" has been updated. Please check your evaluations portal.`,
    bodyAr: `تم تحديث مهمتك لـ "${session.title_ar || session.title}". يرجى التحقق من بوابة التقييمات.`,
    type: "warning",
    link: "/my-evaluations",
    channels: ["in_app"],
  });
}

async function handleEvaluationSubmitted(ctx: EvaluationContext) {
  if (!ctx.sessionId || !ctx.chefUserId) return;
  const session = await getSessionInfo(ctx.sessionId);
  if (!session) return;

  // Notify admins (supervisors)
  const { data: admins } = await supabase
    .from("user_roles")
    .select("user_id")
    .eq("role", "supervisor");

  const adminIds = admins?.map((a: any) => a.user_id) || [];
  if (adminIds.length) {
    await sendBulkNotifications({
      userIds: adminIds,
      title: `Evaluation submitted for ${session.product_name}`,
      titleAr: `تم تقديم تقييم لـ ${session.product_name_ar || session.product_name}`,
      body: `A chef has submitted their evaluation for "${session.title}".`,
      bodyAr: `قام طاهٍ بتقديم تقييمه لـ "${session.title_ar || session.title}".`,
      type: "info",
      link: `/admin/chefs-table`,
      channels: ["in_app"],
    });
  }
}

async function handleAllEvaluationsComplete(ctx: EvaluationContext) {
  if (!ctx.sessionId) return;
  const session = await getSessionInfo(ctx.sessionId);
  if (!session) return;

  // Notify admins
  const { data: admins } = await supabase
    .from("user_roles")
    .select("user_id")
    .eq("role", "supervisor");

  const adminIds = admins?.map((a: any) => a.user_id) || [];
  if (adminIds.length) {
    await sendBulkNotifications({
      userIds: adminIds,
      title: `All evaluations complete: ${session.product_name}`,
      titleAr: `اكتملت جميع التقييمات: ${session.product_name_ar || session.product_name}`,
      body: `All chefs have submitted evaluations for "${session.title}". The report is ready to publish.`,
      bodyAr: `قام جميع الطهاة بتقديم تقييماتهم لـ "${session.title_ar || session.title}". التقرير جاهز للنشر.`,
      type: "success",
      link: `/admin/chefs-table`,
      channels: ["in_app"],
    });
  }
}

async function handleReportPublished(ctx: EvaluationContext) {
  if (!ctx.sessionId) return;
  const session = await getSessionInfo(ctx.sessionId);
  if (!session) return;

  // Notify company contact
  if (session.company_id) {
    const { data: contacts } = await supabase
      .from("company_contacts")
      .select("user_id")
      .eq("company_id", session.company_id);

    const contactIds = contacts?.map((c: any) => c.user_id) || [];
    if (contactIds.length) {
      await sendBulkNotifications({
        userIds: contactIds,
        title: `Evaluation report ready: ${session.product_name} 🎉`,
        titleAr: `تقرير التقييم جاهز: ${session.product_name_ar || session.product_name} 🎉`,
        body: `The professional evaluation report for "${session.title}" is now available. View and share your results!`,
        bodyAr: `تقرير التقييم الاحترافي لـ "${session.title_ar || session.title}" متاح الآن. اطلع على نتائجك وشاركها!`,
        type: "success",
        link: `/evaluation-report/${ctx.metadata?.reportToken || ""}`,
        channels: ["in_app"],
      });
    }
  }
}

async function handleSessionStatusChanged(ctx: EvaluationContext) {
  if (!ctx.sessionId || !ctx.metadata?.newStatus) return;
  const session = await getSessionInfo(ctx.sessionId);
  if (!session) return;

  // Get assigned chefs
  const { data: registrations } = await supabase
    .from("chef_evaluation_registrations" as any)
    .select("chef_id")
    .eq("session_id", ctx.sessionId)
    .eq("status", "matched");

  const chefIds = (registrations as any[])?.map(r => r.chef_id) || [];
  if (!chefIds.length) return;

  const statusMessages: Record<string, { en: string; ar: string }> = {
    in_progress: {
      en: `Evaluation session "${session.title}" has started. Submit your evaluation now!`,
      ar: `بدأت جلسة التقييم "${session.title_ar || session.title}". قدّم تقييمك الآن!`,
    },
    completed: {
      en: `Evaluation session "${session.title}" is now complete. Thank you for your participation!`,
      ar: `اكتملت جلسة التقييم "${session.title_ar || session.title}". شكرًا لمشاركتك!`,
    },
    cancelled: {
      en: `Evaluation session "${session.title}" has been cancelled.`,
      ar: `تم إلغاء جلسة التقييم "${session.title_ar || session.title}".`,
    },
  };

  const msg = statusMessages[ctx.metadata.newStatus];
  if (!msg) return;

  await sendBulkNotifications({
    userIds: chefIds,
    title: msg.en,
    titleAr: msg.ar,
    body: msg.en,
    bodyAr: msg.ar,
    type: ctx.metadata.newStatus === "cancelled" ? "warning" : "info",
    link: "/my-evaluations",
    channels: ["in_app"],
  });
}

async function handleInvoiceGenerated(ctx: EvaluationContext) {
  if (!ctx.sessionId) return;
  const session = await getSessionInfo(ctx.sessionId);
  if (!session?.company_id) return;

  const { data: contacts } = await supabase
    .from("company_contacts")
    .select("user_id")
    .eq("company_id", session.company_id);

  const contactIds = contacts?.map((c: any) => c.user_id) || [];
  if (!contactIds.length) return;

  await sendBulkNotifications({
    userIds: contactIds,
    title: `Invoice generated: ${session.product_name}`,
    titleAr: `تم إنشاء فاتورة: ${session.product_name_ar || session.product_name}`,
    body: `An invoice has been generated for the evaluation of "${session.title}". Please review and process payment.`,
    bodyAr: `تم إنشاء فاتورة لتقييم "${session.title_ar || session.title}". يرجى المراجعة والدفع.`,
    type: "info",
    link: "/profile?tab=invoices",
    channels: ["in_app"],
  });
}
