import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useLanguage } from "@/i18n/LanguageContext";
import { adminNavSections } from "@/config/adminNavSections";

interface AdminSidebarNavProps {
  collapsed?: boolean;
  isMobile?: boolean;
  onItemClick?: () => void;
}

export function AdminSidebarNav({ collapsed = false, isMobile = false, onItemClick }: AdminSidebarNavProps) {
  const { language } = useLanguage();

  return (
    <ScrollArea className="flex-1 p-2">
      <nav className="space-y-4">
        {adminNavSections.map((section, idx) => (
          <div key={idx}>
            {(!collapsed || isMobile) && (
              <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {language === "ar" ? section.titleAr : section.titleEn}
              </p>
            )}
            <div className="space-y-1">
              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={onItemClick}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                      !isMobile && collapsed && "justify-center px-2",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )
                  }
                  title={!isMobile && collapsed ? (language === "ar" ? item.labelAr : item.labelEn) : undefined}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {(isMobile || !collapsed) && (
                    <span className="truncate">{language === "ar" ? item.labelAr : item.labelEn}</span>
                  )}
                </NavLink>
              ))}
            </div>
            {idx < adminNavSections.length - 1 && (isMobile || !collapsed) && <Separator className="my-3" />}
          </div>
        ))}
      </nav>
    </ScrollArea>
  );
}
