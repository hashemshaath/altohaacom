import { supabase } from "@/integrations/supabase/client";
import { sendNotification, sendBulkNotifications } from "@/lib/notifications";

/**
 * Workflow Automation Engine
 * Handles status-based triggers, scheduled notifications, and automated sequences.
 */

export type WorkflowTrigger =
  | "competition_status_changed"
  | "registration_approved"
  | "registration_rejected"
  | "score_submitted"
  | "all_scores_complete"
  | "delivery_overdue"
  | "competition_starting_soon"
  | "certificate_issued";

interface WorkflowContext {
  competitionId?: string;
  userId?: string;
  triggeredBy?: string;
  metadata?: Record<string, any>;
}

/**
 * Execute a workflow based on a trigger event.
 */
export async function executeWorkflow(trigger: WorkflowTrigger, ctx: WorkflowContext) {
  try {
    switch (trigger) {
      case "competition_status_changed":
        return handleCompetitionStatusChange(ctx);
      case "registration_approved":
        return handleRegistrationApproved(ctx);
      case "registration_rejected":
        return handleRegistrationRejected(ctx);
      case "score_submitted":
        return handleScoreSubmitted(ctx);
      case "all_scores_complete":
        return handleAllScoresComplete(ctx);
      case "competition_starting_soon":
        return handleCompetitionStartingSoon(ctx);
      case "certificate_issued":
        return handleCertificateIssued(ctx);
      default:
        console.warn("Unknown workflow trigger:", trigger);
    }
  } catch (e) {
    console.error("Workflow execution failed:", trigger, e);
  }
}

async function handleCompetitionStatusChange(ctx: WorkflowContext) {
  if (!ctx.competitionId || !ctx.metadata?.newStatus) return;

  const { data: comp } = await supabase
    .from("competitions")
    .select("title, title_ar")
    .eq("id", ctx.competitionId)
    .single();

  const { data: registrations } = await supabase
    .from("competition_registrations")
    .select("participant_id")
    .eq("competition_id", ctx.competitionId)
    .eq("status", "approved");

  const userIds = registrations?.map(r => r.participant_id) || [];
  if (!userIds.length) return;

  const statusMessages: Record<string, { en: string; ar: string }> = {
    registration_open: {
      en: `Registration is now open for "${comp?.title}"`,
      ar: `التسجيل مفتوح الآن لـ "${comp?.title_ar || comp?.title}"`,
    },
    in_progress: {
      en: `"${comp?.title}" has started!`,
      ar: `بدأت "${comp?.title_ar || comp?.title}"!`,
    },
    completed: {
      en: `"${comp?.title}" has been completed. Check your results!`,
      ar: `اكتملت "${comp?.title_ar || comp?.title}". تحقق من نتائجك!`,
    },
  };

  const msg = statusMessages[ctx.metadata.newStatus];
  if (!msg) return;

  await sendBulkNotifications({
    userIds,
    title: msg.en,
    titleAr: msg.ar,
    body: msg.en,
    bodyAr: msg.ar,
    type: "info",
    link: `/competitions/${ctx.competitionId}`,
    channels: ["in_app"],
  });
}

async function handleRegistrationApproved(ctx: WorkflowContext) {
  if (!ctx.userId || !ctx.competitionId) return;

  const { data: comp } = await supabase
    .from("competitions")
    .select("title, title_ar")
    .eq("id", ctx.competitionId)
    .single();

  await sendNotification({
    userId: ctx.userId,
    title: `Registration Approved: ${comp?.title}`,
    titleAr: `تم قبول تسجيلك: ${comp?.title_ar || comp?.title}`,
    body: `Your registration for "${comp?.title}" has been approved. Good luck!`,
    bodyAr: `تم قبول تسجيلك في "${comp?.title_ar || comp?.title}". بالتوفيق!`,
    type: "success",
    link: `/competitions/${ctx.competitionId}`,
    channels: ["in_app"],
  });
}

