import { useState, useRef, memo } from "react";
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
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Plus, Trash2, GripVertical, Eye, ChevronDown, ChevronUp,
  Save, Loader2, Image, Layout, Type, Link2, Palette, Monitor,
  Smartphone, Tablet, LayoutTemplate, Copy, Zap, Move, Maximize2, X,
  ArrowUp, ArrowDown, ToggleLeft, ToggleRight, Layers,
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
  animation_effect: string;
  object_fit: string;
  object_position: string;
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
  animation_effect: "fade",
  object_fit: "cover",
  object_position: "center",
};

const HEIGHT_PRESETS: Record<string, { label: string; px: number; desc: string; icon: string }> = {
  compact:   { label: "Compact",       px: 360, desc: "360px – Blog / Banner",     icon: "▬" },
  medium:    { label: "Medium",        px: 520, desc: "520px – Standard Hero",      icon: "▭" },
  large:     { label: "Large",         px: 680, desc: "680px – Full Impact",        icon: "▯" },
  cinematic: { label: "Cinematic",     px: 800, desc: "800px – Editorial",          icon: "⬜" },
  viewport:  { label: "Full Viewport", px: 0,   desc: "100vh – Immersive",          icon: "⛶" },
  custom:    { label: "Custom",        px: 0,   desc: "Set your own height",        icon: "✎" },
};

const TEXT_POSITIONS = [
  { value: "bottom-left",   label: "↙ Bottom Left" },
  { value: "bottom-center", label: "↓ Bottom Center" },
  { value: "bottom-right",  label: "↘ Bottom Right" },
  { value: "center",        label: "⊕ Center" },
  { value: "center-left",   label: "← Center Left" },
  { value: "top-left",      label: "↖ Top Left" },
];

const GRADIENT_DIRECTIONS = [
  { value: "to-right",  label: "Left → Right" },
  { value: "to-left",   label: "Right → Left" },
  { value: "to-top",    label: "Bottom → Top" },
  { value: "to-bottom", label: "Top → Bottom" },
  { value: "radial",    label: "Radial (center out)" },
  { value: "diagonal",  label: "Diagonal ↘" },
];

const ANIMATION_EFFECTS = [
  { value: "fade",      label: "Fade",        desc: "Smooth crossfade" },
  { value: "slide",     label: "Slide",       desc: "Horizontal slide" },
  { value: "zoom",      label: "Zoom In",     desc: "Ken Burns effect" },
  { value: "blur",      label: "Blur In",     desc: "Defocus to focus" },
  { value: "none",      label: "None",        desc: "Instant switch" },
];

const OBJECT_POSITIONS = [
  { value: "center",        label: "Center" },
  { value: "top",           label: "Top" },
  { value: "bottom",        label: "Bottom" },
  { value: "left",          label: "Left" },
  { value: "right",         label: "Right" },
  { value: "center top",    label: "Center Top" },
  { value: "center bottom", label: "Center Bottom" },
];

const OVERLAY_PRESETS = [
  { label: "Dark",     color: "#000000", opacity: 55 },
  { label: "Navy",     color: "#0a1628", opacity: 65 },
  { label: "Warm",     color: "#2d1a0a", opacity: 60 },
  { label: "Emerald",  color: "#0a2818", opacity: 60 },
  { label: "Crimson",  color: "#2d0a0a", opacity: 60 },
  { label: "Purple",   color: "#1a0a2d", opacity: 60 },
  { label: "Light",    color: "#ffffff", opacity: 20 },
  { label: "None",     color: "#000000", opacity: 0  },
];

// ─── Small reusable field wrapper ────────────────────────────────────────────
function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

