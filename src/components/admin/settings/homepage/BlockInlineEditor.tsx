import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Database, LayoutGrid, Paintbrush, Settings2, CreditCard,
  Save, Loader2, Languages, Wand2, RotateCcw,
} from "lucide-react";
import {
  type HomepageBlock,
  DATA_SOURCES,
  SORT_OPTIONS,
  DISPLAY_STYLES,
  CARD_TEMPLATES,
} from "@/hooks/useHomepageBlocks";
import { BilingualField } from "./BilingualField";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  block: HomepageBlock | null;
  onSave: (updates: Partial<HomepageBlock>) => void;
  onCancel: () => void;
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

export function BlockInlineEditor({ block, onSave, onCancel, isPending }: Props) {
  const [form, setForm] = useState<Partial<HomepageBlock>>(defaultBlock);
  const [tab, setTab] = useState("data");
  const [translatingAll, setTranslatingAll] = useState(false);

  useEffect(() => {
    if (block) setForm({ ...defaultBlock, ...block });
    else setForm(defaultBlock);
    setTab("data");
  }, [block]);

  const set = <K extends keyof HomepageBlock>(key: K, val: HomepageBlock[K]) =>
    setForm((p) => ({ ...p, [key]: val }));

  const setFilter = (key: string, val: any) =>
    setForm((p) => ({ ...p, data_filter: { ...(p.data_filter || {}), [key]: val } }));

  const handleSave = () => {
    const { id, created_at, updated_at, ...rest } = form as any;
    onSave(rest);
  };

  const handleTranslateAll = async (from: "en" | "ar") => {
    const fields = from === "en"
      ? [
          { src: form.title_en, target: "title_ar" },
          { src: form.subtitle_en, target: "subtitle_ar" },
          { src: form.description_en, target: "description_ar" },
          { src: form.card_cta_text_en, target: "card_cta_text_ar" },
        ]
      : [
          { src: form.title_ar, target: "title_en" },
          { src: form.subtitle_ar, target: "subtitle_en" },
          { src: form.description_ar, target: "description_en" },
          { src: form.card_cta_text_ar, target: "card_cta_text_en" },
        ];

    const toTranslate = fields.filter((f) => f.src?.trim());
    if (!toTranslate.length) return;

    setTranslatingAll(true);
    const to = from === "en" ? "ar" : "en";
    let count = 0;

    for (const field of toTranslate) {
      try {
        const { data, error } = await supabase.functions.invoke("smart-translate", {
          body: { text: field.src, from, to, context: "culinary platform homepage section" },
        });
        if (!error && data?.translated) {
          setForm((p) => ({ ...p, [field.target]: data.translated }));
          count++;
        }
      } catch {}
    }

    setTranslatingAll(false);
    if (count > 0) toast.success(`✓ ${count} ${from === "en" ? "fields translated to Arabic" : "حقول مترجمة للإنجليزية"}`);
  };

  const handleReset = () => {
    if (block) setForm({ ...defaultBlock, ...block });
    else setForm(defaultBlock);
  };

  return (
    <Card className="border-primary/30 shadow-lg animate-in fade-in slide-in-from-top-2 duration-300">
      <CardContent className="p-0">
        {/* Header bar */}
        <div className="flex items-center justify-between gap-3 border-b bg-muted/30 px-4 py-3 rounded-t-xl">
          <h3 className="text-sm font-bold">
            {block ? "✏️ Edit Block" : "➕ New Block"}
          </h3>
          <div className="flex items-center gap-2">
            <Button
              variant="outline" size="sm"
              className="h-7 text-xs gap-1"
              onClick={() => handleTranslateAll("en")}
              disabled={translatingAll}
            >
              {translatingAll ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wand2 className="h-3 w-3" />}
              Translate All EN→AR
            </Button>
            <Button
              variant="outline" size="sm"
              className="h-7 text-xs gap-1"
              onClick={() => handleTranslateAll("ar")}
              disabled={translatingAll}
            >
              {translatingAll ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wand2 className="h-3 w-3" />}
              ترجمة الكل AR→EN
            </Button>
          </div>
        </div>

        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="mx-4 mt-3 grid grid-cols-5 h-9">
            <TabsTrigger value="data" className="text-xs gap-1"><Database className="h-3 w-3" />Data</TabsTrigger>
            <TabsTrigger value="layout" className="text-xs gap-1"><LayoutGrid className="h-3 w-3" />Layout</TabsTrigger>
            <TabsTrigger value="card" className="text-xs gap-1"><CreditCard className="h-3 w-3" />Card</TabsTrigger>
            <TabsTrigger value="style" className="text-xs gap-1"><Paintbrush className="h-3 w-3" />Style</TabsTrigger>
            <TabsTrigger value="advanced" className="text-xs gap-1"><Settings2 className="h-3 w-3" />Advanced</TabsTrigger>
          </TabsList>

          <div className="p-4 space-y-4 max-h-[600px] overflow-y-auto">
            {/* ── DATA TAB ── */}
            <TabsContent value="data" className="mt-0 space-y-4">
              <BilingualField
                label="Section Title" labelAr="عنوان القسم"
                valueEn={form.title_en || ""} valueAr={form.title_ar || ""}
                onChangeEn={(v) => set("title_en", v)} onChangeAr={(v) => set("title_ar", v)}
              />
              <BilingualField
                label="Subtitle" labelAr="العنوان الفرعي"
                valueEn={form.subtitle_en || ""} valueAr={form.subtitle_ar || ""}
                onChangeEn={(v) => set("subtitle_en", v)} onChangeAr={(v) => set("subtitle_ar", v)}
              />

              <Separator />

              <div className="space-y-2">
                <Label className="text-xs font-semibold">Data Source / مصدر البيانات</Label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {DATA_SOURCES.map((ds) => (
                    <button
                      key={ds.value}
                      onClick={() => set("data_source", ds.value)}
                      className={cn(
                        "flex flex-col items-center gap-1 rounded-xl border-2 p-2 text-center transition-all",
                        form.data_source === ds.value
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-border hover:border-primary/30"
                      )}
                    >
                      <span className="text-base">{ds.icon}</span>
                      <span className="text-[10px] font-medium leading-tight">{ds.labelEn}</span>
                    </button>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Sort / Filter</Label>
                  <Select value={(form.data_filter as any)?.sort_by || "latest"} onValueChange={(v) => setFilter("sort_by", v)}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SORT_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>{o.labelEn}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Item Count</Label>
                  <Input type="number" min={1} max={50} value={form.data_limit || 8} onChange={(e) => set("data_limit", +e.target.value)} className="h-8 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Featured Only</Label>
                  <div className="flex items-center gap-2 h-8">
                    <Switch checked={(form.data_filter as any)?.is_featured || false} onCheckedChange={(v) => setFilter("is_featured", v)} />
                    <span className="text-xs text-muted-foreground">{(form.data_filter as any)?.is_featured ? "Yes" : "No"}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/20 px-3 py-2">
                <Label className="text-xs font-medium">Visible on Homepage</Label>
                <Switch checked={form.is_visible !== false} onCheckedChange={(v) => set("is_visible", v)} />
              </div>
            </TabsContent>

            {/* ── LAYOUT TAB ── */}
            <TabsContent value="layout" className="mt-0 space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Display Style / نمط العرض</Label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {DISPLAY_STYLES.map((ds) => (
                    <button
                      key={ds.value}
                      onClick={() => set("display_style", ds.value)}
                      className={cn(
                        "flex flex-col items-center gap-1 rounded-xl border-2 p-2.5 transition-all",
                        form.display_style === ds.value
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-border hover:border-primary/30"
                      )}
                    >
                      <span className="text-lg">{ds.icon}</span>
                      <span className="text-[10px] font-medium">{ds.labelEn}</span>
                    </button>
                  ))}
                </div>
              </div>

              <Separator />

              {(form.display_style === "grid" || form.display_style === "masonry") && (
                <div className="space-y-3 rounded-lg border border-border/50 bg-muted/20 p-3">
                  <Label className="text-xs font-semibold">Grid Settings</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "Desktop", key: "items_per_row" as const, options: [1,2,3,4,5,6], def: 4 },
                      { label: "Tablet", key: "items_per_row_tablet" as const, options: [1,2,3,4], def: 2 },
                      { label: "Mobile", key: "items_per_row_mobile" as const, options: [1,2,3], def: 1 },
                    ].map(({ label, key, options, def }) => (
                      <div key={key} className="space-y-1">
                        <Label className="text-[10px]">{label}</Label>
                        <Select value={String(form[key] || def)} onValueChange={(v) => set(key, +v)}>
                          <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                          <SelectContent>{options.map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[10px]">Rows</Label>
                      <Select value={String(form.row_count || 2)} onValueChange={(v) => set("row_count", +v)}>
                        <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>{[1,2,3,4,5].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px]">Gap</Label>
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
                <div className="space-y-3 rounded-lg border border-border/50 bg-muted/20 p-3">
                  <Label className="text-xs font-semibold">Carousel Settings</Label>
                  {[
                    { key: "carousel_autoplay" as const, label: "Autoplay" },
                    { key: "carousel_loop" as const, label: "Loop" },
                    { key: "carousel_arrows" as const, label: "Arrows" },
                    { key: "carousel_dots" as const, label: "Dots" },
                    { key: "carousel_peek" as const, label: "Peek (partial)" },
                  ].map(({ key, label }) => (
                    <div key={key} className="flex items-center justify-between">
                      <Label className="text-xs">{label}</Label>
                      <Switch checked={form[key] as boolean} onCheckedChange={(v) => set(key, v)} />
                    </div>
                  ))}
                  {form.carousel_autoplay && (
                    <div className="space-y-1">
                      <Label className="text-[10px]">Speed: {form.carousel_speed}ms</Label>
                      <Slider min={1000} max={10000} step={500} value={[form.carousel_speed || 3000]} onValueChange={([v]) => set("carousel_speed", v)} />
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Direction</Label>
                    <Select value={form.carousel_direction || "ltr"} onValueChange={(v) => set("carousel_direction", v)}>
                      <SelectTrigger className="h-8 w-24 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ltr">LTR →</SelectItem>
                        <SelectItem value="rtl">RTL ←</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {(form.display_style === "cover_banner" || form.display_style === "featured_list") && (
                <div className="space-y-3 rounded-lg border border-border/50 bg-muted/20 p-3">
                  <Label className="text-xs font-semibold">Cover Settings</Label>
                  <Input value={form.cover_image_url || ""} onChange={(e) => set("cover_image_url", e.target.value)} className="h-8 text-sm" placeholder="https://... image URL" />
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[10px]">Position</Label>
                      <Select value={form.cover_position || "top"} onValueChange={(v) => set("cover_position", v)}>
                        <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {["top","left","right","background","none"].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px]">Text Align</Label>
                      <Select value={form.cover_text_align || "center"} onValueChange={(v) => set("cover_text_align", v)}>
                        <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {["left","center","right"].map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px]">Height: {form.cover_height}px</Label>
                    <Slider min={100} max={600} step={10} value={[form.cover_height || 300]} onValueChange={([v]) => set("cover_height", v)} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px]">Overlay: {Math.round((form.cover_overlay_opacity || 0) * 100)}%</Label>
                    <Slider min={0} max={1} step={0.05} value={[form.cover_overlay_opacity || 0.4]} onValueChange={([v]) => set("cover_overlay_opacity", v)} />
                  </div>
                </div>
              )}
            </TabsContent>

            {/* ── CARD TAB ── */}
            <TabsContent value="card" className="mt-0 space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Card Template</Label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {CARD_TEMPLATES.map((ct) => (
                    <button
                      key={ct.value}
                      onClick={() => set("card_template", ct.value)}
                      className={cn(
                        "flex flex-col items-start gap-0.5 rounded-xl border-2 p-2 text-start transition-all",
                        form.card_template === ct.value
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-border hover:border-primary/30"
                      )}
                    >
                      <span className="text-[11px] font-semibold">{ct.labelEn}</span>
                      <span className="text-[8px] text-muted-foreground leading-tight">{ct.descEn}</span>
                    </button>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-[10px]">Image Ratio</Label>
                  <Select value={form.card_image_ratio || "4:3"} onValueChange={(v) => set("card_image_ratio", v)}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["1:1","4:3","16:9","3:4","2:3","auto"].map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px]">Image Position</Label>
                  <Select value={form.card_image_position || "top"} onValueChange={(v) => set("card_image_position", v)}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["top","left","right","background"].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px]">Item Height</Label>
                  <Select value={form.item_height || "auto"} onValueChange={(v) => set("item_height", v)}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["auto","sm","md","lg","xl","custom"].map(h => <SelectItem key={h} value={h}>{h === "auto" ? "Auto" : h === "custom" ? "Custom" : h.toUpperCase()}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {form.item_height === "custom" && (
                <Input type="number" min={100} max={800} value={form.item_height_custom || 280} onChange={(e) => set("item_height_custom", +e.target.value)} className="h-8 text-sm" placeholder="280px" />
              )}

              <Separator />

              <div className="rounded-lg border border-border/50 bg-muted/20 p-3 space-y-2">
                <Label className="text-xs font-semibold">Card Elements</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-1">
                  {[
                    { key: "card_show_avatar" as const, label: "Avatar" },
                    { key: "card_show_badge" as const, label: "Badge" },
                    { key: "card_show_rating" as const, label: "Rating" },
                    { key: "card_show_description" as const, label: "Description" },
                    { key: "card_show_cta" as const, label: "CTA Button" },
                  ].map(({ key, label }) => (
                    <div key={key} className="flex items-center justify-between py-0.5">
                      <Label className="text-xs">{label}</Label>
                      <Switch checked={form[key] as boolean} onCheckedChange={(v) => set(key, v)} />
                    </div>
                  ))}
                </div>
                {form.card_show_cta && (
                  <BilingualField
                    label="CTA Text" labelAr="نص الزر"
                    valueEn={form.card_cta_text_en || ""} valueAr={form.card_cta_text_ar || ""}
                    onChangeEn={(v) => set("card_cta_text_en", v)} onChangeAr={(v) => set("card_cta_text_ar", v)}
                  />
                )}
              </div>
            </TabsContent>

            {/* ── STYLE TAB ── */}
            <TabsContent value="style" className="mt-0 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[10px]">Section Padding</Label>
                  <Select value={form.section_padding || "md"} onValueChange={(v) => set("section_padding", v)}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["none","sm","md","lg","xl"].map(p => <SelectItem key={p} value={p}>{p.toUpperCase()}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px]">Container Width</Label>
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
                  <Label className="text-[10px]">BG Color</Label>
                  <div className="flex gap-1">
                    <Input value={form.bg_color || ""} onChange={(e) => set("bg_color", e.target.value)} className="h-8 text-xs flex-1" placeholder="#f5f5f5" />
                    {form.bg_color && <div className="h-8 w-8 rounded border shrink-0" style={{ backgroundColor: form.bg_color }} />}
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px]">Text Color</Label>
                  <div className="flex gap-1">
                    <Input value={form.text_color || ""} onChange={(e) => set("text_color", e.target.value)} className="h-8 text-xs flex-1" placeholder="#000" />
                    {form.text_color && <div className="h-8 w-8 rounded border shrink-0" style={{ backgroundColor: form.text_color }} />}
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px]">Border</Label>
                  <Select value={form.border_style || "none"} onValueChange={(v) => set("border_style", v)}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["none","top","bottom","both","card"].map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-[10px]">BG Gradient</Label>
                <Input value={form.bg_gradient || ""} onChange={(e) => set("bg_gradient", e.target.value)} className="h-8 text-xs" placeholder="linear-gradient(135deg, #1a1a2e, #16213e)" />
              </div>

              <Separator />

              <div className="rounded-lg border border-border/50 bg-muted/20 p-3 space-y-2">
                <Label className="text-xs font-semibold">Animation</Label>
                <Select value={form.animation || "none"} onValueChange={(v) => set("animation", v)}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["none","fade","slide-up","slide-left","scale","blur","stagger"].map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                  </SelectContent>
                </Select>
                {form.animation !== "none" && (
                  <div className="space-y-1">
                    <Label className="text-[10px]">Delay: {form.animation_delay || 0}ms</Label>
                    <Slider min={0} max={2000} step={100} value={[form.animation_delay || 0]} onValueChange={([v]) => set("animation_delay", v)} />
                  </div>
                )}
              </div>

              <Separator />

              <div className="rounded-lg border border-border/50 bg-muted/20 p-3 space-y-2">
                <Label className="text-xs font-semibold">Section Header & Footer</Label>
                {[
                  { key: "show_section_header" as const, label: "Show Header" },
                  { key: "show_view_all" as const, label: "View All Button" },
                  { key: "show_filters" as const, label: "Show Filters" },
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center justify-between">
                    <Label className="text-xs">{label}</Label>
                    <Switch checked={form[key] as boolean} onCheckedChange={(v) => set(key, v)} />
                  </div>
                ))}
                {form.show_view_all && (
                  <Input value={form.view_all_link || ""} onChange={(e) => set("view_all_link", e.target.value)} className="h-8 text-xs" placeholder="/chefs" />
                )}
              </div>
            </TabsContent>

            {/* ── ADVANCED TAB ── */}
            <TabsContent value="advanced" className="mt-0 space-y-4">
              <BilingualField
                label="Description" labelAr="الوصف"
                valueEn={form.description_en || ""} valueAr={form.description_ar || ""}
                onChangeEn={(v) => set("description_en", v)} onChangeAr={(v) => set("description_ar", v)}
                multiline rows={3}
              />
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Custom CSS</Label>
                <Textarea
                  value={form.custom_css || ""}
                  onChange={(e) => set("custom_css", e.target.value)}
                  className="min-h-[100px] text-xs font-mono"
                  placeholder=".section { /* custom overrides */ }"
                />
              </div>
            </TabsContent>
          </div>
        </Tabs>

        {/* Footer */}
        <div className="border-t bg-muted/30 p-3 flex items-center justify-between rounded-b-xl">
          <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={handleReset}>
            <RotateCcw className="h-3 w-3" /> Reset
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="text-xs" onClick={onCancel}>Cancel</Button>
            <Button size="sm" onClick={handleSave} disabled={isPending} className="gap-1.5 text-xs">
              <Save className="h-3.5 w-3.5" />
              {isPending ? "Saving..." : "Save Block"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
