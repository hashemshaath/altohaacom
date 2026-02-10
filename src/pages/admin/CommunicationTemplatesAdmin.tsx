import { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  MessageSquare,
  Plus,
  Edit,
  Trash2,
  Search,
  Mail,
  Phone,
  Send,
  Eye,
  Copy,
  Filter,
  FileText,
  Variable,
} from "lucide-react";

interface Template {
  id: string;
  name: string;
  name_ar: string | null;
  slug: string;
  category: string;
  channel: string;
  subject: string | null;
  subject_ar: string | null;
  body: string;
  body_ar: string | null;
  variables: string[] | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const categories = [
  { value: "general", label: "General", labelAr: "عام" },
  { value: "company", label: "Company", labelAr: "الشركات" },
  { value: "competition", label: "Competition", labelAr: "المسابقات" },
  { value: "sponsorship", label: "Sponsorship", labelAr: "الرعاية" },
  { value: "financial", label: "Financial", labelAr: "مالي" },
  { value: "orders", label: "Orders", labelAr: "الطلبات" },
  { value: "exhibition", label: "Exhibition", labelAr: "المعارض" },
];

const channels = [
  { value: "email", label: "Email", labelAr: "بريد إلكتروني", icon: Mail },
  { value: "whatsapp", label: "WhatsApp", labelAr: "واتساب", icon: Phone },
  { value: "sms", label: "SMS", labelAr: "رسالة نصية", icon: Send },
  { value: "in_app", label: "In-App", labelAr: "داخل التطبيق", icon: MessageSquare },
];

export default function CommunicationTemplatesAdmin() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isAr = language === "ar";

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [channelFilter, setChannelFilter] = useState("all");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);

  const [form, setForm] = useState({
    name: "",
    name_ar: "",
    slug: "",
    category: "general",
    channel: "email",
    subject: "",
    subject_ar: "",
    body: "",
    body_ar: "",
    variables: "",
    is_active: true,
  });

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["communication-templates", search, categoryFilter, channelFilter],
    queryFn: async () => {
      let query = supabase
        .from("communication_templates")
        .select("*")
        .order("category")
        .order("name");

      if (search) {
        query = query.or(`name.ilike.%${search}%,slug.ilike.%${search}%`);
      }
      if (categoryFilter !== "all") {
        query = query.eq("category", categoryFilter);
      }
      if (channelFilter !== "all") {
        query = query.eq("channel", channelFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Template[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: typeof form & { id?: string }) => {
      const payload = {
        name: data.name,
        name_ar: data.name_ar || null,
        slug: data.slug,
        category: data.category,
        channel: data.channel,
        subject: data.subject || null,
        subject_ar: data.subject_ar || null,
        body: data.body,
        body_ar: data.body_ar || null,
        variables: data.variables ? data.variables.split(",").map((v) => v.trim()).filter(Boolean) : [],
        is_active: data.is_active,
      };

      if (data.id) {
        const { error } = await supabase.from("communication_templates").update(payload).eq("id", data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("communication_templates").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["communication-templates"] });
      setEditDialogOpen(false);
      toast({ title: isAr ? "تم الحفظ" : "Template saved" });
    },
    onError: (e: any) => {
      toast({ title: isAr ? "فشل الحفظ" : "Save failed", description: e.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("communication_templates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["communication-templates"] });
      toast({ title: isAr ? "تم الحذف" : "Template deleted" });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("communication_templates").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["communication-templates"] });
    },
  });

  const openCreate = () => {
    setEditingTemplate(null);
    setForm({ name: "", name_ar: "", slug: "", category: "general", channel: "email", subject: "", subject_ar: "", body: "", body_ar: "", variables: "", is_active: true });
    setEditDialogOpen(true);
  };

  const openEdit = (t: Template) => {
    setEditingTemplate(t);
    setForm({
      name: t.name,
      name_ar: t.name_ar || "",
      slug: t.slug,
      category: t.category,
      channel: t.channel,
      subject: t.subject || "",
      subject_ar: t.subject_ar || "",
      body: t.body,
      body_ar: t.body_ar || "",
      variables: (t.variables || []).join(", "),
      is_active: t.is_active,
    });
    setEditDialogOpen(true);
  };

  const getCategoryLabel = (cat: string) => {
    const c = categories.find((c) => c.value === cat);
    return isAr ? c?.labelAr : c?.label || cat;
  };

  const getChannelInfo = (ch: string) => channels.find((c) => c.value === ch);

  const stats = {
    total: templates.length,
    active: templates.filter((t) => t.is_active).length,
    email: templates.filter((t) => t.channel === "email").length,
    whatsapp: templates.filter((t) => t.channel === "whatsapp").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{isAr ? "قوالب الاتصالات" : "Communication Templates"}</h1>
          <p className="text-muted-foreground">{isAr ? "إدارة قوالب البريد الإلكتروني والرسائل" : "Manage email, WhatsApp, and SMS templates"}</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          {isAr ? "إضافة قالب" : "Add Template"}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: isAr ? "الإجمالي" : "Total", value: stats.total, icon: FileText },
          { label: isAr ? "نشط" : "Active", value: stats.active, icon: MessageSquare },
          { label: isAr ? "بريد" : "Email", value: stats.email, icon: Mail },
          { label: isAr ? "واتساب" : "WhatsApp", value: stats.whatsapp, icon: Phone },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <s.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder={isAr ? "بحث..." : "Search..."} value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[150px]"><Filter className="mr-2 h-4 w-4" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{isAr ? "كل الفئات" : "All Categories"}</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.value} value={c.value}>{isAr ? c.labelAr : c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={channelFilter} onValueChange={setChannelFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{isAr ? "كل القنوات" : "All Channels"}</SelectItem>
            {channels.map((c) => (
              <SelectItem key={c.value} value={c.value}>{isAr ? c.labelAr : c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Templates Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{isAr ? "القالب" : "Template"}</TableHead>
              <TableHead>{isAr ? "الفئة" : "Category"}</TableHead>
              <TableHead>{isAr ? "القناة" : "Channel"}</TableHead>
              <TableHead>{isAr ? "المتغيرات" : "Variables"}</TableHead>
              <TableHead>{isAr ? "نشط" : "Active"}</TableHead>
              <TableHead>{isAr ? "إجراءات" : "Actions"}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {templates.map((t) => {
              const ch = getChannelInfo(t.channel);
              const ChIcon = ch?.icon || Mail;
              return (
                <TableRow key={t.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{isAr && t.name_ar ? t.name_ar : t.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{t.slug}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{getCategoryLabel(t.category)}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <ChIcon className="h-3.5 w-3.5" />
                      <span className="text-sm">{isAr ? ch?.labelAr : ch?.label}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {(t.variables || []).slice(0, 3).map((v) => (
                        <Badge key={v} variant="secondary" className="text-[10px] font-mono">{`{{${v}}}`}</Badge>
                      ))}
                      {(t.variables || []).length > 3 && (
                        <Badge variant="secondary" className="text-[10px]">+{(t.variables || []).length - 3}</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={t.is_active}
                      onCheckedChange={(checked) => toggleActiveMutation.mutate({ id: t.id, is_active: checked })}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => { setEditingTemplate(t); setPreviewDialogOpen(true); }}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openEdit(t)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => { if (confirm(isAr ? "حذف هذا القالب؟" : "Delete this template?")) deleteMutation.mutate(t.id); }}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {templates.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  {isAr ? "لا توجد قوالب" : "No templates found"}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? (isAr ? "تعديل القالب" : "Edit Template") : (isAr ? "إنشاء قالب" : "Create Template")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{isAr ? "الاسم (إنجليزي)" : "Name (English)"}</Label>
                <Input value={form.name} onChange={(e) => {
                  setForm((p) => ({ ...p, name: e.target.value, slug: p.slug || e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") }));
                }} />
              </div>
              <div className="space-y-2">
                <Label>{isAr ? "الاسم (عربي)" : "Name (Arabic)"}</Label>
                <Input value={form.name_ar} onChange={(e) => setForm((p) => ({ ...p, name_ar: e.target.value }))} dir="rtl" />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Slug</Label>
                <Input value={form.slug} onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))} className="font-mono text-sm" />
              </div>
              <div className="space-y-2">
                <Label>{isAr ? "الفئة" : "Category"}</Label>
                <Select value={form.category} onValueChange={(v) => setForm((p) => ({ ...p, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{isAr ? c.labelAr : c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{isAr ? "القناة" : "Channel"}</Label>
                <Select value={form.channel} onValueChange={(v) => setForm((p) => ({ ...p, channel: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {channels.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{isAr ? c.labelAr : c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {form.channel === "email" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>{isAr ? "الموضوع (إنجليزي)" : "Subject (English)"}</Label>
                  <Input value={form.subject} onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>{isAr ? "الموضوع (عربي)" : "Subject (Arabic)"}</Label>
                  <Input value={form.subject_ar} onChange={(e) => setForm((p) => ({ ...p, subject_ar: e.target.value }))} dir="rtl" />
                </div>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{isAr ? "المحتوى (إنجليزي)" : "Body (English)"}</Label>
                <Textarea value={form.body} onChange={(e) => setForm((p) => ({ ...p, body: e.target.value }))} rows={6} />
              </div>
              <div className="space-y-2">
                <Label>{isAr ? "المحتوى (عربي)" : "Body (Arabic)"}</Label>
                <Textarea value={form.body_ar} onChange={(e) => setForm((p) => ({ ...p, body_ar: e.target.value }))} rows={6} dir="rtl" />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Variable className="h-4 w-4" />
                {isAr ? "المتغيرات (مفصولة بفواصل)" : "Variables (comma-separated)"}
              </Label>
              <Input
                value={form.variables}
                onChange={(e) => setForm((p) => ({ ...p, variables: e.target.value }))}
                placeholder="company_name, order_number, amount"
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                {isAr ? "استخدم {{variable_name}} في المحتوى" : "Use {{variable_name}} in the body text"}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Switch checked={form.is_active} onCheckedChange={(checked) => setForm((p) => ({ ...p, is_active: checked }))} />
              <Label>{isAr ? "نشط" : "Active"}</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>{isAr ? "إلغاء" : "Cancel"}</Button>
            <Button onClick={() => saveMutation.mutate({ ...form, id: editingTemplate?.id })} disabled={!form.name || !form.slug || !form.body}>
              {isAr ? "حفظ" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{isAr ? "معاينة القالب" : "Template Preview"}</DialogTitle>
          </DialogHeader>
          {editingTemplate && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="outline">{getCategoryLabel(editingTemplate.category)}</Badge>
                <Badge variant="secondary">{getChannelInfo(editingTemplate.channel)?.[isAr ? "labelAr" : "label"]}</Badge>
              </div>
              {editingTemplate.subject && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">{isAr ? "الموضوع" : "Subject"}</p>
                  <p className="font-medium">{isAr && editingTemplate.subject_ar ? editingTemplate.subject_ar : editingTemplate.subject}</p>
                </div>
              )}
              <Separator />
              <div>
                <p className="text-xs text-muted-foreground mb-2">{isAr ? "المحتوى" : "Body"}</p>
                <div className="rounded-lg border bg-muted/50 p-4 text-sm whitespace-pre-wrap">
                  {isAr && editingTemplate.body_ar ? editingTemplate.body_ar : editingTemplate.body}
                </div>
              </div>
              {editingTemplate.variables && editingTemplate.variables.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">{isAr ? "المتغيرات" : "Variables"}</p>
                  <div className="flex flex-wrap gap-1">
                    {editingTemplate.variables.map((v) => (
                      <Badge key={v} variant="secondary" className="font-mono text-xs">{`{{${v}}}`}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
