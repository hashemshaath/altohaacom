import { memo } from "react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Plus, type LucideIcon } from "lucide-react";

interface AdminEmptyStateProps {
  icon: LucideIcon;
  title: string;
  titleAr?: string;
  description?: string;
  descriptionAr?: string;
  actionLabel?: string;
  actionLabelAr?: string;
  actionLink?: string;
  onAction?: () => void;
  className?: string;
}

export function AdminEmptyState({
  icon: Icon,
  title,
  titleAr,
  description,
  descriptionAr,
  actionLabel,
  actionLabelAr,
  actionLink,
  onAction,
  className,
}: AdminEmptyStateProps) {
  const { language } = useLanguage();
  const isAr = language === "ar";

  return (
    <div className={cn("flex flex-col items-center justify-center py-16 text-center", className)}>
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-muted/60 ring-1 ring-border/30">
        <Icon className="h-7 w-7 text-muted-foreground/50" />
      </div>
      <h3 className="text-sm font-semibold text-foreground">
        {isAr && titleAr ? titleAr : title}
      </h3>
      {(description || descriptionAr) && (
        <p className="mt-1 max-w-xs text-xs text-muted-foreground">
          {isAr && descriptionAr ? descriptionAr : description}
        </p>
      )}
      {(actionLabel || actionLabelAr) && (
        actionLink ? (
          <Button asChild variant="outline" size="sm" className="mt-4 gap-1.5 rounded-xl">
            <Link to={actionLink}>
              <Plus className="h-3.5 w-3.5" />
              {isAr && actionLabelAr ? actionLabelAr : actionLabel}
            </Link>
          </Button>
        ) : onAction ? (
          <Button variant="outline" size="sm" className="mt-4 gap-1.5 rounded-xl" onClick={onAction}>
            <Plus className="h-3.5 w-3.5" />
            {isAr && actionLabelAr ? actionLabelAr : actionLabel}
          </Button>
        ) : null
      )}
    </div>
  );
}
