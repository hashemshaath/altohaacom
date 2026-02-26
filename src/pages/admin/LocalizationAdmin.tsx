import { useState, useMemo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Globe, Save, Plus, Search, Languages, Check, Trash2, Edit2, Download, Upload,
  Sparkles, Filter, RefreshCw, CheckCircle2, AlertCircle, BarChart3, FileText,
  Copy, Eye, X
} from "lucide-react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { useAdminBulkActions } from "@/hooks/useAdminBulkActions";
import { useCSVExport } from "@/hooks/useCSVExport";
import { BulkActionBar } from "@/components/admin/BulkActionBar";

// ─── Types ───
interface TranslationKey {
  id: string;
  key: string;
  namespace: string;
  en: string;
  ar: string;
  context: string | null;
  is_verified: boolean;
  auto_translated: boolean;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

interface PlatformLanguage {
  id: string;
  code: string;
  name: string;
  native_name: string;
  is_rtl: boolean;
  is_enabled: boolean;
  is_default: boolean;
  flag_emoji: string | null;
  sort_order: number;
}

// ─── Namespaces ───
const NAMESPACES = [
  { value: "common", label: "Common", labelAr: "عام" },
  { value: "auth", label: "Authentication", labelAr: "المصادقة" },
  { value: "admin", label: "Admin", labelAr: "الإدارة" },
  { value: "competitions", label: "Competitions", labelAr: "المسابقات" },
  { value: "community", label: "Community", labelAr: "المجتمع" },
  { value: "shop", label: "Shop", labelAr: "المتجر" },
  { value: "notifications", label: "Notifications", labelAr: "الإشعارات" },
  { value: "errors", label: "Errors", labelAr: "الأخطاء" },
];

export default function LocalizationAdmin() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [nsFilter, setNsFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ en: string; ar: string; context: string }>({ en: "", ar: "", context: "" });
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newKey, setNewKey] = useState({ key: "", namespace: "common", en: "", ar: "", context: "" });
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importText, setImportText] = useState("");
  

  // ─── Queries ───
  const { data: translations = [], isLoading: loadingTranslations } = useQuery({
    queryKey: ["translation-keys"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("translation_keys")
        .select("*")
        .order("namespace")
        .order("key");
      if (error) throw error;
      return data as TranslationKey[];
    },
  });

  const { data: languages = [], isLoading: loadingLanguages } = useQuery({
    queryKey: ["platform-languages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("platform_languages")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return data as PlatformLanguage[];
    },
  });

  // ─── Mutations ───
  const addKeyMutation = useMutation({
    mutationFn: async (key: typeof newKey) => {
      const { error } = await supabase.from("translation_keys").insert({
        key: key.key,
        namespace: key.namespace,
        en: key.en,
        ar: key.ar,
        context: key.context || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["translation-keys"] });
      setShowAddDialog(false);
      setNewKey({ key: "", namespace: "common", en: "", ar: "", context: "" });
      toast({ title: isAr ? "تمت الإضافة" : "Added", description: isAr ? "تمت إضافة المفتاح بنجاح" : "Translation key added successfully" });
    },
    onError: (e: any) => {
      toast({ title: isAr ? "خطأ" : "Error", description: e.message, variant: "destructive" });
    },
  });

  const updateKeyMutation = useMutation({
    mutationFn: async ({ id, en, ar, context }: { id: string; en: string; ar: string; context: string }) => {
      const { error } = await supabase.from("translation_keys").update({ en, ar, context: context || null, updated_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["translation-keys"] });
      setEditingId(null);
      toast({ title: isAr ? "تم التحديث" : "Updated" });
    },
  });

  const deleteKeyMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("translation_keys").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["translation-keys"] });
      toast({ title: isAr ? "تم الحذف" : "Deleted" });
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from("translation_keys").delete().in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["translation-keys"] });
      bulk.clearSelection();
      toast({ title: isAr ? "تم الحذف" : "Deleted", description: isAr ? "تم حذف المفاتيح المحددة" : "Selected keys deleted" });
    },
  });

  const verifyKeyMutation = useMutation({
    mutationFn: async ({ id, verified }: { id: string; verified: boolean }) => {
      const { error } = await supabase.from("translation_keys").update({ is_verified: verified }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["translation-keys"] }),
  });

  const toggleLanguageMutation = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const { error } = await supabase.from("platform_languages").update({ is_enabled: enabled }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platform-languages"] });
      toast({ title: isAr ? "تم التحديث" : "Updated" });
    },
  });

  const setDefaultLanguageMutation = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("platform_languages").update({ is_default: false }).neq("id", id);
      const { error } = await supabase.from("platform_languages").update({ is_default: true, is_enabled: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platform-languages"] });
      toast({ title: isAr ? "تم تعيين اللغة الافتراضية" : "Default language set" });
    },
  });

  // ─── AI Auto-Translate ───
  const autoTranslateMutation = useMutation({
    mutationFn: async (id: string) => {
      const key = translations.find(t => t.id === id);
      if (!key) throw new Error("Key not found");
      const sourceText = key.en || key.ar;
      const targetLang = key.en ? "ar" : "en";
      if (!sourceText) throw new Error("No source text to translate");

      const { data, error } = await supabase.functions.invoke("ai-translate-seo", {
        body: { text: sourceText, targetLanguage: targetLang, context: key.context || key.namespace },
      });
      if (error) throw error;
      const translated = data?.translated || data?.text || "";
      await supabase.from("translation_keys").update({
        [targetLang]: translated,
        auto_translated: true,
        updated_at: new Date().toISOString(),
      }).eq("id", id);
      return translated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["translation-keys"] });
      toast({ title: isAr ? "تمت الترجمة" : "Translated", description: isAr ? "تمت الترجمة التلقائية بنجاح" : "Auto-translated successfully" });
    },
    onError: (e: any) => {
      toast({ title: isAr ? "خطأ في الترجمة" : "Translation Error", description: e.message, variant: "destructive" });
    },
  });

  const bulkAutoTranslateMutation = useMutation({
    mutationFn: async () => {
      const missing = translations.filter(t => (t.en && !t.ar) || (!t.en && t.ar));
      for (const key of missing) {
        const sourceText = key.en || key.ar;
        const targetLang = key.en ? "ar" : "en";
        try {
          const { data } = await supabase.functions.invoke("ai-translate-seo", {
            body: { text: sourceText, targetLanguage: targetLang, context: key.context || key.namespace },
          });
          const translated = data?.translated || data?.text || "";
          if (translated) {
            await supabase.from("translation_keys").update({
              [targetLang]: translated,
              auto_translated: true,
              updated_at: new Date().toISOString(),
            }).eq("id", key.id);
          }
        } catch {
          // continue with next
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["translation-keys"] });
      toast({ title: isAr ? "تمت الترجمة" : "Bulk Translation Complete" });
    },
  });

  // ─── Import/Export ───
  const handleExportJSON = () => {
    const exported: Record<string, Record<string, { en: string; ar: string }>> = {};
    translations.forEach(t => {
      if (!exported[t.namespace]) exported[t.namespace] = {};
      exported[t.namespace][t.key] = { en: t.en, ar: t.ar };
    });
    const blob = new Blob([JSON.stringify(exported, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `translations-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: isAr ? "تم التصدير" : "Exported" });
  };

  const handleExportCSV = () => {
    const BOM = "\uFEFF";
    const header = "namespace,key,en,ar,verified,context\n";
    const rows = translations.map(t =>
      `"${t.namespace}","${t.key}","${t.en.replace(/"/g, '""')}","${t.ar.replace(/"/g, '""')}","${t.is_verified}","${(t.context || "").replace(/"/g, '""')}"`
    ).join("\n");
    const blob = new Blob([BOM + header + rows], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `translations-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: isAr ? "تم التصدير" : "Exported as CSV" });
  };

  const handleImportJSON = async () => {
    try {
      const parsed = JSON.parse(importText);
      const entries: { key: string; namespace: string; en: string; ar: string }[] = [];
      for (const [ns, keys] of Object.entries(parsed)) {
        for (const [key, vals] of Object.entries(keys as Record<string, { en: string; ar: string }>)) {
          entries.push({ key, namespace: ns, en: vals.en || "", ar: vals.ar || "" });
        }
      }
      if (entries.length === 0) throw new Error("No entries found");
      const { error } = await supabase.from("translation_keys").upsert(
        entries.map(e => ({ key: e.key, namespace: e.namespace, en: e.en, ar: e.ar })),
        { onConflict: "key" }
      );
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["translation-keys"] });
      setShowImportDialog(false);
      setImportText("");
      toast({ title: isAr ? "تم الاستيراد" : "Imported", description: `${entries.length} ${isAr ? "مفتاح" : "keys imported"}` });
    } catch (e: any) {
      toast({ title: isAr ? "خطأ" : "Error", description: e.message, variant: "destructive" });
    }
  };

  // ─── Computed Stats ───
  const stats = useMemo(() => {
    const total = translations.length;
    const complete = translations.filter(t => t.en && t.ar).length;
    const verified = translations.filter(t => t.is_verified).length;
    const missingAr = translations.filter(t => t.en && !t.ar).length;
    const missingEn = translations.filter(t => !t.en && t.ar).length;
    const autoTranslated = translations.filter(t => t.auto_translated).length;
    const coverage = total > 0 ? Math.round((complete / total) * 100) : 0;
    const namespaces = [...new Set(translations.map(t => t.namespace))];
    return { total, complete, verified, missingAr, missingEn, autoTranslated, coverage, namespaces };
  }, [translations]);

  // ─── Filtered Data ───
  const filteredTranslations = useMemo(() => {
    return translations.filter(t => {
      const matchSearch = !search ||
        t.key.toLowerCase().includes(search.toLowerCase()) ||
        t.en.toLowerCase().includes(search.toLowerCase()) ||
        t.ar.includes(search);
      const matchNs = nsFilter === "all" || t.namespace === nsFilter;
      const matchStatus =
        statusFilter === "all" ||
        (statusFilter === "complete" && t.en && t.ar) ||
        (statusFilter === "incomplete" && (!t.en || !t.ar)) ||
        (statusFilter === "verified" && t.is_verified) ||
        (statusFilter === "unverified" && !t.is_verified) ||
        (statusFilter === "auto" && t.auto_translated);
      return matchSearch && matchNs && matchStatus;
    });
  }, [translations, search, nsFilter, statusFilter]);

  const bulk = useAdminBulkActions(filteredTranslations);

  const { exportCSV: exportTranslationsCSV } = useCSVExport({
    columns: [
      { header: "Namespace", accessor: (r: TranslationKey) => r.namespace },
      { header: "Key", accessor: (r: TranslationKey) => r.key },
      { header: "English", accessor: (r: TranslationKey) => r.en },
      { header: isAr ? "عربي" : "Arabic", accessor: (r: TranslationKey) => r.ar },
      { header: isAr ? "موثق" : "Verified", accessor: (r: TranslationKey) => r.is_verified ? "Yes" : "No" },
      { header: isAr ? "السياق" : "Context", accessor: (r: TranslationKey) => r.context || "" },
    ],
    filename: "translations",
  });

  const startEditing = (t: TranslationKey) => {
    setEditingId(t.id);
    setEditValues({ en: t.en, ar: t.ar, context: t.context || "" });
  };


  return (
    <div className="space-y-6">
      <AdminPageHeader
        icon={Globe}
        title={isAr ? "إدارة اللغات والترجمات" : "Localization & Translation Center"}
        description={isAr ? "إدارة اللغات والترجمات ومفاتيح النصوص مع دعم الترجمة التلقائية بالذكاء الاصطناعي" : "Manage languages, translation keys, and AI-powered auto-translation"}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={handleExportJSON}>
              <Download className="h-4 w-4 me-1" />
              JSON
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportCSV}>
              <Download className="h-4 w-4 me-1" />
              CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowImportDialog(true)}>
              <Upload className="h-4 w-4 me-1" />
              {isAr ? "استيراد" : "Import"}
            </Button>
          </div>
        }
      />

      {/* ─── Stats Cards ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {[
          { icon: FileText, label: isAr ? "إجمالي المفاتيح" : "Total Keys", value: stats.total, color: "text-primary" },
          { icon: CheckCircle2, label: isAr ? "مكتمل" : "Complete", value: stats.complete, color: "text-green-500" },
          { icon: AlertCircle, label: isAr ? "ناقص العربية" : "Missing AR", value: stats.missingAr, color: "text-orange-500" },
          { icon: AlertCircle, label: isAr ? "ناقص الإنجليزية" : "Missing EN", value: stats.missingEn, color: "text-red-500" },
          { icon: Check, label: isAr ? "موثق" : "Verified", value: stats.verified, color: "text-blue-500" },
          { icon: Sparkles, label: isAr ? "ترجمة آلية" : "Auto-translated", value: stats.autoTranslated, color: "text-purple-500" },
        ].map((s, i) => (
          <Card key={i} className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <s.icon className={`h-4 w-4 ${s.color}`} />
              <span className="text-xs text-muted-foreground truncate">{s.label}</span>
            </div>
            <p className="text-2xl font-bold tabular-nums">{s.value}</p>
          </Card>
        ))}
      </div>

      {/* ─── Coverage Progress ─── */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">{isAr ? "تغطية الترجمة" : "Translation Coverage"}</span>
          <span className="text-sm font-bold tabular-nums">{stats.coverage}%</span>
        </div>
        <Progress value={stats.coverage} className="h-2" />
      </Card>

      {/* ─── Main Tabs ─── */}
      <Tabs defaultValue="translations">
        <TabsList>
          <TabsTrigger value="translations" className="gap-1.5">
            <Languages className="h-4 w-4" />
            {isAr ? "مفاتيح الترجمة" : "Translation Keys"}
          </TabsTrigger>
          <TabsTrigger value="languages" className="gap-1.5">
            <Globe className="h-4 w-4" />
            {isAr ? "اللغات" : "Languages"}
          </TabsTrigger>
          <TabsTrigger value="stats" className="gap-1.5">
            <BarChart3 className="h-4 w-4" />
            {isAr ? "إحصائيات" : "Statistics"}
          </TabsTrigger>
        </TabsList>

        {/* ─── Translation Keys Tab ─── */}
        <TabsContent value="translations" className="mt-4 space-y-4">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={isAr ? "بحث بالمفتاح أو النص..." : "Search by key or text..."}
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="ps-9"
              />
            </div>
            <Select value={nsFilter} onValueChange={setNsFilter}>
              <SelectTrigger className="w-[140px]">
                <Filter className="h-4 w-4 me-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isAr ? "كل الأقسام" : "All Namespaces"}</SelectItem>
                {NAMESPACES.map(ns => (
                  <SelectItem key={ns.value} value={ns.value}>{isAr ? ns.labelAr : ns.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[130px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isAr ? "الكل" : "All Status"}</SelectItem>
                <SelectItem value="complete">{isAr ? "مكتمل" : "Complete"}</SelectItem>
                <SelectItem value="incomplete">{isAr ? "ناقص" : "Incomplete"}</SelectItem>
                <SelectItem value="verified">{isAr ? "موثق" : "Verified"}</SelectItem>
                <SelectItem value="unverified">{isAr ? "غير موثق" : "Unverified"}</SelectItem>
                <SelectItem value="auto">{isAr ? "ترجمة آلية" : "Auto-translated"}</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => setShowAddDialog(true)} size="sm">
              <Plus className="h-4 w-4 me-1" />
              {isAr ? "إضافة" : "Add Key"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => bulkAutoTranslateMutation.mutate()}
              disabled={bulkAutoTranslateMutation.isPending || stats.missingAr + stats.missingEn === 0}
            >
              <Sparkles className="h-4 w-4 me-1" />
              {bulkAutoTranslateMutation.isPending
                ? (isAr ? "جاري الترجمة..." : "Translating...")
                : (isAr ? "ترجمة الكل تلقائياً" : "Auto-translate All")}
            </Button>
            <BulkActionBar
              count={bulk.count}
              onClear={bulk.clearSelection}
              onDelete={() => bulkDeleteMutation.mutate([...bulk.selected])}
              onExport={() => exportTranslationsCSV(bulk.selectedItems)}
            />
          </div>

          {/* Table */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">
                        <Checkbox
                          checked={bulk.isAllSelected}
                          onCheckedChange={bulk.toggleAll}
                        />
                      </TableHead>
                      <TableHead className="w-[100px]">{isAr ? "القسم" : "Namespace"}</TableHead>
                      <TableHead className="w-[180px]">{isAr ? "المفتاح" : "Key"}</TableHead>
                      <TableHead>English</TableHead>
                      <TableHead>العربية</TableHead>
                      <TableHead className="w-[80px]">{isAr ? "الحالة" : "Status"}</TableHead>
                      <TableHead className="w-[120px]">{isAr ? "إجراءات" : "Actions"}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingTranslations ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2" />
                          {isAr ? "جاري التحميل..." : "Loading..."}
                        </TableCell>
                      </TableRow>
                    ) : filteredTranslations.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          {isAr ? "لا توجد مفاتيح ترجمة" : "No translation keys found"}
                          <div className="mt-2">
                            <Button size="sm" onClick={() => setShowAddDialog(true)}>
                              <Plus className="h-4 w-4 me-1" />
                              {isAr ? "إضافة أول مفتاح" : "Add First Key"}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredTranslations.map(t => (
                        <TableRow key={t.id}>
                          <TableCell>
                            <Checkbox
                              checked={bulk.isSelected(t.id)}
                              onCheckedChange={() => bulk.toggleOne(t.id)}
                            />
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs font-mono">
                              {t.namespace}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground">{t.key}</TableCell>
                          <TableCell>
                            {editingId === t.id ? (
                              <Input value={editValues.en} onChange={e => setEditValues(p => ({ ...p, en: e.target.value }))} className="h-8 text-sm" />
                            ) : (
                              <span className={`text-sm ${!t.en ? "text-destructive italic" : ""}`}>
                                {t.en || (isAr ? "فارغ" : "Empty")}
                              </span>
                            )}
                          </TableCell>
                          <TableCell dir="rtl">
                            {editingId === t.id ? (
                              <Input dir="rtl" value={editValues.ar} onChange={e => setEditValues(p => ({ ...p, ar: e.target.value }))} className="h-8 text-sm" />
                            ) : (
                              <span className={`text-sm ${!t.ar ? "text-destructive italic" : ""}`}>
                                {t.ar || (isAr ? "فارغ" : "Empty")}
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {t.en && t.ar ? (
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                              ) : (
                                <AlertCircle className="h-4 w-4 text-orange-500" />
                              )}
                              {t.is_verified && (
                                <Badge variant="default" className="text-[10px] px-1 py-0">
                                  ✓
                                </Badge>
                              )}
                              {t.auto_translated && (
                                <Sparkles className="h-3 w-3 text-purple-500" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {editingId === t.id ? (
                                <>
                                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => updateKeyMutation.mutate({ id: t.id, ...editValues })}>
                                    <Check className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingId(null)}>
                                    <X className="h-3.5 w-3.5" />
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => startEditing(t)}>
                                    <Edit2 className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-7 w-7"
                                    onClick={() => verifyKeyMutation.mutate({ id: t.id, verified: !t.is_verified })}
                                  >
                                    <CheckCircle2 className={`h-3.5 w-3.5 ${t.is_verified ? "text-green-500" : ""}`} />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-7 w-7"
                                    onClick={() => autoTranslateMutation.mutate(t.id)}
                                    disabled={autoTranslateMutation.isPending || (!!t.en && !!t.ar)}
                                  >
                                    <Sparkles className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteKeyMutation.mutate(t.id)}>
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
          <p className="text-xs text-muted-foreground text-end tabular-nums">
            {isAr ? `عرض ${filteredTranslations.length} من ${translations.length}` : `Showing ${filteredTranslations.length} of ${translations.length}`}
          </p>
        </TabsContent>

        {/* ─── Languages Tab ─── */}
        <TabsContent value="languages" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>{isAr ? "اللغات المتاحة" : "Platform Languages"}</CardTitle>
              <CardDescription>{isAr ? "تفعيل وتعطيل اللغات المتاحة للمستخدمين" : "Enable or disable languages available to users"}</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingLanguages ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-5 w-5 animate-spin" />
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {languages.map(lang => (
                    <div
                      key={lang.id}
                      className={`flex items-center justify-between rounded-lg border p-4 transition-all ${
                        lang.is_enabled ? "border-primary/30 bg-primary/5" : "opacity-60"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-lg">
                          {lang.flag_emoji || lang.code.toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{lang.name}</p>
                            {lang.is_default && (
                              <Badge variant="default" className="text-xs">{isAr ? "افتراضي" : "Default"}</Badge>
                            )}
                            {lang.is_rtl && (
                              <Badge variant="outline" className="text-xs">RTL</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{lang.native_name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {lang.is_enabled && !lang.is_default && (
                          <Button variant="ghost" size="sm" onClick={() => setDefaultLanguageMutation.mutate(lang.id)}>
                            {isAr ? "افتراضي" : "Set Default"}
                          </Button>
                        )}
                        <Switch
                          checked={lang.is_enabled}
                          onCheckedChange={checked => toggleLanguageMutation.mutate({ id: lang.id, enabled: checked })}
                          disabled={lang.is_default}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Statistics Tab ─── */}
        <TabsContent value="stats" className="mt-4 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{isAr ? "توزيع الأقسام" : "Namespace Distribution"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {stats.namespaces.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{isAr ? "لا توجد بيانات" : "No data"}</p>
                ) : (
                  stats.namespaces.map(ns => {
                    const count = translations.filter(t => t.namespace === ns).length;
                    const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                    return (
                      <div key={ns}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="font-mono">{ns}</span>
                          <span className="text-muted-foreground tabular-nums">{count} ({pct}%)</span>
                        </div>
                        <Progress value={pct} className="h-1.5" />
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">{isAr ? "ملخص الجودة" : "Quality Summary"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: isAr ? "التغطية الكلية" : "Overall Coverage", value: stats.coverage, color: stats.coverage >= 80 ? "text-green-500" : "text-orange-500" },
                  { label: isAr ? "نسبة التوثيق" : "Verification Rate", value: stats.total > 0 ? Math.round((stats.verified / stats.total) * 100) : 0, color: "text-blue-500" },
                  { label: isAr ? "نسبة الترجمة الآلية" : "Auto-translation Rate", value: stats.total > 0 ? Math.round((stats.autoTranslated / stats.total) * 100) : 0, color: "text-purple-500" },
                ].map((item, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{item.label}</span>
                      <span className={`font-bold tabular-nums ${item.color}`}>{item.value}%</span>
                    </div>
                    <Progress value={item.value} className="h-1.5" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* ─── Add Key Dialog ─── */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{isAr ? "إضافة مفتاح ترجمة" : "Add Translation Key"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{isAr ? "المفتاح" : "Key"}</Label>
                <Input
                  placeholder="e.g. welcome_message"
                  value={newKey.key}
                  onChange={e => setNewKey(p => ({ ...p, key: e.target.value }))}
                  className="font-mono"
                />
              </div>
              <div>
                <Label>{isAr ? "القسم" : "Namespace"}</Label>
                <Select value={newKey.namespace} onValueChange={v => setNewKey(p => ({ ...p, namespace: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {NAMESPACES.map(ns => (
                      <SelectItem key={ns.value} value={ns.value}>{isAr ? ns.labelAr : ns.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>English</Label>
              <Input value={newKey.en} onChange={e => setNewKey(p => ({ ...p, en: e.target.value }))} />
            </div>
            <div>
              <Label>العربية</Label>
              <Input dir="rtl" value={newKey.ar} onChange={e => setNewKey(p => ({ ...p, ar: e.target.value }))} />
            </div>
            <div>
              <Label>{isAr ? "السياق (اختياري)" : "Context (optional)"}</Label>
              <Input
                placeholder={isAr ? "وصف مختصر للسياق" : "Brief context description"}
                value={newKey.context}
                onChange={e => setNewKey(p => ({ ...p, context: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>{isAr ? "إلغاء" : "Cancel"}</Button>
            <Button onClick={() => addKeyMutation.mutate(newKey)} disabled={!newKey.key || addKeyMutation.isPending}>
              <Plus className="h-4 w-4 me-1" />
              {isAr ? "إضافة" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Import Dialog ─── */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{isAr ? "استيراد الترجمات" : "Import Translations"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {isAr
                ? 'الصق JSON بتنسيق: { "namespace": { "key": { "en": "...", "ar": "..." } } }'
                : 'Paste JSON in format: { "namespace": { "key": { "en": "...", "ar": "..." } } }'}
            </p>
            <Textarea
              rows={10}
              value={importText}
              onChange={e => setImportText(e.target.value)}
              className="font-mono text-xs"
              placeholder='{ "common": { "hello": { "en": "Hello", "ar": "مرحبا" } } }'
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImportDialog(false)}>{isAr ? "إلغاء" : "Cancel"}</Button>
            <Button onClick={handleImportJSON} disabled={!importText.trim()}>
              <Upload className="h-4 w-4 me-1" />
              {isAr ? "استيراد" : "Import"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
