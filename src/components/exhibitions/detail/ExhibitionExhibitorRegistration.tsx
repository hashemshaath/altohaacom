import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Building, Send, CheckCircle2, Clock, XCircle, Loader2 } from "lucide-react";

interface Props {
  exhibitionId: string;
  isAr: boolean;
}

export function ExhibitionExhibitorRegistration({ exhibitionId, isAr }: Props) {
  const t = (en: string, ar: string) => isAr ? ar : en;
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    company_name: "",
    company_name_ar: "",
    contact_name: "",
    contact_email: user?.email || "",
    contact_phone: "",
    website_url: "",
    description: "",
    preferred_category: "general",
    preferred_size: "medium",
    special_requirements: "",
  });

  // Check existing request
  const { data: existingRequest } = useQuery({
    queryKey: ["booth-request", exhibitionId, user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("exhibition_booth_requests")
        .select("*")
        .eq("exhibition_id", exhibitionId)
        .eq("user_id", user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const submitRequest = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("exhibition_booth_requests").insert({
        exhibition_id: exhibitionId,
        user_id: user.id,
        ...form,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["booth-request", exhibitionId] });
      toast({ title: t("Request submitted successfully! ✅", "تم إرسال الطلب بنجاح! ✅") });
    },
    onError: (err: any) => {
      toast({ title: t("Failed to submit", "فشل الإرسال"), description: err.message, variant: "destructive" });
    },
  });

  const update = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  if (!user) {
    return (
      <Card className="border-dashed border-2">
        <CardContent className="py-10 text-center">
          <Building className="mx-auto mb-3 h-8 w-8 text-muted-foreground/30" />
          <p className="text-sm font-medium text-muted-foreground">{t("Sign in to apply as an exhibitor", "سجّل دخولك للتقديم كعارض")}</p>
        </CardContent>
      </Card>
    );
  }

  if (existingRequest) {
    const statusConfig = {
      pending: { icon: Clock, color: "text-chart-4", bg: "bg-chart-4/10", label: t("Under Review", "قيد المراجعة") },
      approved: { icon: CheckCircle2, color: "text-chart-3", bg: "bg-chart-3/10", label: t("Approved", "مقبول") },
      rejected: { icon: XCircle, color: "text-destructive", bg: "bg-destructive/10", label: t("Declined", "مرفوض") },
    }[existingRequest.status] || { icon: Clock, color: "text-muted-foreground", bg: "bg-muted", label: existingRequest.status };

    const StatusIcon = statusConfig.icon;

    return (
      <Card className="border-border/60">
        <CardContent className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${statusConfig.bg}`}>
              <StatusIcon className={`h-5 w-5 ${statusConfig.color}`} />
            </div>
            <div>
              <h3 className="text-sm font-bold">{t("Your Exhibitor Application", "طلب العارض الخاص بك")}</h3>
              <Badge variant="outline" className={`text-[10px] mt-0.5 ${statusConfig.color}`}>
                {statusConfig.label}
              </Badge>
            </div>
          </div>
          <div className="space-y-1.5 text-xs text-muted-foreground">
            <p><span className="font-medium text-foreground">{t("Company:", "الشركة:")}</span> {existingRequest.company_name}</p>
            <p><span className="font-medium text-foreground">{t("Category:", "الفئة:")}</span> {existingRequest.preferred_category}</p>
            <p><span className="font-medium text-foreground">{t("Size:", "الحجم:")}</span> {existingRequest.preferred_size}</p>
          </div>
          {existingRequest.admin_notes && (
            <div className="mt-3 rounded-lg bg-muted/50 p-3">
              <p className="text-[10px] font-medium text-muted-foreground mb-1">{t("Organizer notes:", "ملاحظات المنظم:")}</p>
              <p className="text-xs">{existingRequest.admin_notes}</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20">
      <CardHeader className="py-4 px-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
            <Building className="h-4.5 w-4.5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-sm">{t("Apply as Exhibitor", "التقديم كعارض")}</CardTitle>
            <p className="text-[10px] text-muted-foreground mt-0.5">{t("Request a booth at this exhibition", "اطلب جناح في هذا المعرض")}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-5 pb-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">{t("Company Name *", "اسم الشركة *")}</Label>
            <Input value={form.company_name} onChange={e => update("company_name", e.target.value)} className="h-9 text-sm" placeholder={t("Your company", "شركتك")} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{t("Company Name (AR)", "اسم الشركة (عربي)")}</Label>
            <Input value={form.company_name_ar} onChange={e => update("company_name_ar", e.target.value)} className="h-9 text-sm" dir="rtl" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{t("Contact Name *", "اسم المسؤول *")}</Label>
            <Input value={form.contact_name} onChange={e => update("contact_name", e.target.value)} className="h-9 text-sm" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{t("Email *", "البريد *")}</Label>
            <Input value={form.contact_email} onChange={e => update("contact_email", e.target.value)} className="h-9 text-sm" type="email" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{t("Phone", "الهاتف")}</Label>
            <Input value={form.contact_phone} onChange={e => update("contact_phone", e.target.value)} className="h-9 text-sm" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{t("Website", "الموقع")}</Label>
            <Input value={form.website_url} onChange={e => update("website_url", e.target.value)} className="h-9 text-sm" placeholder="https://" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{t("Preferred Category", "الفئة المفضلة")}</Label>
            <Select value={form.preferred_category} onValueChange={v => update("preferred_category", v)}>
              <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {["general", "food", "equipment", "technology", "services", "ingredients", "packaging"].map(c => (
                  <SelectItem key={c} value={c} className="text-xs capitalize">{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{t("Booth Size", "حجم الجناح")}</Label>
            <Select value={form.preferred_size} onValueChange={v => update("preferred_size", v)}>
              <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {["small", "medium", "large", "premium"].map(s => (
                  <SelectItem key={s} value={s} className="text-xs capitalize">{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">{t("Description", "الوصف")}</Label>
          <Textarea value={form.description} onChange={e => update("description", e.target.value)} className="text-sm min-h-[60px]" placeholder={t("What will you showcase?", "ماذا ستعرض؟")} />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">{t("Special Requirements", "متطلبات خاصة")}</Label>
          <Textarea value={form.special_requirements} onChange={e => update("special_requirements", e.target.value)} className="text-sm min-h-[50px]" placeholder={t("Electricity, water, special setup...", "كهرباء، ماء، تجهيزات خاصة...")} />
        </div>

        <Button
          onClick={() => submitRequest.mutate()}
          disabled={submitRequest.isPending || !form.company_name.trim() || !form.contact_name.trim() || !form.contact_email.trim()}
          className="w-full rounded-xl"
        >
          {submitRequest.isPending ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <Send className="me-2 h-4 w-4" />}
          {t("Submit Application", "إرسال الطلب")}
        </Button>
      </CardContent>
    </Card>
  );
}
