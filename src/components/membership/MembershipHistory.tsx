import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowUpCircle, ArrowDownCircle, Clock, Gift, XCircle, Crown, Star, Zap, History,
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { cn } from "@/lib/utils";

const TIER_CONFIG: Record<string, { icon: any; color: string; label: string; labelAr: string }> = {
  basic: { icon: Zap, color: "text-muted-foreground", label: "Basic", labelAr: "الأساسي" },
  professional: { icon: Star, color: "text-primary", label: "Professional", labelAr: "الاحترافي" },
  enterprise: { icon: Crown, color: "text-chart-2", label: "Enterprise", labelAr: "المؤسسي" },
};

function getActionInfo(reason: string | null, prevTier: string | null, newTier: string | null) {
  const r = (reason || "").toLowerCase();
  if (r.includes("trial") && r.includes("start")) return { icon: Gift, color: "text-chart-4", type: "trial_start" };
  if (r.includes("trial") && r.includes("expir")) return { icon: Clock, color: "text-chart-2", type: "trial_expired" };
  if (r.includes("cancel")) return { icon: XCircle, color: "text-destructive", type: "cancel" };

  const tierOrder = { basic: 0, professional: 1, enterprise: 2 };
  const prev = tierOrder[(prevTier || "basic") as keyof typeof tierOrder] ?? 0;
  const next = tierOrder[(newTier || "basic") as keyof typeof tierOrder] ?? 0;
  if (next > prev) return { icon: ArrowUpCircle, color: "text-primary", type: "upgrade" };
  if (next < prev) return { icon: ArrowDownCircle, color: "text-chart-2", type: "downgrade" };
  return { icon: History, color: "text-muted-foreground", type: "change" };
}

export function MembershipHistory() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { user } = useAuth();

  const { data: history, isLoading } = useQuery({
    queryKey: ["membership-history", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("membership_history")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader><Skeleton className="h-5 w-40" /></CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
        </CardContent>
      </Card>
    );
  }

  if (!history || history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <History className="h-4 w-4 text-primary" />
            {isAr ? "سجل العضوية" : "Membership History"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-6">
            {isAr ? "لا توجد تغييرات بعد" : "No membership changes yet"}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <History className="h-4 w-4 text-primary" />
          {isAr ? "سجل العضوية" : "Membership History"}
          <Badge variant="secondary" className="text-[10px] ms-auto">
            {history.length} {isAr ? "تغيير" : "changes"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="max-h-[400px]">
          <div className="divide-y">
            {history.map((entry, idx) => {
              const action = getActionInfo(entry.reason, entry.previous_tier, entry.new_tier);
              const ActionIcon = action.icon;
              const prevConfig = TIER_CONFIG[entry.previous_tier || "basic"] || TIER_CONFIG.basic;
              const newConfig = TIER_CONFIG[entry.new_tier || "basic"] || TIER_CONFIG.basic;
              const PrevIcon = prevConfig.icon;
              const NewIcon = newConfig.icon;

              return (
                <div key={entry.id} className="flex items-start gap-3 px-5 py-3.5 hover:bg-muted/30 transition-colors">
                  {/* Timeline dot */}
                  <div className="flex flex-col items-center pt-0.5">
                    <div className={cn("flex h-8 w-8 items-center justify-center rounded-full bg-muted/50", action.color)}>
                      <ActionIcon className="h-4 w-4" />
                    </div>
                    {idx < history.length - 1 && (
                      <div className="w-px h-full min-h-[16px] bg-border mt-1" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    {/* Tier change badges */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Badge variant="outline" className={cn("text-[10px] gap-1", prevConfig.color)}>
                        <PrevIcon className="h-3 w-3" />
                        {isAr ? prevConfig.labelAr : prevConfig.label}
                      </Badge>
                      <span className="text-muted-foreground text-xs">→</span>
                      <Badge variant="secondary" className={cn("text-[10px] gap-1", newConfig.color)}>
                        <NewIcon className="h-3 w-3" />
                        {isAr ? newConfig.labelAr : newConfig.label}
                      </Badge>
                    </div>

                    {/* Reason */}
                    {entry.reason && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{entry.reason}</p>
                    )}

                    {/* Date */}
                    <p className="text-[10px] text-muted-foreground/70">
                      {format(new Date(entry.created_at), "PPp", { locale: isAr ? ar : undefined })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
