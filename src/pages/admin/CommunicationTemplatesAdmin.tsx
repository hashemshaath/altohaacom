import { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { notifyFromTemplate } from "@/lib/notificationTriggers";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  MessageSquare, Plus, Edit, Trash2, Search, Mail, Phone, Send, Eye, Copy, Filter, FileText,
  Variable, Zap, ChevronDown, ChevronUp, CheckSquare, XSquare, Download, LayoutGrid, List,
} from "lucide-react";
import { useAdminBulkActions } from "@/hooks/useAdminBulkActions";
import { useCSVExport } from "@/hooks/useCSVExport";
import { BulkActionBar } from "@/components/admin/BulkActionBar";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";

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
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Template | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [sendUserId, setSendUserId] = useState("");
  const [sendPhone, setSendPhone] = useState("");
  const [sendVars, setSendVars] = useState<Record<string, string>>({});
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "", name_ar: "", slug: "", category: "general", channel: "email",
    subject: "", subject_ar: "", body: "", body_ar: "", variables: "", is_active: true,
  });

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["communication-templates", search, categoryFilter, channelFilter],
    queryFn: async () => {
      let query = supabase.from("communication_templates").select("*").order("category").order("name");
      if (search) query = query.or(`name.ilike.%${search}%,slug.ilike.%${search}%`);
      if (categoryFilter !== "all") query = query.eq("category", categoryFilter);
      if (channelFilter !== "all") query = query.eq("channel", channelFilter);
      const { data, error } = await query;
      if (error) throw error;
      return data as Template[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: typeof form & { id?: string }) => {
      const payload = {
        name: data.name, name_ar: data.name_ar || null, slug: data.slug,
        category: data.category, channel: data.channel,
        subject: data.subject || null, subject_ar: data.subject_ar || null,
        body: data.body, body_ar: data.body_ar || null,
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
      setDeleteTarget(null);
      toast({ title: isAr ? "تم الحذف" : "Template deleted" });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("communication_templates").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["communication-templates"] }),
  });

  const bulkToggleMutation = useMutation({
    mutationFn: async (active: boolean) => {
      const ids = [...bulk.selected];
      const { error } = await supabase.from("communication_templates").update({ is_active: active }).in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["communication-templates"] });
      bulk.clearSelection();
      toast({ title: isAr ? "تم التحديث" : "Templates updated" });
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async () => {
      const ids = [...bulk.selected];
      const { error } = await supabase.from("communication_templates").delete().in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["communication-templates"] });
      bulk.clearSelection();
      toast({ title: isAr ? "تم الحذف" : "Templates deleted" });
    },
  });

  const sendMutation = useMutation({
    mutationFn: async () => {
      if (!editingTemplate || !sendUserId) throw new Error("Missing data");
      await notifyFromTemplate({
        userId: sendUserId, templateSlug: editingTemplate.slug,
        variables: sendVars, channels: [editingTemplate.channel],
        phone: sendPhone || undefined,
      });
    },
    onSuccess: () => {
      setSendDialogOpen(false);
      setSendUserId(""); setSendPhone(""); setSendVars({});
      toast({ title: isAr ? "تم الإرسال" : "Notification sent" });
    },
    onError: (e: any) => {
      toast({ title: isAr ? "فشل الإرسال" : "Send failed", description: e.message, variant: "destructive" });
    },
  });

  const duplicateTemplate = async (t: Template) => {
    const payload = {
      name: `${t.name} (Copy)`, name_ar: t.name_ar ? `${t.name_ar} (نسخة)` : null,
      slug: `${t.slug}-copy-${Date.now().toString(36)}`,
      category: t.category, channel: t.channel,
      subject: t.subject, subject_ar: t.subject_ar,
      body: t.body, body_ar: t.body_ar,
      variables: t.variables, is_active: false,
    };
    const { error } = await supabase.from("communication_templates").insert(payload);
    if (error) {
      toast({ title: isAr ? "فشل النسخ" : "Duplicate failed", description: error.message, variant: "destructive" });
    } else {
      queryClient.invalidateQueries({ queryKey: ["communication-templates"] });
      toast({ title: isAr ? "تم النسخ" : "Template duplicated" });
    }
  };

  const bulk = useAdminBulkActions(templates);

  const { exportCSV: exportTemplatesCSV } = useCSVExport({
    columns: [
      { header: isAr ? "الاسم" : "Name", accessor: (r: Template) => isAr && r.name_ar ? r.name_ar : r.name },
      { header: "Slug", accessor: (r: Template) => r.slug },
      { header: isAr ? "الفئة" : "Category", accessor: (r: Template) => r.category },
      { header: isAr ? "القناة" : "Channel", accessor: (r: Template) => r.channel },
      { header: isAr ? "الموضوع" : "Subject", accessor: (r: Template) => r.subject || "" },
      { header: isAr ? "نشط" : "Active", accessor: (r: Template) => r.is_active ? "Yes" : "No" },
      { header: isAr ? "المتغيرات" : "Variables", accessor: (r: Template) => (r.variables || []).join("; ") },
    ],
    filename: "communication-templates",
  });

  const openSendDialog = (t: Template) => {
    setEditingTemplate(t);
    const vars: Record<string, string> = {};
    (t.variables || []).forEach((v) => { vars[v] = ""; });
    setSendVars(vars); setSendUserId(""); setSendPhone("");
    setSendDialogOpen(true);
  };

  const openCreate = () => {
    setEditingTemplate(null);
    setForm({ name: "", name_ar: "", slug: "", category: "general", channel: "email", subject: "", subject_ar: "", body: "", body_ar: "", variables: "", is_active: true });
    setEditDialogOpen(true);
  };

  const openEdit = (t: Template) => {
    setEditingTemplate(t);
    setForm({
      name: t.name, name_ar: t.name_ar || "", slug: t.slug, category: t.category, channel: t.channel,
      subject: t.subject || "", subject_ar: t.subject_ar || "", body: t.body, body_ar: t.body_ar || "",
      variables: (t.variables || []).join(", "), is_active: t.is_active,
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
      <AdminPageHeader
        icon={MessageSquare}
        title={isAr ? "قوالب الاتصالات" : "Communication Templates"}
        description={isAr ? "إدارة قوالب البريد الإلكتروني والرسائل النصية والواتساب" : "Manage email, WhatsApp, SMS and in-app notification templates"}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => exportTemplatesCSV(templates)}>
              <Download className="me-2 h-4 w-4" />
              {isAr ? "تصدير" : "Export CSV"}
            </Button>
            <Button onClick={openCreate}>
              <Plus className="me-2 h-4 w-4" />
              {isAr ? "إضافة قالب" : "Add Template"}
            </Button>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: isAr ? "الإجمالي" : "Total", value: stats.total, icon: FileText, color: "text-primary", bg: "bg-primary/10" },
          { label: isAr ? "نشط" : "Active", value: stats.active, icon: MessageSquare, color: "text-chart-5", bg: "bg-chart-5/10" },
          { label: isAr ? "بريد" : "Email", value: stats.email, icon: Mail, color: "text-chart-3", bg: "bg-chart-3/10" },
          { label: isAr ? "واتساب" : "WhatsApp", value: stats.whatsapp, icon: Phone, color: "text-chart-4", bg: "bg-chart-4/10" },
        ].map((s) => (
          <Card key={s.label} className="rounded-2xl border-border/40 group transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
            <CardContent className="flex items-center gap-3 p-4">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 ${s.bg}`}>
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <div>
                <AnimatedCounter value={s.value} className="text-2xl font-bold" />
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <BulkActionBar
        count={bulk.count}
        onClear={bulk.clearSelection}
        onDelete={() => bulkDeleteMutation.mutate()}
        onStatusChange={() => bulkToggleMutation.mutate(true)}
        onExport={() => exportTemplatesCSV(bulk.selectedItems)}
      >
        <Button variant="outline" size="sm" onClick={() => bulkToggleMutation.mutate(false)} className="gap-1.5">
          <XSquare className="h-3.5 w-3.5" />
          {isAr ? "تعطيل" : "Deactivate"}
        </Button>
      </BulkActionBar>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="ps-9 rounded-xl" placeholder={isAr ? "بحث..." : "Search..."} value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[150px] rounded-xl"><Filter className="me-2 h-4 w-4" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{isAr ? "كل الفئات" : "All Categories"}</SelectItem>
            {categories.map((c) => <SelectItem key={c.value} value={c.value}>{isAr ? c.labelAr : c.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={channelFilter} onValueChange={setChannelFilter}>
          <SelectTrigger className="w-[140px] rounded-xl"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{isAr ? "كل القنوات" : "All Channels"}</SelectItem>
            {channels.map((c) => <SelectItem key={c.value} value={c.value}>{isAr ? c.labelAr : c.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex items-center border border-border/40 rounded-xl overflow-hidden">
          <Button variant={viewMode === "table" ? "secondary" : "ghost"} size="icon" className="h-9 w-9 rounded-none" onClick={() => setViewMode("table")}>
            <List className="h-4 w-4" />
          </Button>
          <Button variant={viewMode === "grid" ? "secondary" : "ghost"} size="icon" className="h-9 w-9 rounded-none" onClick={() => setViewMode("grid")}>
            <LayoutGrid className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Grid View */}
      {viewMode === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map(t => {
            const ch = getChannelInfo(t.channel);
            const ChIcon = ch?.icon || Mail;
            return (
              <Card key={t.id} className={`rounded-2xl border-border/40 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 ${!t.is_active ? "opacity-60" : ""}`}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10">
                        <ChIcon className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{isAr && t.name_ar ? t.name_ar : t.name}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">{t.slug}</p>
                      </div>
                    </div>
                    <Switch checked={t.is_active} onCheckedChange={(checked) => toggleActiveMutation.mutate({ id: t.id, is_active: checked })} />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Badge variant="outline" className="text-[10px]">{getCategoryLabel(t.category)}</Badge>
                    <Badge variant="secondary" className="text-[10px]">{isAr ? ch?.labelAr : ch?.label}</Badge>
                  </div>
                  {(t.variables || []).length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {(t.variables || []).slice(0, 3).map(v => (
                        <Badge key={v} variant="secondary" className="text-[9px] font-mono">{`{{${v}}}`}</Badge>
                      ))}
                      {(t.variables || []).length > 3 && (
                        <Badge variant="secondary" className="text-[9px]">+{(t.variables || []).length - 3}</Badge>
                      )}
                    </div>
                  )}
                  <Separator />
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openSendDialog(t)}><Zap className="h-3.5 w-3.5 text-chart-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingTemplate(t); setPreviewDialogOpen(true); }}><Eye className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(t)}><Edit className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => duplicateTemplate(t)}><Copy className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDeleteTarget(t)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {templates.length === 0 && (
            <div className="col-span-full">
              <AdminEmptyState
                icon={MessageSquare}
                title="No templates found"
                titleAr="لا توجد قوالب"
                description="Create your first communication template"
                descriptionAr="أنشئ أول قالب تواصل"
                actionLabel="Create Template"
                actionLabelAr="إنشاء قالب"
                onAction={openCreate}
              />
            </div>
          )}
        </div>
      ) : (
        /* Table View */
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox checked={bulk.isAllSelected} onCheckedChange={bulk.toggleAll} />
                </TableHead>
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
                const isExpanded = expandedId === t.id;
                return (
                  <>
                    <TableRow key={t.id} className={`cursor-pointer ${isExpanded ? "bg-muted/30" : ""}`}>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox checked={bulk.isSelected(t.id)} onCheckedChange={() => bulk.toggleOne(t.id)} />
                      </TableCell>
                      <TableCell onClick={() => setExpandedId(isExpanded ? null : t.id)}>
                        <div className="flex items-center gap-2">
                          {isExpanded ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
                          <div>
                            <p className="font-medium">{isAr && t.name_ar ? t.name_ar : t.name}</p>
                            <p className="text-xs text-muted-foreground font-mono">{t.slug}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="outline">{getCategoryLabel(t.category)}</Badge></TableCell>
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
                        <Switch checked={t.is_active} onCheckedChange={(checked) => toggleActiveMutation.mutate({ id: t.id, is_active: checked })} />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openSendDialog(t)} title={isAr ? "إرسال" : "Send"}>
                            <Zap className="h-4 w-4 text-chart-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => { setEditingTemplate(t); setPreviewDialogOpen(true); }}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => openEdit(t)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => duplicateTemplate(t)}>
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(t)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    {/* Inline Detail Panel */}
                    {isExpanded && (
                      <TableRow key={`${t.id}-detail`}>
                        <TableCell colSpan={7} className="bg-muted/20 p-0">
                          <div className="p-4 space-y-4">
                            <Tabs defaultValue="preview">
                              <TabsList>
                                <TabsTrigger value="preview">{isAr ? "معاينة" : "Preview"}</TabsTrigger>
                                <TabsTrigger value="preview_ar">{isAr ? "معاينة عربي" : "Preview (Arabic)"}</TabsTrigger>
                                <TabsTrigger value="info">{isAr ? "معلومات" : "Info"}</TabsTrigger>
                              </TabsList>
                              <TabsContent value="preview" className="space-y-2 mt-3">
                                {t.subject && (
                                  <div>
                                    <p className="text-xs text-muted-foreground mb-1">{isAr ? "الموضوع" : "Subject"}</p>
                                    <p className="font-medium text-sm">{t.subject}</p>
                                  </div>
                                )}
                                <div className="rounded-xl border bg-background p-4 text-sm whitespace-pre-wrap">
                                  {t.body}
                                </div>
                              </TabsContent>
                              <TabsContent value="preview_ar" className="space-y-2 mt-3">
                                {t.subject_ar && (
                                  <div dir="rtl">
                                    <p className="text-xs text-muted-foreground mb-1">الموضوع</p>
                                    <p className="font-medium text-sm">{t.subject_ar}</p>
                                  </div>
                                )}
                                <div className="rounded-xl border bg-background p-4 text-sm whitespace-pre-wrap" dir="rtl">
                                  {t.body_ar || <span className="text-muted-foreground italic">{isAr ? "لا يوجد محتوى عربي" : "No Arabic content"}</span>}
                                </div>
                              </TabsContent>
                              <TabsContent value="info" className="mt-3">
                                <div className="grid gap-3 sm:grid-cols-3">
                                  <div>
                                    <p className="text-xs text-muted-foreground">{isAr ? "تاريخ الإنشاء" : "Created"}</p>
                                    <p className="text-sm">{new Date(t.created_at).toLocaleDateString()}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">{isAr ? "آخر تحديث" : "Updated"}</p>
                                    <p className="text-sm">{new Date(t.updated_at).toLocaleDateString()}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">{isAr ? "المتغيرات" : "Variables"}</p>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {(t.variables || []).map(v => (
                                        <Badge key={v} variant="secondary" className="text-[10px] font-mono">{`{{${v}}}`}</Badge>
                                      ))}
                                      {!(t.variables || []).length && <span className="text-sm text-muted-foreground">—</span>}
                                    </div>
                                  </div>
                                </div>
                              </TabsContent>
                            </Tabs>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                );
              })}
              {templates.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                    {isAr ? "لا توجد قوالب" : "No templates found"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{isAr ? "حذف القالب" : "Delete Template"}</AlertDialogTitle>
            <AlertDialogDescription>
              {isAr
                ? `هل أنت متأكد من حذف "${deleteTarget?.name_ar || deleteTarget?.name}"؟ لا يمكن التراجع عن هذا الإجراء.`
                : `Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{isAr ? "إلغاء" : "Cancel"}</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}>
              {isAr ? "حذف" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
                    {categories.map((c) => <SelectItem key={c.value} value={c.value}>{isAr ? c.labelAr : c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{isAr ? "القناة" : "Channel"}</Label>
                <Select value={form.channel} onValueChange={(v) => setForm((p) => ({ ...p, channel: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {channels.map((c) => <SelectItem key={c.value} value={c.value}>{isAr ? c.labelAr : c.label}</SelectItem>)}
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
              <Input value={form.variables} onChange={(e) => setForm((p) => ({ ...p, variables: e.target.value }))} placeholder="company_name, order_number, amount" className="font-mono text-sm" />
              <p className="text-xs text-muted-foreground">{isAr ? "استخدم {{variable_name}} في المحتوى" : "Use {{variable_name}} in the body text"}</p>
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
                <div className="rounded-xl border bg-muted/50 p-4 text-sm whitespace-pre-wrap">
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

      {/* Send Dialog */}
      <Dialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-chart-4" />
              {isAr ? "إرسال إشعار من القالب" : "Send Notification from Template"}
            </DialogTitle>
          </DialogHeader>
          {editingTemplate && (
            <div className="space-y-4">
              <div className="rounded-xl border bg-muted/50 p-3">
                <p className="font-medium text-sm">{isAr && editingTemplate.name_ar ? editingTemplate.name_ar : editingTemplate.name}</p>
                <p className="text-xs text-muted-foreground font-mono">{editingTemplate.slug} • {editingTemplate.channel}</p>
              </div>
              <div className="space-y-2">
                <Label>{isAr ? "معرف المستخدم" : "User ID"}</Label>
                <Input value={sendUserId} onChange={(e) => setSendUserId(e.target.value)} placeholder="UUID of the recipient user" className="font-mono text-sm" />
              </div>
              {(editingTemplate.channel === "whatsapp" || editingTemplate.channel === "sms") && (
                <div className="space-y-2">
                  <Label>{isAr ? "رقم الهاتف" : "Phone Number"}</Label>
                  <Input value={sendPhone} onChange={(e) => setSendPhone(e.target.value)} placeholder="+966XXXXXXXXX" />
                </div>
              )}
              {(editingTemplate.variables || []).length > 0 && (
                <>
                  <Separator />
                  <p className="text-sm font-medium">{isAr ? "المتغيرات" : "Variables"}</p>
                  <div className="space-y-2">
                    {(editingTemplate.variables || []).map((v) => (
                      <div key={v} className="space-y-1">
                        <Label className="text-xs font-mono">{`{{${v}}}`}</Label>
                        <Input value={sendVars[v] || ""} onChange={(e) => setSendVars((p) => ({ ...p, [v]: e.target.value }))} placeholder={v} />
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSendDialogOpen(false)}>{isAr ? "إلغاء" : "Cancel"}</Button>
            <Button onClick={() => sendMutation.mutate()} disabled={!sendUserId || sendMutation.isPending}>
              <Send className="me-2 h-4 w-4" />
              {sendMutation.isPending ? (isAr ? "جارٍ الإرسال..." : "Sending...") : (isAr ? "إرسال" : "Send")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
