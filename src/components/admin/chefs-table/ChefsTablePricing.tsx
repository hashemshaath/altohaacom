import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { DollarSign, Plus, Save, Edit2, Trash2, Calculator } from "lucide-react";

interface PricingPlan {
  id: string;
  name: string;
  name_ar: string | null;
  description: string | null;
  description_ar: string | null;
  base_fee: number;
  per_chef_fee: number;
  currency: string;
  product_category: string | null;
  is_active: boolean;
}

function useEvaluationPricing() {
  return useQuery({
    queryKey: ["evaluation-pricing"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("evaluation_pricing" as any)
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []) as unknown as PricingPlan[];
    },
  });
}

export function ChefsTablePricing() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const queryClient = useQueryClient();
  const { data: plans = [], isLoading } = useEvaluationPricing();
  const [editing, setEditing] = useState<Partial<PricingPlan> | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const saveMutation = useMutation({
    mutationFn: async (plan: Partial<PricingPlan>) => {
      if (plan.id) {
        const { id, ...rest } = plan;
        const { error } = await supabase
          .from("evaluation_pricing" as any)
          .update(rest as any)
          .eq("id", id);
        if (error) throw error;
      } else {
        const { id, ...rest } = plan;
        const { error } = await supabase
          .from("evaluation_pricing" as any)
          .insert(rest as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["evaluation-pricing"] });
      toast.success(isAr ? "تم الحفظ" : "Saved");
      setEditing(null);
      setIsCreating(false);
    },
    onError: () => toast.error(isAr ? "حدث خطأ" : "Error saving"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("evaluation_pricing" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["evaluation-pricing"] });
      toast.success(isAr ? "تم الحذف" : "Deleted");
    },
  });

  if (editing) {
    const chefCounts = [3, 5, 7];
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {isCreating ? (isAr ? "إنشاء خطة تسعير" : "Create Pricing Plan") : (isAr ? "تعديل خطة التسعير" : "Edit Pricing Plan")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>{isAr ? "الاسم (EN)" : "Name (EN)"}</Label>
              <Input value={editing.name || ""} onChange={e => setEditing(p => ({ ...p!, name: e.target.value }))} />
            </div>
            <div>
              <Label>{isAr ? "الاسم (AR)" : "Name (AR)"}</Label>
              <Input value={editing.name_ar || ""} onChange={e => setEditing(p => ({ ...p!, name_ar: e.target.value }))} dir="rtl" />
            </div>
            <div>
              <Label>{isAr ? "الرسوم الأساسية (SAR)" : "Base Fee (SAR)"}</Label>
              <Input type="number" value={editing.base_fee || 0} onChange={e => setEditing(p => ({ ...p!, base_fee: +e.target.value }))} />
            </div>
            <div>
              <Label>{isAr ? "رسوم كل شيف (SAR)" : "Per Chef Fee (SAR)"}</Label>
              <Input type="number" value={editing.per_chef_fee || 0} onChange={e => setEditing(p => ({ ...p!, per_chef_fee: +e.target.value }))} />
            </div>
            <div>
              <Label>{isAr ? "فئة المنتج" : "Product Category"}</Label>
              <Input value={editing.product_category || ""} onChange={e => setEditing(p => ({ ...p!, product_category: e.target.value || null }))} placeholder={isAr ? "الكل" : "All categories"} />
            </div>
            <div className="flex items-center gap-3 pt-6">
              <Switch checked={editing.is_active ?? true} onCheckedChange={v => setEditing(p => ({ ...p!, is_active: v }))} />
              <Label>{isAr ? "نشط" : "Active"}</Label>
            </div>
          </div>

          {/* Price Preview */}
          <Separator />
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Calculator className="h-3.5 w-3.5" />
            {isAr ? "معاينة الأسعار" : "Price Preview"}
          </p>
          <div className="grid grid-cols-3 gap-3">
            {chefCounts.map(count => (
              <div key={count} className="rounded-lg border border-border/30 p-4 text-center">
                <p className="text-xs text-muted-foreground">{count} {isAr ? "طهاة" : "Chefs"}</p>
                <p className="text-2xl font-black tabular-nums text-primary mt-1">
                  {((editing.base_fee || 0) + (editing.per_chef_fee || 0) * count).toLocaleString()}
                </p>
                <p className="text-[10px] text-muted-foreground">SAR</p>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setEditing(null); setIsCreating(false); }}>{isAr ? "إلغاء" : "Cancel"}</Button>
            <Button onClick={() => saveMutation.mutate(editing)} disabled={!editing.name} className="gap-1.5">
              <Save className="h-4 w-4" />{isAr ? "حفظ" : "Save"}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold">{isAr ? "خطط تسعير التقييم" : "Evaluation Pricing Plans"}</h3>
          <p className="text-xs text-muted-foreground">{isAr ? "رسوم أساسية + رسوم لكل شيف" : "Base fee + per-chef fee model"}</p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => { setEditing({ name: "", base_fee: 500, per_chef_fee: 200, currency: "SAR", is_active: true }); setIsCreating(true); }}>
          <Plus className="h-3.5 w-3.5" />{isAr ? "خطة جديدة" : "New Plan"}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {plans.map(plan => (
          <Card key={plan.id} className="border-border/40">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-bold text-sm">{isAr && plan.name_ar ? plan.name_ar : plan.name}</h4>
                  <div className="flex gap-1.5 mt-1">
                    {plan.is_active && <Badge className="text-[8px] h-4">{isAr ? "نشط" : "Active"}</Badge>}
                    {plan.product_category && <Badge variant="outline" className="text-[8px] h-4">{plan.product_category}</Badge>}
                  </div>
                </div>
                <DollarSign className="h-5 w-5 text-primary" />
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="rounded-lg bg-muted/50 p-3 text-center">
                  <p className="text-xl font-black tabular-nums">{plan.base_fee.toLocaleString()}</p>
                  <p className="text-[9px] text-muted-foreground">{isAr ? "رسوم أساسية" : "Base Fee"} (SAR)</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3 text-center">
                  <p className="text-xl font-black tabular-nums">+{plan.per_chef_fee.toLocaleString()}</p>
                  <p className="text-[9px] text-muted-foreground">{isAr ? "لكل شيف" : "Per Chef"} (SAR)</p>
                </div>
              </div>

              <p className="text-xs text-muted-foreground mb-3">
                {isAr ? "مثال: 3 طهاة =" : "Example: 3 chefs ="} <span className="font-bold text-foreground">{(plan.base_fee + plan.per_chef_fee * 3).toLocaleString()} SAR</span>
              </p>

              <div className="flex gap-1.5 border-t border-border/30 pt-3">
                <Button size="sm" variant="outline" className="flex-1 gap-1 h-7 text-[10px]" onClick={() => setEditing(plan)}>
                  <Edit2 className="h-3 w-3" />{isAr ? "تعديل" : "Edit"}
                </Button>
                <Button size="sm" variant="outline" className="h-7 text-[10px] text-destructive hover:text-destructive" onClick={() => deleteMutation.mutate(plan.id)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
