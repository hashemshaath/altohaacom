import React, { forwardRef } from "react";
import { type LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

interface AdminPageHeaderProps {
  icon: LucideIcon;
  title: string;
  description: string;
  /** Optional trailing content (badges, buttons, etc.) */
  actions?: React.ReactNode;
}

const AdminPageHeader = forwardRef<HTMLDivElement, AdminPageHeaderProps>(function AdminPageHeader({
  icon: Icon,
  title,
  description,
  actions,
}, ref) {
  return (
    <Card ref={ref} className="overflow-hidden border-border/50 bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <div className="flex items-center justify-between p-5 md:p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <Icon className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="font-serif text-2xl font-bold">{title}</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        {actions && <div className="hidden sm:flex">{actions}</div>}
      </div>
    </Card>
  );
});

export default AdminPageHeader;
