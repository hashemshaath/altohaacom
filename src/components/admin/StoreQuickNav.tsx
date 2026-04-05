import { memo } from "react";
import { Link, useLocation } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ShoppingBag, Package, Tag, Gift, CreditCard } from "lucide-react";

const NAV_ITEMS = [
  { href: "/admin/orders", icon: Package, labelEn: "Orders", labelAr: "الطلبات", countKey: "pendingOrders" },
  { href: "/admin/invoices", icon: CreditCard, labelEn: "Invoices", labelAr: "الفواتير" },
  { href: "/admin/loyalty", icon: Gift, labelEn: "Loyalty", labelAr: "الولاء" },
  { href: "/admin/membership", icon: Tag, labelEn: "Membership", labelAr: "العضوية" },
];

export const StoreQuickNav = memo(function StoreQuickNav() {
  const { language } = useLanguage();
  const location = useLocation();
  const isAr = language === "ar";

  const { data: counts } = useQuery({
    queryKey: ["store-nav-counts"],
    queryFn: async () => {
      const [ordersRes] = await Promise.allSettled([
        supabase.from("shop_orders").select("id", { count: "exact", head: true }).eq("status", "pending"),
      ]);
      return {
        pendingOrders: ordersRes.status === "fulfilled" ? ordersRes.value.count || 0 : 0,
      };
    },
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: false,
  });

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
      {NAV_ITEMS.map((item) => {
        const isActive = location.pathname === item.href;
        const count = item.countKey && counts ? (counts as any)[item.countKey] : 0;
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
              <Badge variant="destructive" className="text-[9px] px-1.5 py-0 h-4 min-w-[18px] justify-center">
                {count}
              </Badge>
            )}
          </Link>
        );
      })}
    </div>
  );
});
