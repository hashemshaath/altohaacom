import { useState, memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, FileSpreadsheet, FileText, Database, Users, Building2, Trophy, Ticket, TrendingUp, Clock } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface ExportModule {
  key: string;
  label: string;
  labelAr: string;
  icon: any;
  table: string;
  columns: string;
}

const EXPORT_MODULES: ExportModule[] = [
  { key: "users", label: "Users", labelAr: "المستخدمون", icon: Users, table: "profiles", columns: "user_id, username, full_name, full_name_ar, email, phone, country_code, account_type, created_at" },
  { key: "companies", label: "Companies", labelAr: "الشركات", icon: Building2, table: "companies", columns: "id, name, name_ar, type, status, country_code, is_verified, created_at" },
  { key: "competitions", label: "Competitions", labelAr: "المسابقات", icon: Trophy, table: "competitions", columns: "id, title, title_ar, status, country_code, edition_year, created_at" },
  { key: "exhibitions", label: "Exhibitions", labelAr: "المعارض", icon: Ticket, table: "exhibitions", columns: "id, title, title_ar, status, start_date, end_date, venue, country_code" },
  { key: "orders", label: "Orders", labelAr: "الطلبات", icon: FileSpreadsheet, table: "company_orders", columns: "id, order_number, status, total_amount, currency, created_at" },
  { key: "invoices", label: "Invoices", labelAr: "الفواتير", icon: FileText, table: "invoices", columns: "id, invoice_number, status, amount, currency, created_at" },
];

export const AdvancedExportWidget = memo(function AdvancedExportWidget() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [selectedModule, setSelectedModule] = useState("users");
  const [exporting, setExporting] = useState(false);
  const { toast } = useToast();

  // Get record counts for all modules
  const { data: counts } = useQuery({
    queryKey: ["exportModuleCounts"],
    queryFn: async () => {
      const results: Record<string, number> = {};
      await Promise.all(
        EXPORT_MODULES.map(async (m) => {
          const { count } = await supabase.from(m.table as any).select("*", { count: "exact", head: true });
          results[m.key] = count || 0;
        })
      );
      return results;
    },
    refetchInterval: 120000,
  });

  const chartData = EXPORT_MODULES.map(m => ({
    name: isAr ? m.labelAr : m.label,
    count: counts?.[m.key] || 0,
  }));

  const handleExport = async (moduleKey: string, fmt: "csv" | "json") => {
    setExporting(true);
    try {
      const mod = EXPORT_MODULES.find(m => m.key === moduleKey)!;
      const { data } = await supabase.from(mod.table as any).select(mod.columns);
      if (!data || data.length === 0) {
        setExporting(false);
        return;
      }

      if (fmt === "csv") {
        const headers = Object.keys(data[0] as object);
        const csvContent = "\uFEFF" + headers.join(",") + "\n" + data.map(row => headers.map(h => `"${String((row as any)[h] ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${moduleKey}_export_${format(new Date(), "yyyy-MM-dd")}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast({ title: isAr ? "تم التصدير" : "Exported", description: `${data.length} records` });
      } else {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${moduleKey}_export_${format(new Date(), "yyyy-MM-dd")}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } finally {
      setExporting(false);
    }
  };

  const currentModule = EXPORT_MODULES.find(m => m.key === selectedModule)!;
  const currentCount = counts?.[selectedModule] || 0;

  return (
    <Card className="mb-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Download className="h-4 w-4 text-primary" />
          {isAr ? "مركز التصدير والتقارير المتقدم" : "Advanced Export & Reports Center"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Data Overview Chart */}
        <div className="mb-4">
          <p className="text-xs font-medium mb-2 text-muted-foreground">
            {isAr ? "حجم البيانات حسب الوحدة" : "Data Volume by Module"}
          </p>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={chartData} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 9 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} width={70} />
              <Tooltip contentStyle={{ fontSize: 11 }} />
              <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Quick Export */}
        <div className="bg-muted/50 rounded-xl p-4">
          <p className="text-xs font-medium mb-3">{isAr ? "تصدير سريع" : "Quick Export"}</p>
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
            <div className="flex-1 w-full">
              <Select value={selectedModule} onValueChange={setSelectedModule}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXPORT_MODULES.map(m => (
                    <SelectItem key={m.key} value={m.key}>
                      <span className="flex items-center gap-2">
                        <m.icon className="h-3 w-3" />
                        {isAr ? m.labelAr : m.label}
                        <Badge variant="secondary" className="text-[9px] px-1 py-0 ms-1">{counts?.[m.key] || 0}</Badge>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="h-9 gap-1 text-xs" disabled={exporting || currentCount === 0} onClick={() => handleExport(selectedModule, "csv")}>
                <FileSpreadsheet className="h-3 w-3" />
                CSV
              </Button>
              <Button size="sm" variant="outline" className="h-9 gap-1 text-xs" disabled={exporting || currentCount === 0} onClick={() => handleExport(selectedModule, "json")}>
                <FileText className="h-3 w-3" />
                JSON
              </Button>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">
            {isAr ? `${currentCount} سجل جاهز للتصدير` : `${currentCount} records ready for export`}
          </p>
        </div>

        {/* Module Stats Grid */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mt-4">
          {EXPORT_MODULES.map(m => (
            <div key={m.key} className="bg-muted/30 rounded-xl p-2 text-center cursor-pointer hover:bg-muted/60 transition-colors" onClick={() => setSelectedModule(m.key)}>
              <m.icon className={`h-3.5 w-3.5 mx-auto mb-1 ${selectedModule === m.key ? "text-primary" : "text-muted-foreground"}`} />
              <div className="text-xs font-bold">{counts?.[m.key] || 0}</div>
              <div className="text-[8px] text-muted-foreground">{isAr ? m.labelAr : m.label}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
});
