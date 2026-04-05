import { memo } from "react";
import { CostEstimate, ESTIMATE_STATUS_CONFIG, MODULE_TYPES } from "@/hooks/useCostCenter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Plus, Clock, CheckCircle2, ArrowRight, AlertCircle,
  Trophy, ChefHat, Landmark, Calendar, FileText, BarChart3,
} from "lucide-react";
import { AnimatedCounter } from "@/components/ui/animated-counter";

interface Props {
  isAr: boolean;
  estimates: CostEstimate[];
  stats: {
    total: number; drafts: number; pending: number; approved: number;
    totalValue: number; approvedValue: number; byModule: Record<string, number>;
  };
  onSelect: (id: string) => void;
  onCreateNew: () => void;
}

export const CostCenterOverview = memo(function CostCenterOverview({ isAr, estimates, stats, onSelect, onCreateNew }: Props) {
  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        {/* Recent Estimates */}
        <Card className="border-border/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="h-4 w-4" />{isAr ? "أحدث التقديرات" : "Recent Estimates"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {estimates.slice(0, 5).map(est => {
              const sc = ESTIMATE_STATUS_CONFIG[est.status];
              return (
                <div key={est.id}
                  className="flex items-center gap-3 px-4 py-3 border-b border-border/20 last:border-0 cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => onSelect(est.id)}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{est.title}</p>
                    <p className="text-[10px] text-muted-foreground font-mono">{est.estimate_number}</p>
                  </div>
                  <Badge className={`text-[9px] ${sc.color}`}>{isAr ? sc.ar : sc.en}</Badge>
                  <AnimatedCounter value={Math.round(est.total_amount)} className="text-sm font-bold tabular-nums" />
                </div>
              );
            })}
            {estimates.length === 0 && (
              <div className="py-8 text-center text-muted-foreground text-sm">
                {isAr ? "لا توجد تقديرات بعد" : "No estimates yet"}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Approvals */}
        <Card className="border-border/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-chart-4" />{isAr ? "بانتظار الموافقة" : "Pending Approvals"}
              {stats.pending > 0 && <Badge variant="destructive" className="text-[10px]">{stats.pending}</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {estimates.filter(e => e.status === "pending_approval").slice(0, 5).map(est => {
              const mt = MODULE_TYPES[est.module_type];
              return (
                <div key={est.id}
                  className="flex items-center gap-3 px-4 py-3 border-b border-border/20 last:border-0 cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => onSelect(est.id)}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{est.title}</p>
                    <Badge variant="outline" className="text-[9px]">{isAr ? mt.ar : mt.en}</Badge>
                  </div>
                  <span className="text-sm font-bold tabular-nums text-chart-4"><AnimatedCounter value={Math.round(est.total_amount)} className="inline" /> SAR</span>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
              );
            })}
            {stats.pending === 0 && (
              <div className="py-8 text-center text-muted-foreground text-sm">
                <CheckCircle2 className="h-6 w-6 mx-auto mb-2 opacity-30" />
                {isAr ? "لا توجد تقديرات معلقة" : "No pending approvals"}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Create */}
      <Card className="border-dashed border-primary/20 bg-primary/5">
        <CardContent className="p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <Plus className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-sm">{isAr ? "إنشاء تقدير تكلفة جديد" : "Create New Cost Estimate"}</h3>
              <p className="text-xs text-muted-foreground">
                {isAr ? "للمسابقات، طاولة الشيف، المعارض، الفعاليات، أو المشاريع" : "For competitions, chef's table, exhibitions, events, or projects"}
              </p>
            </div>
            <Button className="gap-1.5" onClick={onCreateNew}>
              <Plus className="h-4 w-4" />{isAr ? "تقدير جديد" : "New Estimate"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});
