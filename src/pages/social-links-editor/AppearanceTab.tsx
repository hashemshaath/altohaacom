import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Palette, Smartphone, Type, Calendar, LayoutList, LayoutGrid, AlignLeft, AlignCenter, AlignRight, ArrowLeftRight, Plus, Trash2 } from "lucide-react";
import { THEMES, BUTTON_STYLES, FONT_SIZES } from "./constants";
import { FONT_FAMILIES } from "@/lib/socialLinksConstants";
import { Loader2 } from "lucide-react";
import type { EditorSharedProps } from "./types";
import { MS_PER_DAY, MS_PER_WEEK } from "@/lib/constants";

interface Props extends EditorSharedProps {
  uploading: boolean;
  handleBgUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const AppearanceTab = memo(function AppearanceTab({ form, updateForm, extra, updateExtra, isAr, uploading, handleBgUpload }: Props) {
  return (
    <div className="space-y-4 mt-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Theme */}
      <Card className="overflow-hidden border-border/40">
        <CardHeader className="pb-3 bg-muted/30">
          <CardTitle className="text-sm flex items-center gap-2">
            <div className="h-7 w-7 rounded-xl bg-primary/10 flex items-center justify-center">
              <Palette className="h-3.5 w-3.5 text-primary" />
            </div>
            {isAr ? "الثيم" : "Theme"}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-3">
          <div className="grid grid-cols-4 gap-2">
            {THEMES.map(t => (
              <button key={t.id} onClick={() => updateForm({ theme: t.id })}
                className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border-2 transition-all duration-200 ${form.theme === t.id ? "border-primary ring-2 ring-primary/15 shadow-sm" : "border-transparent hover:border-border"}`}>
                <div className={`w-full h-10 rounded-xl ${t.preview} shadow-inner`} />
                <span className="text-xs font-medium">{isAr ? t.labelAr : t.label}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Scheduled Themes */}
      <Card className="overflow-hidden border-border/40">
        <CardHeader className="pb-3 bg-muted/30">
          <CardTitle className="text-sm flex items-center gap-2">
            <div className="h-7 w-7 rounded-xl bg-primary/10 flex items-center justify-center">
              <Calendar className="h-3.5 w-3.5 text-primary" />
            </div>
            {isAr ? "جدولة مظهر الصفحة" : "Scheduled Themes"}
            {(extra.scheduled_themes?.length || 0) > 0 && (
              <Badge variant="secondary" className="text-xs ms-auto">{extra.scheduled_themes.length}</Badge>
            )}
          </CardTitle>
          <p className="text-xs text-muted-foreground">{isAr ? "تغيير الثيم تلقائياً حسب التاريخ أو المناسبة" : "Auto-switch theme based on date or occasion"}</p>
        </CardHeader>
        <CardContent className="space-y-3 pt-3">
          {(extra.scheduled_themes || []).map((sched, idx) => {
            const now = new Date();
            const isActive = new Date(sched.start_date) <= now && now <= new Date(sched.end_date);
            const isPast = new Date(sched.end_date) < now;
            return (
              <div key={sched.id} className={`relative rounded-xl border p-3 space-y-2 transition-all ${isActive ? "border-primary/40 bg-primary/5" : isPast ? "border-border/30 opacity-60" : "border-border/50"}`}>
                {isActive && <Badge className="absolute -top-2 end-2 text-xs px-1.5 py-0">{isAr ? "نشط الآن" : "Active"}</Badge>}
                <div className="flex items-center gap-2">
                  <div className={`w-5 h-5 rounded-md shadow-inner ${THEMES.find(t => t.id === sched.theme_id)?.preview || "bg-muted"}`} />
                  <Input value={isAr ? sched.label_ar : sched.label} onChange={e => {
                    const updated = [...extra.scheduled_themes];
                    if (isAr) updated[idx] = { ...updated[idx], label_ar: e.target.value };
                    else updated[idx] = { ...updated[idx], label: e.target.value };
                    updateExtra({ scheduled_themes: updated });
                  }} placeholder={isAr ? "اسم المناسبة (رمضان، عيد...)" : "Occasion name (Ramadan, Eid...)"} className="h-7 text-xs flex-1" />
                  <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0 text-destructive/70 hover:text-destructive" onClick={() => {
                    updateExtra({ scheduled_themes: extra.scheduled_themes.filter((_, i) => i !== idx) });
                  }}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
                <Select value={sched.theme_id} onValueChange={v => {
                  const updated = [...extra.scheduled_themes];
                  updated[idx] = { ...updated[idx], theme_id: v };
                  updateExtra({ scheduled_themes: updated });
                }}>
                  <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {THEMES.map(t => (
                      <SelectItem key={t.id} value={t.id}>
                        <span className="flex items-center gap-2">
                          <span className={`w-3 h-3 rounded-sm inline-block ${t.preview}`} />
                          {isAr ? t.labelAr : t.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs mb-0.5 block">{isAr ? "من" : "Start"}</Label>
                    <Input type="date" value={sched.start_date} onChange={e => {
                      const updated = [...extra.scheduled_themes];
                      updated[idx] = { ...updated[idx], start_date: e.target.value };
                      updateExtra({ scheduled_themes: updated });
                    }} className="h-7 text-xs" dir="ltr" />
                  </div>
                  <div>
                    <Label className="text-xs mb-0.5 block">{isAr ? "إلى" : "End"}</Label>
                    <Input type="date" value={sched.end_date} onChange={e => {
                      const updated = [...extra.scheduled_themes];
                      updated[idx] = { ...updated[idx], end_date: e.target.value };
                      updateExtra({ scheduled_themes: updated });
                    }} className="h-7 text-xs" dir="ltr" />
                  </div>
                </div>
              </div>
            );
          })}
          <Button variant="outline" size="sm" className="w-full text-xs gap-1.5 h-8" onClick={() => {
            const newSched = {
              id: Date.now().toString(36), theme_id: "gold",
              start_date: new Date().toISOString().slice(0, 10),
              end_date: new Date(Date.now() + MS_PER_WEEK).toISOString().slice(0, 10),
              label: "New Occasion", label_ar: "مناسبة جديدة",
            };
            updateExtra({ scheduled_themes: [...(extra.scheduled_themes || []), newSched] });
          }}>
            <Plus className="h-3.5 w-3.5" />
            {isAr ? "إضافة جدولة ثيم" : "Add Scheduled Theme"}
          </Button>
        </CardContent>
      </Card>

      {/* Font */}
      <Card className="overflow-hidden border-border/40">
        <CardHeader className="pb-3 bg-muted/30">
          <CardTitle className="text-sm flex items-center gap-2">
            <div className="h-7 w-7 rounded-xl bg-primary/10 flex items-center justify-center">
              <Type className="h-3.5 w-3.5 text-primary" />
            </div>
            {isAr ? "الخط" : "Font"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-3">
          <div>
            <Label className="text-xs mb-2 block font-medium">{isAr ? "نوع الخط" : "Font Family"}</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {FONT_FAMILIES.map(f => (
                <button key={f.id} onClick={() => updateForm({ font_family: f.id })}
                  className={`text-xs py-2 px-2 rounded-xl border-2 transition-all duration-200 ${form.font_family === f.id ? "border-primary bg-primary/5 font-semibold shadow-sm" : "border-transparent bg-muted/30 hover:bg-muted/50"}`}
                  style={{ fontFamily: f.css }}>
                  {isAr ? f.labelAr : f.label}
                </button>
              ))}
            </div>
          </div>
          <Separator />
          <div>
            <Label className="text-xs mb-2 block font-medium">{isAr ? "حجم الخط" : "Font Size"}</Label>
            <div className="grid grid-cols-4 gap-1.5">
              {FONT_SIZES.map(s => (
                <button key={s.id} onClick={() => updateExtra({ font_size: s.id })}
                  className={`text-xs py-2 px-2 rounded-xl border-2 transition-all duration-200 ${extra.font_size === s.id ? "border-primary bg-primary/5 font-semibold shadow-sm" : "border-transparent bg-muted/30 hover:bg-muted/50"}`}>
                  {isAr ? s.labelAr : s.label}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Layout & Alignment */}
      <Card className="overflow-hidden border-border/40">
        <CardHeader className="pb-3 bg-muted/30">
          <CardTitle className="text-sm flex items-center gap-2">
            <div className="h-7 w-7 rounded-xl bg-primary/10 flex items-center justify-center">
              <LayoutList className="h-3.5 w-3.5 text-primary" />
            </div>
            {isAr ? "التخطيط والمحاذاة" : "Layout & Alignment"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-3">
          <div>
            <Label className="text-xs mb-2 block font-medium">{isAr ? "محاذاة النص" : "Text Alignment"}</Label>
            <div className="grid grid-cols-3 gap-1.5">
              {([
                { id: "start" as const, label: isAr ? "بداية" : "Start", icon: AlignLeft },
                { id: "center" as const, label: isAr ? "وسط" : "Center", icon: AlignCenter },
                { id: "end" as const, label: isAr ? "نهاية" : "End", icon: AlignRight },
              ]).map(a => (
                <button key={a.id} onClick={() => updateExtra({ text_align: a.id })}
                  className={`flex items-center justify-center gap-1.5 text-xs py-2.5 px-2 rounded-xl border-2 transition-all duration-200 ${extra.text_align === a.id ? "border-primary bg-primary/5 font-semibold shadow-sm" : "border-transparent bg-muted/30 hover:bg-muted/50"}`}>
                  <a.icon className="h-3.5 w-3.5" />{a.label}
                </button>
              ))}
            </div>
          </div>
          <Separator />
          <div>
            <Label className="text-xs mb-2 block font-medium">{isAr ? "اتجاه النص" : "Text Direction"}</Label>
            <div className="grid grid-cols-3 gap-1.5">
              {([
                { id: "auto" as const, label: isAr ? "تلقائي" : "Auto", icon: ArrowLeftRight },
                { id: "ltr" as const, label: "LTR", icon: AlignLeft },
                { id: "rtl" as const, label: "RTL", icon: AlignRight },
              ]).map(d => (
                <button key={d.id} onClick={() => updateExtra({ text_direction: d.id })}
                  className={`flex items-center justify-center gap-1.5 text-xs py-2.5 px-2 rounded-xl border-2 transition-all duration-200 ${extra.text_direction === d.id ? "border-primary bg-primary/5 font-semibold shadow-sm" : "border-transparent bg-muted/30 hover:bg-muted/50"}`}>
                  <d.icon className="h-3.5 w-3.5" />{d.label}
                </button>
              ))}
            </div>
          </div>
          <Separator />
          <div>
            <Label className="text-xs mb-2 block font-medium">{isAr ? "تخطيط الروابط" : "Link Layout"}</Label>
            <div className="grid grid-cols-2 gap-1.5">
              {([
                { id: "list" as const, label: isAr ? "قائمة" : "List", icon: LayoutList },
                { id: "grid" as const, label: isAr ? "شبكة" : "Grid", icon: LayoutGrid },
              ]).map(l => (
                <button key={l.id} onClick={() => updateExtra({ link_layout: l.id })}
                  className={`flex items-center justify-center gap-1.5 text-xs py-2.5 px-2 rounded-xl border-2 transition-all duration-200 ${extra.link_layout === l.id ? "border-primary bg-primary/5 font-semibold shadow-sm" : "border-transparent bg-muted/30 hover:bg-muted/50"}`}>
                  <l.icon className="h-3.5 w-3.5" />{l.label}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Button Style */}
      <Card className="overflow-hidden border-border/40">
        <CardHeader className="pb-3 bg-muted/30">
          <CardTitle className="text-sm flex items-center gap-2">
            <div className="h-7 w-7 rounded-xl bg-primary/10 flex items-center justify-center">
              <Smartphone className="h-3.5 w-3.5 text-primary" />
            </div>
            {isAr ? "شكل الأزرار" : "Button Style"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-3">
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
            {BUTTON_STYLES.map(s => (
              <button key={s.id} onClick={() => updateForm({ button_style: s.id })}
                className={`text-xs py-2 px-2 rounded-xl border-2 transition-all duration-200 ${form.button_style === s.id ? "border-primary bg-primary/5 font-semibold shadow-sm" : "border-transparent bg-muted/30 hover:bg-muted/50"}`}>
                {isAr ? s.labelAr : s.label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs mb-1.5 block font-medium">{isAr ? "لون الأزرار" : "Button Color"}</Label>
              <div className="flex gap-2 items-center">
                <input type="color" value={form.button_color} onChange={e => updateForm({ button_color: e.target.value })} className="h-9 w-12 rounded-xl cursor-pointer border border-border/30" />
                <Input value={form.button_color} onChange={e => updateForm({ button_color: e.target.value })} className="text-xs font-mono h-9" dir="ltr" />
              </div>
            </div>
            <div>
              <Label className="text-xs mb-1.5 block font-medium">{isAr ? "لون النص" : "Text Color"}</Label>
              <div className="flex gap-2 items-center">
                <input type="color" value={form.text_color} onChange={e => updateForm({ text_color: e.target.value })} className="h-9 w-12 rounded-xl cursor-pointer border border-border/30" />
                <Input value={form.text_color} onChange={e => updateForm({ text_color: e.target.value })} className="text-xs font-mono h-9" dir="ltr" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Background Image */}
      <Card className="overflow-hidden border-border/40">
        <CardHeader className="pb-3 bg-muted/30">
          <CardTitle className="text-sm flex items-center gap-2">
            <div className="h-7 w-7 rounded-xl bg-primary/10 flex items-center justify-center">
              <Palette className="h-3.5 w-3.5 text-primary" />
            </div>
            {isAr ? "صورة الخلفية" : "Background Image"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-3">
          {form.background_image_url && (
            <div className="relative group rounded-xl overflow-hidden">
              <img loading="lazy" src={form.background_image_url} alt="BG" className="w-full h-32 object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Button size="sm" variant="destructive" className="h-8 text-xs gap-1" onClick={() => updateForm({ background_image_url: "" })}>
                  <Trash2 className="h-3 w-3" />{isAr ? "إزالة" : "Remove"}
                </Button>
              </div>
            </div>
          )}
          <div>
            <Label htmlFor="bg-upload" className="cursor-pointer">
              <div className="border-2 border-dashed border-border/40 rounded-xl p-5 text-center hover:border-primary/30 transition-all duration-200 hover:bg-muted/20">
                {uploading ? <Loader2 className="h-6 w-6 mx-auto text-primary animate-spin mb-2" /> : <Palette className="h-6 w-6 mx-auto text-muted-foreground mb-2" />}
                <p className="text-xs text-muted-foreground">{uploading ? (isAr ? "جاري الرفع..." : "Uploading...") : (isAr ? "اضغط لرفع صورة خلفية" : "Click to upload background image")}</p>
              </div>
            </Label>
            <input id="bg-upload" type="file" accept="image/*" className="hidden" onChange={handleBgUpload} disabled={uploading} />
          </div>
          <Input placeholder={isAr ? "أو أدخل رابط الصورة" : "Or enter image URL"} value={form.background_image_url} onChange={e => updateForm({ background_image_url: e.target.value })} dir="ltr" className="text-xs" />
        </CardContent>
      </Card>
    </div>
  );
});
