import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { History, ArrowUp, ArrowDown, Minus, Download } from "lucide-react";
import { format } from "date-fns";
import { useAdminBulkActions } from "@/hooks/useAdminBulkActions";
import { useCSVExport } from "@/hooks/useCSVExport";
import { BulkActionBar } from "@/components/admin/BulkActionBar";
import { AnimatedCounter } from "@/components/ui/animated-counter";

interface HistoryEntry {
  id: string;
  user_id: string;
  previous_tier: string | null;
  new_tier: string;
  reason: string | null;
  changed_by: string | null;
  created_at: string;
}

export default function MembershipHistoryTab() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data: history, isLoading } = useQuery({
    queryKey: ["membership-history-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("membership_history")
        .select("id, user_id, previous_tier, new_tier, reason, changed_by, created_at")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data as HistoryEntry[];
    },
  });

  const bulk = useAdminBulkActions(history || []);

  const { exportCSV } = useCSVExport({
    columns: [
      { header: isAr ? "من" : "From", accessor: (r: HistoryEntry) => r.previous_tier || "basic" },
      { header: isAr ? "إلى" : "To", accessor: (r: HistoryEntry) => r.new_tier },
      { header: isAr ? "السبب" : "Reason", accessor: (r: HistoryEntry) => r.reason || "" },
      { header: isAr ? "التاريخ" : "Date", accessor: (r: HistoryEntry) => format(new Date(r.created_at), "yyyy-MM-dd HH:mm") },
    ],
    filename: "membership-history",
  });

  const tierOrder: Record<string, number> = { basic: 0, professional: 1, enterprise: 2 };
  const tierLabels: Record<string, string> = isAr
    ? { basic: "أساسي", professional: "احترافي", enterprise: "مؤسسي" }
    : { basic: "Basic", professional: "Professional", enterprise: "Enterprise" };

  const getChangeIcon = (prev: string | null, next: string) => {
    const prevOrder = tierOrder[prev || "basic"] ?? 0;
    const nextOrder = tierOrder[next] ?? 0;
    if (nextOrder > prevOrder) return <ArrowUp className="h-4 w-4 text-primary" />;
    if (nextOrder < prevOrder) return <ArrowDown className="h-4 w-4 text-destructive" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  // Summary stats
  const totalChanges = history?.length || 0;
  const upgrades = history?.filter(h => (tierOrder[h.new_tier] || 0) > (tierOrder[h.previous_tier || "basic"] || 0)).length || 0;
  const downgrades = history?.filter(h => (tierOrder[h.new_tier] || 0) < (tierOrder[h.previous_tier || "basic"] || 0)).length || 0;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-2xl font-bold"><AnimatedCounter value={totalChanges} /></p>
            <p className="text-sm text-muted-foreground">{isAr ? "إجمالي التغييرات" : "Total Changes"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-2xl font-bold text-primary"><AnimatedCounter value={upgrades} /></p>
            <p className="text-sm text-muted-foreground">{isAr ? "ترقيات" : "Upgrades"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-2xl font-bold text-destructive"><AnimatedCounter value={downgrades} /></p>
            <p className="text-sm text-muted-foreground">{isAr ? "تخفيضات" : "Downgrades"}</p>
          </CardContent>
        </Card>
      </div>

      <BulkActionBar
        count={bulk.count}
        onClear={bulk.clearSelection}
        onExport={() => exportCSV(bulk.count > 0 ? bulk.selectedItems : history || [])}
      />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                {isAr ? "سجل التغييرات" : "Change History"}
              </CardTitle>
              <CardDescription>{isAr ? "جميع تغييرات مستويات العضوية" : "All membership tier changes"}</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => exportCSV(history || [])} className="gap-1.5">
              <Download className="h-3.5 w-3.5" />
              {isAr ? "تصدير" : "Export"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : history?.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <History className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>{isAr ? "لا يوجد سجل بعد" : "No history yet"}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox checked={bulk.isAllSelected} onCheckedChange={bulk.toggleAll} />
                  </TableHead>
                  <TableHead>{isAr ? "التغيير" : "Change"}</TableHead>
                  <TableHead>{isAr ? "من" : "From"}</TableHead>
                  <TableHead>{isAr ? "إلى" : "To"}</TableHead>
                  <TableHead>{isAr ? "السبب" : "Reason"}</TableHead>
                  <TableHead>{isAr ? "التاريخ" : "Date"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history?.map((entry) => (
                  <TableRow key={entry.id} className={bulk.isSelected(entry.id) ? "bg-primary/5" : ""}>
                    <TableCell>
                      <Checkbox checked={bulk.isSelected(entry.id)} onCheckedChange={() => bulk.toggleOne(entry.id)} />
                    </TableCell>
                    <TableCell>{getChangeIcon(entry.previous_tier, entry.new_tier)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{tierLabels[entry.previous_tier || "basic"] || entry.previous_tier}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="default">{tierLabels[entry.new_tier] || entry.new_tier}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                      {entry.reason || "-"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(entry.created_at), "MMM d, yyyy HH:mm")}
                    </TableCell>
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
