import { React, forwardRef, type ReactNode } from "react";
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
      <div ref={ref} className={cn("mb-4 sm:mb-5", className)}>
        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
          <Badge variant="secondary" className="gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider">
            <Icon className="h-3 w-3" />
            {badge}
          </Badge>
        </div>
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h2
              className={cn(
                "text-[20px] font-bold sm:text-2xl lg:text-3xl text-foreground tracking-tight leading-tight truncate",
                !isAr && "font-serif"
              )}
            >
              {title}
            </h2>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {actions}
            {viewAllHref && (
              <Button variant="ghost" size="sm" className="rounded-xl gap-1 text-xs font-semibold text-primary h-8 px-2.5 touch-manipulation" asChild>
                <Link to={viewAllHref} aria-label={viewAllLabel || (isAr ? `عرض الكل - ${title}` : `View all ${title}`)}>
                  {viewAllLabel || (isAr ? "عرض الكل" : "View All")}
                  <ArrowRight className="h-3 w-3 rtl:rotate-180" aria-hidden="true" />
                </Link>
              </Button>
            )}
          </div>
        </div>
        {subtitle && <p className="mt-1 text-[13px] sm:text-sm text-muted-foreground leading-relaxed">{subtitle}</p>}

        {filters && (
          <div className="mt-3 flex items-center gap-1.5 flex-wrap">
            <Filter className="h-3 w-3 text-muted-foreground/50 shrink-0" />
            {filters}
          </div>
        )}
      </div>
    </SectionReveal>
  );
});

SectionHeader.displayName = "SectionHeader";

