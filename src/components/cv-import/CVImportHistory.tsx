import { useState, useMemo, memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  History, FileText, User, Calendar, ChevronDown, ChevronUp,
  Download, Search, BarChart3, CheckCircle2,
} from "lucide-react";
import { downloadCSV, downloadJSON } from "@/lib/exportUtils";
import { useCVImportHistory } from "@/hooks/useCVImportHistory";
import { formatShortDateTime } from "@/lib/dateUtils";

interface Props {
  isAr: boolean;
  refreshTrigger?: number;
}

export const CVImportHistory = memo(function CVImportHistory({ isAr, refreshTrigger }: Props) {
  const { data, isLoading: loading } = useCVImportHistory(isAr, refreshTrigger);
  const imports = data?.imports ?? [];
  const chefNames = data?.chefNames ?? {};

  const [expanded, setExpanded] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "completed" | "failed">("all");

  const sectionLabel = (s: string) => {
    const labels: Record<string, { en: string; ar: string }> = {
      personal: { en: "Personal", ar: "شخصي" },
      education: { en: "Education", ar: "تعليم" },
      work: { en: "Work", ar: "خبرات" },
      competitions: { en: "Competitions", ar: "مسابقات" },
      media: { en: "Media", ar: "إعلام" },
      certifications: { en: "Certifications", ar: "شهادات" },
    };
    return isAr ? (labels[s]?.ar || s) : (labels[s]?.en || s);
  };

  // Derived stats — no separate state needed
  const { totalImports, completedImports, totalRecords, uniqueChefs } = useMemo(() => ({
    totalImports: imports.length,
    completedImports: imports.filter(i => i.status === "completed").length,
    totalRecords: imports.reduce((sum, i) => sum + (i.records_created || 0), 0),
    uniqueChefs: new Set(imports.map(i => i.chef_id)).size,
  }), [imports]);

  // Derived filtered list — no separate state
  const filtered = useMemo(() => imports.filter(imp => {
    if (statusFilter !== "all" && imp.status !== statusFilter) return false;
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      const name = chefNames[imp.chef_id]?.toLowerCase() || "";
      return name.includes(q) || imp.chef_id.includes(q);
    }
    return true;
  }), [imports, statusFilter, searchFilter, chefNames]);

  const displayed = expanded ? filtered : filtered.slice(0, 5);

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2"><Skeleton className="h-5 w-40" /></CardHeader>
        <CardContent>
          <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
        </CardContent>
      </Card>
    );
  }

  if (imports.length === 0) return null;

  const handleExportHistory = () => {
    const rows = imports.map(imp => ({
      chef_name: chefNames[imp.chef_id] || imp.chef_id,
      status: imp.status,
      records_created: imp.records_created,
      sections: imp.sections_imported?.join(", "),
      input_method: imp.input_method,
      date: formatShortDateTime(imp.created_at, isAr),
    }));
    downloadCSV(rows, "cv-import-history", [
      { key: "chef_name", label: isAr ? "الشيف" : "Chef" },
      { key: "status", label: isAr ? "الحالة" : "Status" },
      { key: "records_created", label: isAr ? "السجلات" : "Records" },
      { key: "sections", label: isAr ? "الأقسام" : "Sections" },
      { key: "input_method", label: isAr ? "طريقة الإدخال" : "Input Method" },
      { key: "date", label: isAr ? "التاريخ" : "Date" },
    ]);
  };

  return (
    <Card className="border-muted">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <History className="h-4 w-4 text-muted-foreground" />
            {isAr ? `سجل الاستيراد` : `Import History`}
          </CardTitle>
          <div className="flex items-center gap-1.5">
            <Button variant="ghost" size="sm" onClick={handleExportHistory} className="text-xs h-7 gap-1">
              <Download className="h-3 w-3" /> {isAr ? "تصدير" : "Export"}
            </Button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-2 mt-2">
          {[
            { icon: <BarChart3 className="h-3.5 w-3.5" />, value: totalImports, label: isAr ? "إجمالي" : "Total" },
            { icon: <CheckCircle2 className="h-3.5 w-3.5 text-chart-2" />, value: completedImports, label: isAr ? "مكتمل" : "Completed" },
            { icon: <FileText className="h-3.5 w-3.5 text-primary" />, value: totalRecords, label: isAr ? "سجلات" : "Records" },
            { icon: <User className="h-3.5 w-3.5 text-chart-4" />, value: uniqueChefs, label: isAr ? "طهاة" : "Chefs" },
          ].map((stat, i) => (
            <div key={i} className="flex flex-col items-center p-2 rounded-xl bg-muted/30 border border-border/20">
              {stat.icon}
              <span className="text-sm font-bold mt-0.5">{stat.value}</span>
              <span className="text-xs text-muted-foreground">{stat.label}</span>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 mt-2">
          <div className="relative flex-1">
            <Search className="absolute start-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
            <Input
              className="ps-7 h-7 text-xs"
              placeholder={isAr ? "بحث بالاسم..." : "Search by name..."}
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
            />
          </div>
          <div className="flex gap-0.5">
            {(["all", "completed", "failed"] as const).map(s => (
              <Button
                key={s}
                variant={statusFilter === s ? "default" : "ghost"}
                size="sm"
                className="h-7 text-xs px-2"
                onClick={() => setStatusFilter(s)}
              >
                {s === "all" ? (isAr ? "الكل" : "All") : s === "completed" ? "✓" : "✗"}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {filtered.length === 0 ? (
          <p className="text-center text-xs text-muted-foreground py-4">{isAr ? "لا توجد نتائج" : "No results"}</p>
        ) : (
          <ScrollArea className={expanded ? "max-h-[400px]" : ""}>
            <div className="space-y-1.5">
              {displayed.map((imp) => (
                <div key={imp.id} className="flex items-center gap-3 p-2 rounded-xl border border-border/20 bg-muted/20 text-xs">
                  <FileText className="h-4 w-4 text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">
                        <User className="h-3 w-3 inline me-1" />
                        {chefNames[imp.chef_id] || imp.chef_id.slice(0, 8)}
                      </span>
                      <Badge
                        variant={imp.status === "completed" ? "default" : "destructive"}
                        className="text-xs h-4"
                      >
                        {imp.status === "completed" ? "✓" : "✗"}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                      <span className="text-muted-foreground flex items-center gap-0.5">
                        <Calendar className="h-2.5 w-2.5" />
                        {formatShortDateTime(imp.created_at, isAr)}
                      </span>
                      <span className="text-muted-foreground">•</span>
                      <span>{imp.records_created} {isAr ? "سجل" : "records"}</span>
                      {imp.sections_imported?.map(s => (
                        <Badge key={s} variant="outline" className="text-xs h-4">{sectionLabel(s)}</Badge>
                      ))}
                    </div>
                  </div>
                  {imp.extracted_data && (
                    <Button
                      variant="ghost" size="icon" className="h-6 w-6 shrink-0"
                      onClick={() => downloadJSON(imp.extracted_data, `cv-${chefNames[imp.chef_id] || imp.chef_id.slice(0, 8)}`)}
                      title={isAr ? "تحميل البيانات" : "Download data"}
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
        {filtered.length > 5 && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-2 text-xs gap-1"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            {expanded ? (isAr ? "عرض أقل" : "Show less") : (isAr ? `عرض الكل (${filtered.length})` : `Show all (${filtered.length})`)}
          </Button>
        )}
      </CardContent>
    </Card>
  );
});
