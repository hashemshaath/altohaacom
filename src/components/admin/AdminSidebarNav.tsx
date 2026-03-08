import { useState, memo } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLanguage } from "@/i18n/LanguageContext";
import { adminNavSections } from "@/config/adminNavSections";
import { ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface AdminSidebarNavProps {
  collapsed?: boolean;
  isMobile?: boolean;
  onItemClick?: () => void;
}

export function AdminSidebarNav({ collapsed = false, isMobile = false, onItemClick }: AdminSidebarNavProps) {
  const { language } = useLanguage();
  const location = useLocation();

  const getInitialOpenSections = () => {
    const open: Record<number, boolean> = {};
    adminNavSections.forEach((section, idx) => {
      const isActive = section.items.some((item) =>
        item.end ? location.pathname === item.to : location.pathname.startsWith(item.to)
      );
      open[idx] = isActive;
    });
    open[0] = true;
    return open;
  };

  const [openSections, setOpenSections] = useState<Record<number, boolean>>(getInitialOpenSections);

  const toggleSection = (idx: number) => {
    setOpenSections((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  return (
    <ScrollArea className="flex-1 py-3">
      <nav className="space-y-1.5 px-2">
        {adminNavSections.map((section, idx) => {
          const isOpen = openSections[idx] ?? false;
          const sectionLabel = language === "ar" ? section.titleAr : section.titleEn;
          const hasActiveItem = section.items.some((item) =>
            item.end ? location.pathname === item.to : location.pathname.startsWith(item.to)
          );

          if (!isMobile && collapsed) {
            return (
              <div key={idx} className="space-y-0.5">
                {idx > 0 && <div className="mx-2 my-2 h-px bg-border/40" />}
                {section.items.map((item) => (
                  <Tooltip key={item.to} delayDuration={0}>
                    <TooltipTrigger asChild>
                      <NavLink
                        to={item.to}
                        end={item.end}
                        onClick={onItemClick}
                        className={({ isActive }) =>
                          cn(
                            "flex items-center justify-center rounded-xl p-2.5 transition-all duration-200",
                            isActive
                              ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground hover:scale-105"
                          )
                        }
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                      </NavLink>
                    </TooltipTrigger>
                    <TooltipContent side={language === "ar" ? "left" : "right"} className="text-xs">
                      {language === "ar" ? item.labelAr : item.labelEn}
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            );
          }

          return (
            <Collapsible key={idx} open={isOpen} onOpenChange={() => toggleSection(idx)}>
              <CollapsibleTrigger className={cn(
                "flex w-full items-center justify-between rounded-xl px-3 py-2 text-[10px] font-bold uppercase tracking-widest transition-all duration-200",
                hasActiveItem
                  ? "text-primary bg-primary/5"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}>
                <span>{sectionLabel}</span>
                <ChevronDown
                  className={cn(
                    "h-3 w-3 shrink-0 transition-transform duration-300",
                    isOpen && "rotate-180"
                  )}
                />
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-0.5 pt-0.5">
                {section.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    onClick={onItemClick}
                    className={({ isActive }) =>
                      cn(
                        "group/nav flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-all duration-200",
                        isActive
                          ? "bg-primary text-primary-foreground shadow-sm shadow-primary/15 font-medium"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )
                    }
                  >
                    <item.icon className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover/nav:scale-110" />
                    <span className="truncate">{language === "ar" ? item.labelAr : item.labelEn}</span>
                  </NavLink>
                ))}
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </nav>
    </ScrollArea>
  );
}
