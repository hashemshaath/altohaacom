import { memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCSVExport } from "@/hooks/useCSVExport";
import {
  TrendingUp, Ticket, DollarSign, Users, CheckCircle2,
  Download, BarChart3, Clock, XCircle,
} from "lucide-react";
import { format } from "date-fns";
import { AnimatedCounter } from "@/components/ui/animated-counter";

interface Props {
  exhibitionId: string;
  exhibitionTitle: string;
  isAr: boolean;
}

export function OrganizerSalesReport({ exhibitionId, exhibitionTitle, isAr }: Props) {
  const t = (en: string, ar: string) => isAr ? ar : en;

  const { data, isLoading } = useQuery({
    queryKey: ["organizer-sales-report", exhibitionId],
    queryFn: async () => {
      const { data: tickets, error } = await supabase
        .from("exhibition_tickets")
        .select("id, ticket_number, status, attendee_name, attendee_email, attendee_phone, checked_in_at, created_at, price_paid, ticket_type")
        .eq("exhibition_id", exhibitionId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const all = tickets || [];

      const confirmed = all.filter(t => t.status === "confirmed");
      const checkedIn = all.filter(t => t.checked_in_at);
      const pending = all.filter(t => t.status === "pending");
      const cancelled = all.filter(t => t.status === "cancelled");

      // Revenue calculation
      const totalRevenue = confirmed.reduce((s, t) => {
        const price = parseFloat((t as any).price_paid || "0");
        return s + price;
      }, 0);

      // Daily breakdown (last 14 days)
      const dailyMap = new Map<string, number>();
      for (const tk of all) {
        const day = format(new Date(tk.created_at), "yyyy-MM-dd");
        dailyMap.set(day, (dailyMap.get(day) || 0) + 1);
      }

      return {
        all,
        confirmed: confirmed.length,
        checkedIn: checkedIn.length,
        pending: pending.length,
        cancelled: cancelled.length,
        totalRevenue,
        checkinRate: confirmed.length > 0 ? Math.round((checkedIn.length / confirmed.length) * 100) : 0,
        dailyBreakdown: Array.from(dailyMap.entries()).sort((a, b) => a[0].localeCompare(b[0])),
      };
    },
    staleTime: 1000 * 60 * 2,
  });

  const { exportCSV } = useCSVExport({
    columns: [
      { header: t("Ticket Number", "رقم التذكرة"), accessor: (r: any) => r.ticket_number },
      { header: t("Name", "الاسم"), accessor: (r: any) => r.attendee_name },
      { header: t("Email", "البريد"), accessor: (r: any) => r.attendee_email },
      { header: t("Phone", "الهاتف"), accessor: (r: any) => r.attendee_phone },
      { header: t("Status", "الحالة"), accessor: (r: any) => r.status },
      { header: t("Ticket Type", "نوع التذكرة"), accessor: (r: any) => r.ticket_type },
      { header: t("Check-in", "الدخول"), accessor: (r: any) => r.checked_in_at ? format(new Date(r.checked_in_at), "yyyy-MM-dd HH:mm") : "" },
      { header: t("Booked", "الحجز"), accessor: (r: any) => format(new Date(r.created_at), "yyyy-MM-dd HH:mm") },
    ],
    filename: `${exhibitionTitle}_tickets`,
  });

  if (isLoading) return null;

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: t("Total Tickets", "إجمالي التذاكر"), value: data?.all.length || 0, icon: Ticket, color: "text-primary" },
          { label: t("Confirmed", "مؤكدة"), value: data?.confirmed || 0, icon: CheckCircle2, color: "text-chart-3" },
          { label: t("Checked In", "حضروا"), value: data?.checkedIn || 0, icon: Users, color: "text-chart-2" },
          { label: t("Check-in Rate", "نسبة الحضور"), value: `${data?.checkinRate || 0}%`, icon: BarChart3, color: "text-chart-4" },
          { label: t("Pending", "معلقة"), value: data?.pending || 0, icon: Clock, color: "text-muted-foreground" },
        ].map(s => (
          <Card key={s.label} className="border-border/40">
            <CardContent className="p-3 flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-muted/60 shrink-0">
                <s.icon className={`h-4 w-4 ${s.color}`} />
              </div>
              <div>
                <p className={`text-base font-bold ${s.color}`}>{typeof s.value === "number" ? <AnimatedCounter value={s.value} /> : s.value}</p>
                <p className="text-[9px] text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Export Button */}
      <div className="flex justify-end">
        <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={() => data && exportCSV(data.all)}>
          <Download className="h-3.5 w-3.5" />
          {t("Export Attendees CSV", "تصدير الحضور CSV")}
        </Button>
      </div>

      {/* Recent Tickets */}
      <Card className="border-border/40">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs">{t("Recent Tickets", "آخر التذاكر")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="max-h-60">
            <div className="space-y-1.5">
              {data?.all.slice(0, 15).map((tk: any) => (
                <div key={tk.id} className="flex items-center justify-between p-2 rounded-xl bg-muted/20 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    {tk.checked_in_at ? (
                      <CheckCircle2 className="h-3 w-3 text-chart-3 shrink-0" />
                    ) : tk.status === "cancelled" ? (
                      <XCircle className="h-3 w-3 text-destructive shrink-0" />
                    ) : (
                      <Ticket className="h-3 w-3 text-muted-foreground shrink-0" />
                    )}
                    <span className="font-mono font-medium truncate">{tk.ticket_number}</span>
                    <span className="text-muted-foreground truncate">{tk.attendee_name || tk.attendee_email || ""}</span>
                  </div>
                  <Badge variant="secondary" className="text-[8px] shrink-0">
                    {tk.checked_in_at ? t("In", "دخل") : tk.status}
                  </Badge>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

export default OrganizerSalesReport;
