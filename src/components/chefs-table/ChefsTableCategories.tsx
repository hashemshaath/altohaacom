import { memo } from "react";
import { Utensils, Beef, Cookie, Salad, Flame, Droplets, CookingPot, Wheat } from "lucide-react";

interface Props {
  isAr: boolean;
}

const categories = [
  { icon: Beef, en: "Meat & Poultry", ar: "لحوم ودواجن", color: "bg-chart-1/10 text-chart-1" },
  { icon: Wheat, en: "Rice & Grains", ar: "أرز وحبوب", color: "bg-chart-2/10 text-chart-2" },
  { icon: Flame, en: "Spices & Seasonings", ar: "بهارات وتوابل", color: "bg-chart-3/10 text-chart-3" },
  { icon: Droplets, en: "Oils & Fats", ar: "زيوت ودهون", color: "bg-chart-4/10 text-chart-4" },
  { icon: CookingPot, en: "Sauces & Condiments", ar: "صلصات ومقبلات", color: "bg-chart-5/10 text-chart-5" },
  { icon: Cookie, en: "Bakery & Pastry", ar: "مخبوزات ومعجنات", color: "bg-primary/10 text-primary" },
  { icon: Salad, en: "Dairy Products", ar: "منتجات ألبان", color: "bg-chart-1/10 text-chart-1" },
  { icon: Utensils, en: "General Products", ar: "منتجات عامة", color: "bg-chart-2/10 text-chart-2" },
];

export const ChefsTableCategories = memo(function ChefsTableCategories({ isAr }: Props) {
  return (
    <section className="bg-background border-y border-border/30">
      <div className="container py-16 md:py-20">
        {/* Header */}
        <div className="mx-auto max-w-2xl text-center mb-12">
          <span className="inline-flex items-center gap-2 rounded-full bg-chart-3/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-chart-3 mb-4">
            {isAr ? "الفئات" : "Categories"}
          </span>
          <h2 className="text-2xl font-black md:text-3xl lg:text-4xl text-foreground">
            {isAr ? "فئات المنتجات المدعومة" : "Supported Product Categories"}
          </h2>
          <p className="mt-3 text-muted-foreground text-sm md:text-base max-w-xl mx-auto">
            {isAr ? "نغطي مجموعة واسعة من فئات المنتجات الغذائية بطهاة متخصصين في كل فئة" : "We cover a wide range of food product categories with specialized chefs for each"}
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto">
          {categories.map((cat, i) => (
            <div
              key={i}
              className="group flex flex-col items-center gap-3 rounded-2xl border border-border/40 bg-card p-6 text-center transition-all duration-300 hover:shadow-md hover:-translate-y-1 hover:border-primary/20 active:scale-[0.98]"
            >
              <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${cat.color} transition-transform duration-300 group-hover:scale-110`}>
                <cat.icon className="h-6 w-6" />
              </div>
              <span className="text-sm font-bold text-foreground">{isAr ? cat.ar : cat.en}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
});
