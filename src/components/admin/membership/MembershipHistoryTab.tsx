import { useIsAr } from "@/hooks/useIsAr";
import { memo, useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { History, ArrowUp, ArrowDown, Minus, Download, Search, Filter, TrendingUp, TrendingDown } from "lucide-react";
import { format, subMonths } from "date-fns";
import { ar } from "date-fns/locale";
import { useAdminBulkActions } from "@/hooks/useAdminBulkActions";
import { useCSVExport } from "@/hooks/useCSVExport";
import { BulkActionBar } from "@/components/admin/BulkActionBar";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { QUERY_LIMIT_MEDIUM } from "@/lib/constants";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";

interface HistoryEntry {
  id: string;
  user_id: string;
  previous_tier: string | null;
  new_tier: string;
  reason: string | null;
  changed_by: string | null;
  created_at: string;
  profile?: {
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
    account_number: string | null;
  };
}

const MembershipHistoryTab = memo(function MembershipHistoryTab() {
  const isAr = useIsAr();
  const [search, setSearch] = useState("");
  const [directionFilter, setDirectionFilter] = useState("all");

  const { data: history, isLoading } = useQuery({
    queryKey: ["membership-history-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("membership_history")
        .select("id, user_id, previous_tier, new_tier, reason, changed_by, created_at")
        .order("created_at", { ascending: false })
        .limit(QUERY_LIMIT_MEDIUM);
      if (error) throw error;

      // Fetch profiles for all user_ids
      const userIds = [...new Set((data || []).map(h => h.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, username, avatar_url, account_number")
        .in("user_id", userIds);

      const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));
      return (data || []).map(h => ({ ...h, profile: profileMap.get(h.user_id) || null })) as HistoryEntry[];
    },
  });

  const tierOrder: Record<string, number> = { basic: 0, professional: 1, enterprise: 2 };
  const tierLabels: Record<string, string> = isAr
    ? { basic: "أساسي", professional: "احترافي", enterprise: "مؤسسي" }
    : { basic: "Basic", professional: "Professional", enterprise: "Enterprise" };

  const getDirection = (prev: string | null, next: string) => {
    const p = tierOrder[prev || "basic"] ?? 0;
    const n = tierOrder[next] ?? 0;
    if (n > p) return "upgrade";
    if (n < p) return "downgrade";
    return "lateral";
  };

  const filtered = useMemo(() => {
    if (!history) return [];
    return history.filter(h => {
      if (directionFilter !== "all" && getDirection(h.previous_tier, h.new_tier) !== directionFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const name = (h.profile?.full_name || h.profile?.username || h.user_id || "").toLowerCase();
        const acct = (h.profile?.account_number || "").toLowerCase();
        const reason = (h.reason || "").toLowerCase();
        if (!name.includes(q) && !acct.includes(q) && !reason.includes(q)) return false;
      }
      return true;
    });
  }, [history, search, directionFilter]);

  const bulk = useAdminBulkActions(filtered);

  const { exportCSV } = useCSVExport({
    columns: [
      { header: isAr ? "العضو" : "Member", accessor: (r: HistoryEntry) => r.profile?.full_name || r.profile?.username || r.user_id },
      { header: isAr ? "من" : "From", accessor: (r: HistoryEntry) => r.previous_tier || "basic" },
      { header: isAr ? "إلى" : "To", accessor: (r: HistoryEntry) => r.new_tier },
      { header: isAr ? "السبب" : "Reason", accessor: (r: HistoryEntry) => r.reason || "" },
      { header: isAr ? "التاريخ" : "Date", accessor: (r: HistoryEntry) => format(new Date(r.created_at), "yyyy-MM-dd HH:mm") },
    ],
    filename: "membership-history",
  });

  const getChangeIcon = (prev: string | null, next: string) => {
    const dir = getDirection(prev, next);
    if (dir === "upgrade") return <ArrowUp className="h-4 w-4 text-primary" />;
    if (dir === "downgrade") return <ArrowDown className="h-4 w-4 text-destructive" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const totalChanges = filtered.length;
  const upgrades = filtered.filter(h => getDirection(h.previous_tier, h.new_tier) === "upgrade").length;
  const downgrades = filtered.filter(h => getDirection(h.previous_tier, h.new_tier) === "downgrade").length;
  const netMovement = upgrades - downgrades;

  // Monthly trend data for mini chart
  const monthlyTrend = useMemo(() => {
    if (!history) return [];
    const months: Record<string, { label: string; upgrades: number; downgrades: number }> = {};
    for (let i = 5; i >= 0; i--) {
      const d = subMonths(new Date(), i);
      const key = format(d, "yyyy-MM");
      months[key] = { label: format(d, "MMM"), upgrades: 0, downgrades: 0 };
    }
    for (const h of history) {
      const key = format(new Date(h.created_at), "yyyy-MM");
      if (!months[key]) continue;
      const dir = getDirection(h.previous_tier, h.new_tier);
      if (dir === "upgrade") months[key].upgrades++;
      else if (dir === "downgrade") months[key].downgrades++;
    }
    return Object.values(months);
  }, [history]);

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-4">
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
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="flex items-center justify-center gap-1.5">
              {netMovement >= 0 ? <TrendingUp className="h-5 w-5 text-chart-2" /> : <TrendingDown className="h-5 w-5 text-destructive" />}
              <p className={`text-2xl font-bold ${netMovement >= 0 ? "text-chart-2" : "text-destructive"}`}>
                {netMovement >= 0 ? "+" : ""}<AnimatedCounter value={netMovement} />
              </p>
            </div>
            <p className="text-sm text-muted-foreground">{isAr ? "صافي الحركة" : "Net Movement"}</p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trend Chart */}
      {monthlyTrend.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{isAr ? "اتجاه التغييرات الشهرية" : "Monthly Change Trend"}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={25} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="upgrades" fill="hsl(var(--primary))" name={isAr ? "ترقيات" : "Upgrades"} radius={[3, 3, 0, 0]} />
                <Bar dataKey="downgrades" fill="hsl(var(--destructive))" name={isAr ? "تخفيضات" : "Downgrades"} radius={[3, 3, 0, 0]} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={isAr ? "بحث بالاسم أو رقم الحساب..." : "Search by name or account..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="ps-9"
          />
        </div>
        <Select value={directionFilter} onValueChange={setDirectionFilter}>
          <SelectTrigger className="w-[140px]">
            <Filter className="h-4 w-4 me-1.5" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{isAr ? "الكل" : "All"}</SelectItem>
            <SelectItem value="upgrade">{isAr ? "ترقيات" : "Upgrades"}</SelectItem>
            <SelectItem value="downgrade">{isAr ? "تخفيضات" : "Downgrades"}</SelectItem>
            <SelectItem value="lateral">{isAr ? "تحويلات" : "Lateral"}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <BulkActionBar
        count={bulk.count}
        onClear={bulk.clearSelection}
        onExport={() => exportCSV(bulk.count > 0 ? bulk.selectedItems : filtered)}
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
            <Button variant="outline" size="sm" onClick={() => exportCSV(filtered)} className="gap-1.5">
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
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <History className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>{isAr ? "لا يوجد سجل بعد" : "No history found"}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox checked={bulk.isAllSelected} onCheckedChange={bulk.toggleAll} />
                    </TableHead>
                    <TableHead>{isAr ? "العضو" : "Member"}</TableHead>
                    <TableHead>{isAr ? "التغيير" : "Change"}</TableHead>
                    <TableHead>{isAr ? "من" : "From"}</TableHead>
                    <TableHead>{isAr ? "إلى" : "To"}</TableHead>
                    <TableHead>{isAr ? "السبب" : "Reason"}</TableHead>
                    <TableHead>{isAr ? "التاريخ" : "Date"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((entry) => (
                    <TableRow key={entry.id} className={bulk.isSelected(entry.id) ? "bg-primary/5" : ""}>
                      <TableCell>
                        <Checkbox checked={bulk.isSelected(entry.id)} onCheckedChange={() => bulk.toggleOne(entry.id)} />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-7 w-7">
                            <AvatarImage src={entry.profile?.avatar_url || undefined} />
                            <AvatarFallback className="text-xs">
                              {(entry.profile?.full_name || entry.profile?.username || "?").charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate max-w-[120px]">
                              {entry.profile?.full_name || entry.profile?.username || entry.user_id.slice(0, 8)}
                            </p>
                            {entry.profile?.account_number && (
                              <p className="text-xs text-muted-foreground">{entry.profile.account_number}</p>
                            )}
                          </div>
                        </div>
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
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {format(new Date(entry.created_at), "MMM d, yyyy HH:mm", { locale: isAr ? ar : undefined })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
});

export default MembershipHistoryTab;
