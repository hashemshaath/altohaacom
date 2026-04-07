import { memo } from "react";
import { Badge } from "@/components/ui/badge";
import { X, Calendar as CalendarIcon, Tag, FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface ContentTag {
  id: string;
  name: string;
  name_ar: string | null;
}

interface Category {
  id: string;
  name: string;
  name_ar: string | null;
}

interface Props {
  isAr: boolean;
  searchQuery: string;
  onClearSearch: () => void;
  selectedCategory: string;
  categories: Category[];
  onClearCategory: () => void;
  selectedTags: string[];
  tags: ContentTag[];
  onRemoveTag: (tagId: string) => void;
  dateFrom: string;
  dateTo: string;
  onClearDates: () => void;
  onClearAll: () => void;
}

export const NewsActiveFilters = memo(function NewsActiveFilters({
  isAr, searchQuery, onClearSearch, selectedCategory, categories,
  onClearCategory, selectedTags, tags, onRemoveTag, dateFrom, dateTo,
  onClearDates, onClearAll,
}: Props) {
  const hasAny = searchQuery || selectedCategory !== "all" || selectedTags.length > 0 || dateFrom || dateTo;
  if (!hasAny) return null;

  const categoryName = selectedCategory !== "all"
    ? (() => {
        const cat = categories.find((c) => c.id === selectedCategory);
        return cat ? (isAr && cat.name_ar ? cat.name_ar : cat.name) : null;
      })()
    : null;

  return (
    <div className="flex flex-wrap items-center gap-1.5 mb-5 animate-in fade-in-50 slide-in-from-top-2 duration-200">
      <span className="text-[12px] text-muted-foreground/60 font-medium uppercase tracking-wider me-1">
        {isAr ? "الفلاتر:" : "Filters:"}
      </span>

      {searchQuery && (
        <FilterChip
          label={`"${searchQuery}"`}
          icon="search"
          onRemove={onClearSearch}
        />
      )}

      {categoryName && (
        <FilterChip
          label={categoryName}
          icon="category"
          onRemove={onClearCategory}
        />
      )}

      {selectedTags.map((tagId) => {
        const tag = tags.find((t) => t.id === tagId);
        if (!tag) return null;
        return (
          <FilterChip
            key={tagId}
            label={isAr && tag.name_ar ? tag.name_ar : tag.name}
            icon="tag"
            onRemove={() => onRemoveTag(tagId)}
          />
        );
      })}

      {(dateFrom || dateTo) && (
        <FilterChip
          label={`${dateFrom || "..."} → ${dateTo || "..."}`}
          icon="date"
          onRemove={onClearDates}
        />
      )}

      <button
        onClick={onClearAll}
        className="text-[12px] text-muted-foreground hover:text-destructive transition-colors underline underline-offset-2 ms-1"
      >
        {isAr ? "مسح الكل" : "Clear all"}
      </button>
    </div>
  );
});

function FilterChip({ label, icon, onRemove }: { label: string; icon: string; onRemove: () => void }) {
  return (
    <Badge
      variant="secondary"
      className="gap-1 pe-1 ps-2 py-0.5 rounded-lg text-[12px] font-medium bg-primary/10 text-primary border-0 hover:bg-primary/15 transition-colors group cursor-default"
    >
      {icon === "tag" && <Tag className="h-2 w-2 opacity-60" />}
      {icon === "category" && <FolderOpen className="h-2 w-2 opacity-60" />}
      {icon === "date" && <CalendarIcon className="h-2 w-2 opacity-60" />}
      <span className="max-w-[120px] truncate">{label}</span>
      <button
        onClick={(e) => { e.stopPropagation(); onRemove(); }}
        className="flex h-3.5 w-3.5 items-center justify-center rounded-full hover:bg-destructive/20 hover:text-destructive transition-colors"
        aria-label="Remove filter"
      >
        <X className="h-2 w-2" />
      </button>
    </Badge>
  );
}
