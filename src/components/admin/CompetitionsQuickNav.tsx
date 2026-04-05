import { memo } from "react";
import { Link, useLocation } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Trophy, Calendar, Globe, Medal, Gavel } from "lucide-react";

const NAV_ITEMS = [
  { href: "/admin/competitions", icon: Trophy, labelEn: "Competitions", labelAr: "المسابقات", countKey: "pending" },
  { href: "/admin/exhibitions", icon: Calendar, labelEn: "Exhibitions", labelAr: "المعارض" },
  { href: "/admin/global-events", icon: Globe, labelEn: "Global Events", labelAr: "فعاليات عالمية" },
  { href: "/admin/judges", icon: Gavel, labelEn: "Judges", labelAr: "الحكام" },
  { href: "/admin/certificates", icon: Medal, labelEn: "Certificates", labelAr: "الشهادات" },
];

export const CompetitionsQuickNav = memo(function CompetitionsQuickNav() {
  const { language } = useLanguage();
  const location = useLocation();
  const isAr = language === "ar";

  const { data: counts } = useQuery({
    queryKey: ["competitions-nav-counts"],
    queryFn: async () => {
      const [pendingRes] = await Promise.allSettled([
        supabase.from("competitions").select("id", { count: "exact", head: true }).eq("status", "pending"),
      ]);
      return {
        pending: pendingRes.status === "fulfilled" ? pendingRes.value.count || 0 : 0,
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
              <Badge
                variant={item.countKey === "pending" ? "destructive" : "secondary"}
                className="text-[9px] px-1.5 py-0 h-4 min-w-[18px] justify-center"
              >
                {count}
              </Badge>
            )}
          </Link>
        );
      })}
    </div>
  );
});
