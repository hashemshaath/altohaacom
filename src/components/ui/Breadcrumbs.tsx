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
export function Breadcrumbs({ items, className }: Props) {
  const { language } = useLanguage();
  const isAr = language === "ar";

  return (
    <nav className={cn("flex items-center gap-1 text-xs text-muted-foreground", className)} aria-label="Breadcrumb">
      {items.map((item, i) => {
        const label = isAr && item.labelAr ? item.labelAr : item.label;
        const isLast = i === items.length - 1;
        return (
          <span key={i} className="inline-flex items-center gap-1">
            {i > 0 && <ChevronRight className="h-3 w-3 shrink-0 rtl:rotate-180" />}
            {item.href && !isLast ? (
              <Link to={item.href} className="hover:text-foreground transition-colors">
                {label}
              </Link>
            ) : (
              <span className={isLast ? "font-medium text-foreground" : ""}>{label}</span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
