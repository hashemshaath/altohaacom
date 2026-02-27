import { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { useCSVExport } from "@/hooks/useCSVExport";
import { supabase } from "@/integrations/supabase/client";
import { FileDown, FileText, Users, Trophy, Building2, Ticket, Download } from "lucide-react";

const EXPORT_MODULES = [
  { key: "users", table: "profiles", icon: Users, label: "Users", labelAr: "المستخدمين", columns: ["full_name", "username", "email", "account_type", "account_status", "country_code", "city", "created_at"] },
  { key: "competitions", table: "competitions", icon: Trophy, label: "Competitions", labelAr: "المسابقات", columns: ["title", "status", "country_code", "city", "competition_start", "competition_end", "max_participants"] },
  { key: "companies", table: "companies", icon: Building2, label: "Companies", labelAr: "الشركات", columns: ["name", "type", "status", "country_code", "city", "created_at"] },
  { key: "tickets", table: "support_tickets", icon: Ticket, label: "Support Tickets", labelAr: "التذاكر", columns: ["ticket_number", "subject", "status", "priority", "created_at", "resolved_at"] },
] as const;

export function ScheduledExportWidget() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [selectedModule, setSelectedModule] = useState<string>("users");
  const [format, setFormat] = useState<"csv" | "json">("csv");
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    const mod = EXPORT_MODULES.find(m => m.key === selectedModule);
    if (!mod) return;

    setExporting(true);
    try {
      const { data, error } = await supabase
        .from(mod.table)
        .select(mod.columns.join(","))
        .order("created_at", { ascending: false })
        .limit(5000);

      if (error) throw error;

      if (format === "json") {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${mod.key}_export_${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        // CSV with BOM for Arabic
        const headers = mod.columns.join(",");
        const rows = (data || []).map((row: any) => mod.columns.map(c => `"${String(row[c] ?? "").replace(/"/g, '""')}"`).join(","));
        const csv = "\uFEFF" + headers + "\n" + rows.join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${mod.key}_export_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      }

      toast({ title: isAr ? "تم التصدير بنجاح" : "Export completed successfully" });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Export failed", description: err.message });
    } finally {
      setExporting(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <FileDown className="h-4 w-4 text-primary" />
          {isAr ? "تصدير سريع للبيانات" : "Quick Data Export"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">{isAr ? "الوحدة" : "Module"}</label>
            <Select value={selectedModule} onValueChange={setSelectedModule}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EXPORT_MODULES.map(m => (
                  <SelectItem key={m.key} value={m.key}>
                    <span className="flex items-center gap-1.5">
                      <m.icon className="h-3 w-3" />
                      {isAr ? m.labelAr : m.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">{isAr ? "الصيغة" : "Format"}</label>
            <Select value={format} onValueChange={(v: "csv" | "json") => setFormat(v)}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">CSV</SelectItem>
                <SelectItem value="json">JSON</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Export columns preview */}
        <div className="flex flex-wrap gap-1">
          {EXPORT_MODULES.find(m => m.key === selectedModule)?.columns.map(col => (
            <Badge key={col} variant="outline" className="text-[9px] px-1.5 py-0">{col}</Badge>
          ))}
        </div>

        <Button onClick={handleExport} disabled={exporting} size="sm" className="w-full gap-2">
          <Download className="h-3.5 w-3.5" />
          {exporting ? (isAr ? "جاري التصدير..." : "Exporting...") : (isAr ? "تصدير الآن" : "Export Now")}
        </Button>
      </CardContent>
    </Card>
  );
}
