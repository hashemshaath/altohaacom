import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle2, AlertCircle, XCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

/**
 * Shows recent admin actions (last 10) for audit visibility.
 */
export function RecentAdminActions() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data: actions = [] } = useQuery({
    queryKey: ["recent-admin-actions"],
    queryFn: async () => {
      const { data } = await supabase
        .from("admin_actions")
        .select("id, action_type, details, created_at")
        .order("created_at", { ascending: false })
        .limit(8);
      return data || [];
    },
    staleTime: 1000 * 60 * 2,
  });

  const getActionIcon = (type: string) => {
    if (type.includes("approve") || type.includes("activate")) return CheckCircle2;
    if (type.includes("reject") || type.includes("ban") || type.includes("delete")) return XCircle;
    if (type.includes("warn") || type.includes("flag")) return AlertCircle;
    return Clock;
  };

  const getActionColor = (type: string) => {
    if (type.includes("approve") || type.includes("activate")) return "text-chart-2";
    if (type.includes("reject") || type.includes("ban") || type.includes("delete")) return "text-destructive";
    if (type.includes("warn") || type.includes("flag")) return "text-chart-4";
    return "text-muted-foreground";
  };

  if (actions.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" />
          {isAr ? "آخر الإجراءات الإدارية" : "Recent Admin Actions"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {actions.map((a: any) => {
            const Icon = getActionIcon(a.action_type);
            const color = getActionColor(a.action_type);
            return (
              <div key={a.id} className="flex items-start gap-2 text-xs">
                <Icon className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${color}`} />
                <div className="min-w-0 flex-1">
                  <span className="font-medium">{a.action_type.replace(/_/g, " ")}</span>
                  <span className="text-muted-foreground ms-1">
                    {formatDistanceToNow(new Date(a.created_at), {
                      addSuffix: true,
                      locale: isAr ? ar : undefined,
                    })}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
