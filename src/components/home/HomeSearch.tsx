import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { Search, Trophy, Globe, ChefHat, Utensils } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const categories = [
  { key: "all", icon: Search, labelEn: "All", labelAr: "الكل" },
  { key: "competitions", icon: Trophy, labelEn: "Competitions", labelAr: "مسابقات" },
  { key: "exhibitions", icon: Globe, labelEn: "Exhibitions", labelAr: "معارض" },
  { key: "chefs", icon: ChefHat, labelEn: "Chefs", labelAr: "طهاة" },
  { key: "tastings", icon: Utensils, labelEn: "Tastings", labelAr: "تذوق" },
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
      navigate(`/search?q=${encodeURIComponent(query.trim())}&tab=${activeCategory === "all" ? "" : activeCategory}`);
    }
  };

  return (
    <section className="relative -mt-8 z-30 px-4">
      <div className="container">
        <div className="mx-auto max-w-3xl rounded-2xl border bg-card p-4 shadow-xl shadow-primary/5">
          {/* Category pills */}
          <div className="mb-3 flex flex-wrap gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                  activeCategory === cat.key
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                <cat.icon className="h-3 w-3" />
                {isAr ? cat.labelAr : cat.labelEn}
              </button>
            ))}
          </div>
          {/* Search bar */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={isAr ? "ابحث عن مسابقات، معارض، طهاة..." : "Search competitions, exhibitions, chefs..."}
                className="ps-9"
              />
            </div>
            <Button type="submit" size="default">
              {isAr ? "بحث" : "Search"}
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
}
