import { useState } from "react";
import { type HomepageSection } from "@/hooks/useHomepageSections";
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
  Filter, GripVertical, Loader2, ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SectionIcon } from "./SectionIcon";

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

interface SectionRowProps {
  section: HomepageSection;
  index: number;
  isOpen: boolean;
  onToggle: () => void;
  onUpdate: (u: Partial<HomepageSection>) => void;
  onQuickToggle: (visible: boolean) => void;
  isPending: boolean;
  isAr: boolean;
  isDragging?: boolean;
  dragHandleProps?: {
    onDragStart: (e: React.DragEvent) => void;
    onDragEnd: (e: React.DragEvent) => void;
    onDragOver: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent) => void;
  };
}

export function SectionRow({
  section, index, isOpen, onToggle, onUpdate, onQuickToggle,
  isPending, isAr, isDragging, dragHandleProps,
}: SectionRowProps) {
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
          !merged.is_visible && "opacity-50",
          isDragging && "opacity-30 scale-95"
        )}
        draggable
        {...dragHandleProps}
      >
        {/* Header */}
        <div className="flex items-center gap-1 px-1.5 py-1.5 sm:px-3 sm:py-2.5">
          <GripVertical className="h-4 w-4 text-muted-foreground/40 shrink-0 cursor-grab active:cursor-grabbing" />

          {/* Quick visibility toggle */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onQuickToggle(!merged.is_visible);
            }}
            className="p-1 rounded-md hover:bg-muted/50 transition-colors shrink-0"
            title={isAr ? "إظهار/إخفاء" : "Toggle visibility"}
          >
            {merged.is_visible ? (
              <Eye className="h-3.5 w-3.5 text-primary" />
            ) : (
              <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </button>

          <CollapsibleTrigger asChild>
            <button className="flex flex-1 items-center gap-2 text-start min-w-0 py-1">
              <SectionIcon sectionKey={section.section_key} className="h-4 w-4 text-primary/70 shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-xs sm:text-sm font-medium truncate block">
                  {isAr ? merged.title_ar : merged.title_en}
                </span>
                <span className="text-[9px] sm:text-[10px] text-muted-foreground font-mono">{section.section_key}</span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {/* Cover indicator */}
                {merged.cover_type !== "none" && (
                  <Badge variant="secondary" className="text-[8px] sm:text-[9px] gap-0.5 px-1.5 py-0">
                    <Image className="h-2.5 w-2.5" />
                    {isAr ? "غلاف" : "Cover"}
                  </Badge>
                )}
                {/* Layout info */}
                <Badge variant="outline" className="text-[8px] sm:text-[9px] font-mono px-1.5 py-0 hidden sm:flex">
                  {merged.item_count}×{merged.items_per_row}
                </Badge>
                {/* Sort order */}
                <Badge variant="outline" className="text-[9px] font-mono px-1 py-0 bg-muted/50">
                  #{index + 1}
                </Badge>

                <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
              </div>
            </button>
          </CollapsibleTrigger>
        </div>

        {/* Cover image preview */}
        {merged.cover_type !== "none" && merged.cover_image_url && !isOpen && (
          <div className="mx-3 mb-2 rounded-md overflow-hidden h-10 relative">
            <img
              src={merged.cover_image_url}
              alt=""
              className="w-full h-full object-cover"
              loading="lazy"
            />
            <div
              className="absolute inset-0 bg-black"
              style={{ opacity: merged.cover_overlay_opacity / 100 }}
            />
          </div>
        )}

        {/* Expanded content */}
        <CollapsibleContent>
          <div className="border-t border-border/50 px-3 sm:px-4 py-4 space-y-5">
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
                  <Input value={merged.title_en} onChange={(e) => set("title_en", e.target.value)} className="text-xs h-8" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">العنوان بالعربية</Label>
                  <Input value={merged.title_ar} onChange={(e) => set("title_ar", e.target.value)} className="text-xs h-8" dir="rtl" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">English Subtitle</Label>
                  <Input value={merged.subtitle_en || ""} onChange={(e) => set("subtitle_en", e.target.value)} className="text-xs h-8" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">العنوان الفرعي بالعربية</Label>
                  <Input value={merged.subtitle_ar || ""} onChange={(e) => set("subtitle_ar", e.target.value)} className="text-xs h-8" dir="rtl" />
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
                  <Select value={merged.cover_type} onValueChange={(v) => set("cover_type", v as HomepageSection["cover_type"])}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
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
                    {/* Live cover preview */}
                    {merged.cover_image_url && (
                      <div className="sm:col-span-2 rounded-lg overflow-hidden relative" style={{ height: `${Math.min(merged.cover_height, 200)}px` }}>
                        <img src={merged.cover_image_url} alt="Cover preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black" style={{ opacity: merged.cover_overlay_opacity / 100 }} />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-white text-xs font-medium drop-shadow-md">
                            {isAr ? "معاينة الغلاف" : "Cover Preview"}
                          </span>
                        </div>
                      </div>
                    )}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-[10px] text-muted-foreground">{isAr ? "ارتفاع الغلاف" : "Cover Height"}</Label>
                        <Badge variant="outline" className="text-[9px] font-mono">{merged.cover_height}px</Badge>
                      </div>
                      <Slider value={[merged.cover_height]} onValueChange={([v]) => set("cover_height", v)} min={100} max={500} step={10} />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-[10px] text-muted-foreground">{isAr ? "شفافية التراكب" : "Overlay Opacity"}</Label>
                        <Badge variant="outline" className="text-[9px] font-mono">{merged.cover_overlay_opacity}%</Badge>
                      </div>
                      <Slider value={[merged.cover_overlay_opacity]} onValueChange={([v]) => set("cover_overlay_opacity", v)} min={0} max={100} step={5} />
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
              <div className="grid gap-3 grid-cols-3">
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">{isAr ? "عدد العناصر" : "Items"}</Label>
                  <Input type="number" min={1} max={50} value={merged.item_count} onChange={(e) => set("item_count", parseInt(e.target.value) || 8)} className="text-xs h-8" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">{isAr ? "الحجم" : "Size"}</Label>
                  <Select value={merged.item_size} onValueChange={(v) => set("item_size", v as HomepageSection["item_size"])}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
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
                  <Label className="text-[10px] text-muted-foreground">{isAr ? "في الصف" : "Per Row"}</Label>
                  <Input type="number" min={1} max={8} value={merged.items_per_row} onChange={(e) => set("items_per_row", parseInt(e.target.value) || 4)} className="text-xs h-8" />
                </div>
              </div>
            </div>

            <Separator />

            {/* Toggles */}
            <div className="space-y-3">
              <Label className="text-xs flex items-center gap-1.5">
                <Filter className="h-3 w-3" /> {isAr ? "خيارات إضافية" : "Options"}
              </Label>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <Switch checked={merged.show_filters} onCheckedChange={(v) => set("show_filters", v)} id={`filters-${section.id}`} />
                  <Label htmlFor={`filters-${section.id}`} className="text-xs">{isAr ? "الفلاتر" : "Filters"}</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={merged.show_view_all} onCheckedChange={(v) => set("show_view_all", v)} id={`viewall-${section.id}`} />
                  <Label htmlFor={`viewall-${section.id}`} className="text-xs">{isAr ? "عرض الكل" : "View All"}</Label>
                </div>
              </div>
            </div>

            {/* Save button */}
            {hasChanges && (
              <div className="flex items-center gap-2 pt-2">
                <Button size="sm" className="gap-1.5" onClick={save} disabled={isPending}>
                  {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  {isAr ? "حفظ التغييرات" : "Save Changes"}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setLocal({})} className="text-xs">
                  {isAr ? "إلغاء" : "Cancel"}
                </Button>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
