import { memo, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Download, Upload, Plus, Trash2, Eye, EyeOff, Image, FileText, Video, MessageCircle, Type, Sparkles, Settings2, Search, LayoutGrid, UserPlus, Twitter } from "lucide-react";
import { Briefcase, Globe, BarChart3, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { parseExtra, DEFAULT_EXTRA } from "@/lib/socialLinksConstants";
import type { EditorSharedProps } from "./types";
import { handleSupabaseError } from "@/lib/supabaseErrorHandler";

/**
 * TYPOGRAPHY POLICY — ALTOHA DESIGN SYSTEM
 * Minimum font size: 11px (0.6875rem) desktop / 13px (0.8125rem) mobile.
 * Do NOT use `text-xs` on body text — only on badges & labels.
 * Scale: display(48) h1(36) h2(28) h3(22) h4(18) body-lg(18) body(16) body-sm(14) caption(13) label(12) overline(11).
 * IBM Plex Arabic required on all text.
 * See src/styles/typography.css for the complete policy.
 */

interface Props extends EditorSharedProps {
  userId: string | undefined;
  socials: Record<string, string>;
  setSocials: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  contacts: Record<string, string>;
  setContacts: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  setHasUnsavedChanges: (v: boolean) => void;
  setForm: React.Dispatch<React.SetStateAction<any>>;
  setExtra: React.Dispatch<React.SetStateAction<any>>;
  items: any[];
}

export const VisibilityTab = memo(function VisibilityTab({
  form, updateForm, extra, updateExtra, profile, isAr,
  userId, socials, setSocials, contacts, setContacts,
  setHasUnsavedChanges, setForm, setExtra, items,
}: Props) {
  const { toast } = useToast();

  const VISIBILITY_SECTIONS = useMemo(() => [
    { key: "show_bio" as const, label: isAr ? "النبذة" : "Bio", icon: Type },
    { key: "show_job_title" as const, label: isAr ? "المسمى الوظيفي" : "Job Title", icon: Briefcase },
    { key: "show_location" as const, label: isAr ? "الموقع" : "Location", icon: Globe },
    { key: "show_stats" as const, label: isAr ? "الإحصائيات" : "Stats", icon: BarChart3 },
    { key: "show_views" as const, label: isAr ? "عدد المشاهدات" : "View Count", icon: Eye },
    { key: "show_followers" as const, label: isAr ? "زر المتابعة والمتابعين" : "Follow Button & Count", icon: TrendingUp },
    { key: "show_flags" as const, label: isAr ? "أعلام الجنسية والإقامة" : "Nationality & Residence Flags", icon: Globe },
    { key: "show_language_switcher" as const, label: isAr ? "محوّل اللغات" : "Language Switcher", icon: Globe },
    { key: "show_awards" as const, label: isAr ? "الجوائز" : "Awards", icon: Sparkles },
    { key: "show_membership" as const, label: isAr ? "العضوية" : "Membership", icon: Settings2 },
    { key: "show_full_profile_btn" as const, label: isAr ? "زر البروفايل الكامل" : "Full Profile Button", icon: Eye },
    { key: "show_vcard_btn" as const, label: isAr ? "زر حفظ جهة الاتصال" : "Save Contact (vCard)", icon: UserPlus },
  ], [isAr]);

  return (
    <div className="space-y-4 mt-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Section Visibility */}
      <Card className="overflow-hidden border-border/40">
        <CardHeader className="pb-3 bg-muted/30">
          <CardTitle className="text-sm flex items-center gap-2">
            <div className="h-7 w-7 rounded-xl bg-primary/10 flex items-center justify-center">
              <EyeOff className="h-3.5 w-3.5 text-primary" />
            </div>
            {isAr ? "التحكم بالأقسام" : "Section Visibility"}
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            {isAr ? "تحكم بما يظهر في صفحة الروابط العامة" : "Control what appears on your public links page"}
          </p>
        </CardHeader>
        <CardContent className="pt-4 pb-5 px-5">
          <div className="grid gap-2.5 sm:grid-cols-2">
            {VISIBILITY_SECTIONS.map(section => {
              const isOn = !!extra[section.key];
              return (
                <button key={section.key} type="button" onClick={() => updateExtra({ [section.key]: !isOn } as any)}
                  className={`flex items-center justify-between rounded-2xl border px-4 py-3 transition-all duration-200 touch-manipulation active:scale-[0.98] cursor-pointer ${isOn ? "border-primary/25 bg-primary/[0.06] shadow-sm" : "border-border/30 bg-muted/20 hover:border-border/50"}`}>
                  <div className="flex items-center gap-2.5">
                    <Eye className={`h-4 w-4 shrink-0 transition-colors ${isOn ? "text-primary" : "text-muted-foreground/40"}`} />
                    <span className="text-xs font-medium select-none">{section.label}</span>
                  </div>
                  <div className={`relative h-7 w-12 rounded-full transition-colors duration-200 ${isOn ? "bg-primary" : "bg-muted-foreground/20"}`}>
                    <div className={`absolute top-0.5 h-6 w-6 rounded-full bg-background shadow-md transition-transform duration-200 ${isOn ? "translate-x-5 rtl:-translate-x-5" : "translate-x-0.5 rtl:-translate-x-0.5"}`} />
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Cover Image */}
      <Card className="overflow-hidden border-border/40">
        <CardHeader className="pb-3 bg-muted/30">
          <CardTitle className="text-sm flex items-center gap-2">
            <div className="h-7 w-7 rounded-xl bg-primary/10 flex items-center justify-center">
              <Image className="h-3.5 w-3.5 text-primary" />
            </div>
            {isAr ? "صورة الغلاف" : "Cover Image"}
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            {isAr ? "تظهر في أعلى صفحة الروابط العامة" : "Displayed at the top of your public page"}
          </p>
        </CardHeader>
        <CardContent className="space-y-3 pt-3">
          {extra.cover_image_url && (
            <div className="relative group rounded-xl overflow-hidden">
              <img loading="lazy" src={extra.cover_image_url} alt="Cover" className="w-full h-28 object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Button size="sm" variant="destructive" className="h-8 text-xs gap-1" onClick={() => updateExtra({ cover_image_url: "" })}>
                  <Trash2 className="h-3 w-3" />{isAr ? "إزالة" : "Remove"}
                </Button>
              </div>
            </div>
          )}
          <div>
            <Label htmlFor="cover-upload" className="cursor-pointer">
              <div className="border-2 border-dashed border-border/40 rounded-xl p-4 text-center hover:border-primary/30 transition-all duration-200 hover:bg-muted/20">
                <Image className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
                <p className="text-xs text-muted-foreground">{isAr ? "اضغط لرفع صورة غلاف" : "Click to upload cover image"}</p>
              </div>
            </Label>
            <input id="cover-upload" type="file" accept="image/*" className="hidden" onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file || !userId) return;
              try {
                const ext = file.name.split(".").pop();
                const path = `${userId}/cover-${Date.now()}.${ext}`;
                const { error } = await supabase.storage.from("user-media").upload(path, file, { upsert: true });
                if (error) throw handleSupabaseError(error);
                const { data: urlData } = supabase.storage.from("user-media").getPublicUrl(path);
                updateExtra({ cover_image_url: urlData.publicUrl });
                toast({ title: isAr ? "تم رفع صورة الغلاف" : "Cover image uploaded" });
              } catch (err: unknown) {
                toast({ title: "Error", description: err instanceof Error ? err.message : String(err), variant: "destructive" });
              }
            }} />
          </div>
          <Input placeholder={isAr ? "أو أدخل رابط الصورة" : "Or enter image URL"} value={extra.cover_image_url} onChange={e => updateExtra({ cover_image_url: e.target.value })} dir="ltr" className="text-xs" />
        </CardContent>
      </Card>

      {/* Custom Footer */}
      <Card className="overflow-hidden border-border/40">
        <CardHeader className="pb-3 bg-muted/30">
          <CardTitle className="text-sm flex items-center gap-2">
            <div className="h-7 w-7 rounded-xl bg-primary/10 flex items-center justify-center">
              <FileText className="h-3.5 w-3.5 text-primary" />
            </div>
            {isAr ? "تذييل مخصص" : "Custom Footer"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-3">
          <div className="flex items-center justify-between rounded-2xl p-3 bg-muted/20 border border-border/30">
            <Label className="text-xs cursor-pointer font-medium">{isAr ? "إظهار التذييل" : "Show Footer"}</Label>
            <Switch checked={extra.show_footer} onCheckedChange={v => updateExtra({ show_footer: v })} />
          </div>
          {extra.show_footer && (
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs mb-1 block font-medium">{isAr ? "نص التذييل (EN)" : "Footer Text (EN)"}</Label>
                <Input value={extra.footer_text} onChange={e => updateExtra({ footer_text: e.target.value })} placeholder="© 2024 My Brand" dir="ltr" className="text-xs rounded-xl" />
              </div>
              <div>
                <Label className="text-xs mb-1 block font-medium">{isAr ? "نص التذييل (AR)" : "Footer Text (AR)"}</Label>
                <Input value={extra.footer_text_ar} onChange={e => updateExtra({ footer_text_ar: e.target.value })} placeholder="© 2024 علامتي" dir="rtl" className="text-xs rounded-xl" />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Video Embeds */}
      <Card className="overflow-hidden border-border/40">
        <CardHeader className="pb-3 bg-muted/30">
          <CardTitle className="text-sm flex items-center gap-2">
            <div className="h-7 w-7 rounded-xl bg-primary/10 flex items-center justify-center">
              <Video className="h-3.5 w-3.5 text-primary" />
            </div>
            {isAr ? "معاينة الفيديو" : "Video Embeds"}
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            {isAr ? "عرض معاينة مضمنة لروابط YouTube و TikTok و Instagram" : "Show inline preview for YouTube, TikTok & Instagram links"}
          </p>
        </CardHeader>
        <CardContent className="pt-3">
          <div className="flex items-center justify-between rounded-2xl p-3 bg-muted/20 border border-border/30">
            <Label className="text-xs cursor-pointer font-medium">{isAr ? "تفعيل المعاينة المضمنة" : "Enable Video Previews"}</Label>
            <Switch checked={extra.show_video_embeds} onCheckedChange={v => updateExtra({ show_video_embeds: v })} />
          </div>
        </CardContent>
      </Card>

      {/* Contact Form */}
      <Card className="overflow-hidden border-border/40">
        <CardHeader className="pb-3 bg-muted/30">
          <CardTitle className="text-sm flex items-center gap-2">
            <div className="h-7 w-7 rounded-xl bg-primary/10 flex items-center justify-center">
              <MessageCircle className="h-3.5 w-3.5 text-primary" />
            </div>
            {isAr ? "نموذج التواصل" : "Contact Form"}
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            {isAr ? "نموذج اتصال مباشر في صفحة Bio" : "Direct contact form on your Bio page"}
          </p>
        </CardHeader>
        <CardContent className="space-y-3 pt-3">
          <div className="flex items-center justify-between rounded-2xl p-3 bg-muted/20 border border-border/30">
            <Label className="text-xs cursor-pointer font-medium">{isAr ? "إظهار نموذج التواصل" : "Show Contact Form"}</Label>
            <Switch checked={extra.show_contact_form} onCheckedChange={v => updateExtra({ show_contact_form: v })} />
          </div>
          {extra.show_contact_form && (
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs mb-1 block font-medium">{isAr ? "عنوان النموذج (EN)" : "Form Title (EN)"}</Label>
                <Input value={extra.contact_form_title} onChange={e => updateExtra({ contact_form_title: e.target.value })} dir="ltr" className="text-xs rounded-xl" />
              </div>
              <div>
                <Label className="text-xs mb-1 block font-medium">{isAr ? "عنوان النموذج (AR)" : "Form Title (AR)"}</Label>
                <Input value={extra.contact_form_title_ar} onChange={e => updateExtra({ contact_form_title_ar: e.target.value })} dir="rtl" className="text-xs rounded-xl" />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Password Protection */}
      <Card className="overflow-hidden border-border/40">
        <CardHeader className="pb-3 bg-muted/30">
          <CardTitle className="text-sm flex items-center gap-2">
            <div className="h-7 w-7 rounded-xl bg-primary/10 flex items-center justify-center">
              <EyeOff className="h-3.5 w-3.5 text-primary" />
            </div>
            {isAr ? "حماية بكلمة مرور" : "Password Protection"}
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            {isAr ? "أضف كلمة مرور لحماية صفحتك من الوصول غير المصرح" : "Add a password to restrict access to your bio page"}
          </p>
        </CardHeader>
        <CardContent className="space-y-3 pt-3">
          <div className="flex items-center justify-between rounded-2xl p-3 bg-muted/20 border border-border/30">
            <Label className="text-xs cursor-pointer font-medium">{isAr ? "تفعيل الحماية" : "Enable Protection"}</Label>
            <Switch checked={extra.enable_password} onCheckedChange={v => updateExtra({ enable_password: v })} />
          </div>
          {extra.enable_password && (
            <div>
              <Label className="text-xs mb-1 block font-medium">{isAr ? "كلمة المرور" : "Password"}</Label>
              <Input type="text" value={extra.page_password} onChange={e => updateExtra({ page_password: e.target.value })} placeholder={isAr ? "أدخل كلمة المرور" : "Enter page password"} dir="ltr" className="text-xs rounded-xl" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Email Collection */}
      <Card className="overflow-hidden border-border/40">
        <CardHeader className="pb-3 bg-muted/30">
          <CardTitle className="text-sm flex items-center gap-2">
            <div className="h-7 w-7 rounded-xl bg-primary/10 flex items-center justify-center">
              <Upload className="h-3.5 w-3.5 text-primary" />
            </div>
            {isAr ? "جمع الإيميلات" : "Email Collection"}
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            {isAr ? "اجمع إيميلات الزوار عبر نموذج اشتراك مدمج" : "Collect visitor emails with an embedded subscribe form"}
          </p>
        </CardHeader>
        <CardContent className="space-y-3 pt-3">
          <div className="flex items-center justify-between rounded-2xl p-3 bg-muted/20 border border-border/30">
            <Label className="text-xs cursor-pointer font-medium">{isAr ? "تفعيل جمع الإيميلات" : "Enable Email Collection"}</Label>
            <Switch checked={extra.enable_email_collection} onCheckedChange={v => updateExtra({ enable_email_collection: v })} />
          </div>
          {extra.enable_email_collection && (
            <div className="space-y-3">
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs mb-1 block font-medium">{isAr ? "العنوان (EN)" : "Title (EN)"}</Label>
                  <Input value={extra.email_collection_title} onChange={e => updateExtra({ email_collection_title: e.target.value })} dir="ltr" className="text-xs rounded-xl" />
                </div>
                <div>
                  <Label className="text-xs mb-1 block font-medium">{isAr ? "العنوان (AR)" : "Title (AR)"}</Label>
                  <Input value={extra.email_collection_title_ar} onChange={e => updateExtra({ email_collection_title_ar: e.target.value })} dir="rtl" className="text-xs rounded-xl" />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs mb-1 block font-medium">{isAr ? "الوصف (EN)" : "Description (EN)"}</Label>
                  <Input value={extra.email_collection_description} onChange={e => updateExtra({ email_collection_description: e.target.value })} dir="ltr" className="text-xs rounded-xl" />
                </div>
                <div>
                  <Label className="text-xs mb-1 block font-medium">{isAr ? "الوصف (AR)" : "Description (AR)"}</Label>
                  <Input value={extra.email_collection_description_ar} onChange={e => updateExtra({ email_collection_description_ar: e.target.value })} dir="rtl" className="text-xs rounded-xl" />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* SEO & Open Graph */}
      <Card className="overflow-hidden border-border/40">
        <CardHeader className="pb-3 bg-muted/30">
          <CardTitle className="text-sm flex items-center gap-2">
            <div className="h-7 w-7 rounded-xl bg-primary/10 flex items-center justify-center">
              <Search className="h-3.5 w-3.5 text-primary" />
            </div>
            {isAr ? "تحسين محركات البحث (SEO)" : "SEO & Open Graph"}
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            {isAr ? "تحكم بعنوان ووصف وصورة الصفحة عند مشاركتها" : "Customize how your page appears in search & social shares"}
          </p>
        </CardHeader>
        <CardContent className="pt-3 space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs mb-1 block font-medium">{isAr ? "العنوان (EN)" : "Page Title (EN)"}</Label>
              <Input value={extra.seo_title} onChange={e => updateExtra({ seo_title: e.target.value })} placeholder={isAr ? "اتركه فارغاً للافتراضي" : "Leave empty for default"} className="text-xs" dir="ltr" maxLength={60} />
              <span className="text-xs text-muted-foreground">{extra.seo_title.length}/60</span>
            </div>
            <div>
              <Label className="text-xs mb-1 block font-medium">{isAr ? "العنوان (AR)" : "Page Title (AR)"}</Label>
              <Input value={extra.seo_title_ar} onChange={e => updateExtra({ seo_title_ar: e.target.value })} placeholder={isAr ? "اتركه فارغاً للافتراضي" : "Leave empty for default"} className="text-xs" dir="rtl" maxLength={60} />
              <span className="text-xs text-muted-foreground">{extra.seo_title_ar.length}/60</span>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs mb-1 block font-medium">{isAr ? "الوصف (EN)" : "Description (EN)"}</Label>
              <Textarea value={extra.seo_description} onChange={e => updateExtra({ seo_description: e.target.value })} placeholder={isAr ? "وصف قصير للصفحة" : "Short page description"} className="text-xs min-h-[60px]" dir="ltr" maxLength={160} />
              <span className="text-xs text-muted-foreground">{extra.seo_description.length}/160</span>
            </div>
            <div>
              <Label className="text-xs mb-1 block font-medium">{isAr ? "الوصف (AR)" : "Description (AR)"}</Label>
              <Textarea value={extra.seo_description_ar} onChange={e => updateExtra({ seo_description_ar: e.target.value })} placeholder={isAr ? "وصف قصير بالعربية" : "Short description in Arabic"} className="text-xs min-h-[60px]" dir="rtl" maxLength={160} />
              <span className="text-xs text-muted-foreground">{extra.seo_description_ar.length}/160</span>
            </div>
          </div>
          <div>
            <Label className="text-xs mb-1 block font-medium">{isAr ? "صورة المشاركة (OG Image URL)" : "Share Image (OG Image URL)"}</Label>
            <Input value={extra.og_image_url} onChange={e => updateExtra({ og_image_url: e.target.value })} placeholder="https://..." className="text-xs" dir="ltr" />
            <p className="text-xs text-muted-foreground mt-1">{isAr ? "الحجم المثالي: 1200×630 بكسل" : "Recommended: 1200×630px"}</p>
            {extra.og_image_url && (
              <div className="mt-2 rounded-xl overflow-hidden border border-border/50">
                <img loading="lazy" src={extra.og_image_url} alt="OG Preview" className="w-full h-auto max-h-32 object-cover" onError={e => (e.currentTarget.style.display = "none")} />
              </div>
            )}
          </div>

          {/* Share Previews */}
          <div className="pt-2">
            <Label className="text-xs mb-2 block font-medium">{isAr ? "معاينة المشاركة" : "Share Preview"}</Label>
            <div className="space-y-3">
              {/* Twitter Preview */}
              <div className="rounded-xl border border-border/60 overflow-hidden bg-card shadow-sm">
                <div className="text-xs px-2 py-1 bg-muted/40 text-muted-foreground font-medium flex items-center gap-1">
                  <Twitter className="h-2.5 w-2.5" /> X / Twitter
                </div>
                {(extra.og_image_url || profile?.avatar_url) && (
                  <div className="h-28 bg-muted/20 overflow-hidden">
                    <img loading="lazy" src={extra.og_image_url || profile?.avatar_url || ""} alt="OG preview" className="w-full h-full object-cover" onError={e => (e.currentTarget.style.display = "none")} />
                  </div>
                )}
                <div className="p-2.5 space-y-0.5">
                  <p className="text-xs font-semibold text-foreground truncate">
                    {(isAr ? extra.seo_title_ar : extra.seo_title) || profile?.display_name || profile?.full_name || "Bio Page"}
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {(isAr ? extra.seo_description_ar : extra.seo_description) || (isAr ? "صفحة Bio الشخصية" : "Personal bio page")}
                  </p>
                  <p className="text-xs text-muted-foreground/70 truncate">{window.location.host}/bio/{profile?.username}</p>
                </div>
              </div>

              {/* WhatsApp Preview */}
              <div className="rounded-xl border border-border/60 overflow-hidden bg-card shadow-sm">
                <div className="text-xs px-2 py-1 bg-muted/40 text-muted-foreground font-medium flex items-center gap-1">
                  <MessageCircle className="h-2.5 w-2.5" /> WhatsApp
                </div>
                <div className="flex gap-2 p-2">
                  {(extra.og_image_url || profile?.avatar_url) && (
                    <div className="w-16 h-16 rounded-md overflow-hidden shrink-0 bg-muted/20">
                      <img loading="lazy" src={extra.og_image_url || profile?.avatar_url || ""} alt="OG preview" className="w-full h-full object-cover" onError={e => (e.currentTarget.style.display = "none")} />
                    </div>
                  )}
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <p className="text-xs font-semibold text-foreground truncate">
                      {(isAr ? extra.seo_title_ar : extra.seo_title) || profile?.display_name || profile?.full_name || "Bio Page"}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {(isAr ? extra.seo_description_ar : extra.seo_description) || (isAr ? "صفحة Bio الشخصية" : "Personal bio page")}
                    </p>
                    <p className="text-xs text-muted-foreground/60 truncate">{window.location.host}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Motion Effects */}
      <Card className="overflow-hidden border-border/40">
        <CardHeader className="pb-3 bg-muted/30">
          <CardTitle className="text-sm flex items-center gap-2">
            <div className="h-7 w-7 rounded-xl bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
            </div>
            {isAr ? "تأثيرات حركية" : "Motion Effects"}
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            {isAr ? "تأثيرات Typing و Particles للصفحة" : "Typing animation & Particle effects"}
          </p>
        </CardHeader>
        <CardContent className="space-y-2 pt-3">
          <div className="flex items-center justify-between rounded-2xl p-3 bg-muted/20 border border-border/30">
            <div className="flex items-center gap-2">
              <Type className="h-3.5 w-3.5 text-muted-foreground" />
              <Label className="text-xs cursor-pointer font-medium">{isAr ? "تأثير الكتابة على النبذة" : "Typing Animation on Bio"}</Label>
            </div>
            <Switch checked={extra.enable_typing_animation} onCheckedChange={v => updateExtra({ enable_typing_animation: v })} />
          </div>
          <div className="flex items-center justify-between rounded-2xl p-3 bg-muted/20 border border-border/30">
            <div className="flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
              <Label className="text-xs cursor-pointer font-medium">{isAr ? "جزيئات عائمة" : "Floating Particles"}</Label>
            </div>
            <Switch checked={extra.enable_particles} onCheckedChange={v => updateExtra({ enable_particles: v })} />
          </div>
        </CardContent>
      </Card>

      {/* Custom CSS */}
      <Card className="overflow-hidden border-border/40">
        <CardHeader className="pb-3 bg-muted/30">
          <CardTitle className="text-sm flex items-center gap-2">
            <div className="h-7 w-7 rounded-xl bg-primary/10 flex items-center justify-center">
              <Settings2 className="h-3.5 w-3.5 text-primary" />
            </div>
            {isAr ? "تخصيص CSS متقدم" : "Advanced CSS Customization"}
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            {isAr ? "أضف أنماط CSS مخصصة لصفحتك العامة — للمستخدمين المتقدمين" : "Add custom CSS styles to your public page — for advanced users"}
          </p>
        </CardHeader>
        <CardContent className="space-y-3 pt-3">
          <Textarea value={extra.custom_user_css} onChange={e => updateExtra({ custom_user_css: e.target.value })} placeholder={isAr ? "/* أضف CSS مخصص */\n.my-class { color: red; }" : "/* Add custom CSS */\n.my-class { color: red; }"} className="min-h-[120px] text-xs font-mono" dir="ltr" />
          <p className="text-xs text-muted-foreground">
            {isAr ? "⚠️ CSS غير صالح قد يؤثر على مظهر الصفحة" : "⚠️ Invalid CSS may affect page appearance"}
          </p>
        </CardContent>
      </Card>

      {/* Multi-Page Profiles */}
      <Card className="overflow-hidden border-border/40">
        <CardHeader className="pb-3 bg-muted/30">
          <CardTitle className="text-sm flex items-center gap-2">
            <div className="h-7 w-7 rounded-xl bg-primary/10 flex items-center justify-center">
              <LayoutGrid className="h-3.5 w-3.5 text-primary" />
            </div>
            {isAr ? "صفحات متعددة" : "Multi-Page Profiles"}
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
            <Input id="vis-new-page-label" placeholder={isAr ? "اسم الصفحة (EN)" : "Page name (EN)"} className="text-xs flex-1" dir="ltr" />
            <Input id="vis-new-page-label-ar" placeholder={isAr ? "اسم الصفحة (AR)" : "Page name (AR)"} className="text-xs flex-1" dir="rtl" />
            <Button variant="outline" size="sm" className="shrink-0" onClick={() => {
              const labelEn = (document.getElementById("vis-new-page-label") as HTMLInputElement)?.value?.trim();
              const labelAr = (document.getElementById("vis-new-page-label-ar") as HTMLInputElement)?.value?.trim();
              if (!labelEn) return;
              updateExtra({ pages: [...extra.pages, { id: `page-${Date.now()}`, label: labelEn, label_ar: labelAr || labelEn }] });
              (document.getElementById("vis-new-page-label") as HTMLInputElement).value = "";
              (document.getElementById("vis-new-page-label-ar") as HTMLInputElement).value = "";
            }}>
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Import / Export */}
      <Card className="overflow-hidden border-border/40">
        <CardHeader className="pb-3 bg-muted/30">
          <CardTitle className="text-sm flex items-center gap-2">
            <div className="h-7 w-7 rounded-xl bg-primary/10 flex items-center justify-center">
              <Download className="h-3.5 w-3.5 text-primary" />
            </div>
            {isAr ? "استيراد / تصدير" : "Import / Export"}
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            {isAr ? "نسخ احتياطي أو نقل إعدادات الصفحة" : "Backup or transfer your page settings"}
          </p>
        </CardHeader>
        <CardContent className="space-y-3 pt-3">
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => {
              const exportData = {
                version: 1,
                page: { ...form, custom_css: JSON.stringify(extra) },
                socials,
                contacts,
                items: items.map(i => ({ title: i.title, title_ar: i.title_ar, url: i.url, icon: i.icon, link_type: i.link_type, thumbnail_url: i.thumbnail_url })),
              };
              const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
              const a = document.createElement("a");
              a.href = URL.createObjectURL(blob);
              a.download = `${profile?.username || "social-links"}-export.json`;
              a.click();
              URL.revokeObjectURL(a.href);
              toast({ title: isAr ? "✅ تم تصدير الإعدادات" : "✅ Settings exported" });
            }}>
              <Download className="h-3.5 w-3.5" />{isAr ? "تصدير JSON" : "Export JSON"}
            </Button>
            <div>
              <Label htmlFor="import-json" className="cursor-pointer">
                <Button variant="outline" size="sm" className="gap-1.5 w-full pointer-events-none" tabIndex={-1}>
                  <Upload className="h-3.5 w-3.5" />{isAr ? "استيراد JSON" : "Import JSON"}
                </Button>
              </Label>
              <input id="import-json" type="file" accept=".json,application/json" className="hidden" onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                try {
                  const text = await file.text();
                  const data = JSON.parse(text);
                  if (!data.version || !data.page) throw new Error("Invalid format");
                  const importedExtra = data.page.custom_css ? parseExtra(data.page.custom_css) : { ...DEFAULT_EXTRA };
                  const { custom_css, ...pageFields } = data.page;
                  setForm((f: any) => ({ ...f, ...pageFields }));
                  setExtra(importedExtra);
                  if (data.socials) setSocials((s: any) => ({ ...s, ...data.socials }));
                  if (data.contacts) setContacts((c: any) => ({ ...c, ...data.contacts }));
                  setHasUnsavedChanges(true);
                  toast({ title: isAr ? "✅ تم استيراد الإعدادات — اضغط حفظ" : "✅ Settings imported — press Save" });
                } catch {
                  toast({ title: isAr ? "ملف غير صالح" : "Invalid file", variant: "destructive" });
                }
                e.target.value = "";
              }} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});
