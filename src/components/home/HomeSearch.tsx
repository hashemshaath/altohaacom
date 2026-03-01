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
    <section className="relative -mt-7 z-30 px-3 sm:-mt-9" aria-label={isAr ? "البحث السريع" : "Quick search"} dir={isAr ? "rtl" : "ltr"}>
      <div className="container">
        <div className="mx-auto max-w-2xl rounded-3xl border border-border/40 bg-card/90 backdrop-blur-xl p-3.5 shadow-2xl shadow-primary/8 ring-1 ring-primary/5 sm:p-5">
          {/* Category pills */}
          <div className="relative mb-3">
            <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-0.5" dir={isAr ? "rtl" : "ltr"}>
              {categories.map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => setActiveCategory(cat.key)}
                  className={cn(
                    "inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all duration-200 touch-manipulation",
                    activeCategory === cat.key
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                      : "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <cat.icon className="h-3.5 w-3.5 shrink-0" />
                  {isAr ? cat.labelAr : cat.labelEn}
                </button>
              ))}
            </div>
            <div className="pointer-events-none absolute end-0 top-0 bottom-0 w-8 bg-gradient-to-s from-card/90 to-transparent" />
          </div>
          {/* Search bar */}
          <form onSubmit={handleSearch} className="flex gap-2.5">
            <div className="relative flex-1">
              <Search className="absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/40" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={isAr ? "ابحث عن مسابقات، طهاة، معارض..." : "Search competitions, chefs, exhibitions..."}
                className="ps-10 h-11 text-sm rounded-xl border-border/30 bg-muted/20 focus:bg-background transition-colors"
              />
            </div>
            <Button type="submit" size="default" className="h-11 px-6 shadow-md shadow-primary/15 rounded-xl shrink-0 font-semibold">
              {isAr ? "بحث" : "Search"}
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
});
