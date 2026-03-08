import { memo } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { Scale, ChevronDown, Compass } from "lucide-react";

interface NavLink {
  to: string;
  icon: React.ElementType;
  labelEn: string;
  labelAr: string;
  authOnly?: boolean;
}

interface DesktopNavProps {
  primaryNav: NavLink[];
  moreLinks: NavLink[];
  isJudge: boolean;
  isAr: boolean;
}

export const DesktopNav = memo(function DesktopNav({ primaryNav, moreLinks, isJudge, isAr }: DesktopNavProps) {
  const location = useLocation();
  const isActive = (path: string) =>
    location.pathname === path || (path !== "/" && location.pathname.startsWith(path + "/"));
  const label = (en: string, ar: string) => (isAr ? ar : en);

  return (
    <nav className="hidden items-center gap-0.5 lg:flex flex-1 justify-center" aria-label="Primary navigation">
      {primaryNav.map((link) => (
        <Button
          key={link.to}
          variant="ghost"
          size="sm"
          asChild
          className={cn(
            "text-muted-foreground h-9 px-3.5 text-sm font-medium transition-all duration-200 hover:bg-primary/5 hover:text-foreground relative",
            isActive(link.to) &&
              "bg-primary/10 text-primary shadow-sm shadow-primary/5"
          )}
        >
          <Link to={link.to} className="flex items-center gap-1.5">
            <link.icon className="h-3.5 w-3.5 shrink-0" />
            <span>{label(link.labelEn, link.labelAr)}</span>
            {isActive(link.to) && (
              <span className="absolute -bottom-[9px] inset-x-3 h-0.5 rounded-full bg-primary" />
            )}
          </Link>
        </Button>
      ))}

      <Button
        variant="ghost"
        size="sm"
        asChild
        className={cn(
          "text-muted-foreground h-9 px-3.5 text-sm font-medium hover:bg-primary/5 hover:text-foreground relative",
          isActive("/chefs-table") && "bg-primary/10 text-primary"
        )}
      >
        <Link to="/chefs-table" className="flex items-center gap-1.5">
          <Scale className="h-3.5 w-3.5" />
          {label("Chef's Table", "طاولة الشيف")}
          {isActive("/chefs-table") && (
            <span className="absolute -bottom-[9px] inset-x-3 h-0.5 rounded-full bg-primary" />
          )}
        </Link>
      </Button>

      {/* More dropdown - 2-column mega menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground h-9 px-3.5 text-sm font-medium gap-1.5 hover:bg-primary/5 hover:text-foreground group"
          >
            <Compass className="h-3.5 w-3.5" />
            {label("Explore", "اكتشف")}
            <ChevronDown className="h-3 w-3 opacity-50 transition-transform duration-200 group-data-[state=open]:rotate-180" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="center" 
          className="w-[420px] p-3 animate-in fade-in-0 zoom-in-95 slide-in-from-top-2"
          sideOffset={8}
        >
          <DropdownMenuLabel className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 px-1 pb-2">
            {label("Explore the Platform", "اكتشف المنصة")}
          </DropdownMenuLabel>
          <div className="grid grid-cols-2 gap-1">
            {moreLinks.map((link) => (
              <DropdownMenuItem key={link.to} asChild className="rounded-xl p-0 focus:bg-primary/5">
                <Link 
                  to={link.to} 
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors",
                    isActive(link.to) && "bg-primary/10"
                  )}
                >
                  <div className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-colors",
                    isActive(link.to) ? "bg-primary/20 text-primary" : "bg-muted/60 text-muted-foreground"
                  )}>
                    <link.icon className="h-4 w-4" />
                  </div>
                  <span className={cn(
                    "text-sm font-medium",
                    isActive(link.to) ? "text-primary" : "text-foreground"
                  )}>
                    {label(link.labelEn, link.labelAr)}
                  </span>
                </Link>
              </DropdownMenuItem>
            ))}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </nav>
  );
}
