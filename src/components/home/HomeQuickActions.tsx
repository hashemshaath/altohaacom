import { memo } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
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
  const { language } = useLanguage();
  const isAr = language === "ar";

  return (
    <section className="container" aria-label={isAr ? "إجراءات سريعة" : "Quick actions"}>
      <div
        className="flex gap-2.5 overflow-x-auto snap-x snap-mandatory scrollbar-none pb-1 sm:grid sm:grid-cols-4 md:grid-cols-8 sm:overflow-visible sm:pb-0 -mx-4 px-4 sm:mx-0 sm:px-0"
        dir={isAr ? "rtl" : "ltr"}
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {actions.map((a, i) => (
          <Link
            key={a.href}
            to={a.href}
            className={cn(
              "flex flex-col items-center gap-2 rounded-2xl p-3.5 snap-start",
              "min-w-[5.5rem] shrink-0 sm:min-w-0 sm:shrink",
              "bg-card border border-border/20 hover:border-primary/20",
              "transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1 active:scale-[0.95]",
              "group touch-manipulation"
            )}
          >
            <div className={cn(
              "flex h-11 w-11 sm:h-10 sm:w-10 items-center justify-center rounded-2xl transition-all duration-300",
              "group-hover:scale-110 group-hover:shadow-md",
              a.bg, a.color
            )}>
              <a.icon className="h-5 w-5 sm:h-4.5 sm:w-4.5" />
            </div>
            <span className="text-[10px] sm:text-[11px] font-semibold text-muted-foreground group-hover:text-foreground transition-colors line-clamp-1 whitespace-nowrap">
              {isAr ? a.labelAr : a.label}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
});
