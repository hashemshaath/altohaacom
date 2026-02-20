import { useState, useCallback, useRef } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import {
  useHomepageSections,
  useUpdateHomepageSection,
  useBulkUpdateHomepageSections,
  useCreateHomepageSection,
  type HomepageSection,
} from "@/hooks/useHomepageSections";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Eye, EyeOff, Loader2, GripVertical, Save, RotateCcw,
  Search, Filter, ChevronDown, ChevronUp, LayoutGrid, ExternalLink,
  Layers, SlidersHorizontal, Monitor,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SectionRow } from "@/components/admin/settings/homepage/SectionRow";
import { SectionIcon } from "@/components/admin/settings/homepage/SectionIcon";
import AdminPageHeader from "@/components/admin/AdminPageHeader";

// ── Visual order sidebar ──────────────────────────────────────────────────────
function SectionOrderSidebar({
  sections,
  onToggleVisible,
  isAr,
}: {
  sections: HomepageSection[];
  onToggleVisible: (s: HomepageSection) => void;
  isAr: boolean;
}) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
        {isAr ? "ترتيب الأقسام" : "Section Order"}
      </p>
      {sections.map((s, i) => (
        <div
          key={s.id}
          className={cn(
            "flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs transition-colors",
            s.is_visible
              ? "bg-primary/5 border border-primary/20 text-foreground"
              : "bg-muted/30 border border-border/30 text-muted-foreground"
          )}
        >
          <span className="text-[9px] font-mono text-muted-foreground/60 w-4 shrink-0">{i + 1}</span>
          <SectionIcon sectionKey={s.section_key} className="h-3 w-3 shrink-0" />
          <span className="flex-1 truncate text-[11px]">{isAr ? s.title_ar : s.title_en}</span>
          <button
            onClick={() => onToggleVisible(s)}
            className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
          >
            {s.is_visible
              ? <Eye className="h-3 w-3 text-primary" />
              : <EyeOff className="h-3 w-3" />}
          </button>
        </div>
      ))}
    </div>
  );
}

