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
      <nav className="px-2 py-2 space-y-0.5">
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
                {idx > 0 && <div className="mx-auto my-2 w-5 h-px bg-border/40" />}
                {section.items.map((item) => {
                  const isActive = item.end
                    ? location.pathname === item.to
                    : location.pathname.startsWith(item.to);
                  return (
                    <Tooltip key={item.to} delayDuration={0}>
                      <TooltipTrigger asChild>
                        <NavLink
                          to={item.to}
                          end={item.end}
                          onClick={onItemClick}
                          className={cn(
                            "flex items-center justify-center rounded-lg h-8 w-8 mx-auto transition-all duration-150",
                            isActive
                              ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                              : "text-sidebar-foreground/60 hover:bg-sidebar-accent/10 hover:text-sidebar-foreground"
                          )}
                        >
                          <item.icon className="h-4 w-4" />
                        </NavLink>
                      </TooltipTrigger>
                      <TooltipContent side={isAr ? "left" : "right"} className="text-xs font-medium">
                        {isAr ? item.labelAr : item.labelEn}
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            );
          }

          /* ── Expanded: section groups ── */
          return (
            <div key={idx}>
              {idx > 0 && <div className="mx-3 my-2 h-px bg-sidebar-border" />}

              {/* Section header */}
              <button
                onClick={() => toggleSection(idx)}
                className={cn(
                  "flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider transition-colors select-none",
                  hasActiveItem
                    ? "text-sidebar-primary"
                    : "text-sidebar-foreground/40 hover:text-sidebar-foreground/70"
                )}
              >
                <span className="truncate">{sectionLabel}</span>
                <ChevronRight
                  className={cn(
                    "h-3 w-3 shrink-0 transition-transform duration-150",
                    isOpen && "rotate-90"
                  )}
                />
              </button>

              {/* Section items */}
              <div
                className={cn(
                  "grid transition-all duration-150",
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
                          "group relative flex items-center gap-2 rounded-md px-2.5 py-1.5 text-[13px] font-medium transition-all duration-150",
                          isActive
                            ? "bg-sidebar-primary/15 text-sidebar-primary-foreground font-semibold"
                            : "text-sidebar-foreground/60 hover:bg-sidebar-accent/10 hover:text-sidebar-foreground"
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          {isActive && (
                            <span className={cn(
                              "absolute top-1/2 -translate-y-1/2 w-[2px] h-4 rounded-full bg-primary",
                              isAr ? "-right-[3px]" : "-left-[3px]"
                            )} />
                          )}
                          <item.icon className={cn(
                            "h-3.5 w-3.5 shrink-0",
                            isActive ? "text-primary" : "text-muted-foreground/70"
                          )} />
                          <span className="truncate leading-tight">{isAr ? item.labelAr : item.labelEn}</span>
                        </>
                      )}
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
