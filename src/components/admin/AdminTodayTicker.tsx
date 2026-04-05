import { memo, useMemo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { cn } from "@/lib/utils";
import { UserPlus, ShoppingBag, MessageSquare, Flag, Trophy, TrendingUp, Sparkles } from "lucide-react";

/**
 * Compact horizontal ticker showing today's key metrics.
 * Sits above the main dashboard content.
 */
export const AdminTodayTicker = memo(function AdminTodayTicker() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data } = useQuery({
    queryKey: ["admin-today-ticker"],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const iso = today.toISOString();

      const [users, orders, posts, reports, registrations] = await Promise.allSettled([
        supabase.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", iso),
        supabase.from("company_orders").select("id", { count: "exact", head: true }).gte("created_at", iso),
        supabase.from("posts").select("id", { count: "exact", head: true }).gte("created_at", iso),
        supabase.from("content_reports").select("id", { count: "exact", head: true }).gte("created_at", iso),
        supabase.from("competition_registrations").select("id", { count: "exact", head: true }).gte("registered_at", iso),
      ]);

      return {
        users: users.status === "fulfilled" ? users.value.count || 0 : 0,
        orders: orders.status === "fulfilled" ? orders.value.count || 0 : 0,
        posts: posts.status === "fulfilled" ? posts.value.count || 0 : 0,
        reports: reports.status === "fulfilled" ? reports.value.count || 0 : 0,
        registrations: registrations.status === "fulfilled" ? registrations.value.count || 0 : 0,
      };
    },
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: false,
  });

  const items = useMemo(() => [
    { icon: UserPlus, label: isAr ? "مستخدمون" : "Users", value: data?.users || 0, color: "text-primary", bg: "bg-primary/8" },
    { icon: ShoppingBag, label: isAr ? "طلبات" : "Orders", value: data?.orders || 0, color: "text-chart-2", bg: "bg-chart-2/8" },
    { icon: MessageSquare, label: isAr ? "منشورات" : "Posts", value: data?.posts || 0, color: "text-chart-3", bg: "bg-chart-3/8" },
    { icon: Trophy, label: isAr ? "تسجيلات" : "Signups", value: data?.registrations || 0, color: "text-chart-4", bg: "bg-chart-4/8" },
    { icon: Flag, label: isAr ? "بلاغات" : "Reports", value: data?.reports || 0, color: data?.reports ? "text-destructive" : "text-muted-foreground", bg: data?.reports ? "bg-destructive/8" : "bg-muted/30" },
  ], [data, isAr]);

  const total = items.reduce((sum, i) => sum + i.value, 0);

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none rounded-2xl border border-border/30 bg-gradient-to-r from-muted/30 via-transparent to-muted/30 px-3 py-2 backdrop-blur-sm">
      <div className="flex items-center gap-2 shrink-0 pe-3 border-e border-border/30">
        <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10">
          <Sparkles className="h-3 w-3 text-primary" />
        </div>
        <span className="text-[11px] font-bold text-foreground">{isAr ? "اليوم" : "Today"}</span>
        <span className="text-[11px] font-mono font-black text-primary tabular-nums">
          <AnimatedCounter value={total} className="inline" />
        </span>
      </div>
      {items.map((item) => (
        <div key={item.label} className={cn("flex items-center gap-1.5 shrink-0 px-2 py-1 rounded-xl transition-colors hover:bg-muted/40", item.bg)}>
          <item.icon className={cn("h-3 w-3", item.color)} />
          <span className={cn("text-[11px] font-mono font-bold tabular-nums", item.color)}>
            <AnimatedCounter value={item.value} className="inline" />
          </span>
          <span className="text-[10px] text-muted-foreground hidden sm:inline">{item.label}</span>
        </div>
      ))}
    </div>
  );
});
