import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { useToast } from "@/hooks/use-toast";
import {
  Zap, Plus, Bell, Mail, Megaphone, Clock, Pencil, Trash2,
  Play, Pause, BarChart3, Shield, Users, Trophy, FileText,
  ShoppingCart, Calendar, UserPlus, AlertCircle,
} from "lucide-react";

interface NotificationRule {
  id: string;
  name: string;
  name_ar: string | null;
  description: string | null;
  description_ar: string | null;
  trigger_event: string;
  conditions: Record<string, any>;
  notification_title: string;
  notification_title_ar: string | null;
  notification_body: string;
  notification_body_ar: string | null;
  notification_type: string;
  notification_link: string | null;
  channels: string[];
  delay_minutes: number;
  is_active: boolean;
  priority: number;
  max_sends_per_user: number;
  cooldown_hours: number;
  created_at: string;
}

const TRIGGER_EVENTS = [
  { value: "user_signup", label: "User Signup", labelAr: "تسجيل مستخدم جديد", icon: UserPlus, color: "text-chart-2" },
  { value: "competition_registration", label: "Competition Registration", labelAr: "تسجيل في مسابقة", icon: Trophy, color: "text-chart-4" },
  { value: "membership_expiring", label: "Membership Expiring", labelAr: "انتهاء العضوية", icon: Clock, color: "text-destructive" },
  { value: "invoice_overdue", label: "Invoice Overdue", labelAr: "فاتورة متأخرة", icon: FileText, color: "text-destructive" },
  { value: "inactivity", label: "User Inactivity", labelAr: "عدم نشاط المستخدم", icon: AlertCircle, color: "text-chart-4" },
  { value: "exhibition_upcoming", label: "Exhibition Upcoming", labelAr: "معرض قادم", icon: Calendar, color: "text-primary" },
  { value: "order_completed", label: "Order Completed", labelAr: "طلب مكتمل", icon: ShoppingCart, color: "text-chart-2" },
  { value: "profile_incomplete", label: "Profile Incomplete", labelAr: "ملف شخصي غير مكتمل", icon: Users, color: "text-chart-4" },
  { value: "verification_approved", label: "Verification Approved", labelAr: "تم التحقق", icon: Shield, color: "text-chart-2" },
  { value: "welcome_series", label: "Welcome Series", labelAr: "سلسلة الترحيب", icon: Bell, color: "text-primary" },
];

const emptyRule = {
  name: "", name_ar: "", description: "", description_ar: "",
  trigger_event: "user_signup",
  conditions: {} as Record<string, any>,
  notification_title: "", notification_title_ar: "",
  notification_body: "", notification_body_ar: "",
  notification_type: "info",
  notification_link: "",
  channels: ["in_app"] as string[],
  delay_minutes: 0,
  priority: 0,
  max_sends_per_user: 1,
  cooldown_hours: 24,
};

