import { useState, useMemo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { FileText, Download, Plus, Clock, Trash2, Play, Calendar, FileSpreadsheet, Printer } from "lucide-react";
import { format } from "date-fns";

const REPORT_TYPES = [
  { value: "users", label: "Users", labelAr: "المستخدمين" },
  { value: "companies", label: "Companies", labelAr: "الشركات" },
  { value: "competitions", label: "Competitions", labelAr: "المسابقات" },
  { value: "exhibitions", label: "Exhibitions", labelAr: "المعارض" },
  { value: "orders", label: "Orders", labelAr: "الطلبات" },
  { value: "financial", label: "Financial", labelAr: "المالية" },
];

const SCHEDULE_OPTIONS = [
  { value: "manual", label: "Manual", labelAr: "يدوي" },
  { value: "daily", label: "Daily", labelAr: "يومي" },
  { value: "weekly", label: "Weekly", labelAr: "أسبوعي" },
  { value: "monthly", label: "Monthly", labelAr: "شهري" },
];

const REPORT_COLUMNS: Record<string, { value: string; label: string; labelAr: string }[]> = {
  users: [
    { value: "full_name", label: "Name", labelAr: "الاسم" },
    { value: "email", label: "Email", labelAr: "البريد" },
    { value: "country_code", label: "Country", labelAr: "الدولة" },
    { value: "role", label: "Role", labelAr: "الدور" },
    { value: "created_at", label: "Joined", labelAr: "تاريخ الانضمام" },
    { value: "status", label: "Status", labelAr: "الحالة" },
  ],
  companies: [
    { value: "name", label: "Name", labelAr: "الاسم" },
    { value: "type", label: "Type", labelAr: "النوع" },
    { value: "country_code", label: "Country", labelAr: "الدولة" },
    { value: "status", label: "Status", labelAr: "الحالة" },
    { value: "supplier_score", label: "Score", labelAr: "التقييم" },
    { value: "created_at", label: "Created", labelAr: "تاريخ الإنشاء" },
  ],
  competitions: [
    { value: "title", label: "Title", labelAr: "العنوان" },
    { value: "status", label: "Status", labelAr: "الحالة" },
    { value: "country_code", label: "Country", labelAr: "الدولة" },
    { value: "edition_year", label: "Year", labelAr: "السنة" },
    { value: "created_at", label: "Created", labelAr: "تاريخ الإنشاء" },
  ],
  exhibitions: [
    { value: "title", label: "Title", labelAr: "العنوان" },
    { value: "status", label: "Status", labelAr: "الحالة" },
    { value: "start_date", label: "Start", labelAr: "البداية" },
    { value: "venue", label: "Venue", labelAr: "المكان" },
    { value: "created_at", label: "Created", labelAr: "تاريخ الإنشاء" },
  ],
  orders: [
    { value: "order_number", label: "Order #", labelAr: "رقم الطلب" },
    { value: "status", label: "Status", labelAr: "الحالة" },
    { value: "total_amount", label: "Amount", labelAr: "المبلغ" },
    { value: "created_at", label: "Date", labelAr: "التاريخ" },
  ],
  financial: [
    { value: "transaction_number", label: "Txn #", labelAr: "رقم المعاملة" },
    { value: "type", label: "Type", labelAr: "النوع" },
    { value: "amount", label: "Amount", labelAr: "المبلغ" },
    { value: "created_at", label: "Date", labelAr: "التاريخ" },
  ],
};

function exportToCSV(data: any[], filename: string) {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const bom = "\uFEFF";
  const csv = bom + [headers.join(","), ...data.map(row =>
    headers.map(h => {
      const val = row[h] ?? "";
      return `"${String(val).replace(/"/g, '""')}"`;
    }).join(",")
  )].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function printReport(data: any[], title: string) {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const rows = data.map(row =>
    `<tr>${headers.map(h => `<td style="border:1px solid #ddd;padding:6px;font-size:12px">${row[h] ?? ""}</td>`).join("")}</tr>`
  ).join("");
  const html = `<html><head><title>${title}</title><style>
    body{font-family:Arial;padding:20px}
    table{border-collapse:collapse;width:100%}
    th{background:#f3f4f6;border:1px solid #ddd;padding:8px;font-size:12px;text-align:start}
    h1{font-size:18px;margin-bottom:4px}
    .meta{color:#666;font-size:12px;margin-bottom:16px}
  </style></head><body>
    <h1>${title}</h1>
    <p class="meta">Generated: ${new Date().toLocaleString()} | Rows: ${data.length}</p>
    <table><thead><tr>${headers.map(h => `<th>${h}</th>`).join("")}</tr></thead><tbody>${rows}</tbody></table>
  </body></html>`;
  const w = window.open("", "_blank");
  if (w) { w.document.write(html); w.document.close(); w.print(); }
}

export function ReportBuilder() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState("users");
  const [newSchedule, setNewSchedule] = useState("manual");
  const [selectedCols, setSelectedCols] = useState<string[]>([]);
  const [runningId, setRunningId] = useState<string | null>(null);

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ["savedReports"],
    queryFn: async () => {
      const { data } = await supabase
        .from("saved_reports")
        .select("*")
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const { data: exportHistory = [] } = useQuery({
    queryKey: ["reportExports"],
    queryFn: async () => {
      const { data } = await supabase
        .from("report_exports")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      return data || [];
    },
  });

  const createReport = useMutation({
    mutationFn: async () => {
      if (!newName.trim()) throw new Error("Name required");
      const { error } = await supabase.from("saved_reports").insert({
        created_by: user!.id,
        name: newName,
        report_type: newType,
        columns: selectedCols.length ? selectedCols : REPORT_COLUMNS[newType]?.map(c => c.value) || [],
        schedule: newSchedule === "manual" ? null : newSchedule,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savedReports"] });
      toast.success(isAr ? "تم إنشاء التقرير" : "Report created");
      setShowCreate(false);
      setNewName("");
      setSelectedCols([]);
    },
    onError: () => toast.error(isAr ? "فشل الإنشاء" : "Failed to create"),
  });

  const deleteReport = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("saved_reports").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savedReports"] });
      toast.success(isAr ? "تم الحذف" : "Report deleted");
    },
  });

  const runReport = async (report: any, exportFormat: "csv" | "print") => {
    setRunningId(report.id);
    try {
      const tableMap: Record<string, string> = {
        users: "profiles",
        companies: "companies",
        competitions: "competitions",
        exhibitions: "exhibitions",
        orders: "company_orders",
        financial: "company_transactions",
      };
      const tableName = tableMap[report.report_type as string] || "profiles";

      const cols = (report.columns as string[])?.length ? (report.columns as string[]).join(",") : "*";
      // Use type-safe approach with any cast for dynamic table name
      const { data, error } = await (supabase.from as any)(tableName).select(cols).limit(1000);
      if (error) throw error;

      const filename = `${report.name}_${format(new Date(), "yyyyMMdd_HHmm")}`;
      if (exportFormat === "csv") {
        exportToCSV(data || [], filename);
      } else {
        printReport(data || [], report.name);
      }

      // Log export
      await supabase.from("report_exports").insert({
        report_id: report.id,
        exported_by: user!.id,
        report_type: report.report_type,
        format: exportFormat === "print" ? "pdf" : "csv",
        row_count: data?.length || 0,
      });
      queryClient.invalidateQueries({ queryKey: ["reportExports"] });

      // Update last generated
      await supabase.from("saved_reports").update({ last_generated_at: new Date().toISOString() }).eq("id", report.id);
      queryClient.invalidateQueries({ queryKey: ["savedReports"] });

      toast.success(isAr ? "تم تصدير التقرير" : "Report exported");
    } catch {
      toast.error(isAr ? "فشل التصدير" : "Export failed");
    } finally {
      setRunningId(null);
    }
  };

  const toggleCol = (col: string) => {
    setSelectedCols(prev => prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">{isAr ? "منشئ التقارير" : "Report Builder"}</h3>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 me-1" />{isAr ? "تقرير جديد" : "New Report"}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{isAr ? "إنشاء تقرير" : "Create Report"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>{isAr ? "اسم التقرير" : "Report Name"}</Label>
                <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder={isAr ? "أدخل اسم التقرير" : "Enter report name"} />
              </div>
              <div>
                <Label>{isAr ? "نوع التقرير" : "Report Type"}</Label>
                <Select value={newType} onValueChange={v => { setNewType(v); setSelectedCols([]); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {REPORT_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value}>{isAr ? t.labelAr : t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{isAr ? "الأعمدة" : "Columns"}</Label>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {(REPORT_COLUMNS[newType] || []).map(col => (
                    <Badge
                      key={col.value}
                      variant={selectedCols.includes(col.value) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleCol(col.value)}
                    >
                      {isAr ? col.labelAr : col.label}
                    </Badge>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">{isAr ? "اضغط لتحديد الأعمدة (فارغ = الكل)" : "Click to select columns (empty = all)"}</p>
              </div>
              <div>
                <Label>{isAr ? "الجدولة" : "Schedule"}</Label>
                <Select value={newSchedule} onValueChange={setNewSchedule}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SCHEDULE_OPTIONS.map(s => (
                      <SelectItem key={s.value} value={s.value}>{isAr ? s.labelAr : s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={() => createReport.mutate()} disabled={createReport.isPending} className="w-full">
                {isAr ? "إنشاء" : "Create Report"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Saved Reports */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{isAr ? "التقارير المحفوظة" : "Saved Reports"}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">{isAr ? "الاسم" : "Name"}</TableHead>
                  <TableHead className="text-xs">{isAr ? "النوع" : "Type"}</TableHead>
                  <TableHead className="text-xs">{isAr ? "الجدولة" : "Schedule"}</TableHead>
                  <TableHead className="text-xs">{isAr ? "آخر تشغيل" : "Last Run"}</TableHead>
                  <TableHead className="text-xs">{isAr ? "إجراءات" : "Actions"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report: any) => {
                  const typeInfo = REPORT_TYPES.find(t => t.value === report.report_type);
                  return (
                    <TableRow key={report.id}>
                      <TableCell className="font-medium text-sm">{report.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">
                          {isAr ? typeInfo?.labelAr : typeInfo?.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">
                        {report.schedule ? (
                          <Badge variant="secondary" className="text-[10px]">
                            <Clock className="h-3 w-3 me-0.5" />
                            {report.schedule}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">{isAr ? "يدوي" : "Manual"}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {report.last_generated_at
                          ? format(new Date(report.last_generated_at), "MMM dd, HH:mm")
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            disabled={runningId === report.id}
                            onClick={() => runReport(report, "csv")}
                            title="CSV"
                          >
                            <FileSpreadsheet className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            disabled={runningId === report.id}
                            onClick={() => runReport(report, "print")}
                            title="Print"
                          >
                            <Printer className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-destructive"
                            onClick={() => deleteReport.mutate(report.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {!reports.length && !isLoading && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-8">
                      {isAr ? "لا توجد تقارير محفوظة" : "No saved reports yet"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Export History */}
      {exportHistory.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{isAr ? "سجل التصدير" : "Export History"}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">{isAr ? "النوع" : "Type"}</TableHead>
                    <TableHead className="text-xs">{isAr ? "التنسيق" : "Format"}</TableHead>
                    <TableHead className="text-xs">{isAr ? "الصفوف" : "Rows"}</TableHead>
                    <TableHead className="text-xs">{isAr ? "التاريخ" : "Date"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {exportHistory.map((exp: any) => (
                    <TableRow key={exp.id}>
                      <TableCell className="text-xs">{exp.report_type}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] uppercase">{exp.format}</Badge>
                      </TableCell>
                      <TableCell className="text-xs">{exp.row_count}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {format(new Date(exp.created_at), "MMM dd, HH:mm")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
