import { forwardRef, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FilterChipProps {
  label: string;
  active: boolean;
  count?: number;
  onClick: () => void;
  icon?: ReactNode;
}

export const FilterChip = forwardRef<HTMLButtonElement, FilterChipProps>(
  ({ label, active, count, onClick, icon }, ref) => {
    return (
      <Button
        ref={ref}
        variant={active ? "default" : "outline"}
        size="sm"
        className={cn(
          "h-7 rounded-full typo-filter-pill px-3 gap-1 transition-all",
          !active && "hover:bg-accent/50 border-dashed"
        )}
        onClick={onClick}
      >
        {icon}
        {label}
        {typeof count === "number" && count > 0 && (
          <span
            className={cn(
              "text-xs tabular-nums",
              active ? "opacity-80" : "opacity-50"
            )}
          >
            ({count})
          </span>
        )}
      </Button>
    );
  }
);

FilterChip.displayName = "FilterChip";

