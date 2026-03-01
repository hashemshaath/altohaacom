import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Badge } from "@/components/ui/badge";
import { Activity, UserPlus, MessageSquare, AlertTriangle, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatedCounter } from "@/components/ui/animated-counter";

/**
 * A compact real-time activity bar for the admin dashboard.
 * Shows today's key metrics at a glance with pulse indicators.
 */
export function SystemHealthBar() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data } = useQuery({
    queryKey: ["system-health-bar"],
    queryFn: async () => {
      const now = new Date();
      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0);
      const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      const [
        { count: newUsersToday },
        { count: newPostsToday },
        { count: pendingReports },
        { count: activeLastHour },
      ] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", todayStart.toISOString()),
        supabase.from("posts").select("*", { count: "exact", head: true }).gte("created_at", todayStart.toISOString()),
        supabase.from("content_reports").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("profiles").select("*", { count: "exact", head: true }).gte("last_login_at", hourAgo.toISOString()),
      ]);

      return {
        newUsersToday: newUsersToday || 0,
        newPostsToday: newPostsToday || 0,
        pendingReports: pendingReports || 0,
        activeLastHour: activeLastHour || 0,
      };
    },
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 60,
  });

  if (!data) return null;

  const items = [
    {
      icon: Activity,
      label: isAr ? "نشط الآن" : "Active Now",
      value: data.activeLastHour,
      color: "text-chart-2",
      bg: "bg-chart-2/10",
      pulse: data.activeLastHour > 0,
    },
    {
      icon: UserPlus,
      label: isAr ? "مستخدمون جدد" : "New Users",
      value: data.newUsersToday,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      icon: MessageSquare,
      label: isAr ? "منشورات اليوم" : "Posts Today",
      value: data.newPostsToday,
      color: "text-chart-4",
      bg: "bg-chart-4/10",
    },
    {
      icon: AlertTriangle,
      label: isAr ? "بلاغات" : "Reports",
      value: data.pendingReports,
      color: data.pendingReports > 0 ? "text-destructive" : "text-muted-foreground",
      bg: data.pendingReports > 0 ? "bg-destructive/10" : "bg-muted",
      urgent: data.pendingReports > 0,
    },
  ];

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {items.map((item) => (
        <Badge
          key={item.label}
          variant="outline"
          className={cn(
            "gap-1.5 px-2.5 py-1 text-xs font-medium border-border/50",
            item.urgent && "border-destructive/30 animate-pulse"
          )}
        >
          <div className="relative">
            <item.icon className={cn("h-3 w-3", item.color)} />
            {item.pulse && (
              <span className="absolute -top-0.5 -end-0.5 h-1.5 w-1.5 rounded-full bg-chart-2 animate-ping" />
            )}
          </div>
          <AnimatedCounter value={item.value} className={item.color} />
          <span className="text-muted-foreground hidden sm:inline">{item.label}</span>
        </Badge>
      ))}
    </div>
  );
}
