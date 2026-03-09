import { memo, type ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface AdminTableCardProps {
  children: ReactNode;
  title?: string;
  actions?: ReactNode;
  className?: string;
  /** Add padding around table content. Default: false (p-0 for full-bleed tables) */
  padded?: boolean;
}

/**
 * Standardized card wrapper for admin tables.
 * Provides consistent rounded corners, border styling, and optional header.
 */
export const AdminTableCard = memo(function AdminTableCard({
  children,
  title,
  actions,
  className,
  padded = false,
}: AdminTableCardProps) {
  return (
    <Card className={cn("rounded-2xl border-border/50 overflow-hidden shadow-sm", className)}>
      {title && (
        <CardHeader className="pb-3 pt-4 px-5">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold">{title}</CardTitle>
            {actions && <div className="flex items-center gap-2">{actions}</div>}
          </div>
        </CardHeader>
      )}
      <CardContent className={cn(padded ? "p-5" : "p-0")}>
        {children}
      </CardContent>
    </Card>
  );
});
