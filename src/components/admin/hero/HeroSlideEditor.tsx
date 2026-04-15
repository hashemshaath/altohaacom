import { memo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { CardContent } from "@/components/ui/card";
import {
  Trash2, Save, Loader2, Image, Type, Link2, Palette, Monitor,
  Smartphone, Tablet, LayoutTemplate, Copy, Zap, Maximize2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { HERO_TEMPLATES } from "./heroTemplates";
import { HeroSlidePreview } from "./HeroSlidePreview";
import {
  HEIGHT_PRESETS, TEXT_POSITIONS, GRADIENT_DIRECTIONS,
  ANIMATION_EFFECTS, OBJECT_POSITIONS, OVERLAY_PRESETS,
  type HeroSlide,
} from "./heroSlideConstants";

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground/70 mb-2">
      {children}
    </p>
  );
}

interface Props {
  slide: HeroSlide;
  rawSlide: HeroSlide;
  isDirty: boolean;
  isAr: boolean;
  livePreview: boolean;
  previewDevice: "desktop" | "tablet" | "mobile";
  setPreviewDevice: (d: "desktop" | "tablet" | "mobile") => void;
  update: (id: string, field: keyof HeroSlide, value: unknown) => void;
  onSave: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onFullPreview: () => void;
  saving: boolean;
  duplicating: boolean;
}

