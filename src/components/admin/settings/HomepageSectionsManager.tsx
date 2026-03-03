import { useState, useCallback, useRef } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import {
  useHomepageSections,
  useUpdateHomepageSection,
  useBulkUpdateHomepageSections,
  useCreateHomepageSection,
  type HomepageSection,
} from "@/hooks/useHomepageSections";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Eye, EyeOff, Save,
  Loader2, Search, RotateCcw, Filter,
  CheckSquare, Square, ArrowUpDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { SectionRow } from "./homepage/SectionRow";

export function HomepageSectionsManager() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { data: sections = [], isLoading } = useHomepageSections();
  const updateSection = useUpdateHomepageSection();
  const bulkUpdate = useBulkUpdateHomepageSections();
  const createSection = useCreateHomepageSection();
  const { toast } = useToast();

  const [openSections, setOpenSections] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [visibilityFilter, setVisibilityFilter] = useState<"all" | "visible" | "hidden">("all");
  const [orderedSections, setOrderedSections] = useState<HomepageSection[] | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  const displaySections = orderedSections || sections;
  const hasReorder = orderedSections !== null;

  const filteredSections = displaySections.filter((s) => {
    if (visibilityFilter === "visible" && !s.is_visible) return false;
    if (visibilityFilter === "hidden" && s.is_visible) return false;
    if (searchQuery) {
      return s.title_en.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.title_ar.includes(searchQuery) ||
        s.section_key.includes(searchQuery.toLowerCase());
    }
    return true;
  });

  const visibleCount = displaySections.filter((s) => s.is_visible).length;
  const hiddenCount = displaySections.length - visibleCount;
  const hasSelection = selectedIds.size > 0;
  const allSelected = filteredSections.length > 0 && filteredSections.every(s => selectedIds.has(s.id));

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelectedIds(allSelected ? new Set() : new Set(filteredSections.map(s => s.id)));
  };

  const toggle = (id: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleUpdate = async (section: HomepageSection, updates: Partial<HomepageSection>) => {
    try {
      await updateSection.mutateAsync({ id: section.id, ...updates });
      toast({ title: isAr ? "✓ تم الحفظ" : "✓ Saved" });
    } catch {
      toast({ title: isAr ? "خطأ" : "Error", variant: "destructive" });
    }
  };

  const handleQuickToggle = async (section: HomepageSection, visible: boolean) => {
    try {
      await updateSection.mutateAsync({ id: section.id, is_visible: visible });
    } catch {
      toast({ title: isAr ? "خطأ" : "Error", variant: "destructive" });
    }
  };

  const bulkToggleVisibility = async (visible: boolean) => {
    const targets = hasSelection
      ? displaySections.filter(s => selectedIds.has(s.id))
      : displaySections;
    try {
      await bulkUpdate.mutateAsync(targets.map(s => ({ id: s.id, is_visible: visible })));
      toast({ title: `${targets.length} ${isAr ? "تم التحديث" : "updated"}` });
      setSelectedIds(new Set());
    } catch {
      toast({ title: isAr ? "خطأ" : "Error", variant: "destructive" });
    }
  };

  // Drag and drop
  const handleDragStart = useCallback((idx: number) => (e: React.DragEvent) => {
    dragItem.current = idx;
    e.dataTransfer.effectAllowed = "move";
  }, []);

  const handleDragOver = useCallback((idx: number) => (e: React.DragEvent) => {
    e.preventDefault();
    dragOverItem.current = idx;
  }, []);

  const handleDrop = useCallback(() => (e: React.DragEvent) => {
    e.preventDefault();
    if (dragItem.current === null || dragOverItem.current === null || dragItem.current === dragOverItem.current) return;
    const items = [...(orderedSections || sections)];
    const [draggedItem] = items.splice(dragItem.current, 1);
    items.splice(dragOverItem.current, 0, draggedItem);
    setOrderedSections(items);
    dragItem.current = null;
    dragOverItem.current = null;
  }, [orderedSections, sections]);

  const handleDragEnd = useCallback(() => () => {
    dragItem.current = null;
    dragOverItem.current = null;
  }, []);

  const saveOrder = async () => {
    if (!orderedSections) return;
    try {
      await bulkUpdate.mutateAsync(orderedSections.map((s, i) => ({ id: s.id, sort_order: i + 1 })));
      setOrderedSections(null);
      toast({ title: isAr ? "✓ تم حفظ الترتيب" : "✓ Order saved" });
    } catch {
      toast({ title: isAr ? "خطأ" : "Error", variant: "destructive" });
    }
  };

  const handleDuplicate = async (section: HomepageSection) => {
    const { id, updated_at, ...rest } = section;
    try {
      await createSection.mutateAsync({
        ...rest,
        section_key: `${section.section_key}_copy`,
        title_en: `${section.title_en} (Copy)`,
        title_ar: `${section.title_ar} (نسخة)`,
        sort_order: displaySections.length + 1,
        is_visible: false,
      });
      toast({ title: isAr ? "✓ تم التكرار" : "✓ Duplicated" });
    } catch {
      toast({ title: isAr ? "خطأ" : "Error", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Compact toolbar */}
      <div className="flex items-center gap-1.5 flex-wrap rounded-xl border border-border/40 bg-muted/20 p-2">
        <div className="relative flex-1 min-w-[140px] max-w-[200px]">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isAr ? "بحث..." : "Search..."}
            className="h-7 text-[10px] pl-7"
          />
        </div>

        <Select value={visibilityFilter} onValueChange={(v) => setVisibilityFilter(v as any)}>
          <SelectTrigger className="h-7 w-auto min-w-[80px] text-[10px] gap-1">
            <Filter className="h-2.5 w-2.5" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">{isAr ? "الكل" : "All"} ({displaySections.length})</SelectItem>
            <SelectItem value="visible" className="text-xs">{isAr ? "مرئي" : "Visible"} ({visibleCount})</SelectItem>
            <SelectItem value="hidden" className="text-xs">{isAr ? "مخفي" : "Hidden"} ({hiddenCount})</SelectItem>
          </SelectContent>
        </Select>

        <div className="h-4 w-px bg-border/40" />

        <Button size="sm" variant={allSelected ? "default" : "ghost"} className="h-7 text-[9px] gap-1 px-2" onClick={toggleSelectAll}>
          {allSelected ? <CheckSquare className="h-3 w-3" /> : <Square className="h-3 w-3" />}
          {hasSelection && <span>{selectedIds.size}</span>}
        </Button>

        <Button size="sm" variant="ghost" className="h-7 text-[9px] gap-1 px-2" onClick={() => bulkToggleVisibility(true)}>
          <Eye className="h-3 w-3" />
        </Button>
        <Button size="sm" variant="ghost" className="h-7 text-[9px] gap-1 px-2" onClick={() => bulkToggleVisibility(false)}>
          <EyeOff className="h-3 w-3" />
        </Button>

        <div className="ms-auto flex items-center gap-1">
          <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-5 font-mono">
            {visibleCount}/{displaySections.length}
          </Badge>
        </div>
      </div>

      {/* Reorder bar */}
      {hasReorder && (
        <div className="flex items-center gap-2 rounded-xl bg-primary/5 border border-primary/20 px-3 py-1.5">
          <ArrowUpDown className="h-3.5 w-3.5 text-primary animate-pulse" />
          <span className="text-[10px] font-medium flex-1">{isAr ? "احفظ الترتيب الجديد" : "Save new order"}</span>
          <Button size="sm" className="h-6 text-[10px] gap-1 px-2" onClick={saveOrder} disabled={bulkUpdate.isPending}>
            {bulkUpdate.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
            {isAr ? "حفظ" : "Save"}
          </Button>
          <Button size="sm" variant="ghost" className="h-6 text-[10px] px-2" onClick={() => setOrderedSections(null)}>
            <RotateCcw className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Section list */}
      <div className="space-y-1">
        {filteredSections.map((section, idx) => (
          <SectionRow
            key={section.id}
            section={section}
            index={idx}
            isOpen={openSections.has(section.id)}
            isSelected={selectedIds.has(section.id)}
            onSelect={() => toggleSelect(section.id)}
            onToggle={() => toggle(section.id)}
            onUpdate={(u) => handleUpdate(section, u)}
            onQuickToggle={(v) => handleQuickToggle(section, v)}
            onDuplicate={handleDuplicate}
            isPending={updateSection.isPending}
            isAr={isAr}
            dragHandleProps={{
              onDragStart: handleDragStart(idx),
              onDragEnd: handleDragEnd(),
              onDragOver: handleDragOver(idx),
              onDrop: handleDrop(),
            }}
          />
        ))}
      </div>

      {filteredSections.length === 0 && searchQuery && (
        <div className="text-center py-6 text-xs text-muted-foreground">
          {isAr ? "لا توجد أقسام مطابقة" : "No matching sections"}
        </div>
      )}
    </div>
  );
}
