import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  FileText, Plus, Edit, Trash2, Copy, Zap, Search,
  MessageSquare, Mail, Bell, Check, Languages,
} from "lucide-react";

interface MessageTemplate {
  id: string;
  name: string;
  name_ar: string | null;
  subject: string | null;
  subject_ar: string | null;
  body: string;
  body_ar: string | null;
  category: string;
  channel: string;
  variables: string[] | null;
  is_active: boolean;
  created_at: string;
}

const CATEGORIES = [
  { value: "welcome", label: "Welcome", labelAr: "ترحيب" },
  { value: "notification", label: "Notification", labelAr: "إشعار" },
  { value: "reminder", label: "Reminder", labelAr: "تذكير" },
  { value: "marketing", label: "Marketing", labelAr: "تسويق" },
  { value: "support", label: "Support", labelAr: "دعم" },
  { value: "system", label: "System", labelAr: "نظام" },
];

const CHANNELS = [
  { value: "email", icon: Mail, label: "Email" },
  { value: "notification", icon: Bell, label: "Notification" },
  { value: "sms", icon: MessageSquare, label: "SMS" },
];

const TEMPLATE_VARS = [
  "{{user_name}}", "{{user_email}}", "{{competition_name}}", "{{event_name}}",
  "{{date}}", "{{company_name}}", "{{ticket_number}}", "{{link}}",
];

