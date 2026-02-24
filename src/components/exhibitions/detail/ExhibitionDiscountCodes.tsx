import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Tag, Plus, Trash2, Copy, Loader2 } from "lucide-react";

interface Props {
  exhibitionId: string;
  isAr: boolean;
}

export function ExhibitionDiscountCodes({ exhibitionId, isAr }: Props) {
  const t = (en: string, ar: string) => isAr ? ar : en;
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage");
  const [discountValue, setDiscountValue] = useState("");
  const [maxUses, setMaxUses] = useState("");

  const { data: codes = [] } = useQuery({
    queryKey: ["exhibition-discount-codes", exhibitionId],
    queryFn: async () => {
      const { data } = await supabase
        .from("exhibition_discount_codes")
        .select("*")
        .eq("exhibition_id", exhibitionId)
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const createCode = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("exhibition_discount_codes").insert({
        exhibition_id: exhibitionId,
        code: code.toUpperCase().trim(),
        discount_type: discountType,
        discount_value: parseFloat(discountValue) || 0,
        max_uses: maxUses ? parseInt(maxUses) : null,
        created_by: user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exhibition-discount-codes", exhibitionId] });
      setOpen(false);
      setCode("");
      setDiscountValue("");
      setMaxUses("");
      toast({ title: t("Discount code created! 🎫", "تم إنشاء كود الخصم! 🎫") });
    },
    onError: (e: any) => {
      const isDuplicate = e?.code === "23505";
      toast({ title: isDuplicate ? t("Code already exists", "الكود موجود مسبقاً") : t("Error", "خطأ"), variant: "destructive" });
    },
  });

  const toggleCode = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("exhibition_discount_codes").update({ is_active: active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["exhibition-discount-codes", exhibitionId] }),
  });

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: t("Copied! 📋", "تم النسخ! 📋") });
  };

  return (
    <Card>
      <CardHeader className="py-3 px-4 flex-row items-center justify-between">
        <CardTitle className="text-sm flex items-center gap-2">
          <Tag className="h-4 w-4 text-primary" />
          {t("Discount Codes", "أكواد الخصم")}
          {codes.length > 0 && <Badge variant="secondary" className="text-[10px] h-5">{codes.length}</Badge>}
        </CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
              <Plus className="h-3 w-3" /> {t("Add", "إضافة")}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-sm">{t("Create Discount Code", "إنشاء كود خصم")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 pt-2">
              <div className="space-y-1">
                <Label className="text-xs">{t("Code", "الكود")}</Label>
                <Input value={code} onChange={e => setCode(e.target.value)} placeholder="EXPO2026" className="uppercase" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">{t("Type", "النوع")}</Label>
                  <Select value={discountType} onValueChange={v => setDiscountType(v as any)}>
                    <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage" className="text-xs">%</SelectItem>
                      <SelectItem value="fixed" className="text-xs">{t("Fixed", "ثابت")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{t("Value", "القيمة")}</Label>
                  <Input type="number" value={discountValue} onChange={e => setDiscountValue(e.target.value)} placeholder={discountType === "percentage" ? "10" : "50"} />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t("Max Uses (optional)", "الحد الأقصى (اختياري)")}</Label>
                <Input type="number" value={maxUses} onChange={e => setMaxUses(e.target.value)} placeholder="100" />
              </div>
              <Button className="w-full" onClick={() => createCode.mutate()} disabled={!code.trim() || !discountValue || createCode.isPending}>
                {createCode.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t("Create", "إنشاء")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        {codes.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">{t("No discount codes yet", "لا توجد أكواد خصم بعد")}</p>
        ) : (
          <div className="space-y-2">
            {codes.map((dc: any) => (
              <div key={dc.id} className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/40 border border-border/40">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <code className="text-xs font-bold text-foreground">{dc.code}</code>
                    <Badge variant={dc.is_active ? "default" : "secondary"} className="text-[8px] h-4">
                      {dc.is_active ? t("Active", "فعال") : t("Inactive", "غير فعال")}
                    </Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {dc.discount_type === "percentage" ? `${dc.discount_value}%` : `${dc.discount_value} SAR`}
                    {dc.max_uses && ` · ${dc.used_count}/${dc.max_uses} ${t("used", "مستخدم")}`}
                  </p>
                </div>
                <button onClick={() => copyCode(dc.code)} className="h-7 w-7 rounded-md flex items-center justify-center hover:bg-muted transition-colors">
                  <Copy className="h-3 w-3 text-muted-foreground" />
                </button>
                <button onClick={() => toggleCode.mutate({ id: dc.id, active: !dc.is_active })} className="h-7 w-7 rounded-md flex items-center justify-center hover:bg-muted transition-colors">
                  {dc.is_active ? <Trash2 className="h-3 w-3 text-destructive" /> : <Plus className="h-3 w-3 text-primary" />}
                </button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
