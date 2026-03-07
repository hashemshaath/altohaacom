import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, Infinity, RotateCcw } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

const TIERS = ["basic", "professional", "enterprise"] as const;
const TIER_LABELS: Record<string, { en: string; ar: string }> = {
  basic: { en: "Basic", ar: "الأساسي" },
  professional: { en: "Professional", ar: "الاحترافي" },
  enterprise: { en: "Enterprise", ar: "المؤسسي" },
};

type LimitRow = {
  id: string;
  tier: string;
  benefit_code: string;
  benefit_name: string;
  benefit_name_ar: string | null;
  monthly_limit: number | null;
  is_active: boolean;
  sort_order: number;
  category: string;
  icon_name: string | null;
};

export default function AdminBenefitLimitsEditor() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const queryClient = useQueryClient();

  const { data: limits, isLoading } = useQuery({
    queryKey: ["admin-benefit-limits"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("membership_benefit_limits")
        .select("id, tier, benefit_code, benefit_name, benefit_name_ar, monthly_limit, is_active, sort_order, category, icon_name")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as LimitRow[];
    },
  });

  const [edits, setEdits] = useState<Record<string, { monthly_limit: number | null; is_active: boolean }>>({});
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (limits) {
      const initial: Record<string, { monthly_limit: number | null; is_active: boolean }> = {};
      for (const l of limits) {
        initial[l.id] = { monthly_limit: l.monthly_limit, is_active: l.is_active };
      }
      setEdits(initial);
      setHasChanges(false);
    }
  }, [limits]);

  const updateEdit = (id: string, field: "monthly_limit" | "is_active", value: number | null | boolean) => {
    setEdits((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
    setHasChanges(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const updates = Object.entries(edits).map(([id, vals]) =>
        supabase
          .from("membership_benefit_limits")
          .update({ monthly_limit: vals.monthly_limit, is_active: vals.is_active })
          .eq("id", id)
      );
      const results = await Promise.all(updates);
      const errors = results.filter((r) => r.error);
      if (errors.length > 0) throw new Error(errors[0].error!.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-benefit-limits"] });
      toast.success(isAr ? "تم حفظ الحدود بنجاح" : "Limits saved successfully");
      setHasChanges(false);
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const resetChanges = () => {
    if (limits) {
      const initial: Record<string, { monthly_limit: number | null; is_active: boolean }> = {};
      for (const l of limits) {
        initial[l.id] = { monthly_limit: l.monthly_limit, is_active: l.is_active };
      }
      setEdits(initial);
      setHasChanges(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  const benefitCodes = [...new Set(limits?.map((l) => l.benefit_code) || [])];
  // Group by benefit_code, get metadata from first entry
  const benefitMeta = benefitCodes.map((code) => {
    const row = limits!.find((l) => l.benefit_code === code)!;
    return { code, name: row.benefit_name, nameAr: row.benefit_name_ar, category: row.category, sortOrder: row.sort_order };
  }).sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold">{isAr ? "محرر حدود المميزات" : "Benefit Limits Editor"}</h3>
          <p className="text-sm text-muted-foreground">
            {isAr ? "تعديل الحدود الشهرية لكل مستوى عضوية" : "Configure monthly limits per membership tier"}
          </p>
        </div>
        <div className="flex gap-2">
          {hasChanges && (
            <Button variant="outline" size="sm" onClick={resetChanges}>
              <RotateCcw className="h-3.5 w-3.5 me-1.5" />
              {isAr ? "إلغاء" : "Reset"}
            </Button>
          )}
          <Button
            size="sm"
            onClick={() => saveMutation.mutate()}
            disabled={!hasChanges || saveMutation.isPending}
          >
            <Save className="h-3.5 w-3.5 me-1.5" />
            {saveMutation.isPending ? (isAr ? "جارٍ الحفظ..." : "Saving...") : (isAr ? "حفظ التغييرات" : "Save Changes")}
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-start py-3 px-4 font-medium text-muted-foreground">
                    {isAr ? "الميزة" : "Benefit"}
                  </th>
                  {TIERS.map((tier) => (
                    <th key={tier} className="text-center py-3 px-4 font-medium text-muted-foreground">
                      <Badge variant={tier === "enterprise" ? "default" : tier === "professional" ? "secondary" : "outline"} className="text-xs">
                        {TIER_LABELS[tier][isAr ? "ar" : "en"]}
                      </Badge>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {benefitMeta.map((benefit) => (
                  <tr key={benefit.code} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium">{isAr ? benefit.nameAr || benefit.name : benefit.name}</p>
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0 mt-0.5">{benefit.category}</Badge>
                      </div>
                    </td>
                    {TIERS.map((tier) => {
                      const row = limits!.find((l) => l.benefit_code === benefit.code && l.tier === tier);
                      if (!row) return <td key={tier} className="text-center py-3 px-4 text-muted-foreground">—</td>;
                      const edit = edits[row.id];
                      if (!edit) return <td key={tier} className="text-center py-3 px-4">—</td>;
                      const isUnlimited = edit.monthly_limit === null;

                      return (
                        <td key={tier} className="py-3 px-4">
                          <div className="flex flex-col items-center gap-2">
                            <div className="flex items-center gap-2">
                              {isUnlimited ? (
                                <div className="flex items-center gap-1 text-chart-2">
                                  <Infinity className="h-4 w-4" />
                                  <span className="text-xs font-medium">{isAr ? "غير محدود" : "Unlimited"}</span>
                                </div>
                              ) : (
                                <Input
                                  type="number"
                                  min={0}
                                  value={edit.monthly_limit ?? ""}
                                  onChange={(e) => {
                                    const val = e.target.value === "" ? 0 : parseInt(e.target.value);
                                    updateEdit(row.id, "monthly_limit", val);
                                  }}
                                  className="w-20 h-8 text-center text-sm"
                                />
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-[10px]"
                                onClick={() => updateEdit(row.id, "monthly_limit", isUnlimited ? 10 : null)}
                              >
                                {isUnlimited ? (isAr ? "حدد" : "Set") : <Infinity className="h-3 w-3" />}
                              </Button>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Switch
                                checked={edit.is_active}
                                onCheckedChange={(v) => updateEdit(row.id, "is_active", v)}
                                className="scale-75"
                              />
                              <span className="text-[10px] text-muted-foreground">
                                {edit.is_active ? (isAr ? "مفعل" : "Active") : (isAr ? "معطل" : "Off")}
                              </span>
                            </div>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