export function SmartNotificationRules() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isAr = language === "ar";

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<NotificationRule | null>(null);
  const [form, setForm] = useState(emptyRule);

  const { data: rules = [], isLoading } = useQuery({
    queryKey: ["notification-rules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notification_rules")
        .select("*")
        .order("priority", { ascending: false });
      if (error) throw error;
      return (data || []) as NotificationRule[];
    },
  });

  const { data: ruleLogs = [] } = useQuery({
    queryKey: ["notification-rule-logs-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notification_rule_logs")
        .select("rule_id")
        .order("triggered_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return data || [];
    },
  });

  const getRuleFireCount = (ruleId: string) => ruleLogs.filter(l => l.rule_id === ruleId).length;

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name,
        name_ar: form.name_ar || null,
        description: form.description || null,
        description_ar: form.description_ar || null,
        trigger_event: form.trigger_event,
        conditions: form.conditions,
        notification_title: form.notification_title,
        notification_title_ar: form.notification_title_ar || null,
        notification_body: form.notification_body,
        notification_body_ar: form.notification_body_ar || null,
        notification_type: form.notification_type,
        notification_link: form.notification_link || null,
        channels: form.channels,
        delay_minutes: form.delay_minutes,
        priority: form.priority,
        max_sends_per_user: form.max_sends_per_user,
        cooldown_hours: form.cooldown_hours,
      };

      if (editingRule) {
        const { error } = await supabase.from("notification_rules").update({ ...payload, updated_at: new Date().toISOString() }).eq("id", editingRule.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("notification_rules").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-rules"] });
      toast({ title: isAr ? "تم الحفظ" : "Saved" });
      setDialogOpen(false);
      setEditingRule(null);
      setForm(emptyRule);
    },
    onError: (e) => toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: e.message }),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("notification_rules").update({ is_active: active, updated_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-rules"] });
      toast({ title: isAr ? "تم التحديث" : "Updated" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("notification_rules").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-rules"] });
      toast({ title: isAr ? "تم الحذف" : "Deleted" });
    },
  });

  const openCreate = () => {
    setEditingRule(null);
    setForm(emptyRule);
    setDialogOpen(true);
  };

  const openEdit = (rule: NotificationRule) => {
    setEditingRule(rule);
    setForm({
      name: rule.name, name_ar: rule.name_ar || "",
      description: rule.description || "", description_ar: rule.description_ar || "",
      trigger_event: rule.trigger_event,
      conditions: rule.conditions || {},
      notification_title: rule.notification_title, notification_title_ar: rule.notification_title_ar || "",
      notification_body: rule.notification_body, notification_body_ar: rule.notification_body_ar || "",
      notification_type: rule.notification_type || "info",
      notification_link: rule.notification_link || "",
      channels: rule.channels || ["in_app"],
      delay_minutes: rule.delay_minutes || 0,
      priority: rule.priority || 0,
      max_sends_per_user: rule.max_sends_per_user || 1,
      cooldown_hours: rule.cooldown_hours || 24,
    });
    setDialogOpen(true);
  };

  const toggleChannel = (ch: string) => {
    setForm(prev => ({
      ...prev,
      channels: prev.channels.includes(ch)
        ? prev.channels.filter(c => c !== ch)
        : [...prev.channels, ch],
    }));
  };

  const activeCount = rules.filter(r => r.is_active).length;

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
        <Card className="border-s-[3px] border-s-primary">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-xl p-2.5 bg-primary/10"><Zap className="h-5 w-5 text-primary" /></div>
            <div>
              <p className="text-xs text-muted-foreground">{isAr ? "إجمالي القواعد" : "Total Rules"}</p>
              <AnimatedCounter value={rules.length} className="text-2xl" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-s-[3px] border-s-chart-2">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-xl p-2.5 bg-chart-2/10"><Play className="h-5 w-5 text-chart-2" /></div>
            <div>
              <p className="text-xs text-muted-foreground">{isAr ? "نشط" : "Active"}</p>
              <AnimatedCounter value={activeCount} className="text-2xl" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-s-[3px] border-s-chart-4">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-xl p-2.5 bg-chart-4/10"><Pause className="h-5 w-5 text-chart-4" /></div>
            <div>
              <p className="text-xs text-muted-foreground">{isAr ? "متوقف" : "Paused"}</p>
              <AnimatedCounter value={rules.length - activeCount} className="text-2xl" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-s-[3px] border-s-chart-3">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-xl p-2.5 bg-chart-3/10"><BarChart3 className="h-5 w-5 text-chart-3" /></div>
            <div>
              <p className="text-xs text-muted-foreground">{isAr ? "إجمالي التفعيلات" : "Total Fires"}</p>
              <AnimatedCounter value={ruleLogs.length} className="text-2xl" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rules List */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              {isAr ? "قواعد الإشعارات الذكية" : "Smart Notification Rules"}
            </CardTitle>
            <CardDescription className="mt-1">
              {isAr ? "أتمتة الإشعارات بناءً على أحداث وشروط محددة" : "Automate notifications based on events and conditions"}
            </CardDescription>
          </div>
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            {isAr ? "قاعدة جديدة" : "New Rule"}
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : rules.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Zap className="h-12 w-12 text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">{isAr ? "لا توجد قواعد بعد" : "No rules yet"}</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={openCreate}>
                {isAr ? "إنشاء قاعدة" : "Create Rule"}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {rules.map((rule) => {
                const trigger = TRIGGER_EVENTS.find(t => t.value === rule.trigger_event);
                const TriggerIcon = trigger?.icon || Zap;
                const fireCount = getRuleFireCount(rule.id);
                return (
                  <div key={rule.id} className={`rounded-xl border p-4 transition-all ${rule.is_active ? "bg-card" : "bg-muted/30 opacity-75"}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className={`rounded-xl p-2 ${rule.is_active ? "bg-primary/10" : "bg-muted"}`}>
                          <TriggerIcon className={`h-4 w-4 ${rule.is_active ? (trigger?.color || "text-primary") : "text-muted-foreground"}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium text-sm">{isAr && rule.name_ar ? rule.name_ar : rule.name}</p>
                            <Badge variant={rule.is_active ? "default" : "secondary"} className="text-[10px]">
                              {rule.is_active ? (isAr ? "نشط" : "Active") : (isAr ? "متوقف" : "Paused")}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                            {isAr && rule.description_ar ? rule.description_ar : rule.description || (isAr ? trigger?.labelAr : trigger?.label)}
                          </p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            <Badge variant="outline" className="text-[10px] gap-1">
                              <TriggerIcon className="h-3 w-3" />
                              {isAr ? trigger?.labelAr : trigger?.label}
                            </Badge>
                            {rule.channels.map(ch => (
                              <Badge key={ch} variant="secondary" className="text-[10px] gap-1">
                                {ch === "email" ? <Mail className="h-3 w-3" /> : ch === "push" ? <Megaphone className="h-3 w-3" /> : <Bell className="h-3 w-3" />}
                                {ch}
                              </Badge>
                            ))}
                            {rule.delay_minutes > 0 && (
                              <Badge variant="secondary" className="text-[10px] gap-1">
                                <Clock className="h-3 w-3" />
                                {rule.delay_minutes}m {isAr ? "تأخير" : "delay"}
                              </Badge>
                            )}
                            {fireCount > 0 && (
                              <Badge variant="outline" className="text-[10px] gap-1 bg-chart-2/5 text-chart-2 border-chart-2/20">
                                <BarChart3 className="h-3 w-3" />
                                {fireCount} {isAr ? "مرة" : "fires"}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Switch checked={rule.is_active} onCheckedChange={(active) => toggleMutation.mutate({ id: rule.id, active })} />
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(rule)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteMutation.mutate(rule.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rule Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              {editingRule ? (isAr ? "تعديل القاعدة" : "Edit Rule") : (isAr ? "قاعدة جديدة" : "New Rule")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5">
            {/* Name */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{isAr ? "الاسم (EN)" : "Name (EN)"}</Label>
                <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Welcome notification..." />
              </div>
              <div className="space-y-2">
                <Label>{isAr ? "الاسم (AR)" : "Name (AR)"}</Label>
                <Input dir="rtl" value={form.name_ar} onChange={e => setForm({ ...form, name_ar: e.target.value })} />
              </div>
            </div>

            {/* Trigger */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><Zap className="h-3.5 w-3.5 text-primary" />{isAr ? "الحدث المحفز" : "Trigger Event"}</Label>
              <Select value={form.trigger_event} onValueChange={v => setForm({ ...form, trigger_event: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TRIGGER_EVENTS.map(t => (
                    <SelectItem key={t.value} value={t.value}>
                      <span className="flex items-center gap-2">
                        <t.icon className={`h-3.5 w-3.5 ${t.color}`} />
                        {isAr ? t.labelAr : t.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Notification Content */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{isAr ? "عنوان الإشعار (EN)" : "Notification Title (EN)"}</Label>
                <Input value={form.notification_title} onChange={e => setForm({ ...form, notification_title: e.target.value })} placeholder="Welcome to Altoha!" />
              </div>
              <div className="space-y-2">
                <Label>{isAr ? "عنوان الإشعار (AR)" : "Notification Title (AR)"}</Label>
                <Input dir="rtl" value={form.notification_title_ar} onChange={e => setForm({ ...form, notification_title_ar: e.target.value })} />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{isAr ? "محتوى الإشعار (EN)" : "Notification Body (EN)"}</Label>
                <Textarea rows={3} value={form.notification_body} onChange={e => setForm({ ...form, notification_body: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>{isAr ? "محتوى الإشعار (AR)" : "Notification Body (AR)"}</Label>
                <Textarea dir="rtl" rows={3} value={form.notification_body_ar} onChange={e => setForm({ ...form, notification_body_ar: e.target.value })} />
              </div>
            </div>

            {/* Type, Link, Channels */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{isAr ? "النوع" : "Type"}</Label>
                <Select value={form.notification_type} onValueChange={v => setForm({ ...form, notification_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="error">Alert</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{isAr ? "الرابط (اختياري)" : "Link (optional)"}</Label>
                <Input value={form.notification_link} onChange={e => setForm({ ...form, notification_link: e.target.value })} placeholder="/dashboard" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{isAr ? "القنوات" : "Channels"}</Label>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: "in_app", label: "In-App", icon: Bell },
                  { value: "email", label: "Email", icon: Mail },
                  { value: "push", label: "Push", icon: Megaphone },
                ].map(ch => (
                  <Badge key={ch.value}
                    className={`cursor-pointer gap-1.5 px-3 py-1.5 transition-all ${
                      form.channels.includes(ch.value)
                        ? "bg-primary/15 text-primary border-primary/30"
                        : "bg-muted/50 text-muted-foreground hover:bg-muted"
                    }`}
                    onClick={() => toggleChannel(ch.value)}>
                    <ch.icon className="h-3.5 w-3.5" />
                    {ch.label}
                  </Badge>
                ))}
              </div>
            </div>

            <Separator />

            {/* Advanced Settings */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5"><Clock className="h-3 w-3" />{isAr ? "تأخير (دقائق)" : "Delay (min)"}</Label>
                <Input type="number" min={0} value={form.delay_minutes} onChange={e => setForm({ ...form, delay_minutes: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="space-y-2">
                <Label>{isAr ? "أقصى إرسال/مستخدم" : "Max sends/user"}</Label>
                <Input type="number" min={1} value={form.max_sends_per_user} onChange={e => setForm({ ...form, max_sends_per_user: parseInt(e.target.value) || 1 })} />
              </div>
              <div className="space-y-2">
                <Label>{isAr ? "فترة الراحة (ساعات)" : "Cooldown (hours)"}</Label>
                <Input type="number" min={0} value={form.cooldown_hours} onChange={e => setForm({ ...form, cooldown_hours: parseInt(e.target.value) || 24 })} />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{isAr ? "إلغاء" : "Cancel"}</Button>
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !form.name || !form.notification_title || !form.notification_body}>
              {saveMutation.isPending ? (isAr ? "جارٍ..." : "Saving...") : (isAr ? "حفظ القاعدة" : "Save Rule")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
