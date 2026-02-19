import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, X, Filter } from "lucide-react";
import { ITEM_STATUS_LABELS } from "./OrderStatusLabels";
import { ORDER_CATEGORIES } from "./OrderCenterCategories";

interface Props {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilter?: string;
  onStatusChange?: (value: string) => void;
  categoryFilter?: string;
  onCategoryChange?: (value: string) => void;
  resultCount?: number;
  isAr: boolean;
  showStatus?: boolean;
  showCategory?: boolean;
}

export function OrderSearchFilter({
  searchQuery,
  onSearchChange,
  statusFilter = "all",
  onStatusChange,
  categoryFilter = "all",
  onCategoryChange,
  resultCount,
  isAr,
  showStatus = true,
  showCategory = true,
}: Props) {
  const hasFilters = searchQuery || statusFilter !== "all" || categoryFilter !== "all";

  const clearAll = () => {
    onSearchChange("");
    onStatusChange?.("all");
    onCategoryChange?.("all");
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute start-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={isAr ? "بحث عن عنصر..." : "Search items..."}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-8 ps-8 pe-8 text-xs"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute end-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          {showStatus && onStatusChange && (
            <Select value={statusFilter} onValueChange={onStatusChange}>
              <SelectTrigger className="h-8 w-28 text-[11px]">
                <Filter className="me-1 h-3 w-3 shrink-0" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">{isAr ? "كل الحالات" : "All Status"}</SelectItem>
                {Object.entries(ITEM_STATUS_LABELS).map(([key, val]) => (
                  <SelectItem key={key} value={key} className="text-xs">
                    {isAr ? val.ar : val.en}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {showCategory && onCategoryChange && (
            <Select value={categoryFilter} onValueChange={onCategoryChange}>
              <SelectTrigger className="h-8 w-32 text-[11px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">{isAr ? "كل الفئات" : "All Categories"}</SelectItem>
                {ORDER_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value} className="text-xs">
                    {isAr ? cat.labelAr : cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Active filter badges */}
      {hasFilters && (
        <div className="flex items-center gap-1.5 flex-wrap">
          {resultCount !== undefined && (
            <span className="text-[10px] text-muted-foreground">
              {resultCount} {isAr ? "نتيجة" : "results"}
            </span>
          )}
          {searchQuery && (
            <Badge variant="secondary" className="text-[10px] gap-1 h-5">
              "{searchQuery}"
              <X className="h-2.5 w-2.5 cursor-pointer" onClick={() => onSearchChange("")} />
            </Badge>
          )}
          {statusFilter !== "all" && (
            <Badge variant="secondary" className="text-[10px] gap-1 h-5">
              {isAr ? ITEM_STATUS_LABELS[statusFilter]?.ar : ITEM_STATUS_LABELS[statusFilter]?.en}
              <X className="h-2.5 w-2.5 cursor-pointer" onClick={() => onStatusChange?.("all")} />
            </Badge>
          )}
          {categoryFilter !== "all" && (
            <Badge variant="secondary" className="text-[10px] gap-1 h-5">
              {(() => {
                const cat = ORDER_CATEGORIES.find(c => c.value === categoryFilter);
                return isAr ? cat?.labelAr : cat?.label;
              })()}
              <X className="h-2.5 w-2.5 cursor-pointer" onClick={() => onCategoryChange?.("all")} />
            </Badge>
          )}
          <button onClick={clearAll} className="text-[10px] text-primary hover:underline">
            {isAr ? "مسح الكل" : "Clear all"}
          </button>
        </div>
      )}
    </div>
  );
}
