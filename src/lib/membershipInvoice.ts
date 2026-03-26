import { supabase } from "@/integrations/supabase/client";

const VAT_RATE = 0.15; // 15% Saudi VAT

const TIER_PRICES: Record<string, number> = {
  professional: 19,
  enterprise: 99,
};

const TIER_LABELS = {
  basic: { en: "Basic Membership", ar: "العضوية الأساسية" },
  professional: { en: "Professional Membership", ar: "العضوية الاحترافية" },
  enterprise: { en: "Enterprise Membership", ar: "العضوية المؤسسية" },
};

const ACTION_LABELS: Record<string, { en: string; ar: string }> = {
  subscription: { en: "New Subscription", ar: "اشتراك جديد" },
  renewal: { en: "Renewal", ar: "تجديد" },
  upgrade: { en: "Upgrade", ar: "ترقية" },
  downgrade: { en: "Downgrade", ar: "تخفيض" },
};

export async function createMembershipInvoice(params: {
  userId: string;
  tier: string;
  action: "subscription" | "renewal" | "upgrade" | "downgrade";
  amount?: number;
  currency?: string;
  periodStart?: string;
  periodEnd?: string;
  notes?: string;
  discount?: number;
}) {
  const { userId, tier, action, currency = "SAR", notes, discount = 0 } = params;
  const baseAmount = params.amount ?? TIER_PRICES[tier] ?? 0;
  const labels = TIER_LABELS[tier as keyof typeof TIER_LABELS] || TIER_LABELS.basic;
  const actionLabel = ACTION_LABELS[action] || ACTION_LABELS.subscription;

  // Calculate VAT-inclusive pricing
  const subtotal = Math.max(baseAmount - discount, 0);
  const taxAmount = Math.round(subtotal * VAT_RATE * 100) / 100;
  const totalAmount = Math.round((subtotal + taxAmount) * 100) / 100;

  const invoiceNumber = `MEM-${Date.now().toString(36).toUpperCase()}`;
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 7);

  const periodNote = params.periodStart && params.periodEnd
    ? ` (${new Date(params.periodStart).toLocaleDateString("en-CA")} → ${new Date(params.periodEnd).toLocaleDateString("en-CA")})`
    : "";

  const { data, error } = await supabase.from("invoices").insert({
    user_id: userId,
    invoice_number: invoiceNumber,
    amount: totalAmount,
    subtotal,
    tax_rate: VAT_RATE * 100,
    tax_amount: taxAmount,
    discount_amount: discount > 0 ? discount : null,
    currency,
    status: "pending",
    title: `${labels.en} — ${actionLabel.en}`,
    title_ar: `${labels.ar} — ${actionLabel.ar}`,
    description: `${actionLabel.en} for ${labels.en}${periodNote}`,
    description_ar: `${actionLabel.ar} لـ${labels.ar}${periodNote}`,
    due_date: dueDate.toISOString(),
    notes: notes || `${action} to ${tier} tier`,
    notes_ar: notes
      ? undefined
      : `${actionLabel.ar} إلى مستوى ${labels.ar}`,
    items: [
      {
        description: `${labels.en} — ${actionLabel.en}`,
        description_ar: `${labels.ar} — ${actionLabel.ar}`,
        quantity: 1,
        unit_price: baseAmount,
        total: subtotal,
      },
      ...(discount > 0
        ? [{
            description: "Prorated credit",
            description_ar: "رصيد تناسبي",
            quantity: 1,
            unit_price: -discount,
            total: -discount,
          }]
        : []),
      {
        description: `VAT (${VAT_RATE * 100}%)`,
        description_ar: `ضريبة القيمة المضافة (${VAT_RATE * 100}%)`,
        quantity: 1,
        unit_price: taxAmount,
        total: taxAmount,
      },
    ],
  }).select("id, invoice_number, amount, subtotal, tax_amount").single();

  if (error) {
    console.error("Failed to create membership invoice:", error);
    return null;
  }

  return data;
}

export async function markInvoicePaid(invoiceId: string, paymentMethod?: string) {
  const { error } = await supabase
    .from("invoices")
    .update({
      status: "paid",
      paid_at: new Date().toISOString(),
      ...(paymentMethod ? { payment_method: paymentMethod } : {}),
    })
    .eq("id", invoiceId);

  if (error) console.error("Failed to mark invoice paid:", error);
  return !error;
}

export async function voidInvoice(invoiceId: string) {
  const { error } = await supabase
    .from("invoices")
    .update({ status: "void" })
    .eq("id", invoiceId);

  if (error) console.error("Failed to void invoice:", error);
  return !error;
}
