import { useState, useMemo, memo, useCallback, useRef } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import {
  Download, Upload, FileSpreadsheet, FileText, Database, Users, Building2,
  Trophy, Ticket, Clock, CheckCircle, XCircle, Loader2, Save, Trash2,
  Plus, RefreshCw, Settings2, History, ArrowDownToLine, ArrowUpFromLine,
  Filter, BookmarkPlus, Layers, Package,
} from "lucide-react";
import { format as fmtDate } from "date-fns";

/* ─── Export Module Configs ─── */
interface ExportModule {
  key: string;
  label: string;
  labelAr: string;
  icon: React.ElementType;
  table: string;
  columns: { key: string; label: string; labelAr: string }[];
}

const EXPORT_MODULES: ExportModule[] = [
  {
    key: "users", label: "Users", labelAr: "المستخدمون", icon: Users,
    table: "profiles",
    columns: [
      { key: "user_id", label: "User ID", labelAr: "معرف المستخدم" },
      { key: "username", label: "Username", labelAr: "اسم المستخدم" },
      { key: "full_name", label: "Full Name", labelAr: "الاسم الكامل" },
      { key: "full_name_ar", label: "Full Name (AR)", labelAr: "الاسم بالعربية" },
      { key: "email", label: "Email", labelAr: "البريد" },
      { key: "phone", label: "Phone", labelAr: "الهاتف" },
      { key: "country_code", label: "Country", labelAr: "الدولة" },
      { key: "account_type", label: "Account Type", labelAr: "نوع الحساب" },
      { key: "created_at", label: "Created At", labelAr: "تاريخ الإنشاء" },
    ],
  },
  {
    key: "companies", label: "Companies", labelAr: "الشركات", icon: Building2,
    table: "companies",
    columns: [
      { key: "id", label: "ID", labelAr: "المعرف" },
      { key: "name", label: "Name", labelAr: "الاسم" },
      { key: "name_ar", label: "Name (AR)", labelAr: "الاسم بالعربية" },
      { key: "type", label: "Type", labelAr: "النوع" },
      { key: "status", label: "Status", labelAr: "الحالة" },
      { key: "email", label: "Email", labelAr: "البريد" },
      { key: "phone", label: "Phone", labelAr: "الهاتف" },
      { key: "country_code", label: "Country", labelAr: "الدولة" },
      { key: "is_verified", label: "Verified", labelAr: "موثق" },
      { key: "created_at", label: "Created At", labelAr: "تاريخ الإنشاء" },
    ],
  },
  {
    key: "competitions", label: "Competitions", labelAr: "المسابقات", icon: Trophy,
    table: "competitions",
    columns: [
      { key: "id", label: "ID", labelAr: "المعرف" },
      { key: "title", label: "Title", labelAr: "العنوان" },
      { key: "title_ar", label: "Title (AR)", labelAr: "العنوان بالعربية" },
      { key: "status", label: "Status", labelAr: "الحالة" },
      { key: "country_code", label: "Country", labelAr: "الدولة" },
      { key: "edition_year", label: "Year", labelAr: "السنة" },
      { key: "competition_start", label: "Start Date", labelAr: "تاريخ البدء" },
      { key: "created_at", label: "Created At", labelAr: "تاريخ الإنشاء" },
    ],
  },
  {
    key: "exhibitions", label: "Exhibitions", labelAr: "المعارض", icon: Ticket,
    table: "exhibitions",
    columns: [
      { key: "id", label: "ID", labelAr: "المعرف" },
      { key: "title", label: "Title", labelAr: "العنوان" },
      { key: "title_ar", label: "Title (AR)", labelAr: "العنوان بالعربية" },
      { key: "status", label: "Status", labelAr: "الحالة" },
      { key: "start_date", label: "Start Date", labelAr: "تاريخ البدء" },
      { key: "end_date", label: "End Date", labelAr: "تاريخ الانتهاء" },
      { key: "venue", label: "Venue", labelAr: "المكان" },
      { key: "country_code", label: "Country", labelAr: "الدولة" },
    ],
  },
  {
    key: "orders", label: "Orders", labelAr: "الطلبات", icon: Package,
    table: "company_orders",
    columns: [
      { key: "id", label: "ID", labelAr: "المعرف" },
      { key: "order_number", label: "Order #", labelAr: "رقم الطلب" },
      { key: "status", label: "Status", labelAr: "الحالة" },
      { key: "total_amount", label: "Total", labelAr: "المجموع" },
      { key: "currency", label: "Currency", labelAr: "العملة" },
      { key: "created_at", label: "Created At", labelAr: "تاريخ الإنشاء" },
    ],
  },
  {
    key: "invoices", label: "Invoices", labelAr: "الفواتير", icon: FileText,
    table: "invoices",
    columns: [
      { key: "id", label: "ID", labelAr: "المعرف" },
      { key: "invoice_number", label: "Invoice #", labelAr: "رقم الفاتورة" },
      { key: "status", label: "Status", labelAr: "الحالة" },
      { key: "amount", label: "Amount", labelAr: "المبلغ" },
      { key: "currency", label: "Currency", labelAr: "العملة" },
      { key: "created_at", label: "Created At", labelAr: "تاريخ الإنشاء" },
    ],
  },
];

