import { useState, useMemo, memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Download, Calendar, TrendingUp, DollarSign, BarChart3, Target } from "lucide-react";
import { format, subDays } from "date-fns";
import { AnimatedCounter } from "@/components/ui/animated-counter";

export function AdAdvancedReporting() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [dateFrom, setDateFrom] = useState(format(subDays(new Date(), 30), "yyyy-MM-dd"));
  const [dateTo, setDateTo] = useState(format(new Date(), "yyyy-MM-dd"));

  const { data: campaigns = [] } = useQuery({
    queryKey: ["ad-report-campaigns", dateFrom, dateTo],
    queryFn: async () => {
      const { data } = await supabase
        .from("ad_campaigns")
        .select("*, companies(name, name_ar)")
        .gte("created_at", dateFrom)
        .lte("created_at", dateTo + "T23:59:59")
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const { data: impressions = [] } = useQuery({
    queryKey: ["ad-report-impressions", dateFrom, dateTo],
    queryFn: async () => {
      const { data } = await supabase
        .from("ad_impressions")
        .select("id, campaign_id, cost, created_at")
        .gte("created_at", dateFrom)
        .lte("created_at", dateTo + "T23:59:59");
      return data || [];
    },
  });

  const { data: clicks = [] } = useQuery({
    queryKey: ["ad-report-clicks", dateFrom, dateTo],
    queryFn: async () => {
      const { data } = await supabase
        .from("ad_clicks")
        .select("id, campaign_id, cost, created_at")
        .gte("created_at", dateFrom)
        .lte("created_at", dateTo + "T23:59:59");
      return data || [];
    },
  });

  // Calculate advanced metrics per campaign
  const reportData = useMemo(() => {
    return campaigns.map((c: any) => {
      const campImpressions = impressions.filter((i: any) => i.campaign_id === c.id).length;
      const campClicks = clicks.filter((cl: any) => cl.campaign_id === c.id).length;
      const ctr = campImpressions > 0 ? ((campClicks / campImpressions) * 100) : 0;
      const spent = c.spent || 0;
      const budget = c.budget || 0;
      const cpm = campImpressions > 0 ? (spent / campImpressions) * 1000 : 0;
      const cpc = campClicks > 0 ? spent / campClicks : 0;
      const roas = spent > 0 ? ((budget - spent) / spent * 100) : 0;
      const budgetUtilization = budget > 0 ? (spent / budget) * 100 : 0;

      return {
        id: c.id,
        name: isAr ? c.name_ar || c.name : c.name,
        company: isAr ? c.companies?.name_ar || c.companies?.name : c.companies?.name,
        status: c.status,
        billing_model: c.billing_model,
        impressions: campImpressions || c.total_impressions || 0,
        clicks: campClicks || c.total_clicks || 0,
        ctr: ctr.toFixed(2),
        budget,
        spent,
        cpm: cpm.toFixed(2),
        cpc: cpc.toFixed(2),
        roas: roas.toFixed(1),
        budgetUtilization: budgetUtilization.toFixed(1),
        currency: c.currency || "SAR",
      };
    });
  }, [campaigns, impressions, clicks, isAr]);

  // Summary KPIs
  const totals = useMemo(() => {
    const totalImpressions = reportData.reduce((s, r) => s + r.impressions, 0);
    const totalClicks = reportData.reduce((s, r) => s + r.clicks, 0);
    const totalSpent = reportData.reduce((s, r) => s + r.spent, 0);
    const totalBudget = reportData.reduce((s, r) => s + r.budget, 0);
    const avgCTR = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : "0.00";
    const avgCPM = totalImpressions > 0 ? ((totalSpent / totalImpressions) * 1000).toFixed(2) : "0.00";
    const avgCPC = totalClicks > 0 ? (totalSpent / totalClicks).toFixed(2) : "0.00";
    return { totalImpressions, totalClicks, totalSpent, totalBudget, avgCTR, avgCPM, avgCPC };
  }, [reportData]);

  const exportCSV = () => {
    const BOM = "\uFEFF";
    const headers = ["Campaign", "Company", "Status", "Model", "Impressions", "Clicks", "CTR%", "Budget", "Spent", "eCPM", "eCPC", "ROAS%", "Budget Util%"];
    const rows = reportData.map(r => [r.name, r.company, r.status, r.billing_model, r.impressions, r.clicks, r.ctr, r.budget, r.spent, r.cpm, r.cpc, r.roas, r.budgetUtilization]);
    const csv = BOM + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ad-report-${dateFrom}-to-${dateTo}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: isAr ? "تم التصدير بنجاح" : "Report exported" });
  };

  return (
    <div className="space-y-4">
      {/* Date Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <Label className="text-xs">{isAr ? "من تاريخ" : "From"}</Label>
              <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-40" />
            </div>
            <div>
              <Label className="text-xs">{isAr ? "إلى تاريخ" : "To"}</Label>
              <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-40" />
            </div>
            <Button variant="outline" size="sm" onClick={exportCSV}>
              <Download className="h-3.5 w-3.5 me-1" />{isAr ? "تصدير CSV" : "Export CSV"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {[
          { icon: BarChart3, label: isAr ? "المشاهدات" : "Impressions", numValue: totals.totalImpressions },
          { icon: Target, label: isAr ? "النقرات" : "Clicks", numValue: totals.totalClicks },
          { icon: TrendingUp, label: "CTR", strValue: `${totals.avgCTR}%` },
          { icon: DollarSign, label: isAr ? "الإنفاق" : "Spent", numValue: Math.round(totals.totalSpent), prefix: "SAR " },
          { icon: DollarSign, label: "eCPM", strValue: `SAR ${totals.avgCPM}` },
          { icon: DollarSign, label: "eCPC", strValue: `SAR ${totals.avgCPC}` },
          { icon: DollarSign, label: isAr ? "الميزانية" : "Budget", numValue: Math.round(totals.totalBudget), prefix: "SAR " },
        ].map(k => (
          <div key={k.label} className="p-3 rounded-xl bg-muted/50 text-center">
            <p className="text-[10px] text-muted-foreground">{k.label}</p>
            <p className="text-sm font-bold">{'numValue' in k ? <>{k.prefix}<AnimatedCounter value={k.numValue!} className="inline" /></> : k.strValue}</p>
          </div>
        ))}
      </div>

      {/* Detailed Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{isAr ? "تقرير الأداء التفصيلي" : "Detailed Performance Report"}</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {reportData.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">{isAr ? "لا توجد بيانات في هذه الفترة" : "No data for this period"}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{isAr ? "الحملة" : "Campaign"}</TableHead>
                  <TableHead>{isAr ? "الشركة" : "Company"}</TableHead>
                  <TableHead>{isAr ? "الحالة" : "Status"}</TableHead>
                  <TableHead>{isAr ? "المشاهدات" : "Imp."}</TableHead>
                  <TableHead>{isAr ? "النقرات" : "Clicks"}</TableHead>
                  <TableHead>CTR</TableHead>
                  <TableHead>eCPM</TableHead>
                  <TableHead>eCPC</TableHead>
                  <TableHead>ROAS</TableHead>
                  <TableHead>{isAr ? "استخدام الميزانية" : "Budget Util."}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.map(r => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium text-xs">{r.name}</TableCell>
                    <TableCell className="text-xs">{r.company}</TableCell>
                    <TableCell><Badge variant="outline" className="text-[10px]">{r.status}</Badge></TableCell>
                    <TableCell className="text-xs"><AnimatedCounter value={r.impressions} /></TableCell>
                    <TableCell className="text-xs"><AnimatedCounter value={r.clicks} /></TableCell>
                    <TableCell className="text-xs font-medium">{r.ctr}%</TableCell>
                    <TableCell className="text-xs">{r.cpm}</TableCell>
                    <TableCell className="text-xs">{r.cpc}</TableCell>
                    <TableCell className="text-xs">
                      <Badge variant={Number(r.roas) > 0 ? "default" : "destructive"} className="text-[10px]">{r.roas}%</Badge>
                    </TableCell>
                    <TableCell className="text-xs">{r.budgetUtilization}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
