import { memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ArrowUpCircle, ArrowDownCircle, RefreshCw, UserPlus, XCircle,
  ShieldAlert, Clock, Gift, Zap, Search, CalendarDays
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { useState } from "react";

interface TimelineEvent {
  id: string;
  user_id: string;
  previous_tier: string | null;
  new_tier: string;
  reason: string | null;
  created_at: string;
  changed_by: string | null;
}

const TIER_ORDER: Record<string, number> = { basic: 0, professional: 1, enterprise: 2 };

function getEventType(prev: string | null, next: string, reason?: string | null) {
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

const MembershipLifecycleTimeline = memo(function MembershipLifecycleTimeline() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [search, setSearch] = useState("");

  const { data: events, isLoading } = useQuery({
    queryKey: ["membership-lifecycle-timeline"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("membership_history")
        .select("id, user_id, previous_tier, new_tier, reason, created_at, changed_by")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as TimelineEvent[];
    },
  });

  const filtered = events?.filter(e => {
    if (!search) return true;
    return (
      e.user_id.toLowerCase().includes(search.toLowerCase()) ||
      e.reason?.toLowerCase().includes(search.toLowerCase()) ||
      e.new_tier.toLowerCase().includes(search.toLowerCase())
    );
  });

  // Group by date
  const grouped = filtered?.reduce<Record<string, TimelineEvent[]>>((acc, event) => {
    const dateKey = format(new Date(event.created_at), "yyyy-MM-dd");
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(event);
    return acc;
  }, {}) || {};

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={isAr ? "بحث في السجل..." : "Search timeline..."}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="ps-9"
        />
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
          {/* Vertical line */}
          <div className="absolute start-6 top-0 bottom-0 w-px bg-border" />

          <div className="space-y-6">
            {Object.entries(grouped).map(([date, dayEvents]) => (
              <div key={date}>
                {/* Date header */}
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

                {/* Events for this date */}
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
                            <Badge variant="outline" className="text-[10px]">
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
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          {format(new Date(event.created_at), "HH:mm")}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

export default MembershipLifecycleTimeline;
