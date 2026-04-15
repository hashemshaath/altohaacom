import { useIsAr } from "@/hooks/useIsAr";
import { useState, useMemo, useCallback, useEffect, memo } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  CommandDialog, CommandEmpty, CommandGroup, CommandInput,
  CommandItem, CommandList,
} from "@/components/ui/command";
import { Search } from "lucide-react";
import { adminNavSections } from "@/config/adminNavSections";
import { useAdminRole } from "@/hooks/useAdminRole";

export const AdminSearchCommand = memo(function AdminSearchCommand() {
  const isAr = useIsAr();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { isSuperAdmin, isFullAdmin } = useAdminRole();

  const filteredSections = useMemo(() => {
    if (isSuperAdmin) return adminNavSections;
    return adminNavSections
      .filter((s) => !s.superAdminOnly && (!s.fullAdminOnly || isFullAdmin))
      .map((s) => ({ ...s, items: s.items.filter((i) => !i.superAdminOnly && (!i.fullAdminOnly || isFullAdmin)) }))
      .filter((s) => s.items.length > 0);
  }, [isSuperAdmin, isFullAdmin]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const onSelect = useCallback((path: string) => {
    navigate(path);
    setOpen(false);
  }, [navigate]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={cn(
          "inline-flex items-center gap-2 rounded-xl border border-border/60 bg-muted/40 px-3 py-1.5",
          "text-xs text-muted-foreground hover:bg-muted transition-colors"
        )}
      >
        <Search className="h-3.5 w-3.5" />
        <span>{isAr ? "بحث سريع..." : "Quick search..."}</span>
        <kbd className="ms-2 hidden sm:inline rounded bg-muted px-1.5 py-0.5 text-xs font-mono border border-border/40">
          ⌘K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder={isAr ? "ابحث عن صفحة أو إعداد..." : "Search pages & settings..."} />
        <CommandList>
          <CommandEmpty>{isAr ? "لا توجد نتائج" : "No results found"}</CommandEmpty>
          {filteredSections.map((section) => (
            <CommandGroup key={section.titleEn} heading={isAr ? section.titleAr : section.titleEn}>
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <CommandItem key={item.to} onSelect={() => onSelect(item.to)} className="gap-2">
                    <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                    {isAr ? item.labelAr : item.labelEn}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  );
});
