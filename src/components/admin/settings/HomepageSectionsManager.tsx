import { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import {
  useHomepageSections,
  useUpdateHomepageSection,
  type HomepageSection,
} from "@/hooks/useHomepageSections";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Eye, EyeOff, ChevronDown, Save, Image, LayoutGrid, Type,
  Filter, ArrowUpDown, GripVertical, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const SIZE_OPTIONS = [
  { value: "small", en: "Small", ar: "صغير" },
  { value: "medium", en: "Medium", ar: "متوسط" },
  { value: "large", en: "Large", ar: "كبير" },
];

const COVER_TYPE_OPTIONS = [
  { value: "none", en: "No Cover", ar: "بدون غلاف" },
  { value: "background", en: "Background Image", ar: "صورة خلفية" },
  { value: "banner", en: "Top Banner", ar: "بانر علوي" },
];

export function HomepageSectionsManager() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { data: sections = [], isLoading } = useHomepageSections();
  const updateSection = useUpdateHomepageSection();
  const { toast } = useToast();
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <LayoutGrid className="h-4 w-4" />
          <span>{sections.length} {isAr ? "قسم" : "sections"}</span>
          <span className="text-muted-foreground/50">·</span>
          <span>{sections.filter((s) => s.is_visible).length} {isAr ? "مرئي" : "visible"}</span>
        </div>
      </div>

      {/* Section cards */}
      <div className="space-y-2">
        {sections.map((section, idx) => (
          <SectionRow
            key={section.id}
            section={section}
            index={idx}
            isOpen={openSections.has(section.id)}
            onToggle={() => toggle(section.id)}
            onUpdate={(u) => handleUpdate(section, u)}
            isPending={updateSection.isPending}
            isAr={isAr}
          />
        ))}
      </div>
    </div>
  );
}

/* ───────── Individual Section Row ───────── */

interface SectionRowProps {
  section: HomepageSection;
  index: number;
  isOpen: boolean;
  onToggle: () => void;
  onUpdate: (u: Partial<HomepageSection>) => void;
  isPending: boolean;
  isAr: boolean;
}

