import { memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Download } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Button } from "@/components/ui/button";

interface MembershipInvoicesSectionProps {
  userId: string;
}

export const MembershipInvoicesSection = memo(function MembershipInvoicesSection({ userId }: MembershipInvoicesSectionProps) {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data: invoices, isLoading } = useQuery({
    queryKey: ["membership-invoices", userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("invoices")
        .select("id, invoice_number, amount, currency, status, title, title_ar, created_at, paid_at, payment_method, tax_amount, subtotal")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20);
      return data || [];
    },
  });

  const statusConfig: Record<string, { label: string; labelAr: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    paid: { label: "Paid", labelAr: "مدفوعة", variant: "default" },
    pending: { label: "Pending", labelAr: "معلقة", variant: "secondary" },
    overdue: { label: "Overdue", labelAr: "متأخرة", variant: "destructive" },
    draft: { label: "Draft", labelAr: "مسودة", variant: "outline" },
    cancelled: { label: "Cancelled", labelAr: "ملغاة", variant: "outline" },
    sent: { label: "Sent", labelAr: "مرسلة", variant: "secondary" },
  };

  if (isLoading) return null;
  if (!invoices || invoices.length === 0) return null;

  const totalPaid = invoices.filter(i => i.status === "paid").reduce((s, i) => s + (i.amount || 0), 0);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4 text-primary" />
            {isAr ? "الفواتير والمدفوعات" : "Invoices & Payments"}
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            {isAr ? `${totalPaid} ر.س مدفوع` : `${totalPaid} SAR paid`}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="max-h-[400px]">
          <div className="space-y-2">
            {invoices.map((inv) => {
              const st = statusConfig[inv.status || "draft"] || statusConfig.draft;
              return (
                <div
                  key={inv.id}
                  className="flex items-center gap-3 rounded-xl border p-3 hover:bg-accent/30 transition-colors"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <FileText className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">
                        {isAr ? (inv.title_ar || inv.title || inv.invoice_number) : (inv.title || inv.invoice_number)}
                      </p>
                      <Badge variant={st.variant} className="text-[10px] shrink-0">
                        {isAr ? st.labelAr : st.label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                      <span className="font-mono">{inv.invoice_number}</span>
                      <span>•</span>
                      <span>{format(new Date(inv.created_at), "d MMM yyyy", { locale: isAr ? ar : undefined })}</span>
                      {inv.payment_method && (
                        <>
                          <span>•</span>
                          <span>{inv.payment_method}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-end shrink-0">
                    <p className="text-sm font-bold">{inv.amount} {inv.currency || "SAR"}</p>
                    {inv.tax_amount ? (
                      <p className="text-[10px] text-muted-foreground">
                        {isAr ? "ضريبة:" : "Tax:"} {inv.tax_amount} SAR
                      </p>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
