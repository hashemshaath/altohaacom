import { forwardRef } from "react";
import { LucideIcon, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState = forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ icon: Icon = Inbox, title, description, action, className }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/60 bg-muted/30 py-14 px-6 text-center animate-fade-in",
          className
        )}
      >
        <div className="rounded-full bg-primary/10 p-3.5">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        {description && (
          <p className="max-w-xs text-sm text-muted-foreground">{description}</p>
        )}
        {action && <div className="mt-1">{action}</div>}
      </div>
    );
  }
);

EmptyState.displayName = "EmptyState";
