import { memo, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Database, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { SectionReveal } from "@/components/ui/section-reveal";

export interface SectionHeaderProps {
  /** Section icon component */
  icon: React.ElementType;
  /** Badge label */
  badge: string;
  /** Main heading */
  title: string;
  /** Subtitle text */
  subtitle?: string;
  /** Data source label (e.g. "competitions • 8 items") */
  dataSource?: string;
  /** Total items loaded */
  itemCount?: number;
  /** "View All" link */
  viewAllHref?: string;
  /** "View All" label */
  viewAllLabel?: string;
  /** RTL mode */
  isAr?: boolean;
  /** Additional actions (filters, toggles) rendered inline */
  actions?: ReactNode;
  /** Filter chips rendered below header */
  filters?: ReactNode;
  /** Custom class */
  className?: string;
}

export const SectionHeader = memo(function SectionHeader({
  icon: Icon,
  badge,
  title,
  subtitle,
  dataSource,
  itemCount,
  viewAllHref,
  viewAllLabel,
  isAr = false,
  actions,
  filters,
  className,
}: SectionHeaderProps) {
  return (
    <SectionReveal>
      <div className={cn("mb-6", className)}>
        {/* Top row: badge + title + view all */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Badge variant="secondary" className="gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider">
                <Icon className="h-3 w-3" />
                {badge}
              </Badge>
              {/* dataSource badge hidden – internal/dev info */}
            </div>
            <h2 className={cn(
              "text-xl font-bold sm:text-2xl text-foreground tracking-tight leading-tight",
              !isAr && "font-serif"
            )}>
              {title}
            </h2>
            {subtitle && (
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{subtitle}</p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {actions}
            {viewAllHref && (
              <Button variant="outline" size="sm" className="rounded-xl gap-1.5 font-semibold" asChild>
                <Link to={viewAllHref}>
                  {viewAllLabel || (isAr ? "عرض الكل" : "View All")}
                  <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
                </Link>
              </Button>
            )}
          </div>
        </div>

        {/* Filter row */}
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
