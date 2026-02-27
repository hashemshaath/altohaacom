import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  CreditCard, Calendar, Clock, RefreshCw, Bell, Wallet,
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface SubscriptionDetailsCardProps {
  userId: string;
  profile: any;
}

export function SubscriptionDetailsCard({ userId, profile }: SubscriptionDetailsCardProps) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: card } = useQuery({
    queryKey: ["membership-card-sub", userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("membership_cards")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      return data;
    },
  });

  const toggleAutoRenew = useMutation({
    mutationFn: async (newVal: boolean) => {
      if (!card) throw new Error("No card");
      const { error } = await supabase
        .from("membership_cards")
        .update({ auto_renew: newVal } as any)
        .eq("id", card.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["membership-card-sub", userId] });
      toast({ title: isAr ? "تم تحديث التجديد التلقائي" : "Auto-renewal updated" });
    },
    onError: (e: any) => {
      toast({ variant: "destructive", title: "Error", description: e.message });
    },
  });

  const currentTier = profile?.membership_tier || "basic";
  const isPaid = currentTier === "professional" || currentTier === "enterprise";
  const expiresAt = profile?.membership_expires_at;
  const autoRenew = (card as any)?.auto_renew ?? true;
  const billingCycle = (card as any)?.billing_cycle || "monthly";
  const nextBilling = (card as any)?.next_billing_date || expiresAt;
  const lastPayment = (card as any)?.last_payment_amount;
  const paymentMethod = (card as any)?.payment_method;

  const tierPrices: Record<string, { monthly: number; yearly: number }> = {
    professional: { monthly: 19, yearly: 190 },
    enterprise: { monthly: 99, yearly: 990 },
  };

  const price = tierPrices[currentTier];
  const renewalAmount = price
    ? (billingCycle === "yearly" ? price.yearly : price.monthly)
    : 0;

  if (!isPaid) return null;

  const details = [
    {
      icon: CreditCard,
      label: isAr ? "المستوى الحالي" : "Current Plan",
      value: currentTier === "enterprise" ? (isAr ? "مؤسسي" : "Enterprise") : (isAr ? "احترافي" : "Professional"),
    },
    {
      icon: Calendar,
      label: isAr ? "دورة الفوترة" : "Billing Cycle",
      value: billingCycle === "yearly" ? (isAr ? "سنوي" : "Yearly") : (isAr ? "شهري" : "Monthly"),
    },
    {
      icon: Clock,
      label: isAr ? "الفاتورة القادمة" : "Next Billing",
      value: nextBilling
        ? format(new Date(nextBilling), "d MMM yyyy", { locale: isAr ? ar : undefined })
        : (isAr ? "غير محدد" : "N/A"),
    },
    {
      icon: Wallet,
      label: isAr ? "مبلغ التجديد" : "Renewal Amount",
      value: `${renewalAmount} SAR`,
    },
  ];

  if (paymentMethod) {
    details.push({
      icon: CreditCard,
      label: isAr ? "طريقة الدفع" : "Payment Method",
      value: paymentMethod,
    });
  }

  if (lastPayment !== null && lastPayment !== undefined && lastPayment > 0) {
    details.push({
      icon: Wallet,
      label: isAr ? "آخر دفعة" : "Last Payment",
      value: `${lastPayment} SAR`,
    });
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <CreditCard className="h-4 w-4 text-primary" />
          {isAr ? "تفاصيل الاشتراك" : "Subscription Details"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          {details.map((d) => (
            <div key={d.label} className="flex items-center gap-3 rounded-lg border p-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <d.icon className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{d.label}</p>
                <p className="text-sm font-semibold truncate">{d.value}</p>
              </div>
            </div>
          ))}
        </div>

        <Separator />

        {/* Auto-renewal toggle */}
        <div className="flex items-center justify-between rounded-lg border p-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <RefreshCw className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">{isAr ? "التجديد التلقائي" : "Auto-Renewal"}</p>
              <p className="text-xs text-muted-foreground">
                {autoRenew
                  ? (isAr ? "سيتم تجديد اشتراكك تلقائياً" : "Your subscription will renew automatically")
                  : (isAr ? "لن يتم تجديد اشتراكك تلقائياً" : "Your subscription will not auto-renew")}
              </p>
            </div>
          </div>
          <Switch
            checked={autoRenew}
            onCheckedChange={(v) => toggleAutoRenew.mutate(v)}
            disabled={toggleAutoRenew.isPending}
          />
        </div>

        {!autoRenew && (
          <div className="flex items-start gap-2 rounded-lg bg-destructive/5 border border-destructive/20 p-3">
            <Bell className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
            <p className="text-xs text-destructive">
              {isAr
                ? "تنبيه: اشتراكك لن يتجدد تلقائياً. ستفقد مزايا العضوية عند انتهاء الفترة الحالية."
                : "Warning: Your subscription won't auto-renew. You'll lose membership benefits when the current period ends."}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
