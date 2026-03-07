import { memo } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/i18n/LanguageContext";
import { Search, ArrowUpDown } from "lucide-react";

export type SortOption = "newest" | "price_asc" | "price_desc" | "popular" | "name";

interface ShopFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  categoryFilter: string;
  onCategoryChange: (value: string) => void;
  typeFilter: string;
  onTypeChange: (value: string) => void;
  categories: string[];
  sortBy?: SortOption;
  onSortChange?: (value: SortOption) => void;
}

export const ShopFilters = memo(function ShopFilters({
  search, onSearchChange,
  categoryFilter, onCategoryChange,
  typeFilter, onTypeChange,
  categories,
  sortBy = "newest",
  onSortChange,
}: ShopFiltersProps) {
  const { language } = useLanguage();
  const isAr = language === "ar";

  return (
    <div className="sticky top-12 z-40 -mx-4 mb-10 border-y border-border/40 bg-background/80 px-4 py-4 backdrop-blur-md md:rounded-2xl md:border md:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row">
          <div className="relative flex-1 sm:max-w-md">
            <Search className="absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
            <Input
              placeholder={isAr ? "ابحث عن منتج، ماركة..." : "Search product, brand..."}
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="h-11 border-border/40 bg-muted/20 ps-11 transition-all focus:bg-background focus:ring-primary/20 rounded-xl"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            {categories.length > 0 && (
              <Select value={categoryFilter} onValueChange={onCategoryChange}>
                <SelectTrigger className="h-11 w-full border-border/40 bg-muted/20 rounded-xl sm:w-44 focus:ring-primary/20">
                  <SelectValue placeholder={isAr ? "التصنيف" : "Category"} />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border/40">
                  <SelectItem value="all" className="rounded-xl">{isAr ? "جميع التصنيفات" : "All Categories"}</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat} className="rounded-xl">{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <Select value={typeFilter} onValueChange={onTypeChange}>
              <SelectTrigger className="h-11 w-full border-border/40 bg-muted/20 rounded-xl sm:w-44 focus:ring-primary/20">
                <SelectValue placeholder={isAr ? "النوع" : "Type"} />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border/40">
                <SelectItem value="all" className="rounded-xl">{isAr ? "جميع الأنواع" : "All Types"}</SelectItem>
                <SelectItem value="physical" className="rounded-xl">{isAr ? "منتج مادي" : "Physical"}</SelectItem>
                <SelectItem value="digital" className="rounded-xl">{isAr ? "رقمي" : "Digital"}</SelectItem>
                <SelectItem value="service" className="rounded-xl">{isAr ? "خدمة" : "Service"}</SelectItem>
              </SelectContent>
            </Select>

            {onSortChange && (
              <Select value={sortBy} onValueChange={(v) => onSortChange(v as SortOption)}>
                <SelectTrigger className="h-11 w-auto min-w-[42px] border-border/40 bg-muted/20 rounded-xl sm:w-44 focus:ring-primary/20">
                  <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0 sm:me-1.5" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border/40">
                  <SelectItem value="newest" className="rounded-xl">{isAr ? "الأحدث" : "Newest"}</SelectItem>
                  <SelectItem value="price_asc" className="rounded-xl">{isAr ? "السعر: الأقل" : "Price: Low → High"}</SelectItem>
                  <SelectItem value="price_desc" className="rounded-xl">{isAr ? "السعر: الأعلى" : "Price: High → Low"}</SelectItem>
                  <SelectItem value="popular" className="rounded-xl">{isAr ? "الأكثر شعبية" : "Most Popular"}</SelectItem>
                  <SelectItem value="name" className="rounded-xl">{isAr ? "الاسم" : "Name"}</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});
