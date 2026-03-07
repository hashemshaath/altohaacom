import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useVisibleRefetchInterval } from "@/hooks/useVisibleRefetchInterval";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Landmark, Calendar, Ticket, Users, MapPin, TrendingUp, Building, Eye } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from "recharts";
import { format, subDays, differenceInDays } from "date-fns";
import { AnimatedCounter } from "@/components/ui/animated-counter";

const COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

export function ExhibitionLiveStatsWidget() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data } = useQuery({
    queryKey: ["exhibitionLiveStats"],
    queryFn: async () => {
      const [exhRes, ticketsRes, boothsRes, followersRes, sponsorsRes] = await Promise.all([
        supabase.from("exhibitions").select("id, title, title_ar, status, start_date, end_date, venue, country, created_at"),
        supabase.from("exhibition_tickets").select("id, exhibition_id, created_at, status, ticket_type"),
        supabase.from("exhibition_booths").select("id, exhibition_id, status, assigned_to"),
        supabase.from("exhibition_followers").select("id, exhibition_id"),
        supabase.from("exhibition_sponsors").select("id, exhibition_id, tier"),
      ]);

      const exhibitions = exhRes.data || [];
      const tickets = ticketsRes.data || [];
      const booths = boothsRes.data || [];
      const followers = followersRes.data || [];
      const sponsors = sponsorsRes.data || [];

      const now = new Date();
      const active = exhibitions.filter(e => e.status === "active");
      const upcoming = active.filter(e => e.start_date && new Date(e.start_date) > now);
      const ongoing = active.filter(e => e.start_date && e.end_date && new Date(e.start_date) <= now && new Date(e.end_date) >= now);

      // Ticket trend 14 days
      const trend: Record<string, number> = {};
      for (let i = 13; i >= 0; i--) {
        trend[format(subDays(now, i), "MM/dd")] = 0;
      }
      tickets.forEach(t => {
        const d = format(new Date(t.created_at), "MM/dd");
        if (d in trend) trend[d]++;
      });
      const ticketTrend = Object.entries(trend).map(([date, count]) => ({ date, count }));

      // Booth utilization
      const totalBooths = booths.length;
      const occupiedBooths = booths.filter(b => b.status === "occupied" || b.assigned_to).length;
      const boothUtilization = totalBooths > 0 ? Math.round((occupiedBooths / totalBooths) * 100) : 0;

      // Sponsor tiers
      const tierMap: Record<string, number> = {};
      sponsors.forEach(s => {
        const t = s.tier || "standard";
        tierMap[t] = (tierMap[t] || 0) + 1;
      });
      const sponsorTiers = Object.entries(tierMap).map(([name, value]) => ({ name, value }));

      // Next event
      const nextEvent = upcoming.sort((a, b) => new Date(a.start_date!).getTime() - new Date(b.start_date!).getTime())[0];
      const daysToNext = nextEvent?.start_date ? differenceInDays(new Date(nextEvent.start_date), now) : null;

      return {
        total: exhibitions.length,
        upcoming: upcoming.length,
        ongoing: ongoing.length,
        totalTickets: tickets.length,
        totalFollowers: followers.length,
        totalSponsors: sponsors.length,
        boothUtilization,
        ticketTrend,
        sponsorTiers,
        nextEvent: nextEvent ? {
          title: isAr ? (nextEvent.title_ar || nextEvent.title) : nextEvent.title,
          daysTo: daysToNext,
        } : null,
      };
    },
    refetchInterval: useVisibleRefetchInterval(60000),
  });

  if (!data) return null;

  const stats = [
    { label: isAr ? "المعارض" : "Exhibitions", value: data.total, icon: Landmark, color: "text-primary" },
    { label: isAr ? "جارية" : "Ongoing", value: data.ongoing, icon: Eye, color: "text-chart-2" },
    { label: isAr ? "قادمة" : "Upcoming", value: data.upcoming, icon: Calendar, color: "text-chart-3" },
    { label: isAr ? "التذاكر" : "Tickets", value: data.totalTickets, icon: Ticket, color: "text-chart-4" },
  ];

  return (
    <Card className="mb-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Landmark className="h-4 w-4 text-primary" />
          {isAr ? "إحصائيات المعارض والفعاليات المباشرة" : "Exhibitions & Events Live Stats"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Next Event Banner */}
        {data.nextEvent && (
          <div className="bg-primary/10 border border-primary/20 rounded-xl p-3 mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">{isAr ? "الفعالية القادمة" : "Next Event"}</p>
              <p className="font-semibold text-sm">{data.nextEvent.title}</p>
            </div>
            <Badge variant="outline" className="text-primary border-primary">
              {data.nextEvent.daysTo !== null ? `${data.nextEvent.daysTo} ${isAr ? "يوم" : "days"}` : "—"}
            </Badge>
          </div>
        )}

        {/* KPI Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {stats.map((s, i) => (
            <div key={i} className="bg-muted/50 rounded-xl p-3 text-center">
              <s.icon className={`h-4 w-4 mx-auto mb-1 ${s.color}`} />
              <div className="text-lg font-bold"><AnimatedCounter value={s.value} /></div>
              <div className="text-[10px] text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Ticket Trend */}
          <div className="md:col-span-2">
            <p className="text-xs font-medium mb-2 text-muted-foreground">
              {isAr ? "التذاكر - آخر 14 يوم" : "Tickets - Last 14 Days"}
            </p>
            <ResponsiveContainer width="100%" height={130}>
              <AreaChart data={data.ticketTrend}>
                <XAxis dataKey="date" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 9 }} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="count" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} name={isAr ? "تذاكر" : "Tickets"} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Sponsor Tiers */}
          <div>
            <p className="text-xs font-medium mb-2 text-muted-foreground">
              {isAr ? "مستويات الرعاة" : "Sponsor Tiers"}
            </p>
            {data.sponsorTiers.length > 0 ? (
              <ResponsiveContainer width="100%" height={130}>
                <BarChart data={data.sponsorTiers} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 9 }} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} width={60} />
                  <Tooltip contentStyle={{ fontSize: 11 }} />
                  <Bar dataKey="value" radius={[0, 3, 3, 0]}>
                    {data.sponsorTiers.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[130px] flex items-center justify-center text-xs text-muted-foreground">
                {isAr ? "لا يوجد رعاة" : "No sponsors yet"}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="bg-muted/50 rounded-xl p-2 text-center">
            <Building className="h-3 w-3 mx-auto mb-1 text-chart-2" />
            <div className="text-sm font-bold"><AnimatedCounter value={data.boothUtilization} suffix="%" /></div>
            <div className="text-[9px] text-muted-foreground">{isAr ? "إشغال الأجنحة" : "Booth Utilization"}</div>
          </div>
          <div className="bg-muted/50 rounded-xl p-2 text-center">
            <Users className="h-3 w-3 mx-auto mb-1 text-chart-3" />
            <div className="text-sm font-bold"><AnimatedCounter value={data.totalFollowers} /></div>
            <div className="text-[9px] text-muted-foreground">{isAr ? "المتابعون" : "Followers"}</div>
          </div>
          <div className="bg-muted/50 rounded-xl p-2 text-center">
            <TrendingUp className="h-3 w-3 mx-auto mb-1 text-chart-4" />
            <div className="text-sm font-bold"><AnimatedCounter value={data.totalSponsors} /></div>
            <div className="text-[9px] text-muted-foreground">{isAr ? "الرعاة" : "Sponsors"}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
