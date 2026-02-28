import { useState, useCallback, useRef } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import {
  useHomepageSections,
  useUpdateHomepageSection,
  useBulkUpdateHomepageSections,
  useCreateHomepageSection,
  type HomepageSection,
} from "@/hooks/useHomepageSections";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Eye, EyeOff, ChevronDown, ChevronUp, Save, LayoutGrid,
  Loader2, Search, RotateCcw, GripVertical, Filter, Trash2,
  CheckSquare, Square, ArrowUpDown, Palette, Sparkles,
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
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredSections.map(s => s.id)));
    }
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
      toast({
        title: isAr ? "تم الحفظ" : "Saved",
        description: isAr ? `تم تحديث "${section.title_ar}"` : `Updated "${section.title_en}"`,
      });
    } catch {
      toast({ title: isAr ? "خطأ" : "Error", variant: "destructive" });
    }
  };

  const handleQuickToggle = async (section: HomepageSection, visible: boolean) => {
    try {
      await updateSection.mutateAsync({ id: section.id, is_visible: visible });
      toast({
        title: visible ? (isAr ? "تم الإظهار" : "Shown") : (isAr ? "تم الإخفاء" : "Hidden"),
        description: isAr ? section.title_ar : section.title_en,
      });
    } catch {
      toast({ title: isAr ? "خطأ" : "Error", variant: "destructive" });
    }
  };

  // Bulk actions
  const bulkToggleVisibility = async (visible: boolean) => {
    const targets = hasSelection
      ? displaySections.filter(s => selectedIds.has(s.id))
      : displaySections;
    const updates = targets.map((s) => ({ id: s.id, is_visible: visible }));
    try {
      await bulkUpdate.mutateAsync(updates);
      toast({ title: isAr ? "تم التحديث" : "Updated", description: `${updates.length} ${isAr ? "قسم" : "sections"}` });
      setSelectedIds(new Set());
    } catch {
      toast({ title: isAr ? "خطأ" : "Error", variant: "destructive" });
    }
  };

  const bulkApplyAnimation = async (animation: HomepageSection["animation"]) => {
    if (!hasSelection) return;
    const updates = Array.from(selectedIds).map(id => ({ id, animation }));
    try {
      await bulkUpdate.mutateAsync(updates);
      toast({ title: isAr ? "تم التحديث" : "Updated" });
      setSelectedIds(new Set());
    } catch {
      toast({ title: isAr ? "خطأ" : "Error", variant: "destructive" });
    }
  };

  const expandAll = () => setOpenSections(new Set(displaySections.map((s) => s.id)));
  const collapseAll = () => setOpenSections(new Set());

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
    if (dragItem.current === null || dragOverItem.current === null) return;
    if (dragItem.current === dragOverItem.current) return;

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
    const updates = orderedSections.map((s, idx) => ({ id: s.id, sort_order: idx + 1 }));
    try {
      await bulkUpdate.mutateAsync(updates);
      setOrderedSections(null);
      toast({ title: isAr ? "تم حفظ الترتيب" : "Order saved" });
    } catch {
      toast({ title: isAr ? "خطأ" : "Error", variant: "destructive" });
    }
  };

  const cancelReorder = () => setOrderedSections(null);

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
      toast({ title: isAr ? "تم التكرار" : "Duplicated", description: isAr ? section.title_ar : section.title_en });
    } catch {
      toast({ title: isAr ? "خطأ" : "Error", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-2">
        <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-card px-3 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <LayoutGrid className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-lg font-bold tabular-nums">{displaySections.length}</p>
            <p className="text-[9px] text-muted-foreground">{isAr ? "إجمالي الأقسام" : "Total Sections"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-card px-3 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Eye className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-lg font-bold tabular-nums">{visibleCount}</p>
            <p className="text-[9px] text-muted-foreground">{isAr ? "ظاهر" : "Visible"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-card px-3 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
            <EyeOff className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <p className="text-lg font-bold tabular-nums">{hiddenCount}</p>
            <p className="text-[9px] text-muted-foreground">{isAr ? "مخفي" : "Hidden"}</p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <Card className="border-border/50 bg-muted/30">
        <CardContent className="p-3 space-y-2.5">
          {/* Search + Filter row */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[160px] max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isAr ? "بحث في الأقسام..." : "Search sections..."}
                className="h-8 text-xs pl-8"
              />
            </div>

            <Select value={visibilityFilter} onValueChange={(v) => setVisibilityFilter(v as any)}>
              <SelectTrigger className="h-8 w-[120px] text-xs">
                <Filter className="h-3 w-3 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">{isAr ? "الكل" : "All"} ({displaySections.length})</SelectItem>
                <SelectItem value="visible" className="text-xs">{isAr ? "مرئي" : "Visible"} ({visibleCount})</SelectItem>
                <SelectItem value="hidden" className="text-xs">{isAr ? "مخفي" : "Hidden"} ({hiddenCount})</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-1 ms-auto">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={expandAll}>
                    <ChevronDown className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">{isAr ? "فتح الكل" : "Expand All"}</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={collapseAll}>
                    <ChevronUp className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">{isAr ? "إغلاق الكل" : "Collapse All"}</TooltipContent>
              </Tooltip>
            </div>
          </div>

          {/* Selection & Bulk actions row */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              size="sm"
              variant={allSelected ? "default" : "outline"}
              className="h-7 text-[10px] gap-1.5"
              onClick={toggleSelectAll}
            >
              {allSelected ? <CheckSquare className="h-3 w-3" /> : <Square className="h-3 w-3" />}
              {allSelected ? (isAr ? "إلغاء التحديد" : "Deselect") : (isAr ? "تحديد الكل" : "Select All")}
            </Button>

            {hasSelection && (
              <Badge variant="secondary" className="text-[10px] gap-1 px-2">
                {selectedIds.size} {isAr ? "محدد" : "selected"}
              </Badge>
            )}

            <div className="h-4 w-px bg-border/60 mx-0.5" />

            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1" onClick={() => bulkToggleVisibility(true)}>
                  <Eye className="h-3 w-3" /> {isAr ? "إظهار" : "Show"}
                </Button>
              </TooltipTrigger>
              <TooltipContent className="text-xs">{hasSelection ? `${selectedIds.size} ${isAr ? "محدد" : "selected"}` : (isAr ? "جميع الأقسام" : "All sections")}</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1" onClick={() => bulkToggleVisibility(false)}>
                  <EyeOff className="h-3 w-3" /> {isAr ? "إخفاء" : "Hide"}
                </Button>
              </TooltipTrigger>
              <TooltipContent className="text-xs">{hasSelection ? `${selectedIds.size} ${isAr ? "محدد" : "selected"}` : (isAr ? "جميع الأقسام" : "All sections")}</TooltipContent>
            </Tooltip>

            {hasSelection && (
              <>
                <div className="h-4 w-px bg-border/60 mx-0.5" />
                <Select onValueChange={(v) => bulkApplyAnimation(v as HomepageSection["animation"])}>
                  <SelectTrigger className="h-7 w-[130px] text-[10px]">
                    <Sparkles className="h-3 w-3 mr-1" />
                    {isAr ? "تحريك المحدد" : "Animate Selected"}
                  </SelectTrigger>
                  <SelectContent>
                    {["none", "fade", "slide-up", "slide-left", "scale", "blur"].map(a => (
                      <SelectItem key={a} value={a} className="text-xs">{a}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            )}
          </div>

          {/* Reorder save bar */}
          {hasReorder && (
            <div className="flex items-center gap-2 rounded-lg bg-primary/5 border border-primary/20 px-3 py-2">
              <ArrowUpDown className="h-4 w-4 text-primary animate-pulse" />
              <span className="text-xs font-medium flex-1">{isAr ? "تم تغيير الترتيب - احفظ التغييرات" : "Order changed — save to apply"}</span>
              <Button size="sm" variant="default" className="h-7 text-xs gap-1" onClick={saveOrder} disabled={bulkUpdate.isPending}>
                {bulkUpdate.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                {isAr ? "حفظ" : "Save"}
              </Button>
              <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={cancelReorder}>
                <RotateCcw className="h-3 w-3" />
                {isAr ? "إلغاء" : "Cancel"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section cards */}
      <div className="space-y-1.5">
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
        <div className="text-center py-8 text-sm text-muted-foreground">
          {isAr ? "لا توجد أقسام مطابقة" : "No matching sections"}
        </div>
      )}
    </div>
  );
}
