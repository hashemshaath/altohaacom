import { Link } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

interface BreadcrumbItem {
  label: string;
  to?: string;
}

interface Props {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumbs({ items, className }: Props) {
  return (
    <nav aria-label="Breadcrumb" className={cn("flex items-center gap-1 text-xs text-muted-foreground overflow-x-auto scrollbar-none", className)}>
      <Link to="/" className="shrink-0 hover:text-foreground transition-colors">
        <Home className="h-3.5 w-3.5" />
      </Link>
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1 shrink-0">
          <ChevronRight className="h-3 w-3 text-muted-foreground/40 rtl:rotate-180" />
          {item.to ? (
            <Link to={item.to} className="hover:text-foreground transition-colors font-medium truncate max-w-[120px] sm:max-w-none">
              {item.label}
            </Link>
          ) : (
            <span className="text-foreground font-semibold truncate max-w-[150px] sm:max-w-none">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}