// ─── Section heading ──────────────────────────────────────────────────────────
function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70 mb-2">
      {children}
    </p>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export const HeroSlideAdmin = memo(function HeroSlideAdmin() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [expanded, setExpanded] = useState<string | null>(null);
  const [previewSlide, setPreviewSlide] = useState<HeroSlide | null>(null);
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [localSlides, setLocalSlides] = useState<Record<string, HeroSlide>>({});
  const [livePreview, setLivePreview] = useState(true);
  const dragId = useRef<string | null>(null);

  // ── Queries ──────────────────────────────────────────────────────────────────
  const { data: slides = [], isLoading } = useQuery<HeroSlide[]>({
    queryKey: ["hero-slides-admin"],
    queryFn: async () => {
      const { data, error } = await supabase.from("hero_slides").select("id, title, title_ar, subtitle, subtitle_ar, image_url, link_url, link_label, link_label_ar, sort_order, is_active, template, text_position, overlay_opacity, overlay_color, height_preset, custom_height, badge_text, badge_text_ar, cta_secondary_label, cta_secondary_label_ar, cta_secondary_url, text_color, accent_color, gradient_direction, autoplay_interval, animation_effect, object_fit, object_position").order("sort_order");
      if (error) throw error;
      return (data || []) as HeroSlide[];
    },
  });

  // ── Local state helpers ───────────────────────────────────────────────────────
  const getSlide = (s: HeroSlide): HeroSlide => localSlides[s.id] ?? s;

  const update = (id: string, field: keyof HeroSlide, value: unknown) => {
    setLocalSlides(prev => ({
      ...prev,
      [id]: { ...(prev[id] ?? slides.find(s => s.id === id)!), [field]: value },
    }));
  };

  // ── Mutations ─────────────────────────────────────────────────────────────────
  const save = useMutation({
    mutationFn: async (slide: HeroSlide) => {
      const { id, ...rest } = slide;
      const { error } = await supabase.from("hero_slides").update({ ...rest, updated_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, slide) => {
      qc.invalidateQueries({ queryKey: ["hero-slides-admin"] });
      qc.invalidateQueries({ queryKey: ["hero-slides"] });
      setLocalSlides(prev => { const n = { ...prev }; delete n[slide.id]; return n; });
      toast({ title: isAr ? "تم الحفظ ✓" : "Saved ✓" });
    },
    onError: () => toast({ title: isAr ? "خطأ في الحفظ" : "Save failed", variant: "destructive" }),
  });

  const create = useMutation({
    mutationFn: async (template?: string) => {
      const tpl = HERO_TEMPLATES.find(t => t.id === template) ?? HERO_TEMPLATES[0];
      const { error } = await supabase.from("hero_slides").insert({
        ...defaultSlide,
        title: "New Slide",
        title_ar: "شريحة جديدة",
        image_url: "https://images.unsplash.com/photo-1466637574441-749b8f19452f?w=1600&q=80",
        sort_order: slides.length,
        template: tpl.id,
        text_position: tpl.defaultPosition,
        created_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hero-slides-admin"] });
      qc.invalidateQueries({ queryKey: ["hero-slides"] });
      toast({ title: isAr ? "تمت الإضافة" : "Slide created" });
    },
  });

  const duplicate = useMutation({
    mutationFn: async (slide: HeroSlide) => {
      const { id, sort_order, ...rest } = slide;
      const { error } = await supabase.from("hero_slides").insert({
        ...rest,
        title: `${rest.title} (Copy)`,
        title_ar: rest.title_ar ? `${rest.title_ar} (نسخة)` : null,
        sort_order: slides.length,
        created_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hero-slides-admin"] });
      qc.invalidateQueries({ queryKey: ["hero-slides"] });
      toast({ title: isAr ? "تم النسخ" : "Duplicated" });
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

  const reorder = useMutation({
    mutationFn: async ({ id, newOrder }: { id: string; newOrder: number }) => {
      const { error } = await supabase.from("hero_slides").update({ sort_order: newOrder }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hero-slides-admin"] });
      qc.invalidateQueries({ queryKey: ["hero-slides"] });
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("hero_slides").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hero-slides-admin"] });
      qc.invalidateQueries({ queryKey: ["hero-slides"] });
    },
  });

  const moveSlide = (id: string, dir: "up" | "down") => {
    const idx = slides.findIndex(s => s.id === id);
    const target = dir === "up" ? idx - 1 : idx + 1;
    if (target < 0 || target >= slides.length) return;
    reorder.mutate({ id: slides[idx].id, newOrder: slides[target].sort_order });
    reorder.mutate({ id: slides[target].id, newOrder: slides[idx].sort_order });
  };

  const handleSave = (slide: HeroSlide) => save.mutate(getSlide(slide));

  // ── Loading ───────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">

      {/* ── Top action bar ─────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="secondary" className="gap-1">
            <Layers className="h-3 w-3" />{slides.length} {isAr ? "شريحة" : "slides"}
          </Badge>
          <Badge variant="outline" className="text-emerald-600 border-emerald-200 gap-1">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            {slides.filter(s => s.is_active).length} {isAr ? "نشطة" : "active"}
          </Badge>
          {Object.keys(localSlides).length > 0 && (
            <Badge variant="outline" className="text-amber-600 border-amber-200 gap-1">
              {Object.keys(localSlides).length} {isAr ? "غير محفوظة" : "unsaved"}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm" variant="outline"
            className={cn("gap-1.5 text-xs", livePreview && "border-primary/40 bg-primary/5 text-primary")}
            onClick={() => setLivePreview(v => !v)}
          >
            <Eye className="h-3.5 w-3.5" />
            {isAr ? "معاينة مباشرة" : "Live Preview"}
          </Button>
          <Button size="sm" onClick={() => create.mutate(undefined)} disabled={create.isPending} className="gap-1.5">
            {create.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
            {isAr ? "إضافة شريحة" : "Add Slide"}
          </Button>
        </div>
      </div>

      {/* ── Quick-add template picker ───────────────────────────────────────── */}
      <div className="rounded-xl border border-border/50 bg-muted/20 p-3">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2.5">
          {isAr ? "إضافة سريعة بقالب" : "Quick-add by template"}
        </p>
        <div className="flex flex-wrap gap-2">
          {HERO_TEMPLATES.map(tpl => (
            <button
              key={tpl.id}
              onClick={() => create.mutate(tpl.id)}
              disabled={create.isPending}
              className="flex items-center gap-1.5 rounded-xl border border-border/50 bg-card px-3 py-1.5 text-xs font-medium hover:border-primary/40 hover:bg-primary/5 hover:text-primary transition-all"
            >
              <Plus className="h-3 w-3" />{tpl.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Slide list ─────────────────────────────────────────────────────── */}
      <div className="space-y-3">
        {slides.map((rawSlide, idx) => {
          const slide = getSlide(rawSlide);
          const isOpen = expanded === slide.id;
          const tpl = HERO_TEMPLATES.find(t => t.id === slide.template) ?? HERO_TEMPLATES[0];
          const isDirty = !!localSlides[slide.id];

          return (
            <Card
              key={slide.id}
              className={cn(
                "border-border/50 transition-all duration-200",
                isOpen && "shadow-lg border-primary/30 ring-1 ring-primary/10",
                !slide.is_active && "opacity-60"
              )}
              draggable
              onDragStart={() => { dragId.current = slide.id; }}
              onDragOver={e => e.preventDefault()}
              onDrop={() => {
                if (dragId.current && dragId.current !== slide.id) {
                  const fromIdx = slides.findIndex(s => s.id === dragId.current);
                  reorder.mutate({ id: slides[fromIdx].id, newOrder: slide.sort_order });
                  reorder.mutate({ id: slide.id, newOrder: slides[fromIdx].sort_order });
                  dragId.current = null;
                }
              }}
            >
              {/* ── Card header row ── */}
              <div className="flex items-center gap-3 p-3">
                {/* Drag handle + order */}
                <div className="flex flex-col items-center gap-0.5 shrink-0 cursor-grab active:cursor-grabbing">
                  <GripVertical className="h-4 w-4 text-muted-foreground/40" />
                  <span className="text-[9px] text-muted-foreground/50 font-mono">{idx + 1}</span>
                </div>

                {/* Thumbnail */}
                <div
                  className="h-14 w-24 rounded-xl overflow-hidden shrink-0 bg-muted cursor-pointer relative group"
                  onClick={() => { setPreviewSlide(getSlide(rawSlide)); }}
                >
                  {slide.image_url && (
                    <img src={slide.image_url} alt={slide.title} className="h-full w-full object-cover" />
                  )}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-foreground/60 flex items-center justify-center"
                  >
                    <Maximize2 className="h-4 w-4 text-background" />
                  </div>
                  {/* Template color strip */}
                  <div className="absolute bottom-0 inset-x-0 h-1 bg-primary/60" style={{ background: tpl.previewGradient }} />
                </div>

                {/* Info */}
                <div
                  className="flex-1 min-w-0 cursor-pointer"
                  onClick={() => setExpanded(isOpen ? null : slide.id)}
                >
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-sm font-semibold truncate">{slide.title || <span className="text-muted-foreground italic">Untitled</span>}</span>
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 shrink-0">{tpl.label}</Badge>
                    {isDirty && (
                      <Badge variant="outline" className="text-[9px] px-1.5 py-0 shrink-0 border-amber-300 text-amber-600">
                        {isAr ? "غير محفوظ" : "Unsaved"}
                      </Badge>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                    {slide.subtitle || slide.image_url || "—"}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[9px] text-muted-foreground/60 font-mono">
                      {HEIGHT_PRESETS[slide.height_preset]?.label ?? slide.height_preset}
                      {slide.height_preset === "custom" && slide.custom_height ? ` · ${slide.custom_height}px` : ""}
                    </span>
                    {slide.animation_effect !== "none" && (
                      <span className="text-[9px] text-muted-foreground/60">
                        · {ANIMATION_EFFECTS.find(a => a.value === slide.animation_effect)?.label}
                      </span>
                    )}
                  </div>
                </div>

                {/* Quick actions */}
                <div className="flex items-center gap-1 shrink-0">
                  {/* Move up/down */}
              <Button
                    size="icon" variant="ghost" className="h-7 w-7 hidden sm:flex"
                    disabled={idx === 0}
                    onClick={e => { e.stopPropagation(); moveSlide(slide.id, "up"); }}
                    title="Move up"
                  >
                    <ArrowUp className="h-3 w-3" />
                  </Button>
                  <Button
                    size="icon" variant="ghost" className="h-7 w-7 hidden sm:flex"
                    disabled={idx === slides.length - 1}
                    onClick={e => { e.stopPropagation(); moveSlide(slide.id, "down"); }}
                    title="Move down"
                  >
                    <ArrowDown className="h-3 w-3" />
                  </Button>

                  {/* Toggle active */}
                  <Button
                    size="icon" variant="ghost"
                    className={cn("h-7 w-7", slide.is_active ? "text-emerald-600" : "text-muted-foreground")}
                    onClick={() => toggleActive.mutate({ id: slide.id, is_active: !slide.is_active })}
                    title={slide.is_active ? "Deactivate" : "Activate"}
                  >
                    {slide.is_active ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                  </Button>

                  {/* Duplicate */}
                  <Button
                    size="icon" variant="ghost" className="h-7 w-7"
                    onClick={() => duplicate.mutate(getSlide(rawSlide))}
                    disabled={duplicate.isPending}
                    title="Duplicate"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>

                  {/* Expand toggle */}
                  <Button
                    size="icon" variant="ghost" className="h-7 w-7"
                    onClick={() => setExpanded(isOpen ? null : slide.id)}
                  >
                    {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {/* ── Expanded editor ── */}
              {isOpen && (
                <CardContent className="border-t border-border/40 pt-4 pb-5 p-4">
                  <div className={cn("gap-5", livePreview ? "grid lg:grid-cols-2" : "block")}>

                    {/* ── Left: tabs editor ── */}
                    <div>
                      <Tabs defaultValue="content" className="space-y-3">
                        <TabsList className="h-8 flex-wrap gap-0.5 h-auto">
                          <TabsTrigger value="content"    className="h-7 px-2 text-[11px] gap-1"><Type className="h-3 w-3" />{isAr ? "المحتوى" : "Content"}</TabsTrigger>
                          <TabsTrigger value="template"   className="h-7 px-2 text-[11px] gap-1"><LayoutTemplate className="h-3 w-3" />{isAr ? "القالب" : "Template"}</TabsTrigger>
                          <TabsTrigger value="design"     className="h-7 px-2 text-[11px] gap-1"><Palette className="h-3 w-3" />{isAr ? "التصميم" : "Design"}</TabsTrigger>
                          <TabsTrigger value="image"      className="h-7 px-2 text-[11px] gap-1"><Image className="h-3 w-3" />{isAr ? "الصورة" : "Image"}</TabsTrigger>
                          <TabsTrigger value="dimensions" className="h-7 px-2 text-[11px] gap-1"><Monitor className="h-3 w-3" />{isAr ? "الأبعاد" : "Size"}</TabsTrigger>
                          <TabsTrigger value="links"      className="h-7 px-2 text-[11px] gap-1"><Link2 className="h-3 w-3" />{isAr ? "الروابط" : "Links"}</TabsTrigger>
                          <TabsTrigger value="animation"  className="h-7 px-2 text-[11px] gap-1"><Zap className="h-3 w-3" />{isAr ? "الحركة" : "Motion"}</TabsTrigger>
                        </TabsList>

                        {/* ── CONTENT ── */}
                        <TabsContent value="content" className="mt-0 space-y-4">
                          <SectionHeading>{isAr ? "العنوان والوصف" : "Title & Description"}</SectionHeading>
                          <div className="grid gap-3 sm:grid-cols-2">
                            <FieldRow label="Title (EN)">
                              <Input value={slide.title} onChange={e => update(slide.id, "title", e.target.value)} placeholder="English title" className="h-8 text-xs" />
                            </FieldRow>
                            <FieldRow label="العنوان (AR)">
                              <Input dir="rtl" value={slide.title_ar ?? ""} onChange={e => update(slide.id, "title_ar", e.target.value)} placeholder="العنوان" className="h-8 text-xs" />
                            </FieldRow>
                            <FieldRow label="Subtitle (EN)">
                              <Textarea rows={2} value={slide.subtitle ?? ""} onChange={e => update(slide.id, "subtitle", e.target.value)} placeholder="Description..." className="resize-none text-xs" />
                            </FieldRow>
                            <FieldRow label="الوصف (AR)">
                              <Textarea dir="rtl" rows={2} value={slide.subtitle_ar ?? ""} onChange={e => update(slide.id, "subtitle_ar", e.target.value)} placeholder="الوصف..." className="resize-none text-xs" />
                            </FieldRow>
                            <FieldRow label="Badge / Tag (EN)">
                              <Input value={slide.badge_text ?? ""} onChange={e => update(slide.id, "badge_text", e.target.value)} placeholder="e.g. New · Featured" className="h-8 text-xs" />
                            </FieldRow>
                            <FieldRow label="الشارة (AR)">
                              <Input dir="rtl" value={slide.badge_text_ar ?? ""} onChange={e => update(slide.id, "badge_text_ar", e.target.value)} placeholder="جديد · مميز" className="h-8 text-xs" />
                            </FieldRow>
                          </div>

                          <Separator className="my-1" />

                          <div className="flex items-center justify-between rounded-xl border border-border/50 p-3">
                            <div>
                              <p className="text-xs font-medium">{isAr ? "تفعيل الشريحة" : "Active"}</p>
                              <p className="text-[10px] text-muted-foreground">{isAr ? "إخفاء الشريحة من الموقع" : "Show this slide publicly"}</p>
                            </div>
                            <Switch checked={slide.is_active} onCheckedChange={v => update(slide.id, "is_active", v)} />
                          </div>
                        </TabsContent>

                        {/* ── TEMPLATE ── */}
                        <TabsContent value="template" className="mt-0 space-y-3">
                          <SectionHeading>{isAr ? "اختر قالباً" : "Choose a layout template"}</SectionHeading>
                          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                            {HERO_TEMPLATES.map(tpl => (
                              <button
                                key={tpl.id}
                                onClick={() => {
                                  update(slide.id, "template", tpl.id);
                                  update(slide.id, "text_position", tpl.defaultPosition);
                                }}
                                className={cn(
                                  "group rounded-xl border-2 p-2.5 text-start transition-all hover:border-primary/50 hover:shadow-sm",
                                  slide.template === tpl.id ? "border-primary bg-primary/5 shadow-sm" : "border-border/50 bg-card"
                                )}
                              >
                                {/* Preview image */}
                                <div className="mb-2 h-20 rounded-xl overflow-hidden bg-muted relative">
                                  <img
                                    src={slide.image_url || "https://images.unsplash.com/photo-1466637574441-749b8f19452f?w=400&q=60"}
                                    alt={tpl.label}
                                    className="h-full w-full object-cover"
                                    onError={e => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1466637574441-749b8f19452f?w=400&q=60"; }}
                                  />
                                  <div className="absolute inset-0" style={{ background: tpl.previewGradient }}>
                                    <div className={cn("absolute inset-0 flex items-end p-2", tpl.textAlign === "text-center" && "justify-center items-center", tpl.textAlign === "text-start" && "items-end")}>
                                      <div className={cn("space-y-1", tpl.textAlign)}>
                                        <div className="h-1.5 w-14 rounded-full bg-white/90" />
                                        <div className="h-1 w-9 rounded-full bg-white/55" />
                                        <div className="h-4 w-10 rounded bg-white/80 mt-1" />
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-start justify-between gap-1">
                                  <div>
                                    <p className="text-[11px] font-semibold">{tpl.label}</p>
                                    <p className="text-[10px] text-muted-foreground leading-tight mt-0.5 line-clamp-2">{tpl.description}</p>
                                  </div>
                                  {slide.template === tpl.id && (
                                    <Badge className="text-[9px] px-1.5 shrink-0">✓</Badge>
                                  )}
                                </div>
                              </button>
                            ))}
                          </div>
                        </TabsContent>

                        {/* ── DESIGN ── */}
                        <TabsContent value="design" className="mt-0 space-y-5">
                          <SectionHeading>{isAr ? "الألوان والتراكب" : "Overlay & Colors"}</SectionHeading>

                          {/* Overlay presets */}
                          <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">{isAr ? "إعدادات مسبقة" : "Quick Overlay Presets"}</Label>
                            <div className="flex flex-wrap gap-1.5">
                              {OVERLAY_PRESETS.map(p => (
                                <button
                                  key={p.label}
                                  onClick={() => {
                                    update(slide.id, "overlay_color", p.color);
                                    update(slide.id, "overlay_opacity", p.opacity);
                                  }}
                                  className="flex items-center gap-1.5 rounded-xl border border-border/50 px-2.5 py-1 text-[10px] font-medium hover:border-primary/50 transition-all"
                                >
                                  <span
                                    className="h-3 w-3 rounded-full border border-border/50"
                                    style={{ background: p.color, opacity: p.opacity / 100 + 0.3 }}
                                  />
                                  {p.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                              <Label className="text-xs text-muted-foreground">Overlay Color</Label>
                              <div className="flex items-center gap-2">
                                <input
                                  type="color"
                                  value={slide.overlay_color}
                                  onChange={e => update(slide.id, "overlay_color", e.target.value)}
                                  className="h-8 w-10 cursor-pointer rounded border border-border bg-transparent"
                                />
                                <Input
                                  value={slide.overlay_color}
                                  onChange={e => update(slide.id, "overlay_color", e.target.value)}
                                  className="h-8 text-xs font-mono flex-1"
                                  maxLength={7}
                                />
                              </div>
                            </div>

                            <FieldRow label={`Overlay Opacity: ${slide.overlay_opacity}%`}>
                              <Slider
                                value={[slide.overlay_opacity]}
                                onValueChange={([v]) => update(slide.id, "overlay_opacity", v)}
                                min={0} max={90} step={5}
                                className="w-full mt-3"
                              />
                              <div className="flex justify-between text-[9px] text-muted-foreground mt-1">
                                <span>0% Transparent</span><span>90% Very Dark</span>
                              </div>
                            </FieldRow>
                          </div>

                          <Separator />
                          <SectionHeading>{isAr ? "اتجاه التدرج وموضع النص" : "Gradient & Text Position"}</SectionHeading>
                          <div className="grid gap-3 sm:grid-cols-2">
                            <FieldRow label="Gradient Direction">
                              <Select value={slide.gradient_direction} onValueChange={v => update(slide.id, "gradient_direction", v)}>
                                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  {GRADIENT_DIRECTIONS.map(d => <SelectItem key={d.value} value={d.value} className="text-xs">{d.label}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </FieldRow>

                            <FieldRow label="Text Position">
                              <Select value={slide.text_position} onValueChange={v => update(slide.id, "text_position", v)}>
                                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  {TEXT_POSITIONS.map(p => <SelectItem key={p.value} value={p.value} className="text-xs">{p.label}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </FieldRow>
                          </div>

                          <Separator />
                          <FieldRow label={`Autoplay Speed`}>
                            <Select value={String(slide.autoplay_interval)} onValueChange={v => update(slide.id, "autoplay_interval", Number(v))}>
                              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {[3000,4000,5000,6000,8000,10000,0].map(v => (
                                  <SelectItem key={v} value={String(v)} className="text-xs">
                                    {v === 0 ? (isAr ? "بدون تشغيل تلقائي" : "No autoplay") : `${v/1000}s`}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FieldRow>
                        </TabsContent>

                        {/* ── IMAGE ── */}
                        <TabsContent value="image" className="mt-0 space-y-4">
                          <SectionHeading>{isAr ? "إعدادات الصورة" : "Image Settings"}</SectionHeading>
                          <FieldRow label="Image URL">
                            <Input
                              value={slide.image_url}
                              onChange={e => update(slide.id, "image_url", e.target.value)}
                              placeholder="https://..."
                              className="text-xs"
                            />
                          </FieldRow>

                          {slide.image_url && (
                            <div className="h-36 rounded-xl overflow-hidden border border-border/50 relative">
                              <img
                                src={slide.image_url}
                                alt="preview"
                                className="h-full w-full"
                                style={{ objectFit: slide.object_fit as any, objectPosition: slide.object_position }}
                              />
                              <div className="absolute top-2 end-2 rounded-md bg-background/70 backdrop-blur-sm px-2 py-1 text-[10px] font-mono">
                                {slide.object_fit} · {slide.object_position}
                              </div>
                            </div>
                          )}

                          <div className="grid gap-3 sm:grid-cols-2">
                            <FieldRow label="Object Fit">
                              <Select value={slide.object_fit} onValueChange={v => update(slide.id, "object_fit", v)}>
                                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="cover" className="text-xs">Cover (fill, crop)</SelectItem>
                                  <SelectItem value="contain" className="text-xs">Contain (letterbox)</SelectItem>
                                  <SelectItem value="fill" className="text-xs">Fill (stretch)</SelectItem>
                                  <SelectItem value="none" className="text-xs">None (original size)</SelectItem>
                                </SelectContent>
                              </Select>
                            </FieldRow>

                            <FieldRow label="Object Position">
                              <Select value={slide.object_position} onValueChange={v => update(slide.id, "object_position", v)}>
                                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  {OBJECT_POSITIONS.map(p => (
                                    <SelectItem key={p.value} value={p.value} className="text-xs">{p.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FieldRow>
                          </div>
                        </TabsContent>

                        {/* ── DIMENSIONS ── */}
                        <TabsContent value="dimensions" className="mt-0 space-y-4">
                          <SectionHeading>{isAr ? "أبعاد الشريحة" : "Slide Height"}</SectionHeading>
                          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                            {Object.entries(HEIGHT_PRESETS).map(([key, preset]) => (
                              <button
                                key={key}
                                onClick={() => update(slide.id, "height_preset", key)}
                                className={cn(
                                  "rounded-xl border-2 p-3 text-start transition-all hover:border-primary/50",
                                  slide.height_preset === key ? "border-primary bg-primary/5" : "border-border/50 bg-card"
                                )}
                              >
                                <p className="text-lg mb-1">{preset.icon}</p>
                                <p className="text-xs font-semibold">{preset.label}</p>
                                <p className="text-[10px] text-muted-foreground mt-0.5">{preset.desc}</p>
                              </button>
                            ))}
                          </div>

                          {slide.height_preset === "custom" && (
                            <FieldRow label="Custom Height (px)">
                              <div className="flex items-center gap-2">
                                <Input
                                  type="number"
                                  value={slide.custom_height ?? 520}
                                  onChange={e => update(slide.id, "custom_height", Number(e.target.value))}
                                  min={200} max={1200}
                                  className="text-xs"
                                />
                                <span className="text-xs text-muted-foreground shrink-0">px</span>
                              </div>
                              {slide.custom_height && (
                                <p className="text-[10px] text-muted-foreground">
                                  ≈ {(slide.custom_height / 1080 * 100).toFixed(0)}% of typical 1080p screen
                                </p>
                              )}
                            </FieldRow>
                          )}

                          <div className="rounded-xl border border-border/40 bg-muted/30 p-3 space-y-2">
                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                              {isAr ? "المعايير الموصى بها" : "Industry Standards"}
                            </p>
                            <div className="grid sm:grid-cols-3 gap-2">
                              {[
                                { icon: <Monitor className="h-3 w-3" />, label: "Desktop", spec: "16:9 · 1920×1080" },
                                { icon: <Tablet className="h-3 w-3" />,  label: "Tablet",  spec: "4:3 · 1024×768" },
                                { icon: <Smartphone className="h-3 w-3" />, label: "Mobile", spec: "9:16 · 390×844" },
                              ].map(d => (
                                <div key={d.label} className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                  {d.icon}<span>{d.label}: {d.spec}</span>
                                </div>
                              ))}
                            </div>
                            <div className="grid sm:grid-cols-3 gap-2">
                              {[
                                { label: "Hero Standard",  spec: "~520–680px tall" },
                                { label: "Editorial",      spec: "~800px tall" },
                                { label: "Full Viewport",  spec: "100vh" },
                              ].map(d => (
                                <div key={d.label} className="text-[10px] text-muted-foreground">
                                  <span className="font-medium text-foreground/70">{d.label}:</span> {d.spec}
                                </div>
                              ))}
                            </div>
                          </div>
                        </TabsContent>

                        {/* ── LINKS ── */}
                        <TabsContent value="links" className="mt-0 space-y-4">
                          {[
                            {
                              heading: isAr ? "الزر الرئيسي (CTA)" : "Primary CTA Button",
                              urlField: "link_url" as const,
                              enField: "link_label" as const,
                              arField: "link_label_ar" as const,
                              enPlaceholder: "Explore Now",
                              arPlaceholder: "استكشف الآن",
                              urlPlaceholder: "/competitions",
                            },
                            {
                              heading: isAr ? "الزر الثانوي" : "Secondary CTA Button",
                              urlField: "cta_secondary_url" as const,
                              enField: "cta_secondary_label" as const,
                              arField: "cta_secondary_label_ar" as const,
                              enPlaceholder: "Learn More",
                              arPlaceholder: "اعرف المزيد",
                              urlPlaceholder: "/about",
                            },
                          ].map(group => (
                            <div key={group.heading} className="space-y-2.5">
                              <SectionHeading>{group.heading}</SectionHeading>
                              <div className="grid gap-2.5 sm:grid-cols-3">
                                <FieldRow label="URL">
                                  <Input value={(slide[group.urlField] as string) ?? ""} onChange={e => update(slide.id, group.urlField, e.target.value)} placeholder={group.urlPlaceholder} className="h-8 text-xs" />
                                </FieldRow>
                                <FieldRow label="Label (EN)">
                                  <Input value={(slide[group.enField] as string) ?? ""} onChange={e => update(slide.id, group.enField, e.target.value)} placeholder={group.enPlaceholder} className="h-8 text-xs" />
                                </FieldRow>
                                <FieldRow label="النص (AR)">
                                  <Input dir="rtl" value={(slide[group.arField] as string) ?? ""} onChange={e => update(slide.id, group.arField, e.target.value)} placeholder={group.arPlaceholder} className="h-8 text-xs" />
                                </FieldRow>
                              </div>
                              <Separator />
                            </div>
                          ))}
                        </TabsContent>

                        {/* ── ANIMATION ── */}
                        <TabsContent value="animation" className="mt-0 space-y-4">
                          <SectionHeading>{isAr ? "تأثير الانتقال" : "Transition Effect"}</SectionHeading>
                          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                            {ANIMATION_EFFECTS.map(anim => (
                              <button
                                key={anim.value}
                                onClick={() => update(slide.id, "animation_effect", anim.value)}
                                className={cn(
                                  "rounded-xl border-2 p-3 text-start transition-all hover:border-primary/50",
                                  slide.animation_effect === anim.value ? "border-primary bg-primary/5" : "border-border/50 bg-card"
                                )}
                              >
                                <Zap className={cn("h-4 w-4 mb-1.5", slide.animation_effect === anim.value ? "text-primary" : "text-muted-foreground/50")} />
                                <p className="text-xs font-semibold">{anim.label}</p>
                                <p className="text-[10px] text-muted-foreground mt-0.5">{anim.desc}</p>
                              </button>
                            ))}
                          </div>
                        </TabsContent>
                      </Tabs>
                    </div>

                    {/* ── Right: live preview panel ── */}
                    {livePreview && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                            {isAr ? "معاينة مباشرة" : "Live Preview"}
                          </p>
                          <div className="flex items-center gap-1">
                            {(["desktop", "tablet", "mobile"] as const).map(d => (
                              <Button
                                key={d} size="icon"
                                variant={previewDevice === d ? "default" : "ghost"}
                                className="h-6 w-6"
                                onClick={() => setPreviewDevice(d)}
                              >
                                {d === "desktop" ? <Monitor className="h-3 w-3" /> : d === "tablet" ? <Tablet className="h-3 w-3" /> : <Smartphone className="h-3 w-3" />}
                              </Button>
                            ))}
                          </div>
                        </div>
                        {/* Scaled preview — fixed outer height so the transform doesn't collapse the box */}
                        <div className="rounded-xl overflow-hidden border border-border/50 bg-muted/30" style={{ height: 220 }}>
                          <div
                            className={cn(
                              "mx-auto overflow-hidden transition-all duration-300 h-full",
                              previewDevice === "desktop" ? "w-full" : previewDevice === "tablet" ? "max-w-[480px]" : "max-w-[280px]"
                            )}
                          >
                            {/* Scale so the real slide fits inside the 220px preview box */}
                            <div
                              className="origin-top-left"
                              style={{
                                transform: "scale(0.42)",
                                width: "calc(100% / 0.42)",
                                height: "calc(220px / 0.42)",
                              }}
                            >
                              <HeroSlidePreview slide={slide} />
                            </div>
                          </div>
                        </div>
                        <Button
                          size="sm" variant="outline" className="w-full gap-1.5 text-xs"
                          onClick={() => setPreviewSlide(getSlide(rawSlide))}
                        >
                          <Maximize2 className="h-3.5 w-3.5" />
                          {isAr ? "معاينة كاملة الشاشة" : "Full-screen Preview"}
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* ── Action row ── */}
                  <div className="mt-4 flex items-center justify-between gap-3 border-t border-border/40 pt-4">
                    <Button
                      size="sm" variant="destructive" className="gap-1.5"
                      onClick={() => { if (confirm(isAr ? "حذف هذه الشريحة؟" : "Delete this slide?")) remove.mutate(slide.id); }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      {isAr ? "حذف" : "Delete"}
                    </Button>
                    <div className="flex gap-2">
                      <Button
                        size="sm" variant="outline" className="gap-1.5"
                        onClick={() => duplicate.mutate(getSlide(rawSlide))}
                        disabled={duplicate.isPending}
                      >
                        <Copy className="h-3.5 w-3.5" />
                        {isAr ? "نسخ" : "Duplicate"}
                      </Button>
                      <Button
                        size="sm" className="gap-1.5"
                        onClick={() => handleSave(rawSlide)}
                        disabled={save.isPending || !isDirty}
                      >
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
          <div className="rounded-2xl border-2 border-dashed border-border/50 py-16 text-center">
            <Layout className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">{isAr ? "لا توجد شرائح بعد" : "No slides yet"}</p>
            <p className="text-xs text-muted-foreground/60 mt-1">{isAr ? "أضف شريحتك الأولى للبدء" : "Add your first slide to get started"}</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {HERO_TEMPLATES.map(tpl => (
                <Button key={tpl.id} size="sm" variant="outline" onClick={() => create.mutate(tpl.id)} disabled={create.isPending}>
                  <Plus className="h-3.5 w-3.5 me-1" />{tpl.label}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Full-screen preview modal ── */}
      {previewSlide && (
        <div className="fixed inset-0 z-50 bg-background/90 backdrop-blur-md flex flex-col">
          {/* Modal header */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/40 bg-card/80 backdrop-blur-sm shrink-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold truncate max-w-[200px]">{previewSlide.title}</p>
              <Badge variant="outline" className="text-[10px]">
                {HERO_TEMPLATES.find(t => t.id === previewSlide.template)?.label}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-1 border border-border/50 rounded-xl p-0.5">
                {(["desktop", "tablet", "mobile"] as const).map(d => (
                  <Button
                    key={d} size="icon"
                    variant={previewDevice === d ? "default" : "ghost"}
                    className="h-7 w-7"
                    onClick={() => setPreviewDevice(d)}
                  >
                    {d === "desktop" ? <Monitor className="h-3.5 w-3.5" /> : d === "tablet" ? <Tablet className="h-3.5 w-3.5" /> : <Smartphone className="h-3.5 w-3.5" />}
                  </Button>
                ))}
              </div>
              <Button size="sm" variant="ghost" className="gap-1.5" onClick={() => setPreviewSlide(null)}>
                <X className="h-4 w-4" />
                {isAr ? "إغلاق" : "Close"}
              </Button>
            </div>
          </div>

          {/* Preview area */}
          <div className="flex-1 overflow-auto p-4 flex items-start justify-center">
            <div className={cn(
              "w-full transition-all duration-300 rounded-xl overflow-hidden shadow-2xl border border-border/30",
              previewDevice === "desktop" ? "max-w-5xl" : previewDevice === "tablet" ? "max-w-[768px]" : "max-w-[390px]"
            )}>
              <HeroSlidePreview slide={previewSlide} />
            </div>
          </div>

          {/* Footer with info */}
          <div className="px-4 py-2 border-t border-border/40 bg-card/60 backdrop-blur-sm shrink-0">
            <div className="flex items-center justify-center gap-4 text-[10px] text-muted-foreground">
              <span>Template: {templateLabels[previewSlide.template]}</span>
              <span>·</span>
              <span>Height: {HEIGHT_PRESETS[previewSlide.height_preset]?.label ?? previewSlide.height_preset}</span>
              <span>·</span>
              <span>Overlay: {previewSlide.overlay_opacity}%</span>
              <span>·</span>
              <span>Motion: {ANIMATION_EFFECTS.find(a => a.value === previewSlide.animation_effect)?.label}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
