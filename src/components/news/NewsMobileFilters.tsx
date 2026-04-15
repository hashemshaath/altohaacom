import { memo } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SlidersHorizontal, X } from "lucide-react";
import { NewsTagsFilter } from "./NewsTagsFilter";
import { NewsDateRangeFilter } from "./NewsDateRangeFilter";

interface ContentTag {
  id: string;
  name: string;
  name_ar: string | null;
  slug: string;
}

interface Category {
  id: string;
  name: string;
  name_ar: string | null;
  slug: string;
}

interface Props {
  isAr: boolean;
  activeFilterCount: number;
  categories: Category[];
  selectedCategory: string;
  onCategoryChange: (v: string) => void;
  sortBy: string;
  onSortChange: (v: string) => void;
  sortOptions: { value: string; en: string; ar: string }[];
  tags: ContentTag[];
  selectedTags: string[];
  onToggleTag: (tagId: string) => void;
  dateFrom: string;
  dateTo: string;
  onDateFromChange: (v: string) => void;
  onDateToChange: (v: string) => void;
  onDateClear: () => void;
  onClearAll: () => void;
}

export const NewsMobileFilters = memo(function NewsMobileFilters({
  isAr, activeFilterCount, categories, selectedCategory, onCategoryChange,
  sortBy, onSortChange, sortOptions, tags, selectedTags, onToggleTag,
  dateFrom, dateTo, onDateFromChange, onDateToChange, onDateClear, onClearAll,
}: Props) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="rounded-xl gap-1.5 h-10 shrink-0 relative lg:hidden">
          <SlidersHorizontal className="h-3.5 w-3.5" />
          {isAr ? "فلاتر" : "Filters"}
          {activeFilterCount > 0 && (
            <span className="absolute -top-1.5 -end-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-xs font-bold">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[80vh] overflow-y-auto">
        <SheetHeader className="text-start">
          <SheetTitle className="flex items-center justify-between">
            {isAr ? "الفلاتر" : "Filters"}
            {activeFilterCount > 0 && (
              <Button variant="ghost" size="sm" className="text-xs text-destructive" onClick={onClearAll}>
                <X className="h-3 w-3 me-1" />
                {isAr ? "مسح الكل" : "Clear all"}
              </Button>
            )}
          </SheetTitle>
          <SheetDescription className="text-xs">
            {isAr ? "تصفية المقالات حسب معايير مختلفة" : "Filter articles by various criteria"}
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-5 mt-4">
          {/* Category */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-2 block">
              {isAr ? "التصنيف" : "Category"}
            </label>
            <Select value={selectedCategory} onValueChange={onCategoryChange}>
              <SelectTrigger className="h-10 rounded-xl border-border/40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">{isAr ? "جميع التصنيفات" : "All Categories"}</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {isAr && cat.name_ar ? cat.name_ar : cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Sort */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-2 block">
              {isAr ? "الترتيب" : "Sort by"}
            </label>
            <Select value={sortBy} onValueChange={onSortChange}>
              <SelectTrigger className="h-10 rounded-xl border-border/40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {sortOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {isAr ? opt.ar : opt.en}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tags */}
          {tags.length > 0 && (
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-2 block">
                {isAr ? "الوسوم" : "Tags"}
              </label>
              <NewsTagsFilter tags={tags} selectedTags={selectedTags} onToggleTag={onToggleTag} isAr={isAr} />
            </div>
          )}

          {/* Date Range */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-2 block">
              {isAr ? "الفترة الزمنية" : "Date range"}
            </label>
            <NewsDateRangeFilter
              dateFrom={dateFrom}
              dateTo={dateTo}
              onDateFromChange={onDateFromChange}
              onDateToChange={onDateToChange}
              onClear={onDateClear}
              isAr={isAr}
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
});
