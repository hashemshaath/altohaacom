import { useState, useCallback, useRef } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import {
  useHomepageSections,
  useUpdateHomepageSection,
  useBulkUpdateHomepageSections,
  type HomepageSection,
} from "@/hooks/useHomepageSections";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Eye, EyeOff, ChevronDown, ChevronUp, Save, LayoutGrid,
  Loader2, Search, RotateCcw, GripVertical,
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
  const { toast } = useToast();

  const [openSections, setOpenSections] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [orderedSections, setOrderedSections] = useState<HomepageSection[] | null>(null);
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  const displaySections = orderedSections || sections;
  const hasReorder = orderedSections !== null;

  const filteredSections = searchQuery
    ? displaySections.filter(
        (s) =>
          s.title_en.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.title_ar.includes(searchQuery) ||
          s.section_key.includes(searchQuery.toLowerCase())
      )
    : displaySections;

  const visibleCount = displaySections.filter((s) => s.is_visible).length;
  const hiddenCount = displaySections.length - visibleCount;

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
  const toggleAll = async (visible: boolean) => {
    const updates = displaySections.map((s) => ({ id: s.id, is_visible: visible }));
    try {
      await bulkUpdate.mutateAsync(updates);
      toast({ title: isAr ? "تم التحديث" : "Updated" });
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <Card className="border-border/50 bg-muted/30">
        <CardContent className="p-3 space-y-3">
          {/* Stats row */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <LayoutGrid className="h-3.5 w-3.5" />
              <span className="font-medium">{displaySections.length} {isAr ? "قسم" : "sections"}</span>
              <span className="text-muted-foreground/40">·</span>
              <span className="flex items-center gap-1">
                <Eye className="h-3 w-3 text-primary" /> {visibleCount}
              </span>
              <span className="text-muted-foreground/40">·</span>
              <span className="flex items-center gap-1">
                <EyeOff className="h-3 w-3" /> {hiddenCount}
              </span>
            </div>

            {/* Reorder save bar */}
            {hasReorder && (
              <div className="flex items-center gap-2">
                <Badge variant="default" className="text-[10px] gap-1 animate-pulse">
                  <GripVertical className="h-3 w-3" />
                  {isAr ? "ترتيب جديد" : "New order"}
                </Badge>
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
          </div>

          {/* Actions row */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Search */}
            <div className="relative flex-1 min-w-[180px] max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isAr ? "بحث في الأقسام..." : "Search sections..."}
                className="h-8 text-xs pl-8"
              />
            </div>

            <div className="flex items-center gap-1">
              <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1" onClick={() => toggleAll(true)}>
                <Eye className="h-3 w-3" /> {isAr ? "إظهار الكل" : "Show All"}
              </Button>
              <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1" onClick={() => toggleAll(false)}>
                <EyeOff className="h-3 w-3" /> {isAr ? "إخفاء الكل" : "Hide All"}
              </Button>
              <Button size="sm" variant="ghost" className="h-7 text-[10px] gap-1" onClick={expandAll}>
                <ChevronDown className="h-3 w-3" /> {isAr ? "فتح" : "Expand"}
              </Button>
              <Button size="sm" variant="ghost" className="h-7 text-[10px] gap-1" onClick={collapseAll}>
                <ChevronUp className="h-3 w-3" /> {isAr ? "إغلاق" : "Collapse"}
              </Button>
            </div>
          </div>
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
            onToggle={() => toggle(section.id)}
            onUpdate={(u) => handleUpdate(section, u)}
            onQuickToggle={(v) => handleQuickToggle(section, v)}
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