export function CommunicationTemplatesWidget() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isAr = language === "ar";

  const [createOpen, setCreateOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [previewTemplate, setPreviewTemplate] = useState<MessageTemplate | null>(null);

  const [form, setForm] = useState({
    name: "", name_ar: "", subject: "", subject_ar: "",
    body: "", body_ar: "", category: "notification", channel: "notification",
  });

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["comm-templates", search, categoryFilter],
    queryFn: async () => {
      let query = supabase
        .from("communication_templates")
        .select("*")
        .order("created_at", { ascending: false });

      if (search) query = query.or(`name.ilike.%${search}%,name_ar.ilike.%${search}%`);
      if (categoryFilter !== "all") query = query.eq("category", categoryFilter);

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as MessageTemplate[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const variables = TEMPLATE_VARS.filter(v => form.body.includes(v) || form.body_ar.includes(v));
      const slug = form.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
      const { error } = await supabase.from("communication_templates").insert([{
        name: form.name,
        name_ar: form.name_ar || null,
        subject: form.subject || null,
        subject_ar: form.subject_ar || null,
        body: form.body,
        body_ar: form.body_ar || null,
        category: form.category,
        channel: form.channel,
        slug,
        variables,
        created_by: user?.id,
        is_active: true,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comm-templates"] });
      setCreateOpen(false);
      setForm({ name: "", name_ar: "", subject: "", subject_ar: "", body: "", body_ar: "", category: "notification", channel: "notification" });
      toast({ title: isAr ? "تم إنشاء القالب" : "Template created" });
    },
    onError: (e: any) => toast({ variant: "destructive", title: "Error", description: e.message }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("communication_templates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comm-templates"] });
      toast({ title: isAr ? "تم حذف القالب" : "Template deleted" });
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: async (template: MessageTemplate) => {
      const slug = template.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") + "-copy-" + Date.now();
      const { error } = await supabase.from("communication_templates").insert([{
        name: `${template.name} (Copy)`,
        name_ar: template.name_ar ? `${template.name_ar} (نسخة)` : null,
        subject: template.subject,
        subject_ar: template.subject_ar,
        body: template.body,
        body_ar: template.body_ar,
        category: template.category,
        channel: template.channel,
        slug,
        variables: template.variables,
        is_active: template.is_active,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comm-templates"] });
      toast({ title: isAr ? "تم نسخ القالب" : "Template duplicated" });
    },
  });

  const channelIcon = (ch: string) => {
    const channel = CHANNELS.find(c => c.value === ch);
    return channel ? <channel.icon className="h-3 w-3" /> : null;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            {isAr ? "قوالب الرسائل" : "Message Templates"}
            <Badge variant="secondary" className="text-[10px]">{templates.length}</Badge>
          </CardTitle>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="me-1.5 h-3.5 w-3.5" /> {isAr ? "قالب جديد" : "New Template"}
          </Button>
        </div>

        <div className="flex items-center gap-2 mt-2">
          <div className="relative flex-1">
            <Search className="absolute start-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
            <Input className="ps-8 h-8 text-xs" placeholder={isAr ? "بحث..." : "Search..."} value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{isAr ? "الكل" : "All"}</SelectItem>
              {CATEGORIES.map(c => (
                <SelectItem key={c.value} value={c.value}>{isAr ? c.labelAr : c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        <ScrollArea className="max-h-[350px]">
          <div className="space-y-2">
            {templates.map(t => (
              <div key={t.id} className="flex items-start justify-between p-3 rounded-xl border hover:bg-muted/30 transition-colors group">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {channelIcon(t.channel)}
                    <span className="text-sm font-medium truncate">{isAr && t.name_ar ? t.name_ar : t.name}</span>
                    <Badge variant="outline" className="text-[10px] shrink-0">
                      {CATEGORIES.find(c => c.value === t.category)?.[isAr ? "labelAr" : "label"] || t.category}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{t.subject || (isAr && t.body_ar ? t.body_ar : t.body).slice(0, 80)}</p>
                  {t.variables && t.variables.length > 0 && (
                    <div className="flex items-center gap-1 mt-1 flex-wrap">
                      {t.variables.slice(0, 3).map(v => (
                        <Badge key={v} variant="outline" className="text-[9px] h-4 font-mono">{v}</Badge>
                      ))}
                      {t.variables.length > 3 && (
                        <span className="text-[9px] text-muted-foreground">+{t.variables.length - 3}</span>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setPreviewTemplate(t)}>
                    <Zap className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => duplicateMutation.mutate(t)}>
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteMutation.mutate(t.id)}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
            {templates.length === 0 && !isLoading && (
              <div className="text-center py-6 text-muted-foreground text-sm">
                {isAr ? "لا توجد قوالب" : "No templates yet"}
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>

      {/* Create Template Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{isAr ? "قالب رسالة جديد" : "New Message Template"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Name (EN)</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">الاسم (AR)</Label>
                <Input dir="rtl" value={form.name_ar} onChange={(e) => setForm({ ...form, name_ar: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">{isAr ? "الفئة" : "Category"}</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{isAr ? c.labelAr : c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{isAr ? "القناة" : "Channel"}</Label>
                <Select value={form.channel} onValueChange={(v) => setForm({ ...form, channel: v })}>
                  <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CHANNELS.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Subject (EN)</Label>
              <Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Body (EN)</Label>
              <Textarea rows={4} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">النص (AR)</Label>
              <Textarea dir="rtl" rows={4} value={form.body_ar} onChange={(e) => setForm({ ...form, body_ar: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs mb-1.5 block">{isAr ? "المتغيرات المتاحة" : "Available Variables"}</Label>
              <div className="flex flex-wrap gap-1">
                {TEMPLATE_VARS.map(v => (
                  <Badge key={v} variant="outline" className="text-[10px] cursor-pointer hover:bg-primary/10"
                    onClick={() => setForm({ ...form, body: form.body + " " + v })}>
                    {v}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>{isAr ? "إلغاء" : "Cancel"}</Button>
            <Button onClick={() => createMutation.mutate()} disabled={!form.name || !form.body || createMutation.isPending}>
              <Plus className="me-1.5 h-4 w-4" /> {isAr ? "إنشاء" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isAr ? "معاينة القالب" : "Template Preview"}</DialogTitle>
          </DialogHeader>
          {previewTemplate && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                {channelIcon(previewTemplate.channel)}
                <span className="font-medium">{isAr && previewTemplate.name_ar ? previewTemplate.name_ar : previewTemplate.name}</span>
              </div>
              {previewTemplate.subject && (
                <div className="p-3 rounded bg-muted/40 text-sm">
                  <span className="text-xs text-muted-foreground block mb-1">{isAr ? "الموضوع" : "Subject"}:</span>
                  {previewTemplate.subject}
                </div>
              )}
              <div className="p-3 rounded border text-sm whitespace-pre-wrap">
                {isAr && previewTemplate.body_ar ? previewTemplate.body_ar : previewTemplate.body}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
