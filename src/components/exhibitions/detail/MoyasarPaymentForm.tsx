import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Lock, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  exhibitionId: string;
  exhibitionTitle: string;
  ticketId?: string;
  amount: number;
  currency?: string;
  onSuccess?: (paymentId: string) => void;
  onCancel?: () => void;
  isAr: boolean;
}

export function MoyasarPaymentForm({
  exhibitionId, exhibitionTitle, ticketId, amount, currency = "SAR",
  onSuccess, onCancel, isAr,
}: Props) {
  const t = (en: string, ar: string) => isAr ? ar : en;
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"form" | "processing" | "success">("form");
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [expMonth, setExpMonth] = useState("");
  const [expYear, setExpYear] = useState("");
  const [cvc, setCvc] = useState("");

  const formatCardNumber = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(\d{4})/g, "$1 ").trim();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error(t("Please login first", "يرجى تسجيل الدخول أولاً"));
      return;
    }

    setLoading(true);
    setStep("processing");

    try {
      const callbackUrl = `${window.location.origin}/exhibitions/${exhibitionId}?payment=callback`;

      const { data, error } = await supabase.functions.invoke("moyasar-payment", {
        body: {
          action: "create-payment",
          amount,
          currency,
          description: `Ticket for ${exhibitionTitle}`,
          ticket_id: ticketId,
          callback_url: callbackUrl,
          source: {
            type: "creditcard",
            name: cardName,
            number: cardNumber.replace(/\s/g, ""),
            month: expMonth,
            year: expYear,
            cvc,
          },
        },
      });

      if (error) throw error;

      if (data?.payment_url) {
        // 3D Secure redirect
        window.location.href = data.payment_url;
        return;
      }

      if (data?.status === "paid") {
        setStep("success");
        toast.success(t("Payment successful!", "تمت عملية الدفع بنجاح!"));
        onSuccess?.(data.payment_id);
      } else {
        setStep("form");
        toast.error(t("Payment was not completed", "لم تتم عملية الدفع"));
      }
    } catch (err: any) {
      console.error("Payment error:", err);
      setStep("form");
      toast.error(err.message || t("Payment failed", "فشلت عملية الدفع"));
    } finally {
      setLoading(false);
    }
  };

  if (step === "success") {
    return (
      <Card className="border-chart-3/30 bg-chart-3/5">
        <CardContent className="py-8 text-center space-y-3">
          <CheckCircle2 className="h-12 w-12 mx-auto text-chart-3" />
          <p className="font-semibold">{t("Payment Successful!", "تمت عملية الدفع بنجاح!")}</p>
          <p className="text-sm text-muted-foreground">{t("Your ticket has been confirmed", "تم تأكيد تذكرتك")}</p>
        </CardContent>
      </Card>
    );
  }

  if (step === "processing") {
    return (
      <Card>
        <CardContent className="py-12 text-center space-y-3">
          <Loader2 className="h-10 w-10 mx-auto animate-spin text-primary" />
          <p className="text-sm font-medium">{t("Processing payment...", "جاري معالجة الدفع...")}</p>
          <p className="text-xs text-muted-foreground">{t("Please don't close this page", "يرجى عدم إغلاق هذه الصفحة")}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/15">
      <CardHeader className="py-3 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <CreditCard className="h-3.5 w-3.5 text-primary" />
            {t("Payment Details", "تفاصيل الدفع")}
          </CardTitle>
          <Badge variant="outline" className="text-xs gap-1">
            <Lock className="h-2.5 w-2.5" />
            {t("Secure", "آمن")}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="mb-4 rounded-lg bg-muted/40 p-3 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{t("Total Amount", "المبلغ الإجمالي")}</span>
          <span className="text-lg font-bold text-primary">{amount.toFixed(2)} {currency}</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label className="text-xs">{t("Card Number", "رقم البطاقة")}</Label>
            <Input
              value={cardNumber}
              onChange={e => setCardNumber(formatCardNumber(e.target.value))}
              placeholder="4111 1111 1111 1111"
              className="font-mono text-sm"
              maxLength={19}
              required
            />
          </div>

          <div>
            <Label className="text-xs">{t("Cardholder Name", "اسم حامل البطاقة")}</Label>
            <Input
              value={cardName}
              onChange={e => setCardName(e.target.value)}
              placeholder={t("Full name on card", "الاسم الكامل على البطاقة")}
              className="text-sm"
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label className="text-xs">{t("Month", "الشهر")}</Label>
              <Input
                value={expMonth}
                onChange={e => setExpMonth(e.target.value.replace(/\D/g, "").slice(0, 2))}
                placeholder="MM"
                className="text-sm text-center font-mono"
                maxLength={2}
                required
              />
            </div>
            <div>
              <Label className="text-xs">{t("Year", "السنة")}</Label>
              <Input
                value={expYear}
                onChange={e => setExpYear(e.target.value.replace(/\D/g, "").slice(0, 2))}
                placeholder="YY"
                className="text-sm text-center font-mono"
                maxLength={2}
                required
              />
            </div>
            <div>
              <Label className="text-xs">CVC</Label>
              <Input
                value={cvc}
                onChange={e => setCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="123"
                className="text-sm text-center font-mono"
                maxLength={4}
                type="password"
                required
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="submit" className="flex-1" disabled={loading}>
              <CreditCard className="h-4 w-4 me-2" />
              {t("Pay Now", "ادفع الآن")} — {amount.toFixed(2)} {currency}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                {t("Cancel", "إلغاء")}
              </Button>
            )}
          </div>

          <p className="text-[9px] text-muted-foreground text-center flex items-center justify-center gap-1">
            <Lock className="h-2.5 w-2.5" />
            {t("Secured by Moyasar • Saudi payment gateway", "مؤمن بواسطة مُيسّر • بوابة دفع سعودية")}
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
