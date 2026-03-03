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

export const SectionHeader = forwardRef<HTMLDivElement, SectionHeaderProps>(
  function SectionHeader(
    { icon: Icon, badge, title, subtitle, viewAllHref, viewAllLabel, isAr = false, actions, filters, className },
    ref
  ) {
    return (
      <SectionReveal ref={ref}>
        <div className={cn("mb-8", className)}>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <Badge variant="secondary" className="gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider">
                  <Icon className="h-3 w-3" />
                  {badge}
                </Badge>
              </div>
              <h2 className={cn(
                "text-xl font-bold sm:text-2xl lg:text-3xl text-foreground tracking-tight leading-tight",
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

          {filters && (
            <div className="mt-3 flex items-center gap-1.5 flex-wrap">
              <Filter className="h-3 w-3 text-muted-foreground/50 shrink-0" />
              {filters}
            </div>
          )}
        </div>
      </SectionReveal>
    );
  }
);

SectionHeader.displayName = "SectionHeader";
