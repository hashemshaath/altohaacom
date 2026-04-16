import { createContext, useContext, memo, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Compound component for consistent data display lists.
 * Usage:
 *   <DataList>
 *     <DataList.Item label="Name" value="John" />
 *     <DataList.Item label="Email" value="john@example.com" />
 *   </DataList>
 */

interface DataListContextValue {
  variant: "horizontal" | "vertical" | "inline";
}

const DataListContext = createContext<DataListContextValue>({ variant: "horizontal" });

interface DataListProps {
  children: ReactNode;
  variant?: "horizontal" | "vertical" | "inline";
  className?: string;
}

function DataListRoot({ children, variant = "horizontal", className }: DataListProps) {
  return (
    <DataListContext.Provider value={{ variant }}>
      <dl
        className={cn(
          variant === "horizontal" && "space-y-3",
          variant === "vertical" && "grid gap-4 sm:grid-cols-2",
          variant === "inline" && "flex flex-wrap gap-x-6 gap-y-2",
          className
        )}
      >
        {children}
      </dl>
    </DataListContext.Provider>
  );
}

interface DataListItemProps {
  label: string;
  value: ReactNode;
  className?: string;
  mono?: boolean;
}

const DataListItem = memo(function DataListItem({ label, value, className, mono }: DataListItemProps) {
  const { variant } = useContext(DataListContext);

  if (variant === "inline") {
    return (
      <div className={cn("flex items-center gap-1.5", className)}>
        <dt className="text-sm text-muted-foreground">{label}:</dt>
        <dd className={cn("text-sm font-medium", mono && "font-mono")}>{value}</dd>
      </div>
    );
  }

  return (
    <div
      className={cn(
        variant === "horizontal" && "flex items-center justify-between",
        variant === "vertical" && "space-y-1",
        className
      )}
    >
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className={cn("text-sm font-medium", mono && "font-mono tabular-nums")}>{value || "—"}</dd>
    </div>
  );
});

export const DataList = Object.assign(DataListRoot, { Item: DataListItem });
