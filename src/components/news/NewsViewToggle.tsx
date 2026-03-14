import { memo } from "react";
import { LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ViewMode = "grid" | "list";

interface Props {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
}

export const NewsViewToggle = memo(function NewsViewToggle({ mode, onChange }: Props) {
  return (
    <div className="flex items-center rounded-xl border border-border/40 bg-muted/20 p-0.5">
      {([
        { value: "grid" as const, Icon: LayoutGrid },
        { value: "list" as const, Icon: List },
      ]).map(({ value, Icon }) => (
        <Button
          key={value}
          variant="ghost"
          size="icon"
          className={cn(
            "h-8 w-8 rounded-lg transition-all",
            mode === value && "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
          )}
          onClick={() => onChange(value)}
          aria-label={value === "grid" ? "Grid view" : "List view"}
        >
          <Icon className="h-3.5 w-3.5" />
        </Button>
      ))}
    </div>
  );
});
