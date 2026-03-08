import { useMemo, memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  ClipboardList, Package, CheckCircle, Clock, AlertTriangle,
  Send, Lightbulb, Printer, TrendingUp, FileInput, Download,
} from "lucide-react";
import { formatCurrency } from "@/lib/currencyFormatter";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { format, isPast, differenceInDays } from "date-fns";
import { calcOrderStats, getItemDisplayName } from "./orderCenterUtils";
import { OrderExportActions } from "./OrderExportActions";
import { DashboardSkeleton } from "./OrderSkeletonCards";
import { OrderEmptyState } from "./OrderEmptyState";

interface Props {
  competitionId: string;
  isOrganizer?: boolean;
}

export const OrderOverviewDashboard = memo(function OrderOverviewDashboard({ competitionId, isOrganizer }: Props) {
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
    staleTime: 2 * 60 * 1000,
  });

  const { data: allItems, isLoading: itemsLoading } = useQuery({
    queryKey: ["order-overview-items", competitionId],
    queryFn: async () => {
      if (!lists?.length) return [];
      const { data, error } = await supabase
        .from("requirement_list_items")
        .select("id, status, estimated_cost, quantity, deadline, checked, custom_name, custom_name_ar, item_id, requirement_items(name, name_ar)")
        .in("list_id", lists.map(l => l.id));
      if (error) throw error;
      return data;
    },
    enabled: !!lists?.length,
    staleTime: 60 * 1000,
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
    staleTime: 2 * 60 * 1000,
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
    staleTime: 2 * 60 * 1000,
  });

  const { data: itemRequests } = useQuery({
    queryKey: ["order-overview-requests", competitionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("order_item_requests")
        .select("id, status")
        .eq("competition_id", competitionId);
      if (error) throw error;
      return data;
    },
    staleTime: 2 * 60 * 1000,
  });

  const stats = useMemo(() => calcOrderStats(allItems || []), [allItems]);
  const { totalCost, deliveredCost, pendingQuotes, acceptedQuotes, pendingSuggestions, pendingItemRequests, totalItemRequests, upcomingDeadlines, overdueItems, inTransit, ordered, sourcing } = useMemo(() => {
    const items = allItems || [];
    return {
      totalCost: items.reduce((sum, i) => sum + (Number(i.estimated_cost) || 0) * (i.quantity || 1), 0),
      deliveredCost: items.filter(i => i.status === "delivered").reduce((sum, i) => sum + (Number(i.estimated_cost) || 0) * (i.quantity || 1), 0),
      pendingQuotes: quoteRequests?.filter(q => q.status === "pending").length || 0,
      acceptedQuotes: quoteRequests?.filter(q => q.status === "accepted").length || 0,
      pendingSuggestions: suggestions?.filter(s => s.status === "pending").length || 0,
      pendingItemRequests: itemRequests?.filter(r => r.status === "pending").length || 0,
      totalItemRequests: itemRequests?.length || 0,
      upcomingDeadlines: items
        .filter(i => i.deadline && i.status !== "delivered" && !isPast(new Date(i.deadline)))
        .filter(i => differenceInDays(new Date(i.deadline!), new Date()) <= 7)
        .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())
        .slice(0, 5),
      overdueItems: items
        .filter(i => i.deadline && isPast(new Date(i.deadline)) && i.status !== "delivered")
        .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())
        .slice(0, 5),
      inTransit: items.filter(i => i.status === "in_transit").length,
      ordered: items.filter(i => i.status === "ordered").length,
      sourcing: items.filter(i => i.status === "sourcing").length,
    };
  }, [allItems, quoteRequests, suggestions, itemRequests]);

  const pipeline = [
    { labelEn: "Pending", labelAr: "انتظار", count: stats.pending, color: "bg-muted text-muted-foreground" },
    { labelEn: "Sourcing", labelAr: "بحث", count: sourcing, color: "bg-chart-4/10 text-chart-4" },
    { labelEn: "Ordered", labelAr: "طُلب", count: ordered, color: "bg-chart-1/10 text-chart-1" },
    { labelEn: "In Transit", labelAr: "شحن", count: inTransit, color: "bg-chart-3/10 text-chart-3" },
    { labelEn: "Delivered", labelAr: "تسليم", count: stats.delivered, color: "bg-chart-5/10 text-chart-5" },
  ];

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    const dir = isAr ? "rtl" : "ltr";
    const align = isAr ? "right" : "left";

    // Build full items table rows
    const itemRows = (allItems || []).map(item => {
      const name = getItemDisplayName(item, isAr);
      const status = item.status || "pending";
      const qty = item.quantity || 1;
      const cost = Number(item.estimated_cost) || 0;
      const deadline = item.deadline ? format(new Date(item.deadline), "MMM d, yyyy") : "—";
      const isOverdue = item.deadline && isPast(new Date(item.deadline)) && status !== "delivered";
      return `<tr${isOverdue ? ' style="background:#fff5f5;"' : ""}>
        <td>${name}</td>
        <td><span class="badge ${status === "delivered" ? "bg-green" : status === "pending" ? "bg-gray" : "bg-blue"}">${status}</span></td>
        <td>${qty}</td>
        <td>${formatCurrency(cost * qty, language as "en" | "ar")}</td>
        <td${isOverdue ? ' style="color:#dc2626;font-weight:600;"' : ""}>${deadline}</td>
      </tr>`;
    }).join("");

    printWindow.document.write(`
      <html dir="${dir}"><head><title>${isAr ? "ملخص الطلبات" : "Order Summary"}</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 2rem; color: #1a1a1a; max-width: 1000px; margin: 0 auto; }
        h1 { font-size: 1.4rem; margin-bottom: 0.25rem; }
        .subtitle { font-size: 0.75rem; color: #666; margin-bottom: 1.5rem; }
        .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.75rem; margin-bottom: 1.5rem; }
        .stat { border: 1px solid #e5e5e5; border-radius: 8px; padding: 0.75rem; text-align: center; }
        .stat-value { font-size: 1.3rem; font-weight: 700; }
        .stat-label { font-size: 0.65rem; color: #888; text-transform: uppercase; letter-spacing: 0.5px; }
        table { width: 100%; border-collapse: collapse; margin-top: 1rem; font-size: 0.8rem; }
        th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: ${align}; }
        th { background: #f5f5f5; font-weight: 600; font-size: 0.7rem; text-transform: uppercase; }
        tr:nth-child(even) { background: #fafafa; }
        .section-title { font-size: 0.9rem; font-weight: 600; margin-top: 1.5rem; margin-bottom: 0.5rem; border-bottom: 2px solid #e5e5e5; padding-bottom: 4px; }
        .footer { margin-top: 2rem; font-size: 0.65rem; color: #999; text-align: center; border-top: 1px solid #eee; padding-top: 0.75rem; }
        .alert { background: #fff3cd; border: 1px solid #ffc107; border-radius: 6px; padding: 0.5rem 0.75rem; font-size: 0.75rem; margin-bottom: 1rem; }
        .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 500; }
        .bg-green { background: #dcfce7; color: #166534; }
        .bg-gray { background: #f3f4f6; color: #4b5563; }
        .bg-blue { background: #dbeafe; color: #1e40af; }
        .pipeline { display: flex; gap: 4px; margin: 1rem 0; }
        .pipeline-stage { flex: 1; text-align: center; padding: 6px; border-radius: 6px; font-size: 11px; }
        @media print { body { padding: 1rem; } @page { size: landscape; margin: 1.5cm; } }
      </style></head><body>
        <h1>${isAr ? "ملخص طلبات المسابقة" : "Competition Order Summary"}</h1>
        <p class="subtitle">${isAr ? "تم الإنشاء" : "Generated"}: ${format(new Date(), "PPP p")}</p>
        ${stats.overdue > 0 ? `<div class="alert">⚠️ ${stats.overdue} ${isAr ? "عناصر متأخرة تحتاج اهتمام" : "overdue items need attention"}</div>` : ""}
        <div class="stats">
          <div class="stat"><div class="stat-value">${lists?.length || 0}</div><div class="stat-label">${isAr ? "القوائم" : "Lists"}</div></div>
          <div class="stat"><div class="stat-value">${stats.total}</div><div class="stat-label">${isAr ? "العناصر" : "Items"}</div></div>
          <div class="stat"><div class="stat-value">${stats.delivered}</div><div class="stat-label">${isAr ? "تم التسليم" : "Delivered"}</div></div>
          <div class="stat"><div class="stat-value">${formatCurrency(totalCost, language as "en" | "ar").replace(/\s+/g, '')}</div><div class="stat-label">${isAr ? "التكلفة" : "Est. Cost"}</div></div>
        </div>
        <div class="section-title">${isAr ? "مراحل التجهيز" : "Fulfillment Pipeline"}</div>
        <div class="pipeline">
          ${pipeline.map(s => `<div class="pipeline-stage" style="background:${s.count > 0 ? '#e0f2fe' : '#f9fafb'};">
            <div style="font-weight:700;font-size:14px;">${s.count}</div>
            <div style="font-size:10px;color:#666;">${isAr ? s.labelAr : s.labelEn}</div>
          </div>`).join("")}
        </div>
        <div class="section-title">${isAr ? "تفاصيل العناصر" : "Item Details"} (${stats.total})</div>
        <table>
          <thead><tr><th>${isAr ? "العنصر" : "Item"}</th><th>${isAr ? "الحالة" : "Status"}</th><th>${isAr ? "الكمية" : "Qty"}</th><th>${isAr ? "التكلفة" : "Cost"}</th><th>${isAr ? "الموعد" : "Deadline"}</th></tr></thead>
          <tbody>${itemRows}</tbody>
        </table>
        <div class="section-title">${isAr ? "القوائم" : "Requirement Lists"}</div>
        <table>
          <thead><tr><th>${isAr ? "القائمة" : "List"}</th><th>${isAr ? "الفئة" : "Category"}</th><th>${isAr ? "الحالة" : "Status"}</th></tr></thead>
          <tbody>${lists?.map(l => `<tr><td>${isAr && l.title_ar ? l.title_ar : l.title}</td><td>${l.category}</td><td>${l.status}</td></tr>`).join("") || ""}</tbody>
        </table>
        <div class="footer">Altoha Platform · ${format(new Date(), "PPP p")}</div>
      </body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  // Export data for CSV
  const exportData = (allItems || []).map(item => ({
    name: getItemDisplayName(item, false),
    name_ar: getItemDisplayName(item, true),
    status: item.status || "pending",
    quantity: item.quantity || 1,
    estimated_cost: item.estimated_cost || 0,
    deadline: item.deadline || "",
  }));

  const exportColumns = [
    { key: "name", label: "Item Name" },
    { key: "name_ar", label: "اسم العنصر" },
    { key: "status", label: "Status" },
    { key: "quantity", label: "Quantity" },
    { key: "estimated_cost", label: "Est. Cost" },
    { key: "deadline", label: "Deadline" },
  ];

  if (itemsLoading) {
    return <DashboardSkeleton />;
  }

  if (!lists?.length) {
    return <OrderEmptyState type="lists" />;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{isAr ? "نظرة عامة على الطلبات" : "Orders Overview"}</h3>
          <p className="text-xs text-muted-foreground">
            {isAr ? "ملخص شامل لحالة جميع المتطلبات" : "Comprehensive summary of all requirements & supplies"}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          {isOrganizer && exportData.length > 0 && (
            <OrderExportActions
              data={exportData}
              filename={`order-summary-${competitionId.slice(0, 8)}`}
              columns={exportColumns}
            />
          )}
          {isOrganizer && (
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="me-1.5 h-3.5 w-3.5" />
              {isAr ? "طباعة" : "Print"}
            </Button>
          )}
        </div>
      </div>

      {/* Overdue Alert */}
      {overdueItems.length > 0 && (
        <Card className="border-destructive/30 bg-destructive/5 animate-in fade-in slide-in-from-top-2 duration-300">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-destructive animate-pulse" />
              <p className="text-sm font-semibold text-destructive">
                {overdueItems.length} {isAr ? "عناصر متأخرة" : "Overdue Items"}
              </p>
            </div>
            <div className="space-y-1">
              {overdueItems.map((item, idx) => (
                <div key={item.id} className="flex items-center justify-between text-xs animate-in fade-in slide-in-from-left-2" style={{ animationDelay: `${idx * 50}ms` }}>
                  <span className="truncate">{getItemDisplayName(item, isAr)}</span>
                  <Badge variant="destructive" className="text-[9px] shrink-0">
                    {format(new Date(item.deadline!), "MMM d")}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
        <MetricCard icon={ClipboardList} value={lists?.length || 0} label={isAr ? "القوائم" : "Lists"} iconColor="text-primary" trend={lists?.filter(l => l.status === "active").length || 0} trendLabel={isAr ? "نشطة" : "active"} />
        <MetricCard icon={Package} value={stats.total} label={isAr ? "العناصر" : "Items"} iconColor="text-chart-1" />
        <MetricCard icon={CheckCircle} value={stats.delivered} label={isAr ? "تسليم" : "Delivered"} iconColor="text-chart-5" trend={stats.progress} trendLabel="%" trendPositive />
        <MetricCard icon={TrendingUp} value={formatCurrency(totalCost, language as "en" | "ar")} label={isAr ? "التكلفة" : "Est. Cost"} iconColor="text-chart-4" isValueString />
      </div>

      {/* Pipeline */}
      <Card className="border-border/60 overflow-hidden">
        <CardContent className="p-3 sm:p-4">
          <p className="text-sm font-medium mb-3">{isAr ? "مراحل التجهيز" : "Fulfillment Pipeline"}</p>
          <div className="flex items-center gap-1">
            {pipeline.map((stage) => {
              const width = stats.total > 0 ? Math.max((stage.count / stats.total) * 100, stage.count > 0 ? 8 : 2) : 20;
              return (
                <div key={stage.labelEn} className="flex flex-col items-center" style={{ width: `${width}%`, minWidth: "36px" }}>
                  <div className={`w-full h-2.5 rounded-full ${stage.color.split(" ")[0]} transition-all duration-500`} />
                  <span className="text-[10px] font-bold mt-1.5">{stage.count}</span>
                  <span className="text-[9px] text-muted-foreground">{isAr ? stage.labelAr : stage.labelEn}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Delivery Progress */}
      <Card className="border-border/60">
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium">{isAr ? "تقدم التسليم" : "Delivery Progress"}</p>
            <div className="flex items-center gap-1.5">
              {stats.overdue > 0 && (
                <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                  <AlertTriangle className="me-0.5 h-3 w-3" />
                  {stats.overdue} {isAr ? "متأخرة" : "overdue"}
                </Badge>
              )}
              <span className="text-sm font-bold text-primary">{stats.progress}%</span>
            </div>
          </div>
          <Progress value={stats.progress} className="h-2.5" />
          <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
            <span>{stats.delivered}/{stats.total} {isAr ? "مكتمل" : "complete"}</span>
            <span>{formatCurrency(deliveredCost, language as "en" | "ar")} / {formatCurrency(totalCost, language as "en" | "ar")}</span>
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Deadlines */}
      {upcomingDeadlines.length > 0 && (
        <Card className="border-chart-4/30 bg-chart-4/5">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-chart-4" />
              <p className="text-sm font-semibold">{isAr ? "مواعيد قادمة" : "Upcoming Deadlines"}</p>
            </div>
            <div className="space-y-1">
              {upcomingDeadlines.map((item) => {
                const daysLeft = differenceInDays(new Date(item.deadline!), new Date());
                return (
                  <div key={item.id} className="flex items-center justify-between text-xs">
                    <span className="truncate">{getItemDisplayName(item, isAr)}</span>
                    <Badge variant="outline" className={`text-[9px] shrink-0 ${daysLeft <= 2 ? "border-destructive/50 text-destructive" : ""}`}>
                      {daysLeft === 0 ? (isAr ? "اليوم" : "Today") : `${daysLeft}d`}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status Cards */}
      <div className="grid gap-2 sm:gap-3 grid-cols-2 lg:grid-cols-4">
        <StatusCard icon={Clock} iconColor="text-muted-foreground" label={isAr ? "قيد الانتظار" : "Pending"} value={stats.pending} />
        <StatusCard icon={FileInput} iconColor="text-chart-3" label={isAr ? "طلبات العناصر" : "Item Requests"} value={totalItemRequests} badge={pendingItemRequests > 0 ? `${pendingItemRequests} ${isAr ? "بانتظار" : "pending"}` : undefined} />
        <StatusCard icon={Send} iconColor="text-chart-1" label={isAr ? "طلبات الأسعار" : "Quotes"} value={quoteRequests?.length || 0} badge={pendingQuotes > 0 ? `${pendingQuotes} ${isAr ? "معلق" : "pending"}` : undefined} />
        <StatusCard icon={Lightbulb} iconColor="text-chart-4" label={isAr ? "الاقتراحات" : "Suggestions"} value={suggestions?.length || 0} badge={pendingSuggestions > 0 ? `${pendingSuggestions} ${isAr ? "جديد" : "new"}` : undefined} />
      </div>
    </div>
  );
});

function MetricCard({ icon: Icon, value, label, iconColor, trend, trendLabel, trendPositive, isValueString }: {
  icon: any; value: number | string; label: string; iconColor: string;
  trend?: number; trendLabel?: string; trendPositive?: boolean; isValueString?: boolean;
}) {
  return (
    <Card className="border-border/60 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]">
      <CardContent className="p-3 text-center">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted/50 mx-auto mb-1.5">
          <Icon className={`h-4.5 w-4.5 ${iconColor}`} />
        </div>
        <p className={`font-bold ${isValueString ? "text-base" : "text-xl"}`}>{typeof value === "number" ? <AnimatedCounter value={value} /> : value}</p>
        <p className="text-[10px] text-muted-foreground uppercase">{label}</p>
        {trend !== undefined && trendLabel && (
          <p className={`text-[10px] mt-0.5 font-medium ${trendPositive ? "text-chart-5" : "text-muted-foreground"}`}>
            {trend} {trendLabel}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function StatusCard({ icon: Icon, iconColor, label, value, badge }: {
  icon: any; iconColor: string; label: string; value: number; badge?: string;
}) {
  return (
    <Card className="border-border/60 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]">
      <CardContent className="p-3">
        <div className="flex items-center gap-2 mb-1">
          <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-muted/50">
            <Icon className={`h-3.5 w-3.5 ${iconColor}`} />
          </div>
          <span className="text-xs font-medium truncate">{label}</span>
        </div>
        <p className="text-2xl font-bold">{typeof value === "number" ? <AnimatedCounter value={value} /> : value}</p>
        {badge && <Badge variant="secondary" className="text-[10px] mt-1 animate-in fade-in">{badge}</Badge>}
      </CardContent>
    </Card>
  );
});
