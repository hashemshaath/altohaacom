import { memo } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { Badge } from "@/components/ui/badge";
import {
  ShoppingBag, Bell, Trophy, CreditCard,
  ChevronRight, Package, AlertCircle,
} from "lucide-react";

export const DashboardStatusStrip = memo(function DashboardStatusStrip() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const isAr = language === "ar";

  const { data } = useQuery({
    queryKey: ["dashboard-status-strip", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const uid = user.id;

      // Parallel fetching for better performance
      const [notifRes, ordersRes, compRes, invoiceRes] = await Promise.all([
        (supabase as never as { from: (t: string) => any }).from("notifications")
          .select("id", { count: "exact", head: true })
          .eq("user_id", uid)
          .eq("is_read", false),
        (supabase as never as { from: (t: string) => any }).from("shop_orders")
          .select("id", { count: "exact", head: true })
          .eq("user_id", uid)
          .in("status", ["pending", "processing", "shipped"]),
        (supabase as never as { from: (t: string) => any }).from("competition_registrations")
          .select("id", { count: "exact", head: true })
          .eq("participant_id", uid)
          .eq("status", "approved"),
        (supabase as never as { from: (t: string) => any }).from("invoices")
          .select("id", { count: "exact", head: true })
          .eq("user_id", uid)
          .eq("status", "pending"),
      ]);

      return {
        unreadNotifications: notifRes.count || 0,
        activeOrders: ordersRes.count || 0,
        activeCompetitions: compRes.count || 0,
        pendingInvoices: invoiceRes.count || 0,
      };
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 2,
  });

  if (!data) return null;

  const items = [
    {
      icon: Bell,
      label: isAr ? "إشعارات غير مقروءة" : "Unread Notifications",
      value: data.unreadNotifications,
      href: "/notifications",
      color: "text-primary",
      bg: "bg-primary/10",
      pulse: data.unreadNotifications > 0,
    },
    {
      icon: Package,
      label: isAr ? "طلبات نشطة" : "Active Orders",
      value: data.activeOrders,
      href: "/shop/orders",
      color: "text-chart-2",
      bg: "bg-chart-2/10",
      pulse: data.activeOrders > 0,
    },
    {
      icon: Trophy,
      label: isAr ? "مسابقات مسجلة" : "Active Competitions",
      value: data.activeCompetitions,
      href: "/competitions",
      color: "text-chart-4",
      bg: "bg-chart-4/10",
      pulse: false,
    },
    {
      icon: CreditCard,
      label: isAr ? "فواتير معلقة" : "Pending Invoices",
      value: data.pendingInvoices,
      href: "/dashboard",
      color: "text-destructive",
      bg: "bg-destructive/10",
      pulse: data.pendingInvoices > 0,
    },
  ];

  // Only show if there's at least one non-zero value
  const hasActivity = items.some((i) => i.value > 0);
  if (!hasActivity) return null;

  return (
    <div className="mb-6 animate-fade-in">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        {items.map((item) => (
          <Link key={item.label} to={item.href}>
            <div className="group flex items-center gap-3 rounded-xl border border-border/15 bg-card/80 backdrop-blur-sm p-3 transition-all duration-200 hover:shadow-md hover:border-border/30 active:scale-[0.98]">
              <div className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${item.bg}`}>
                <item.icon className={`h-4 w-4 ${item.color}`} />
                {item.pulse && (
                  <span className="absolute -top-0.5 -end-0.5 h-2.5 w-2.5 rounded-full bg-destructive animate-pulse" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-lg font-extrabold tabular-nums leading-none">
                  <AnimatedCounter value={item.value} />
                </p>
                <p className="text-[11px] sm:text-xs text-muted-foreground/70 truncate mt-0.5 font-medium">{item.label}</p>
              </div>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/30 group-hover:text-primary transition-colors shrink-0 rtl:rotate-180" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
});