async function handleRegistrationRejected(ctx: WorkflowContext) {
  if (!ctx.userId || !ctx.competitionId) return;

  const { data: comp } = await supabase
    .from("competitions")
    .select("title, title_ar")
    .eq("id", ctx.competitionId)
    .single();

  await sendNotification({
    userId: ctx.userId,
    title: `Registration Update: ${comp?.title}`,
    titleAr: `تحديث التسجيل: ${comp?.title_ar || comp?.title}`,
    body: `Your registration for "${comp?.title}" was not approved. ${ctx.metadata?.reason || ""}`,
    bodyAr: `لم تتم الموافقة على تسجيلك في "${comp?.title_ar || comp?.title}". ${ctx.metadata?.reasonAr || ""}`,
    type: "warning",
    link: `/competitions/${ctx.competitionId}`,
    channels: ["in_app"],
  });
}

async function handleScoreSubmitted(ctx: WorkflowContext) {
  if (!ctx.competitionId || !ctx.metadata?.participantUserId) return;
  // Check if all judges have scored this participant
  const { data: roles } = await supabase
    .from("competition_roles")
    .select("id")
    .eq("competition_id", ctx.competitionId)
    .eq("role", "judge")
    .eq("status", "active");

  const totalJudges = roles?.length || 0;
  const judgesScored = ctx.metadata?.judgesScored || 0;

  if (judgesScored >= totalJudges) {
    await executeWorkflow("all_scores_complete", {
      ...ctx,
      userId: ctx.metadata.participantUserId,
    });
  }
}

async function handleAllScoresComplete(ctx: WorkflowContext) {
  if (!ctx.userId || !ctx.competitionId) return;

  await sendNotification({
    userId: ctx.userId,
    title: "Scoring Complete",
    titleAr: "اكتمل التقييم",
    body: "All judges have submitted their scores for your entry. Results will be announced soon.",
    bodyAr: "قام جميع الحكام بتقديم درجاتهم لمشاركتك. سيتم الإعلان عن النتائج قريبًا.",
    type: "info",
    link: `/competitions/${ctx.competitionId}`,
    channels: ["in_app"],
  });
}

async function handleCompetitionStartingSoon(ctx: WorkflowContext) {
  if (!ctx.competitionId) return;

  const { data: comp } = await supabase
    .from("competitions")
    .select("title, title_ar")
    .eq("id", ctx.competitionId)
    .single();

  const { data: registrations } = await supabase
    .from("competition_registrations")
    .select("participant_id")
    .eq("competition_id", ctx.competitionId)
    .eq("status", "approved");

  const userIds = registrations?.map(r => r.participant_id) || [];
  if (!userIds.length) return;

  await sendBulkNotifications({
    userIds,
    title: `Starting Soon: ${comp?.title}`,
    titleAr: `قريبًا: ${comp?.title_ar || comp?.title}`,
    body: `"${comp?.title}" starts tomorrow. Make sure you're ready!`,
    bodyAr: `"${comp?.title_ar || comp?.title}" تبدأ غدًا. تأكد من جاهزيتك!`,
    type: "info",
    link: `/competitions/${ctx.competitionId}`,
    channels: ["in_app"],
  });
}

async function handleCertificateIssued(ctx: WorkflowContext) {
  if (!ctx.userId) return;

  await sendNotification({
    userId: ctx.userId,
    title: "Certificate Issued! 🎉",
    titleAr: "تم إصدار شهادتك! 🎉",
    body: "A new certificate has been issued to you. View and download it from your profile.",
    bodyAr: "تم إصدار شهادة جديدة لك. يمكنك عرضها وتحميلها من ملفك الشخصي.",
    type: "success",
    link: "/profile?tab=certificates",
    channels: ["in_app"],
  });
}

/**
 * Check for competitions starting tomorrow and send reminders.
 * Should be called from a scheduled edge function or manually.
 */
export async function checkScheduledTriggers() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0];

  const { data: competitions } = await supabase
    .from("competitions")
    .select("id")
    .eq("status", "registration_open")
    .gte("start_date", `${tomorrowStr}T00:00:00`)
    .lte("start_date", `${tomorrowStr}T23:59:59`);

  if (competitions?.length) {
    await Promise.allSettled(
      competitions.map(c =>
        executeWorkflow("competition_starting_soon", { competitionId: c.id })
      )
    );
  }
}
