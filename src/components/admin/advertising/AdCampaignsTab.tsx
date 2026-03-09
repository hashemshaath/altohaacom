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

interface Props {
  campaigns: any[];
  bulkActions: any;
  onApprove: (id: string, status: string) => void;
  onReject: (id: string) => void;
  onInvoice: (campaign: any) => void;
  onExportCSV: (items: any[]) => void;
  invoicePending: boolean;
}

export const AdCampaignsTab = memo(function AdCampaignsTab({
  campaigns, bulkActions, onApprove, onReject, onInvoice, onExportCSV, invoicePending,
}: Props) {
  const { language } = useLanguage();
  const isAr = language === "ar";

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
      <BulkActionBar
        count={bulkActions.count}
        onClear={bulkActions.clearSelection}
        onExport={() => onExportCSV(bulkActions.selectedItems)}
      />
      <Card className="rounded-2xl">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">{isAr ? "الحملات الإعلانية" : "Ad Campaigns"}</CardTitle>
            <Badge variant="secondary" className="text-[10px]">{campaigns.length}</Badge>
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
                {campaigns.map((c: any) => {
                  const budget = c.budget || 1;
                  const spent = c.spent || 0;
                  const pct = Math.min(Math.round((spent / budget) * 100), 100);
                  const ctr = c.total_impressions ? ((c.total_clicks || 0) / c.total_impressions * 100).toFixed(1) : "0";

                  return (
                    <TableRow key={c.id} className={bulkActions.isSelected(c.id) ? "bg-primary/5" : ""}>
                      <TableCell><Checkbox checked={bulkActions.isSelected(c.id)} onCheckedChange={() => bulkActions.toggleOne(c.id)} /></TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {c.companies?.logo_url && <img src={c.companies.logo_url} alt="" className="h-6 w-6 rounded-lg object-cover" />}
                          <span className="text-xs">{isAr ? c.companies?.name_ar : c.companies?.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-xs">{isAr ? c.name_ar || c.name : c.name}</TableCell>
                      <TableCell><Badge variant="outline" className="text-[10px]">{c.billing_model}</Badge></TableCell>
                      <TableCell>
                        <div className="space-y-1 min-w-[120px]">
                          <div className="flex justify-between text-[10px]">
                            <span className="font-mono">{spent.toLocaleString()} / {budget.toLocaleString()}</span>
                            <span className="text-muted-foreground">{pct}%</span>
                          </div>
                          <Progress value={pct} className="h-1" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-[10px] space-y-0.5">
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
                              <Button size="sm" variant="outline" className="h-7 rounded-xl text-[10px]" onClick={() => onInvoice(c)} disabled={invoicePending}>
                                <DollarSign className="h-3 w-3 me-0.5" />{isAr ? "فوترة" : "Invoice"}
                              </Button>
                            </>
                          )}
                          {c.status === "paused" && (
                            <>
                              <Button size="sm" variant="ghost" className="h-7 rounded-xl" onClick={() => onApprove(c.id, "active")}>
                                <Play className="h-3.5 w-3.5" />
                              </Button>
                              <Button size="sm" variant="outline" className="h-7 rounded-xl text-[10px]" onClick={() => onInvoice(c)} disabled={invoicePending}>
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
