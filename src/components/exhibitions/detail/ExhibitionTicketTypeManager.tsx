import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Plus, Ticket, Edit, Trash2, DollarSign, Users } from "lucide-react";

interface Props {
  exhibitionId: string;
  isAr: boolean;
}

export function ExhibitionTicketTypeManager({ exhibitionId, isAr }: Props) {
  const t = (en: string, ar: string) => isAr ? ar : en;
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "", name_ar: "", description: "", description_ar: "",
    price: "0", currency: "SAR", max_quantity: "", is_active: true, color: "",
  });

  const { data: types = [] } = useQuery({
    queryKey: ["ticket-types", exhibitionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exhibition_ticket_types")
        .select("*")
        .eq("exhibition_id", exhibitionId)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        exhibition_id: exhibitionId,
        name: form.name,
        name_ar: form.name_ar || null,
        description: form.description || null,
        description_ar: form.description_ar || null,
        price: parseFloat(form.price) || 0,
        currency: form.currency,
        max_quantity: form.max_quantity ? parseInt(form.max_quantity) : null,
        is_active: form.is_active,
        color: form.color || null,
        sort_order: types.length,
      };
      if (editingId) {
        const { error } = await supabase.from("exhibition_ticket_types").update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("exhibition_ticket_types").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ticket-types", exhibitionId] });
      toast({ title: t("Saved ✅", "تم الحفظ ✅") });
      resetForm();
    },
    onError: () => toast({ title: t("Save failed", "فشل الحفظ"), variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("exhibition_ticket_types").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ticket-types", exhibitionId] });
      toast({ title: t("Deleted", "تم الحذف") });
    },
  });

  const resetForm = () => {
    setForm({ name: "", name_ar: "", description: "", description_ar: "", price: "0", currency: "SAR", max_quantity: "", is_active: true, color: "" });
    setEditingId(null);
    setDialogOpen(false);
  };

  const openEdit = (tt: any) => {
    setForm({
      name: tt.name, name_ar: tt.name_ar || "", description: tt.description || "",
      description_ar: tt.description_ar || "", price: tt.price?.toString() || "0",
      currency: tt.currency || "SAR", max_quantity: tt.max_quantity?.toString() || "",
      is_active: tt.is_active, color: tt.color || "",
    });
    setEditingId(tt.id);
    setDialogOpen(true);
  };

  const totalSold = types.reduce((s: number, t: any) => s + (t.sold_count || 0), 0);

  return (
    <Card>
      <CardHeader className="py-3 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Ticket className="h-4 w-4 text-primary" />
            {t("Ticket Types", "أنواع التذاكر")} ({types.length})
            {totalSold > 0 && <Badge variant="secondary" className="text-[9px]">{totalSold} {t("sold", "مباع")}</Badge>}
          </CardTitle>
          <Dialog open={dialogOpen} onOpenChange={(o) => { if (!o) resetForm(); setDialogOpen(o); }}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5 h-8 text-xs"><Plus className="h-3 w-3" />{t("Add Type", "إضافة نوع")}</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="text-sm">{editingId ? t("Edit Ticket Type", "تعديل") : t("New Ticket Type", "نوع تذكرة جديد")}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Input placeholder={t("Name *", "الاسم *")} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="text-xs" />
                  <Input placeholder={t("Name (Arabic)", "الاسم (عربي)")} value={form.name_ar} onChange={e => setForm({ ...form, name_ar: e.target.value })} className="text-xs" dir="rtl" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Textarea placeholder={t("Description", "الوصف")} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="text-xs min-h-[50px]" />
                  <Textarea placeholder={t("Description (Arabic)", "الوصف (عربي)")} value={form.description_ar} onChange={e => setForm({ ...form, description_ar: e.target.value })} className="text-xs min-h-[50px]" dir="rtl" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <Input type="number" step="0.01" placeholder={t("Price", "السعر")} value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} className="text-xs" />
                  <Input placeholder={t("Currency", "العملة")} value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })} className="text-xs" />
                  <Input type="number" placeholder={t("Max qty", "الحد الأقصى")} value={form.max_quantity} onChange={e => setForm({ ...form, max_quantity: e.target.value })} className="text-xs" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Input type="color" value={form.color || "#6366f1"} onChange={e => setForm({ ...form, color: e.target.value })} className="h-8 w-10 p-0.5 cursor-pointer" />
                    <span className="text-[10px] text-muted-foreground">{t("Color", "اللون")}</span>
                  </div>
                  <label className="flex items-center gap-2 text-xs">
                    <Switch checked={form.is_active} onCheckedChange={v => setForm({ ...form, is_active: v })} />
                    {t("Active", "فعال")}
                  </label>
                </div>
                <Button className="w-full" size="sm" disabled={!form.name || saveMutation.isPending} onClick={() => saveMutation.mutate()}>
                  {saveMutation.isPending ? "..." : editingId ? t("Update", "تحديث") : t("Create", "إنشاء")}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {types.length === 0 ? (
          <div className="py-10 text-center">
            <Ticket className="mx-auto mb-2 h-8 w-8 text-muted-foreground/30" />
            <p className="text-xs text-muted-foreground">{t("No ticket types yet. Add types like VIP, Standard, Free.", "لا توجد أنواع تذاكر. أضف أنواع مثل VIP, عادي, مجاني.")}</p>
          </div>
        ) : (
          <div className="divide-y divide-border/40">
            {types.map((tt: any) => {
              const remaining = tt.max_quantity ? tt.max_quantity - tt.sold_count : null;
              return (
                <div key={tt.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/20 transition-colors">
                  <div className="h-3 w-3 rounded-full shrink-0" style={{ background: tt.color || "hsl(var(--primary))" }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-semibold">{isAr && tt.name_ar ? tt.name_ar : tt.name}</p>
                      {!tt.is_active && <Badge variant="outline" className="text-[8px] h-3.5">{t("Inactive", "غير فعال")}</Badge>}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-0.5"><DollarSign className="h-2.5 w-2.5" />{tt.price > 0 ? `${tt.price} ${tt.currency}` : t("Free", "مجاني")}</span>
                      <span className="flex items-center gap-0.5"><Users className="h-2.5 w-2.5" />{tt.sold_count} {t("sold", "مباع")}</span>
                      {remaining !== null && <span>{remaining} {t("left", "متبقي")}</span>}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(tt)}><Edit className="h-3 w-3" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteMutation.mutate(tt.id)} disabled={tt.sold_count > 0}><Trash2 className="h-3 w-3" /></Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
