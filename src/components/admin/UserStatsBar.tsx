import { memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Users, UserCheck, UserX, Shield, Crown, Building2 } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { AnimatedCounter } from "@/components/ui/animated-counter";

export const UserStatsBar = memo(function UserStatsBar() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data, isLoading } = useQuery({
    queryKey: ["admin-user-stats-bar"],
    queryFn: async () => {
      const [total, active, suspended, verified, pro, supervisors] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("account_status", "active"),
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("account_status", "suspended"),
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("is_verified", true),
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("account_type", "professional"),
        supabase.from("user_roles").select("id", { count: "exact", head: true }).eq("role", "supervisor"),
      ]);
      return {
        total: total.count || 0,
        active: active.count || 0,
        suspended: suspended.count || 0,
        verified: verified.count || 0,
        pro: pro.count || 0,
        supervisors: supervisors.count || 0,
      };
    },
    staleTime: 1000 * 60 * 2,
  });

  const items = [
    { icon: Users, label: isAr ? "الإجمالي" : "Total", value: data?.total, color: "text-primary", bg: "bg-primary/10", accent: "bg-primary" },
    { icon: UserCheck, label: isAr ? "نشط" : "Active", value: data?.active, color: "text-chart-2", bg: "bg-chart-2/10", accent: "bg-chart-2" },
    { icon: UserX, label: isAr ? "موقوف" : "Suspended", value: data?.suspended, color: "text-destructive", bg: "bg-destructive/10", accent: "bg-destructive" },
    { icon: Shield, label: isAr ? "موثق" : "Verified", value: data?.verified, color: "text-chart-3", bg: "bg-chart-3/10", accent: "bg-chart-3" },
    { icon: Crown, label: isAr ? "محترف" : "Professional", value: data?.pro, color: "text-chart-4", bg: "bg-chart-4/10", accent: "bg-chart-4" },
    { icon: Building2, label: isAr ? "مشرف" : "Admins", value: data?.supervisors, color: "text-chart-5", bg: "bg-chart-5/10", accent: "bg-chart-5" },
  ];

  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
      {items.map((item) => (
        <Card key={item.label} className="group relative overflow-hidden border-border/40 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 hover:border-border/60 rounded-2xl">
          <div className={cn("absolute inset-x-0 top-0 h-1 rounded-t-2xl transition-all duration-300 group-hover:h-1.5", item.accent)} />
          <CardContent className="p-3.5 pt-4 flex items-center gap-3">
            <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110", item.bg)}>
              <item.icon className={cn("h-4.5 w-4.5", item.color)} />
            </div>
            <div className="min-w-0">
              {isLoading ? (
                <Skeleton className="h-6 w-10 rounded-xl" />
              ) : (
                <AnimatedCounter value={item.value || 0} className="text-lg font-black leading-none tracking-tight" />
              )}
              <p className="text-[10px] text-muted-foreground truncate mt-0.5">{item.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