// ── Stats bar ─────────────────────────────────────────────────────────────────
function StatsRow({ sections, isAr }: { sections: HomepageSection[]; isAr: boolean }) {
  const visible = sections.filter(s => s.is_visible).length;
  const hidden = sections.length - visible;
  const withCover = sections.filter(s => s.cover_type !== "none").length;
  const withAnim = sections.filter(s => s.animation !== "none").length;

  return (
    <div className="flex flex-wrap gap-2">
      <Badge variant="secondary" className="gap-1.5 text-xs">
        <Layers className="h-3 w-3" />{sections.length} {isAr ? "قسم" : "sections"}
      </Badge>
      <Badge variant="outline" className="gap-1.5 text-xs text-emerald-600 border-emerald-200">
        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        {visible} {isAr ? "مرئي" : "visible"}
      </Badge>
      {hidden > 0 && (
        <Badge variant="outline" className="gap-1.5 text-xs">
          <EyeOff className="h-3 w-3" />{hidden} {isAr ? "مخفي" : "hidden"}
        </Badge>
      )}
      {withCover > 0 && (
        <Badge variant="outline" className="gap-1.5 text-xs">
          <Monitor className="h-3 w-3" />{withCover} {isAr ? "مع غلاف" : "with cover"}
        </Badge>
      )}
      {withAnim > 0 && (
        <Badge variant="outline" className="gap-1.5 text-xs">
          <SlidersHorizontal className="h-3 w-3" />{withAnim} {isAr ? "مع حركة" : "animated"}
        </Badge>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function HomepageSectionsAdmin() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { toast } = useToast();

  const { data: sections = [], isLoading } = useHomepageSections();
  const updateSection = useUpdateHomepageSection();
  const bulkUpdate = useBulkUpdateHomepageSections();
  const createSection = useCreateHomepageSection();

  const [openSections, setOpenSections] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [visibilityFilter, setVisibilityFilter] = useState<"all" | "visible" | "hidden">("all");
  const [orderedSections, setOrderedSections] = useState<HomepageSection[] | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);

  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  const displaySections = orderedSections || sections;
  const hasReorder = orderedSections !== null;

  const filteredSections = displaySections.filter(s => {
    if (visibilityFilter === "visible" && !s.is_visible) return false;
    if (visibilityFilter === "hidden" && s.is_visible) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        s.title_en.toLowerCase().includes(q) ||
        s.title_ar.includes(searchQuery) ||
        s.section_key.includes(q)
      );
    }
    return true;
  });

  const toggle = (id: string) =>
    setOpenSections(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const handleUpdate = async (section: HomepageSection, updates: Partial<HomepageSection>) => {
    try {
      await updateSection.mutateAsync({ id: section.id, ...updates });
      toast({ title: isAr ? "تم الحفظ ✓" : "Saved ✓" });
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

  const toggleAll = async (visible: boolean) => {
    try {
      await bulkUpdate.mutateAsync(displaySections.map(s => ({ id: s.id, is_visible: visible })));
      toast({ title: visible ? (isAr ? "تم إظهار الكل" : "All shown") : (isAr ? "تم إخفاء الكل" : "All hidden") });
    } catch {
      toast({ title: isAr ? "خطأ" : "Error", variant: "destructive" });
    }
  };

  const expandAll = () => setOpenSections(new Set(displaySections.map(s => s.id)));
  const collapseAll = () => setOpenSections(new Set());

  // ── Drag & drop ──
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
    const [moved] = items.splice(dragItem.current, 1);
    items.splice(dragOverItem.current, 0, moved);
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
      await bulkUpdate.mutateAsync(orderedSections.map((s, idx) => ({ id: s.id, sort_order: idx + 1 })));
      setOrderedSections(null);
      toast({ title: isAr ? "تم حفظ الترتيب ✓" : "Order saved ✓" });
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
      toast({ title: isAr ? "تم التكرار" : "Duplicated" });
    } catch {
      toast({ title: isAr ? "خطأ" : "Error", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <AdminPageHeader
        icon={LayoutGrid}
        title={isAr ? "أقسام الصفحة الرئيسية" : "Homepage Sections"}
        description={isAr
          ? "تحكم في ترتيب وظهور وتصميم أقسام الصفحة الرئيسية"
          : "Control visibility, order, layout and design of every homepage section"}
      />

      {/* ── Stats ── */}
      <StatsRow sections={displaySections} isAr={isAr} />

      {/* ── Toolbar ── */}
      <Card className="border-border/50 bg-muted/20">
        <CardContent className="p-3 space-y-3">

          {/* Reorder save bar */}
          {hasReorder && (
            <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 px-3 py-2">
              <GripVertical className="h-4 w-4 text-amber-600 shrink-0 animate-pulse" />
              <p className="text-xs text-amber-700 dark:text-amber-300 flex-1">
                {isAr ? "تم تغيير الترتيب — احفظ لتطبيق التغييرات" : "Order changed — save to apply"}
              </p>
              <Button size="sm" className="h-7 text-xs gap-1" onClick={saveOrder} disabled={bulkUpdate.isPending}>
                {bulkUpdate.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                {isAr ? "حفظ الترتيب" : "Save Order"}
              </Button>
              <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={() => setOrderedSections(null)}>
                <RotateCcw className="h-3 w-3" />
                {isAr ? "إلغاء" : "Cancel"}
              </Button>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[180px] max-w-xs">
              <Search className="absolute start-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={isAr ? "بحث في الأقسام..." : "Search sections..."}
                className="h-8 text-xs ps-8"
              />
            </div>

            <Select value={visibilityFilter} onValueChange={v => setVisibilityFilter(v as any)}>
              <SelectTrigger className="h-7 w-[110px] text-[10px]">
                <Filter className="h-3 w-3 me-1" /><SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">{isAr ? "الكل" : "All"}</SelectItem>
                <SelectItem value="visible" className="text-xs">{isAr ? "مرئي" : "Visible"}</SelectItem>
                <SelectItem value="hidden" className="text-xs">{isAr ? "مخفي" : "Hidden"}</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-1">
              <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1" onClick={() => toggleAll(true)} disabled={bulkUpdate.isPending}>
                <Eye className="h-3 w-3" />{isAr ? "إظهار الكل" : "Show All"}
              </Button>
              <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1" onClick={() => toggleAll(false)} disabled={bulkUpdate.isPending}>
                <EyeOff className="h-3 w-3" />{isAr ? "إخفاء الكل" : "Hide All"}
              </Button>
              <Button size="sm" variant="ghost" className="h-7 text-[10px] gap-1" onClick={expandAll}>
                <ChevronDown className="h-3 w-3" />{isAr ? "فتح" : "Expand"}
              </Button>
              <Button size="sm" variant="ghost" className="h-7 text-[10px] gap-1" onClick={collapseAll}>
                <ChevronUp className="h-3 w-3" />{isAr ? "إغلاق" : "Collapse"}
              </Button>
              <Button
                size="sm" variant="ghost"
                className={cn("h-7 text-[10px] gap-1", showSidebar && "bg-muted")}
                onClick={() => setShowSidebar(v => !v)}
              >
                <Layers className="h-3 w-3" />{isAr ? "الترتيب" : "Order"}
              </Button>
            </div>

            <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1 ms-auto" asChild>
              <a href="/" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3 w-3" />{isAr ? "معاينة الموقع" : "Preview Site"}
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Main layout: list + sidebar ── */}
      <div className={cn("gap-4", showSidebar ? "grid lg:grid-cols-[1fr_220px]" : "block")}>

        {/* Section cards */}
        <div className="space-y-1.5">
          {filteredSections.map((section, idx) => (
            <SectionRow
              key={section.id}
              section={section}
              index={idx}
              isOpen={openSections.has(section.id)}
              onToggle={() => toggle(section.id)}
              onUpdate={u => handleUpdate(section, u)}
              onQuickToggle={v => handleQuickToggle(section, v)}
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

          {filteredSections.length === 0 && searchQuery && (
            <div className="text-center py-10 text-sm text-muted-foreground rounded-xl border-2 border-dashed border-border/40">
              {isAr ? "لا توجد أقسام مطابقة" : "No sections match your search"}
            </div>
          )}
        </div>

        {/* ── Order sidebar ── */}
        {showSidebar && (
          <div className="sticky top-20 self-start">
            <Card className="border-border/50">
              <CardContent className="p-3">
                <SectionOrderSidebar
                  sections={displaySections}
                  onToggleVisible={s => handleQuickToggle(s, !s.is_visible)}
                  isAr={isAr}
                />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
