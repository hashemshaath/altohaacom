import React, { forwardRef } from "react";
import { type LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface AdminPageHeaderProps {
  icon: LucideIcon;
  title: string;
  description: string;
  /** Optional trailing content (badges, buttons, etc.) */
  actions?: React.ReactNode;
  className?: string;
}

const AdminPageHeader = forwardRef<HTMLDivElement, AdminPageHeaderProps>(function AdminPageHeader({
  icon: Icon,
  title,
  description,
  actions,
  className,
}, ref) {
  return (
    <Card
      ref={ref}
      className={cn(
        "overflow-hidden border-border/40 bg-gradient-to-br from-primary/5 via-background to-accent/5 animate-in fade-in-50 slide-in-from-bottom-2 duration-500",
        className
      )}
    >
      <div className="flex items-center justify-between p-5 md:p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 ring-1 ring-primary/10 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/10">
            <Icon className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="font-serif text-2xl font-bold tracking-tight">{title}</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        {actions && <div className="hidden sm:flex items-center gap-2">{actions}</div>}
      </div>
    </Card>
  );
});

export default AdminPageHeader;
