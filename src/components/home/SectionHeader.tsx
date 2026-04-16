import { forwardRef, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { SectionReveal } from "@/components/ui/section-reveal";

export interface SectionHeaderProps {
  icon: React.ElementType;
  badge: string;
  title: string;
  subtitle?: string;
  dataSource?: string;
  itemCount?: number;
  viewAllHref?: string;
  viewAllLabel?: string;
  isAr?: boolean;
  actions?: ReactNode;
  filters?: ReactNode;
  className?: string;
}

export const SectionHeader = forwardRef<HTMLDivElement, SectionHeaderProps>(function SectionHeader(
  { icon: Icon, badge, title, subtitle, viewAllHref, viewAllLabel, isAr = false, actions, filters, className },
  ref
) {
  return (
    <SectionReveal>
      <div ref={ref} className={cn("mb-5 sm:mb-6", className)}>
        {/* Badge row */}
        <div className="flex items-center gap-2.5 mb-2">
          <Badge
            variant="secondary"
            className="gap-1.5 px-3 py-1.5 typo-section-overline rounded-lg bg-primary/8 border-primary/15"
          >
            <Icon className="h-3.5 w-3.5" />
            {badge}
          </Badge>
        </div>

        {/* Title row */}
        <div className="section-header-row">
          <div className="min-w-0 flex-1">
            <h2
              className={cn(
                "text-h2 text-foreground tracking-tight leading-tight",
                !isAr && "font-serif"
              )}
            >
              {title}
            </h2>
            {subtitle && (
              <p className="mt-1.5 text-body-sm text-muted-foreground leading-relaxed max-w-2xl">
                {subtitle}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0 section-header-cta">
            {actions}
            {viewAllHref && (
              <Button
                variant="ghost"
                size="sm"
                className="rounded-xl gap-1.5 text-xs font-semibold text-primary h-9 px-3 hover:bg-primary/5 touch-manipulation"
                asChild
              >
                <Link
                  to={viewAllHref}
                  aria-label={viewAllLabel || (isAr ? `عرض الكل - ${title}` : `View all ${title}`)}
                >
                  {viewAllLabel || (isAr ? "عرض الكل" : "View All")}
                  <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" aria-hidden="true" />
                </Link>
              </Button>
            )}
          </div>
        </div>

        {/* Filters row */}
        {filters && (
          <div className="mt-3.5 flex items-center gap-1.5 flex-wrap">
            <Filter className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
            {filters}
          </div>
        )}

        {/* Decorative divider */}
        <div className="mt-4 h-px bg-gradient-to-r from-border/60 via-border/30 to-transparent" />
      </div>
    </SectionReveal>
  );
});

SectionHeader.displayName = "SectionHeader";
