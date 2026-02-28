import { useState, memo } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { Search, Trophy, Globe, ChefHat, Utensils, BookOpen, Store } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const categories = [
  { key: "all", icon: Search, labelEn: "All", labelAr: "الكل" },
  { key: "competitions", icon: Trophy, labelEn: "Competitions", labelAr: "المسابقات" },
  { key: "exhibitions", icon: Globe, labelEn: "Exhibitions", labelAr: "المعارض" },
  { key: "chefs", icon: ChefHat, labelEn: "Chefs", labelAr: "الطهاة" },
  { key: "chefs-table", icon: Utensils, labelEn: "Chef's Table", labelAr: "طاولة الشيف" },
  { key: "masterclasses", icon: BookOpen, labelEn: "Masterclasses", labelAr: "ماستركلاس" },
  { key: "shop", icon: Store, labelEn: "Shop", labelAr: "المتجر" },
];

export const HomeSearch = memo(function HomeSearch() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}&type=${activeCategory === "all" ? "" : activeCategory}`);
    }
  };

  return (
    <section className="relative -mt-6 z-30 px-3 sm:-mt-8" aria-label={isAr ? "البحث السريع" : "Quick search"} dir={isAr ? "rtl" : "ltr"}>
      <div className="container">
        <div className="mx-auto max-w-2xl rounded-2xl border border-border/50 bg-card/95 backdrop-blur-lg p-3 shadow-xl shadow-primary/5 ring-1 ring-primary/5 sm:p-4">
          {/* Category pills */}
          <div className="relative mb-2.5">
            <div className="flex gap-1 overflow-x-auto scrollbar-none pb-0.5" dir={isAr ? "rtl" : "ltr"}>
              {categories.map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => setActiveCategory(cat.key)}
                  className={cn(
                    "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200 touch-manipulation",
                    activeCategory === cat.key
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <cat.icon className="h-3 w-3 shrink-0" />
                  {isAr ? cat.labelAr : cat.labelEn}
                </button>
              ))}
            </div>
            <div className="pointer-events-none absolute end-0 top-0 bottom-0 w-6 bg-gradient-to-s from-card/95 to-transparent" />
          </div>
          {/* Search bar */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={isAr ? "ابحث عن مسابقات، طهاة، معارض..." : "Search competitions, chefs, exhibitions..."}
                className="ps-9 h-10 text-sm"
              />
            </div>
            <Button type="submit" size="default" className="h-10 px-5 shadow-sm shrink-0">
              {isAr ? "بحث" : "Search"}
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
});
