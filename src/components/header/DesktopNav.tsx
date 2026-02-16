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
import { Scale, ChevronDown, Grid3X3 } from "lucide-react";

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

export function DesktopNav({ primaryNav, moreLinks, isJudge, isAr }: DesktopNavProps) {
  const location = useLocation();
  const isActive = (path: string) =>
    location.pathname === path || (path !== "/" && location.pathname.startsWith(path + "/"));
  const label = (en: string, ar: string) => (isAr ? ar : en);

  return (
    <nav className="hidden items-center gap-0.5 lg:flex flex-1 justify-center">
      {primaryNav.map((link) => (
        <Button
          key={link.to}
          variant="ghost"
          size="sm"
          asChild
          className={cn(
            "text-muted-foreground h-8 px-2.5 text-[13px] transition-all duration-200 hover:bg-primary/5",
            isActive(link.to) &&
              "bg-primary/10 text-primary font-medium shadow-sm shadow-primary/5"
          )}
        >
          <Link to={link.to} className="flex items-center gap-1.5">
            <link.icon className="h-3.5 w-3.5" />
            {label(link.labelEn, link.labelAr)}
          </Link>
        </Button>
      ))}

      {isJudge && (
        <Button
          variant="ghost"
          size="sm"
          asChild
          className={cn(
            "text-muted-foreground h-8 px-2.5 text-[13px] hover:bg-primary/5",
            isActive("/tastings") && "bg-primary/10 text-primary font-medium"
          )}
        >
          <Link to="/tastings" className="flex items-center gap-1.5">
            <Scale className="h-3.5 w-3.5" />
            {label("Evaluation", "التقييم")}
          </Link>
        </Button>
      )}

      {/* More dropdown - mega menu style */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground h-8 px-2.5 text-[13px] gap-1 hover:bg-primary/5 group"
          >
            <Grid3X3 className="h-3.5 w-3.5" />
            {label("More", "المزيد")}
            <ChevronDown className="h-3 w-3 opacity-50 transition-transform duration-200 group-data-[state=open]:rotate-180" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" className="w-64 p-1 animate-in fade-in-0 zoom-in-95">
          <DropdownMenuLabel className="text-xs text-muted-foreground">
            {label("Explore", "اكتشف")}
          </DropdownMenuLabel>
          <div className="grid grid-cols-1 gap-0.5">
            {moreLinks.map((link) => (
              <DropdownMenuItem key={link.to} asChild className="rounded-md">
                <Link to={link.to} className="flex items-center gap-2.5 px-2 py-1.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/5">
                    <link.icon className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <span className="text-sm">{label(link.labelEn, link.labelAr)}</span>
                </Link>
              </DropdownMenuItem>
            ))}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </nav>
  );
}
