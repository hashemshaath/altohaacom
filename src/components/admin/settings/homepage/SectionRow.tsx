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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Eye, EyeOff, ChevronDown, Save, Image, LayoutGrid, Type,
  Filter, GripVertical, Loader2, Palette, Sparkles, Smartphone,
  Clock, Box, Settings2, RotateCcw, Copy, ExternalLink,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
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

const SPACING_OPTIONS = [
  { value: "none", en: "None", ar: "بدون" },
  { value: "compact", en: "Compact", ar: "مضغوط" },
  { value: "normal", en: "Normal", ar: "عادي" },
  { value: "relaxed", en: "Relaxed", ar: "مريح" },
];

const ANIMATION_OPTIONS = [
  { value: "none", en: "None", ar: "بدون" },
  { value: "fade", en: "Fade In", ar: "تلاشي" },
  { value: "slide-up", en: "Slide Up", ar: "انزلاق للأعلى" },
  { value: "slide-left", en: "Slide Left", ar: "انزلاق يسار" },
  { value: "scale", en: "Scale", ar: "تكبير" },
  { value: "blur", en: "Blur In", ar: "ضبابي" },
];

const CONTAINER_OPTIONS = [
  { value: "default", en: "Default", ar: "افتراضي" },
  { value: "narrow", en: "Narrow", ar: "ضيق" },
  { value: "wide", en: "Wide", ar: "واسع" },
  { value: "full", en: "Full Width", ar: "عرض كامل" },
];

