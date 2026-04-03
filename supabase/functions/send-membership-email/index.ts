import { handleCors } from "../_shared/cors.ts";
import { getServiceClient } from "../_shared/auth.ts";
import { jsonResponse, errorResponse } from "../_shared/response.ts";

const BRAND = {
  name: "Altoha",
  color: "hsl(40, 72%, 52%)",
  hex: "#C4952A",
  url: "https://altoha.lovable.app",
};

const SENDER_DOMAIN = "notify.altoha.com";
const FROM_DOMAIN = "notify.altoha.com";

interface EmailRequest {
  type:
    | "expiry_warning" | "expired" | "upgraded" | "downgraded" | "renewed"
    | "trial_started" | "trial_ending" | "trial_expired" | "welcome"
    | "suspended" | "reactivated" | "cancellation_submitted"
    | "cancellation_approved" | "retention_offer";
  user_id: string;
  data?: Record<string, any>;
}

function getEmailTemplate(type: string, data: Record<string, any>) {
  const tierLabels: Record<string, { en: string; ar: string }> = {
    basic: { en: "Basic", ar: "أساسية" },
    professional: { en: "Professional", ar: "احترافية" },
    enterprise: { en: "Enterprise", ar: "مؤسسية" },
  };

  const tier = data.tier || data.new_tier || "basic";
  const tn = tierLabels[tier] || tierLabels.basic;
  const prevTn = tierLabels[data.previous_tier] || tierLabels.basic;
  const name = data.full_name || data.username || "Member";
  const daysLeft = data.days_left || 0;

  const templates: Record<string, { subject_en: string; subject_ar: string; body_en: string; body_ar: string }> = {
    expiry_warning: {
      subject_en: `⏰ Your ${tn.en} membership expires in ${daysLeft} days`,
      subject_ar: `⏰ عضويتك ${tn.ar} تنتهي خلال ${daysLeft} أيام`,
      body_en: `<p>Hi ${name},</p><p>Your <strong>${tn.en}</strong> membership will expire in <strong>${daysLeft} days</strong>.</p><p>Renew now to keep your premium features and avoid losing access to:</p><ul><li>Priority competition registration</li><li>Verified professional badge</li><li>Advanced analytics & insights</li><li>Double loyalty points</li></ul><a href="${BRAND.url}/membership" style="display:inline-block;padding:12px 32px;background:${BRAND.hex};color:#fff;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0;">Renew Now</a><p style="color:#888;font-size:13px;">If you have any questions, contact our support team.</p>`,
      body_ar: `<p>مرحباً ${name}،</p><p>عضويتك <strong>${tn.ar}</strong> تنتهي خلال <strong>${daysLeft} أيام</strong>.</p><p>جدد الآن للحفاظ على ميزاتك المميزة وتجنب فقدان الوصول إلى:</p><ul><li>تسجيل أولوية في المسابقات</li><li>شارة التوثيق المهني</li><li>تحليلات وإحصائيات متقدمة</li><li>نقاط ولاء مضاعفة</li></ul><a href="${BRAND.url}/membership" style="display:inline-block;padding:12px 32px;background:${BRAND.hex};color:#fff;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0;">جدد الآن</a><p style="color:#888;font-size:13px;">إذا كان لديك أي أسئلة، تواصل مع فريق الدعم.</p>`,
    },
    expired: {
      subject_en: `🔴 Your ${tn.en} membership has expired`,
      subject_ar: `🔴 انتهت عضويتك ${tn.ar}`,
      body_en: `<p>Hi ${name},</p><p>Your <strong>${tn.en}</strong> membership has expired and your account has been moved to the Basic tier.</p><p>You've lost access to premium features. Renew now to restore everything:</p><a href="${BRAND.url}/membership" style="display:inline-block;padding:12px 32px;background:${BRAND.hex};color:#fff;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0;">Restore Membership</a>`,
      body_ar: `<p>مرحباً ${name}،</p><p>انتهت عضويتك <strong>${tn.ar}</strong> وتم نقل حسابك إلى المستوى الأساسي.</p><p>فقدت الوصول إلى الميزات المميزة. جدد الآن لاستعادة كل شيء:</p><a href="${BRAND.url}/membership" style="display:inline-block;padding:12px 32px;background:${BRAND.hex};color:#fff;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0;">استعادة العضوية</a>`,
    },
    upgraded: {
      subject_en: `🎉 Welcome to ${tn.en} membership!`,
      subject_ar: `🎉 مرحباً بك في عضوية ${tn.ar}!`,
      body_en: `<p>Hi ${name},</p><p>Congratulations! You've been upgraded from <strong>${prevTn.en}</strong> to <strong>${tn.en}</strong>.</p><p>You now have access to all premium features. Start exploring:</p><a href="${BRAND.url}/profile?tab=membership" style="display:inline-block;padding:12px 32px;background:${BRAND.hex};color:#fff;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0;">View Membership</a>`,
      body_ar: `<p>مرحباً ${name}،</p><p>تهانينا! تمت ترقيتك من <strong>${prevTn.ar}</strong> إلى <strong>${tn.ar}</strong>.</p><p>لديك الآن وصول كامل لجميع الميزات المميزة:</p><a href="${BRAND.url}/profile?tab=membership" style="display:inline-block;padding:12px 32px;background:${BRAND.hex};color:#fff;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0;">عرض العضوية</a>`,
    },
    renewed: {
      subject_en: `✅ Your ${tn.en} membership has been renewed`,
      subject_ar: `✅ تم تجديد عضويتك ${tn.ar}`,
      body_en: `<p>Hi ${name},</p><p>Your <strong>${tn.en}</strong> membership has been successfully renewed${data.expires_at ? ` until <strong>${new Date(data.expires_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</strong>` : ""}.</p><p>Thank you for being a valued member!</p><a href="${BRAND.url}/profile?tab=membership" style="display:inline-block;padding:12px 32px;background:${BRAND.hex};color:#fff;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0;">View Details</a>`,
      body_ar: `<p>مرحباً ${name}،</p><p>تم تجديد عضويتك <strong>${tn.ar}</strong> بنجاح${data.expires_at ? ` حتى <strong>${new Date(data.expires_at).toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric" })}</strong>` : ""}.</p><p>شكراً لكونك عضواً مميزاً!</p><a href="${BRAND.url}/profile?tab=membership" style="display:inline-block;padding:12px 32px;background:${BRAND.hex};color:#fff;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0;">عرض التفاصيل</a>`,
    },
    trial_ending: {
      subject_en: `⏳ Your free trial ends in ${daysLeft} days`,
      subject_ar: `⏳ تنتهي تجربتك المجانية خلال ${daysLeft} أيام`,
      body_en: `<p>Hi ${name},</p><p>Your free <strong>${tn.en}</strong> trial ends in <strong>${daysLeft} days</strong>.</p><p>Upgrade now to keep all your premium features without interruption:</p><a href="${BRAND.url}/membership" style="display:inline-block;padding:12px 32px;background:${BRAND.hex};color:#fff;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0;">Upgrade Now</a>`,
      body_ar: `<p>مرحباً ${name}،</p><p>تنتهي تجربتك المجانية لـ <strong>${tn.ar}</strong> خلال <strong>${daysLeft} أيام</strong>.</p><p>قم بالترقية الآن للحفاظ على جميع ميزاتك المميزة بدون انقطاع:</p><a href="${BRAND.url}/membership" style="display:inline-block;padding:12px 32px;background:${BRAND.hex};color:#fff;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0;">ترقية الآن</a>`,
    },
    trial_expired: {
      subject_en: "⏳ Your free trial has ended",
      subject_ar: "⏳ انتهت تجربتك المجانية",
      body_en: `<p>Hi ${name},</p><p>Your free trial has ended and your account is now on the Basic tier.</p><p>Don't worry — all your data is safe. Upgrade anytime to restore full access:</p><a href="${BRAND.url}/membership" style="display:inline-block;padding:12px 32px;background:${BRAND.hex};color:#fff;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0;">Upgrade Now</a>`,
      body_ar: `<p>مرحباً ${name}،</p><p>انتهت تجربتك المجانية وحسابك الآن على المستوى الأساسي.</p><p>لا تقلق — جميع بياناتك آمنة. قم بالترقية في أي وقت لاستعادة الوصول الكامل:</p><a href="${BRAND.url}/membership" style="display:inline-block;padding:12px 32px;background:${BRAND.hex};color:#fff;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0;">ترقية الآن</a>`,
    },
    downgraded: {
      subject_en: `Your membership has been changed to ${tn.en}`,
      subject_ar: `تم تغيير عضويتك إلى ${tn.ar}`,
      body_en: `<p>Hi ${name},</p><p>Your membership has been changed from <strong>${prevTn.en}</strong> to <strong>${tn.en}</strong>.</p>${data.prorated_credit ? `<p>A prorated credit of <strong>${data.prorated_credit} SAR</strong> has been added to your wallet.</p>` : ""}<a href="${BRAND.url}/profile?tab=membership" style="display:inline-block;padding:12px 32px;background:${BRAND.hex};color:#fff;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0;">View Details</a>`,
      body_ar: `<p>مرحباً ${name}،</p><p>تم تغيير عضويتك من <strong>${prevTn.ar}</strong> إلى <strong>${tn.ar}</strong>.</p>${data.prorated_credit ? `<p>تمت إضافة رصيد تناسبي بقيمة <strong>${data.prorated_credit} ر.س</strong> إلى محفظتك.</p>` : ""}<a href="${BRAND.url}/profile?tab=membership" style="display:inline-block;padding:12px 32px;background:${BRAND.hex};color:#fff;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0;">عرض التفاصيل</a>`,
    },
    suspended: {
      subject_en: `⚠️ Your ${tn.en} membership has been suspended`,
      subject_ar: `⚠️ تم تعليق عضويتك ${tn.ar}`,
      body_en: `<p>Hi ${name},</p><p>Your <strong>${tn.en}</strong> membership has been suspended.</p>${data.reason ? `<p>Reason: ${data.reason}</p>` : ""}<p>Please contact our support team if you have any questions or to resolve this issue.</p><a href="${BRAND.url}/membership" style="display:inline-block;padding:12px 32px;background:${BRAND.hex};color:#fff;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0;">Contact Support</a>`,
      body_ar: `<p>مرحباً ${name}،</p><p>تم تعليق عضويتك <strong>${tn.ar}</strong>.</p>${data.reason ? `<p>السبب: ${data.reason}</p>` : ""}<p>يرجى التواصل مع فريق الدعم إذا كان لديك أي أسئلة أو لحل هذه المسألة.</p><a href="${BRAND.url}/membership" style="display:inline-block;padding:12px 32px;background:${BRAND.hex};color:#fff;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0;">تواصل مع الدعم</a>`,
    },
    reactivated: {
      subject_en: `✅ Your ${tn.en} membership has been reactivated`,
      subject_ar: `✅ تم إعادة تفعيل عضويتك ${tn.ar}`,
      body_en: `<p>Hi ${name},</p><p>Great news! Your <strong>${tn.en}</strong> membership has been reactivated.</p><p>All your premium features are now restored. Welcome back!</p><a href="${BRAND.url}/profile?tab=membership" style="display:inline-block;padding:12px 32px;background:${BRAND.hex};color:#fff;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0;">View Membership</a>`,
      body_ar: `<p>مرحباً ${name}،</p><p>أخبار رائعة! تم إعادة تفعيل عضويتك <strong>${tn.ar}</strong>.</p><p>تم استعادة جميع ميزاتك المميزة. مرحباً بعودتك!</p><a href="${BRAND.url}/profile?tab=membership" style="display:inline-block;padding:12px 32px;background:${BRAND.hex};color:#fff;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0;">عرض العضوية</a>`,
    },
    cancellation_submitted: {
      subject_en: `Your cancellation request has been received`,
      subject_ar: `تم استلام طلب إلغاء عضويتك`,
      body_en: `<p>Hi ${name},</p><p>We've received your cancellation request for the <strong>${tn.en}</strong> membership.</p><p>Our team will review your request and get back to you shortly. You'll continue to have access to all features until a decision is made.</p><a href="${BRAND.url}/profile?tab=membership" style="display:inline-block;padding:12px 32px;background:${BRAND.hex};color:#fff;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0;">View Status</a>`,
      body_ar: `<p>مرحباً ${name}،</p><p>تم استلام طلب إلغاء عضويتك <strong>${tn.ar}</strong>.</p><p>سيقوم فريقنا بمراجعة طلبك والرد عليك قريباً. ستستمر في الوصول لجميع الميزات حتى يتم اتخاذ القرار.</p><a href="${BRAND.url}/profile?tab=membership" style="display:inline-block;padding:12px 32px;background:${BRAND.hex};color:#fff;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0;">عرض الحالة</a>`,
    },
    cancellation_approved: {
      subject_en: `Your membership cancellation has been processed`,
      subject_ar: `تمت معالجة طلب إلغاء عضويتك`,
      body_en: `<p>Hi ${name},</p><p>Your <strong>${tn.en}</strong> membership cancellation has been processed. Your account has been moved to the Basic tier.</p><p>We're sorry to see you go. You can re-subscribe anytime:</p><a href="${BRAND.url}/membership" style="display:inline-block;padding:12px 32px;background:${BRAND.hex};color:#fff;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0;">Resubscribe</a>`,
      body_ar: `<p>مرحباً ${name}،</p><p>تمت معالجة طلب إلغاء عضويتك <strong>${tn.ar}</strong>. تم نقل حسابك إلى المستوى الأساسي.</p><p>نأسف لرحيلك. يمكنك إعادة الاشتراك في أي وقت:</p><a href="${BRAND.url}/membership" style="display:inline-block;padding:12px 32px;background:${BRAND.hex};color:#fff;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0;">إعادة الاشتراك</a>`,
    },
    retention_offer: {
      subject_en: `🎁 We have a special offer for you!`,
      subject_ar: `🎁 لدينا عرض خاص لك!`,
      body_en: `<p>Hi ${name},</p><p>Before you go, we'd love to offer you something special to keep your <strong>${tn.en}</strong> membership:</p>${data.offer ? `<div style="background:#fff8e7;border:2px solid ${BRAND.hex};border-radius:12px;padding:16px;margin:16px 0;text-align:center;"><p style="font-size:18px;font-weight:700;color:${BRAND.hex};margin:0;">${data.offer}</p></div>` : ""}<a href="${BRAND.url}/profile?tab=membership" style="display:inline-block;padding:12px 32px;background:${BRAND.hex};color:#fff;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0;">Accept Offer</a>`,
      body_ar: `<p>مرحباً ${name}،</p><p>قبل أن تغادر، نود أن نقدم لك عرضاً خاصاً للحفاظ على عضويتك <strong>${tn.ar}</strong>:</p>${data.offer_ar || data.offer ? `<div style="background:#fff8e7;border:2px solid ${BRAND.hex};border-radius:12px;padding:16px;margin:16px 0;text-align:center;"><p style="font-size:18px;font-weight:700;color:${BRAND.hex};margin:0;">${data.offer_ar || data.offer}</p></div>` : ""}<a href="${BRAND.url}/profile?tab=membership" style="display:inline-block;padding:12px 32px;background:${BRAND.hex};color:#fff;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0;">قبول العرض</a>`,
    },
  };

  return templates[type] || templates.expired;
}

function wrapInLayout(bodyHtml: string, dir: "ltr" | "rtl") {
  return `<!DOCTYPE html>
<html dir="${dir}" lang="${dir === "rtl" ? "ar" : "en"}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background:#f5f5f5;direction:${dir};">
  <div style="max-width:600px;margin:24px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,${BRAND.hex},#d4a534);padding:24px 32px;text-align:center;">
      <h1 style="margin:0;color:#fff;font-size:24px;font-weight:700;letter-spacing:1px;">${BRAND.name}</h1>
    </div>
    <div style="padding:32px;font-size:15px;line-height:1.7;color:#333;">
      ${bodyHtml}
    </div>
    <div style="padding:16px 32px;background:#fafafa;text-align:center;font-size:12px;color:#999;border-top:1px solid #eee;">
      <p style="margin:4px 0;">© ${new Date().getFullYear()} ${BRAND.name}. ${dir === "rtl" ? "جميع الحقوق محفوظة." : "All rights reserved."}</p>
    </div>
  </div>
</body>
</html>`;
}

Deno.serve(async (req) => {
  const corsRes = handleCors(req);
  if (corsRes) return corsRes;

  try {
    const supabase = getServiceClient();
    const { type, user_id, data = {} } = (await req.json()) as EmailRequest;

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("full_name, full_name_ar, username, email, language_preference")
      .eq("user_id", user_id)
      .single();

    if (profileError || !profile?.email) {
      console.log("User not found or no email for", user_id);
      return jsonResponse({ error: "User not found or no email" }, 404);
    }

    const lang = profile.language_preference || "en";
    const isAr = lang === "ar";
    const enrichedData = {
      ...data,
      full_name: isAr ? profile.full_name_ar || profile.full_name : profile.full_name,
      username: profile.username,
    };

    const template = getEmailTemplate(type, enrichedData);
    const subject = isAr ? template.subject_ar : template.subject_en;
    const bodyHtml = isAr ? template.body_ar : template.body_en;
    const html = wrapInLayout(bodyHtml, isAr ? "rtl" : "ltr");

    const idempotencyKey = `membership-${type}-${user_id}-${new Date().toISOString().slice(0, 10)}`;

    const { error: enqueueError } = await supabase.rpc("enqueue_email", {
      queue_name: "transactional_emails",
      payload: {
        to: profile.email,
        from: `${BRAND.name} <noreply@${FROM_DOMAIN}>`,
        sender_domain: SENDER_DOMAIN,
        subject, html,
        idempotency_key: idempotencyKey,
        purpose: "transactional",
        category: "membership",
      },
    });

    if (enqueueError) {
      console.error("Failed to enqueue membership email:", enqueueError);
      await supabase.from("email_send_log").insert({
        recipient_email: profile.email,
        template_name: `membership_${type}`,
        subject, status: "failed",
        error_message: enqueueError.message,
        metadata: { type, user_id, tier: data.tier || data.new_tier },
      }).catch(() => {});
      return jsonResponse({ success: false, error: "Failed to enqueue email" }, 500);
    }

    await supabase.from("email_send_log").insert({
      recipient_email: profile.email,
      template_name: `membership_${type}`,
      subject, status: "pending",
      metadata: { type, user_id, tier: data.tier || data.new_tier },
    }).catch(() => {});

    console.log(`Membership email enqueued: ${type} for ${profile.email}`);
    return jsonResponse({ success: true, email: profile.email, type, queued: true });
  } catch (err) {
    console.error("Send membership email failed:", err);
    return errorResponse(err);
  }
});
