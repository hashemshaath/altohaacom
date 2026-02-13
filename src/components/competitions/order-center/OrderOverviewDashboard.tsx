import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  ClipboardList, Package, CheckCircle, Clock, AlertTriangle,
  Send, Lightbulb, Printer, TrendingUp,
} from "lucide-react";

interface Props {
  competitionId: string;
  isOrganizer?: boolean;
}

export function OrderOverviewDashboard({ competitionId, isOrganizer }: Props) {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data: lists } = useQuery({
    queryKey: ["order-overview-lists", competitionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("requirement_lists")
        .select("id, title, title_ar, category, status")
        .eq("competition_id", competitionId);
      if (error) throw error;
      return data;
    },
  });

  const { data: allItems } = useQuery({
    queryKey: ["order-overview-items", competitionId],
    queryFn: async () => {
      if (!lists?.length) return [];
      const { data, error } = await supabase
        .from("requirement_list_items")
        .select("id, status, estimated_cost, quantity, deadline, checked")
        .in("list_id", lists.map(l => l.id));
      if (error) throw error;
      return data;
    },
    enabled: !!lists?.length,
  });

  const { data: quoteRequests } = useQuery({
    queryKey: ["order-overview-quotes", competitionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("requirement_sponsorship_requests")
        .select("id, status, total_estimated_cost")
        .eq("competition_id", competitionId);
      if (error) throw error;
      return data;
    },
  });

  const { data: suggestions } = useQuery({
    queryKey: ["order-overview-suggestions", competitionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("requirement_suggestions")
        .select("id, status")
        .eq("competition_id", competitionId);
      if (error) throw error;
      return data;
    },
  });

  const totalItems = allItems?.length || 0;
  const delivered = allItems?.filter(i => i.status === "delivered").length || 0;
  const pending = allItems?.filter(i => !i.status || i.status === "pending").length || 0;
  const overdue = allItems?.filter(i => i.deadline && new Date(i.deadline) < new Date() && i.status !== "delivered").length || 0;
  const totalCost = allItems?.reduce((sum, i) => sum + (Number(i.estimated_cost) || 0) * (i.quantity || 1), 0) || 0;
  const deliveredCost = allItems?.filter(i => i.status === "delivered").reduce((sum, i) => sum + (Number(i.estimated_cost) || 0) * (i.quantity || 1), 0) || 0;
  const deliveryProgress = totalItems > 0 ? Math.round((delivered / totalItems) * 100) : 0;

  const pendingQuotes = quoteRequests?.filter(q => q.status === "pending").length || 0;
  const acceptedQuotes = quoteRequests?.filter(q => q.status === "accepted").length || 0;
  const pendingSuggestions = suggestions?.filter(s => s.status === "pending").length || 0;

  const handlePrint = () => {
    const printContent = document.getElementById("order-overview-print");
    if (!printContent) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <html dir="${isAr ? "rtl" : "ltr"}">
      <head>
        <title>${isAr ? "ملخص الطلبات" : "Order Summary"}</title>
        <style>
          body { font-family: system-ui, sans-serif; padding: 2rem; color: #1a1a1a; }
          h1 { font-size: 1.5rem; margin-bottom: 1rem; }
          .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 2rem; }
          .stat { border: 1px solid #e5e5e5; border-radius: 8px; padding: 1rem; text-align: center; }
          .stat-value { font-size: 1.5rem; font-weight: bold; }
          .stat-label { font-size: 0.75rem; color: #666; text-transform: uppercase; }
          table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: ${isAr ? "right" : "left"}; font-size: 0.875rem; }
          th { background: #f5f5f5; font-weight: 600; }
          .footer { margin-top: 2rem; font-size: 0.75rem; color: #999; }
        </style>
      </head>
      <body>
        <h1>${isAr ? "ملخص طلبات المسابقة" : "Competition Order Summary"}</h1>
        <div class="stats">
          <div class="stat"><div class="stat-value">${lists?.length || 0}</div><div class="stat-label">${isAr ? "القوائم" : "Lists"}</div></div>
          <div class="stat"><div class="stat-value">${totalItems}</div><div class="stat-label">${isAr ? "العناصر" : "Items"}</div></div>
          <div class="stat"><div class="stat-value">${delivered}</div><div class="stat-label">${isAr ? "تم التسليم" : "Delivered"}</div></div>
          <div class="stat"><div class="stat-value">$${totalCost.toLocaleString()}</div><div class="stat-label">${isAr ? "التكلفة" : "Est. Cost"}</div></div>
        </div>
        <h2>${isAr ? "القوائم" : "Requirement Lists"}</h2>
        <table>
          <thead><tr><th>${isAr ? "القائمة" : "List"}</th><th>${isAr ? "الفئة" : "Category"}</th><th>${isAr ? "الحالة" : "Status"}</th></tr></thead>
          <tbody>${lists?.map(l => `<tr><td>${isAr && l.title_ar ? l.title_ar : l.title}</td><td>${l.category}</td><td>${l.status}</td></tr>`).join("") || ""}</tbody>
        </table>
        <div class="footer">${isAr ? "تم الإنشاء" : "Generated"}: ${new Date().toLocaleDateString()} · Altohaa Platform</div>
      </body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="space-y-6" id="order-overview-print">
      {/* Header with Print */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{isAr ? "نظرة عامة على الطلبات" : "Orders Overview"}</h3>
          <p className="text-xs text-muted-foreground">
            {isAr ? "ملخص شامل لحالة جميع المتطلبات والتجهيزات" : "Comprehensive summary of all requirements & supplies"}
          </p>
        </div>
        {isOrganizer && (
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="me-1.5 h-3.5 w-3.5" />
            {isAr ? "طباعة التقرير" : "Print Report"}
          </Button>
        )}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="border-border/60">
          <CardContent className="p-3 text-center">
            <ClipboardList className="mx-auto mb-1 h-5 w-5 text-primary" />
            <p className="text-xl font-bold">{lists?.length || 0}</p>
            <p className="text-[10px] text-muted-foreground uppercase">{isAr ? "القوائم" : "Lists"}</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-3 text-center">
            <Package className="mx-auto mb-1 h-5 w-5 text-chart-1" />
            <p className="text-xl font-bold">{totalItems}</p>
            <p className="text-[10px] text-muted-foreground uppercase">{isAr ? "العناصر" : "Items"}</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-3 text-center">
            <CheckCircle className="mx-auto mb-1 h-5 w-5 text-chart-5" />
            <p className="text-xl font-bold">{delivered}</p>
            <p className="text-[10px] text-muted-foreground uppercase">{isAr ? "تم التسليم" : "Delivered"}</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-3 text-center">
            <TrendingUp className="mx-auto mb-1 h-5 w-5 text-chart-4" />
            <p className="text-xl font-bold">${totalCost.toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground uppercase">{isAr ? "التكلفة التقديرية" : "Est. Cost"}</p>
          </CardContent>
        </Card>
      </div>

      {/* Delivery Progress */}
      <Card className="border-border/60">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium">{isAr ? "تقدم التسليم الإجمالي" : "Overall Delivery Progress"}</p>
            <p className="text-sm font-bold text-primary">{deliveryProgress}%</p>
          </div>
          <Progress value={deliveryProgress} className="h-2.5" />
          <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
            <span>{delivered}/{totalItems} {isAr ? "مكتمل" : "complete"}</span>
            <span>${deliveredCost.toLocaleString()} / ${totalCost.toLocaleString()}</span>
          </div>
        </CardContent>
      </Card>

      {/* Status Breakdown */}
      <div className="grid gap-3 sm:grid-cols-3">
        {/* Pending Items */}
        <Card className="border-border/60">
          <CardHeader className="pb-2 px-4 pt-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              {isAr ? "قيد الانتظار" : "Pending"}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <p className="text-2xl font-bold">{pending}</p>
            {overdue > 0 && (
              <div className="flex items-center gap-1 mt-1">
                <AlertTriangle className="h-3 w-3 text-destructive" />
                <span className="text-xs text-destructive font-medium">
                  {overdue} {isAr ? "متأخرة" : "overdue"}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quote Requests */}
        <Card className="border-border/60">
          <CardHeader className="pb-2 px-4 pt-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Send className="h-4 w-4 text-chart-1" />
              {isAr ? "طلبات الأسعار" : "Quote Requests"}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <p className="text-2xl font-bold">{quoteRequests?.length || 0}</p>
            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
              {pendingQuotes > 0 && <Badge variant="outline" className="text-[10px]">{pendingQuotes} {isAr ? "معلق" : "pending"}</Badge>}
              {acceptedQuotes > 0 && <Badge variant="outline" className="text-[10px] border-chart-5/30 text-chart-5">{acceptedQuotes} {isAr ? "مقبول" : "accepted"}</Badge>}
            </div>
          </CardContent>
        </Card>

        {/* Suggestions */}
        <Card className="border-border/60">
          <CardHeader className="pb-2 px-4 pt-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-chart-4" />
              {isAr ? "الاقتراحات" : "Suggestions"}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <p className="text-2xl font-bold">{suggestions?.length || 0}</p>
            {pendingSuggestions > 0 && (
              <Badge variant="secondary" className="text-[10px] mt-1">
                {pendingSuggestions} {isAr ? "بانتظار المراجعة" : "awaiting review"}
              </Badge>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
