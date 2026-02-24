import { useEffect, useState, memo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Activity, TrendingUp, Users, Ticket } from "lucide-react";

interface Props {
  exhibitionId: string;
  initialTickets: number;
  initialCheckins: number;
  isAr: boolean;
}

export const ExhibitionRealtimeStats = memo(function ExhibitionRealtimeStats({
  exhibitionId, initialTickets, initialCheckins, isAr,
}: Props) {
  const t = (en: string, ar: string) => isAr ? ar : en;
  const [tickets, setTickets] = useState(initialTickets);
  const [checkins, setCheckins] = useState(initialCheckins);
  const [recentAction, setRecentAction] = useState<string | null>(null);

  useEffect(() => {
    setTickets(initialTickets);
    setCheckins(initialCheckins);
  }, [initialTickets, initialCheckins]);

  useEffect(() => {
    const channel = supabase
      .channel(`exhibition-tickets-${exhibitionId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "exhibition_tickets",
          filter: `exhibition_id=eq.${exhibitionId}`,
        },
        () => {
          setTickets((p) => p + 1);
          setRecentAction(t("New ticket booked!", "تم حجز تذكرة جديدة!"));
          setTimeout(() => setRecentAction(null), 3000);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "exhibition_tickets",
          filter: `exhibition_id=eq.${exhibitionId}`,
        },
        (payload) => {
          if (payload.new && (payload.new as any).checked_in_at && !(payload.old as any)?.checked_in_at) {
            setCheckins((p) => p + 1);
            setRecentAction(t("Someone just checked in!", "شخص ما قام بتسجيل الدخول!"));
            setTimeout(() => setRecentAction(null), 3000);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [exhibitionId]);

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="flex items-center gap-1.5">
        <div className="flex h-2 w-2 rounded-full bg-chart-3 animate-pulse" />
        <span className="text-[10px] font-medium text-muted-foreground">{t("Live", "مباشر")}</span>
      </div>
      
      <Badge variant="outline" className="gap-1 text-[10px] py-0.5">
        <Ticket className="h-2.5 w-2.5" />
        {tickets} {t("tickets", "تذكرة")}
      </Badge>

      <Badge variant="outline" className="gap-1 text-[10px] py-0.5">
        <Users className="h-2.5 w-2.5" />
        {checkins} {t("checked in", "حضور")}
      </Badge>

      {tickets > 0 && (
        <Badge variant="outline" className="gap-1 text-[10px] py-0.5 text-chart-3 border-chart-3/30">
          <TrendingUp className="h-2.5 w-2.5" />
          {Math.round((checkins / tickets) * 100)}%
        </Badge>
      )}

      {recentAction && (
        <Badge className="bg-chart-3/10 text-chart-3 border-chart-3/20 text-[10px] animate-in fade-in slide-in-from-left-2 duration-300">
          <Activity className="h-2.5 w-2.5 me-1" />
          {recentAction}
        </Badge>
      )}
    </div>
  );
});