interface SectionRowProps {
  section: HomepageSection;
  index: number;
  isOpen: boolean;
  onToggle: () => void;
  onUpdate: (u: Partial<HomepageSection>) => void;
  onQuickToggle: (visible: boolean) => void;
  onDuplicate?: (section: HomepageSection) => void;
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
  onDuplicate, isPending, isAr, isDragging, dragHandleProps,
}: SectionRowProps) {
  const [local, setLocal] = useState<Partial<HomepageSection>>({});
  const [jsonError, setJsonError] = useState<string | null>(null);
  const merged = { ...section, ...local };

  const set = <K extends keyof HomepageSection>(key: K, value: HomepageSection[K]) => {
    setLocal((prev) => ({ ...prev, [key]: value }));
  };

  const save = () => {
    onUpdate(local);
    setLocal({});
  };

  const hasChanges = Object.keys(local).length > 0;
  const lastUpdated = new Date(section.updated_at).toLocaleDateString(isAr ? "ar" : "en", {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });

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

          <button
            onClick={(e) => { e.stopPropagation(); onQuickToggle(!merged.is_visible); }}
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
                {merged.cover_type !== "none" && (
                  <Badge variant="secondary" className="text-[8px] sm:text-[9px] gap-0.5 px-1.5 py-0">
                    <Image className="h-2.5 w-2.5" /> {isAr ? "غلاف" : "Cover"}
                  </Badge>
                )}
                {merged.animation !== "none" && (
                  <Badge variant="outline" className="text-[8px] sm:text-[9px] gap-0.5 px-1.5 py-0 hidden sm:flex">
                    <Sparkles className="h-2.5 w-2.5" /> {merged.animation}
                  </Badge>
                )}
                <Badge variant="outline" className="text-[8px] sm:text-[9px] font-mono px-1.5 py-0 hidden sm:flex">
                  {merged.item_count}×{merged.items_per_row}
                </Badge>
                <Badge variant="outline" className="text-[9px] font-mono px-1 py-0 bg-muted/50">
                  #{index + 1}
                </Badge>
                <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
              </div>
            </button>
          </CollapsibleTrigger>
        </div>

        {/* Cover preview when collapsed */}
        {merged.cover_type !== "none" && merged.cover_image_url && !isOpen && (
          <div className="mx-3 mb-2 rounded-md overflow-hidden h-10 relative">
            <img src={merged.cover_image_url} alt="" className="w-full h-full object-cover" loading="lazy" />
            <div className="absolute inset-0 bg-black" style={{ opacity: merged.cover_overlay_opacity / 100 }} />
          </div>
        )}

        {/* Expanded content with tabs */}
        <CollapsibleContent>
          <div className="border-t border-border/50">
            <Tabs defaultValue="content" className="w-full">
              <div className="px-3 pt-2">
                <TabsList className="h-8 w-full grid grid-cols-5 bg-muted/50">
                  <TabsTrigger value="content" className="text-[10px] gap-1 h-7">
                    <Type className="h-3 w-3" /> {isAr ? "المحتوى" : "Content"}
                  </TabsTrigger>
                  <TabsTrigger value="layout" className="text-[10px] gap-1 h-7">
                    <LayoutGrid className="h-3 w-3" /> {isAr ? "التخطيط" : "Layout"}
                  </TabsTrigger>
                  <TabsTrigger value="cover" className="text-[10px] gap-1 h-7">
                    <Image className="h-3 w-3" /> {isAr ? "الغلاف" : "Cover"}
                  </TabsTrigger>
                  <TabsTrigger value="style" className="text-[10px] gap-1 h-7">
                    <Palette className="h-3 w-3" /> {isAr ? "المظهر" : "Style"}
                  </TabsTrigger>
                  <TabsTrigger value="advanced" className="text-[10px] gap-1 h-7">
                    <Settings2 className="h-3 w-3" /> {isAr ? "متقدم" : "Advanced"}
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Content Tab */}
              <TabsContent value="content" className="px-3 sm:px-4 py-4 space-y-4 mt-0">
                <div className="flex items-center justify-between">
                  <Label className="text-xs flex items-center gap-1.5">
                    <Eye className="h-3 w-3" /> {isAr ? "إظهار القسم" : "Show Section"}
                  </Label>
                  <Switch checked={merged.is_visible} onCheckedChange={(v) => set("is_visible", v)} />
                </div>

                <Separator />

                <div className="space-y-3">
                  <Label className="text-xs font-semibold">{isAr ? "العناوين" : "Titles"}</Label>
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
                      <Label className="text-[10px] text-muted-foreground">العنوان الفرعي</Label>
                      <Input value={merged.subtitle_ar || ""} onChange={(e) => set("subtitle_ar", e.target.value)} className="text-xs h-8" dir="rtl" />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <Label className="text-xs font-semibold">{isAr ? "الوصف" : "Description"}</Label>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground">English Description</Label>
                      <Input value={merged.description_en || ""} onChange={(e) => set("description_en", e.target.value)} className="text-xs h-8" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground">الوصف بالعربية</Label>
                      <Input value={merged.description_ar || ""} onChange={(e) => set("description_ar", e.target.value)} className="text-xs h-8" dir="rtl" />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <Label className="text-xs font-semibold flex items-center gap-1.5">
                    <Filter className="h-3 w-3" /> {isAr ? "خيارات" : "Options"}
                  </Label>
                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center gap-2">
                      <Switch checked={merged.show_filters} onCheckedChange={(v) => set("show_filters", v)} id={`f-${section.id}`} />
                      <Label htmlFor={`f-${section.id}`} className="text-xs">{isAr ? "الفلاتر" : "Filters"}</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={merged.show_view_all} onCheckedChange={(v) => set("show_view_all", v)} id={`v-${section.id}`} />
                      <Label htmlFor={`v-${section.id}`} className="text-xs">{isAr ? "عرض الكل" : "View All"}</Label>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Layout Tab */}
              <TabsContent value="layout" className="px-3 sm:px-4 py-4 space-y-4 mt-0">
                <div className="space-y-3">
                  <Label className="text-xs font-semibold">{isAr ? "شبكة العرض" : "Grid Layout"}</Label>
                  <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground">{isAr ? "عدد العناصر" : "Items"}</Label>
                      <Input type="number" min={1} max={50} value={merged.item_count} onChange={(e) => set("item_count", parseInt(e.target.value) || 8)} className="text-xs h-8" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground">{isAr ? "في الصف" : "Per Row"}</Label>
                      <Input type="number" min={1} max={8} value={merged.items_per_row} onChange={(e) => set("items_per_row", parseInt(e.target.value) || 4)} className="text-xs h-8" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground">{isAr ? "الحجم" : "Size"}</Label>
                      <Select value={merged.item_size} onValueChange={(v) => set("item_size", v as HomepageSection["item_size"])}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {SIZE_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value} className="text-xs">{isAr ? opt.ar : opt.en}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Smartphone className="h-2.5 w-2.5" /> {isAr ? "موبايل" : "Mobile"}
                      </Label>
                      <Input type="number" min={1} max={8} value={merged.max_items_mobile} onChange={(e) => set("max_items_mobile", parseInt(e.target.value) || 4)} className="text-xs h-8" />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <Label className="text-xs font-semibold">{isAr ? "التباعد والحاوية" : "Spacing & Container"}</Label>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground">{isAr ? "التباعد" : "Spacing"}</Label>
                      <Select value={merged.spacing} onValueChange={(v) => set("spacing", v as HomepageSection["spacing"])}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {SPACING_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value} className="text-xs">{isAr ? opt.ar : opt.en}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Box className="h-2.5 w-2.5" /> {isAr ? "عرض الحاوية" : "Container Width"}
                      </Label>
                      <Select value={merged.container_width} onValueChange={(v) => set("container_width", v as HomepageSection["container_width"])}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {CONTAINER_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value} className="text-xs">{isAr ? opt.ar : opt.en}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Cover Tab */}
              <TabsContent value="cover" className="px-3 sm:px-4 py-4 space-y-4 mt-0">
                <div className="space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground">{isAr ? "نوع الغلاف" : "Cover Type"}</Label>
                      <Select value={merged.cover_type} onValueChange={(v) => set("cover_type", v as HomepageSection["cover_type"])}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {COVER_TYPE_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value} className="text-xs">{isAr ? opt.ar : opt.en}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {merged.cover_type !== "none" && (
                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground">{isAr ? "رابط الصورة" : "Image URL"}</Label>
                        <Input
                          value={merged.cover_image_url || ""}
                          onChange={(e) => set("cover_image_url", e.target.value)}
                          placeholder="https://..."
                          className="text-xs h-8 font-mono"
                        />
                      </div>
                    )}
                  </div>

                  {merged.cover_type !== "none" && (
                    <>
                      {merged.cover_image_url && (
                        <div className="rounded-lg overflow-hidden relative" style={{ height: `${Math.min(merged.cover_height, 200)}px` }}>
                          <img src={merged.cover_image_url} alt="Cover preview" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black" style={{ opacity: merged.cover_overlay_opacity / 100 }} />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-white text-xs font-medium drop-shadow-md">{isAr ? "معاينة الغلاف" : "Cover Preview"}</span>
                          </div>
                        </div>
                      )}
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-[10px] text-muted-foreground">{isAr ? "الارتفاع" : "Height"}</Label>
                            <Badge variant="outline" className="text-[9px] font-mono">{merged.cover_height}px</Badge>
                          </div>
                          <Slider value={[merged.cover_height]} onValueChange={([v]) => set("cover_height", v)} min={100} max={500} step={10} />
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-[10px] text-muted-foreground">{isAr ? "التراكب" : "Overlay"}</Label>
                            <Badge variant="outline" className="text-[9px] font-mono">{merged.cover_overlay_opacity}%</Badge>
                          </div>
                          <Slider value={[merged.cover_overlay_opacity]} onValueChange={([v]) => set("cover_overlay_opacity", v)} min={0} max={100} step={5} />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </TabsContent>

              {/* Advanced Tab */}
              <TabsContent value="advanced" className="px-3 sm:px-4 py-4 space-y-4 mt-0">
                <div className="space-y-3">
                  <Label className="text-xs font-semibold flex items-center gap-1.5">
                    <Settings2 className="h-3 w-3" /> {isAr ? "تكوين مخصص (JSON)" : "Custom Config (JSON)"}
                  </Label>
                  <Textarea
                    value={JSON.stringify(merged.custom_config || {}, null, 2)}
                    onChange={(e) => {
                      try {
                        const parsed = JSON.parse(e.target.value);
                        set("custom_config", parsed);
                        setJsonError(null);
                      } catch {
                        setJsonError(isAr ? "JSON غير صالح" : "Invalid JSON");
                      }
                    }}
                    className="text-xs font-mono min-h-[120px] resize-y"
                    placeholder='{ "key": "value" }'
                  />
                  {jsonError && (
                    <p className="text-[10px] text-destructive">{jsonError}</p>
                  )}
                </div>

                <Separator />

                <div className="space-y-3">
                  <Label className="text-xs font-semibold">{isAr ? "إجراءات سريعة" : "Quick Actions"}</Label>
                  <div className="flex flex-wrap gap-2">
                    {onDuplicate && (
                      <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1" onClick={() => onDuplicate(section)}>
                        <Copy className="h-3 w-3" /> {isAr ? "تكرار القسم" : "Duplicate"}
                      </Button>
                    )}
                    <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1" onClick={() => {
                      setLocal({
                        animation: "fade",
                        spacing: "normal",
                        container_width: "default",
                        bg_color: "",
                        css_class: "",
                        cover_type: "none",
                        cover_overlay_opacity: 30,
                        cover_height: 200,
                      });
                    }}>
                      <RotateCcw className="h-3 w-3" /> {isAr ? "إعادة تعيين المظهر" : "Reset Style"}
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1" asChild>
                      <a href={`/#${section.section_key}`} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-3 w-3" /> {isAr ? "معاينة" : "Preview"}
                      </a>
                    </Button>
                  </div>
                </div>

                <Separator />

                <div className="rounded-lg bg-muted/50 p-3 space-y-1.5">
                  <p className="text-[10px] font-semibold text-muted-foreground">{isAr ? "معلومات القسم" : "Section Info"}</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] text-muted-foreground">
                    <span>ID:</span><span className="font-mono truncate">{section.id}</span>
                    <span>Key:</span><span className="font-mono">{section.section_key}</span>
                    <span>Sort:</span><span>{section.sort_order}</span>
                    <span>{isAr ? "آخر تحديث" : "Updated"}:</span><span>{lastUpdated}</span>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            {/* Footer: Save + meta */}
            <div className="px-3 sm:px-4 pb-3 flex items-center justify-between gap-2">
              {hasChanges ? (
                <div className="flex items-center gap-2">
                  <Button size="sm" className="gap-1.5 h-8" onClick={save} disabled={isPending}>
                    {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                    {isAr ? "حفظ" : "Save"}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => { setLocal({}); setJsonError(null); }} className="text-xs h-8">
                    {isAr ? "إلغاء" : "Cancel"}
                  </Button>
                </div>
              ) : <div />}

              <span className="text-[9px] text-muted-foreground flex items-center gap-1">
                <Clock className="h-2.5 w-2.5" /> {lastUpdated}
              </span>
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
