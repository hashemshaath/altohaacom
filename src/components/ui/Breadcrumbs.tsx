import { useIsAr } from "@/hooks/useIsAr";
import { memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

interface BreadcrumbItem {
  label: string;
  labelAr?: string;
  href?: string;
}

interface Props {
  items: BreadcrumbItem[];
  className?: string;
}

/**
 * Simple breadcrumb navigation for nested pages.
 */
export const Breadcrumbs = memo(function Breadcrumbs({ items, className }: Props) {
  const isAr = useIsAr();

  return (
    <nav className={cn("flex items-center gap-1.5 text-xs text-muted-foreground animate-in fade-in-50 duration-300", className)} aria-label="Breadcrumb">
      {items.map((item, i) => {
        const label = isAr && item.labelAr ? item.labelAr : item.label;
        const isLast = i === items.length - 1;
        return (
          <span key={i} className="inline-flex items-center gap-1.5">
            {i > 0 && <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground/40 rtl:rotate-180" />}
            {item.href && !isLast ? (
              <Link to={item.href} className="hover:text-foreground transition-colors duration-200 hover:underline underline-offset-2">
                {label}
              </Link>
            ) : (
              <span className={isLast ? "font-semibold text-foreground" : ""}>{label}</span>
            )}
          </span>
        );
      })}
    </nav>
  );
});
