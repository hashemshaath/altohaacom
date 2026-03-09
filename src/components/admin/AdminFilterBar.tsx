import { memo, type ReactNode } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface AdminFilterBarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  /** Additional filter controls (Selects, Buttons, etc.) */
  children?: ReactNode;
  className?: string;
}

/**
 * Unified search + filter bar for all admin sub-pages.
 * Wraps in a subtle card with consistent layout and rounded inputs.
 */
export const AdminFilterBar = memo(function AdminFilterBar({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search...",
  children,
  className,
}: AdminFilterBarProps) {
  return (
    <Card className={cn("rounded-2xl border-border/50 shadow-sm", className)} role="search" aria-label="Filter controls">
      <CardContent className="py-3 px-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" aria-hidden="true" />
              <Input
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                className="ps-9 rounded-xl h-9 text-sm border-border/60 focus-visible:ring-primary/30"
                aria-label={searchPlaceholder}
                type="search"
              />
            </div>
          </div>
          {children}
        </div>
      </CardContent>
    </Card>
  );
});
