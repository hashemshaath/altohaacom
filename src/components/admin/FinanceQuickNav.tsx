import { CACHE } from "@/lib/queryConfig";
import { memo } from "react";
import { Link, useLocation } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Package, FileText, Calculator, Wallet, CreditCard,
  ArrowRight, TrendingUp, AlertTriangle,
} from "lucide-react";

interface FinanceCounts {
  orders: number;
  invoices: number;
  estimates: number;
  overdue: number;
}

interface NavItem {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  labelEn: string;
  labelAr: string;
  countKey?: keyof FinanceCounts;
  alertKey?: keyof FinanceCounts;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/admin/orders", icon: Package, labelEn: "Orders", labelAr: "الطلبات", countKey: "orders" },
  { href: "/admin/invoices", icon: FileText, labelEn: "Invoices", labelAr: "الفواتير", countKey: "invoices", alertKey: "overdue" },
  { href: "/admin/cost-center", icon: Calculator, labelEn: "Cost Center", labelAr: "مركز التكاليف", countKey: "estimates" },
  { href: "/admin/loyalty", icon: Wallet, labelEn: "Wallets", labelAr: "المحافظ" },
];

export const FinanceQuickNav = memo(function FinanceQuickNav() {
  const { language } = useLanguage();
  const location = useLocation();
  const isAr = language === "ar";

  const { data: counts } = useQuery({
    queryKey: ["finance-nav-counts"],
    queryFn: async () => {
      const [ordersRes, invoicesRes, estimatesRes] = await Promise.allSettled([
        supabase.from("company_orders").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("invoices").select("id, status", { count: "exact", head: true }).in("status", ["pending", "sent"]),
        supabase.from("cost_estimates").select("id", { count: "exact", head: true }).eq("status", "pending_approval"),
      ]);

      // Check overdue invoices
      const overdueRes = await supabase.from("invoices").select("id", { count: "exact", head: true }).eq("status", "overdue");

      return {
        orders: ordersRes.status === "fulfilled" ? ordersRes.value.count || 0 : 0,
        invoices: invoicesRes.status === "fulfilled" ? invoicesRes.value.count || 0 : 0,
        estimates: estimatesRes.status === "fulfilled" ? estimatesRes.value.count || 0 : 0,
        overdue: overdueRes.count || 0,
      };
    },
    staleTime: CACHE.short.staleTime,
    refetchOnWindowFocus: false,
  });

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
      {NAV_ITEMS.map((item) => {
        const isActive = location.pathname === item.href;
        const count = item.countKey && counts ? counts[item.countKey] : 0;
        const alert = item.alertKey && counts ? counts[item.alertKey] : 0;
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            to={item.href}
            className={cn(
              "flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium transition-all duration-200 shrink-0",
              isActive
                ? "border-primary/30 bg-primary/10 text-primary shadow-sm"
                : "border-border/40 bg-card hover:border-border/70 hover:bg-muted/40 text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" />
            <span>{isAr ? item.labelAr : item.labelEn}</span>
            {count > 0 && (
              <Badge
                variant="secondary"
                className={cn(
                  "text-[12px] px-1.5 py-0 h-4 min-w-[18px] justify-center",
                  isActive ? "bg-primary/20 text-primary" : ""
                )}
              >
                {count}
              </Badge>
            )}
            {alert > 0 && (
              <Badge variant="destructive" className="text-[12px] px-1 py-0 h-4 gap-0.5">
                <AlertTriangle className="h-2.5 w-2.5" />
                {alert}
              </Badge>
            )}
          </Link>
        );
      })}
    </div>
  );
});
