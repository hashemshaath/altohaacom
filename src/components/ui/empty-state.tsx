import React from "react";
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
          "flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/60 bg-muted/30 py-14 px-6 text-center animate-in fade-in-50 slide-in-from-bottom-4 duration-500",
          className
        )}
      >
        <div className="rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 p-4 shadow-sm">
          <Icon className="h-7 w-7 text-primary/70" />
        </div>
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        {description && (
          <p className="max-w-xs text-sm text-muted-foreground leading-relaxed">{description}</p>
        )}
        {action && <div className="mt-2">{action}</div>}
      </div>
    );
  }
);

EmptyState.displayName = "EmptyState";
