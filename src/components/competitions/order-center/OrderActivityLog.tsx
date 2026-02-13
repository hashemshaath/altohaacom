import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Activity, Plus, Minus, RefreshCw, Truck, Send, FileText,
  Lightbulb, CheckSquare, Calendar, ListPlus, Edit, PackageCheck,
  Clock, Filter,
} from "lucide-react";
import { useState, useEffect } from "react";
import { ACTION_LABELS } from "./orderActivityLogger";
import { formatDistanceToNow } from "date-fns";

interface Props {
  competitionId: string;
  isOrganizer?: boolean;
}

const ICON_MAP: Record<string, React.ComponentType<any>> = {
  plus: Plus,
  minus: Minus,
  refresh: RefreshCw,
  truck: Truck,
  "truck-off": Truck,
  send: Send,
  file: FileText,
  lightbulb: Lightbulb,
  check: CheckSquare,
  "check-square": CheckSquare,
  calendar: Calendar,
  list: ListPlus,
  edit: Edit,
  "package-check": PackageCheck,
};

const ENTITY_COLORS: Record<string, string> = {
  item: "bg-primary/10 text-primary",
  list: "bg-chart-1/10 text-chart-1",
  quote: "bg-chart-4/10 text-chart-4",
  suggestion: "bg-chart-5/10 text-chart-5",
  vendor: "bg-chart-3/10 text-chart-3",
};

export function OrderActivityLog({ competitionId }: Props) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [filterAction, setFilterAction] = useState<string>("all");
  const [filterEntity, setFilterEntity] = useState<string>("all");

  const { data: logs, isLoading } = useQuery({
    queryKey: ["order-activity-log", competitionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("order_activity_log" as any)
        .select("*")
        .eq("competition_id", competitionId)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as any[];
    },
  });

  // Subscribe to realtime updates
  useEffect(() => {
    const channel = supabase
      .channel("order-activity-" + competitionId)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "order_activity_log",
        filter: `competition_id=eq.${competitionId}`,
      }, () => {
        // Refetch on new entries
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [competitionId]);

  // Get user profiles for display
  const userIds = [...new Set(logs?.map(l => l.user_id) || [])];
  const { data: profiles } = useQuery({
    queryKey: ["activity-profiles", userIds.join(",")],
    queryFn: async () => {
      if (!userIds.length) return [];
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, full_name, username")
        .in("user_id", userIds);
      if (error) throw error;
      return data;
    },
    enabled: userIds.length > 0,
  });

  const filteredLogs = (logs || []).filter(log => {
    if (filterAction !== "all" && log.action_type !== filterAction) return false;
    if (filterEntity !== "all" && log.entity_type !== filterEntity) return false;
    return true;
  });

  const getProfileName = (userId: string) => {
    const profile = profiles?.find(p => p.user_id === userId);
    return profile?.full_name || profile?.username || "—";
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with filters */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          <h4 className="text-sm font-semibold">{isAr ? "سجل النشاطات" : "Activity Log"}</h4>
          {logs?.length ? (
            <Badge variant="secondary" className="text-[10px]">{logs.length}</Badge>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-muted-foreground" />
          <Select value={filterEntity} onValueChange={setFilterEntity}>
            <SelectTrigger className="h-7 w-28 text-[10px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">{isAr ? "الكل" : "All Types"}</SelectItem>
              <SelectItem value="item" className="text-xs">{isAr ? "عنصر" : "Item"}</SelectItem>
              <SelectItem value="list" className="text-xs">{isAr ? "قائمة" : "List"}</SelectItem>
              <SelectItem value="quote" className="text-xs">{isAr ? "عرض سعر" : "Quote"}</SelectItem>
              <SelectItem value="suggestion" className="text-xs">{isAr ? "اقتراح" : "Suggestion"}</SelectItem>
              <SelectItem value="vendor" className="text-xs">{isAr ? "مورد" : "Vendor"}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Activity entries */}
      {!filteredLogs.length ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Activity className="mx-auto mb-3 h-12 w-12 text-muted-foreground/30" />
            <p className="text-muted-foreground">{isAr ? "لا توجد نشاطات مسجلة بعد" : "No activity recorded yet"}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {isAr ? "ستظهر هنا جميع التغييرات والإجراءات" : "All changes and actions will appear here"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-1">
          {filteredLogs.map((log) => {
            const actionInfo = ACTION_LABELS[log.action_type] || { en: log.action_type, ar: log.action_type, icon: "refresh" };
            const IconComponent = ICON_MAP[actionInfo.icon] || RefreshCw;
            const entityColor = ENTITY_COLORS[log.entity_type] || "bg-muted text-muted-foreground";
            const details = (log.details || {}) as Record<string, any>;
            const detailText = details.item_name || details.list_title || details.company_name || details.note || "";

            return (
              <Card key={log.id} className="border-border/40">
                <CardContent className="flex items-start gap-3 p-3">
                  <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${entityColor}`}>
                    <IconComponent className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <span className="font-medium">{getProfileName(log.user_id)}</span>
                      {" "}
                      <span className="text-muted-foreground">
                        {isAr ? actionInfo.ar : actionInfo.en}
                      </span>
                    </p>
                    {detailText && (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{detailText}</p>
                    )}
                    {details.from_status && details.to_status && (
                      <div className="flex items-center gap-1 mt-1 text-[10px]">
                        <Badge variant="outline" className="text-[9px] h-4">{details.from_status}</Badge>
                        <span className="text-muted-foreground">→</span>
                        <Badge variant="outline" className="text-[9px] h-4">{details.to_status}</Badge>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Badge variant="outline" className={`text-[9px] h-4 ${entityColor}`}>
                      {log.entity_type}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
