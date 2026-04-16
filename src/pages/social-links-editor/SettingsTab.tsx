import { memo, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Settings2, Eye, Globe, Sparkles, LayoutGrid, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { EditorSharedProps } from "./types";

/**
 * TYPOGRAPHY POLICY — ALTOHA DESIGN SYSTEM
 * Minimum font size: 11px (0.6875rem) desktop / 13px (0.8125rem) mobile.
 * Do NOT use `text-xs` on body text — only on badges & labels.
 * Scale: display(48) h1(36) h2(28) h3(22) h4(18) body-lg(18) body(16) body-sm(14) caption(13) label(12) overline(11).
 * IBM Plex Arabic required on all text.
 * See src/styles/typography.css for the complete policy.
 */

export const SettingsTab = memo(function SettingsTab({ form, updateForm, extra, updateExtra, profile, isAr }: EditorSharedProps) {
  const settings = useMemo(() => [
    { key: "show_avatar", label: isAr ? "إظهار الصورة الشخصية" : "Show Avatar", icon: Eye },
    { key: "show_social_icons", label: isAr ? "إظهار أيقونات التواصل" : "Show Social Icons", icon: Globe },
    { key: "is_published", label: isAr ? "نشر الصفحة" : "Published", icon: Sparkles },
  ], [isAr]);

  return (
    <div className="space-y-4 mt-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <Card className="overflow-hidden border-border/40">
        <CardHeader className="pb-3 bg-muted/30">
          <CardTitle className="text-sm flex items-center gap-2">
            <div className="h-7 w-7 rounded-xl bg-primary/10 flex items-center justify-center">
              <Settings2 className="h-3.5 w-3.5 text-primary" />
            </div>
            {isAr ? "المعلومات الأساسية" : "Basic Info"}
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            {isAr ? "يتم تعبئة الاسم والنبذة تلقائياً من بروفايلك" : "Name & bio are auto-filled from your profile"}
          </p>
        </CardHeader>
        <CardContent className="space-y-3 pt-3">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">{isAr ? "عنوان الصفحة (EN)" : "Page Title (EN)"}</Label>
              <Input value={form.page_title} onChange={e => updateForm({ page_title: e.target.value })} dir="ltr" placeholder={profile?.display_name || profile?.full_name || ""} className="rounded-xl border-border/40 bg-muted/20 focus:bg-background h-10" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">{isAr ? "عنوان الصفحة (AR)" : "Page Title (AR)"}</Label>
              <Input value={form.page_title_ar} onChange={e => updateForm({ page_title_ar: e.target.value })} dir="rtl" placeholder={profile?.display_name_ar || profile?.full_name_ar || ""} className="rounded-xl border-border/40 bg-muted/20 focus:bg-background h-10" />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">{isAr ? "نبذة (EN)" : "Bio (EN)"}</Label>
              <Textarea value={form.bio} onChange={e => updateForm({ bio: e.target.value })} className="min-h-[80px] text-sm rounded-xl border-border/40 bg-muted/20 focus:bg-background" dir="ltr" placeholder={profile?.bio || ""} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">{isAr ? "نبذة (AR)" : "Bio (AR)"}</Label>
              <Textarea value={form.bio_ar} onChange={e => updateForm({ bio_ar: e.target.value })} className="min-h-[80px] text-sm rounded-xl border-border/40 bg-muted/20 focus:bg-background" dir="rtl" placeholder={profile?.bio_ar || ""} />
            </div>
          </div>
          <Separator />
          <div className="space-y-2">
            {settings.map(setting => (
              <div key={setting.key} className="flex items-center justify-between rounded-2xl p-3 bg-muted/20 border border-border/30 group">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-xl bg-muted/60 flex items-center justify-center group-hover:bg-muted transition-colors">
                    <setting.icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <Label className="text-sm cursor-pointer font-medium">{setting.label}</Label>
                </div>
                <Switch checked={(form as any)[setting.key]} onCheckedChange={v => updateForm({ [setting.key]: v })} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Multi-Page Management */}
      <Card className="overflow-hidden border-border/40">
        <CardHeader className="pb-3 bg-muted/30">
          <CardTitle className="text-sm flex items-center gap-2">
            <div className="h-7 w-7 rounded-xl bg-chart-3/10 flex items-center justify-center">
              <LayoutGrid className="h-3.5 w-3.5 text-chart-3" />
            </div>
            {isAr ? "الصفحات الفرعية" : "Sub-Pages"}
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            {isAr ? "أنشئ تبويبات مختلفة (شخصي، مهني، إبداعي)" : "Create different tabs (Personal, Professional, Creative)"}
          </p>
        </CardHeader>
        <CardContent className="space-y-3 pt-3">
          {extra.pages.length > 0 && (
            <div className="space-y-1.5">
              {extra.pages.map((pg, i) => (
                <div key={pg.id} className="flex items-center gap-2 p-2 rounded-xl border border-border/30">
                  <span className="text-xs font-medium flex-1">{isAr ? pg.label_ar || pg.label : pg.label}</span>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => {
                    updateExtra({ pages: extra.pages.filter((_, idx) => idx !== i) });
                  }}>
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <Input id="new-page-label" placeholder={isAr ? "اسم الصفحة (EN)" : "Page name (EN)"} className="text-xs flex-1" dir="ltr" />
            <Input id="new-page-label-ar" placeholder={isAr ? "اسم الصفحة (AR)" : "Page name (AR)"} className="text-xs flex-1" dir="rtl" />
            <Button variant="outline" size="sm" className="shrink-0" onClick={() => {
              const labelEn = (document.getElementById("new-page-label") as HTMLInputElement)?.value?.trim();
              const labelAr = (document.getElementById("new-page-label-ar") as HTMLInputElement)?.value?.trim();
              if (!labelEn) return;
              const newPage = { id: `page-${Date.now()}`, label: labelEn, label_ar: labelAr || labelEn };
              updateExtra({ pages: [...extra.pages, newPage] });
              (document.getElementById("new-page-label") as HTMLInputElement).value = "";
              (document.getElementById("new-page-label-ar") as HTMLInputElement).value = "";
            }}>
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});
