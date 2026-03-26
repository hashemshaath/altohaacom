import { supabase } from "@/integrations/supabase/client";

const TIER_PRICES: Record<string, number> = {
  professional: 19,
  enterprise: 99,
};

const TIER_LABELS = {
  basic: { en: "Basic Membership", ar: "العضوية الأساسية" },
  professional: { en: "Professional Membership", ar: "العضوية الاحترافية" },
  enterprise: { en: "Enterprise Membership", ar: "العضوية المؤسسية" },
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
}) {
  const { userId, tier, action, currency = "SAR", notes } = params;
  const amount = params.amount ?? TIER_PRICES[tier] ?? 0;
  const labels = TIER_LABELS[tier as keyof typeof TIER_LABELS] || TIER_LABELS.basic;

  const actionLabels: Record<string, { en: string; ar: string }> = {
    subscription: { en: "New Subscription", ar: "اشتراك جديد" },
    renewal: { en: "Renewal", ar: "تجديد" },
    upgrade: { en: "Upgrade", ar: "ترقية" },
    downgrade: { en: "Downgrade", ar: "تخفيض" },
  };

  const actionLabel = actionLabels[action] || actionLabels.subscription;

  const invoiceNumber = `MEM-${Date.now().toString(36).toUpperCase()}`;
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 7);

  const { data, error } = await supabase.from("invoices").insert({
    user_id: userId,
    invoice_number: invoiceNumber,
    amount,
    currency,
    status: "pending",
    title: `${labels.en} - ${actionLabel.en}`,
    title_ar: `${labels.ar} - ${actionLabel.ar}`,
    due_date: dueDate.toISOString(),
    notes: notes || `${action} to ${tier} tier`,
    items: [
      {
        description: labels.en,
        description_ar: labels.ar,
        quantity: 1,
        unit_price: amount,
        total: amount,
      },
    ],
  }).select("id, invoice_number").single();

  if (error) {
    console.error("Failed to create membership invoice:", error);
    return null;
  }

  return data;
}

export async function markInvoicePaid(invoiceId: string) {
  const { error } = await supabase
    .from("invoices")
    .update({ status: "paid", paid_at: new Date().toISOString() })
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
