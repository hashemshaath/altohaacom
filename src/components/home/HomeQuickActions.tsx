import { useIsAr } from "@/hooks/useIsAr";
import { memo } from "react";
import { Link } from "react-router-dom";
import { Trophy, BookOpen, Calendar, Search, Users, Utensils, ChefHat, Store } from "lucide-react";
import { cn } from "@/lib/utils";

const actions = [
  { icon: Trophy, label: "Competitions", labelAr: "المسابقات", href: "/competitions", color: "text-chart-1", bg: "bg-chart-1/8" },
  { icon: BookOpen, label: "Masterclasses", labelAr: "ماستركلاس", href: "/masterclasses", color: "text-chart-2", bg: "bg-chart-2/8" },
  { icon: Calendar, label: "Events", labelAr: "الفعاليات", href: "/exhibitions", color: "text-chart-3", bg: "bg-chart-3/8" },
  { icon: Search, label: "Search", labelAr: "بحث", href: "/search", color: "text-chart-4", bg: "bg-chart-4/8" },
  { icon: Users, label: "Rankings", labelAr: "التصنيفات", href: "/rankings", color: "text-chart-5", bg: "bg-chart-5/8" },
  { icon: Utensils, label: "Recipes", labelAr: "الوصفات", href: "/recipes", color: "text-chart-1", bg: "bg-chart-1/8" },
  { icon: ChefHat, label: "Community", labelAr: "المجتمع", href: "/community", color: "text-chart-2", bg: "bg-chart-2/8" },
  { icon: Store, label: "Shop", labelAr: "المتجر", href: "/shop", color: "text-chart-3", bg: "bg-chart-3/8" },
];

export const HomeQuickActions = memo(function HomeQuickActions() {
  const isAr = useIsAr();

  return (
    <section className="container py-1" dir={isAr ? "rtl" : "ltr"} aria-label={isAr ? "إجراءات سريعة" : "Quick actions"}>
      <div
        className="flex gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-none pb-1 sm:grid sm:grid-cols-4 md:grid-cols-8 sm:overflow-visible sm:pb-0 -mx-5 px-5 sm:mx-0 sm:px-0 touch-pan-x"
        dir={isAr ? "rtl" : "ltr"}
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {actions.map((a) => (
          <Link
            key={a.href}
            to={a.href}
            className={cn(
              "flex flex-col items-center gap-2.5 rounded-2xl p-4 sm:p-3.5 snap-start",
              "min-w-[5rem] shrink-0 sm:min-w-0 sm:shrink",
              "bg-card border border-border/20 hover:border-primary/20",
              "transition-all duration-200 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5 active:scale-[0.98]",
              "group touch-manipulation"
            )}
          >
            <div className={cn(
              "flex h-12 w-12 sm:h-10 sm:w-10 items-center justify-center rounded-2xl transition-all duration-300",
              "group-hover:scale-110 group-hover:shadow-md",
              a.bg, a.color
            )}>
              <a.icon className="h-[22px] w-[22px] sm:h-5 sm:w-5" />
            </div>
            <span className="text-sm font-semibold text-muted-foreground group-hover:text-foreground transition-colors line-clamp-1 whitespace-nowrap">
              {isAr ? a.labelAr : a.label}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
});