function SectionRow({ section, index, isOpen, onToggle, onUpdate, isPending, isAr }: SectionRowProps) {
  const [local, setLocal] = useState<Partial<HomepageSection>>({});
  const merged = { ...section, ...local };

  const set = <K extends keyof HomepageSection>(key: K, value: HomepageSection[K]) => {
    setLocal((prev) => ({ ...prev, [key]: value }));
  };

  const save = () => {
    onUpdate(local);
    setLocal({});
  };

  const hasChanges = Object.keys(local).length > 0;

  return (
    <Collapsible open={isOpen} onOpenChange={onToggle}>
      <div
        className={cn(
          "rounded-lg border transition-all",
          isOpen ? "border-primary/30 bg-card shadow-sm" : "border-border/50 hover:border-border",
          !merged.is_visible && "opacity-60"
        )}
      >
        {/* Header */}
        <CollapsibleTrigger asChild>
          <button className="flex w-full items-center gap-3 px-3 py-2.5 text-start">
            <GripVertical className="h-4 w-4 text-muted-foreground/40 shrink-0" />
            <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0 shrink-0">
              {index + 1}
            </Badge>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium truncate block">
                {isAr ? merged.title_ar : merged.title_en}
              </span>
              <span className="text-[10px] text-muted-foreground font-mono">{section.section_key}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {merged.cover_type !== "none" && (
                <Badge variant="secondary" className="text-[9px] gap-1">
                  <Image className="h-2.5 w-2.5" />
                  {isAr ? "غلاف" : "Cover"}
                </Badge>
              )}
              {merged.is_visible ? (
                <Eye className="h-3.5 w-3.5 text-green-500" />
              ) : (
                <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
              )}
              <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
            </div>
          </button>
        </CollapsibleTrigger>

        {/* Expanded content */}
        <CollapsibleContent>
          <div className="border-t border-border/50 px-4 py-4 space-y-5">
            {/* Visibility toggle */}
            <div className="flex items-center justify-between">
              <Label className="text-xs flex items-center gap-1.5">
                <Eye className="h-3 w-3" /> {isAr ? "إظهار القسم" : "Show Section"}
              </Label>
              <Switch
                checked={merged.is_visible}
                onCheckedChange={(v) => set("is_visible", v)}
              />
            </div>

            <Separator />

            {/* Titles */}
            <div className="space-y-3">
              <Label className="text-xs flex items-center gap-1.5">
                <Type className="h-3 w-3" /> {isAr ? "العناوين" : "Titles"}
              </Label>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">English Title</Label>
                  <Input
                    value={merged.title_en}
                    onChange={(e) => set("title_en", e.target.value)}
                    className="text-xs h-8"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">العنوان بالعربية</Label>
                  <Input
                    value={merged.title_ar}
                    onChange={(e) => set("title_ar", e.target.value)}
                    className="text-xs h-8"
                    dir="rtl"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">English Subtitle</Label>
                  <Input
                    value={merged.subtitle_en || ""}
                    onChange={(e) => set("subtitle_en", e.target.value)}
                    className="text-xs h-8"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">العنوان الفرعي بالعربية</Label>
                  <Input
                    value={merged.subtitle_ar || ""}
                    onChange={(e) => set("subtitle_ar", e.target.value)}
                    className="text-xs h-8"
                    dir="rtl"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Cover settings */}
            <div className="space-y-3">
              <Label className="text-xs flex items-center gap-1.5">
                <Image className="h-3 w-3" /> {isAr ? "إعدادات الغلاف" : "Cover Settings"}
              </Label>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">{isAr ? "نوع الغلاف" : "Cover Type"}</Label>
                  <Select
                    value={merged.cover_type}
                    onValueChange={(v) => set("cover_type", v as HomepageSection["cover_type"])}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COVER_TYPE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value} className="text-xs">
                          {isAr ? opt.ar : opt.en}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {merged.cover_type !== "none" && (
                  <>
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground">{isAr ? "رابط الصورة" : "Image URL"}</Label>
                      <Input
                        value={merged.cover_image_url || ""}
                        onChange={(e) => set("cover_image_url", e.target.value)}
                        placeholder="https://..."
                        className="text-xs h-8 font-mono"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-[10px] text-muted-foreground">{isAr ? "ارتفاع الغلاف" : "Cover Height"}</Label>
                        <Badge variant="outline" className="text-[9px] font-mono">{merged.cover_height}px</Badge>
                      </div>
                      <Slider
                        value={[merged.cover_height]}
                        onValueChange={([v]) => set("cover_height", v)}
                        min={100} max={500} step={10}
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-[10px] text-muted-foreground">{isAr ? "شفافية التراكب" : "Overlay Opacity"}</Label>
                        <Badge variant="outline" className="text-[9px] font-mono">{merged.cover_overlay_opacity}%</Badge>
                      </div>
                      <Slider
                        value={[merged.cover_overlay_opacity]}
                        onValueChange={([v]) => set("cover_overlay_opacity", v)}
                        min={0} max={100} step={5}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            <Separator />

            {/* Layout controls */}
            <div className="space-y-3">
              <Label className="text-xs flex items-center gap-1.5">
                <LayoutGrid className="h-3 w-3" /> {isAr ? "التخطيط والعرض" : "Layout & Display"}
              </Label>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">{isAr ? "عدد العناصر" : "Item Count"}</Label>
                  <Input
                    type="number"
                    min={1} max={50}
                    value={merged.item_count}
                    onChange={(e) => set("item_count", parseInt(e.target.value) || 8)}
                    className="text-xs h-8"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">{isAr ? "حجم العنصر" : "Item Size"}</Label>
                  <Select
                    value={merged.item_size}
                    onValueChange={(v) => set("item_size", v as HomepageSection["item_size"])}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SIZE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value} className="text-xs">
                          {isAr ? opt.ar : opt.en}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">{isAr ? "عناصر في الصف" : "Items per Row"}</Label>
                  <Input
                    type="number"
                    min={1} max={8}
                    value={merged.items_per_row}
                    onChange={(e) => set("items_per_row", parseInt(e.target.value) || 4)}
                    className="text-xs h-8"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Toggles */}
            <div className="space-y-3">
              <Label className="text-xs flex items-center gap-1.5">
                <Filter className="h-3 w-3" /> {isAr ? "خيارات إضافية" : "Additional Options"}
              </Label>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={merged.show_filters}
                    onCheckedChange={(v) => set("show_filters", v)}
                    id={`filters-${section.id}`}
                  />
                  <Label htmlFor={`filters-${section.id}`} className="text-xs">
                    {isAr ? "إظهار الفلاتر" : "Show Filters"}
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={merged.show_view_all}
                    onCheckedChange={(v) => set("show_view_all", v)}
                    id={`viewall-${section.id}`}
                  />
                  <Label htmlFor={`viewall-${section.id}`} className="text-xs">
                    {isAr ? "عرض الكل" : "View All"}
                  </Label>
                </div>
              </div>
            </div>

            {/* Sort order */}
            <div className="flex items-center gap-3">
              <Label className="text-xs flex items-center gap-1.5 shrink-0">
                <ArrowUpDown className="h-3 w-3" /> {isAr ? "الترتيب" : "Sort Order"}
              </Label>
              <Input
                type="number"
                min={1} max={50}
                value={merged.sort_order}
                onChange={(e) => set("sort_order", parseInt(e.target.value) || 1)}
                className="text-xs h-8 w-20"
              />
            </div>

            {/* Save button */}
            {hasChanges && (
              <Button size="sm" className="gap-1.5" onClick={save} disabled={isPending}>
                {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                {isAr ? "حفظ التغييرات" : "Save Changes"}
              </Button>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
