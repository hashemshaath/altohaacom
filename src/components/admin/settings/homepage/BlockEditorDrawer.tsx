import { useState, useEffect } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  Database, LayoutGrid, Paintbrush, SlidersHorizontal, Eye, Save,
  ChevronRight, Image, Type, Sparkles, Settings2, CreditCard,
} from "lucide-react";
import {
  type HomepageBlock,
  DATA_SOURCES,
  SORT_OPTIONS,
  DISPLAY_STYLES,
  CARD_TEMPLATES,
} from "@/hooks/useHomepageBlocks";

interface Props {
  block: HomepageBlock | null;
  open: boolean;
  onClose: () => void;
  onSave: (updates: Partial<HomepageBlock>) => void;
  isPending?: boolean;
}

const defaultBlock: Partial<HomepageBlock> = {
  title_en: "", title_ar: "", subtitle_en: "", subtitle_ar: "",
  description_en: "", description_ar: "",
  is_visible: true, data_source: "chefs", data_limit: 8,
  data_filter: { sort_by: "latest" },
  display_style: "grid",
  items_per_row: 4, items_per_row_tablet: 2, items_per_row_mobile: 1,
  row_count: 2, grid_gap: "md",
  carousel_autoplay: false, carousel_speed: 3000, carousel_direction: "ltr",
  carousel_loop: true, carousel_arrows: true, carousel_dots: true, carousel_peek: false,
  cover_image_url: "", cover_position: "none", cover_height: 300,
  cover_overlay_opacity: 0.4, cover_text_align: "center",
  card_template: "standard", card_image_ratio: "4:3", card_image_position: "top",
  card_show_avatar: true, card_show_badge: true, card_show_rating: false,
  card_show_description: true, card_show_cta: false,
  card_cta_text_en: "View", card_cta_text_ar: "عرض",
  item_height: "auto",
  bg_color: "", bg_gradient: "", text_color: "",
  section_padding: "md", container_width: "default", border_style: "none",
  animation: "none", animation_delay: 0,
  show_section_header: true, show_view_all: true, view_all_link: "",
  show_filters: false, filter_options: [],
  custom_css: "",
};

