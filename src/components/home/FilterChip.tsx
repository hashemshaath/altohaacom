import { memo } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FilterChipProps {
  label: string;
  active: boolean;
  count?: number;
  onClick: () => void;
  icon?: React.ReactNode;
}

export const FilterChip = memo(function FilterChip({ label, active, count, onClick, icon }: FilterChipProps) {
  return (
    <Button
      variant={active ? "default" : "outline"}
      size="sm"
      className={cn(
        "h-7 rounded-full text-xs px-3 gap-1 transition-all",
        !active && "hover:bg-accent/50 border-dashed"
      )}
      onClick={onClick}
    >
      {icon}
      {label}
      {typeof count === "number" && count > 0 && (
        <span className={cn(
          "text-[10px] tabular-nums",
          active ? "opacity-80" : "opacity-50"
        )}>
          ({count})
        </span>
      )}
    </Button>
  );
});
