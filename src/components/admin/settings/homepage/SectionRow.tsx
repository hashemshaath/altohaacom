import { useState, forwardRef } from "react";
import { type HomepageSection } from "@/hooks/useHomepageSections";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Eye, EyeOff, ChevronDown, Save, Image, LayoutGrid, Database,
  GripVertical, Loader2, Palette, Sparkles,
  Clock, Settings2, RotateCcw, Copy, ExternalLink, Rows3,
  LayoutTemplate, SlidersHorizontal,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { SectionIcon } from "./SectionIcon";
import { BilingualField } from "./BilingualField";

const SOURCE_TYPE_OPTIONS = [
  { value: "auto", en: "Automatic", ar: "تلقائي" },
  { value: "manual", en: "Manual", ar: "يدوي" },
  { value: "query", en: "Custom Query", ar: "استعلام مخصص" },
];

const SOURCE_TABLE_OPTIONS = [
  { value: "", en: "Default", ar: "افتراضي" },
  { value: "competitions", en: "Competitions", ar: "المسابقات" },
  { value: "articles", en: "Articles", ar: "المقالات" },
  { value: "profiles", en: "Chefs/Users", ar: "الطهاة/المستخدمين" },
  { value: "companies", en: "Companies", ar: "الشركات" },
  { value: "masterclasses", en: "Masterclasses", ar: "الدورات" },
  { value: "establishments", en: "Establishments", ar: "المنشآت" },
];

const SORT_BY_OPTIONS = [
  { value: "created_at", en: "Date Created", ar: "تاريخ الإنشاء" },
  { value: "updated_at", en: "Last Updated", ar: "آخر تحديث" },
  { value: "sort_order", en: "Manual Order", ar: "ترتيب يدوي" },
  { value: "view_count", en: "Most Viewed", ar: "الأكثر مشاهدة" },
  { value: "name", en: "Name (A-Z)", ar: "الاسم" },
];

const DISPLAY_STYLE_OPTIONS = [
  { value: "grid", en: "Grid", ar: "شبكة", icon: "⊞" },
  { value: "carousel", en: "Carousel", ar: "دوّار", icon: "⟳" },
  { value: "list", en: "List", ar: "قائمة", icon: "☰" },
  { value: "masonry", en: "Masonry", ar: "بناء", icon: "⊟" },
  { value: "featured", en: "Featured", ar: "مميز", icon: "★" },
];

const CARD_TEMPLATE_OPTIONS = [
  { value: "default", en: "Default", ar: "افتراضي" },
  { value: "minimal", en: "Minimal", ar: "بسيط" },
  { value: "overlay", en: "Overlay", ar: "مع تراكب" },
  { value: "horizontal", en: "Horizontal", ar: "أفقي" },
  { value: "stats", en: "Stats Card", ar: "بطاقة إحصائيات" },
];

const SIZE_OPTIONS = [
  { value: "small", en: "S", ar: "ص" },
  { value: "medium", en: "M", ar: "م" },
  { value: "large", en: "L", ar: "ك" },
];

const SPACING_OPTIONS = [
  { value: "none", en: "None", ar: "بدون" },
  { value: "compact", en: "Compact", ar: "مضغوط" },
  { value: "normal", en: "Normal", ar: "عادي" },
  { value: "relaxed", en: "Relaxed", ar: "مريح" },
];

const ANIMATION_OPTIONS = [
  { value: "none", en: "—", ar: "—" },
  { value: "fade", en: "Fade", ar: "تلاشي" },
  { value: "slide-up", en: "Up", ar: "↑" },
  { value: "slide-left", en: "Left", ar: "←" },
  { value: "scale", en: "Scale", ar: "تكبير" },
  { value: "blur", en: "Blur", ar: "ضبابي" },
];

const CONTAINER_OPTIONS = [
  { value: "default", en: "Default", ar: "افتراضي" },
  { value: "narrow", en: "Narrow", ar: "ضيق" },
  { value: "wide", en: "Wide", ar: "واسع" },
  { value: "full", en: "Full", ar: "كامل" },
];