export function BlockEditorDrawer({ block, open, onClose, onSave, isPending }: Props) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [form, setForm] = useState<Partial<HomepageBlock>>(defaultBlock);
  const [tab, setTab] = useState("data");

  useEffect(() => {
    if (block) setForm({ ...defaultBlock, ...block });
    else setForm(defaultBlock);
    setTab("data");
  }, [block, open]);

  const set = <K extends keyof HomepageBlock>(key: K, val: HomepageBlock[K]) =>
    setForm((p) => ({ ...p, [key]: val }));

  const setFilter = (key: string, val: any) =>
    setForm((p) => ({ ...p, data_filter: { ...(p.data_filter || {}), [key]: val } }));

  const handleSave = () => {
    const { id, created_at, updated_at, ...rest } = form as any;
    onSave(rest);
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-[540px] p-0 flex flex-col">
        <SheetHeader className="p-4 pb-2 border-b">
          <SheetTitle className="text-base">
            {block ? (isAr ? "تعديل البلوك" : "Edit Block") : (isAr ? "بلوك جديد" : "New Block")}
          </SheetTitle>
          <SheetDescription className="text-xs">
            {isAr ? "تحكم شامل في مصدر البيانات والعرض والتصميم" : "Full control over data source, display, and design"}
          </SheetDescription>
        </SheetHeader>

        <Tabs value={tab} onValueChange={setTab} className="flex-1 flex flex-col min-h-0">
          <TabsList className="mx-4 mt-2 grid grid-cols-5 h-9">
            <TabsTrigger value="data" className="text-xs gap-1"><Database className="h-3 w-3" />{isAr ? "بيانات" : "Data"}</TabsTrigger>
            <TabsTrigger value="layout" className="text-xs gap-1"><LayoutGrid className="h-3 w-3" />{isAr ? "تخطيط" : "Layout"}</TabsTrigger>
            <TabsTrigger value="card" className="text-xs gap-1"><CreditCard className="h-3 w-3" />{isAr ? "بطاقة" : "Card"}</TabsTrigger>
            <TabsTrigger value="style" className="text-xs gap-1"><Paintbrush className="h-3 w-3" />{isAr ? "تصميم" : "Style"}</TabsTrigger>
            <TabsTrigger value="advanced" className="text-xs gap-1"><Settings2 className="h-3 w-3" />{isAr ? "متقدم" : "Advanced"}</TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 px-4 py-3">
            {/* ── DATA TAB ── */}
            <TabsContent value="data" className="mt-0 space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold">{isAr ? "عنوان القسم" : "Section Title"}</Label>
                <Input placeholder="English title" value={form.title_en || ""} onChange={(e) => set("title_en", e.target.value)} className="h-8 text-sm" />
                <Input placeholder="العنوان بالعربي" value={form.title_ar || ""} onChange={(e) => set("title_ar", e.target.value)} className="h-8 text-sm" dir="rtl" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold">{isAr ? "العنوان الفرعي" : "Subtitle"}</Label>
                <Input placeholder="Subtitle EN" value={form.subtitle_en || ""} onChange={(e) => set("subtitle_en", e.target.value)} className="h-8 text-sm" />
                <Input placeholder="العنوان الفرعي" value={form.subtitle_ar || ""} onChange={(e) => set("subtitle_ar", e.target.value)} className="h-8 text-sm" dir="rtl" />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label className="text-xs font-semibold">{isAr ? "مصدر البيانات" : "Data Source"}</Label>
                <div className="grid grid-cols-3 gap-2">
                  {DATA_SOURCES.map((ds) => (
                    <button
                      key={ds.value}
                      onClick={() => set("data_source", ds.value)}
                      className={cn(
                        "flex flex-col items-center gap-1 rounded-xl border-2 p-2.5 text-center transition-all",
                        form.data_source === ds.value
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/30"
                      )}
                    >
                      <span className="text-lg">{ds.icon}</span>
                      <span className="text-[10px] font-medium">{isAr ? ds.labelAr : ds.labelEn}</span>
                    </button>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label className="text-xs font-semibold">{isAr ? "ترتيب / فلترة" : "Sort / Filter"}</Label>
                <Select value={(form.data_filter as any)?.sort_by || "latest"} onValueChange={(v) => setFilter("sort_by", v)}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SORT_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{isAr ? o.labelAr : o.labelEn}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">{isAr ? "عدد العناصر" : "Item Count"}</Label>
                  <Input type="number" min={1} max={50} value={form.data_limit || 8} onChange={(e) => set("data_limit", +e.target.value)} className="h-8 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{isAr ? "مميز فقط" : "Featured Only"}</Label>
                  <div className="flex items-center gap-2 h-8">
                    <Switch checked={(form.data_filter as any)?.is_featured || false} onCheckedChange={(v) => setFilter("is_featured", v)} />
                    <span className="text-xs text-muted-foreground">{(form.data_filter as any)?.is_featured ? (isAr ? "نعم" : "Yes") : (isAr ? "لا" : "No")}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between py-1">
                <Label className="text-xs">{isAr ? "ظاهر" : "Visible"}</Label>
                <Switch checked={form.is_visible !== false} onCheckedChange={(v) => set("is_visible", v)} />
              </div>
            </TabsContent>

            {/* ── LAYOUT TAB ── */}
            <TabsContent value="layout" className="mt-0 space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold">{isAr ? "نمط العرض" : "Display Style"}</Label>
                <div className="grid grid-cols-3 gap-2">
                  {DISPLAY_STYLES.map((ds) => (
                    <button
                      key={ds.value}
                      onClick={() => set("display_style", ds.value)}
                      className={cn(
                        "flex flex-col items-center gap-1 rounded-xl border-2 p-3 transition-all",
                        form.display_style === ds.value
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/30"
                      )}
                    >
                      <span className="text-xl">{ds.icon}</span>
                      <span className="text-[10px] font-medium">{isAr ? ds.labelAr : ds.labelEn}</span>
                    </button>
                  ))}
                </div>
              </div>

              <Separator />

              {(form.display_style === "grid" || form.display_style === "masonry") && (
                <div className="space-y-3">
                  <Label className="text-xs font-semibold">{isAr ? "إعدادات الشبكة" : "Grid Settings"}</Label>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[10px]">{isAr ? "سطح مكتب" : "Desktop"}</Label>
                      <Select value={String(form.items_per_row || 4)} onValueChange={(v) => set("items_per_row", +v)}>
                        <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>{[1,2,3,4,5,6].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px]">{isAr ? "تابلت" : "Tablet"}</Label>
                      <Select value={String(form.items_per_row_tablet || 2)} onValueChange={(v) => set("items_per_row_tablet", +v)}>
                        <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>{[1,2,3,4].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px]">{isAr ? "موبايل" : "Mobile"}</Label>
                      <Select value={String(form.items_per_row_mobile || 1)} onValueChange={(v) => set("items_per_row_mobile", +v)}>
                        <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>{[1,2,3].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[10px]">{isAr ? "عدد الصفوف" : "Rows"}</Label>
                      <Select value={String(form.row_count || 2)} onValueChange={(v) => set("row_count", +v)}>
                        <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>{[1,2,3,4,5].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px]">{isAr ? "المسافة" : "Gap"}</Label>
                      <Select value={form.grid_gap || "md"} onValueChange={(v) => set("grid_gap", v)}>
                        <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {["xs","sm","md","lg","xl"].map(g => <SelectItem key={g} value={g}>{g.toUpperCase()}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              {form.display_style === "carousel" && (
                <div className="space-y-3">
                  <Label className="text-xs font-semibold">{isAr ? "إعدادات العرض الدائري" : "Carousel Settings"}</Label>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">{isAr ? "تشغيل تلقائي" : "Autoplay"}</Label>
                      <Switch checked={form.carousel_autoplay} onCheckedChange={(v) => set("carousel_autoplay", v)} />
                    </div>
                    {form.carousel_autoplay && (
                      <div className="space-y-1">
                        <Label className="text-[10px]">{isAr ? "السرعة (ملي ثانية)" : "Speed (ms)"}</Label>
                        <Slider min={1000} max={10000} step={500} value={[form.carousel_speed || 3000]} onValueChange={([v]) => set("carousel_speed", v)} />
                        <span className="text-[10px] text-muted-foreground">{form.carousel_speed}ms</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">{isAr ? "اتجاه" : "Direction"}</Label>
                      <Select value={form.carousel_direction || "ltr"} onValueChange={(v) => set("carousel_direction", v)}>
                        <SelectTrigger className="h-8 w-24 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ltr">LTR →</SelectItem>
                          <SelectItem value="rtl">RTL ←</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">{isAr ? "تكرار" : "Loop"}</Label>
                      <Switch checked={form.carousel_loop !== false} onCheckedChange={(v) => set("carousel_loop", v)} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">{isAr ? "أسهم التنقل" : "Arrows"}</Label>
                      <Switch checked={form.carousel_arrows !== false} onCheckedChange={(v) => set("carousel_arrows", v)} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">{isAr ? "نقاط" : "Dots"}</Label>
                      <Switch checked={form.carousel_dots !== false} onCheckedChange={(v) => set("carousel_dots", v)} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">{isAr ? "إظهار جزئي" : "Peek (partial next)"}</Label>
                      <Switch checked={form.carousel_peek} onCheckedChange={(v) => set("carousel_peek", v)} />
                    </div>
                  </div>
                </div>
              )}

              {(form.display_style === "cover_banner" || form.display_style === "featured_list") && (
                <div className="space-y-3">
                  <Label className="text-xs font-semibold">{isAr ? "إعدادات الغلاف" : "Cover Settings"}</Label>
                  <div className="space-y-1">
                    <Label className="text-[10px]">{isAr ? "رابط الصورة" : "Image URL"}</Label>
                    <Input value={form.cover_image_url || ""} onChange={(e) => set("cover_image_url", e.target.value)} className="h-8 text-sm" placeholder="https://..." />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[10px]">{isAr ? "موضع الغلاف" : "Cover Position"}</Label>
                      <Select value={form.cover_position || "top"} onValueChange={(v) => set("cover_position", v)}>
                        <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {["top","left","right","background","none"].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px]">{isAr ? "محاذاة النص" : "Text Align"}</Label>
                      <Select value={form.cover_text_align || "center"} onValueChange={(v) => set("cover_text_align", v)}>
                        <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {["left","center","right"].map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px]">{isAr ? "ارتفاع الغلاف" : "Cover Height"}: {form.cover_height}px</Label>
                    <Slider min={100} max={600} step={10} value={[form.cover_height || 300]} onValueChange={([v]) => set("cover_height", v)} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px]">{isAr ? "شفافية التراكب" : "Overlay Opacity"}: {Math.round((form.cover_overlay_opacity || 0) * 100)}%</Label>
                    <Slider min={0} max={1} step={0.05} value={[form.cover_overlay_opacity || 0.4]} onValueChange={([v]) => set("cover_overlay_opacity", v)} />
                  </div>
                </div>
              )}
            </TabsContent>

            {/* ── CARD TAB ── */}
            <TabsContent value="card" className="mt-0 space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold">{isAr ? "قالب البطاقة" : "Card Template"}</Label>
                <div className="grid grid-cols-3 gap-2">
                  {CARD_TEMPLATES.map((ct) => (
                    <button
                      key={ct.value}
                      onClick={() => set("card_template", ct.value)}
                      className={cn(
                        "flex flex-col items-start gap-1 rounded-xl border-2 p-2.5 text-start transition-all",
                        form.card_template === ct.value
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/30"
                      )}
                    >
                      <span className="text-xs font-semibold">{isAr ? ct.labelAr : ct.labelEn}</span>
                      <span className="text-[9px] text-muted-foreground">{ct.descEn}</span>
                    </button>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[10px]">{isAr ? "نسبة الصورة" : "Image Ratio"}</Label>
                  <Select value={form.card_image_ratio || "4:3"} onValueChange={(v) => set("card_image_ratio", v)}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["1:1","4:3","16:9","3:4","2:3","auto"].map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px]">{isAr ? "موضع الصورة" : "Image Position"}</Label>
                  <Select value={form.card_image_position || "top"} onValueChange={(v) => set("card_image_position", v)}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["top","left","right","background"].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-[10px]">{isAr ? "ارتفاع العنصر" : "Item Height"}</Label>
                <Select value={form.item_height || "auto"} onValueChange={(v) => set("item_height", v)}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["auto","sm","md","lg","xl","custom"].map(h => <SelectItem key={h} value={h}>{h === "auto" ? "Auto" : h === "custom" ? (isAr ? "مخصص" : "Custom") : h.toUpperCase()}</SelectItem>)}
                  </SelectContent>
                </Select>
                {form.item_height === "custom" && (
                  <Input type="number" min={100} max={800} value={form.item_height_custom || 280} onChange={(e) => set("item_height_custom", +e.target.value)} className="h-8 text-sm mt-1" placeholder="280" />
                )}
              </div>

              <Separator />

              <div className="space-y-2">
                <Label className="text-xs font-semibold">{isAr ? "عناصر البطاقة" : "Card Elements"}</Label>
                {[
                  { key: "card_show_avatar" as const, en: "Avatar", ar: "الصورة الشخصية" },
                  { key: "card_show_badge" as const, en: "Badge", ar: "الشارة" },
                  { key: "card_show_rating" as const, en: "Rating", ar: "التقييم" },
                  { key: "card_show_description" as const, en: "Description", ar: "الوصف" },
                  { key: "card_show_cta" as const, en: "CTA Button", ar: "زر الإجراء" },
                ].map(({ key, en, ar }) => (
                  <div key={key} className="flex items-center justify-between py-0.5">
                    <Label className="text-xs">{isAr ? ar : en}</Label>
                    <Switch checked={form[key] as boolean} onCheckedChange={(v) => set(key, v)} />
                  </div>
                ))}
                {form.card_show_cta && (
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <Input placeholder="CTA EN" value={form.card_cta_text_en || ""} onChange={(e) => set("card_cta_text_en", e.target.value)} className="h-7 text-xs" />
                    <Input placeholder="CTA AR" value={form.card_cta_text_ar || ""} onChange={(e) => set("card_cta_text_ar", e.target.value)} className="h-7 text-xs" dir="rtl" />
                  </div>
                )}
              </div>
            </TabsContent>

            {/* ── STYLE TAB ── */}
            <TabsContent value="style" className="mt-0 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[10px]">{isAr ? "تباعد القسم" : "Section Padding"}</Label>
                  <Select value={form.section_padding || "md"} onValueChange={(v) => set("section_padding", v)}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["none","sm","md","lg","xl"].map(p => <SelectItem key={p} value={p}>{p.toUpperCase()}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px]">{isAr ? "عرض الحاوية" : "Container Width"}</Label>
                  <Select value={form.container_width || "default"} onValueChange={(v) => set("container_width", v)}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["narrow","default","wide","full"].map(w => <SelectItem key={w} value={w}>{w}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-[10px]">{isAr ? "لون الخلفية" : "BG Color"}</Label>
                  <Input value={form.bg_color || ""} onChange={(e) => set("bg_color", e.target.value)} className="h-8 text-xs" placeholder="#f5f5f5" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px]">{isAr ? "لون النص" : "Text Color"}</Label>
                  <Input value={form.text_color || ""} onChange={(e) => set("text_color", e.target.value)} className="h-8 text-xs" placeholder="#000" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px]">{isAr ? "حدود" : "Border"}</Label>
                  <Select value={form.border_style || "none"} onValueChange={(v) => set("border_style", v)}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["none","top","bottom","both","card"].map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-[10px]">{isAr ? "تدرج لوني" : "BG Gradient"}</Label>
                <Input value={form.bg_gradient || ""} onChange={(e) => set("bg_gradient", e.target.value)} className="h-8 text-xs" placeholder="linear-gradient(135deg, #1a1a2e, #16213e)" />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label className="text-xs font-semibold">{isAr ? "الحركة" : "Animation"}</Label>
                <Select value={form.animation || "none"} onValueChange={(v) => set("animation", v)}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["none","fade","slide-up","slide-left","scale","blur","stagger"].map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                  </SelectContent>
                </Select>
                {form.animation !== "none" && (
                  <div className="space-y-1">
                    <Label className="text-[10px]">{isAr ? "تأخير (ملي ثانية)" : "Delay (ms)"}: {form.animation_delay || 0}</Label>
                    <Slider min={0} max={2000} step={100} value={[form.animation_delay || 0]} onValueChange={([v]) => set("animation_delay", v)} />
                  </div>
                )}
              </div>

              <Separator />

              <div className="space-y-2">
                <Label className="text-xs font-semibold">{isAr ? "رأس وتذييل القسم" : "Section Header & Footer"}</Label>
                <div className="flex items-center justify-between">
                  <Label className="text-xs">{isAr ? "إظهار العنوان" : "Show Header"}</Label>
                  <Switch checked={form.show_section_header !== false} onCheckedChange={(v) => set("show_section_header", v)} />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-xs">{isAr ? "زر عرض الكل" : "View All Button"}</Label>
                  <Switch checked={form.show_view_all !== false} onCheckedChange={(v) => set("show_view_all", v)} />
                </div>
                {form.show_view_all && (
                  <Input value={form.view_all_link || ""} onChange={(e) => set("view_all_link", e.target.value)} className="h-8 text-xs" placeholder="/chefs" />
                )}
                <div className="flex items-center justify-between">
                  <Label className="text-xs">{isAr ? "إظهار الفلاتر" : "Show Filters"}</Label>
                  <Switch checked={form.show_filters} onCheckedChange={(v) => set("show_filters", v)} />
                </div>
              </div>
            </TabsContent>

            {/* ── ADVANCED TAB ── */}
            <TabsContent value="advanced" className="mt-0 space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold">{isAr ? "CSS مخصص" : "Custom CSS"}</Label>
                <Textarea
                  value={form.custom_css || ""}
                  onChange={(e) => set("custom_css", e.target.value)}
                  className="min-h-[100px] text-xs font-mono"
                  placeholder=".section { /* ... */ }"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold">{isAr ? "الوصف" : "Description"}</Label>
                <Input placeholder="Description EN" value={form.description_en || ""} onChange={(e) => set("description_en", e.target.value)} className="h-8 text-sm" />
                <Input placeholder="الوصف بالعربي" value={form.description_ar || ""} onChange={(e) => set("description_ar", e.target.value)} className="h-8 text-sm" dir="rtl" />
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        {/* Footer */}
        <div className="border-t p-4 flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>{isAr ? "إلغاء" : "Cancel"}</Button>
          <Button size="sm" onClick={handleSave} disabled={isPending} className="gap-1.5">
            <Save className="h-3.5 w-3.5" />
            {isPending ? (isAr ? "جاري الحفظ..." : "Saving...") : (isAr ? "حفظ" : "Save")}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
