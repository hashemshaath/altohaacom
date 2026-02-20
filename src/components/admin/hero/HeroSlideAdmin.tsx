import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Plus, Trash2, GripVertical, Eye, EyeOff, ChevronDown, ChevronUp,
  Save, Loader2, Image, Layout, Type, Link, Palette, Monitor,
  Smartphone, Tablet, LayoutTemplate,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { HERO_TEMPLATES, templateLabels } from "./heroTemplates";
import { HeroSlidePreview } from "./HeroSlidePreview";

export type HeroSlide = {
  id: string;
  title: string;
  title_ar: string | null;
  subtitle: string | null;
  subtitle_ar: string | null;
  image_url: string;
  link_url: string | null;
  link_label: string | null;
  link_label_ar: string | null;
  sort_order: number;
  is_active: boolean;
  template: string;
  text_position: string;
  overlay_opacity: number;
  overlay_color: string;
  height_preset: string;
  custom_height: number | null;
  badge_text: string | null;
  badge_text_ar: string | null;
  cta_secondary_label: string | null;
  cta_secondary_label_ar: string | null;
  cta_secondary_url: string | null;
  text_color: string;
  accent_color: string;
  gradient_direction: string;
  autoplay_interval: number;
};

const defaultSlide: Omit<HeroSlide, "id" | "sort_order"> = {
  title: "",
  title_ar: "",
  subtitle: "",
  subtitle_ar: "",
  image_url: "",
  link_url: "",
  link_label: "",
  link_label_ar: "",
  is_active: true,
  template: "classic",
  text_position: "bottom-left",
  overlay_opacity: 50,
  overlay_color: "#000000",
  height_preset: "medium",
  custom_height: null,
  badge_text: "",
  badge_text_ar: "",
  cta_secondary_label: "",
  cta_secondary_label_ar: "",
  cta_secondary_url: "",
  text_color: "#ffffff",
  accent_color: "primary",
  gradient_direction: "to-right",
  autoplay_interval: 6000,
};

const HEIGHT_PRESETS: Record<string, { label: string; px: number; desc: string }> = {
  compact:    { label: "Compact",       px: 360,  desc: "360px – Blog / Banner" },
  medium:     { label: "Medium",        px: 520,  desc: "520px – Standard Hero" },
  large:      { label: "Large",         px: 680,  desc: "680px – Full Impact" },
  cinematic:  { label: "Cinematic",     px: 800,  desc: "800px – Editorial" },
  viewport:   { label: "Full Viewport", px: 0,    desc: "100vh – Immersive" },
  custom:     { label: "Custom",        px: 0,    desc: "Set your own height" },
};

const TEXT_POSITIONS = [
  { value: "bottom-left",   label: "Bottom Left" },
  { value: "bottom-center", label: "Bottom Center" },
  { value: "bottom-right",  label: "Bottom Right" },
  { value: "center",        label: "Center" },
  { value: "center-left",   label: "Center Left" },
  { value: "top-left",      label: "Top Left" },
];

const GRADIENT_DIRECTIONS = [
  { value: "to-right",    label: "Left → Right" },
  { value: "to-left",     label: "Right → Left" },
  { value: "to-top",      label: "Bottom → Top" },
  { value: "to-bottom",   label: "Top → Bottom" },
  { value: "radial",      label: "Radial (center)" },
  { value: "diagonal",    label: "Diagonal" },
];

