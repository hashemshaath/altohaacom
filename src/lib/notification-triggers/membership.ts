import { sendNotification, supabase } from "./shared";

const TIER_LABELS: Record<string, { en: string; ar: string }> = {
  basic: { en: "Basic", ar: "أساسية" },
  professional: { en: "Professional", ar: "احترافية" },
  enterprise: { en: "Enterprise", ar: "مؤسسية" },
};

export async function notifyMembershipUpgraded(params: { userId: string; previousTier: string; newTier: string; amount?: number; [key: string]: unknown }) {
  const prev = TIER_LABELS[params.previousTier] || TIER_LABELS.basic;
  const next = TIER_LABELS[params.newTier] || TIER_LABELS.professional;

  try {
    const { data: profile } = await supabase.from("profiles").select("full_name, full_name_ar").eq("id", params.userId).maybeSingle();
    const name = profile?.full_name || "Member";
    await supabase.functions.invoke("send-membership-email", {
      body: { userId: params.userId, emailType: "upgrade", templateData: { userName: name, previousTier: prev.en, newTier: next.en, amount: params.amount } },
    });
  } catch { /* email best-effort */ }

  return sendNotification({
    userId: params.userId,
    title: `🎉 Membership Upgraded to ${next.en}!`, titleAr: `🎉 تم ترقية العضوية إلى ${next.ar}!`,
    body: `Congratulations! Your membership has been upgraded from ${prev.en} to ${next.en}. Enjoy your new premium features!`,
    bodyAr: `تهانينا! تم ترقية عضويتك من ${prev.ar} إلى ${next.ar}. استمتع بالمزايا الجديدة!`,
    type: "success", link: "/membership", channels: ["in_app"],
  });
}

export async function notifyMembershipDowngraded(params: { userId: string; previousTier: string; newTier: string; [key: string]: unknown }) {
  const prev = TIER_LABELS[params.previousTier] || TIER_LABELS.professional;
  const next = TIER_LABELS[params.newTier] || TIER_LABELS.basic;
  return sendNotification({
    userId: params.userId,
    title: `Membership Changed to ${next.en}`, titleAr: `تم تغيير العضوية إلى ${next.ar}`,
    body: `Your membership has been changed from ${prev.en} to ${next.en}. Some features may no longer be available.`,
    bodyAr: `تم تغيير عضويتك من ${prev.ar} إلى ${next.ar}. بعض الميزات قد لا تكون متاحة.`,
    type: "info", link: "/membership", channels: ["in_app", "email"],
  });
}

export async function notifyMembershipRenewed(params: { userId: string; tier: string; nextRenewalDate?: string; expiresAt?: string; amount?: number; [key: string]: unknown }) {
  const tier = TIER_LABELS[params.tier] || TIER_LABELS.basic;

  try {
    const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", params.userId).maybeSingle();
    await supabase.functions.invoke("send-membership-email", {
      body: { userId: params.userId, emailType: "renewal", templateData: { userName: profile?.full_name || "Member", tier: tier.en, nextRenewalDate: params.nextRenewalDate || params.expiresAt || "", amount: params.amount } },
    });
  } catch { /* email best-effort */ }

  return sendNotification({
    userId: params.userId,
    title: `✅ ${tier.en} Membership Renewed`, titleAr: `✅ تم تجديد عضوية ${tier.ar}`,
    body: `Your ${tier.en} membership has been renewed. Next renewal: ${params.nextRenewalDate || params.expiresAt || ""}.`,
    bodyAr: `تم تجديد عضويتك ${tier.ar}. التجديد القادم: ${params.nextRenewalDate || params.expiresAt || ""}.`,
    type: "success", link: "/membership", channels: ["in_app"],
  });
}

export async function notifyMembershipExpiringSoon(params: { userId: string; tier: string; daysLeft: number; expiryDate: string }) {
  const tier = TIER_LABELS[params.tier] || TIER_LABELS.basic;

  try {
    const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", params.userId).maybeSingle();
    await supabase.functions.invoke("send-membership-email", {
      body: { userId: params.userId, emailType: "expiring_soon", templateData: { userName: profile?.full_name || "Member", tier: tier.en, daysLeft: params.daysLeft, expiryDate: params.expiryDate } },
    });
  } catch { /* email best-effort */ }

  return sendNotification({
    userId: params.userId,
    title: `⚠️ ${tier.en} Membership Expiring in ${params.daysLeft} Days`,
    titleAr: `⚠️ عضوية ${tier.ar} تنتهي خلال ${params.daysLeft} أيام`,
    body: `Your ${tier.en} membership expires on ${params.expiryDate}. Renew now to keep your benefits!`,
    bodyAr: `عضويتك ${tier.ar} تنتهي في ${params.expiryDate}. جدد الآن للحفاظ على مزاياك!`,
    type: "warning", link: "/membership", channels: ["in_app", "email"],
  });
}

export async function notifyMembershipExpired(params: { userId: string; tier: string }) {
  const tier = TIER_LABELS[params.tier] || TIER_LABELS.basic;
  return sendNotification({
    userId: params.userId,
    title: `${tier.en} Membership Expired`, titleAr: `انتهت عضوية ${tier.ar}`,
    body: `Your ${tier.en} membership has expired. Renew to regain access to premium features.`,
    bodyAr: `انتهت عضويتك ${tier.ar}. جدد للحصول على الميزات المميزة مرة أخرى.`,
    type: "warning", link: "/membership", channels: ["in_app", "email"],
  });
}

export async function notifyMembershipCancellationSubmitted(params: { userId: string; tier: string; reason?: string; [key: string]: unknown }) {
  const tier = TIER_LABELS[params.tier] || TIER_LABELS.basic;
  return sendNotification({
    userId: params.userId,
    title: `Cancellation Request Received`, titleAr: `تم استلام طلب الإلغاء`,
    body: `Your cancellation request for ${tier.en} membership has been received. Your benefits remain active until the end of the billing period.`,
    bodyAr: `تم استلام طلب إلغاء عضويتك ${tier.ar}. ستبقى مزاياك فعالة حتى نهاية فترة الفوترة الحالية.`,
    type: "info", link: "/membership", channels: ["in_app", "email"],
  });
}

export async function notifyMembershipTrialEnding(params: { userId: string; tier: string; daysLeft: number; trialEndDate: string }) {
  const tier = TIER_LABELS[params.tier] || TIER_LABELS.basic;
  return sendNotification({
    userId: params.userId,
    title: `Free Trial Ending in ${params.daysLeft} Days`, titleAr: `الفترة التجريبية تنتهي خلال ${params.daysLeft} أيام`,
    body: `Your ${tier.en} free trial ends on ${params.trialEndDate}. Subscribe now to continue enjoying premium features!`,
    bodyAr: `فترتك التجريبية لعضوية ${tier.ar} تنتهي في ${params.trialEndDate}. اشترك الآن للاستمرار بالميزات المميزة!`,
    type: "warning", link: "/membership", channels: ["in_app", "email"],
  });
}