/* ─── Saved Template Interface ─── */
interface ExportTemplate {
  id: string;
  name: string;
  module: string;
  columns: string[];
  filters?: Record<string, string>;
  format: "csv" | "json";
  createdAt: string;
}

const TEMPLATES_KEY = "altoha_export_templates";

function loadTemplates(): ExportTemplate[] {
  try {
    return JSON.parse(localStorage.getItem(TEMPLATES_KEY) || "[]");
  } catch { return []; }
}

function saveTemplates(templates: ExportTemplate[]) {
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
}

/* ─── Main Page ─── */
const DataImportExportAdmin = () => {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const t = (en: string, ar: string) => (isAr ? ar : en);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        icon={Database}
        title={t("Data Import & Export", "استيراد وتصدير البيانات")}
        description={t(
          "Centralized hub for importing, exporting, and managing your platform data",
          "مركز موحد لاستيراد وتصدير وإدارة بيانات المنصة"
        )}
      />

      <Tabs defaultValue="export" className="space-y-4">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="export" className="gap-1.5 text-xs">
            <ArrowDownToLine className="h-3.5 w-3.5" />
            {t("Export", "تصدير")}
          </TabsTrigger>
          <TabsTrigger value="import" className="gap-1.5 text-xs">
            <ArrowUpFromLine className="h-3.5 w-3.5" />
            {t("Import", "استيراد")}
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-1.5 text-xs">
            <History className="h-3.5 w-3.5" />
            {t("History", "السجل")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="export"><ExportTab /></TabsContent>
        <TabsContent value="import"><ImportTab /></TabsContent>
        <TabsContent value="history"><HistoryTab /></TabsContent>
      </Tabs>
    </div>
  );
};

export default DataImportExportAdmin;

