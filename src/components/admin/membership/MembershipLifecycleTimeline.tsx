import { useIsAr } from "@/hooks/useIsAr";
import { memo, useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { AdminExportButton } from "@/components/admin/AdminExportButton";
import { useAdminExport } from "@/hooks/useAdminExport";
import {
  ArrowUpCircle, ArrowDownCircle, RefreshCw, UserPlus, XCircle,
  ShieldAlert, Clock, Gift, Zap, Search, CalendarDays, ChevronDown
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface TimelineEvent {
  id: string;
  user_id: string;
  previous_tier: string | null;
  new_tier: string;
  reason: string | null;
  created_at: string;
  changed_by: string | null;
  profile?: { full_name: string | null; username: string | null; avatar_url: string | null; account_number: string | null } | null;
}

const TIER_ORDER: Record<string, number> = { basic: 0, professional: 1, enterprise: 2 };

function getEventType(prev: string | null, next: string, reason?: string | null) {
  const isAr = useIsAr();
  const p = TIER_ORDER[prev || "basic"] ?? 0;
  const n = TIER_ORDER[next] ?? 0;
  if (reason?.toLowerCase().includes("trial")) return "trial";
  if (reason?.toLowerCase().includes("renewal") || reason?.toLowerCase().includes("renew")) return "renewal";
  if (reason?.toLowerCase().includes("gift")) return "gift";
  if (reason?.toLowerCase().includes("suspend")) return "suspended";
  if (reason?.toLowerCase().includes("cancel") || reason?.toLowerCase().includes("revoke")) return "cancelled";
  if (reason?.toLowerCase().includes("expired") || reason?.toLowerCase().includes("auto-expired")) return "expired";
  if (n > p) return "upgrade";
  if (n < p) return "downgrade";
  return "change";
}

const eventConfig: Record<string, { icon: typeof ArrowUpCircle; color: string; bgColor: string; label: string; labelAr: string }> = {
  upgrade: { icon: ArrowUpCircle, color: "text-primary", bgColor: "bg-primary/10", label: "Upgrade", labelAr: "ترقية" },
  downgrade: { icon: ArrowDownCircle, color: "text-destructive", bgColor: "bg-destructive/10", label: "Downgrade", labelAr: "تخفيض" },
  renewal: { icon: RefreshCw, color: "text-chart-2", bgColor: "bg-chart-2/10", label: "Renewal", labelAr: "تجديد" },
  trial: { icon: Zap, color: "text-chart-4", bgColor: "bg-chart-4/10", label: "Trial", labelAr: "تجربة" },
  gift: { icon: Gift, color: "text-chart-3", bgColor: "bg-chart-3/10", label: "Gift", labelAr: "هدية" },
  expired: { icon: Clock, color: "text-muted-foreground", bgColor: "bg-muted", label: "Expired", labelAr: "منتهي" },
  suspended: { icon: ShieldAlert, color: "text-destructive", bgColor: "bg-destructive/10", label: "Suspended", labelAr: "موقوف" },
  cancelled: { icon: XCircle, color: "text-destructive", bgColor: "bg-destructive/10", label: "Cancelled", labelAr: "ملغي" },
  change: { icon: CalendarDays, color: "text-muted-foreground", bgColor: "bg-muted", label: "Change", labelAr: "تغيير" },
};

const tierLabels: Record<string, { en: string; ar: string }> = {
  basic: { en: "Basic", ar: "أساسي" },
  professional: { en: "Professional", ar: "احترافي" },
  enterprise: { en: "Enterprise", ar: "مؤسسي" },
};

const PAGE_SIZE = 50;

const MembershipLifecycleTimeline = memo(function MembershipLifecycleTimeline() {
  const isAr = useIsAr();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [limit, setLimit] = useState(PAGE_SIZE);

  const { data: events, isLoading } = useQuery({
    queryKey: ["membership-lifecycle-timeline", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("membership_history")
        .select("id, user_id, previous_tier, new_tier, reason, created_at, changed_by")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;

      const userIds = [...new Set((data || []).map(d => d.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, username, avatar_url, account_number")
        .in("user_id", userIds);

      const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));
      return (data || []).map(e => ({ ...e, profile: profileMap.get(e.user_id) || null })) as TimelineEvent[];
    },
  });

  const filtered = useMemo(() => {
    return events?.filter(e => {
      if (typeFilter !== "all") {
        const type = getEventType(e.previous_tier, e.new_tier, e.reason);
        if (type !== typeFilter) return false;
      }
      if (!search) return true;
      const s = search.toLowerCase();
      return (
        e.user_id.toLowerCase().includes(s) ||
        e.reason?.toLowerCase().includes(s) ||
        e.new_tier.toLowerCase().includes(s) ||
        e.profile?.full_name?.toLowerCase().includes(s) ||
        e.profile?.username?.toLowerCase().includes(s) ||
        e.profile?.account_number?.toLowerCase().includes(s)
      );
    });
  }, [events, search, typeFilter]);

  // Stats
  const stats = useMemo(() => {
    if (!filtered) return { total: 0, upgrades: 0, downgrades: 0, trials: 0 };
    let upgrades = 0, downgrades = 0, trials = 0;
    for (const e of filtered) {
      const t = getEventType(e.previous_tier, e.new_tier, e.reason);
      if (t === "upgrade") upgrades++;
      else if (t === "downgrade") downgrades++;
      else if (t === "trial") trials++;
    }
    return { total: filtered.length, upgrades, downgrades, trials };
  }, [filtered]);

  // Group by date
  const grouped = useMemo(() => {
    return filtered?.reduce<Record<string, TimelineEvent[]>>((acc, event) => {
      const dateKey = format(new Date(event.created_at), "yyyy-MM-dd");
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(event);
      return acc;
    }, {}) || {};
  }, [filtered]);

  const { exportData, isExporting } = useAdminExport();
  const handleExport = useCallback((fmt: "csv" | "json") => {
    const rows = (filtered || []).map(e => ({
      date: format(new Date(e.created_at), "yyyy-MM-dd HH:mm"),
      user: e.profile?.full_name || e.profile?.username || e.user_id.slice(0, 8),
      account: e.profile?.account_number || "",
      previous_tier: e.previous_tier || "basic",
      new_tier: e.new_tier,
      type: getEventType(e.previous_tier, e.new_tier, e.reason),
      reason: e.reason || "",
    }));
    exportData(rows, [
      { key: "date", label: "Date" },
      { key: "user", label: "User" },
      { key: "account", label: "Account" },
      { key: "previous_tier", label: "Previous Tier" },
      { key: "new_tier", label: "New Tier" },
      { key: "type", label: "Event Type" },
      { key: "reason", label: "Reason" },
    ], { filename: "membership-lifecycle-timeline", format: fmt });
  }, [filtered, exportData]);

  return (
    <div className="space-y-4">
      {/* KPI Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-4 text-center">
          <AnimatedCounter value={stats.total} className="text-2xl font-bold" />
          <p className="text-xs text-muted-foreground mt-1">{isAr ? "إجمالي الأحداث" : "Total Events"}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <AnimatedCounter value={stats.upgrades} className="text-2xl font-bold text-primary" />
          <p className="text-xs text-muted-foreground mt-1">{isAr ? "ترقيات" : "Upgrades"}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <AnimatedCounter value={stats.downgrades} className="text-2xl font-bold text-destructive" />
          <p className="text-xs text-muted-foreground mt-1">{isAr ? "تخفيضات" : "Downgrades"}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <AnimatedCounter value={stats.trials} className="text-2xl font-bold text-chart-4" />
          <p className="text-xs text-muted-foreground mt-1">{isAr ? "تجارب" : "Trials"}</p>
        </CardContent></Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={isAr ? "بحث بالاسم أو رقم الحساب..." : "Search by name, account, reason..."}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="ps-9"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder={isAr ? "النوع" : "Event Type"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{isAr ? "الكل" : "All Types"}</SelectItem>
            {Object.entries(eventConfig).map(([key, cfg]) => (
              <SelectItem key={key} value={key}>{isAr ? cfg.labelAr : cfg.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <AdminExportButton onExport={handleExport} isExporting={isExporting} />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
      ) : Object.keys(grouped).length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>{isAr ? "لا يوجد سجل" : "No timeline events"}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="relative">
          <div className="absolute start-6 top-0 bottom-0 w-px bg-border" />
          <div className="space-y-6">
            {Object.entries(grouped).map(([date, dayEvents]) => (
              <div key={date}>
                <div className="relative flex items-center gap-3 mb-3">
                  <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full border-2 border-border bg-background">
                    <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <Badge variant="outline" className="text-xs font-medium">
                    {format(new Date(date), isAr ? "d MMMM yyyy" : "MMM d, yyyy", { locale: isAr ? ar : undefined })}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {dayEvents.length} {isAr ? "حدث" : "events"}
                  </Badge>
                </div>

                <div className="space-y-2 ms-6 ps-6 border-s border-border">
                  {dayEvents.map(event => {
                    const type = getEventType(event.previous_tier, event.new_tier, event.reason);
                    const config = eventConfig[type];
                    const Icon = config.icon;
                    const prevLabel = tierLabels[event.previous_tier || "basic"];
                    const newLabel = tierLabels[event.new_tier] || tierLabels.basic;

                    return (
                      <div key={event.id} className="flex items-start gap-3 rounded-xl border p-3 bg-card hover:bg-accent/50 transition-colors">
                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${config.bgColor}`}>
                          <Icon className={`h-4 w-4 ${config.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={event.profile?.avatar_url || undefined} />
                              <AvatarFallback className="text-xs">
                                {(event.profile?.full_name || "?").charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium truncate">
                              {event.profile?.full_name || event.profile?.username || event.user_id.slice(0, 8)}
                            </span>
                            {event.profile?.account_number && (
                              <span className="text-xs text-muted-foreground font-mono">{event.profile.account_number}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-wrap mt-1">
                            <Badge variant="outline" className="text-xs">
                              {isAr ? config.labelAr : config.label}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {isAr ? prevLabel.ar : prevLabel.en} → {isAr ? newLabel.ar : newLabel.en}
                            </span>
                          </div>
                          {event.reason && (
                            <p className="text-xs text-muted-foreground mt-1 truncate">{event.reason}</p>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {format(new Date(event.created_at), "HH:mm")}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Load more */}
          {(events?.length || 0) >= limit && (
            <div className="flex justify-center mt-6">
              <Button variant="outline" size="sm" onClick={() => setLimit(l => l + PAGE_SIZE)} className="gap-2">
                <ChevronDown className="h-4 w-4" />
                {isAr ? "تحميل المزيد" : "Load More"}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

export default MembershipLifecycleTimeline;
