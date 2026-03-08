import { memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { History, CheckCircle2, Pencil, Trash2, Eye, Plus, UserCheck, Ticket } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

export function ExhibitionActivityLog() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const t = (en: string, ar: string) => isAr ? ar : en;

  const { data: actions = [] } = useQuery({
    queryKey: ["admin-exhibition-activity"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_actions")
        .select("id, action_type, created_at")
        .or("action_type.ilike.%exhibition%,action_type.eq.approve_exhibition,action_type.eq.reject_exhibition")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60,
  });

  const { data: recentTickets = [] } = useQuery({
    queryKey: ["admin-recent-exhibition-tickets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exhibition_tickets")
        .select("id, ticket_number, attendee_name, status, created_at, exhibition_id")
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 30,
  });

  const getActionIcon = (type: string) => {
    if (type.includes("approve")) return <CheckCircle2 className="h-3 w-3 text-chart-3" />;
    if (type.includes("reject")) return <Trash2 className="h-3 w-3 text-destructive" />;
    if (type.includes("create")) return <Plus className="h-3 w-3 text-primary" />;
    if (type.includes("update") || type.includes("edit")) return <Pencil className="h-3 w-3 text-chart-4" />;
    return <Eye className="h-3 w-3 text-muted-foreground" />;
  };

  const getActionLabel = (type: string) => {
    const labels: Record<string, string> = {
      approve_exhibition: t("Approved", "تمت الموافقة"),
      reject_exhibition: t("Rejected", "تم الرفض"),
      create_exhibition: t("Created", "تم الإنشاء"),
      update_exhibition: t("Updated", "تم التحديث"),
      delete_exhibition: t("Deleted", "تم الحذف"),
    };
    return labels[type] || type;
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <History className="h-4 w-4 text-primary" />
          {t("Activity Log", "سجل النشاط")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[280px]">
          <div className="space-y-1.5">
            {/* Recent tickets */}
            {recentTickets.map((ticket: any) => (
              <div key={ticket.id} className="flex items-center gap-2 rounded-xl bg-muted/30 px-3 py-2">
                <Ticket className="h-3 w-3 text-chart-2 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-medium truncate">
                    {t("New ticket", "تذكرة جديدة")}: {ticket.ticket_number}
                  </p>
                  <p className="text-[9px] text-muted-foreground">
                    {ticket.attendee_name || t("Anonymous", "مجهول")} • {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
                  </p>
                </div>
                <Badge variant="outline" className="text-[8px] shrink-0">{ticket.status}</Badge>
              </div>
            ))}

            {/* Admin actions */}
            {actions.map((action: any) => (
              <div key={action.id} className="flex items-center gap-2 rounded-xl bg-muted/30 px-3 py-2">
                {getActionIcon(action.action_type)}
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-medium truncate">{getActionLabel(action.action_type)}</p>
                  <p className="text-[9px] text-muted-foreground">
                    {formatDistanceToNow(new Date(action.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}

            {actions.length === 0 && recentTickets.length === 0 && (
              <p className="py-8 text-center text-xs text-muted-foreground">
                {t("No recent activity", "لا يوجد نشاط حديث")}
              </p>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
