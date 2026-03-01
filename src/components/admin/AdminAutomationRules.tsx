import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  Zap, Plus, Play, Pause, Trash2, Bell, Mail, UserCheck,
  Clock, AlertTriangle, CheckCircle2, Settings, Loader2,
} from "lucide-react";

const TRIGGER_EVENTS = [
  { value: "user_signup", label: "User Signup", labelAr: "تسجيل مستخدم جديد", icon: UserCheck },
  { value: "membership_expiring", label: "Membership Expiring", labelAr: "انتهاء العضوية", icon: Clock },
  { value: "user_inactive", label: "User Inactive (7d)", labelAr: "مستخدم غير نشط (7 أيام)", icon: AlertTriangle },
  { value: "report_submitted", label: "Report Submitted", labelAr: "تقديم بلاغ", icon: AlertTriangle },
  { value: "competition_ended", label: "Competition Ended", labelAr: "انتهاء مسابقة", icon: CheckCircle2 },
];

const NOTIFICATION_TYPES = [
  { value: "welcome", label: "Welcome", labelAr: "ترحيب" },
  { value: "reminder", label: "Reminder", labelAr: "تذكير" },
  { value: "alert", label: "Alert", labelAr: "تنبيه" },
  { value: "admin_message", label: "Admin Message", labelAr: "رسالة إدارية" },
];

export function AdminAutomationRules() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isAr = language === "ar";

  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    name_ar: "",
    trigger_event: "user_signup",
    notification_title: "",
    notification_body: "",
    notification_type: "welcome",
    channels: ["in_app"] as string[],
  });

  const { data: rules = [], isLoading } = useQuery({
    queryKey: ["automation-rules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notification_rules")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("notification_rules").insert({
        name: form.name,
        name_ar: form.name_ar || null,
        trigger_event: form.trigger_event,
        notification_title: form.notification_title,
        notification_body: form.notification_body,
        notification_type: form.notification_type,
        channels: form.channels,
        conditions: {},
        is_active: true,
        created_by: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automation-rules"] });
      toast({ title: isAr ? "تم إنشاء القاعدة" : "Rule created" });
      setCreateOpen(false);
      setForm({ name: "", name_ar: "", trigger_event: "user_signup", notification_title: "", notification_body: "", notification_type: "welcome", channels: ["in_app"] });
    },
    onError: (e) => toast({ variant: "destructive", title: "Error", description: e.message }),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("notification_rules").update({ is_active: active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["automation-rules"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("notification_rules").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automation-rules"] });
      toast({ title: isAr ? "تم الحذف" : "Deleted" });
    },
  });

  const getTriggerInfo = (event: string) => TRIGGER_EVENTS.find((t) => t.value === event);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Zap className="h-5 w-5 text-chart-4" />
            {isAr ? "قواعد الأتمتة" : "Automation Rules"}
          </h3>
          <p className="text-sm text-muted-foreground">
            {isAr ? "إنشاء إشعارات تلقائية بناءً على الأحداث" : "Create automated notifications based on events"}
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="me-2 h-4 w-4" />
          {isAr ? "قاعدة جديدة" : "New Rule"}
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : rules.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Zap className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">{isAr ? "لا توجد قواعد أتمتة بعد" : "No automation rules yet"}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {rules.map((rule) => {
            const trigger = getTriggerInfo(rule.trigger_event);
            const TriggerIcon = trigger?.icon || Zap;

            return (
              <Card key={rule.id} className={rule.is_active ? "border-primary/20" : "opacity-60"}>
                <CardContent className="py-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className="h-9 w-9 rounded-xl bg-chart-4/10 flex items-center justify-center shrink-0">
                        <TriggerIcon className="h-4 w-4 text-chart-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm truncate">{isAr ? (rule.name_ar || rule.name) : rule.name}</p>
                          {rule.is_active ? (
                            <Badge variant="outline" className="text-[9px] text-chart-3 border-chart-3/30"><Play className="h-2 w-2 me-0.5" />Active</Badge>
                          ) : (
                            <Badge variant="outline" className="text-[9px]"><Pause className="h-2 w-2 me-0.5" />Paused</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                          <span>{isAr ? trigger?.labelAr : trigger?.label}</span>
                          <span>→</span>
                          <Bell className="h-2.5 w-2.5" />
                          <span>{rule.notification_type}</span>
                          <span>· {(rule.channels || []).join(", ")}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={rule.is_active}
                        onCheckedChange={(active) => toggleMutation.mutate({ id: rule.id, active })}
                      />
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteMutation.mutate(rule.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Rule Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-chart-4" />
              {isAr ? "قاعدة أتمتة جديدة" : "New Automation Rule"}
            </DialogTitle>
            <DialogDescription>{isAr ? "حدد الحدث والإشعار التلقائي" : "Define the trigger event and notification"}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">{isAr ? "الاسم (EN)" : "Name (EN)"}</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Rule name" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{isAr ? "الاسم (AR)" : "Name (AR)"}</Label>
                <Input value={form.name_ar} onChange={(e) => setForm({ ...form, name_ar: e.target.value })} placeholder="اسم القاعدة" dir="rtl" />
              </div>
            </div>

            <Separator />

            <div className="space-y-1.5">
              <Label className="text-xs">{isAr ? "الحدث المُحفّز" : "Trigger Event"}</Label>
              <Select value={form.trigger_event} onValueChange={(v) => setForm({ ...form, trigger_event: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TRIGGER_EVENTS.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{isAr ? t.labelAr : t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">{isAr ? "نوع الإشعار" : "Notification Type"}</Label>
              <Select value={form.notification_type} onValueChange={(v) => setForm({ ...form, notification_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {NOTIFICATION_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{isAr ? t.labelAr : t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3 rounded-xl border p-3 bg-muted/20">
              <div className="space-y-1.5">
                <Label className="text-xs">{isAr ? "عنوان الإشعار" : "Notification Title"}</Label>
                <Input value={form.notification_title} onChange={(e) => setForm({ ...form, notification_title: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{isAr ? "نص الإشعار" : "Notification Body"}</Label>
                <Textarea rows={2} value={form.notification_body} onChange={(e) => setForm({ ...form, notification_body: e.target.value })} />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>{isAr ? "إلغاء" : "Cancel"}</Button>
            <Button onClick={() => createMutation.mutate()} disabled={!form.name || !form.notification_title || createMutation.isPending}>
              {createMutation.isPending && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
              <Zap className="me-2 h-4 w-4" />
              {isAr ? "إنشاء القاعدة" : "Create Rule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
