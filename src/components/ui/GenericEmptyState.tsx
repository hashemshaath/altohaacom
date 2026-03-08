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
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/60 mb-4">
        <Icon className="h-7 w-7 text-muted-foreground/60" />
      </div>
      <h3 className="text-base font-semibold mb-1">{title}</h3>
      {description && <p className="text-sm text-muted-foreground max-w-sm">{description}</p>}
      {actionLabel && (actionHref ? (
        <Button variant="outline" size="sm" className="mt-4 rounded-xl" asChild>
          <Link to={actionHref}>{actionLabel}</Link>
        </Button>
      ) : onAction ? (
        <Button variant="outline" size="sm" className="mt-4 rounded-xl" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null)}
    </div>
  );
}