const COVER_TYPE_OPTIONS = [
  { value: "none", en: "None", ar: "بدون" },
  { value: "background", en: "Background", ar: "خلفية" },
  { value: "banner", en: "Banner", ar: "بانر" },
];

interface SectionRowProps {
  section: HomepageSection;
  index: number;
  isOpen: boolean;
  isSelected?: boolean;
  onSelect?: () => void;
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

export const SectionRow = forwardRef<HTMLDivElement, SectionRowProps>(function SectionRow({
  section, index, isOpen, isSelected, onSelect, onToggle, onUpdate, onQuickToggle,
  onDuplicate, isPending, isAr, isDragging, dragHandleProps,
}, ref) {
  const [local, setLocal] = useState<Partial<HomepageSection>>({});
  const [jsonError, setJsonError] = useState<string | null>(null);
  const merged = { ...section, ...local };

  const set = <K extends keyof HomepageSection>(key: K, value: HomepageSection[K]) => {
    setLocal((prev) => ({ ...prev, [key]: value }));
  };

  const save = () => { onUpdate(local); setLocal({}); };
  const hasChanges = Object.keys(local).length > 0;

  const configSummary = [
    merged.display_style !== "grid" && merged.display_style,
    merged.source_type !== "auto" && merged.source_type,
    merged.card_template !== "default" && merged.card_template,
    merged.animation !== "none" && merged.animation,
    merged.cover_type !== "none" && (isAr ? "غلاف" : "cover"),
  ].filter(Boolean);

  return (
    <Collapsible ref={ref} open={isOpen} onOpenChange={onToggle}>
      <div
        className={cn(
          "rounded-xl border transition-all",
          isOpen ? "border-primary/30 bg-card shadow-sm" : "border-border/40 hover:border-border/70",
          !merged.is_visible && "opacity-40",
          isSelected && "ring-1 ring-primary/30",
          isDragging && "opacity-30 scale-95"
        )}
        draggable
        {...dragHandleProps}
      >
        {/* Compact header */}
        <div className="flex items-center gap-1 px-2 py-1.5">
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onSelect?.()}
            className="h-3 w-3 shrink-0"
            onClick={(e) => e.stopPropagation()}
          />
          <GripVertical className="h-3.5 w-3.5 text-muted-foreground/30 shrink-0 cursor-grab" />

          <button
            onClick={(e) => { e.stopPropagation(); onQuickToggle(!merged.is_visible); }}
            className="p-0.5 rounded hover:bg-muted/50 shrink-0"
          >
            {merged.is_visible
              ? <Eye className="h-3 w-3 text-primary" />
              : <EyeOff className="h-3 w-3 text-muted-foreground" />
            }
          </button>

          <CollapsibleTrigger asChild>
            <button className="flex flex-1 items-center gap-1.5 text-start min-w-0 py-0.5">
              <SectionIcon sectionKey={section.section_key} className="h-3.5 w-3.5 text-primary/60 shrink-0" />
              <span className="text-xs font-medium truncate flex-1">
                {isAr ? merged.title_ar : merged.title_en}
              </span>
              <span className="text-[9px] text-muted-foreground font-mono hidden sm:inline">{section.section_key}</span>

              {configSummary.length > 0 && (
                <div className="hidden sm:flex items-center gap-0.5">
                  {configSummary.slice(0, 3).map((c, i) => (
                    <Badge key={i} variant="outline" className="text-[7px] px-1 py-0 h-3.5">{c}</Badge>
                  ))}
                </div>
              )}

              <Badge variant="outline" className="text-[8px] font-mono px-1 py-0 h-3.5 bg-muted/40">
                #{index + 1}
              </Badge>
              <ChevronDown className={cn("h-3 w-3 text-muted-foreground transition-transform shrink-0", isOpen && "rotate-180")} />
            </button>
          </CollapsibleTrigger>
        </div>

        {/* Expanded editor */}
        <CollapsibleContent>
          <div className="border-t border-border/40">
            <Tabs defaultValue="data" className="w-full">
              <div className="px-2 pt-1.5">
                <TabsList className="h-7 w-full grid grid-cols-5 bg-muted/40 p-0.5">
                  <TabsTrigger value="data" className="text-[9px] gap-1 h-6 px-1">
                    <Database className="h-3 w-3" /> {isAr ? "المصدر" : "Data"}
                  </TabsTrigger>
                  <TabsTrigger value="layout" className="text-[9px] gap-1 h-6 px-1">
                    <LayoutGrid className="h-3 w-3" /> {isAr ? "التخطيط" : "Layout"}
                  </TabsTrigger>
                  <TabsTrigger value="card" className="text-[9px] gap-1 h-6 px-1">
                    <LayoutTemplate className="h-3 w-3" /> {isAr ? "البطاقة" : "Card"}
                  </TabsTrigger>
                  <TabsTrigger value="style" className="text-[9px] gap-1 h-6 px-1">
                    <Palette className="h-3 w-3" /> {isAr ? "المظهر" : "Style"}
                  </TabsTrigger>
                  <TabsTrigger value="advanced" className="text-[9px] gap-1 h-6 px-1">
                    <Settings2 className="h-3 w-3" /> {isAr ? "متقدم" : "More"}
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Data Source Tab */}
              <TabsContent value="data" className="px-2 py-3 space-y-3 mt-0">
                <div className="grid gap-2 grid-cols-2 sm:grid-cols-3">
                  <div className="space-y-1">
                    <Label className="text-[9px] text-muted-foreground">{isAr ? "نوع المصدر" : "Source Type"}</Label>
                    <Select value={merged.source_type} onValueChange={(v) => set("source_type", v as HomepageSection["source_type"])}>
                      <SelectTrigger className="h-7 text-[10px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {SOURCE_TYPE_OPTIONS.map(o => (
                          <SelectItem key={o.value} value={o.value} className="text-xs">{isAr ? o.ar : o.en}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[9px] text-muted-foreground">{isAr ? "جدول البيانات" : "Source Table"}</Label>
                    <Select value={merged.source_table || ""} onValueChange={(v) => set("source_table", v)}>
                      <SelectTrigger className="h-7 text-[10px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {SOURCE_TABLE_OPTIONS.map(o => (
                          <SelectItem key={o.value} value={o.value} className="text-xs">{isAr ? o.ar : o.en}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[9px] text-muted-foreground">{isAr ? "الترتيب" : "Sort By"}</Label>
                    <Select value={merged.source_sort_by || "created_at"} onValueChange={(v) => set("source_sort_by", v)}>
                      <SelectTrigger className="h-7 text-[10px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {SORT_BY_OPTIONS.map(o => (
                          <SelectItem key={o.value} value={o.value} className="text-xs">{isAr ? o.ar : o.en}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Label className="text-[9px] text-muted-foreground shrink-0">{isAr ? "الاتجاه" : "Direction"}</Label>
                  <div className="flex gap-1">
                    {(["desc", "asc"] as const).map(dir => (
                      <button
                        key={dir}
                        onClick={() => set("source_sort_dir", dir)}
                        className={cn(
                          "text-[9px] px-2 py-0.5 rounded-md border transition-colors",
                          merged.source_sort_dir === dir ? "border-primary bg-primary/10 text-primary" : "border-border/40 text-muted-foreground"
                        )}
                      >
                        {dir === "desc" ? (isAr ? "تنازلي" : "Newest") : (isAr ? "تصاعدي" : "Oldest")}
                      </button>
                    ))}
                  </div>
                </div>

                {merged.source_type === "query" && (
                  <div className="space-y-1">
                    <Label className="text-[9px] text-muted-foreground">{isAr ? "فلاتر مخصصة (JSON)" : "Filters (JSON)"}</Label>
                    <Textarea
                      value={JSON.stringify(merged.source_filters || {}, null, 2)}
                      onChange={(e) => {
                        try { set("source_filters", JSON.parse(e.target.value)); } catch { /* ignore */ }
                      }}
                      className="text-[10px] font-mono h-16 resize-none"
                      placeholder='{ "status": "published" }'
                    />
                  </div>
                )}

                <Separator className="my-1" />

                <div className="space-y-2">
                  <BilingualField
                    label="Title" labelAr="العنوان"
                    valueEn={merged.title_en} valueAr={merged.title_ar}
                    onChangeEn={(v) => set("title_en", v)} onChangeAr={(v) => set("title_ar", v)}
                  />
                  <BilingualField
                    label="Subtitle" labelAr="العنوان الفرعي"
                    valueEn={merged.subtitle_en || ""} valueAr={merged.subtitle_ar || ""}
                    onChangeEn={(v) => set("subtitle_en", v)} onChangeAr={(v) => set("subtitle_ar", v)}
                  />
                </div>
              </TabsContent>

              {/* Layout Tab */}
              <TabsContent value="layout" className="px-2 py-3 space-y-3 mt-0">
                {/* Display style selector */}
                <div className="space-y-1">
                  <Label className="text-[9px] text-muted-foreground">{isAr ? "أسلوب العرض" : "Display Style"}</Label>
                  <div className="flex gap-1">
                    {DISPLAY_STYLE_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => set("display_style", opt.value as HomepageSection["display_style"])}
                        className={cn(
                          "flex-1 rounded-lg border py-1.5 text-center transition-all text-[9px]",
                          merged.display_style === opt.value
                            ? "border-primary bg-primary/10 text-primary font-medium"
                            : "border-border/40 text-muted-foreground hover:border-primary/30"
                        )}
                      >
                        <span className="block text-sm leading-none mb-0.5">{opt.icon}</span>
                        {isAr ? opt.ar : opt.en}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid gap-2 grid-cols-4">
                  <div className="space-y-1">
                    <Label className="text-[9px] text-muted-foreground">{isAr ? "العدد" : "Items"}</Label>
                    <Input type="number" min={1} max={50} value={merged.item_count} onChange={(e) => set("item_count", parseInt(e.target.value) || 8)} className="text-[10px] h-7" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[9px] text-muted-foreground">{isAr ? "بالصف" : "Per Row"}</Label>
                    <Input type="number" min={1} max={8} value={merged.items_per_row} onChange={(e) => set("items_per_row", parseInt(e.target.value) || 4)} className="text-[10px] h-7" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[9px] text-muted-foreground">{isAr ? "الحجم" : "Size"}</Label>
                    <div className="flex gap-0.5">
                      {SIZE_OPTIONS.map(s => (
                        <button
                          key={s.value}
                          onClick={() => set("item_size", s.value as HomepageSection["item_size"])}
                          className={cn(
                            "flex-1 text-[9px] py-1 rounded-md border transition-colors",
                            merged.item_size === s.value ? "border-primary bg-primary/10 text-primary" : "border-border/40"
                          )}
                        >
                          {isAr ? s.ar : s.en}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[9px] text-muted-foreground">{isAr ? "موبايل" : "Mobile"}</Label>
                    <Input type="number" min={1} max={8} value={merged.max_items_mobile} onChange={(e) => set("max_items_mobile", parseInt(e.target.value) || 4)} className="text-[10px] h-7" />
                  </div>
                </div>

                <div className="grid gap-2 grid-cols-2">
                  <div className="space-y-1">
                    <Label className="text-[9px] text-muted-foreground">{isAr ? "التباعد" : "Spacing"}</Label>
                    <Select value={merged.spacing} onValueChange={(v) => set("spacing", v as HomepageSection["spacing"])}>
                      <SelectTrigger className="h-7 text-[10px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {SPACING_OPTIONS.map(o => <SelectItem key={o.value} value={o.value} className="text-xs">{isAr ? o.ar : o.en}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[9px] text-muted-foreground">{isAr ? "الحاوية" : "Container"}</Label>
                    <Select value={merged.container_width} onValueChange={(v) => set("container_width", v as HomepageSection["container_width"])}>
                      <SelectTrigger className="h-7 text-[10px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CONTAINER_OPTIONS.map(o => <SelectItem key={o.value} value={o.value} className="text-xs">{isAr ? o.ar : o.en}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Toggles row */}
                <div className="flex flex-wrap gap-3">
                  {([
                    ["show_title", isAr ? "العنوان" : "Title"],
                    ["show_subtitle", isAr ? "الفرعي" : "Subtitle"],
                    ["show_description", isAr ? "الوصف" : "Desc"],
                    ["show_filters", isAr ? "الفلاتر" : "Filters"],
                    ["show_view_all", isAr ? "عرض الكل" : "View All"],
                  ] as const).map(([key, label]) => (
                    <div key={key} className="flex items-center gap-1">
                      <Switch
                        checked={merged[key] as boolean}
                        onCheckedChange={(v) => set(key, v)}
                        className="scale-75"
                      />
                      <span className="text-[9px] text-muted-foreground">{label}</span>
                    </div>
                  ))}
                </div>
              </TabsContent>

              {/* Card Template Tab */}
              <TabsContent value="card" className="px-2 py-3 space-y-3 mt-0">
                <div className="space-y-1">
                  <Label className="text-[9px] text-muted-foreground">{isAr ? "قالب البطاقة" : "Card Template"}</Label>
                  <div className="grid grid-cols-5 gap-1">
                    {CARD_TEMPLATE_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => set("card_template", opt.value as HomepageSection["card_template"])}
                        className={cn(
                          "rounded-lg border py-2 text-center transition-all",
                          merged.card_template === opt.value
                            ? "border-primary bg-primary/10"
                            : "border-border/40 hover:border-primary/30"
                        )}
                      >
                        <span className="text-[9px] font-medium block">{isAr ? opt.ar : opt.en}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Cover settings */}
                <div className="grid gap-2 grid-cols-2">
                  <div className="space-y-1">
                    <Label className="text-[9px] text-muted-foreground">{isAr ? "الغلاف" : "Cover"}</Label>
                    <Select value={merged.cover_type} onValueChange={(v) => set("cover_type", v as HomepageSection["cover_type"])}>
                      <SelectTrigger className="h-7 text-[10px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {COVER_TYPE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value} className="text-xs">{isAr ? o.ar : o.en}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  {merged.cover_type !== "none" && (
                    <div className="space-y-1">
                      <Label className="text-[9px] text-muted-foreground">{isAr ? "رابط الصورة" : "Image URL"}</Label>
                      <Input
                        value={merged.cover_image_url || ""}
                        onChange={(e) => set("cover_image_url", e.target.value)}
                        placeholder="https://..."
                        className="text-[10px] h-7 font-mono"
                      />
                    </div>
                  )}
                </div>

                {merged.cover_type !== "none" && (
                  <div className="grid gap-2 grid-cols-2">
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <Label className="text-[9px] text-muted-foreground">{isAr ? "الارتفاع" : "Height"}</Label>
                        <span className="text-[8px] font-mono text-muted-foreground">{merged.cover_height}px</span>
                      </div>
                      <Slider value={[merged.cover_height]} onValueChange={([v]) => set("cover_height", v)} min={100} max={500} step={10} />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <Label className="text-[9px] text-muted-foreground">{isAr ? "التراكب" : "Overlay"}</Label>
                        <span className="text-[8px] font-mono text-muted-foreground">{merged.cover_overlay_opacity}%</span>
                      </div>
                      <Slider value={[merged.cover_overlay_opacity]} onValueChange={([v]) => set("cover_overlay_opacity", v)} min={0} max={100} step={5} />
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* Style Tab */}
              <TabsContent value="style" className="px-2 py-3 space-y-3 mt-0">
                <div className="space-y-1">
                  <Label className="text-[9px] text-muted-foreground">{isAr ? "الحركة" : "Animation"}</Label>
                  <div className="flex gap-0.5">
                    {ANIMATION_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => set("animation", opt.value as HomepageSection["animation"])}
                        className={cn(
                          "flex-1 rounded-md border py-1 text-[8px] transition-colors",
                          merged.animation === opt.value
                            ? "border-primary bg-primary/10 text-primary font-medium"
                            : "border-border/40 text-muted-foreground"
                        )}
                      >
                        {isAr ? opt.ar : opt.en}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-[9px] text-muted-foreground">{isAr ? "لون الخلفية" : "Background"}</Label>
                  <div className="flex items-center gap-1.5">
                    <Input type="color" value={merged.bg_color || "#ffffff"} onChange={(e) => set("bg_color", e.target.value)} className="h-7 w-9 p-0.5 cursor-pointer" />
                    <Input value={merged.bg_color || ""} onChange={(e) => set("bg_color", e.target.value)} placeholder="#f5f5f5" className="text-[10px] h-7 font-mono flex-1" />
                    {merged.bg_color && <Button size="sm" variant="ghost" className="h-7 text-[9px] px-1.5" onClick={() => set("bg_color", "")}>✕</Button>}
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-[9px] text-muted-foreground">{isAr ? "فئة CSS" : "CSS Class"}</Label>
                  <Input value={merged.css_class || ""} onChange={(e) => set("css_class", e.target.value)} placeholder="custom-class" className="text-[10px] h-7 font-mono" />
                </div>
              </TabsContent>

              {/* Advanced Tab */}
              <TabsContent value="advanced" className="px-2 py-3 space-y-3 mt-0">
                <BilingualField
                  label="Description" labelAr="الوصف"
                  valueEn={merged.description_en || ""} valueAr={merged.description_ar || ""}
                  onChangeEn={(v) => set("description_en", v)} onChangeAr={(v) => set("description_ar", v)}
                  multiline rows={2}
                />

                <div className="space-y-1">
                  <Label className="text-[9px] text-muted-foreground">{isAr ? "تكوين مخصص (JSON)" : "Custom Config"}</Label>
                  <Textarea
                    value={JSON.stringify(merged.custom_config || {}, null, 2)}
                    onChange={(e) => {
                      try { set("custom_config", JSON.parse(e.target.value)); setJsonError(null); }
                      catch { setJsonError("Invalid JSON"); }
                    }}
                    className="text-[10px] font-mono h-20 resize-none"
                  />
                  {jsonError && <p className="text-[9px] text-destructive">{jsonError}</p>}
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {onDuplicate && (
                    <Button size="sm" variant="outline" className="h-6 text-[9px] gap-1 px-2" onClick={() => onDuplicate(section)}>
                      <Copy className="h-2.5 w-2.5" /> {isAr ? "تكرار" : "Duplicate"}
                    </Button>
                  )}
                  <Button size="sm" variant="outline" className="h-6 text-[9px] gap-1 px-2" onClick={() => {
                    setLocal({ animation: "fade", spacing: "normal", container_width: "default", bg_color: "", css_class: "", cover_type: "none" });
                  }}>
                    <RotateCcw className="h-2.5 w-2.5" /> {isAr ? "إعادة تعيين" : "Reset"}
                  </Button>
                  <Button size="sm" variant="outline" className="h-6 text-[9px] gap-1 px-2" asChild>
                    <a href={`/#${section.section_key}`} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-2.5 w-2.5" /> {isAr ? "معاينة" : "Preview"}
                    </a>
                  </Button>
                </div>

                <div className="rounded-lg bg-muted/30 p-2 grid grid-cols-2 gap-x-3 gap-y-0.5 text-[9px] text-muted-foreground">
                  <span>Key:</span><span className="font-mono">{section.section_key}</span>
                  <span>Sort:</span><span>{section.sort_order}</span>
                  <span>{isAr ? "تحديث" : "Updated"}:</span>
                  <span className="flex items-center gap-0.5">
                    <Clock className="h-2 w-2" />
                    {new Date(section.updated_at).toLocaleDateString(isAr ? "ar" : "en", { month: "short", day: "numeric" })}
                  </span>
                </div>
              </TabsContent>
            </Tabs>

            {/* Save footer */}
            {hasChanges && (
              <div className="px-2 pb-2 flex items-center gap-1.5">
                <Button size="sm" className="gap-1 h-7 text-[10px]" onClick={save} disabled={isPending}>
                  {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                  {isAr ? "حفظ" : "Save"}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => { setLocal({}); setJsonError(null); }} className="text-[10px] h-7">
                  {isAr ? "إلغاء" : "Cancel"}
                </Button>
                <Badge variant="secondary" className="text-[8px] ms-auto">{Object.keys(local).length} {isAr ? "تغيير" : "changes"}</Badge>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
});
