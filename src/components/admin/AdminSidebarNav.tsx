import { useState, memo, useMemo } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLanguage } from "@/i18n/LanguageContext";
import { adminNavSections } from "@/config/adminNavSections";
import { ChevronRight } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface AdminSidebarNavProps {
  collapsed?: boolean;
  isMobile?: boolean;
  onItemClick?: () => void;
}

export const AdminSidebarNav = memo(function AdminSidebarNav({ collapsed = false, isMobile = false, onItemClick }: AdminSidebarNavProps) {
  const { language } = useLanguage();
  const location = useLocation();
  const isAr = language === "ar";

  const initialOpen = useMemo(() => {
    const open: Record<number, boolean> = { 0: true };
    adminNavSections.forEach((section, idx) => {
      if (section.items.some((item) => item.end ? location.pathname === item.to : location.pathname.startsWith(item.to))) {
        open[idx] = true;
      }
    });
    return open;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [openSections, setOpenSections] = useState<Record<number, boolean>>(initialOpen);

  const toggleSection = (idx: number) => {
    setOpenSections((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  return (
    <ScrollArea className="flex-1">
      <nav className="px-2 py-3 space-y-0.5">
        {adminNavSections.map((section, idx) => {
          const isOpen = openSections[idx] ?? false;
          const sectionLabel = isAr ? section.titleAr : section.titleEn;
          const hasActiveItem = section.items.some((item) =>
            item.end ? location.pathname === item.to : location.pathname.startsWith(item.to)
          );

          /* ── Collapsed: icon-only with tooltips ── */
          if (!isMobile && collapsed) {
            return (
              <div key={idx} className="space-y-0.5">
                {idx > 0 && <div className="mx-auto my-2.5 w-6 h-px bg-border/30" />}
                {section.items.map((item) => (
                  <Tooltip key={item.to} delayDuration={0}>
                    <TooltipTrigger asChild>
                      <NavLink
                        to={item.to}
                        end={item.end}
                        onClick={onItemClick}
                        className={({ isActive }) =>
                          cn(
                            "flex items-center justify-center rounded-xl h-9 w-9 mx-auto transition-all duration-200",
                            isActive
                              ? "bg-primary text-primary-foreground shadow-sm"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          )
                        }
                      >
                        <item.icon className="h-[18px] w-[18px]" />
                      </NavLink>
                    </TooltipTrigger>
                    <TooltipContent side={isAr ? "left" : "right"} className="text-xs font-medium">
                      {isAr ? item.labelAr : item.labelEn}
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            );
          }

          /* ── Expanded: section groups ── */
          return (
            <div key={idx}>
              {/* Section divider */}
              {idx > 0 && <div className="mx-3 my-3 h-px bg-border/30" />}

              {/* Section header */}
              <button
                onClick={() => toggleSection(idx)}
                className={cn(
                  "flex w-full items-center justify-between gap-2 rounded-lg px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider transition-colors select-none",
                  hasActiveItem
                    ? "text-primary"
                    : "text-muted-foreground/70 hover:text-muted-foreground"
                )}
              >
                <span className="truncate">{sectionLabel}</span>
                <ChevronRight
                  className={cn(
                    "h-3 w-3 shrink-0 transition-transform duration-200",
                    isOpen && "rotate-90"
                  )}
                />
              </button>

              {/* Section items */}
              <div
                className={cn(
                  "grid transition-all duration-200",
                  isOpen ? "grid-rows-[1fr] opacity-100 mt-0.5" : "grid-rows-[0fr] opacity-0"
                )}
              >
                <div className="overflow-hidden space-y-px">
                  {section.items.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      onClick={onItemClick}
                      className={({ isActive }) =>
                        cn(
                          "group flex items-center gap-2.5 rounded-lg px-3 py-[7px] text-[13px] font-medium transition-all duration-150",
                          isActive
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                        )
                      }
                    >
                      <item.icon className={cn(
                        "h-4 w-4 shrink-0 transition-colors"
                      )} />
                      <span className="truncate leading-tight">{isAr ? item.labelAr : item.labelEn}</span>
                    </NavLink>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </nav>
    </ScrollArea>
  );
});
