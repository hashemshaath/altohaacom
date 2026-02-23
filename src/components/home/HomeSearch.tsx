import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { Search, Trophy, Globe, ChefHat, Utensils } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const categories = [
  { key: "all", icon: Search, labelEn: "All", labelAr: "الكل" },
  { key: "competitions", icon: Trophy, labelEn: "Competitions", labelAr: "المسابقات" },
  { key: "exhibitions", icon: Globe, labelEn: "Exhibitions", labelAr: "المعارض" },
  { key: "chefs", icon: ChefHat, labelEn: "Chefs", labelAr: "الطهاة" },
  { key: "chefs-table", icon: Utensils, labelEn: "Chef's Table", labelAr: "طاولة الشيف" },
];

export function HomeSearch() {
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
    <section className="relative -mt-7 z-30 px-2 sm:-mt-10 sm:px-3" aria-label={isAr ? "البحث السريع" : "Quick search"}>
      <div className="container">
        <div className="mx-auto max-w-3xl rounded-2xl border border-border/60 bg-card/95 backdrop-blur-lg p-3 shadow-2xl shadow-primary/8 ring-1 ring-primary/5 sm:p-5">
          {/* Category pills — single scrollable row on mobile */}
          <div className="relative mb-3 sm:mb-4">
            <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
              {categories.map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => setActiveCategory(cat.key)}
                  className={cn(
                    "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200 touch-manipulation",
                    activeCategory === cat.key
                      ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                      : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <cat.icon className="h-3 w-3 shrink-0" />
                  {isAr ? cat.labelAr : cat.labelEn}
                </button>
              ))}
            </div>
            {/* Fade hint for scroll */}
            <div className="pointer-events-none absolute end-0 top-0 bottom-0 w-6 bg-gradient-to-l from-card/95 to-transparent" />
          </div>
          {/* Search bar */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={isAr ? "ابحث..." : "Search competitions, chefs..."}
                className="ps-10 h-10 text-sm"
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
}
