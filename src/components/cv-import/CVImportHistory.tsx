import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  History, FileText, User, Calendar, ChevronDown, ChevronUp,
  Download, Search, BarChart3, CheckCircle2, XCircle, Filter,
} from "lucide-react";
import { downloadCSV, downloadJSON } from "@/lib/exportUtils";

interface CVImportRecord {
  id: string;
  chef_id: string;
  imported_by: string;
  status: string;
  file_name: string | null;
  input_method: string;
  sections_imported: string[];
  records_created: number;
  created_at: string;
  extracted_data: any;
}

interface Props {
  isAr: boolean;
  refreshTrigger?: number;
}

export function CVImportHistory({ isAr, refreshTrigger }: Props) {
  const [imports, setImports] = useState<CVImportRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [chefNames, setChefNames] = useState<Record<string, string>>({});
  const [searchFilter, setSearchFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "completed" | "failed">("all");

  useEffect(() => {
    loadHistory();
  }, [refreshTrigger]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("cv_imports")
        .select("id, chef_id, imported_by, status, file_name, input_method, sections_imported, records_created, created_at, extracted_data")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setImports(data || []);

      const chefIds = [...new Set((data || []).map(d => d.chef_id))];
      if (chefIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name, full_name_ar")
          .in("user_id", chefIds);

        if (profiles) {
          const names: Record<string, string> = {};
          profiles.forEach(p => {
            names[p.user_id] = isAr ? (p.full_name_ar || p.full_name || "—") : (p.full_name || "—");
          });
          setChefNames(names);
        }
      }
    } catch (err) {
      console.error("Failed to load import history:", err);
    }
    setLoading(false);
  };

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

  // Stats
  const totalImports = imports.length;
  const completedImports = imports.filter(i => i.status === "completed").length;
  const totalRecords = imports.reduce((sum, i) => sum + (i.records_created || 0), 0);
  const uniqueChefs = new Set(imports.map(i => i.chef_id)).size;

  // Filter
  const filtered = imports.filter(imp => {
    if (statusFilter !== "all" && imp.status !== statusFilter) return false;
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      const name = chefNames[imp.chef_id]?.toLowerCase() || "";
      return name.includes(q) || imp.chef_id.includes(q);
    }
    return true;
  });

  const displayed = expanded ? filtered : filtered.slice(0, 5);

  const handleExportHistory = () => {
    const rows = imports.map(imp => ({
      chef_name: chefNames[imp.chef_id] || imp.chef_id,
      status: imp.status,
      records_created: imp.records_created,
      sections: imp.sections_imported?.join(", "),
      input_method: imp.input_method,
      date: new Date(imp.created_at).toLocaleString(),
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
            <Button variant="ghost" size="sm" onClick={loadHistory} className="text-xs h-7">
              {isAr ? "تحديث" : "Refresh"}
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
              <span className="text-[9px] text-muted-foreground">{stat.label}</span>
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
                className="h-7 text-[10px] px-2"
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
                        className="text-[9px] h-4"
                      >
                        {imp.status === "completed" ? "✓" : "✗"}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                      <span className="text-muted-foreground flex items-center gap-0.5">
                        <Calendar className="h-2.5 w-2.5" />
                        {new Date(imp.created_at).toLocaleDateString(isAr ? "ar-SA" : "en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </span>
                      <span className="text-muted-foreground">•</span>
                      <span>{imp.records_created} {isAr ? "سجل" : "records"}</span>
                      {imp.sections_imported?.map(s => (
                        <Badge key={s} variant="outline" className="text-[9px] h-4">{sectionLabel(s)}</Badge>
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
}
