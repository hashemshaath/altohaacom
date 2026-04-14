import { memo, useMemo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle, XCircle, DollarSign, Megaphone, Pause, Play, TrendingUp, MousePointerClick, Eye } from "lucide-react";
import { BulkActionBar } from "@/components/admin/BulkActionBar";
import { statusColors } from "./statusColors";
import type { AdCampaignWithCompany } from "./types";

interface BulkActions {
  selectedIds: Set<string>;
  toggle: (id: string) => void;
  toggleAll: (ids: string[]) => void;
  clearAll: () => void;
}

interface Props {
  campaigns: AdCampaignWithCompany[];
  bulkActions: BulkActions;
  onApprove: (id: string, status: string) => void;
  onReject: (id: string) => void;
  onInvoice: (campaign: AdCampaignWithCompany) => void;
  onExportCSV: (items: AdCampaignWithCompany[]) => void;
  invoicePending: boolean;
}

export const AdCampaignsTab = memo(function AdCampaignsTab({
  campaigns, bulkActions, onApprove, onReject, onInvoice, onExportCSV, invoicePending,
}: Props) {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const stats = useMemo(() => {
    const totalBudget = campaigns.reduce((s, c) => s + (c.budget || 0), 0);
    const totalSpent = campaigns.reduce((s, c) => s + (c.spent || 0), 0);
    const totalImpressions = campaigns.reduce((s, c) => s + (c.total_impressions || 0), 0);
    const totalClicks = campaigns.reduce((s, c) => s + (c.total_clicks || 0), 0);
    const avgCtr = totalImpressions ? ((totalClicks / totalImpressions) * 100).toFixed(1) : "0";
    const activeCount = campaigns.filter(c => c.status === "active").length;
    return { totalBudget, totalSpent, totalImpressions, totalClicks, avgCtr, activeCount };
  }, [campaigns]);

  if (campaigns.length === 0) {
    return (
      <Card className="rounded-2xl">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted mb-4">
            <Megaphone className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium">{isAr ? "لا توجد حملات إعلانية" : "No campaigns yet"}</p>
          <p className="text-xs text-muted-foreground mt-1">{isAr ? "سيتم إنشاء الحملات بعد الموافقة على الطلبات" : "Campaigns are created after request approval"}</p>
        </CardContent>
      </Card>
    );
  }


  return (
    <div className="space-y-3">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: Megaphone, label: isAr ? "حملات نشطة" : "Active", value: stats.activeCount, color: "text-chart-2" },
          { icon: Eye, label: isAr ? "مشاهدات" : "Impressions", value: stats.totalImpressions.toLocaleString(), color: "text-primary" },
          { icon: MousePointerClick, label: isAr ? "نقرات" : "Clicks", value: stats.totalClicks.toLocaleString(), color: "text-chart-4" },
          { icon: TrendingUp, label: isAr ? "معدل CTR" : "Avg CTR", value: `${stats.avgCtr}%`, color: "text-chart-1" },
        ].map((s, i) => (
          <Card key={i} className="rounded-2xl">
            <CardContent className="p-3 flex items-center gap-3">
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl bg-muted/50`}>
                <s.icon className={`h-4 w-4 ${s.color}`} />
              </div>
              <div>
                <p className="text-lg font-bold leading-none">{s.value}</p>
                <p className="text-[12px] text-muted-foreground mt-0.5">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <BulkActionBar
        count={bulkActions.count}
        onClear={bulkActions.clearSelection}
        onExport={() => onExportCSV(bulkActions.selectedItems)}
      />
      <Card className="rounded-2xl">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">{isAr ? "الحملات الإعلانية" : "Ad Campaigns"}</CardTitle>
            <Badge variant="secondary" className="text-[12px]">{campaigns.length}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8"><Checkbox checked={bulkActions.isAllSelected} onCheckedChange={bulkActions.toggleAll} /></TableHead>
                  <TableHead>{isAr ? "الشركة" : "Company"}</TableHead>
                  <TableHead>{isAr ? "الحملة" : "Campaign"}</TableHead>
                  <TableHead>{isAr ? "النموذج" : "Model"}</TableHead>
                  <TableHead>{isAr ? "الميزانية" : "Budget"}</TableHead>
                  <TableHead>{isAr ? "الأداء" : "Performance"}</TableHead>
                  <TableHead>{isAr ? "الحالة" : "Status"}</TableHead>
                  <TableHead>{isAr ? "إجراءات" : "Actions"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((c) => {
                  const budget = c.budget || 1;
                  const spent = c.spent || 0;
                  const pct = Math.min(Math.round((spent / budget) * 100), 100);
                  const ctr = c.total_impressions ? ((c.total_clicks || 0) / c.total_impressions * 100).toFixed(1) : "0";

                  return (
                    <TableRow key={c.id} className={bulkActions.isSelected(c.id) ? "bg-primary/5" : ""}>
                      <TableCell><Checkbox checked={bulkActions.isSelected(c.id)} onCheckedChange={() => bulkActions.toggleOne(c.id)} /></TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {c.companies?.logo_url && <img loading="lazy" decoding="async" src={c.companies.logo_url} alt={c.companies?.name || "Company"} className="h-6 w-6 rounded-lg object-cover" />}
                          <span className="text-xs">{isAr ? c.companies?.name_ar : c.companies?.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-xs">{isAr ? c.name_ar || c.name : c.name}</TableCell>
                      <TableCell><Badge variant="outline" className="text-[12px]">{c.billing_model}</Badge></TableCell>
                      <TableCell>
                        <div className="space-y-1 min-w-[120px]">
                          <div className="flex justify-between text-[12px]">
                            <span className="font-mono">{spent.toLocaleString()} / {budget.toLocaleString()}</span>
                            <span className="text-muted-foreground">{pct}%</span>
                          </div>
                          <Progress value={pct} className="h-1" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-[12px] space-y-0.5">
                          <p>{(c.total_impressions || 0).toLocaleString()} {isAr ? "مشاهدة" : "imp"}</p>
                          <p>{(c.total_clicks || 0).toLocaleString()} {isAr ? "نقرة" : "clicks"} · CTR {ctr}%</p>
                        </div>
                      </TableCell>
                      <TableCell><Badge className={statusColors[c.status] || ""}>{c.status}</Badge></TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {c.status === "pending_approval" && (
                            <>
                              <Button size="sm" variant="ghost" className="h-7 rounded-xl text-chart-2" onClick={() => onApprove(c.id, "active")}>
                                <CheckCircle className="h-3.5 w-3.5" />
                              </Button>
                              <Button size="sm" variant="ghost" className="h-7 rounded-xl text-destructive" onClick={() => onReject(c.id)}>
                                <XCircle className="h-3.5 w-3.5" />
                              </Button>
                            </>
                          )}
                          {c.status === "active" && (
                            <>
                              <Button size="sm" variant="ghost" className="h-7 rounded-xl" onClick={() => onApprove(c.id, "paused")}>
                                <Pause className="h-3.5 w-3.5" />
                              </Button>
                              <Button size="sm" variant="outline" className="h-7 rounded-xl text-[12px]" onClick={() => onInvoice(c)} disabled={invoicePending}>
                                <DollarSign className="h-3 w-3 me-0.5" />{isAr ? "فوترة" : "Invoice"}
                              </Button>
                            </>
                          )}
                          {c.status === "paused" && (
                            <>
                              <Button size="sm" variant="ghost" className="h-7 rounded-xl" onClick={() => onApprove(c.id, "active")}>
                                <Play className="h-3.5 w-3.5" />
                              </Button>
                              <Button size="sm" variant="outline" className="h-7 rounded-xl text-[12px]" onClick={() => onInvoice(c)} disabled={invoicePending}>
                                <DollarSign className="h-3 w-3 me-0.5" />{isAr ? "فوترة" : "Invoice"}
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});
