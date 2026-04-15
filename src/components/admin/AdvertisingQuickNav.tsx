import { CACHE } from "@/lib/queryConfig";
import { memo } from "react";
import { Link, useLocation } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Megaphone, FileText, Building2, DollarSign, BarChart3,
  Globe, Users, AlertTriangle,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/admin/advertising", icon: Megaphone, labelEn: "Advertising", labelAr: "الإعلانات", countKey: "pending" },
  { href: "/admin/companies", icon: Building2, labelEn: "Companies", labelAr: "الشركات" },
  { href: "/admin/invoices", icon: DollarSign, labelEn: "Invoices", labelAr: "الفواتير" },
  { href: "/admin/analytics", icon: BarChart3, labelEn: "Analytics", labelAr: "التحليلات" },
  { href: "/admin/audience-segments", icon: Users, labelEn: "Audiences", labelAr: "الجماهير" },
];

export const AdvertisingQuickNav = memo(function AdvertisingQuickNav() {
  const { language } = useLanguage();
  const location = useLocation();
  const isAr = language === "ar";

  const { data: counts } = useQuery({
    queryKey: ["advertising-nav-counts"],
    queryFn: async () => {
      const [requestsRes, campaignsRes] = await Promise.allSettled([
        supabase.from("ad_requests").select("id", { count: "exact", head: true }).in("status", ["pending", "under_review"]),
        supabase.from("ad_campaigns").select("id", { count: "exact", head: true }).eq("status", "pending_approval"),
      ]);
      return {
        pending:
          (requestsRes.status === "fulfilled" ? requestsRes.value.count || 0 : 0) +
          (campaignsRes.status === "fulfilled" ? campaignsRes.value.count || 0 : 0),
      };
    },
    staleTime: CACHE.short.staleTime,
    refetchOnWindowFocus: false,
  });

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
      {NAV_ITEMS.map((item) => {
        const isActive = location.pathname === item.href;
        const count = item.countKey && counts ? counts[item.countKey as keyof typeof counts] ?? 0 : 0;
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
              <Badge variant="destructive" className="text-[12px] px-1.5 py-0 h-4 min-w-[18px] justify-center">
                {count}
              </Badge>
            )}
          </Link>
        );
      })}
    </div>
  );
});
