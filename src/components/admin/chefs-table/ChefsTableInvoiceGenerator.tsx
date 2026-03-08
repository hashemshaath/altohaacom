import { memo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { FileText, DollarSign, Receipt, ChefHat, Send, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { executeEvaluationWorkflow } from "@/lib/evaluationWorkflows";
import { AnimatedCounter } from "@/components/ui/animated-counter";

interface PricingPlan {
  id: string; name: string; name_ar: string | null;
  base_fee: number; per_chef_fee: number; currency: string; product_category: string | null;
}

export const ChefsTableInvoiceGenerator = memo(function ChefsTableInvoiceGenerator({ session }: { session: any }) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedPricingId, setSelectedPricingId] = useState<string>("");

  const { data: pricingPlans = [] } = useQuery({
    queryKey: ["evaluation-pricing"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("evaluation_pricing" as any)
        .select("id, name, name_ar, base_fee, per_chef_fee, currency, product_category, is_active")
        .eq("is_active", true);
      if (error) throw error;
      return (data || []) as unknown as PricingPlan[];
    },
  });

  const selectedPlan = pricingPlans.find(p => p.id === selectedPricingId);
  const chefCount = session.max_chefs || 3;
  const totalCost = selectedPlan ? selectedPlan.base_fee + selectedPlan.per_chef_fee * chefCount : 0;

  const generateInvoiceMutation = useMutation({
    mutationFn: async () => {
      if (!selectedPlan) throw new Error("No pricing plan selected");
      
      const items = [
        { description: isAr ? "رسوم أساسية للتقييم" : "Evaluation Base Fee", description_ar: "رسوم أساسية للتقييم", quantity: 1, unit_price: selectedPlan.base_fee, total: selectedPlan.base_fee },
        { description: `${isAr ? "رسوم الطهاة" : "Chef Evaluation Fee"} (${chefCount}x)`, description_ar: `رسوم الطهاة (${chefCount}×)`, quantity: chefCount, unit_price: selectedPlan.per_chef_fee, total: selectedPlan.per_chef_fee * chefCount },
      ];

      const taxRate = 15;
      const subtotal = totalCost;
      const taxAmount = Math.round(subtotal * taxRate) / 100;
      const totalAmount = subtotal + taxAmount;

      // Create invoice
      const { data: invoice, error } = await supabase
        .from("invoices" as any)
        .insert({
          company_id: session.company_id,
          session_id: session.id,
          title: `Chef's Table Evaluation — ${session.product_name}`,
          title_ar: `تقييم طاولة الشيف — ${session.product_name_ar || session.product_name}`,
          description: `Evaluation session for ${session.product_name} with ${chefCount} chefs`,
          description_ar: `جلسة تقييم ${session.product_name_ar || session.product_name} مع ${chefCount} طهاة`,
          items,
          subtotal,
          tax_rate: taxRate,
          tax_amount: taxAmount,
          amount: totalAmount,
          currency: "SAR",
          status: "draft",
          issued_by: user?.id,
          due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        } as any)
        .select()
        .single();
      if (error) throw error;

      // Update session with cost and invoice
      await supabase
        .from("chefs_table_sessions" as any)
        .update({ pricing_id: selectedPlan.id, total_cost: totalAmount, invoice_id: (invoice as any).id } as any)
        .eq("id", session.id);

      return invoice;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chefs-table-sessions"] });
      toast.success(isAr ? "تم إنشاء الفاتورة بنجاح" : "Invoice generated successfully");
      executeEvaluationWorkflow("invoice_generated", { sessionId: session.id });
    },
    onError: () => toast.error(isAr ? "حدث خطأ" : "Failed to generate invoice"),
  });

  const hasInvoice = !!session.invoice_id;

  return (
    <Card className="border-border/40">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Receipt className="h-4 w-4 text-primary" />
          {isAr ? "الفوترة" : "Billing"}
          {hasInvoice && <Badge className="text-[8px] h-4">{isAr ? "تم إنشاء الفاتورة" : "Invoice Created"}</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasInvoice ? (
          <div className="rounded-xl bg-chart-5/5 border border-chart-5/20 p-4 text-center">
            <CheckCircle2 className="h-8 w-8 text-chart-5 mx-auto mb-2" />
            <p className="font-bold text-sm">{isAr ? "الفاتورة جاهزة" : "Invoice Generated"}</p>
            <p className="text-xl font-black text-primary tabular-nums mt-1">
              <AnimatedCounter value={Math.round(session.total_cost || 0)} className="inline" /> SAR
            </p>
            <p className="text-[10px] text-muted-foreground mt-1">{chefCount} {isAr ? "طهاة" : "chefs"}</p>
          </div>
        ) : (
          <>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">{isAr ? "خطة التسعير" : "Pricing Plan"}</p>
              <Select value={selectedPricingId} onValueChange={setSelectedPricingId}>
                <SelectTrigger><SelectValue placeholder={isAr ? "اختر خطة التسعير" : "Select pricing plan"} /></SelectTrigger>
                <SelectContent>
                  {pricingPlans.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      {isAr && p.name_ar ? p.name_ar : p.name} — {p.base_fee}+{p.per_chef_fee}/chef
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedPlan && (
              <>
                <Separator />
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{isAr ? "رسوم أساسية" : "Base Fee"}</span>
                    <span className="font-bold tabular-nums"><AnimatedCounter value={selectedPlan.base_fee} /> SAR</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{chefCount} {isAr ? "طهاة" : "chefs"} × {selectedPlan.per_chef_fee} SAR</span>
                    <span className="font-bold tabular-nums"><AnimatedCounter value={selectedPlan.per_chef_fee * chefCount} /> SAR</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{isAr ? "المجموع الفرعي" : "Subtotal"}</span>
                    <span className="font-bold tabular-nums"><AnimatedCounter value={totalCost} /> SAR</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{isAr ? "ضريبة القيمة المضافة" : "VAT"} (15%)</span>
                    <span className="font-bold tabular-nums"><AnimatedCounter value={Math.round(totalCost * 0.15)} /> SAR</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="font-bold">{isAr ? "الإجمالي" : "Total"}</span>
                    <span className="text-xl font-black text-primary tabular-nums"><AnimatedCounter value={totalCost + Math.round(totalCost * 0.15)} /> SAR</span>
                  </div>
                </div>

                <Button className="w-full gap-1.5" onClick={() => generateInvoiceMutation.mutate()} disabled={generateInvoiceMutation.isPending}>
                  <FileText className="h-4 w-4" />
                  {isAr ? "إنشاء الفاتورة" : "Generate Invoice"}
                </Button>
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
