import { memo } from "react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Plus, type, LucideIcon } from "lucide-react";

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

export const AdminEmptyState = memo(function AdminEmptyState({
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
    <div className={cn("flex flex-col items-center justify-center py-16 text-center animate-in fade-in-50 slide-in-from-bottom-3 duration-500", className)}>
      <div className="relative mb-5">
        {/* Ambient glow */}
        <div className="absolute inset-0 rounded-3xl bg-primary/5 blur-xl scale-150" />
        <div className="relative flex h-18 w-18 items-center justify-center rounded-3xl bg-gradient-to-br from-muted/80 to-muted/30 ring-1 ring-border/30 transition-all duration-500 hover:ring-primary/20 hover:shadow-xl hover:shadow-primary/5 hover:scale-110 group">
          <Icon className="h-8 w-8 text-muted-foreground/40 transition-all duration-500 group-hover:text-primary/50 group-hover:scale-110" />
        </div>
      </div>
      <h3 className="text-base font-semibold text-foreground">
        {isAr && titleAr ? titleAr : title}
      </h3>
      {(description || descriptionAr) && (
        <p className="mt-2 max-w-xs text-sm text-muted-foreground leading-relaxed">
          {isAr && descriptionAr ? descriptionAr : description}
        </p>
      )}
      {(actionLabel || actionLabelAr) && (
        actionLink ? (
          <Button asChild size="sm" className="mt-6 gap-1.5 rounded-xl shadow-md shadow-primary/15 active:scale-95 transition-all">
            <Link to={actionLink}>
              <Plus className="h-3.5 w-3.5" />
              {isAr && actionLabelAr ? actionLabelAr : actionLabel}
            </Link>
          </Button>
        ) : onAction ? (
          <Button size="sm" className="mt-6 gap-1.5 rounded-xl shadow-md shadow-primary/15 active:scale-95 transition-all" onClick={onAction}>
            <Plus className="h-3.5 w-3.5" />
            {isAr && actionLabelAr ? actionLabelAr : actionLabel}
          </Button>
        ) : null
      )}
    </div>
  );
});
