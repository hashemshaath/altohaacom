import { useState, memo, useCallback } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  ScanSearch, Merge, AlertTriangle, CheckCircle2, Loader2,
  Shield, Clock, Activity, Zap, BarChart3,
} from "lucide-react";
import { useEntityDedup, type DupGroup, type DupCandidate } from "@/hooks/useEntityDedup";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";

const TABLE_OPTIONS = [
  { value: "organizers", label_en: "Organizers", label_ar: "المنظمون", icon: "🏢" },
  { value: "companies", label_en: "Companies", label_ar: "الشركات", icon: "🏭" },
  { value: "culinary_entities", label_en: "Culinary Entities", label_ar: "الكيانات", icon: "🍴" },
  { value: "establishments", label_en: "Establishments", label_ar: "المنشآت", icon: "🏨" },
  { value: "exhibitions", label_en: "Exhibitions", label_ar: "المعارض", icon: "🎪" },
];

const ALL_TABLES = TABLE_OPTIONS.map(t => t.value);

// ─── Audit Log Hook ───
function useMergeAuditLog() {
  return useQuery({
    queryKey: ["dedup-audit-log"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_actions")
        .select("*")
        .eq("action_type", "entity_merge")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
    staleTime: 30_000,
  });
}

// ─── Global Scan Results ───
interface GlobalScanResult {
  table: string;
  groups: DupGroup[];
  totalRecords: number;
}

const DeduplicationAdmin = memo(function DeduplicationAdmin() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { scanning, batchScan, merging, mergeEntities } = useEntityDedup();
  const { data: auditLog, refetch: refetchAudit } = useMergeAuditLog();

  const [activeTab, setActiveTab] = useState("scanner");
  const [globalResults, setGlobalResults] = useState<GlobalScanResult[]>([]);
  const [globalScanning, setGlobalScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [crossTableCheck, setCrossTableCheck] = useState(true);
  const [selectedTable, setSelectedTable] = useState("organizers");
  const [mergeConfirm, setMergeConfirm] = useState<{ group: DupGroup; selected: string[]; table: string } | null>(null);

  // ─── Global Scan ───
  const handleGlobalScan = useCallback(async () => {
    setGlobalScanning(true);
    setGlobalResults([]);
    setScanProgress(0);
    const results: GlobalScanResult[] = [];

    for (let i = 0; i < ALL_TABLES.length; i++) {
      const tbl = ALL_TABLES[i];
      setScanProgress(Math.round(((i + 0.5) / ALL_TABLES.length) * 100));
      try {
        const groups = await batchScan(tbl, crossTableCheck ? ALL_TABLES.filter(t => t !== tbl) : []);
        if (groups.length > 0) {
          results.push({ table: tbl, groups, totalRecords: 0 });
        }
      } catch { /* continue */ }
      setScanProgress(Math.round(((i + 1) / ALL_TABLES.length) * 100));
    }

    setGlobalResults(results);
    setGlobalScanning(false);
    setScanProgress(100);
    const totalDups = results.reduce((s, r) => s + r.groups.length, 0);
    if (totalDups > 0) {
      toast.warning(isAr ? `تم العثور على ${totalDups} مجموعة مكررة` : `Found ${totalDups} duplicate groups`);
    } else {
      toast.success(isAr ? "لا توجد تكرارات!" : "No duplicates found!");
    }
  }, [batchScan, crossTableCheck, isAr]);

  // ─── Single Table Scan ───
  const handleTableScan = useCallback(async () => {
    const groups = await batchScan(selectedTable, crossTableCheck ? ALL_TABLES.filter(t => t !== selectedTable) : []);
    setGlobalResults(groups.length > 0 ? [{ table: selectedTable, groups, totalRecords: 0 }] : []);
  }, [batchScan, selectedTable, crossTableCheck]);

  // ─── Merge with Audit ───
  const handleMerge = useCallback(async () => {
    if (!mergeConfirm) return;
    try {
      await mergeEntities(mergeConfirm.group.primary.id, mergeConfirm.selected, mergeConfirm.table);
      // Log to admin_actions
      await supabase.from("admin_actions").insert({
        admin_id: (await supabase.auth.getUser()).data.user?.id || "",
        action_type: "entity_merge",
        details: {
          table: mergeConfirm.table,
          primary_id: mergeConfirm.group.primary.id,
          primary_name: mergeConfirm.group.primary.name,
          merged_ids: mergeConfirm.selected,
          merged_count: mergeConfirm.selected.length,
        },
      });
      toast.success(isAr ? "تم الدمج بنجاح" : "Merge completed");
      setMergeConfirm(null);
      refetchAudit();
    } catch {
      toast.error(isAr ? "فشل الدمج" : "Merge failed");
    }
  }, [mergeConfirm, mergeEntities, isAr, refetchAudit]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-destructive";
    if (score >= 50) return "text-orange-500";
    return "text-yellow-600";
  };

  const totalDupGroups = globalResults.reduce((s, r) => s + r.groups.length, 0);
  const highConfidence = globalResults.reduce(
    (s, r) => s + r.groups.filter(g => g.matches[0]?.score >= 80).length, 0
  );

  return (
    <div className="space-y-6">
      <AdminBreadcrumb
        items={[
          { label: isAr ? "لوحة التحكم" : "Dashboard", href: "/admin" },
          { label: isAr ? "فاحص التكرارات" : "Deduplication Center" },
        ]}
      />

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: ScanSearch, label: isAr ? "الأقسام" : "Sections", value: ALL_TABLES.length, color: "text-primary" },
          { icon: AlertTriangle, label: isAr ? "مجموعات مكررة" : "Dup Groups", value: totalDupGroups, color: totalDupGroups > 0 ? "text-destructive" : "text-green-500" },
          { icon: Zap, label: isAr ? "ثقة عالية" : "High Confidence", value: highConfidence, color: "text-orange-500" },
          { icon: Activity, label: isAr ? "عمليات الدمج" : "Total Merges", value: auditLog?.length || 0, color: "text-primary" },
        ].map((s, i) => (
          <Card key={i} className="p-3">
            <div className="flex items-center gap-2">
              <s.icon className={`h-4 w-4 ${s.color}`} />
              <div>
                <div className="text-lg font-bold">{s.value}</div>
                <div className="text-[10px] text-muted-foreground">{s.label}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="scanner" className="gap-1.5 text-xs">
            <ScanSearch className="h-3.5 w-3.5" />
            {isAr ? "الفاحص" : "Scanner"}
          </TabsTrigger>
          <TabsTrigger value="suggestions" className="gap-1.5 text-xs">
            <Zap className="h-3.5 w-3.5" />
            {isAr ? "اقتراحات تلقائية" : "Auto-Suggestions"}
          </TabsTrigger>
          <TabsTrigger value="audit" className="gap-1.5 text-xs">
            <Clock className="h-3.5 w-3.5" />
            {isAr ? "سجل العمليات" : "Audit Log"}
          </TabsTrigger>
        </TabsList>

        {/* ─── Tab: Scanner ─── */}
        <TabsContent value="scanner" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{isAr ? "فحص شامل" : "Comprehensive Scan"}</CardTitle>
              <CardDescription className="text-xs">
                {isAr ? "فحص جميع الأقسام أو قسم محدد للعثور على السجلات المكررة" : "Scan all sections or a specific one to find duplicate records"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-3 items-end">
                <div className="min-w-[160px]">
                  <Select value={selectedTable} onValueChange={setSelectedTable}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TABLE_OPTIONS.map(t => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.icon} {isAr ? t.label_ar : t.label_en}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <Checkbox checked={crossTableCheck} onCheckedChange={(c) => setCrossTableCheck(c === true)} />
                  {isAr ? "فحص عبر الأقسام" : "Cross-section"}
                </label>
                <Button onClick={handleTableScan} disabled={scanning} variant="outline" className="gap-2">
                  {scanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScanSearch className="h-4 w-4" />}
                  {isAr ? "فحص القسم" : "Scan Section"}
                </Button>
                <Button onClick={handleGlobalScan} disabled={globalScanning} className="gap-2">
                  {globalScanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <BarChart3 className="h-4 w-4" />}
                  {globalScanning ? (isAr ? "جاري الفحص..." : "Scanning...") : (isAr ? "فحص شامل" : "Full Scan")}
                </Button>
              </div>

              {globalScanning && <Progress value={scanProgress} className="h-2" />}
            </CardContent>
          </Card>

          {/* Results */}
          {globalResults.length === 0 && !globalScanning && !scanning && (
            <Card className="p-8 text-center">
              <CheckCircle2 className="h-10 w-10 mx-auto mb-3 text-green-500" />
              <p className="text-sm text-muted-foreground">
                {isAr ? "قم بتشغيل الفحص للعثور على التكرارات" : "Run a scan to find duplicates"}
              </p>
            </Card>
          )}

          {globalResults.map((result) => {
            const tblInfo = TABLE_OPTIONS.find(t => t.value === result.table);
            return (
              <Card key={result.table} className="border-destructive/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <span>{tblInfo?.icon}</span>
                    {isAr ? tblInfo?.label_ar : tblInfo?.label_en}
                    <Badge variant="destructive" className="text-[10px]">
                      {result.groups.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {result.groups.map((group, gi) => (
                    <div key={gi} className="border rounded-xl p-3 bg-destructive/5 space-y-2">
                      {/* Primary */}
                      <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7">
                          <AvatarImage src={group.primary.logo_url || ""} />
                          <AvatarFallback className="text-[9px]">{group.primary.name?.slice(0, 2)?.toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-semibold truncate block">{group.primary.name}</span>
                          <span className="text-[10px] text-muted-foreground">{group.primary.identifier} • {group.primary.city || "—"}</span>
                        </div>
                        <Badge variant="secondary" className="text-[9px]">{isAr ? "الأساسي" : "Primary"}</Badge>
                      </div>
                      {/* Matches */}
                      {group.matches.map((m, mi) => (
                        <div key={mi} className="flex items-center gap-2 ps-6 py-1 border-s-2 border-destructive/30">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={m.record.logo_url || ""} />
                            <AvatarFallback className="text-[8px]">{m.record.name?.slice(0, 2)?.toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <span className="text-xs font-medium truncate block">{m.record.name}</span>
                            <div className="flex gap-1 flex-wrap">
                              {m.reasons.slice(0, 2).map((r, ri) => (
                                <span key={ri} className="text-[8px] bg-muted px-1 py-0.5 rounded">{r}</span>
                              ))}
                            </div>
                          </div>
                          <span className={`text-xs font-bold ${getScoreColor(m.score)}`}>{Math.round(m.score)}%</span>
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full gap-1.5 h-7 text-xs border-destructive/30 hover:bg-destructive/10"
                        onClick={() => setMergeConfirm({
                          group,
                          selected: group.matches.filter(m => m.table_name === result.table).map(m => m.record.id),
                          table: result.table,
                        })}
                      >
                        <Merge className="h-3 w-3" />
                        {isAr ? "دمج في الأساسي" : "Merge into primary"}
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        {/* ─── Tab: Auto-Suggestions (High Confidence) ─── */}
        <TabsContent value="suggestions" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="h-5 w-5 text-orange-500" />
                {isAr ? "اقتراحات الدمج التلقائي" : "Auto-Merge Suggestions"}
              </CardTitle>
              <CardDescription className="text-xs">
                {isAr
                  ? "سجلات بدرجة تطابق ≥80% جاهزة للدمج السريع بنقرة واحدة"
                  : "Records with ≥80% match score ready for one-click merge"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {globalResults.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  <ScanSearch className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  {isAr ? "قم بتشغيل الفحص الشامل أولاً" : "Run a full scan first to see suggestions"}
                </div>
              ) : highConfidence === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  {isAr ? "لا توجد تطابقات عالية الثقة" : "No high-confidence matches found"}
                </div>
              ) : (
                <ScrollArea className="max-h-[500px]">
                  <div className="space-y-3">
                    {globalResults.flatMap((result) =>
                      result.groups
                        .filter(g => g.matches[0]?.score >= 80)
                        .map((group, gi) => {
                          const tblInfo = TABLE_OPTIONS.find(t => t.value === result.table);
                          return (
                            <div key={`${result.table}-${gi}`} className="flex items-center gap-3 p-3 rounded-xl border border-orange-500/30 bg-orange-500/5">
                              <div className="flex-1 min-w-0 space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-semibold">{group.primary.name}</span>
                                  <span className="text-muted-foreground">↔</span>
                                  <span className="text-sm">{group.matches[0].record.name}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-[9px]">{tblInfo?.icon} {isAr ? tblInfo?.label_ar : tblInfo?.label_en}</Badge>
                                  <span className={`text-xs font-bold ${getScoreColor(group.matches[0].score)}`}>
                                    {Math.round(group.matches[0].score)}%
                                  </span>
                                  {group.matches[0].reasons.slice(0, 2).map((r, ri) => (
                                    <span key={ri} className="text-[9px] bg-muted px-1.5 py-0.5 rounded">{r}</span>
                                  ))}
                                </div>
                              </div>
                              <Button
                                variant="default"
                                size="sm"
                                className="gap-1 h-8 text-xs"
                                onClick={() => setMergeConfirm({
                                  group,
                                  selected: group.matches.filter(m => m.table_name === result.table).map(m => m.record.id),
                                  table: result.table,
                                })}
                              >
                                <Merge className="h-3 w-3" />
                                {isAr ? "دمج" : "Merge"}
                              </Button>
                            </div>
                          );
                        })
                    )}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Tab: Audit Log ─── */}
        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                {isAr ? "سجل عمليات الدمج" : "Merge Audit Log"}
              </CardTitle>
              <CardDescription className="text-xs">
                {isAr ? "تاريخ جميع عمليات الدمج مع التفاصيل الكاملة" : "Complete history of all merge operations with full details"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!auditLog?.length ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  {isAr ? "لا توجد عمليات دمج سابقة" : "No merge operations yet"}
                </div>
              ) : (
                <ScrollArea className="max-h-[500px]">
                  <div className="space-y-2">
                    {auditLog.map((log: any) => {
                      const details = log.details as any;
                      const tblInfo = TABLE_OPTIONS.find(t => t.value === details?.table);
                      return (
                        <div key={log.id} className="flex items-start gap-3 p-3 rounded-xl border bg-muted/30">
                          <Merge className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-medium">{details?.primary_name || "—"}</span>
                              <Badge variant="outline" className="text-[9px]">
                                {tblInfo?.icon} {isAr ? tblInfo?.label_ar : tblInfo?.label_en}
                              </Badge>
                              <Badge variant="secondary" className="text-[9px]">
                                +{details?.merged_count || 0} {isAr ? "مدمج" : "merged"}
                              </Badge>
                            </div>
                            <div className="text-[10px] text-muted-foreground">
                              {format(new Date(log.created_at), "yyyy-MM-dd HH:mm")}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Merge Confirm Dialog */}
      <ConfirmDialog
        open={!!mergeConfirm}
        onOpenChange={(o) => !o && setMergeConfirm(null)}
        title={isAr ? "تأكيد الدمج" : "Confirm Merge"}
        description={
          isAr
            ? `سيتم دمج ${mergeConfirm?.selected.length || 0} سجل في "${mergeConfirm?.group.primary.name}". لا يمكن التراجع.`
            : `${mergeConfirm?.selected.length || 0} record(s) will be merged into "${mergeConfirm?.group.primary.name}". This cannot be undone.`
        }
        confirmLabel={isAr ? "دمج" : "Merge"}
        cancelLabel={isAr ? "إلغاء" : "Cancel"}
        variant="destructive"
        onConfirm={handleMerge}
        loading={merging}
      />
    </div>
  );
});

export default DeduplicationAdmin;
