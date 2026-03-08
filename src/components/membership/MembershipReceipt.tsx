import { useRef, useState, memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Download, Loader2, CheckCircle2, Crown, Star } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface MembershipReceiptProps {
  receiptData: {
    userName: string;
    userEmail: string;
    tier: string;
    previousTier: string;
    billingCycle: "monthly" | "yearly";
    amount: number;
    currency?: string;
    transactionDate: Date;
    expiresAt: Date;
    receiptNumber: string;
  };
}

const TIER_LABELS: Record<string, { en: string; ar: string }> = {
  basic: { en: "Basic", ar: "الأساسي" },
  professional: { en: "Professional", ar: "الاحترافي" },
  enterprise: { en: "Enterprise", ar: "المؤسسي" },
};

export function MembershipReceipt({ receiptData }: MembershipReceiptProps) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const receiptRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (!receiptRef.current) return;
    setDownloading(true);

    try {
      const html2canvas = (await import("html2canvas")).default;
      await document.fonts.ready;

      const canvas = await html2canvas(receiptRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: null,
        logging: false,
      });

      const link = document.createElement("a");
      link.download = `membership-receipt-${receiptData.receiptNumber}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast.success(isAr ? "تم تحميل الإيصال" : "Receipt downloaded");
    } catch {
      toast.error(isAr ? "فشل التحميل" : "Download failed");
    } finally {
      setDownloading(false);
    }
  };

  const TierIcon = receiptData.tier === "enterprise" ? Crown : Star;

  return (
    <div className="space-y-3">
      <div ref={receiptRef} className="rounded-xl overflow-hidden">
        <Card className="border-border/50 shadow-none">
          <CardContent className="p-6 space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-bold">{isAr ? "إيصال العضوية" : "Membership Receipt"}</p>
                  <p className="text-[10px] text-muted-foreground">#{receiptData.receiptNumber}</p>
                </div>
              </div>
              <Badge variant="outline" className="text-[10px]">
                {isAr ? "مدفوع" : "PAID"}
              </Badge>
            </div>

            <Separator />

            {/* Member Info */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">
                  {isAr ? "العضو" : "Member"}
                </p>
                <p className="font-medium text-sm">{receiptData.userName}</p>
                <p className="text-xs text-muted-foreground">{receiptData.userEmail}</p>
              </div>
              <div className="text-end">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">
                  {isAr ? "التاريخ" : "Date"}
                </p>
                <p className="font-medium text-sm">{format(receiptData.transactionDate, "MMM d, yyyy")}</p>
              </div>
            </div>

            <Separator />

            {/* Plan Details */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${receiptData.tier === "enterprise" ? "bg-chart-2/10" : "bg-primary/10"}`}>
                    <TierIcon className={`h-4 w-4 ${receiptData.tier === "enterprise" ? "text-chart-2" : "text-primary"}`} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">
                      {TIER_LABELS[receiptData.tier]?.[isAr ? "ar" : "en"]} {isAr ? "العضوية" : "Membership"}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {receiptData.billingCycle === "yearly"
                        ? (isAr ? "اشتراك سنوي" : "Yearly subscription")
                        : (isAr ? "اشتراك شهري" : "Monthly subscription")}
                    </p>
                  </div>
                </div>
                <p className="text-lg font-bold">
                  {receiptData.amount} <span className="text-xs font-normal text-muted-foreground">{receiptData.currency || "SAR"}</span>
                </p>
              </div>

              {receiptData.previousTier !== receiptData.tier && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{TIER_LABELS[receiptData.previousTier]?.[isAr ? "ar" : "en"]}</span>
                  <span>→</span>
                  <span className="font-medium text-foreground">{TIER_LABELS[receiptData.tier]?.[isAr ? "ar" : "en"]}</span>
                </div>
              )}
            </div>

            <Separator />

            {/* Summary */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{isAr ? "المجموع الفرعي" : "Subtotal"}</span>
                <span>{receiptData.amount} {receiptData.currency || "SAR"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{isAr ? "ضريبة القيمة المضافة (15%)" : "VAT (15%)"}</span>
                <span>{(receiptData.amount * 0.15).toFixed(2)} {receiptData.currency || "SAR"}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-base">
                <span>{isAr ? "الإجمالي" : "Total"}</span>
                <span>{(receiptData.amount * 1.15).toFixed(2)} {receiptData.currency || "SAR"}</span>
              </div>
            </div>

            <Separator />

            {/* Footer */}
            <div className="grid grid-cols-2 gap-4 text-[10px] text-muted-foreground">
              <div>
                <p className="uppercase tracking-wider mb-0.5">{isAr ? "صالح حتى" : "Valid Until"}</p>
                <p className="text-xs text-foreground font-medium">{format(receiptData.expiresAt, "MMM d, yyyy")}</p>
              </div>
              <div className="text-end">
                <p className="uppercase tracking-wider mb-0.5">{isAr ? "طريقة الدفع" : "Payment Method"}</p>
                <p className="text-xs text-foreground font-medium">{isAr ? "بطاقة ائتمان" : "Credit Card"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Button onClick={handleDownload} disabled={downloading} variant="outline" className="w-full gap-2">
        {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
        {isAr ? "تحميل الإيصال" : "Download Receipt"}
      </Button>
    </div>
  );
}
