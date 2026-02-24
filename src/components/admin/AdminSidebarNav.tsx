import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLanguage } from "@/i18n/LanguageContext";
import { adminNavSections } from "@/config/adminNavSections";
import { ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface AdminSidebarNavProps {
  collapsed?: boolean;
  isMobile?: boolean;
  onItemClick?: () => void;
}

export function AdminSidebarNav({ collapsed = false, isMobile = false, onItemClick }: AdminSidebarNavProps) {
  const { language } = useLanguage();
  const location = useLocation();

  // Determine which sections should be open based on current route
  const getInitialOpenSections = () => {
    const open: Record<number, boolean> = {};
    adminNavSections.forEach((section, idx) => {
      const isActive = section.items.some((item) =>
        item.end ? location.pathname === item.to : location.pathname.startsWith(item.to)
      );
      open[idx] = isActive;
    });
    // Always open dashboard
    open[0] = true;
    return open;
  };

  const [openSections, setOpenSections] = useState<Record<number, boolean>>(getInitialOpenSections);

  const toggleSection = (idx: number) => {
    setOpenSections((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  return (
    <ScrollArea className="flex-1 py-2">
      <nav className="space-y-1 px-2">
        {adminNavSections.map((section, idx) => {
          const isOpen = openSections[idx] ?? false;
          const sectionLabel = language === "ar" ? section.titleAr : section.titleEn;

          if (!isMobile && collapsed) {
            // Collapsed: show only icons
            return (
              <div key={idx} className="space-y-0.5">
                {section.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    onClick={onItemClick}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center justify-center rounded-md p-2 transition-colors",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )
                    }
                    title={language === "ar" ? item.labelAr : item.labelEn}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                  </NavLink>
                ))}
              </div>
            );
          }

          // Expanded / Mobile: collapsible sections
          return (
            <Collapsible key={idx} open={isOpen} onOpenChange={() => toggleSection(idx)}>
              <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:bg-muted/50 transition-colors">
                <span>{sectionLabel}</span>
                <ChevronDown
                  className={cn(
                    "h-3.5 w-3.5 shrink-0 transition-transform duration-200",
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
                        "flex items-center gap-3 rounded-md px-3 py-1.5 text-sm transition-colors",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )
                    }
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
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