/* ─── Export Tab ─── */
const ExportTab = memo(function ExportTab() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const t = (en: string, ar: string) => (isAr ? ar : en);

  const [selectedModule, setSelectedModule] = useState("users");
  const [selectedColumns, setSelectedColumns] = useState<Set<string>>(new Set());
  const [exportFormat, setExportFormat] = useState<"csv" | "json">("csv");
  const [exporting, setExporting] = useState(false);
  const [templates, setTemplates] = useState<ExportTemplate[]>(loadTemplates);
  const [templateName, setTemplateName] = useState("");
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  const currentModule = EXPORT_MODULES.find(m => m.key === selectedModule)!;

  // Initialize all columns selected when module changes
  const handleModuleChange = useCallback((key: string) => {
    setSelectedModule(key);
    const mod = EXPORT_MODULES.find(m => m.key === key)!;
    setSelectedColumns(new Set(mod.columns.map(c => c.key)));
  }, []);

  // Initialize on first render
  useMemo(() => {
    if (selectedColumns.size === 0) {
      setSelectedColumns(new Set(currentModule.columns.map(c => c.key)));
    }
  }, []);

  const { data: recordCount } = useQuery({
    queryKey: ["export-count", selectedModule],
    queryFn: async () => {
      const { count } = await supabase.from(currentModule.table as any).select("*", { count: "exact", head: true });
      return count || 0;
    },
  });

  const toggleColumn = (key: string) => {
    setSelectedColumns(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const handleExport = async () => {
    if (selectedColumns.size === 0) {
      toast({ variant: "destructive", title: t("Select at least one column", "اختر عمودًا واحدًا على الأقل") });
      return;
    }
    setExporting(true);
    try {
      const cols = Array.from(selectedColumns).join(", ");
      const { data, error } = await supabase.from(currentModule.table as any).select(cols);
      if (error) throw error;
      if (!data?.length) {
        toast({ title: t("No data found", "لا توجد بيانات") });
        return;
      }

      const selectedColDefs = currentModule.columns.filter(c => selectedColumns.has(c.key));
      const filename = `${selectedModule}_${format(new Date(), "yyyy-MM-dd_HHmm")}`;

      if (format === "csv") {
        const headers = selectedColDefs.map(c => `"${isAr ? c.labelAr : c.label}"`).join(",");
        const rows = data.map((row: any) =>
          selectedColDefs.map(c => `"${String(row[c.key] ?? "").replace(/"/g, '""')}"`).join(",")
        );
        const blob = new Blob(["\uFEFF" + headers + "\n" + rows.join("\n")], { type: "text/csv;charset=utf-8;" });
        downloadBlob(blob, `${filename}.csv`);
      } else {
        const mapped = data.map((row: any) => {
          const obj: Record<string, unknown> = {};
          selectedColDefs.forEach(c => { obj[c.key] = row[c.key]; });
          return obj;
        });
        const blob = new Blob([JSON.stringify(mapped, null, 2)], { type: "application/json" });
        downloadBlob(blob, `${filename}.json`);
      }

      toast({ title: t(`Exported ${data.length} records`, `تم تصدير ${data.length} سجل`) });
    } catch (err: any) {
      toast({ variant: "destructive", title: t("Export failed", "فشل التصدير"), description: err.message });
    } finally {
      setExporting(false);
    }
  };

  const handleSaveTemplate = () => {
    if (!templateName.trim()) return;
    const newTemplate: ExportTemplate = {
      id: crypto.randomUUID(),
      name: templateName.trim(),
      module: selectedModule,
      columns: Array.from(selectedColumns),
      format,
      createdAt: new Date().toISOString(),
    };
    const updated = [...templates, newTemplate];
    setTemplates(updated);
    saveTemplates(updated);
    setTemplateName("");
    setShowSaveDialog(false);
    toast({ title: t("Template saved", "تم حفظ القالب") });
  };

  const handleLoadTemplate = (tpl: ExportTemplate) => {
    setSelectedModule(tpl.module);
    setSelectedColumns(new Set(tpl.columns));
    setFormat(tpl.format);
    toast({ title: t(`Loaded: ${tpl.name}`, `تم تحميل: ${tpl.name}`) });
  };

  const handleDeleteTemplate = (id: string) => {
    const updated = templates.filter(t => t.id !== id);
    setTemplates(updated);
    saveTemplates(updated);
  };

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {/* Left: Module & Column Picker */}
      <div className="lg:col-span-2 space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-primary" />
              {t("Configure Export", "إعداد التصدير")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Module Selector */}
            <div>
              <Label className="text-xs mb-1.5 block">{t("Data Module", "الوحدة")}</Label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {EXPORT_MODULES.map(m => (
                  <button
                    key={m.key}
                    onClick={() => handleModuleChange(m.key)}
                    className={`flex flex-col items-center gap-1 rounded-xl p-3 text-xs transition-colors border ${
                      selectedModule === m.key
                        ? "border-primary bg-primary/8 text-primary"
                        : "border-border/50 bg-muted/30 text-muted-foreground hover:bg-muted/60"
                    }`}
                  >
                    <m.icon className="h-4 w-4" />
                    <span className="font-medium">{isAr ? m.labelAr : m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <Separator />

            {/* Column Selector */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-xs">{t("Columns to Export", "الأعمدة المطلوبة")}</Label>
                <div className="flex gap-2">
                  <Button
                    variant="ghost" size="sm" className="h-6 text-[10px]"
                    onClick={() => setSelectedColumns(new Set(currentModule.columns.map(c => c.key)))}
                  >
                    {t("Select All", "تحديد الكل")}
                  </Button>
                  <Button
                    variant="ghost" size="sm" className="h-6 text-[10px]"
                    onClick={() => setSelectedColumns(new Set())}
                  >
                    {t("Clear", "مسح")}
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {currentModule.columns.map(col => (
                  <label
                    key={col.key}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 cursor-pointer text-xs transition-colors ${
                      selectedColumns.has(col.key) ? "border-primary/40 bg-primary/5" : "border-border/40"
                    }`}
                  >
                    <Checkbox
                      checked={selectedColumns.has(col.key)}
                      onCheckedChange={() => toggleColumn(col.key)}
                    />
                    <span>{isAr ? col.labelAr : col.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <Separator />

            {/* Format & Actions */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Label className="text-xs">{t("Format", "التنسيق")}:</Label>
                <Select value={format} onValueChange={(v: "csv" | "json") => setFormat(v)}>
                  <SelectTrigger className="w-24 h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="csv">CSV</SelectItem>
                    <SelectItem value="json">JSON</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Badge variant="secondary" className="text-[10px]">
                {recordCount ?? "…"} {t("records", "سجل")} • {selectedColumns.size} {t("columns", "أعمدة")}
              </Badge>
              <div className="flex gap-2 ms-auto">
                <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 gap-1 text-xs">
                      <BookmarkPlus className="h-3.5 w-3.5" />
                      {t("Save Template", "حفظ كقالب")}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-sm">
                    <DialogHeader>
                      <DialogTitle className="text-sm">{t("Save Export Template", "حفظ قالب التصدير")}</DialogTitle>
                      <DialogDescription className="text-xs">
                        {t("Save your current export configuration for quick reuse.", "احفظ إعدادات التصدير الحالية لإعادة الاستخدام.")}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3">
                      <Input
                        placeholder={t("Template name", "اسم القالب")}
                        value={templateName}
                        onChange={e => setTemplateName(e.target.value)}
                        className="h-9 text-sm"
                      />
                      <Button className="w-full h-9 text-xs" onClick={handleSaveTemplate} disabled={!templateName.trim()}>
                        <Save className="h-3.5 w-3.5 me-1.5" />
                        {t("Save", "حفظ")}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
                <Button size="sm" className="h-8 gap-1 text-xs" onClick={handleExport} disabled={exporting || selectedColumns.size === 0}>
                  {exporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                  {t("Export Now", "تصدير الآن")}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right: Saved Templates */}
      <div>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              {t("Saved Templates", "القوالب المحفوظة")}
              <Badge variant="outline" className="ms-auto text-[10px]">{templates.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {templates.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">
                {t("No saved templates yet", "لا توجد قوالب محفوظة")}
              </p>
            ) : (
              <ScrollArea className="max-h-80">
                <div className="space-y-2">
                  {templates.map(tpl => {
                    const mod = EXPORT_MODULES.find(m => m.key === tpl.module);
                    return (
                      <div
                        key={tpl.id}
                        className="rounded-lg border border-border/40 p-3 hover:bg-muted/30 transition-colors group"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium">{tpl.name}</span>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => handleLoadTemplate(tpl)}>
                              <RefreshCw className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive" onClick={() => handleDeleteTemplate(tpl.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                          <Badge variant="secondary" className="text-[9px]">{mod ? (isAr ? mod.labelAr : mod.label) : tpl.module}</Badge>
                          <span>{tpl.columns.length} {t("cols", "أعمدة")}</span>
                          <span className="uppercase">{tpl.format}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
});

/* ─── Import Tab ─── */
const ImportTab = memo(function ImportTab() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const t = (en: string, ar: string) => (isAr ? ar : en);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [importModule, setImportModule] = useState("users");
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<Record<string, string>[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState<"upload" | "map" | "preview" | "done">("upload");

  const currentModule = EXPORT_MODULES.find(m => m.key === importModule)!;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      if (!text) return;

      const lines = text.replace(/^\uFEFF/, "").split("\n").filter(l => l.trim());
      if (lines.length < 2) {
        toast({ variant: "destructive", title: t("File must have headers and at least one row", "يجب أن يحتوي الملف على رؤوس وصف واحد على الأقل") });
        return;
      }

      const headers = parseCSVLine(lines[0]);
      const rows = lines.slice(1).map(line => {
        const vals = parseCSVLine(line);
        const row: Record<string, string> = {};
        headers.forEach((h, i) => { row[h] = vals[i] || ""; });
        return row;
      });

      setParsedRows(rows);

      // Auto-map columns by matching header names
      const mapping: Record<string, string> = {};
      headers.forEach(h => {
        const match = currentModule.columns.find(
          c => c.key.toLowerCase() === h.toLowerCase() || c.label.toLowerCase() === h.toLowerCase()
        );
        if (match) mapping[h] = match.key;
      });
      setColumnMapping(mapping);
      setStep("map");
    };
    reader.readAsText(f);
  };

  const handleImport = async () => {
    setImporting(true);
    setProgress(0);
    setStep("preview");

    const mappedRows = parsedRows.map(row => {
      const mapped: Record<string, string> = {};
      Object.entries(columnMapping).forEach(([csvCol, dbCol]) => {
        if (dbCol && row[csvCol] !== undefined) {
          mapped[dbCol] = row[csvCol];
        }
      });
      return mapped;
    });

    let success = 0;
    let failed = 0;
    const batchSize = 20;

    try {
      for (let i = 0; i < mappedRows.length; i += batchSize) {
        const batch = mappedRows.slice(i, i + batchSize);
        const { error } = await supabase.from(currentModule.table as any).insert(batch as any);
        if (error) {
          failed += batch.length;
        } else {
          success += batch.length;
        }
        setProgress(Math.round(((i + batchSize) / mappedRows.length) * 100));
      }

      // Log import
      await supabase.from("bulk_imports").insert({
        entity_type: importModule,
        status: failed === 0 ? "completed" : "partial",
        file_name: file?.name || "import.csv",
        total_rows: mappedRows.length,
        processed_rows: success,
        failed_rows: failed,
        created_by: user?.id,
      } as any);

      queryClient.invalidateQueries({ queryKey: ["bulk-imports-history"] });

      toast({
        title: t(`Import complete: ${success} succeeded, ${failed} failed`, `اكتمل الاستيراد: ${success} نجح، ${failed} فشل`),
      });
      setStep("done");
    } catch (err: any) {
      toast({ variant: "destructive", title: t("Import error", "خطأ في الاستيراد"), description: err.message });
    } finally {
      setImporting(false);
    }
  };

  const reset = () => {
    setFile(null);
    setParsedRows([]);
    setColumnMapping({});
    setStep("upload");
    setProgress(0);
    if (fileRef.current) fileRef.current.value = "";
  };

  const csvHeaders = parsedRows.length > 0 ? Object.keys(parsedRows[0]) : [];

  return (
    <div className="space-y-4">
      {/* Module selector */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap items-center gap-3">
            <Label className="text-xs">{t("Import into", "استيراد إلى")}:</Label>
            <Select value={importModule} onValueChange={v => { setImportModule(v); reset(); }}>
              <SelectTrigger className="w-48 h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {EXPORT_MODULES.map(m => (
                  <SelectItem key={m.key} value={m.key}>
                    <span className="flex items-center gap-2">
                      <m.icon className="h-3 w-3" />
                      {isAr ? m.labelAr : m.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {step !== "upload" && (
              <Button variant="outline" size="sm" className="h-8 text-xs ms-auto" onClick={reset}>
                <RefreshCw className="h-3 w-3 me-1" />
                {t("Start Over", "البدء من جديد")}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Step: Upload */}
      {step === "upload" && (
        <Card>
          <CardContent className="pt-6">
            <div
              className="border-2 border-dashed border-border/60 rounded-2xl p-10 text-center hover:border-primary/40 transition-colors cursor-pointer"
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm font-medium">{t("Drop CSV file here or click to browse", "اسحب ملف CSV هنا أو انقر للتصفح")}</p>
              <p className="text-xs text-muted-foreground mt-1">{t("Supports UTF-8 CSV files", "يدعم ملفات CSV بترميز UTF-8")}</p>
              <input
                ref={fileRef}
                type="file"
                accept=".csv,.txt"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step: Column Mapping */}
      {step === "map" && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Filter className="h-4 w-4 text-primary" />
              {t("Map Columns", "تعيين الأعمدة")}
              <Badge variant="secondary" className="ms-2 text-[10px]">{parsedRows.length} {t("rows", "صف")}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              {csvHeaders.map(csvCol => (
                <div key={csvCol} className="flex items-center gap-2">
                  <span className="text-xs font-mono bg-muted/50 rounded px-2 py-1 min-w-[100px] truncate">{csvCol}</span>
                  <span className="text-xs text-muted-foreground">→</span>
                  <Select
                    value={columnMapping[csvCol] || "_skip"}
                    onValueChange={v => setColumnMapping(prev => ({ ...prev, [csvCol]: v === "_skip" ? "" : v }))}
                  >
                    <SelectTrigger className="h-8 text-xs flex-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_skip">{t("— Skip —", "— تخطي —")}</SelectItem>
                      {currentModule.columns.map(c => (
                        <SelectItem key={c.key} value={c.key}>{isAr ? c.labelAr : c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>

            {/* Preview first 5 rows */}
            <Separator />
            <p className="text-xs font-medium">{t("Preview (first 5 rows)", "معاينة (أول 5 صفوف)")}</p>
            <ScrollArea className="max-h-48 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {csvHeaders.map(h => <TableHead key={h} className="text-[10px] py-1">{h}</TableHead>)}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedRows.slice(0, 5).map((row, i) => (
                    <TableRow key={i}>
                      {csvHeaders.map(h => <TableCell key={h} className="text-[11px] py-1 max-w-[150px] truncate">{row[h]}</TableCell>)}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>

            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" className="h-8 text-xs" onClick={reset}>{t("Cancel", "إلغاء")}</Button>
              <Button size="sm" className="h-8 text-xs gap-1" onClick={handleImport} disabled={Object.values(columnMapping).filter(Boolean).length === 0}>
                <Upload className="h-3.5 w-3.5" />
                {t(`Import ${parsedRows.length} rows`, `استيراد ${parsedRows.length} صف`)}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step: Progress */}
      {step === "preview" && importing && (
        <Card>
          <CardContent className="pt-6 text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-sm font-medium">{t("Importing data...", "جاري استيراد البيانات...")}</p>
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground">{progress}%</p>
          </CardContent>
        </Card>
      )}

      {/* Step: Done */}
      {step === "done" && (
        <Card>
          <CardContent className="pt-6 text-center space-y-4">
            <CheckCircle className="h-10 w-10 mx-auto text-green-500" />
            <p className="text-sm font-medium">{t("Import Complete!", "اكتمل الاستيراد!")}</p>
            <Button size="sm" className="h-8 text-xs" onClick={reset}>
              {t("Import More", "استيراد المزيد")}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
});

/* ─── History Tab ─── */
const HistoryTab = memo(function HistoryTab() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const t = (en: string, ar: string) => (isAr ? ar : en);

  const { data: imports, isLoading } = useQuery({
    queryKey: ["bulk-imports-history"],
    queryFn: async () => {
      const { data } = await supabase
        .from("bulk_imports")
        .select("id, entity_type, status, file_name, total_rows, processed_rows, failed_rows, created_at")
        .order("created_at", { ascending: false })
        .limit(50);
      return data || [];
    },
  });

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      completed: "bg-green-500/10 text-green-700 dark:text-green-400",
      partial: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
      review: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
      failed: "bg-red-500/10 text-red-700 dark:text-red-400",
    };
    return <Badge className={`text-[10px] ${colors[status] || ""}`}>{status}</Badge>;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <History className="h-4 w-4 text-primary" />
          {t("Import History", "سجل الاستيراد")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => <div key={i} className="h-12 bg-muted/50 rounded-lg animate-pulse" />)}
          </div>
        ) : !imports?.length ? (
          <p className="text-xs text-muted-foreground text-center py-8">{t("No import history yet", "لا يوجد سجل استيراد")}</p>
        ) : (
          <ScrollArea className="max-h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[10px]">{t("Date", "التاريخ")}</TableHead>
                  <TableHead className="text-[10px]">{t("Type", "النوع")}</TableHead>
                  <TableHead className="text-[10px]">{t("File", "الملف")}</TableHead>
                  <TableHead className="text-[10px]">{t("Status", "الحالة")}</TableHead>
                  <TableHead className="text-[10px] text-end">{t("Rows", "الصفوف")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {imports.map(imp => (
                  <TableRow key={imp.id}>
                    <TableCell className="text-[11px]">{format(new Date(imp.created_at), "MMM dd, HH:mm")}</TableCell>
                    <TableCell><Badge variant="outline" className="text-[9px]">{imp.entity_type}</Badge></TableCell>
                    <TableCell className="text-[11px] max-w-[150px] truncate">{imp.file_name || "—"}</TableCell>
                    <TableCell>{statusBadge(imp.status)}</TableCell>
                    <TableCell className="text-[11px] text-end tabular-nums">
                      <span className="text-green-600">{imp.processed_rows || 0}</span>
                      {(imp.failed_rows || 0) > 0 && <span className="text-red-500 ms-1">/ {imp.failed_rows}</span>}
                      <span className="text-muted-foreground ms-1">of {imp.total_rows}</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
});

/* ─── Helpers ─── */
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += c;
    }
  }
  result.push(current.trim());
  return result;
}
