import { useIsAr } from "@/hooks/useIsAr";
import { useState, useMemo, memo } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Menu, Search, X, ChevronDown } from "lucide-react";
import { NavLink } from "react-router-dom";
import { adminNavSections } from "@/config/adminNavSections";
import { useAdminRole } from "@/hooks/useAdminRole";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export const AdminMobileNavDrawer = memo(function AdminMobileNavDrawer() {
  const isAr = useIsAr();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const { isSuperAdmin, isFullAdmin } = useAdminRole();

  const roleSections = useMemo(() => {
    if (isSuperAdmin) return adminNavSections;
    return adminNavSections
      .filter((s) => !s.superAdminOnly && (!s.fullAdminOnly || isFullAdmin))
      .map((s) => ({ ...s, items: s.items.filter((i) => !i.superAdminOnly && (!i.fullAdminOnly || isFullAdmin)) }))
      .filter((s) => s.items.length > 0);
  }, [isSuperAdmin, isFullAdmin]);

  const filteredSections = roleSections
    .map((section) => ({
      ...section,
      items: section.items.filter(
        (item) =>
          item.labelEn.toLowerCase().includes(search.toLowerCase()) ||
          item.labelAr.includes(search)
      ),
    }))
    .filter((s) => s.items.length > 0);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden h-9 w-9 rounded-xl touch-manipulation active:scale-90 transition-transform" aria-label={isAr ? "القائمة" : "Menu"}>
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side={isAr ? "right" : "left"} className="w-[300px] p-0 overflow-hidden">
        <div className="flex h-full flex-col">
          {/* Search Header */}
          <div className="p-3 border-b border-border/40 bg-gradient-to-b from-primary/5 to-transparent">
            <div className="relative">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input
                placeholder={isAr ? "بحث في الصفحات..." : "Search pages..."}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 ps-9 pe-8 text-xs rounded-xl"
              />
              {search && (
                <button
                  aria-label="Clear search"
                  onClick={() => setSearch("")}
                  className="absolute end-2.5 top-1/2 -translate-y-1/2 rounded-lg p-0.5 hover:bg-muted transition-colors"
                >
                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              )}
            </div>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1">
            <nav aria-label="Admin navigation" className="p-2 space-y-1">
              {filteredSections.map((section, idx) => (
                <Collapsible key={section.titleEn} defaultOpen={idx === 0 || !!search}>
                  <CollapsibleTrigger className={cn(
                    "flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-bold uppercase tracking-widest transition-all duration-200",
                    "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                  )}>
                    <span>{isAr ? section.titleAr : section.titleEn}</span>
                    <ChevronDown className="h-3 w-3 shrink-0 transition-transform duration-300 [[data-state=open]>&]:rotate-180" />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-0.5 pt-0.5">
                    {section.items.map((item) => (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.end}
                        onClick={() => setOpen(false)}
                        className={({ isActive }) =>
                          cn(
                            "group/nav flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200 touch-manipulation active:scale-[0.98] select-none",
                            isActive
                              ? "bg-primary text-primary-foreground font-medium shadow-sm shadow-primary/15"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          )
                        }
                      >
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg shrink-0 transition-colors">
                          <item.icon className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover/nav:scale-110" />
                        </div>
                        <span className="truncate">{isAr ? item.labelAr : item.labelEn}</span>
                      </NavLink>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              ))}

              {filteredSections.length === 0 && (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  {isAr ? "لا توجد نتائج" : "No results found"}
                </div>
              )}
            </nav>
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
});
