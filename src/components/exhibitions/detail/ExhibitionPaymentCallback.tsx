import { useEffect, useState, memo } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2, Ticket } from "lucide-react";

interface Props {
  exhibitionId: string;
  isAr: boolean;
  onDismiss: () => void;
}

export const ExhibitionPaymentCallback = memo(function ExhibitionPaymentCallback({ exhibitionId, isAr, onDismiss }: Props) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [status, setStatus] = useState<"verifying" | "success" | "failed">("verifying");
  const t = (en: string, ar: string) => isAr ? ar : en;

  const paymentId = searchParams.get("id");
  const paymentStatus = searchParams.get("status");

  useEffect(() => {
    if (!paymentId) return;

    const verify = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("moyasar-payment", {
          body: { action: "verify-payment", payment_id: paymentId },
        });
        if (error) throw error;
        setStatus(data?.status === "paid" ? "success" : "failed");
      } catch {
        setStatus(paymentStatus === "paid" ? "success" : "failed");
      }
      // Clean URL
      searchParams.delete("payment");
      searchParams.delete("id");
      searchParams.delete("status");
      searchParams.delete("message");
      setSearchParams(searchParams, { replace: true });
    };

    verify();
  }, [paymentId]);

  if (status === "verifying") {
    return (
      <Card className="mb-6 border-primary/20">
        <CardContent className="py-8 text-center space-y-3">
          <Loader2 className="h-10 w-10 mx-auto animate-spin text-primary" />
          <p className="text-sm font-medium">{t("Verifying payment...", "جاري التحقق من الدفع...")}</p>
        </CardContent>
      </Card>
    );
  }

  if (status === "success") {
    return (
      <Card className="mb-6 border-chart-3/30 bg-chart-3/5 animate-in fade-in slide-in-from-top-3 duration-500">
        <CardContent className="py-8 text-center space-y-3">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-chart-3/15 ring-4 ring-chart-3/10">
            <CheckCircle2 className="h-8 w-8 text-chart-3" />
          </div>
          <p className="text-lg font-bold">{t("Payment Successful!", "تمت عملية الدفع بنجاح!")}</p>
          <p className="text-sm text-muted-foreground">{t("Your ticket has been confirmed. Check 'My Tickets' tab.", "تم تأكيد تذكرتك. تحقق من تبويب 'تذاكري'.")}</p>
          <Button variant="outline" size="sm" onClick={onDismiss} className="mt-2">
            <Ticket className="me-2 h-4 w-4" />
            {t("View My Tickets", "عرض تذاكري")}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6 border-destructive/30 bg-destructive/5 animate-in fade-in slide-in-from-top-3 duration-500">
      <CardContent className="py-8 text-center space-y-3">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/15">
          <XCircle className="h-7 w-7 text-destructive" />
        </div>
        <p className="text-lg font-bold">{t("Payment Failed", "فشلت عملية الدفع")}</p>
        <p className="text-sm text-muted-foreground">{t("Please try again or contact support.", "يرجى المحاولة مرة أخرى أو التواصل مع الدعم.")}</p>
        <Button variant="outline" size="sm" onClick={onDismiss}>
          {t("Dismiss", "إغلاق")}
        </Button>
      </CardContent>
    </Card>
  );
});
