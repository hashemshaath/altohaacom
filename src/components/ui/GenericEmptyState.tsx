import { memo } from "react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface Props {
  icon: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
}

/**
 * Reusable empty state with optional CTA button.
 */
export const GenericEmptyState = memo(function GenericEmptyState({ icon: Icon, title, description, actionLabel, actionHref, onAction }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-muted/80 to-muted/30 mb-4 shadow-sm">
        <Icon className="h-8 w-8 text-muted-foreground/50" />
      </div>
      <h3 className="text-base font-semibold mb-1">{title}</h3>
      {description && <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">{description}</p>}
      {actionLabel && (actionHref ? (
        <Button variant="outline" size="sm" className="mt-4 rounded-xl gap-1.5" asChild>
          <Link to={actionHref}>{actionLabel}</Link>
        </Button>
      ) : onAction ? (
        <Button variant="outline" size="sm" className="mt-4 rounded-xl gap-1.5" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null)}
    </div>
  );
});
