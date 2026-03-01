import { memo } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { Trophy, BookOpen, Calendar, Search, Users, Utensils, ChefHat, Store } from "lucide-react";
import { cn } from "@/lib/utils";

const actions = [
  { icon: Trophy, label: "Competitions", labelAr: "المسابقات", href: "/competitions", color: "text-chart-1" },
  { icon: BookOpen, label: "Masterclasses", labelAr: "ماستركلاس", href: "/masterclasses", color: "text-chart-2" },
  { icon: Calendar, label: "Events", labelAr: "الفعاليات", href: "/exhibitions", color: "text-chart-3" },
  { icon: Search, label: "Search", labelAr: "بحث", href: "/search", color: "text-chart-4" },
  { icon: Users, label: "Rankings", labelAr: "التصنيفات", href: "/rankings", color: "text-chart-5" },
  { icon: Utensils, label: "Recipes", labelAr: "الوصفات", href: "/recipes", color: "text-chart-1" },
  { icon: ChefHat, label: "Community", labelAr: "المجتمع", href: "/community", color: "text-chart-2" },
  { icon: Store, label: "Shop", labelAr: "المتجر", href: "/shop", color: "text-chart-3" },
];

export const HomeQuickActions = memo(function HomeQuickActions() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  return (
    <section className="container py-4" aria-label={isAr ? "إجراءات سريعة" : "Quick actions"}>
      <div
        className="flex gap-2 overflow-x-auto snap-x snap-mandatory scrollbar-none pb-1 sm:grid sm:grid-cols-4 md:grid-cols-8 sm:overflow-visible sm:pb-0 -mx-4 px-4 sm:mx-0 sm:px-0"
        dir={isAr ? "rtl" : "ltr"}
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {actions.map((a, i) => (
          <Link
            key={a.href}
            to={a.href}
            className={cn(
              "flex flex-col items-center gap-1.5 rounded-2xl p-3 snap-start",
              "min-w-[5rem] shrink-0 sm:min-w-0 sm:shrink",
              "bg-card border border-border/30 hover:border-primary/25",
              "transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.95]",
              "group touch-manipulation"
            )}
            style={{ animationDelay: `${i * 40}ms` }}
          >
            <div className={cn(
              "flex h-10 w-10 sm:h-9 sm:w-9 items-center justify-center rounded-xl transition-all duration-300",
              "bg-primary/8 group-hover:bg-primary/15 group-hover:scale-110",
              a.color
            )}>
              <a.icon className="h-4.5 w-4.5 sm:h-4 sm:w-4" />
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
