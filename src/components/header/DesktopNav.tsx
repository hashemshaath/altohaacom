import React from "react";
import { forwardRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { Scale, ChevronDown, Compass } from "lucide-react";

interface NavLink {
  to: string;
  icon: React.ElementType;
  labelEn: string;
  labelAr: string;
}

interface DesktopNavProps {
  primaryNav: NavLink[];
  moreLinks: NavLink[];
  isJudge: boolean;
  isAr: boolean;
}

export const DesktopNav = forwardRef<HTMLElement, DesktopNavProps>(function DesktopNav(
  { primaryNav, moreLinks, isJudge, isAr },
  ref
) {
  const location = useLocation();
  const isActive = (path: string) =>
    location.pathname === path || (path !== "/" && location.pathname.startsWith(path + "/"));
  const label = (en: string, ar: string) => (isAr ? ar : en);

  // Split moreLinks into 2 columns
  const half = Math.ceil(moreLinks.length / 2);
  const col1 = moreLinks.slice(0, half);
  const col2 = moreLinks.slice(half);

  const anyMoreActive = moreLinks.some((l) => isActive(l.to));

  return (
    <nav ref={ref} className="hidden items-center gap-0.5 lg:flex flex-1 justify-center" aria-label="Primary navigation">
      {primaryNav.map((link) => {
        const active = isActive(link.to);
        return (
          <Button
            key={link.to}
            variant="ghost"
            size="sm"
            asChild
            className={cn(
              "h-9 px-3 text-[13px] font-medium rounded-xl transition-all duration-200 relative",
              active
                ? "text-primary bg-primary/8"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/8"
            )}
          >
            <Link to={link.to} className="flex items-center gap-1.5">
              <link.icon className="h-3.5 w-3.5 shrink-0" />
              <span>{label(link.labelEn, link.labelAr)}</span>
              {active && (
                <span className="absolute -bottom-[9px] inset-x-3 h-[2px] rounded-full bg-primary" />
              )}
            </Link>
          </Button>
        );
      })}

      <Button
        variant="ghost"
        size="sm"
        asChild
        className={cn(
          "h-9 px-3 text-[13px] font-medium rounded-xl transition-all duration-200 relative",
          isActive("/chefs-table")
            ? "text-primary bg-primary/8"
            : "text-muted-foreground hover:text-foreground hover:bg-accent/8"
        )}
      >
        <Link to="/chefs-table" className="flex items-center gap-1.5">
          <Scale className="h-3.5 w-3.5" />
          {label("Chef's Table", "طاولة الشيف")}
          {isActive("/chefs-table") && (
            <span className="absolute -bottom-[9px] inset-x-3 h-[2px] rounded-full bg-primary" />
          )}
        </Link>
      </Button>

      {/* Mega-menu dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-9 px-3 text-[13px] font-medium rounded-xl gap-1 group transition-all duration-200 relative",
              anyMoreActive
                ? "text-primary bg-primary/8"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/8"
            )}
          >
            <Compass className="h-3.5 w-3.5" />
            {label("Explore", "اكتشف")}
            <ChevronDown className="h-3 w-3 opacity-40 transition-transform duration-200 group-data-[state=open]:rotate-180" />
            {anyMoreActive && (
              <span className="absolute -bottom-[9px] inset-x-3 h-[2px] rounded-full bg-primary" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="center"
          className="w-[460px] p-4 rounded-2xl shadow-[var(--shadow-lg)] border-border/40"
          sideOffset={12}
        >
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50 mb-3 px-1">
            {label("Explore the Platform", "اكتشف المنصة")}
          </p>
          <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
            {[col1, col2].map((col, ci) => (
              <div key={ci} className="space-y-0.5">
                {col.map((link) => {
                  const active = isActive(link.to);
                  return (
                    <DropdownMenuItem key={link.to} asChild className="rounded-xl p-0 focus:bg-transparent">
                      <Link
                        to={link.to}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 group/item",
                          active ? "bg-primary/8" : "hover:bg-accent/8"
                        )}
                      >
                        <div className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-colors",
                          active ? "bg-primary/15 text-primary" : "bg-muted/40 text-muted-foreground group-hover/item:bg-muted/60 group-hover/item:text-foreground"
                        )}>
                          <link.icon className="h-4 w-4" />
                        </div>
                        <span className={cn(
                          "text-[13px] font-medium transition-colors",
                          active ? "text-primary" : "text-foreground/80 group-hover/item:text-foreground"
                        )}>
                          {label(link.labelEn, link.labelAr)}
                        </span>
                      </Link>
                    </DropdownMenuItem>
                  );
                })}
              </div>
            ))}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </nav>
  );
});

DesktopNav.displayName = "DesktopNav";
