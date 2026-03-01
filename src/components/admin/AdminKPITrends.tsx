import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUp, ArrowDown, Minus, Users, Trophy, FileText, MessageSquare, CreditCard, Building2 } from "lucide-react";
import { subDays } from "date-fns";
import { cn } from "@/lib/utils";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { ResultReveal } from "@/components/ui/result-reveal";

interface KPIData {
  label: string;
  labelAr: string;
  current: number;
  previous: number;
  icon: React.ElementType;
  color: string;
}

export function AdminKPITrends() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data: kpis, isLoading } = useQuery({
    queryKey: ["admin-kpi-trends"],
    queryFn: async () => {
      const now = new Date();
      const sevenDaysAgo = subDays(now, 7).toISOString();
      const fourteenDaysAgo = subDays(now, 14).toISOString();

      const [
        usersThisWeek, usersPrevWeek,
        compsThisWeek, compsPrevWeek,
        postsThisWeek, postsPrevWeek,
        ordersThisWeek, ordersPrevWeek,
        companiesThisWeek, companiesPrevWeek,
        ticketsThisWeek, ticketsPrevWeek,
      ] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", sevenDaysAgo),
        supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", fourteenDaysAgo).lt("created_at", sevenDaysAgo),
        supabase.from("competition_registrations").select("*", { count: "exact", head: true }).gte("registered_at", sevenDaysAgo),
        supabase.from("competition_registrations").select("*", { count: "exact", head: true }).gte("registered_at", fourteenDaysAgo).lt("registered_at", sevenDaysAgo),
        supabase.from("posts").select("*", { count: "exact", head: true }).gte("created_at", sevenDaysAgo),
        supabase.from("posts").select("*", { count: "exact", head: true }).gte("created_at", fourteenDaysAgo).lt("created_at", sevenDaysAgo),
        supabase.from("company_orders").select("*", { count: "exact", head: true }).gte("created_at", sevenDaysAgo),
        supabase.from("company_orders").select("*", { count: "exact", head: true }).gte("created_at", fourteenDaysAgo).lt("created_at", sevenDaysAgo),
        supabase.from("companies").select("*", { count: "exact", head: true }).gte("created_at", sevenDaysAgo),
        supabase.from("companies").select("*", { count: "exact", head: true }).gte("created_at", fourteenDaysAgo).lt("created_at", sevenDaysAgo),
        supabase.from("support_tickets").select("*", { count: "exact", head: true }).gte("created_at", sevenDaysAgo),
        supabase.from("support_tickets").select("*", { count: "exact", head: true }).gte("created_at", fourteenDaysAgo).lt("created_at", sevenDaysAgo),
      ]);

      return [
        { label: "New Users", labelAr: "مستخدمون جدد", current: usersThisWeek.count || 0, previous: usersPrevWeek.count || 0, icon: Users, color: "text-primary" },
        { label: "Registrations", labelAr: "تسجيلات", current: compsThisWeek.count || 0, previous: compsPrevWeek.count || 0, icon: Trophy, color: "text-chart-4" },
        { label: "Posts", labelAr: "منشورات", current: postsThisWeek.count || 0, previous: postsPrevWeek.count || 0, icon: MessageSquare, color: "text-chart-2" },
        { label: "Orders", labelAr: "طلبات", current: ordersThisWeek.count || 0, previous: ordersPrevWeek.count || 0, icon: CreditCard, color: "text-chart-3" },
        { label: "Companies", labelAr: "شركات", current: companiesThisWeek.count || 0, previous: companiesPrevWeek.count || 0, icon: Building2, color: "text-chart-5" },
        { label: "Tickets", labelAr: "تذاكر", current: ticketsThisWeek.count || 0, previous: ticketsPrevWeek.count || 0, icon: FileText, color: "text-destructive" },
      ] as KPIData[];
    },
    staleTime: 1000 * 60 * 5,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}><CardContent className="p-3"><Skeleton className="h-14 w-full" /></CardContent></Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {kpis?.map((kpi, index) => {
        const delta = kpi.current - kpi.previous;
        const pct = kpi.previous > 0 ? Math.round((delta / kpi.previous) * 100) : kpi.current > 0 ? 100 : 0;
        const isUp = delta > 0;
        const isDown = delta < 0;

        return (
          <ResultReveal key={kpi.label} delay={index * 80} variant="fade-up">
            <Card className="border-border/50">
              <CardContent className="p-3">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <kpi.icon className={cn("h-3.5 w-3.5", kpi.color)} />
                  <span className="text-[10px] text-muted-foreground truncate">
                    {isAr ? kpi.labelAr : kpi.label}
                  </span>
                </div>
                <div className="flex items-end justify-between">
                  <AnimatedCounter value={kpi.current} className="text-lg" />
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[9px] h-4 px-1 gap-0.5 border-0",
                      isUp && "bg-chart-2/10 text-chart-2",
                      isDown && "bg-destructive/10 text-destructive",
                      !isUp && !isDown && "bg-muted text-muted-foreground"
                    )}
                  >
                    {isUp ? <ArrowUp className="h-2.5 w-2.5" /> : isDown ? <ArrowDown className="h-2.5 w-2.5" /> : <Minus className="h-2.5 w-2.5" />}
                    {Math.abs(pct)}%
                  </Badge>
                </div>
                <p className="text-[9px] text-muted-foreground mt-0.5">
                  {isAr ? "الأسبوع السابق:" : "prev:"} {kpi.previous}
                </p>
              </CardContent>
            </Card>
          </ResultReveal>
        );
      })}
    </div>
  );
}
