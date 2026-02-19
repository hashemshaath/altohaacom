import { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import {
  Languages, Search, Sparkles, Globe, FileText, Shield, AlertTriangle,
  CheckCircle, Settings, BookOpen, Plus, Edit, Trash2, Loader2, Cpu,
  Database, Save, X, Zap, TestTube, Copy, ArrowRightLeft, Type,
  Hash, FileCheck, BarChart3,
} from "lucide-react";

// ── Field Types ────────────────────────────────────
const FIELD_TYPES = [
  { value: "title", label: "Title", label_ar: "عنوان", maxHint: 60 },
  { value: "meta_title", label: "Meta Title", label_ar: "عنوان ميتا", maxHint: 60 },
  { value: "meta_description", label: "Meta Description", label_ar: "وصف ميتا", maxHint: 160 },
  { value: "excerpt", label: "Excerpt", label_ar: "مقتطف", maxHint: 200 },
  { value: "description", label: "Description", label_ar: "وصف", maxHint: 500 },
  { value: "bio", label: "Bio", label_ar: "نبذة", maxHint: 300 },
  { value: "body", label: "Body", label_ar: "محتوى", maxHint: 10000 },
  { value: "tag", label: "Tag", label_ar: "وسم", maxHint: 30 },
  { value: "slug", label: "Slug", label_ar: "رابط", maxHint: 80 },
  { value: "text", label: "Text", label_ar: "نص", maxHint: 500 },
] as const;

// ── Hooks ──────────────────────────────────────────

function useSeoFields() {
  return useQuery({
    queryKey: ["seo-fields"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("seo_translatable_fields")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return data || [];
    },
  });
}

function useSeoRules() {
  return useQuery({
    queryKey: ["seo-rules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("seo_rules")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return data || [];
    },
  });
}

function useSeoModels() {
  return useQuery({
    queryKey: ["seo-models"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("seo_ai_models")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return data || [];
    },
  });
}

function useSeoSources() {
  return useQuery({
    queryKey: ["seo-sources"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("seo_content_sources")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return data || [];
    },
  });
}

// ── Main Component ─────────────────────────────────

export default function TranslationSEOAdmin() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isAr = language === "ar";

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [fieldTypeFilter, setFieldTypeFilter] = useState("all");

  const { data: fields = [], isLoading: fieldsLoading } = useSeoFields();
  const { data: rules = [], isLoading: rulesLoading } = useSeoRules();
  const { data: models = [], isLoading: modelsLoading } = useSeoModels();
  const { data: sources = [], isLoading: sourcesLoading } = useSeoSources();

  // Dialog states
  const [fieldDialog, setFieldDialog] = useState(false);
  const [ruleDialog, setRuleDialog] = useState(false);
  const [modelDialog, setModelDialog] = useState(false);
  const [sourceDialog, setSourceDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  // ── Filtered data ─────────────────────────────
  const filteredFields = fields.filter((f: any) => {
    const matchesSearch = !search ||
      f.label?.toLowerCase().includes(search.toLowerCase()) ||
      f.label_ar?.includes(search) ||
      f.table_name?.toLowerCase().includes(search.toLowerCase()) ||
      f.field_name?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === "all" || f.category === categoryFilter;
    const matchesType = fieldTypeFilter === "all" || f.field_type === fieldTypeFilter;
    return matchesSearch && matchesCategory && matchesType;
  });

  const seoFields = fields.filter((f: any) => f.seo_optimize);
  const requiredFields = fields.filter((f: any) => f.is_required);
  const activeModels = models.filter((m: any) => m.is_active);
  const enabledRules = rules.filter((r: any) => r.is_enabled);

  // ── Generic CRUD mutations ────────────────────
  const upsertMutation = useMutation({
    mutationFn: async ({ table, data, id }: { table: string; data: any; id?: string }) => {
      if (id) {
        const { error } = await supabase.from(table as any).update(data).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from(table as any).insert({ ...data, created_by: user?.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seo-fields"] });
      queryClient.invalidateQueries({ queryKey: ["seo-rules"] });
      queryClient.invalidateQueries({ queryKey: ["seo-models"] });
      queryClient.invalidateQueries({ queryKey: ["seo-sources"] });
      toast({ title: isAr ? "تم الحفظ بنجاح" : "Saved successfully" });
    },
    onError: (e) => toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: e.message }),
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ table, id }: { table: string; id: string }) => {
      const { error } = await supabase.from(table as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seo-fields"] });
      queryClient.invalidateQueries({ queryKey: ["seo-rules"] });
      queryClient.invalidateQueries({ queryKey: ["seo-models"] });
      queryClient.invalidateQueries({ queryKey: ["seo-sources"] });
      toast({ title: isAr ? "تم الحذف" : "Deleted" });
    },
    onError: (e) => toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: e.message }),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ table, id, field, value }: { table: string; id: string; field: string; value: boolean }) => {
      const { error } = await supabase.from(table as any).update({ [field]: value }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seo-fields"] });
      queryClient.invalidateQueries({ queryKey: ["seo-rules"] });
      queryClient.invalidateQueries({ queryKey: ["seo-models"] });
      queryClient.invalidateQueries({ queryKey: ["seo-sources"] });
    },
    onError: (e) => toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: e.message }),
  });

  const isLoading = fieldsLoading || rulesLoading || modelsLoading || sourcesLoading;

  // Field type stats
  const fieldTypeStats = FIELD_TYPES.map(ft => ({
    ...ft,
    count: fields.filter((f: any) => f.field_type === ft.value).length,
  })).filter(ft => ft.count > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold">
            {isAr ? "مركز الترجمة وتحسين المحتوى" : "Translation & SEO Command Center"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isAr
              ? "إدارة كاملة للحقول والقواعد والنماذج والمصادر — مع تحسين ذكي يراعي نوع الحقل وطوله"
              : "Full management of fields, rules, AI models & sources — with field-type-aware AI optimization"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="gap-1"><Globe className="h-3 w-3" />{fields.length} {isAr ? "حقل" : "fields"}</Badge>
          <Badge className="gap-1 bg-chart-3/15 text-chart-3 border-chart-3/20"><Sparkles className="h-3 w-3" />{seoFields.length} SEO</Badge>
          <Badge variant="secondary" className="gap-1"><Cpu className="h-3 w-3" />{activeModels.length} {isAr ? "نموذج" : "models"}</Badge>
          <Badge variant="outline" className="gap-1"><Shield className="h-3 w-3" />{enabledRules.length} {isAr ? "قاعدة" : "rules"}</Badge>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : (
        <Tabs defaultValue="fields">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="fields" className="gap-1.5">
              <Languages className="h-4 w-4" /><span className="hidden sm:inline">{isAr ? "الحقول" : "Fields"}</span>
            </TabsTrigger>
            <TabsTrigger value="rules" className="gap-1.5">
              <Shield className="h-4 w-4" /><span className="hidden sm:inline">{isAr ? "القواعد" : "Rules"}</span>
            </TabsTrigger>
            <TabsTrigger value="models" className="gap-1.5">
              <Cpu className="h-4 w-4" /><span className="hidden sm:inline">{isAr ? "النماذج" : "Models"}</span>
            </TabsTrigger>
            <TabsTrigger value="sources" className="gap-1.5">
              <Database className="h-4 w-4" /><span className="hidden sm:inline">{isAr ? "المصادر" : "Sources"}</span>
            </TabsTrigger>
            <TabsTrigger value="playground" className="gap-1.5">
              <TestTube className="h-4 w-4" /><span className="hidden sm:inline">{isAr ? "المختبر" : "Playground"}</span>
            </TabsTrigger>
          </TabsList>

          {/* ═══════════ FIELDS TAB ═══════════ */}
          <TabsContent value="fields" className="mt-6 space-y-4">
            <Card>
              <CardContent className="flex flex-wrap gap-4 pt-6">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder={isAr ? "بحث في الحقول..." : "Search fields..."} value={search} onChange={(e) => setSearch(e.target.value)} className="ps-10" />
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{isAr ? "كل الأقسام" : "All Sections"}</SelectItem>
                    {sources.map((s: any) => (
                      <SelectItem key={s.source_key} value={s.source_key}>{isAr ? s.name_ar : s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={fieldTypeFilter} onValueChange={setFieldTypeFilter}>
                  <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{isAr ? "كل الأنواع" : "All Types"}</SelectItem>
                    {FIELD_TYPES.map((ft) => (
                      <SelectItem key={ft.value} value={ft.value}>{isAr ? ft.label_ar : ft.label} ({ft.maxHint})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={() => { setEditingItem(null); setFieldDialog(true); }}>
                  <Plus className="me-2 h-4 w-4" />{isAr ? "حقل جديد" : "Add Field"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{isAr ? "خريطة الحقول ثنائية اللغة" : "Bilingual Field Map"}</CardTitle>
                <CardDescription>{isAr ? "جميع الحقول القابلة للترجمة — نوع الحقل يحدد الطول الأمثل للذكاء الاصطناعي" : "All translatable fields — field type determines optimal AI output length"}</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{isAr ? "القسم" : "Section"}</TableHead>
                        <TableHead>{isAr ? "الحقل" : "Field"}</TableHead>
                        <TableHead>{isAr ? "النوع" : "Type"}</TableHead>
                        <TableHead>{isAr ? "الحد" : "Max"}</TableHead>
                        <TableHead>{isAr ? "مطلوب" : "Req."}</TableHead>
                        <TableHead>SEO</TableHead>
                        <TableHead>{isAr ? "مفعل" : "Active"}</TableHead>
                        <TableHead>{isAr ? "إجراءات" : "Actions"}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredFields.map((f: any) => {
                        const src = sources.find((s: any) => s.source_key === f.category);
                        const ft = FIELD_TYPES.find(t => t.value === f.field_type);
                        return (
                          <TableRow key={f.id} className={!f.is_active ? "opacity-50" : ""}>
                            <TableCell>
                              <Badge variant="outline" className="capitalize text-xs" style={src?.color ? { borderColor: src.color, color: src.color } : undefined}>
                                {isAr ? src?.name_ar || f.category : src?.name || f.category}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div>
                                <span className="font-mono text-xs">{f.field_name}</span>
                                {f.label && <p className="text-[10px] text-muted-foreground">{isAr ? f.label_ar || f.label : f.label}</p>}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="text-[10px] gap-1">
                                <Type className="h-2.5 w-2.5" />
                                {isAr ? ft?.label_ar || f.field_type : ft?.label || f.field_type}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Badge variant="outline" className="text-xs tabular-nums">{f.max_length}</Badge>
                                {ft && f.max_length > ft.maxHint && (
                                  <span title={isAr ? `الحد الموصى: ${ft.maxHint}` : `Recommended: ${ft.maxHint}`}><AlertTriangle className="h-3 w-3 text-chart-4" /></span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>{f.is_required ? <CheckCircle className="h-4 w-4 text-chart-3" /> : <span className="text-muted-foreground text-xs">—</span>}</TableCell>
                            <TableCell>{f.seo_optimize ? <Sparkles className="h-4 w-4 text-chart-4" /> : <span className="text-muted-foreground text-xs">—</span>}</TableCell>
                            <TableCell>
                              <Switch checked={f.is_active} onCheckedChange={(v) => toggleMutation.mutate({ table: "seo_translatable_fields", id: f.id, field: "is_active", value: v })} />
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingItem(f); setFieldDialog(true); }}><Edit className="h-3.5 w-3.5" /></Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteMutation.mutate({ table: "seo_translatable_fields", id: f.id })}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Stats & Field Type Distribution */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {[
                { value: fields.length, label: isAr ? "إجمالي الحقول" : "Total Fields", color: "text-primary" },
                { value: requiredFields.length, label: isAr ? "حقول مطلوبة" : "Required", color: "text-chart-3" },
                { value: seoFields.length, label: isAr ? "محسّنة SEO" : "SEO Optimized", color: "text-chart-4" },
                { value: new Set(fields.map((f: any) => f.category)).size, label: isAr ? "أقسام" : "Sections", color: "text-chart-1" },
                { value: new Set(fields.map((f: any) => f.field_type)).size, label: isAr ? "أنواع حقول" : "Field Types", color: "text-chart-2" },
              ].map((s, i) => (
                <Card key={i}><CardContent className="p-4 text-center"><p className={`text-3xl font-bold tabular-nums ${s.color}`}>{s.value}</p><p className="text-sm text-muted-foreground">{s.label}</p></CardContent></Card>
              ))}
            </div>

            {/* Field Type Distribution */}
            {fieldTypeStats.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base"><BarChart3 className="h-4 w-4" />{isAr ? "توزيع أنواع الحقول" : "Field Type Distribution"}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3">
                    {fieldTypeStats.map(ft => (
                      <div key={ft.value} className="flex items-center gap-2 rounded-lg border px-3 py-2">
                        <Type className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-sm font-medium">{isAr ? ft.label_ar : ft.label}</span>
                        <Badge variant="secondary" className="tabular-nums text-xs">{ft.count}</Badge>
                        <span className="text-[10px] text-muted-foreground">≤{ft.maxHint}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ═══════════ RULES TAB ═══════════ */}
          <TabsContent value="rules" className="mt-6 space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{isAr ? "قواعد تحسين المحتوى والترجمة" : "Content & Translation Rules"}</CardTitle>
                    <CardDescription>{isAr ? "القيود والإرشادات المفروضة على مساعد الذكاء الاصطناعي" : "Constraints and guidelines enforced on the AI assistant"}</CardDescription>
                  </div>
                  <Button onClick={() => { setEditingItem(null); setRuleDialog(true); }}>
                    <Plus className="me-2 h-4 w-4" />{isAr ? "قاعدة جديدة" : "Add Rule"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {rules.map((rule: any) => (
                  <div key={rule.id} className={`flex items-start gap-4 rounded-xl border p-4 transition-all ${rule.is_enabled ? "" : "opacity-50 bg-muted/30"}`}>
                    <div className="mt-1">
                      {rule.severity === "error" ? <AlertTriangle className="h-5 w-5 text-destructive" /> : rule.severity === "warning" ? <AlertTriangle className="h-5 w-5 text-chart-4" /> : <FileText className="h-5 w-5 text-chart-1" />}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant={rule.severity === "error" ? "destructive" : "outline"} className="text-xs">
                          {rule.severity === "error" ? (isAr ? "إلزامي" : "Required") : rule.severity === "warning" ? (isAr ? "تحذير" : "Warning") : (isAr ? "معلومة" : "Info")}
                        </Badge>
                        <span className="text-xs text-muted-foreground font-mono">{rule.field_scope}</span>
                      </div>
                      <p className="text-sm font-medium">{isAr ? rule.rule_text_ar : rule.rule_text}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingItem(rule); setRuleDialog(true); }}><Edit className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteMutation.mutate({ table: "seo_rules", id: rule.id })}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                      <Switch checked={rule.is_enabled} onCheckedChange={(v) => toggleMutation.mutate({ table: "seo_rules", id: rule.id, field: "is_enabled", value: v })} />
                    </div>
                  </div>
                ))}
                {rules.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">{isAr ? "لا توجد قواعد بعد" : "No rules yet"}</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════════ MODELS TAB ═══════════ */}
          <TabsContent value="models" className="mt-6 space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2"><Cpu className="h-5 w-5" />{isAr ? "نماذج الذكاء الاصطناعي" : "AI Models"}</CardTitle>
                    <CardDescription>{isAr ? "إدارة النماذج المستخدمة في الترجمة وتحسين المحتوى" : "Manage models used for translation and content optimization"}</CardDescription>
                  </div>
                  <Button onClick={() => { setEditingItem(null); setModelDialog(true); }}>
                    <Plus className="me-2 h-4 w-4" />{isAr ? "نموذج جديد" : "Add Model"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {models.map((m: any) => (
                    <Card key={m.id} className={`relative ${!m.is_active ? "opacity-50" : ""} ${m.is_default ? "border-primary shadow-sm shadow-primary/10" : ""}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">{isAr ? m.display_name_ar || m.display_name : m.display_name}</h3>
                              {m.is_default && <Badge className="text-[10px]">{isAr ? "افتراضي" : "Default"}</Badge>}
                            </div>
                            <p className="text-xs font-mono text-muted-foreground">{m.model_id}</p>
                            <p className="text-xs text-muted-foreground">{isAr ? m.description_ar || m.description : m.description}</p>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {(m.capabilities || []).map((c: string) => (
                                <Badge key={c} variant="secondary" className="text-[10px]">
                                  {c === "translate" ? (isAr ? "ترجمة" : "Translate") : c === "optimize" ? (isAr ? "تحسين" : "Optimize") : c === "summarize" ? (isAr ? "تلخيص" : "Summarize") : c === "rewrite" ? (isAr ? "إعادة صياغة" : "Rewrite") : c}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <Switch checked={m.is_active} onCheckedChange={(v) => toggleMutation.mutate({ table: "seo_ai_models", id: m.id, field: "is_active", value: v })} />
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingItem(m); setModelDialog(true); }}><Edit className="h-3.5 w-3.5" /></Button>
                              {!m.is_default && (
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteMutation.mutate({ table: "seo_ai_models", id: m.id })}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════════ SOURCES TAB ═══════════ */}
          <TabsContent value="sources" className="mt-6 space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2"><Database className="h-5 w-5" />{isAr ? "مصادر المحتوى" : "Content Sources"}</CardTitle>
                    <CardDescription>{isAr ? "الأقسام والجداول التي تتطلب ترجمة وتحسين محتوى" : "Sections and tables that require translation and content optimization"}</CardDescription>
                  </div>
                  <Button onClick={() => { setEditingItem(null); setSourceDialog(true); }}>
                    <Plus className="me-2 h-4 w-4" />{isAr ? "مصدر جديد" : "Add Source"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {sources.map((s: any) => {
                    const fieldCount = fields.filter((f: any) => f.category === s.source_key).length;
                    return (
                      <div key={s.id} className={`flex items-center justify-between rounded-xl border p-4 ${!s.is_active ? "opacity-50" : ""}`}>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: s.color + "20" }}>
                            <FileText className="h-5 w-5" style={{ color: s.color }} />
                          </div>
                          <div>
                            <h4 className="font-medium text-sm">{isAr ? s.name_ar : s.name}</h4>
                            <p className="text-xs text-muted-foreground">{fieldCount} {isAr ? "حقل" : "fields"} · <span className="font-mono">{s.source_key}</span></p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Switch checked={s.is_active} onCheckedChange={(v) => toggleMutation.mutate({ table: "seo_content_sources", id: s.id, field: "is_active", value: v })} />
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingItem(s); setSourceDialog(true); }}><Edit className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteMutation.mutate({ table: "seo_content_sources", id: s.id })}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════════ PLAYGROUND TAB ═══════════ */}
          <TabsContent value="playground" className="mt-6">
            <AIPlayground isAr={isAr} />
          </TabsContent>
        </Tabs>
      )}

      {/* ═══════════ DIALOGS ═══════════ */}
      <FieldDialog open={fieldDialog} onClose={() => setFieldDialog(false)} item={editingItem} sources={sources} onSave={(data: any, id?: string) => upsertMutation.mutate({ table: "seo_translatable_fields", data, id })} isAr={isAr} saving={upsertMutation.isPending} />
      <RuleDialog open={ruleDialog} onClose={() => setRuleDialog(false)} item={editingItem} onSave={(data: any, id?: string) => upsertMutation.mutate({ table: "seo_rules", data, id })} isAr={isAr} saving={upsertMutation.isPending} />
      <ModelDialog open={modelDialog} onClose={() => setModelDialog(false)} item={editingItem} onSave={(data: any, id?: string) => upsertMutation.mutate({ table: "seo_ai_models", data, id })} isAr={isAr} saving={upsertMutation.isPending} />
      <SourceDialog open={sourceDialog} onClose={() => setSourceDialog(false)} item={editingItem} onSave={(data: any, id?: string) => upsertMutation.mutate({ table: "seo_content_sources", data, id })} isAr={isAr} saving={upsertMutation.isPending} />
    </div>
  );
}

// ═══════════════════════════════════════════════════
// AI Playground — Live Testing Panel
// ═══════════════════════════════════════════════════

function AIPlayground({ isAr }: { isAr: boolean }) {
  const { toast } = useToast();
  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState("");
  const [fieldType, setFieldType] = useState("title");
  const [sourceLang, setSourceLang] = useState<"en" | "ar">("en");
  const [mode, setMode] = useState<"optimize" | "translate">("optimize");
  const [loading, setLoading] = useState(false);
  const [maxLength, setMaxLength] = useState(60);

  // Auto-update maxLength when fieldType changes
  const handleFieldTypeChange = (val: string) => {
    setFieldType(val);
    const ft = FIELD_TYPES.find(f => f.value === val);
    if (ft) setMaxLength(ft.maxHint);
  };

  const handleRun = async () => {
    if (!inputText.trim()) return;
    setLoading(true);
    setOutputText("");
    try {
      const body: any = {
        text: inputText,
        source_lang: sourceLang,
        field_type: fieldType,
        max_length: maxLength,
      };
      if (mode === "optimize") {
        body.optimize_only = true;
      } else {
        body.target_lang = sourceLang === "en" ? "ar" : "en";
        body.optimize_seo = true;
      }
      const { data, error } = await supabase.functions.invoke("ai-translate-seo", { body });
      if (error) throw error;
      const result = data?.optimized || data?.translated || "";
      setOutputText(result);
    } catch (err: any) {
      toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const copyOutput = () => {
    if (outputText) {
      navigator.clipboard.writeText(outputText);
      toast({ title: isAr ? "تم النسخ" : "Copied!" });
    }
  };

  const inputLen = inputText.length;
  const outputLen = outputText.length;
  const isOverLimit = outputLen > maxLength;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4" />
            {isAr ? "النص المصدر" : "Source Text"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">{isAr ? "نوع الحقل" : "Field Type"}</Label>
              <Select value={fieldType} onValueChange={handleFieldTypeChange}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FIELD_TYPES.map(ft => (
                    <SelectItem key={ft.value} value={ft.value}>
                      {isAr ? ft.label_ar : ft.label} (≤{ft.maxHint})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{isAr ? "اللغة المصدر" : "Source Language"}</Label>
              <Select value={sourceLang} onValueChange={(v) => setSourceLang(v as "en" | "ar")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="ar">العربية</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-3 grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">{isAr ? "الوضع" : "Mode"}</Label>
              <Select value={mode} onValueChange={(v) => setMode(v as "optimize" | "translate")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="optimize">{isAr ? "تحسين SEO" : "SEO Optimize"}</SelectItem>
                  <SelectItem value="translate">{isAr ? "ترجمة + تحسين" : "Translate + SEO"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{isAr ? "الحد الأقصى" : "Max Length"}</Label>
              <Input type="number" value={maxLength} onChange={(e) => setMaxLength(parseInt(e.target.value) || 60)} dir="ltr" />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs">{isAr ? "النص" : "Text"}</Label>
              <span className={`text-[10px] tabular-nums ${inputLen > maxLength ? "text-destructive font-medium" : "text-muted-foreground"}`}>
                {inputLen}/{maxLength}
              </span>
            </div>
            <Textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              rows={5}
              dir={sourceLang === "ar" ? "rtl" : "ltr"}
              placeholder={isAr ? "أدخل النص هنا للاختبار..." : "Enter text here to test..."}
            />
          </div>

          <Button onClick={handleRun} disabled={loading || !inputText.trim()} className="w-full gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : mode === "optimize" ? <Sparkles className="h-4 w-4" /> : <ArrowRightLeft className="h-4 w-4" />}
            {mode === "optimize" ? (isAr ? "تحسين SEO" : "Optimize SEO") : (isAr ? "ترجمة وتحسين" : "Translate & Optimize")}
          </Button>
        </CardContent>
      </Card>

      {/* Output */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4" />
              {isAr ? "النتيجة" : "Result"}
            </CardTitle>
            {outputText && (
              <Button variant="ghost" size="sm" onClick={copyOutput} className="gap-1 text-xs h-7">
                <Copy className="h-3 w-3" />{isAr ? "نسخ" : "Copy"}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {outputText ? (
            <>
              <div className="rounded-lg border p-4 min-h-[120px]" dir={mode === "translate" ? (sourceLang === "en" ? "rtl" : "ltr") : sourceLang === "ar" ? "rtl" : "ltr"}>
                <p className="text-sm leading-relaxed">{outputText}</p>
              </div>

              {/* Analysis */}
              <div className="grid gap-3 grid-cols-3">
                <div className="rounded-lg border p-3 text-center">
                  <p className="text-xs text-muted-foreground">{isAr ? "الطول" : "Length"}</p>
                  <p className={`text-lg font-bold tabular-nums ${isOverLimit ? "text-destructive" : "text-chart-3"}`}>{outputLen}</p>
                </div>
                <div className="rounded-lg border p-3 text-center">
                  <p className="text-xs text-muted-foreground">{isAr ? "الحد" : "Limit"}</p>
                  <p className="text-lg font-bold tabular-nums">{maxLength}</p>
                </div>
                <div className="rounded-lg border p-3 text-center">
                  <p className="text-xs text-muted-foreground">{isAr ? "الحالة" : "Status"}</p>
                  {isOverLimit ? (
                    <div className="flex items-center justify-center gap-1 text-destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="text-sm font-medium">{isAr ? "طويل" : "Over"}</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-1 text-chart-3">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">{isAr ? "مقبول" : "OK"}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Character bar */}
              <div className="space-y-1">
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${isOverLimit ? "bg-destructive" : "bg-chart-3"}`}
                    style={{ width: `${Math.min(100, (outputLen / maxLength) * 100)}%` }}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground text-end tabular-nums">
                  {outputLen}/{maxLength} ({Math.round((outputLen / maxLength) * 100)}%)
                </p>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-3">
              <TestTube className="h-10 w-10 opacity-30" />
              <p className="text-sm">{isAr ? "أدخل نصاً واضغط على زر التحسين أو الترجمة لرؤية النتيجة" : "Enter text and click optimize or translate to see results"}</p>
              <p className="text-[10px]">{isAr ? "يراعي الذكاء الاصطناعي نوع الحقل والحد الأقصى تلقائياً" : "AI automatically respects field type and max length constraints"}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// Dialog Components
// ═══════════════════════════════════════════════════

function FieldDialog({ open, onClose, item, sources, onSave, isAr, saving }: any) {
  const [form, setForm] = useState<any>({});
  const isEdit = !!item;

  const resetForm = () => {
    if (item) {
      setForm({ ...item });
    } else {
      setForm({ table_name: "", field_name: "", field_name_ar: "", label: "", label_ar: "", category: sources?.[0]?.source_key || "", field_type: "text", max_length: 500, is_required: false, seo_optimize: false, description: "", description_ar: "", is_active: true, sort_order: 0 });
    }
  };

  // Auto-suggest max_length on field_type change
  const handleFieldTypeChange = (val: string) => {
    const ft = FIELD_TYPES.find(f => f.value === val);
    setForm({ ...form, field_type: val, max_length: ft?.maxHint || form.max_length });
  };

  if (open && Object.keys(form).length === 0) resetForm();

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { onClose(); setForm({}); } }}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? (isAr ? "تعديل حقل" : "Edit Field") : (isAr ? "إضافة حقل جديد" : "Add New Field")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-4 grid-cols-2">
            <div className="space-y-2">
              <Label>{isAr ? "اسم الجدول" : "Table Name"}</Label>
              <Input value={form.table_name || ""} onChange={(e) => setForm({ ...form, table_name: e.target.value })} placeholder="competitions" dir="ltr" />
            </div>
            <div className="space-y-2">
              <Label>{isAr ? "القسم" : "Category"}</Label>
              <Select value={form.category || ""} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {sources?.map((s: any) => (
                    <SelectItem key={s.source_key} value={s.source_key}>{isAr ? s.name_ar : s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-4 grid-cols-2">
            <div className="space-y-2">
              <Label>{isAr ? "اسم الحقل (EN)" : "Field Name (EN)"}</Label>
              <Input value={form.field_name || ""} onChange={(e) => setForm({ ...form, field_name: e.target.value })} placeholder="name" dir="ltr" />
            </div>
            <div className="space-y-2">
              <Label>{isAr ? "اسم الحقل (AR)" : "Field Name (AR)"}</Label>
              <Input value={form.field_name_ar || ""} onChange={(e) => setForm({ ...form, field_name_ar: e.target.value })} placeholder="name_ar" dir="ltr" />
            </div>
          </div>
          <div className="grid gap-4 grid-cols-2">
            <div className="space-y-2">
              <Label>{isAr ? "التسمية (EN)" : "Label (EN)"}</Label>
              <Input value={form.label || ""} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="Competition Name" />
            </div>
            <div className="space-y-2">
              <Label>{isAr ? "التسمية (AR)" : "Label (AR)"}</Label>
              <Input value={form.label_ar || ""} onChange={(e) => setForm({ ...form, label_ar: e.target.value })} placeholder="اسم المسابقة" dir="rtl" />
            </div>
          </div>

          {/* Field Type + Max Length */}
          <div className="grid gap-4 grid-cols-2">
            <div className="space-y-2">
              <Label className="flex items-center gap-1"><Type className="h-3 w-3" />{isAr ? "نوع الحقل" : "Field Type"}</Label>
              <Select value={form.field_type || "text"} onValueChange={handleFieldTypeChange}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FIELD_TYPES.map(ft => (
                    <SelectItem key={ft.value} value={ft.value}>
                      {isAr ? ft.label_ar : ft.label} (≤{ft.maxHint})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[10px] text-muted-foreground">
                {isAr ? "يحدد الطول الأمثل للذكاء الاصطناعي" : "Controls AI output length & context"}
              </p>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1"><Hash className="h-3 w-3" />{isAr ? "الحد الأقصى للأحرف" : "Max Length"}</Label>
              <Input type="number" value={form.max_length || 500} onChange={(e) => setForm({ ...form, max_length: parseInt(e.target.value) || 500 })} dir="ltr" />
              {(() => {
                const ft = FIELD_TYPES.find(f => f.value === form.field_type);
                return ft && form.max_length > ft.maxHint ? (
                  <p className="text-[10px] text-chart-4 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {isAr ? `الحد الموصى لـ ${ft.label_ar}: ${ft.maxHint}` : `Recommended for ${ft.label}: ${ft.maxHint}`}
                  </p>
                ) : null;
              })()}
            </div>
          </div>

          <div className="grid gap-4 grid-cols-2">
            <div className="space-y-2">
              <Label>{isAr ? "الوصف (EN)" : "Description (EN)"}</Label>
              <Input value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>{isAr ? "الوصف (AR)" : "Description (AR)"}</Label>
              <Input value={form.description_ar || ""} onChange={(e) => setForm({ ...form, description_ar: e.target.value })} dir="rtl" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>{isAr ? "الترتيب" : "Sort Order"}</Label>
            <Input type="number" value={form.sort_order || 0} onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })} dir="ltr" />
          </div>
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-2">
              <Checkbox checked={form.is_required || false} onCheckedChange={(c) => setForm({ ...form, is_required: !!c })} />
              <Label className="cursor-pointer">{isAr ? "مطلوب" : "Required"}</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox checked={form.seo_optimize || false} onCheckedChange={(c) => setForm({ ...form, seo_optimize: !!c })} />
              <Label className="cursor-pointer">{isAr ? "تحسين SEO" : "SEO Optimize"}</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox checked={form.is_active !== false} onCheckedChange={(c) => setForm({ ...form, is_active: !!c })} />
              <Label className="cursor-pointer">{isAr ? "مفعل" : "Active"}</Label>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => { onClose(); setForm({}); }}>{isAr ? "إلغاء" : "Cancel"}</Button>
          <Button disabled={saving || !form.table_name || !form.field_name || !form.label} onClick={() => {
            const { id, created_at, updated_at, created_by, ...data } = form;
            onSave(data, isEdit ? item.id : undefined);
            onClose(); setForm({});
          }}>
            {saving && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
            <Save className="me-2 h-4 w-4" />{isAr ? "حفظ" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RuleDialog({ open, onClose, item, onSave, isAr, saving }: any) {
  const [form, setForm] = useState<any>({});
  const isEdit = !!item;

  if (open && Object.keys(form).length === 0) {
    setForm(item ? { ...item } : { field_scope: "all", rule_text: "", rule_text_ar: "", severity: "warning", is_enabled: true, sort_order: 0 });
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { onClose(); setForm({}); } }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? (isAr ? "تعديل قاعدة" : "Edit Rule") : (isAr ? "إضافة قاعدة" : "Add Rule")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-4 grid-cols-2">
            <div className="space-y-2">
              <Label>{isAr ? "نطاق الحقل" : "Field Scope"}</Label>
              <Input value={form.field_scope || "all"} onChange={(e) => setForm({ ...form, field_scope: e.target.value })} placeholder="all / title / description" dir="ltr" />
            </div>
            <div className="space-y-2">
              <Label>{isAr ? "الأهمية" : "Severity"}</Label>
              <Select value={form.severity || "warning"} onValueChange={(v) => setForm({ ...form, severity: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="error">{isAr ? "إلزامي" : "Error (Required)"}</SelectItem>
                  <SelectItem value="warning">{isAr ? "تحذير" : "Warning"}</SelectItem>
                  <SelectItem value="info">{isAr ? "معلومة" : "Info"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>{isAr ? "نص القاعدة (EN)" : "Rule Text (EN)"}</Label>
            <Input value={form.rule_text || ""} onChange={(e) => setForm({ ...form, rule_text: e.target.value })} placeholder="Title must be under 60 characters" />
          </div>
          <div className="space-y-2">
            <Label>{isAr ? "نص القاعدة (AR)" : "Rule Text (AR)"}</Label>
            <Input value={form.rule_text_ar || ""} onChange={(e) => setForm({ ...form, rule_text_ar: e.target.value })} placeholder="يجب أن يكون العنوان أقل من 60 حرفاً" dir="rtl" />
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={form.is_enabled !== false} onCheckedChange={(v) => setForm({ ...form, is_enabled: v })} />
            <Label>{isAr ? "مفعلة" : "Enabled"}</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => { onClose(); setForm({}); }}>{isAr ? "إلغاء" : "Cancel"}</Button>
          <Button disabled={saving || !form.rule_text} onClick={() => {
            const { id, created_at, updated_at, created_by, ...data } = form;
            onSave(data, isEdit ? item.id : undefined);
            onClose(); setForm({});
          }}>
            {saving && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
            <Save className="me-2 h-4 w-4" />{isAr ? "حفظ" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ModelDialog({ open, onClose, item, onSave, isAr, saving }: any) {
  const [form, setForm] = useState<any>({});
  const isEdit = !!item;
  const CAPABILITIES = ["translate", "optimize", "summarize", "rewrite"];

  if (open && Object.keys(form).length === 0) {
    setForm(item ? { ...item } : { model_id: "", display_name: "", display_name_ar: "", provider: "lovable", description: "", description_ar: "", is_active: true, is_default: false, capabilities: ["translate", "optimize"], max_tokens: 4096, sort_order: 0 });
  }

  const toggleCap = (cap: string) => {
    const caps = form.capabilities || [];
    setForm({ ...form, capabilities: caps.includes(cap) ? caps.filter((c: string) => c !== cap) : [...caps, cap] });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { onClose(); setForm({}); } }}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? (isAr ? "تعديل نموذج" : "Edit Model") : (isAr ? "إضافة نموذج" : "Add Model")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{isAr ? "معرّف النموذج" : "Model ID"}</Label>
            <Input value={form.model_id || ""} onChange={(e) => setForm({ ...form, model_id: e.target.value })} placeholder="google/gemini-2.5-flash" dir="ltr" />
          </div>
          <div className="grid gap-4 grid-cols-2">
            <div className="space-y-2">
              <Label>{isAr ? "الاسم (EN)" : "Name (EN)"}</Label>
              <Input value={form.display_name || ""} onChange={(e) => setForm({ ...form, display_name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>{isAr ? "الاسم (AR)" : "Name (AR)"}</Label>
              <Input value={form.display_name_ar || ""} onChange={(e) => setForm({ ...form, display_name_ar: e.target.value })} dir="rtl" />
            </div>
          </div>
          <div className="grid gap-4 grid-cols-2">
            <div className="space-y-2">
              <Label>{isAr ? "الوصف (EN)" : "Description (EN)"}</Label>
              <Input value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>{isAr ? "الوصف (AR)" : "Description (AR)"}</Label>
              <Input value={form.description_ar || ""} onChange={(e) => setForm({ ...form, description_ar: e.target.value })} dir="rtl" />
            </div>
          </div>
          <div className="grid gap-4 grid-cols-2">
            <div className="space-y-2">
              <Label>{isAr ? "المزوّد" : "Provider"}</Label>
              <Input value={form.provider || "lovable"} onChange={(e) => setForm({ ...form, provider: e.target.value })} dir="ltr" />
            </div>
            <div className="space-y-2">
              <Label>{isAr ? "الحد الأقصى للرموز" : "Max Tokens"}</Label>
              <Input type="number" value={form.max_tokens || 4096} onChange={(e) => setForm({ ...form, max_tokens: parseInt(e.target.value) || 4096 })} dir="ltr" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>{isAr ? "القدرات" : "Capabilities"}</Label>
            <div className="flex flex-wrap gap-2">
              {CAPABILITIES.map((c) => (
                <Badge key={c} variant={form.capabilities?.includes(c) ? "default" : "outline"} className="cursor-pointer" onClick={() => toggleCap(c)}>
                  {c === "translate" ? (isAr ? "ترجمة" : "Translate") : c === "optimize" ? (isAr ? "تحسين" : "Optimize") : c === "summarize" ? (isAr ? "تلخيص" : "Summarize") : (isAr ? "إعادة صياغة" : "Rewrite")}
                </Badge>
              ))}
            </div>
          </div>
          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              <Switch checked={form.is_active !== false} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
              <Label>{isAr ? "مفعل" : "Active"}</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.is_default || false} onCheckedChange={(v) => setForm({ ...form, is_default: v })} />
              <Label>{isAr ? "افتراضي" : "Default"}</Label>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => { onClose(); setForm({}); }}>{isAr ? "إلغاء" : "Cancel"}</Button>
          <Button disabled={saving || !form.model_id || !form.display_name} onClick={() => {
            const { id, created_at, updated_at, created_by, ...data } = form;
            onSave(data, isEdit ? item.id : undefined);
            onClose(); setForm({});
          }}>
            {saving && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
            <Save className="me-2 h-4 w-4" />{isAr ? "حفظ" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SourceDialog({ open, onClose, item, onSave, isAr, saving }: any) {
  const [form, setForm] = useState<any>({});
  const isEdit = !!item;

  if (open && Object.keys(form).length === 0) {
    setForm(item ? { ...item } : { source_key: "", name: "", name_ar: "", description: "", description_ar: "", icon: "FileText", color: "#3b82f6", is_active: true, sort_order: 0 });
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { onClose(); setForm({}); } }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? (isAr ? "تعديل مصدر" : "Edit Source") : (isAr ? "إضافة مصدر" : "Add Source")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-4 grid-cols-2">
            <div className="space-y-2">
              <Label>{isAr ? "المفتاح" : "Source Key"}</Label>
              <Input value={form.source_key || ""} onChange={(e) => setForm({ ...form, source_key: e.target.value })} placeholder="competitions" dir="ltr" disabled={isEdit} />
            </div>
            <div className="space-y-2">
              <Label>{isAr ? "اللون" : "Color"}</Label>
              <div className="flex gap-2">
                <Input type="color" value={form.color || "#3b82f6"} onChange={(e) => setForm({ ...form, color: e.target.value })} className="h-10 w-14" />
                <Input value={form.color || "#3b82f6"} onChange={(e) => setForm({ ...form, color: e.target.value })} dir="ltr" className="flex-1" />
              </div>
            </div>
          </div>
          <div className="grid gap-4 grid-cols-2">
            <div className="space-y-2">
              <Label>{isAr ? "الاسم (EN)" : "Name (EN)"}</Label>
              <Input value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>{isAr ? "الاسم (AR)" : "Name (AR)"}</Label>
              <Input value={form.name_ar || ""} onChange={(e) => setForm({ ...form, name_ar: e.target.value })} dir="rtl" />
            </div>
          </div>
          <div className="grid gap-4 grid-cols-2">
            <div className="space-y-2">
              <Label>{isAr ? "الوصف (EN)" : "Description (EN)"}</Label>
              <Input value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>{isAr ? "الوصف (AR)" : "Description (AR)"}</Label>
              <Input value={form.description_ar || ""} onChange={(e) => setForm({ ...form, description_ar: e.target.value })} dir="rtl" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={form.is_active !== false} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
            <Label>{isAr ? "مفعل" : "Active"}</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => { onClose(); setForm({}); }}>{isAr ? "إلغاء" : "Cancel"}</Button>
          <Button disabled={saving || !form.source_key || !form.name} onClick={() => {
            const { id, created_at, updated_at, created_by, ...data } = form;
            onSave(data, isEdit ? item.id : undefined);
            onClose(); setForm({});
          }}>
            {saving && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
            <Save className="me-2 h-4 w-4" />{isAr ? "حفظ" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
