import { sendNotification, supabase } from "./shared";

export async function notifySupplierFeatured(params: { companyId: string; companyName: string; companyNameAr?: string }) {
  const { data: contacts } = await supabase
    .from("company_contacts").select("user_id").eq("company_id", params.companyId).not("user_id", "is", null);
  if (!contacts?.length) return;
  for (const contact of contacts) {
    if (!contact.user_id) continue;
    await sendNotification({
      userId: contact.user_id,
      title: `Your company "${params.companyName}" is now featured in Pro Suppliers!`,
      titleAr: params.companyNameAr ? `شركتك "${params.companyNameAr}" مميّزة الآن في دليل الموردين المحترفين!` : undefined,
      body: "Your supplier profile is live and visible to all professional chefs.",
      bodyAr: "ملفك كمورد أصبح مباشراً ومرئياً لجميع الشيفات المحترفين.",
      type: "success", link: `/pro-suppliers/${params.companyId}`, channels: ["in_app", "email"],
    });
  }
}

export async function notifySupplierNewReview(params: { companyId: string; reviewerName: string; rating: number }) {
  const { data: contacts } = await supabase
    .from("company_contacts").select("user_id").eq("company_id", params.companyId).eq("is_primary", true).not("user_id", "is", null);
  if (!contacts?.length) return;
  const stars = "★".repeat(params.rating) + "☆".repeat(5 - params.rating);
  for (const contact of contacts) {
    if (!contact.user_id) continue;
    await sendNotification({
      userId: contact.user_id,
      title: `New ${params.rating}-star review from ${params.reviewerName}`, titleAr: `تقييم جديد ${stars} من ${params.reviewerName}`,
      body: `${params.reviewerName} left a ${params.rating}-star review on your supplier profile`,
      bodyAr: `${params.reviewerName} ترك تقييم ${params.rating} نجوم على ملفك التعريفي`,
      type: "info", link: "/company/supplier-profile", channels: ["in_app"],
    });
  }
}

export async function notifySupplierInquiry(params: { companyId: string; senderName: string; subject: string }) {
  const { data: contacts } = await supabase
    .from("company_contacts").select("user_id").eq("company_id", params.companyId).eq("is_primary", true).not("user_id", "is", null);
  if (!contacts?.length) return;
  for (const contact of contacts) {
    if (!contact.user_id) continue;
    await sendNotification({
      userId: contact.user_id,
      title: `New inquiry from ${params.senderName}`, titleAr: `استفسار جديد من ${params.senderName}`,
      body: params.subject, bodyAr: params.subject,
      type: "info", link: "/company/communications", channels: ["in_app", "email"],
    });
  }
}
