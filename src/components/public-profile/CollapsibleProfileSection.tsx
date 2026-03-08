import { useState, memo } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface CollapsibleProfileSectionProps {
  icon: React.ElementType;
  label: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  count?: number;
  className?: string;
  /** Empty state: if true, renders children dimmed and non-collapsible */
  isEmpty?: boolean;
}

export const CollapsibleProfileSection = memo(function CollapsibleProfileSection({
  icon: Icon,
  label,
  children,
  defaultOpen = true,
  count,
  className,
  isEmpty,
}: CollapsibleProfileSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  if (isEmpty) {
    return (
      <div className={cn("", className)}>
        <div className="flex items-center gap-2.5 mb-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-muted/60">
            <Icon className="h-4 w-4 text-muted-foreground/50" />
          </div>
          <h2 className="font-serif text-base font-bold text-muted-foreground/60">{label}</h2>
          <div className="flex-1 h-px bg-border/15" />
        </div>
        <div className="opacity-60">{children}</div>
      </div>
    );
  }

  return (
    <div className={cn("", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2.5 mb-3 w-full group cursor-pointer select-none"
        aria-expanded={open}
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/8 group-hover:bg-primary/15 transition-colors duration-200">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <h2 className="font-serif text-base font-bold group-hover:text-primary transition-colors duration-200">
          {label}
        </h2>
        {typeof count === "number" && count > 0 && (
          <span className="text-[10px] font-semibold text-muted-foreground bg-muted rounded-full px-2 py-0.5 min-w-[20px] text-center">
            {count}
          </span>
        )}
        <div className="flex-1 h-px bg-border/25" />
        <ChevronDown
          className={cn(
            "h-4 w-4 text-muted-foreground/50 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:text-primary",
            open && "rotate-180"
          )}
        />
      </button>

      <div
        className={cn(
          "grid transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)]",
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        )}
      >
        <div className="overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}
