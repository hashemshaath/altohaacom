import { useState, useCallback } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Search, Bookmark, BookmarkCheck, X, SlidersHorizontal } from "lucide-react";

interface SavedFilter {
  id: string;
  label: string;
  values: Record<string, string>;
}

const SAVED_FILTERS_KEY = "admin-saved-filters";

function loadSavedFilters(scope: string): SavedFilter[] {
  try {
    const raw = localStorage.getItem(`${SAVED_FILTERS_KEY}-${scope}`);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function persistSavedFilters(scope: string, filters: SavedFilter[]) {
  localStorage.setItem(`${SAVED_FILTERS_KEY}-${scope}`, JSON.stringify(filters));
}

interface AdminFilterBarProps {
  /** Unique scope key for persisting saved filters */
  scope: string;
  /** Search value */
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  /** Current filter values as key-value pairs */
  filterValues: Record<string, string>;
  /** Filter select elements rendered as children */
  children?: React.ReactNode;
  className?: string;
}

export function AdminFilterBar({
  scope,
  searchValue,
  onSearchChange,
  searchPlaceholder,
  filterValues,
  children,
  className,
}: AdminFilterBarProps) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [savedFilters, setSavedFilters] = useState(() => loadSavedFilters(scope));
  const [saveOpen, setSaveOpen] = useState(false);
  const [newFilterLabel, setNewFilterLabel] = useState("");

  const hasActiveFilters = Object.values(filterValues).some((v) => v !== "all" && v !== "");

  const handleSave = useCallback(() => {
    if (!newFilterLabel.trim()) return;
    const newFilter: SavedFilter = {
      id: crypto.randomUUID(),
      label: newFilterLabel.trim(),
      values: { ...filterValues, search: searchValue },
    };
    const updated = [...savedFilters, newFilter];
    setSavedFilters(updated);
    persistSavedFilters(scope, updated);
    setNewFilterLabel("");
    setSaveOpen(false);
  }, [newFilterLabel, filterValues, searchValue, savedFilters, scope]);

  const handleDeleteSaved = (id: string) => {
    const updated = savedFilters.filter((f) => f.id !== id);
    setSavedFilters(updated);
    persistSavedFilters(scope, updated);
  };

  const handleApplySaved = (filter: SavedFilter) => {
    if (filter.values.search !== undefined) onSearchChange(filter.values.search);
    // Parent must handle the rest via filterValues changes — emit via custom event
    window.dispatchEvent(new CustomEvent("admin-filter-apply", { detail: { scope, values: filter.values } }));
  };

  return (
    <Card className={className}>
      <CardContent className="flex flex-wrap items-center gap-3 p-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder || (isAr ? "بحث..." : "Search...")}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="ps-10"
          />
        </div>

        {children}

        {/* Save current filter */}
        {hasActiveFilters && (
          <Popover open={saveOpen} onOpenChange={setSaveOpen}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
                <Bookmark className="h-3.5 w-3.5" />
                {isAr ? "حفظ الفلتر" : "Save Filter"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3 space-y-2">
              <Input
                value={newFilterLabel}
                onChange={(e) => setNewFilterLabel(e.target.value)}
                placeholder={isAr ? "اسم الفلتر..." : "Filter name..."}
                className="h-8 text-sm"
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
              />
              <Button size="sm" className="w-full h-8" onClick={handleSave} disabled={!newFilterLabel.trim()}>
                {isAr ? "حفظ" : "Save"}
              </Button>
            </PopoverContent>
          </Popover>
        )}

        {/* Saved filters */}
        {savedFilters.length > 0 && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                <BookmarkCheck className="h-3.5 w-3.5" />
                {savedFilters.length}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-2 space-y-1">
              <p className="text-xs font-semibold text-muted-foreground px-2 py-1">
                {isAr ? "الفلاتر المحفوظة" : "Saved Filters"}
              </p>
              {savedFilters.map((f) => (
                <div key={f.id} className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1 justify-start h-7 text-xs"
                    onClick={() => handleApplySaved(f)}
                  >
                    <SlidersHorizontal className="me-1.5 h-3 w-3" />
                    {f.label}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0"
                    onClick={() => handleDeleteSaved(f.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </PopoverContent>
          </Popover>
        )}
      </CardContent>
    </Card>
  );
}
