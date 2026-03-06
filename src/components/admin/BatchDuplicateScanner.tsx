import { useState, memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  ScanSearch, Merge, AlertTriangle, CheckCircle2, Loader2, Building2,
} from "lucide-react";
import { useEntityDedup, type DupGroup } from "@/hooks/useEntityDedup";
import { toast } from "sonner";

const TABLE_OPTIONS = [
  { value: "organizers", label_en: "Organizers", label_ar: "المنظمون" },
  { value: "companies", label_en: "Companies", label_ar: "الشركات" },
  { value: "culinary_entities", label_en: "Culinary Entities", label_ar: "الكيانات" },
  { value: "establishments", label_en: "Establishments", label_ar: "المنشآت" },
  { value: "exhibitions", label_en: "Exhibitions", label_ar: "المعارض" },
];

const CROSS_TABLES = ["organizers", "companies", "culinary_entities", "establishments", "exhibitions"];

interface BatchDuplicateScannerProps {
  defaultTable?: string;
  onMergeComplete?: () => void;
}

export const BatchDuplicateScanner = memo(function BatchDuplicateScanner({
  defaultTable = "organizers",
  onMergeComplete,
}: BatchDuplicateScannerProps) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { scanning, scanGroups, batchScan, merging, mergeEntities } = useEntityDedup();
  const [table, setTable] = useState(defaultTable);
  const [crossTableCheck, setCrossTableCheck] = useState(true);
  const [mergeConfirm, setMergeConfirm] = useState<{ group: DupGroup; selected: string[] } | null>(null);

  const handleScan = () => {
    batchScan(table, crossTableCheck ? CROSS_TABLES.filter(t => t !== table) : []);
  };

  const handleMerge = async () => {
    if (!mergeConfirm) return;
    try {
      await mergeEntities(
        mergeConfirm.group.primary.id,
        mergeConfirm.selected,
        table
      );
      toast.success(isAr ? "تم الدمج بنجاح" : "Merge completed");
      setMergeConfirm(null);
      onMergeComplete?.();
      // Re-scan
      batchScan(table, crossTableCheck ? CROSS_TABLES.filter(t => t !== table) : []);
    } catch {
      toast.error(isAr ? "فشل الدمج" : "Merge failed");
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-destructive";
    if (score >= 50) return "text-orange-500";
    return "text-yellow-600";
  };

  return (
    <>
      <Card className="border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ScanSearch className="h-5 w-5 text-primary" />
            {isAr ? "فاحص التكرارات الذكي" : "Smart Duplicate Scanner"}
          </CardTitle>
          <CardDescription className="text-xs">
            {isAr
              ? "فحص شامل للعثور على السجلات المكررة ودمجها عبر جميع الأقسام"
              : "Comprehensive scan to find and merge duplicate records across all sections"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[140px]">
              <Select value={table} onValueChange={setTable}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TABLE_OPTIONS.map(t => (
                    <SelectItem key={t.value} value={t.value}>
                      {isAr ? t.label_ar : t.label_en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <Checkbox
                checked={crossTableCheck}
                onCheckedChange={(c) => setCrossTableCheck(c === true)}
              />
              {isAr ? "فحص عبر الأقسام" : "Cross-section check"}
            </label>
            <Button onClick={handleScan} disabled={scanning} className="gap-2">
              {scanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScanSearch className="h-4 w-4" />}
              {scanning ? (isAr ? "جاري الفحص..." : "Scanning...") : (isAr ? "بدء الفحص" : "Start Scan")}
            </Button>
          </div>

          {scanning && <Progress value={50} className="h-1.5 animate-pulse" />}

          {!scanning && scanGroups.length === 0 && (
            <div className="text-center py-6 text-sm text-muted-foreground">
              <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
              {isAr ? "لا توجد تكرارات — البيانات نظيفة ✨" : "No duplicates found — data is clean ✨"}
            </div>
          )}

          {scanGroups.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Badge variant="destructive" className="text-xs">
                  {isAr ? `${scanGroups.length} مجموعة مكررة` : `${scanGroups.length} duplicate group${scanGroups.length > 1 ? 's' : ''}`}
                </Badge>
              </div>

              {scanGroups.map((group, gi) => (
                <Card key={gi} className="border-destructive/20 bg-destructive/5">
                  <CardContent className="p-3 space-y-2">
                    {/* Primary record */}
                    <div className="flex items-center gap-2">
                      <Avatar className="h-7 w-7">
                        <AvatarImage src={group.primary.logo_url || ""} />
                        <AvatarFallback className="text-[9px]">{group.primary.name?.slice(0, 2)?.toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-semibold truncate block">{group.primary.name}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {group.primary.identifier} • {group.primary.city || group.primary.country || "—"}
                        </span>
                      </div>
                      <Badge variant="secondary" className="text-[9px]">
                        {isAr ? "الأساسي" : "Primary"}
                      </Badge>
                    </div>

                    {/* Matches */}
                    {group.matches.map((m, mi) => (
                      <div
                        key={mi}
                        className="flex items-center gap-2 ps-6 py-1.5 border-s-2 border-destructive/30"
                      >
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
                        <Badge variant="outline" className="text-[9px]">
                          {m.table_name !== table
                            ? TABLE_OPTIONS.find(t => t.value === m.table_name)?.[isAr ? "label_ar" : "label_en"]
                            : ""}
                        </Badge>
                        <span className={`text-xs font-bold ${getScoreColor(m.score)}`}>
                          {Math.round(m.score)}%
                        </span>
                      </div>
                    ))}

                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full gap-1.5 h-7 text-xs border-destructive/30 hover:bg-destructive/10"
                      onClick={() => setMergeConfirm({
                        group,
                        selected: group.matches
                          .filter(m => m.table_name === table)
                          .map(m => m.record.id),
                      })}
                    >
                      <Merge className="h-3 w-3" />
                      {isAr ? "دمج في الأساسي" : "Merge into primary"}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!mergeConfirm}
        onOpenChange={(o) => !o && setMergeConfirm(null)}
        title={isAr ? "تأكيد الدمج" : "Confirm Merge"}
        description={
          isAr
            ? `سيتم دمج ${mergeConfirm?.selected.length || 0} سجل في "${mergeConfirm?.group.primary.name}". سيتم نقل جميع الروابط والبيانات المرتبطة تلقائياً. لا يمكن التراجع عن هذا الإجراء.`
            : `${mergeConfirm?.selected.length || 0} record(s) will be merged into "${mergeConfirm?.group.primary.name}". All linked data will be reassigned automatically. This cannot be undone.`
        }
        confirmLabel={isAr ? "دمج" : "Merge"}
        cancelLabel={isAr ? "إلغاء" : "Cancel"}
        variant="destructive"
        onConfirm={handleMerge}
        loading={merging}
      />
    </>
  );
});
