import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Inbox, type LucideIcon } from "lucide-react";
import { memo } from "react";

interface WidgetEmptyProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

/**
 * Card-level empty state for admin widgets.
 * Compact version of EmptyState for widget contexts.
 */
export const WidgetEmpty = memo(function WidgetEmpty({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
}: WidgetEmptyProps) {
  return (
    <Card className={cn("", className)}>
      <CardContent className="flex flex-col items-center justify-center py-8 text-center">
        <Icon className="h-8 w-8 text-muted-foreground/40 mb-2" />
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        {description && (
          <p className="text-xs text-muted-foreground/70 mt-1 max-w-[200px]">{description}</p>
        )}
        {action && <div className="mt-3">{action}</div>}
      </CardContent>
    </Card>
  );
});
