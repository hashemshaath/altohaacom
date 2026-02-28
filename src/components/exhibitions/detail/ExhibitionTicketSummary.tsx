import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Ticket, Users, CheckCircle2, TrendingUp, Clock, CreditCard } from "lucide-react";

interface Props {
  exhibitionId: string;
  maxAttendees?: number | null;
  isAr: boolean;
}

export function ExhibitionTicketSummary({ exhibitionId, maxAttendees, isAr }: Props) {
  const t = (en: string, ar: string) => isAr ? ar : en;

  const { data } = useQuery({
    queryKey: ["exhibition-ticket-summary", exhibitionId],
    queryFn: async () => {
      const [confirmed, pending, checkedIn, today] = await Promise.all([
        supabase.from("exhibition_tickets").select("id", { count: "exact", head: true }).eq("exhibition_id", exhibitionId).eq("status", "confirmed"),
        supabase.from("exhibition_tickets").select("id", { count: "exact", head: true }).eq("exhibition_id", exhibitionId).eq("status", "pending"),
        supabase.from("exhibition_tickets").select("id", { count: "exact", head: true }).eq("exhibition_id", exhibitionId).not("checked_in_at", "is", null),
        supabase.from("exhibition_tickets").select("id", { count: "exact", head: true }).eq("exhibition_id", exhibitionId).gte("created_at", new Date(new Date().setHours(0,0,0,0)).toISOString()),
      ]);

      const total = (confirmed.count || 0) + (pending.count || 0);
      const checkInRate = total > 0 ? Math.round(((checkedIn.count || 0) / total) * 100) : 0;
      const occupancy = maxAttendees ? Math.round(((confirmed.count || 0) / maxAttendees) * 100) : null;

      return {
        confirmed: confirmed.count || 0,
        pending: pending.count || 0,
        checkedIn: checkedIn.count || 0,
        today: today.count || 0,
        total,
        checkInRate,
        occupancy,
      };
    },
    staleTime: 1000 * 30,
    refetchInterval: 60000,
  });

  if (!data) return null;

  const stats = [
    { icon: Ticket, label: t("Confirmed", "مؤكدة"), value: data.confirmed, color: "text-chart-3" },
    { icon: Clock, label: t("Pending", "معلقة"), value: data.pending, color: "text-chart-4" },
    { icon: CheckCircle2, label: t("Checked In", "حاضر"), value: data.checkedIn, color: "text-primary" },
    { icon: TrendingUp, label: t("Today", "اليوم"), value: data.today, color: "text-chart-2" },
  ];

  return (
    <Card className="overflow-hidden">
      <div className="bg-gradient-to-r from-primary/8 to-transparent px-4 py-2.5 border-b border-border/40">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold flex items-center gap-1.5">
            <Ticket className="h-3.5 w-3.5 text-primary" />
            {t("Ticket Overview", "نظرة عامة على التذاكر")}
          </h4>
          <Badge variant="outline" className="text-[9px]">
            {data.total} {t("total", "إجمالي")}
          </Badge>
        </div>
      </div>
      <CardContent className="p-3 space-y-3">
        <div className="grid grid-cols-4 gap-2">
          {stats.map(s => (
            <div key={s.label} className="text-center">
              <s.icon className={`h-3.5 w-3.5 mx-auto mb-0.5 ${s.color}`} />
              <p className="text-sm font-bold">{s.value}</p>
              <p className="text-[9px] text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Check-in rate */}
        <div>
          <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
            <span>{t("Check-in Rate", "معدل الحضور")}</span>
            <span className="font-semibold">{data.checkInRate}%</span>
          </div>
          <Progress value={data.checkInRate} className="h-1.5" />
        </div>

        {/* Occupancy */}
        {data.occupancy !== null && (
          <div>
            <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
              <span>{t("Capacity", "السعة")}</span>
              <span className="font-semibold">{data.confirmed}/{maxAttendees}</span>
            </div>
            <Progress value={data.occupancy} className={`h-1.5 ${data.occupancy > 90 ? "[&>div]:bg-destructive" : ""}`} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
