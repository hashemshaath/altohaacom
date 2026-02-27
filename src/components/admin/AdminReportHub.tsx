import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCSVExport } from "@/hooks/useCSVExport";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, FileText, Users, Package, Trophy, Building2, BarChart3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ReportOption {
  id: string;
  icon: typeof FileText;
  label: string;
  labelAr: string;
  description: string;
  descriptionAr: string;
  color: string;
}

const REPORTS: ReportOption[] = [
  { id: "users", icon: Users, label: "Users Report", labelAr: "تقرير المستخدمين", description: "All profiles with roles & status", descriptionAr: "جميع الملفات مع الأدوار والحالة", color: "text-primary" },
  { id: "orders", icon: Package, label: "Orders Report", labelAr: "تقرير الطلبات", description: "Company & shop orders summary", descriptionAr: "ملخص طلبات الشركات والمتجر", color: "text-chart-2" },
  { id: "competitions", icon: Trophy, label: "Competitions Report", labelAr: "تقرير المسابقات", description: "All competitions with registrations", descriptionAr: "جميع المسابقات مع التسجيلات", color: "text-chart-3" },
  { id: "companies", icon: Building2, label: "Companies Report", labelAr: "تقرير الشركات", description: "Active companies & contacts", descriptionAr: "الشركات النشطة وجهات الاتصال", color: "text-chart-4" },
  { id: "invoices", icon: FileText, label: "Invoices Report", labelAr: "تقرير الفواتير", description: "All invoices with payment status", descriptionAr: "جميع الفواتير مع حالة الدفع", color: "text-chart-5" },
  { id: "content", icon: BarChart3, label: "Content Report", labelAr: "تقرير المحتوى", description: "Articles, recipes & engagement", descriptionAr: "المقالات والوصفات والتفاعل", color: "text-destructive" },
];

export function AdminReportHub() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { toast } = useToast();

  const generateReport = async (reportId: string) => {
    toast({ title: isAr ? "جاري إنشاء التقرير..." : "Generating report..." });

    try {
      let rows: Record<string, unknown>[] = [];
      let filename = reportId;

      if (reportId === "users") {
        const { data } = await supabase.from("profiles").select("full_name, username, email, account_number, account_status, account_type, membership_tier, country_code, city, is_verified, created_at").order("created_at", { ascending: false }).limit(1000);
        rows = data || [];
        filename = "users_report";
      } else if (reportId === "orders") {
        const { data } = await supabase.from("company_orders").select("order_number, title, status, direction, category, total_amount, currency, order_date, created_at").order("created_at", { ascending: false }).limit(1000);
        rows = data || [];
        filename = "orders_report";
      } else if (reportId === "competitions") {
        const { data } = await supabase.from("competitions").select("title, competition_number, status, country_code, edition_year, registration_start, registration_end, competition_start, competition_end").order("created_at", { ascending: false }).limit(500);
        rows = data || [];
        filename = "competitions_report";
      } else if (reportId === "companies") {
        const { data } = await supabase.from("companies").select("name, company_number, type, status, country_code, city, email, phone, created_at").order("created_at", { ascending: false }).limit(1000);
        rows = data || [];
        filename = "companies_report";
      } else if (reportId === "invoices") {
        const { data } = await supabase.from("invoices").select("invoice_number, status, amount, currency, due_date, paid_at, created_at").order("created_at", { ascending: false }).limit(1000);
        rows = data || [];
        filename = "invoices_report";
      } else if (reportId === "content") {
        const { data } = await supabase.from("articles").select("title, type, status, view_count, published_at, created_at").order("created_at", { ascending: false }).limit(1000);
        rows = data || [];
        filename = "content_report";
      }

      if (rows.length === 0) {
        toast({ title: isAr ? "لا توجد بيانات للتصدير" : "No data to export" });
        return;
      }

      // Generate CSV with BOM for Excel Arabic support
      const headers = Object.keys(rows[0]);
      const bom = "\uFEFF";
      const csv = bom + [
        headers.join(","),
        ...rows.map(r => headers.map(h => {
          const val = String(r[h] ?? "");
          return val.includes(",") || val.includes('"') ? `"${val.replace(/"/g, '""')}"` : val;
        }).join(",")),
      ].join("\n");

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${filename}_${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);

      toast({ title: isAr ? "تم تصدير التقرير بنجاح" : "Report exported successfully" });
    } catch (err: any) {
      toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: err.message });
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Download className="h-4 w-4 text-primary" />
          {isAr ? "مركز التقارير السريعة" : "Quick Report Hub"}
          <Badge variant="secondary" className="ms-auto text-[10px]">
            {REPORTS.length} {isAr ? "تقارير" : "reports"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {REPORTS.map((r) => (
            <button
              key={r.id}
              onClick={() => generateReport(r.id)}
              className="flex flex-col items-center gap-1.5 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-center group"
            >
              <r.icon className={`h-5 w-5 ${r.color} group-hover:scale-110 transition-transform`} />
              <span className="text-xs font-medium">{isAr ? r.labelAr : r.label}</span>
              <span className="text-[9px] text-muted-foreground leading-tight">{isAr ? r.descriptionAr : r.description}</span>
              <Download className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
