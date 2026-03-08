import { useState, memo } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Menu, Search, X } from "lucide-react";
import { NavLink } from "react-router-dom";
import { adminNavSections } from "@/config/adminNavSections";

export function AdminMobileNavDrawer() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredSections = adminNavSections
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
        <Button variant="ghost" size="icon" className="md:hidden h-9 w-9">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] p-0">
        <div className="p-3 border-b">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search pages..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 pl-8 text-xs"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2">
                <X className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>
        <ScrollArea className="h-[calc(100vh-60px)]">
          <div className="p-2 space-y-3">
            {filteredSections.map((section) => (
              <div key={section.titleEn}>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-1">
                  {section.titleEn}
                </p>
                <div className="space-y-0.5">
                  {section.items.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      onClick={() => setOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-2.5 px-2.5 py-2 rounded-md text-xs transition-colors ${
                          isActive
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-foreground hover:bg-muted"
                        }`
                      }
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {item.labelEn}
                    </NavLink>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
