import { memo } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { Trophy, BookOpen, Calendar, Search, Users, Utensils } from "lucide-react";
import { cn } from "@/lib/utils";

const actions = [
  { icon: Trophy, label: "Competitions", labelAr: "المسابقات", href: "/competitions" },
  { icon: BookOpen, label: "Masterclasses", labelAr: "ماستركلاس", href: "/masterclasses" },
  { icon: Calendar, label: "Events", labelAr: "الفعاليات", href: "/exhibitions" },
  { icon: Search, label: "Search", labelAr: "بحث", href: "/search" },
  { icon: Users, label: "Rankings", labelAr: "التصنيفات", href: "/rankings" },
  { icon: Utensils, label: "Recipes", labelAr: "الوصفات", href: "/recipes" },
];

export const HomeQuickActions = memo(function HomeQuickActions() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  return (
    <section className="container py-3">
      {/* Horizontal scroll on mobile, grid on desktop */}
      <div className="flex gap-2 overflow-x-auto snap-x snap-mandatory scrollbar-none pb-1 sm:grid sm:grid-cols-6 sm:overflow-visible sm:pb-0">
        {actions.map((a) => (
          <Link
            key={a.href}
            to={a.href}
            className={cn(
              "flex flex-col items-center gap-1.5 rounded-xl p-3 snap-start",
              "min-w-[5rem] shrink-0 sm:min-w-0 sm:shrink",
              "bg-card border border-border/40 hover:border-primary/30",
              "transition-all duration-200 hover:shadow-sm active:scale-[0.97]",
              "group"
            )}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary/15 transition-colors">
              <a.icon className="h-4.5 w-4.5" />
            </div>
            <span className="text-[11px] font-semibold text-muted-foreground group-hover:text-foreground transition-colors line-clamp-1 whitespace-nowrap">
              {isAr ? a.labelAr : a.label}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
});
