import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Users, UserCheck, UserX, Shield, Crown, Building2, TrendingUp } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function UserStatsBar() {
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
    { icon: Users, label: isAr ? "الإجمالي" : "Total", value: data?.total, color: "text-primary", bg: "bg-primary/10" },
    { icon: UserCheck, label: isAr ? "نشط" : "Active", value: data?.active, color: "text-chart-2", bg: "bg-chart-2/10" },
    { icon: UserX, label: isAr ? "موقوف" : "Suspended", value: data?.suspended, color: "text-destructive", bg: "bg-destructive/10" },
    { icon: Shield, label: isAr ? "موثق" : "Verified", value: data?.verified, color: "text-chart-3", bg: "bg-chart-3/10" },
    { icon: Crown, label: isAr ? "محترف" : "Professional", value: data?.pro, color: "text-chart-4", bg: "bg-chart-4/10" },
    { icon: Building2, label: isAr ? "مشرف" : "Admins", value: data?.supervisors, color: "text-chart-5", bg: "bg-chart-5/10" },
  ];

  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
      {items.map((item) => (
        <Card key={item.label} className="border-border/50">
          <CardContent className="p-3 flex items-center gap-2.5">
            <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", item.bg)}>
              <item.icon className={cn("h-4 w-4", item.color)} />
            </div>
            <div className="min-w-0">
              {isLoading ? (
                <Skeleton className="h-5 w-8" />
              ) : (
                <p className="text-sm font-bold leading-none">{item.value?.toLocaleString()}</p>
              )}
              <p className="text-[10px] text-muted-foreground truncate">{item.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
