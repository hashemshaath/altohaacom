import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCSVExport } from "@/hooks/useCSVExport";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Activity, Download, UserPlus, UserMinus, RefreshCw } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { ar as arLocale } from "date-fns/locale";

interface Props {
  isAr: boolean;
  t: (en: string, ar: string) => string;
}

const ACTION_ICONS: Record<string, typeof Activity> = {
  assign_role: UserPlus,
  remove_role: UserMinus,
  change_membership: RefreshCw,
};

export default function ActivityTab({ isAr, t }: Props) {
  const { data: recentChanges = [], isLoading } = useQuery({
    queryKey: ["roleActivityLog"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_actions")
        .select("id, admin_id, action_type, target_user_id, details, created_at")
        .in("action_type", ["assign_role", "remove_role", "change_membership"])
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60,
  });

  const { exportCSV } = useCSVExport({
    columns: [
      { header: t("Action", "الإجراء"), accessor: (r: any) => r.action_type?.replace(/_/g, " ") || "" },
      { header: t("Details", "التفاصيل"), accessor: (r: any) => r.details ? JSON.stringify(r.details) : "" },
      { header: t("Date", "التاريخ"), accessor: (r: any) => format(new Date(r.created_at), "yyyy-MM-dd HH:mm") },
    ],
    filename: "role-activity-log",
  });

  const actionLabels: Record<string, { en: string; ar: string }> = {
    assign_role: { en: "Role Assigned", ar: "تعيين دور" },
    remove_role: { en: "Role Removed", ar: "إزالة دور" },
    change_membership: { en: "Membership Changed", ar: "تغيير العضوية" },
  };

  return (
    <Card className="rounded-2xl border-border/40">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              {t("Role Change Activity Log", "سجل تغييرات الأدوار")}
              {recentChanges.length > 0 && <Badge variant="secondary" className="text-[10px]">{recentChanges.length}</Badge>}
            </CardTitle>
            <CardDescription className="text-xs">
              {t("Last 50 role and permission changes", "آخر 50 تغيير في الأدوار والصلاحيات")}
            </CardDescription>
          </div>
          {recentChanges.length > 0 && (
            <Button variant="outline" size="sm" className="gap-1.5 rounded-xl" onClick={() => exportCSV(recentChanges)}>
              <Download className="h-3.5 w-3.5" />{t("Export", "تصدير")}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : recentChanges.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-muted-foreground">
            <Activity className="h-8 w-8 mb-2 opacity-30" />
            <p className="text-sm">{t("No changes recorded", "لا توجد تغييرات")}</p>
          </div>
        ) : (
          <ScrollArea className="max-h-[500px]">
            <div className="space-y-2">
              {recentChanges.map((change: any) => {
                const ActionIcon = ACTION_ICONS[change.action_type] || Activity;
                const label = actionLabels[change.action_type];
                const isRemoval = change.action_type === "remove_role";
                return (
                  <div key={change.id} className="flex items-center gap-3 rounded-xl border border-border/40 p-3 hover:bg-muted/20 transition-colors">
                    <div className={`rounded-xl p-2 shrink-0 ${isRemoval ? "bg-destructive/10" : "bg-primary/10"}`}>
                      <ActionIcon className={`h-3.5 w-3.5 ${isRemoval ? "text-destructive" : "text-primary"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold">
                        {label ? (isAr ? label.ar : label.en) : change.action_type.replace(/_/g, " ")}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {change.details
                          ? typeof change.details === "object"
                            ? Object.entries(change.details).map(([k, v]) => `${k}: ${v}`).join(" · ")
                            : String(change.details)
                          : "—"}
                      </p>
                    </div>
                    <div className="text-end shrink-0">
                      <p className="text-[10px] text-muted-foreground whitespace-nowrap" dir="ltr">
                        {format(new Date(change.created_at), "MMM d, HH:mm")}
                      </p>
                      <p className="text-[9px] text-muted-foreground/60">
                        {formatDistanceToNow(new Date(change.created_at), { addSuffix: true, locale: isAr ? arLocale : undefined })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
