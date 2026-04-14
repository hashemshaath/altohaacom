import React, { forwardRef } from "react";
import { type, LucideIcon } from "lucide-react";
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
    <div
      ref={ref}
      className={cn(
        "flex items-center justify-between py-1 animate-in fade-in-50 slide-in-from-bottom-1 duration-300",
        className
      )}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 transition-all duration-200 hover:bg-primary/15">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight font-sans">{title}</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      {actions && <div className="hidden sm:flex items-center gap-2">{actions}</div>}
    </div>
  );
});

export default AdminPageHeader;