export const HeroSlideEditor = memo(function HeroSlideEditor({
  slide, rawSlide, isDirty, isAr, livePreview, previewDevice, setPreviewDevice,
  update, onSave, onDelete, onDuplicate, onFullPreview, saving, duplicating,
}: Props) {
  return (
    <CardContent className="border-t border-border/40 pt-4 pb-5 p-4">
      <div className={cn("gap-5", livePreview ? "grid lg:grid-cols-2" : "block")}>
        {/* Left: tabs editor */}
        <div>
          <Tabs defaultValue="content" className="space-y-3">
            <TabsList className="h-8 flex-wrap gap-0.5 h-auto">
              <TabsTrigger value="content"    className="h-7 px-2 text-[12px] gap-1"><Type className="h-3 w-3" />{isAr ? "المحتوى" : "Content"}</TabsTrigger>
              <TabsTrigger value="template"   className="h-7 px-2 text-[12px] gap-1"><LayoutTemplate className="h-3 w-3" />{isAr ? "القالب" : "Template"}</TabsTrigger>
              <TabsTrigger value="design"     className="h-7 px-2 text-[12px] gap-1"><Palette className="h-3 w-3" />{isAr ? "التصميم" : "Design"}</TabsTrigger>
              <TabsTrigger value="image"      className="h-7 px-2 text-[12px] gap-1"><Image className="h-3 w-3" />{isAr ? "الصورة" : "Image"}</TabsTrigger>
              <TabsTrigger value="dimensions" className="h-7 px-2 text-[12px] gap-1"><Monitor className="h-3 w-3" />{isAr ? "الأبعاد" : "Size"}</TabsTrigger>
              <TabsTrigger value="links"      className="h-7 px-2 text-[12px] gap-1"><Link2 className="h-3 w-3" />{isAr ? "الروابط" : "Links"}</TabsTrigger>
              <TabsTrigger value="animation"  className="h-7 px-2 text-[12px] gap-1"><Zap className="h-3 w-3" />{isAr ? "الحركة" : "Motion"}</TabsTrigger>
            </TabsList>

            {/* CONTENT */}
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
                  <p className="text-[12px] text-muted-foreground">{isAr ? "إخفاء الشريحة من الموقع" : "Show this slide publicly"}</p>
                </div>
                <Switch checked={slide.is_active} onCheckedChange={v => update(slide.id, "is_active", v)} />
              </div>
            </TabsContent>

            {/* TEMPLATE */}
            <TabsContent value="template" className="mt-0 space-y-3">
              <SectionHeading>{isAr ? "اختر قالباً" : "Choose a layout template"}</SectionHeading>
              <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                {HERO_TEMPLATES.map(tpl => (
                  <button
                    key={tpl.id}
                    onClick={() => { update(slide.id, "template", tpl.id); update(slide.id, "text_position", tpl.defaultPosition); }}
                    className={cn(
                      "group rounded-xl border-2 p-2.5 text-start transition-all hover:border-primary/50 hover:shadow-sm",
                      slide.template === tpl.id ? "border-primary bg-primary/5 shadow-sm" : "border-border/50 bg-card"
                    )}
                  >
                    <div className="mb-2 h-20 rounded-xl overflow-hidden bg-muted relative">
                      <img src={slide.image_url || "https://images.unsplash.com/photo-1466637574441-749b8f19452f?w=400&q=60"} alt={tpl.label} className="h-full w-full object-cover" loading="lazy" onError={e => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1466637574441-749b8f19452f?w=400&q=60"; }} />
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
                        <p className="text-[12px] font-semibold">{tpl.label}</p>
                        <p className="text-[12px] text-muted-foreground leading-tight mt-0.5 line-clamp-2">{tpl.description}</p>
                      </div>
                      {slide.template === tpl.id && <Badge className="text-[12px] px-1.5 shrink-0">✓</Badge>}
                    </div>
                  </button>
                ))}
              </div>
            </TabsContent>

            {/* DESIGN */}
            <TabsContent value="design" className="mt-0 space-y-5">
              <SectionHeading>{isAr ? "الألوان والتراكب" : "Overlay & Colors"}</SectionHeading>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">{isAr ? "إعدادات مسبقة" : "Quick Overlay Presets"}</Label>
                <div className="flex flex-wrap gap-1.5">
                  {OVERLAY_PRESETS.map(p => (
                    <button key={p.label} onClick={() => { update(slide.id, "overlay_color", p.color); update(slide.id, "overlay_opacity", p.opacity); }} className="flex items-center gap-1.5 rounded-xl border border-border/50 px-2.5 py-1 text-[12px] font-medium hover:border-primary/50 transition-all">
                      <span className="h-3 w-3 rounded-full border border-border/50" style={{ background: p.color, opacity: p.opacity / 100 + 0.3 }} />
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Overlay Color</Label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={slide.overlay_color} onChange={e => update(slide.id, "overlay_color", e.target.value)} className="h-8 w-10 cursor-pointer rounded border border-border bg-transparent" />
                    <Input value={slide.overlay_color} onChange={e => update(slide.id, "overlay_color", e.target.value)} className="h-8 text-xs font-mono flex-1" maxLength={7} />
                  </div>
                </div>
                <FieldRow label={`Overlay Opacity: ${slide.overlay_opacity}%`}>
                  <Slider value={[slide.overlay_opacity]} onValueChange={([v]) => update(slide.id, "overlay_opacity", v)} min={0} max={90} step={5} className="w-full mt-3" />
                  <div className="flex justify-between text-[12px] text-muted-foreground mt-1">
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
                    <SelectContent>{GRADIENT_DIRECTIONS.map(d => <SelectItem key={d.value} value={d.value} className="text-xs">{d.label}</SelectItem>)}</SelectContent>
                  </Select>
                </FieldRow>
                <FieldRow label="Text Position">
                  <Select value={slide.text_position} onValueChange={v => update(slide.id, "text_position", v)}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>{TEXT_POSITIONS.map(p => <SelectItem key={p.value} value={p.value} className="text-xs">{p.label}</SelectItem>)}</SelectContent>
                  </Select>
                </FieldRow>
              </div>
              <Separator />
              <FieldRow label="Autoplay Speed">
                <Select value={String(slide.autoplay_interval)} onValueChange={v => update(slide.id, "autoplay_interval", Number(v))}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[3000, 4000, 5000, 6000, 8000, 10000, 0].map(v => (
                      <SelectItem key={v} value={String(v)} className="text-xs">
                        {v === 0 ? (isAr ? "بدون تشغيل تلقائي" : "No autoplay") : `${v / 1000}s`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldRow>
            </TabsContent>

            {/* IMAGE */}
            <TabsContent value="image" className="mt-0 space-y-4">
              <SectionHeading>{isAr ? "إعدادات الصورة" : "Image Settings"}</SectionHeading>
              <FieldRow label="Image URL">
                <Input value={slide.image_url} onChange={e => update(slide.id, "image_url", e.target.value)} placeholder="https://..." className="text-xs" />
              </FieldRow>
              {slide.image_url && (
                <div className="h-36 rounded-xl overflow-hidden border border-border/50 relative">
                  <img src={slide.image_url} alt={isAr ? "معاينة الشريحة" : "Slide preview"} className="h-full w-full" loading="lazy" style={{ objectFit: slide.object_fit as React.CSSProperties["objectFit"], objectPosition: slide.object_position }} />
                  <div className="absolute top-2 end-2 rounded-md bg-background/70 backdrop-blur-sm px-2 py-1 text-[12px] font-mono">{slide.object_fit} · {slide.object_position}</div>
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
                    <SelectContent>{OBJECT_POSITIONS.map(p => <SelectItem key={p.value} value={p.value} className="text-xs">{p.label}</SelectItem>)}</SelectContent>
                  </Select>
                </FieldRow>
              </div>
            </TabsContent>

            {/* DIMENSIONS */}
            <TabsContent value="dimensions" className="mt-0 space-y-4">
              <SectionHeading>{isAr ? "أبعاد الشريحة" : "Slide Height"}</SectionHeading>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {Object.entries(HEIGHT_PRESETS).map(([key, preset]) => (
                  <button key={key} onClick={() => update(slide.id, "height_preset", key)} className={cn("rounded-xl border-2 p-3 text-start transition-all hover:border-primary/50", slide.height_preset === key ? "border-primary bg-primary/5" : "border-border/50 bg-card")}>
                    <p className="text-lg mb-1">{preset.icon}</p>
                    <p className="text-xs font-semibold">{preset.label}</p>
                    <p className="text-[12px] text-muted-foreground mt-0.5">{preset.desc}</p>
                  </button>
                ))}
              </div>
              {slide.height_preset === "custom" && (
                <FieldRow label="Custom Height (px)">
                  <div className="flex items-center gap-2">
                    <Input type="number" value={slide.custom_height ?? 520} onChange={e => update(slide.id, "custom_height", Number(e.target.value))} min={200} max={1200} className="text-xs" />
                    <span className="text-xs text-muted-foreground shrink-0">px</span>
                  </div>
                  {slide.custom_height && <p className="text-[12px] text-muted-foreground">≈ {(slide.custom_height / 1080 * 100).toFixed(0)}% of typical 1080p screen</p>}
                </FieldRow>
              )}
              <div className="rounded-xl border border-border/40 bg-muted/30 p-3 space-y-2">
                <p className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wide">{isAr ? "المعايير الموصى بها" : "Industry Standards"}</p>
                <div className="grid sm:grid-cols-3 gap-2">
                  {[
                    { icon: <Monitor className="h-3 w-3" />, label: "Desktop", spec: "16:9 · 1920×1080" },
                    { icon: <Tablet className="h-3 w-3" />, label: "Tablet", spec: "4:3 · 1024×768" },
                    { icon: <Smartphone className="h-3 w-3" />, label: "Mobile", spec: "9:16 · 390×844" },
                  ].map(d => (
                    <div key={d.label} className="flex items-center gap-2 text-[12px] text-muted-foreground">{d.icon}<span>{d.label}: {d.spec}</span></div>
                  ))}
                </div>
                <div className="grid sm:grid-cols-3 gap-2">
                  {[
                    { label: "Hero Standard", spec: "~520–680px tall" },
                    { label: "Editorial", spec: "~800px tall" },
                    { label: "Full Viewport", spec: "100vh" },
                  ].map(d => (
                    <div key={d.label} className="text-[12px] text-muted-foreground"><span className="font-medium text-foreground/70">{d.label}:</span> {d.spec}</div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* LINKS */}
            <TabsContent value="links" className="mt-0 space-y-4">
              {[
                { heading: isAr ? "الزر الرئيسي (CTA)" : "Primary CTA Button", urlField: "link_url" as const, enField: "link_label" as const, arField: "link_label_ar" as const, enPlaceholder: "Explore Now", arPlaceholder: "استكشف الآن", urlPlaceholder: "/competitions" },
                { heading: isAr ? "الزر الثانوي" : "Secondary CTA Button", urlField: "cta_secondary_url" as const, enField: "cta_secondary_label" as const, arField: "cta_secondary_label_ar" as const, enPlaceholder: "Learn More", arPlaceholder: "اعرف المزيد", urlPlaceholder: "/about" },
              ].map(group => (
                <div key={group.heading} className="space-y-2.5">
                  <SectionHeading>{group.heading}</SectionHeading>
                  <div className="grid gap-2.5 sm:grid-cols-3">
                    <FieldRow label="URL"><Input value={(slide[group.urlField] as string) ?? ""} onChange={e => update(slide.id, group.urlField, e.target.value)} placeholder={group.urlPlaceholder} className="h-8 text-xs" /></FieldRow>
                    <FieldRow label="Label (EN)"><Input value={(slide[group.enField] as string) ?? ""} onChange={e => update(slide.id, group.enField, e.target.value)} placeholder={group.enPlaceholder} className="h-8 text-xs" /></FieldRow>
                    <FieldRow label="النص (AR)"><Input dir="rtl" value={(slide[group.arField] as string) ?? ""} onChange={e => update(slide.id, group.arField, e.target.value)} placeholder={group.arPlaceholder} className="h-8 text-xs" /></FieldRow>
                  </div>
                  <Separator />
                </div>
              ))}
            </TabsContent>

            {/* ANIMATION */}
            <TabsContent value="animation" className="mt-0 space-y-4">
              <SectionHeading>{isAr ? "تأثير الانتقال" : "Transition Effect"}</SectionHeading>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {ANIMATION_EFFECTS.map(anim => (
                  <button key={anim.value} onClick={() => update(slide.id, "animation_effect", anim.value)} className={cn("rounded-xl border-2 p-3 text-start transition-all hover:border-primary/50", slide.animation_effect === anim.value ? "border-primary bg-primary/5" : "border-border/50 bg-card")}>
                    <Zap className={cn("h-4 w-4 mb-1.5", slide.animation_effect === anim.value ? "text-primary" : "text-muted-foreground/50")} />
                    <p className="text-xs font-semibold">{anim.label}</p>
                    <p className="text-[12px] text-muted-foreground mt-0.5">{anim.desc}</p>
                  </button>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right: live preview */}
        {livePreview && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground">{isAr ? "معاينة مباشرة" : "Live Preview"}</p>
              <div className="flex items-center gap-1">
                {(["desktop", "tablet", "mobile"] as const).map(d => (
                  <Button key={d} size="icon" variant={previewDevice === d ? "default" : "ghost"} className="h-6 w-6" onClick={() => setPreviewDevice(d)}>
                    {d === "desktop" ? <Monitor className="h-3 w-3" /> : d === "tablet" ? <Tablet className="h-3 w-3" /> : <Smartphone className="h-3 w-3" />}
                  </Button>
                ))}
              </div>
            </div>
            <div className="rounded-xl overflow-hidden border border-border/50 bg-muted/30" style={{ height: 220 }}>
              <div className={cn("mx-auto overflow-hidden transition-all duration-300 h-full", previewDevice === "desktop" ? "w-full" : previewDevice === "tablet" ? "max-w-[480px]" : "max-w-[280px]")}>
                <div className="origin-top-left" style={{ transform: "scale(0.42)", width: "calc(100% / 0.42)", height: "calc(220px / 0.42)" }}>
                  <HeroSlidePreview slide={slide} />
                </div>
              </div>
            </div>
            <Button size="sm" variant="outline" className="w-full gap-1.5 text-xs" onClick={onFullPreview}>
              <Maximize2 className="h-3.5 w-3.5" />{isAr ? "معاينة كاملة الشاشة" : "Full-screen Preview"}
            </Button>
          </div>
        )}
      </div>

      {/* Action row */}
      <div className="mt-4 flex items-center justify-between gap-3 border-t border-border/40 pt-4">
        <Button size="sm" variant="destructive" className="gap-1.5" onClick={onDelete}>
          <Trash2 className="h-3.5 w-3.5" />{isAr ? "حذف" : "Delete"}
        </Button>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="gap-1.5" onClick={onDuplicate} disabled={duplicating}>
            <Copy className="h-3.5 w-3.5" />{isAr ? "نسخ" : "Duplicate"}
          </Button>
          <Button size="sm" className="gap-1.5" onClick={onSave} disabled={saving || !isDirty}>
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            {isAr ? "حفظ" : "Save"}
          </Button>
        </div>
      </div>
    </CardContent>
  );
});
