import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Ticket, CheckCircle2, Clock, TrendingUp, BarChart3 } from "lucide-react";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { startOfDay, subDays } from "date-fns";

export function ExhibitionTicketStatsWidget() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data, isLoading } = useQuery({
    queryKey: ["admin-ticket-analytics"],
    queryFn: async () => {
      const today = startOfDay(new Date()).toISOString();
      const week = startOfDay(subDays(new Date(), 7)).toISOString();

      const r0 = await supabase.from("exhibition_tickets").select("*", { count: "exact", head: true });
      const r1 = await supabase.from("exhibition_tickets").select("*", { count: "exact", head: true }).eq("status", "confirmed");
      const r2 = await supabase.from("exhibition_tickets").select("*", { count: "exact", head: true }).not("checked_in_at", "is", null);
      const r3 = await supabase.from("exhibition_tickets").select("*", { count: "exact", head: true }).eq("status", "pending");
      const r4 = await supabase.from("exhibition_tickets").select("*", { count: "exact", head: true }).gte("created_at", today);
      const r5 = await supabase.from("exhibition_tickets").select("*", { count: "exact", head: true }).gte("created_at", week);
      const r6 = await supabase.from("exhibition_tickets")
        .select("id, ticket_number, attendee_name, status, created_at")
        .order("created_at", { ascending: false })
        .limit(5);

      const totalTickets = r0.count || 0;
      const confirmedTickets = r1.count || 0;
      const checkedIn = r2.count || 0;
      const pendingPayment = r3.count || 0;
      const ticketsToday = r4.count || 0;
      const ticketsWeek = r5.count || 0;
      const recentTickets = r6.data || [];
      const checkinRate = confirmedTickets ? Math.round((checkedIn / confirmedTickets) * 100) : 0;

      return { totalTickets, confirmedTickets, checkedIn, pendingPayment, ticketsToday, ticketsWeek, checkinRate, recentTickets };
    },
    staleTime: 1000 * 60 * 2,
  });

  if (isLoading) return <Skeleton className="h-64 w-full rounded-xl" />;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Ticket className="h-4 w-4 text-primary" />
          {isAr ? "تحليلات التذاكر" : "Ticket Analytics"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { icon: Ticket, label: isAr ? "إجمالي" : "Total", value: data?.totalTickets, color: "text-primary" },
            { icon: CheckCircle2, label: isAr ? "حضور" : "Check-ins", value: data?.checkedIn, color: "text-chart-3" },
            { icon: TrendingUp, label: isAr ? "اليوم" : "Today", value: data?.ticketsToday, color: "text-chart-2" },
            { icon: Clock, label: isAr ? "معلقة" : "Pending", value: data?.pendingPayment, color: "text-chart-4" },
          ].map((m, i) => (
            <div key={i} className="text-center p-2 rounded-xl bg-muted/30">
              <m.icon className={`h-3.5 w-3.5 mx-auto mb-1 ${m.color}`} />
              <p className="text-sm font-bold"><AnimatedCounter value={m.value || 0} /></p>
              <p className="text-[9px] text-muted-foreground">{m.label}</p>
            </div>
          ))}
        </div>

        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-muted-foreground flex items-center gap-1">
              <BarChart3 className="h-3 w-3" />
              {isAr ? "معدل الحضور" : "Check-in Rate"}
            </span>
            <span className="font-medium">{data?.checkedIn}/{data?.confirmedTickets} ({data?.checkinRate}%)</span>
          </div>
          <Progress value={data?.checkinRate || 0} className="h-1.5" />
        </div>

        <div className="flex items-center justify-between text-xs px-2 py-1.5 rounded bg-muted/20">
          <span className="text-muted-foreground">{isAr ? "تذاكر هذا الأسبوع" : "This Week"}</span>
          <Badge variant="secondary" className="text-[10px]">{data?.ticketsWeek}</Badge>
        </div>

        {data?.recentTickets && data.recentTickets.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">{isAr ? "آخر التذاكر" : "Recent Tickets"}</p>
            {data.recentTickets.map((t: any) => (
              <div key={t.id} className="flex items-center justify-between text-[11px] p-1.5 rounded bg-muted/20">
                <div className="truncate flex-1">
                  <span className="font-mono font-medium">{t.ticket_number}</span>
                  {t.attendee_name && <span className="text-muted-foreground ms-2">• {t.attendee_name}</span>}
                </div>
                <Badge
                  variant={t.status === "confirmed" ? "default" : "secondary"}
                  className="text-[9px] px-1.5 py-0 shrink-0 ms-2"
                >
                  {t.status === "confirmed" ? (isAr ? "مؤكد" : "OK") : (isAr ? "معلق" : "Pending")}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