export function HeroSlideAdmin() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [showPreview, setShowPreview] = useState(false);
  const [previewSlide, setPreviewSlide] = useState<HeroSlide | null>(null);

  const { data: slides = [], isLoading } = useQuery<HeroSlide[]>({
    queryKey: ["hero-slides-admin"],
    queryFn: async () => {
      const { data, error } = await supabase.from("hero_slides").select("*").order("sort_order");
      if (error) throw error;
      return (data || []) as HeroSlide[];
    },
  });

  const save = useMutation({
    mutationFn: async (slide: HeroSlide) => {
      const { id, ...rest } = slide;
      const payload = { ...rest, updated_at: new Date().toISOString() };
      const { error } = await supabase.from("hero_slides").update(payload).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hero-slides-admin"] });
      qc.invalidateQueries({ queryKey: ["hero-slides"] });
      toast({ title: isAr ? "تم الحفظ" : "Saved", description: isAr ? "تم حفظ الشريحة" : "Slide saved successfully" });
    },
    onError: () => toast({ title: isAr ? "خطأ" : "Error", variant: "destructive" }),
  });

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("hero_slides").insert({
        ...defaultSlide,
        title: "New Slide",
        title_ar: "شريحة جديدة",
        image_url: "https://images.unsplash.com/photo-1466637574441-749b8f19452f?w=1600&q=80",
        sort_order: slides.length,
        created_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hero-slides-admin"] });
      qc.invalidateQueries({ queryKey: ["hero-slides"] });
      toast({ title: isAr ? "تمت الإضافة" : "Created" });
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("hero_slides").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hero-slides-admin"] });
      qc.invalidateQueries({ queryKey: ["hero-slides"] });
    },
  });

  const [localSlides, setLocalSlides] = useState<Record<string, HeroSlide>>({});

  const getSlide = (s: HeroSlide): HeroSlide => localSlides[s.id] ?? s;

  const update = (id: string, field: keyof HeroSlide, value: any) => {
    setLocalSlides(prev => ({
      ...prev,
      [id]: { ...(prev[id] ?? slides.find(s => s.id === id)!), [field]: value },
    }));
  };

  const handleSave = (slide: HeroSlide) => {
    const current = getSlide(slide);
    save.mutate(current);
  };

  const openPreview = (slide: HeroSlide) => {
    setPreviewSlide(getSlide(slide));
    setShowPreview(true);
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
      {/* Header bar */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{slides.length} {isAr ? "شريحة" : "slides"}</Badge>
          <Badge variant="outline" className="text-green-600 border-green-200">
            {slides.filter(s => s.is_active).length} {isAr ? "نشط" : "active"}
          </Badge>
        </div>
        <Button size="sm" onClick={() => create.mutate()} disabled={create.isPending} className="gap-1.5">
          {create.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
          {isAr ? "إضافة شريحة" : "Add Slide"}
        </Button>
      </div>

      {/* Slide list */}
      <div className="space-y-3">
        {slides.map((rawSlide, idx) => {
          const slide = getSlide(rawSlide);
          const isOpen = expanded === slide.id;
          const tpl = HERO_TEMPLATES.find(t => t.id === slide.template) ?? HERO_TEMPLATES[0];
          const isDirty = !!localSlides[slide.id];

          return (
            <Card key={slide.id} className={cn("border-border/50 transition-all", isOpen && "shadow-md border-primary/30")}>
              {/* Slide header row */}
              <div
                className="flex items-center gap-3 p-3 cursor-pointer select-none"
                onClick={() => setExpanded(isOpen ? null : slide.id)}
              >
                <GripVertical className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                <div className="h-12 w-20 rounded-md overflow-hidden shrink-0 bg-muted">
                  {slide.image_url && (
                    <img src={slide.image_url} alt={slide.title} className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold truncate">{slide.title}</span>
                    <Badge variant="outline" className="text-[10px] shrink-0">{tpl.label}</Badge>
                    {isDirty && <Badge variant="outline" className="text-[10px] shrink-0 border-amber-300 text-amber-600">{isAr ? "تعديلات غير محفوظة" : "Unsaved"}</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{slide.subtitle || slide.image_url}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Badge variant={slide.is_active ? "default" : "secondary"} className="text-[10px] hidden sm:flex">
                    {slide.is_active ? (isAr ? "نشط" : "Active") : (isAr ? "مخفي" : "Hidden")}
                  </Badge>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={e => { e.stopPropagation(); openPreview(rawSlide); }}>
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                  {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </div>
              </div>

              {/* Expanded editor */}
              {isOpen && (
                <CardContent className="border-t border-border/40 pt-4 pb-5">
                  <Tabs defaultValue="content" className="space-y-4">
                    <TabsList className="h-8 text-xs gap-0.5">
                      <TabsTrigger value="content" className="h-7 px-2.5 text-xs gap-1"><Type className="h-3 w-3" />{isAr ? "المحتوى" : "Content"}</TabsTrigger>
                      <TabsTrigger value="template" className="h-7 px-2.5 text-xs gap-1"><LayoutTemplate className="h-3 w-3" />{isAr ? "القالب" : "Template"}</TabsTrigger>
                      <TabsTrigger value="design" className="h-7 px-2.5 text-xs gap-1"><Palette className="h-3 w-3" />{isAr ? "التصميم" : "Design"}</TabsTrigger>
                      <TabsTrigger value="dimensions" className="h-7 px-2.5 text-xs gap-1"><Monitor className="h-3 w-3" />{isAr ? "الأبعاد" : "Dimensions"}</TabsTrigger>
                      <TabsTrigger value="links" className="h-7 px-2.5 text-xs gap-1"><Link className="h-3 w-3" />{isAr ? "الروابط" : "Links"}</TabsTrigger>
                    </TabsList>

                    {/* ── CONTENT TAB ── */}
                    <TabsContent value="content" className="mt-0 space-y-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5">
                          <Label className="text-xs">Title (EN)</Label>
                          <Input value={slide.title} onChange={e => update(slide.id, "title", e.target.value)} placeholder="English title" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">العنوان (AR)</Label>
                          <Input dir="rtl" value={slide.title_ar ?? ""} onChange={e => update(slide.id, "title_ar", e.target.value)} placeholder="العنوان بالعربية" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Subtitle (EN)</Label>
                          <Textarea rows={2} value={slide.subtitle ?? ""} onChange={e => update(slide.id, "subtitle", e.target.value)} placeholder="English subtitle..." className="resize-none text-xs" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">العنوان الفرعي (AR)</Label>
                          <Textarea dir="rtl" rows={2} value={slide.subtitle_ar ?? ""} onChange={e => update(slide.id, "subtitle_ar", e.target.value)} placeholder="العنوان الفرعي بالعربية..." className="resize-none text-xs" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Badge / Tag (EN)</Label>
                          <Input value={slide.badge_text ?? ""} onChange={e => update(slide.id, "badge_text", e.target.value)} placeholder="e.g. New, Featured..." />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">الشارة (AR)</Label>
                          <Input dir="rtl" value={slide.badge_text_ar ?? ""} onChange={e => update(slide.id, "badge_text_ar", e.target.value)} placeholder="مثال: جديد، مميز..." />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs flex items-center gap-1.5"><Image className="h-3 w-3" /> Image URL</Label>
                        <Input value={slide.image_url} onChange={e => update(slide.id, "image_url", e.target.value)} placeholder="https://..." />
                        {slide.image_url && (
                          <div className="h-28 rounded-lg overflow-hidden border border-border/50">
                            <img src={slide.image_url} alt="preview" className="h-full w-full object-cover" />
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-between rounded-lg border border-border/50 p-3">
                        <div>
                          <p className="text-sm font-medium">{isAr ? "تفعيل الشريحة" : "Active slide"}</p>
                          <p className="text-xs text-muted-foreground">{isAr ? "إخفاء الشريحة من الموقع" : "Hide this slide from the public"}</p>
                        </div>
                        <Switch checked={slide.is_active} onCheckedChange={v => update(slide.id, "is_active", v)} />
                      </div>
                    </TabsContent>

                    {/* ── TEMPLATE TAB ── */}
                    <TabsContent value="template" className="mt-0 space-y-4">
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {HERO_TEMPLATES.map(tpl => (
                          <button
                            key={tpl.id}
                            onClick={() => update(slide.id, "template", tpl.id)}
                            className={cn(
                              "group rounded-xl border-2 p-3 text-start transition-all hover:border-primary/60 hover:shadow-md",
                              slide.template === tpl.id ? "border-primary bg-primary/5 shadow-sm" : "border-border/50"
                            )}
                          >
                            <div className="mb-2.5 h-20 rounded-lg overflow-hidden bg-muted relative">
                              <img
                                src="https://images.unsplash.com/photo-1466637574441-749b8f19452f?w=400&q=60"
                                alt={tpl.label}
                                className="h-full w-full object-cover"
                              />
                              <div className="absolute inset-0 flex items-end p-2" style={{ background: tpl.previewGradient }}>
                                <div className={cn("space-y-0.5", tpl.textAlign)}>
                                  <div className="h-1.5 w-12 rounded bg-white/80" />
                                  <div className="h-1 w-8 rounded bg-white/50" />
                                </div>
                              </div>
                            </div>
                            <div className="flex items-start justify-between gap-1">
                              <div>
                                <p className="text-xs font-semibold">{tpl.label}</p>
                                <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{tpl.description}</p>
                              </div>
                              {slide.template === tpl.id && (
                                <Badge className="text-[10px] shrink-0">{isAr ? "محدد" : "Selected"}</Badge>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    </TabsContent>

                    {/* ── DESIGN TAB ── */}
                    <TabsContent value="design" className="mt-0 space-y-5">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label className="text-xs">Text Position</Label>
                          <Select value={slide.text_position} onValueChange={v => update(slide.id, "text_position", v)}>
                            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {TEXT_POSITIONS.map(p => <SelectItem key={p.value} value={p.value} className="text-xs">{p.label}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Gradient Direction</Label>
                          <Select value={slide.gradient_direction} onValueChange={v => update(slide.id, "gradient_direction", v)}>
                            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {GRADIENT_DIRECTIONS.map(d => <SelectItem key={d.value} value={d.value} className="text-xs">{d.label}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Overlay Opacity: {slide.overlay_opacity}%</Label>
                        <Slider
                          value={[slide.overlay_opacity]}
                          onValueChange={([v]) => update(slide.id, "overlay_opacity", v)}
                          min={0} max={90} step={5}
                          className="w-full"
                        />
                        <div className="flex justify-between text-[10px] text-muted-foreground">
                          <span>0% – Transparent</span><span>90% – Very Dark</span>
                        </div>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label className="text-xs">Overlay Color</Label>
                          <div className="flex items-center gap-2">
                            <input type="color" value={slide.overlay_color} onChange={e => update(slide.id, "overlay_color", e.target.value)} className="h-8 w-12 cursor-pointer rounded border border-border" />
                            <Input value={slide.overlay_color} onChange={e => update(slide.id, "overlay_color", e.target.value)} className="h-8 text-xs font-mono flex-1" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Autoplay (ms)</Label>
                          <Select value={String(slide.autoplay_interval)} onValueChange={v => update(slide.id, "autoplay_interval", Number(v))}>
                            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {[3000,4000,5000,6000,8000,10000,0].map(v => (
                                <SelectItem key={v} value={String(v)} className="text-xs">
                                  {v === 0 ? "No autoplay" : `${v/1000}s`}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </TabsContent>

                    {/* ── DIMENSIONS TAB ── */}
                    <TabsContent value="dimensions" className="mt-0 space-y-4">
                      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {Object.entries(HEIGHT_PRESETS).map(([key, preset]) => (
                          <button
                            key={key}
                            onClick={() => update(slide.id, "height_preset", key)}
                            className={cn(
                              "rounded-xl border-2 p-3 text-start transition-all hover:border-primary/60",
                              slide.height_preset === key ? "border-primary bg-primary/5" : "border-border/50"
                            )}
                          >
                            <p className="text-xs font-semibold">{preset.label}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">{preset.desc}</p>
                          </button>
                        ))}
                      </div>
                      {slide.height_preset === "custom" && (
                        <div className="space-y-1.5">
                          <Label className="text-xs">Custom Height (px)</Label>
                          <Input
                            type="number"
                            value={slide.custom_height ?? 520}
                            onChange={e => update(slide.id, "custom_height", Number(e.target.value))}
                            min={200} max={1200}
                            placeholder="520"
                          />
                        </div>
                      )}
                      <div className="rounded-lg border border-border/40 bg-muted/30 p-3">
                        <p className="text-xs font-medium mb-2">{isAr ? "المعايير الموصى بها" : "Recommended Standards"}</p>
                        <div className="grid grid-cols-3 gap-2 text-[10px]">
                          <div className="flex items-center gap-1.5"><Monitor className="h-3 w-3" /><span>Desktop: 16:9 → 1920×1080</span></div>
                          <div className="flex items-center gap-1.5"><Tablet className="h-3 w-3" /><span>Tablet: 4:3 → 1024×768</span></div>
                          <div className="flex items-center gap-1.5"><Smartphone className="h-3 w-3" /><span>Mobile: 9:16 → 390×844</span></div>
                        </div>
                      </div>
                    </TabsContent>

                    {/* ── LINKS TAB ── */}
                    <TabsContent value="links" className="mt-0 space-y-4">
                      <div className="space-y-3">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{isAr ? "الزر الرئيسي" : "Primary CTA"}</p>
                        <div className="grid gap-3 sm:grid-cols-3">
                          <div className="space-y-1.5 sm:col-span-1">
                            <Label className="text-xs">URL</Label>
                            <Input value={slide.link_url ?? ""} onChange={e => update(slide.id, "link_url", e.target.value)} placeholder="/competitions" />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">Label (EN)</Label>
                            <Input value={slide.link_label ?? ""} onChange={e => update(slide.id, "link_label", e.target.value)} placeholder="Explore Now" />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">النص (AR)</Label>
                            <Input dir="rtl" value={slide.link_label_ar ?? ""} onChange={e => update(slide.id, "link_label_ar", e.target.value)} placeholder="استكشف الآن" />
                          </div>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{isAr ? "الزر الثانوي" : "Secondary CTA"}</p>
                        <div className="grid gap-3 sm:grid-cols-3">
                          <div className="space-y-1.5 sm:col-span-1">
                            <Label className="text-xs">URL</Label>
                            <Input value={slide.cta_secondary_url ?? ""} onChange={e => update(slide.id, "cta_secondary_url", e.target.value)} placeholder="/about" />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">Label (EN)</Label>
                            <Input value={slide.cta_secondary_label ?? ""} onChange={e => update(slide.id, "cta_secondary_label", e.target.value)} placeholder="Learn More" />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">النص (AR)</Label>
                            <Input dir="rtl" value={slide.cta_secondary_label_ar ?? ""} onChange={e => update(slide.id, "cta_secondary_label_ar", e.target.value)} placeholder="تعرف أكثر" />
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>

                  {/* Action row */}
                  <div className="mt-5 flex items-center justify-between gap-3 border-t border-border/40 pt-4">
                    <Button
                      size="sm"
                      variant="destructive"
                      className="gap-1.5"
                      onClick={() => { if (confirm("Delete this slide?")) remove.mutate(slide.id); }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      {isAr ? "حذف" : "Delete"}
                    </Button>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="gap-1.5" onClick={() => openPreview(rawSlide)}>
                        <Eye className="h-3.5 w-3.5" />
                        {isAr ? "معاينة" : "Preview"}
                      </Button>
                      <Button size="sm" className="gap-1.5" onClick={() => handleSave(rawSlide)} disabled={save.isPending}>
                        {save.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                        {isAr ? "حفظ" : "Save"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}

        {slides.length === 0 && (
          <div className="rounded-xl border-2 border-dashed border-border/50 py-12 text-center">
            <Layout className="h-8 w-8 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">{isAr ? "لا توجد شرائح بعد" : "No slides yet"}</p>
            <Button size="sm" className="mt-3" onClick={() => create.mutate()}>
              <Plus className="h-3.5 w-3.5 me-1.5" />
              {isAr ? "إضافة أول شريحة" : "Add First Slide"}
            </Button>
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {showPreview && previewSlide && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-5xl bg-card rounded-2xl shadow-2xl border border-border/50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold">{isAr ? "معاينة" : "Live Preview"}: {previewSlide.title}</p>
                <Badge variant="outline" className="text-[10px]">{HERO_TEMPLATES.find(t => t.id === previewSlide.template)?.label}</Badge>
              </div>
              <div className="flex items-center gap-2">
                {(["desktop", "tablet", "mobile"] as const).map(d => (
                  <Button key={d} size="icon" variant={previewDevice === d ? "default" : "ghost"} className="h-7 w-7" onClick={() => setPreviewDevice(d)}>
                    {d === "desktop" ? <Monitor className="h-3.5 w-3.5" /> : d === "tablet" ? <Tablet className="h-3.5 w-3.5" /> : <Smartphone className="h-3.5 w-3.5" />}
                  </Button>
                ))}
                <Button size="sm" variant="ghost" onClick={() => setShowPreview(false)} className="text-xs">✕ Close</Button>
              </div>
            </div>
            <div className={cn(
              "mx-auto transition-all overflow-hidden",
              previewDevice === "desktop" ? "w-full" : previewDevice === "tablet" ? "max-w-[768px]" : "max-w-[390px]"
            )}>
              <HeroSlidePreview slide={previewSlide} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
