import { memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { DeduplicationPanel } from "@/components/admin/DeduplicationPanel";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Building2, Save, X, Loader2, ChevronLeft, CheckCircle2, Image as ImageIcon,
  Mail, Phone, Globe, MapPin, Calendar, Shield, Star, Upload,
  Twitter, Facebook, Linkedin, Instagram, AlertCircle, Languages,
  StickyNote, BarChart3, Eye, Activity, Briefcase, Clock,
  ExternalLink, Info, Copy, Users, Trash2, Plus, RefreshCw,
  Undo2, Youtube, MessageCircle, MapPinned, Navigation, TrendingUp,
  Zap, History, ChevronRight, Hash, FileCheck, Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { SectionHeader, FieldGroup, BilingualField, ProgressRing, QuickNavItem, generateSlug } from "./organizer/OrganizerFormHelpers";
import { useOrganizerEditForm, TABS, type OrganizerForm } from "./organizer/useOrganizerEditForm";
import { toast } from "sonner";

interface OrganizerEditFormProps {
  organizerId?: string | null;
  onClose: () => void;
}

export default function OrganizerEditForm({ organizerId, onClose }: OrganizerEditFormProps) {
  const d = useOrganizerEditForm(organizerId ?? null, onClose);

  if (d.isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground">{d.isAr ? "جاري التحميل..." : "Loading..."}</p>
      </div>
    );
  }

  const { form, setForm, formErrors, setFormErrors, isAr, orgData } = d;

  return (
    <div className="animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
      {/* ══ Top Bar ══ */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border/60 -mx-4 md:-mx-6 px-4 md:px-6 py-3 mb-0">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Button variant="ghost" size="icon" onClick={() => d.hasUnsavedChanges ? d.setShowDiscardConfirm(true) : onClose()} className="h-8 w-8 rounded-xl shrink-0">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {form.logo_url ? (
              <img loading="lazy" decoding="async" src={form.logo_url} alt={form.name || "Organizer logo"} className="h-10 w-10 rounded-xl object-cover shrink-0 border shadow-sm" />
            ) : (
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
            )}
            <div className="min-w-0">
              <h2 className="text-sm font-bold truncate">
                {isAr ? (form.name_ar || form.name || "منظم جديد") : (form.name || form.name_ar || "New Organizer")}
              </h2>
              <div className="flex items-center gap-2 text-[12px] text-muted-foreground flex-wrap">
                {organizerId && orgData?.organizer_number && (
                  <Badge variant="outline" className="text-[12px] h-4 font-mono px-1.5">{orgData.organizer_number}</Badge>
                )}
                <Badge variant={form.status === "active" ? "default" : form.status === "pending" ? "outline" : "secondary"} className="text-[12px] h-4 capitalize">{form.status}</Badge>
                {form.is_verified && <Badge variant="outline" className="text-[12px] h-4 px-1.5 gap-0.5 border-primary/30"><CheckCircle2 className="h-2.5 w-2.5 text-primary" />{isAr ? "موثق" : "Verified"}</Badge>}
                {form.is_featured && <Badge variant="outline" className="text-[12px] h-4 px-1.5 gap-0.5 border-amber-500/30"><Star className="h-2.5 w-2.5 text-amber-500" />{isAr ? "مميز" : "Featured"}</Badge>}
                {d.hasUnsavedChanges && (
                  <Badge variant="outline" className="text-[12px] h-4 px-1.5 border-amber-500/50 text-amber-600 animate-pulse">
                    {isAr ? "غير محفوظ" : "Unsaved"}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {d.lastSaved && (
              <span className="text-[12px] text-muted-foreground hidden lg:flex items-center gap-1">
                <Clock className="h-3 w-3" />{d.lastSaved.toLocaleTimeString()}
              </span>
            )}
            <ProgressRing pct={d.completePct} />
            {organizerId && orgData?.slug && (
              <TooltipProvider><Tooltip><TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl" asChild>
                  <Link to={`/organizers/${orgData.slug}`} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-3.5 w-3.5" /></Link>
                </Button>
              </TooltipTrigger><TooltipContent><p className="text-xs">{isAr ? "عرض الصفحة العامة" : "View public page"}</p></TooltipContent></Tooltip></TooltipProvider>
            )}
            {d.hasUnsavedChanges && (
              <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground h-8" onClick={() => d.setShowDiscardConfirm(true)}>
                <Undo2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline text-xs">{isAr ? "تراجع" : "Discard"}</span>
              </Button>
            )}
            <Button variant="secondary" size="sm" className="gap-1.5 h-8" onClick={d.handleAutoTranslate} disabled={d.translating}>
              <Languages className="h-3.5 w-3.5" />
              <span className="hidden sm:inline text-xs">{d.translating ? "..." : isAr ? "ترجمة" : "Translate"}</span>
            </Button>
            <Button size="sm" onClick={d.handleSave} disabled={(!form.name && !form.name_ar) || d.saveMutation.isPending} className="gap-1.5 h-8 min-w-[72px]">
              {d.saveMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              <span className="text-xs">{isAr ? "حفظ" : "Save"}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Dedup */}
      <DeduplicationPanel duplicates={d.duplicates} checking={d.checking} onDismiss={d.clearDuplicates} compact />

      {/* ══ Layout: Side Nav + Content ══ */}
      <div className="flex gap-0 mt-0">
        {/* Side Navigation */}
        <div className={cn(
          "shrink-0 border-e border-border/40 transition-all duration-300 hidden lg:block",
          d.showSideNav ? "w-48 pe-4 pt-5" : "w-0 pe-0 overflow-hidden"
        )}>
          {d.showSideNav && (
            <nav aria-label={isAr ? "أقسام النموذج" : "Form sections"} className="sticky top-20 space-y-0.5">
              <p className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">{isAr ? "الأقسام" : "Sections"}</p>
              {TABS.map(tab => (
                <QuickNavItem
                  key={tab.id}
                  icon={
                    tab.id === "identity" ? Building2 : tab.id === "images" ? ImageIcon :
                    tab.id === "contact" ? Mail : tab.id === "location" ? MapPin :
                    tab.id === "team" ? Users : tab.id === "details" ? Briefcase :
                    tab.id === "social" ? Globe : tab.id === "settings" ? Shield :
                    tab.id === "exhibitions" ? Calendar : tab.id === "analytics" ? TrendingUp : StickyNote
                  }
                  label={isAr ? tab.ar : tab.en}
                  status={d.getTabStatus(tab.id)}
                  active={d.activeTab === tab.id}
                  onClick={() => d.setActiveTab(tab.id)}
                />
              ))}
              <Separator className="my-3" />
              <div className="px-3 space-y-2">
                <div className="flex items-center justify-between text-[12px]">
                  <span className="text-muted-foreground">{isAr ? "الاكتمال" : "Complete"}</span>
                  <span className={cn("font-bold", d.completePct >= 80 ? "text-chart-2" : d.completePct >= 50 ? "text-amber-600" : "text-primary")}>{d.completePct}%</span>
                </div>
                <Progress value={d.completePct} className="h-1.5" />
                <div className="flex items-center gap-3 text-[12px] text-muted-foreground mt-1">
                  <span className="flex items-center gap-1"><div className="h-1.5 w-1.5 rounded-full bg-chart-2" />{TABS.filter(t => d.getTabStatus(t.id) === "complete").length}</span>
                  <span className="flex items-center gap-1"><div className="h-1.5 w-1.5 rounded-full bg-amber-500" />{TABS.filter(t => d.getTabStatus(t.id) === "partial").length}</span>
                  <span className="flex items-center gap-1"><div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30" />{TABS.filter(t => d.getTabStatus(t.id) === "empty").length}</span>
                </div>
              </div>
            </nav>
          )}
        </div>

        {/* Main Content */}
        <div className={cn("flex-1 min-w-0", d.showSideNav ? "ps-0 lg:ps-6" : "ps-0")}>
          <Tabs value={d.activeTab} onValueChange={d.setActiveTab} className="w-full">
            {/* Mobile Tab Bar */}
            <div className="overflow-x-auto lg:hidden -mx-4 md:-mx-6 px-4 md:px-6 pt-4">
              <TabsList className="inline-flex h-10 gap-0.5 bg-muted/50 p-1 rounded-xl w-max">
                {TABS.map(tab => {
                  const status = d.getTabStatus(tab.id);
                  const TabIcon = tab.id === "identity" ? Building2 : tab.id === "images" ? ImageIcon :
                    tab.id === "contact" ? Mail : tab.id === "location" ? MapPin :
                    tab.id === "team" ? Users : tab.id === "details" ? Briefcase :
                    tab.id === "social" ? Globe : tab.id === "settings" ? Shield :
                    tab.id === "exhibitions" ? Calendar : tab.id === "analytics" ? TrendingUp : StickyNote;
                  return (
                    <TabsTrigger key={tab.id} value={tab.id} className="gap-1.5 text-xs px-3 rounded-lg data-[state=active]:shadow-sm relative">
                      <div className={cn(
                        "h-1.5 w-1.5 rounded-full shrink-0",
                        status === "complete" ? "bg-chart-2" : status === "partial" ? "bg-amber-500" : "bg-muted-foreground/30"
                      )} />
                      <TabIcon className="h-3.5 w-3.5 shrink-0" />
                      <span className="hidden sm:inline">{isAr ? tab.ar : tab.en}</span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </div>

            <div className="mt-5 pb-16">
              {/* ═══ Identity Tab ═══ */}
              <TabsContent value="identity" className="space-y-6 mt-0">
                <SectionHeader icon={Building2} title={isAr ? "معلومات المنظم" : "Organizer Information"} desc={isAr ? "الاسم والوصف والرابط المختصر" : "Name, description & URL slug"} />

                {organizerId && orgData && (
                  <Card className="rounded-2xl bg-gradient-to-r from-primary/5 to-transparent border-primary/10">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        {form.logo_url ? (
                          <img loading="lazy" decoding="async" src={form.logo_url} alt={form.name || "Organizer logo"} className="h-14 w-14 rounded-2xl object-cover border shadow-sm" />
                        ) : (
                          <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                            <Building2 className="h-6 w-6 text-primary" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-base truncate">{isAr ? (form.name_ar || form.name) : (form.name || form.name_ar)}</p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            {orgData.organizer_number && <span className="text-[12px] text-muted-foreground font-mono"><Hash className="h-3 w-3 inline" /> {orgData.organizer_number}</span>}
                            {form.city && <span className="text-[12px] text-muted-foreground"><MapPin className="h-3 w-3 inline" /> {isAr ? (form.city_ar || form.city) : form.city}</span>}
                            {form.founded_year && <span className="text-[12px] text-muted-foreground"><Calendar className="h-3 w-3 inline" /> {form.founded_year}</span>}
                          </div>
                        </div>
                        <div className="hidden sm:flex gap-2">
                          {[
                            { v: orgData.total_exhibitions || 0, l: isAr ? "معارض" : "Events" },
                            { v: (orgData.total_views || 0).toLocaleString(), l: isAr ? "مشاهدات" : "Views" },
                            { v: orgData.follower_count || 0, l: isAr ? "متابعون" : "Followers" },
                          ].map(s => (
                            <div key={s.l} className="text-center px-3">
                              <p className="text-sm font-bold">{s.v}</p>
                              <p className="text-[12px] text-muted-foreground">{s.l}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <BilingualField
                  labelAr="الاسم بالعربية *" labelEn="Name (EN)"
                  valueAr={form.name_ar} valueEn={form.name}
                  onChangeAr={v => setForm(f => ({ ...f, name_ar: v }))}
                  onChangeEn={v => { setForm(f => ({ ...f, name: v })); setFormErrors(e => ({ ...e, name: "" })); }}
                  translateField={d.translateField} context={d.translateCtx}
                  placeholder_ar="اسم المنظم بالعربية" placeholder_en="Organizer name in English"
                />
                {formErrors.name && <p className="text-[12px] text-destructive flex items-center gap-1"><AlertCircle className="h-3 w-3" />{formErrors.name}</p>}

                <FieldGroup label="Slug" hint={form.slug ? `${window.location.origin}/organizers/${form.slug}` : undefined}>
                  <div className="flex gap-2">
                    <Input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} placeholder={isAr ? "يُولَّد تلقائياً" : "auto-generated"} className="font-mono text-xs flex-1" dir="ltr" />
                    {(form.name || form.name_ar) && (
                      <Button type="button" variant="ghost" size="icon" className="h-10 w-10 shrink-0 rounded-xl" onClick={() => setForm(f => ({ ...f, slug: generateSlug(f.name || f.name_ar) }))}>
                        <RefreshCw className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </FieldGroup>

                <BilingualField
                  labelAr="الوصف بالعربية" labelEn="Description (EN)"
                  valueAr={form.description_ar} valueEn={form.description}
                  onChangeAr={v => setForm(f => ({ ...f, description_ar: v }))}
                  onChangeEn={v => setForm(f => ({ ...f, description: v }))}
                  translateField={d.translateField} context={d.translateCtx}
                  multiline rows={5}
                  placeholder_ar="وصف المنظم بالعربية..." placeholder_en="Describe the organizer..."
                />

                <div className="flex justify-between text-[12px] text-muted-foreground">
                  <span>{form.description_ar.length} {isAr ? "حرف (عربي)" : "chars (AR)"}</span>
                  <span>{form.description.length} {isAr ? "حرف (إنجليزي)" : "chars (EN)"}</span>
                </div>
              </TabsContent>

              {/* ═══ Images Tab ═══ */}
              <TabsContent value="images" className="space-y-6 mt-0">
                <SectionHeader icon={ImageIcon} title={isAr ? "الوسائط والصور" : "Media & Images"} desc={isAr ? "الشعار والغلاف ومعرض الصور" : "Logo, cover image & photo gallery"} />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Logo */}
                  <Card className="rounded-2xl">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-medium flex items-center gap-1.5">
                          <Sparkles className="h-3.5 w-3.5 text-primary" />{isAr ? "الشعار" : "Logo"}
                        </Label>
                        {form.logo_url && <Badge variant="outline" className="text-[12px] h-4"><FileCheck className="h-2.5 w-2.5 me-1" />{isAr ? "مرفوع" : "Uploaded"}</Badge>}
                      </div>
                      <input ref={d.logoRef} type="file" accept="image/*" className="hidden" onChange={e => { const file = e.target.files?.[0]; if (file) d.handleImageUpload(file, "logo"); }} />
                      {form.logo_url ? (
                        <div className="flex items-center gap-4">
                          <img src={form.logo_url} alt="Logo" className="h-20 w-20 rounded-2xl object-cover shrink-0 border shadow-sm" loading="lazy" />
                          <div className="flex-1 min-w-0 space-y-2">
                            <p className="text-[12px] text-muted-foreground truncate">{form.logo_url.split("/").pop()}</p>
                            <div className="flex gap-2">
                              <Button type="button" variant="outline" size="sm" className="h-7 text-xs rounded-lg" onClick={() => d.logoRef.current?.click()}>{isAr ? "تغيير" : "Change"}</Button>
                              <Button type="button" variant="ghost" size="sm" className="h-7 text-xs text-destructive rounded-lg" onClick={() => setForm(f => ({ ...f, logo_url: "" }))}><X className="h-3.5 w-3.5" /></Button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <button type="button" onClick={() => d.logoRef.current?.click()} disabled={d.uploadingLogo}
                          className="w-full rounded-2xl border-2 border-dashed border-border/60 hover:border-primary/40 transition-all p-6 flex flex-col items-center gap-2 text-muted-foreground hover:bg-muted/30 active:scale-[0.98]">
                          {d.uploadingLogo ? <Loader2 className="h-6 w-6 animate-spin" /> : <Upload className="h-6 w-6" />}
                          <span className="text-xs">{d.uploadingLogo ? (isAr ? "جاري الرفع..." : "Uploading...") : (isAr ? "رفع شعار" : "Upload Logo")}</span>
                        </button>
                      )}
                      <Input value={form.logo_url} onChange={e => setForm(f => ({ ...f, logo_url: e.target.value }))} placeholder={isAr ? "أو الصق رابط" : "Or paste URL"} className="text-xs h-8" dir="ltr" />
                    </CardContent>
                  </Card>

                  {/* Cover */}
                  <Card className="rounded-2xl">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-medium flex items-center gap-1.5">
                          <ImageIcon className="h-3.5 w-3.5 text-primary" />{isAr ? "صورة الغلاف" : "Cover Image"}
                        </Label>
                        {form.cover_image_url && <Badge variant="outline" className="text-[12px] h-4"><FileCheck className="h-2.5 w-2.5 me-1" />{isAr ? "مرفوع" : "Uploaded"}</Badge>}
                      </div>
                      <input ref={d.coverRef} type="file" accept="image/*" className="hidden" onChange={e => { const file = e.target.files?.[0]; if (file) d.handleImageUpload(file, "cover"); }} />
                      {form.cover_image_url ? (
                        <div className="relative group rounded-2xl border overflow-hidden">
                          <img src={form.cover_image_url} alt="Cover" className="w-full h-32 object-cover" loading="lazy" />
                          <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <Button type="button" variant="secondary" size="sm" className="h-8 rounded-lg" onClick={() => d.coverRef.current?.click()}>{isAr ? "تغيير" : "Change"}</Button>
                            <Button type="button" variant="destructive" size="sm" className="h-8 rounded-lg" onClick={() => setForm(f => ({ ...f, cover_image_url: "" }))}><X className="h-4 w-4" /></Button>
                          </div>
                        </div>
                      ) : (
                        <button type="button" onClick={() => d.coverRef.current?.click()} disabled={d.uploadingCover}
                          className="w-full rounded-2xl border-2 border-dashed border-border/60 hover:border-primary/40 transition-all p-6 flex flex-col items-center gap-2 text-muted-foreground hover:bg-muted/30 active:scale-[0.98]">
                          {d.uploadingCover ? <Loader2 className="h-6 w-6 animate-spin" /> : <ImageIcon className="h-6 w-6" />}
                          <span className="text-xs">{d.uploadingCover ? (isAr ? "جاري الرفع..." : "Uploading...") : (isAr ? "رفع غلاف" : "Upload Cover")}</span>
                        </button>
                      )}
                      <Input value={form.cover_image_url} onChange={e => setForm(f => ({ ...f, cover_image_url: e.target.value }))} placeholder={isAr ? "أو الصق رابط" : "Or paste URL"} className="text-xs h-8" dir="ltr" />
                    </CardContent>
                  </Card>
                </div>

                {/* Gallery */}
                <Card className="rounded-2xl">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <Label className="text-xs font-medium">{isAr ? "معرض الصور" : "Photo Gallery"} <Badge variant="outline" className="text-[12px] h-4 ms-1">{form.gallery_urls.length}</Badge></Label>
                      <input ref={d.galleryRef} type="file" accept="image/*" className="hidden" onChange={e => { const file = e.target.files?.[0]; if (file) d.handleImageUpload(file, "gallery"); }} />
                      <Button type="button" variant="outline" size="sm" className="h-7 text-xs gap-1 rounded-lg" onClick={() => d.galleryRef.current?.click()} disabled={d.uploadingGallery}>
                        {d.uploadingGallery ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                        {isAr ? "إضافة صورة" : "Add Photo"}
                      </Button>
                    </div>
                    {form.gallery_urls.length > 0 ? (
                      <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                        {form.gallery_urls.map((url, i) => (
                          <div key={i} className="relative group aspect-square rounded-xl border overflow-hidden">
                            <img src={url} alt={`Gallery image ${i + 1}`} className="w-full h-full object-cover" loading="lazy" />
                            <button type="button" aria-label={`Remove image ${i + 1}`} onClick={() => d.removeGalleryImage(i)}
                              className="absolute top-1 end-1 h-6 w-6 rounded-full bg-destructive/90 text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-xl border-2 border-dashed border-border/40 p-6 text-center text-muted-foreground/60">
                        <ImageIcon className="h-6 w-6 mx-auto mb-1" />
                        <p className="text-[12px]">{isAr ? "لا توجد صور في المعرض" : "No gallery photos yet"}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ═══ Contact Tab ═══ */}
              <TabsContent value="contact" className="space-y-6 mt-0">
                <SectionHeader icon={Mail} title={isAr ? "معلومات التواصل" : "Contact Information"} desc={isAr ? "البريد الإلكتروني والهاتف والموقع" : "Email, phone & website"} />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <FieldGroup label={isAr ? "البريد الإلكتروني" : "Email"} error={formErrors.email}>
                    <Input value={form.email} onChange={e => { setForm(f => ({ ...f, email: e.target.value })); setFormErrors(e2 => ({ ...e2, email: "" })); }} type="email" dir="ltr" placeholder="info@example.com" />
                  </FieldGroup>
                  <FieldGroup label={isAr ? "الهاتف" : "Phone"}>
                    <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} dir="ltr" placeholder="+966..." />
                  </FieldGroup>
                  <FieldGroup label={isAr ? "الفاكس" : "Fax"}>
                    <Input value={form.fax} onChange={e => setForm(f => ({ ...f, fax: e.target.value }))} dir="ltr" placeholder="+966..." />
                  </FieldGroup>
                  <FieldGroup label={isAr ? "الموقع الإلكتروني" : "Website"} error={formErrors.website}>
                    <Input value={form.website} onChange={e => { setForm(f => ({ ...f, website: e.target.value })); setFormErrors(e2 => ({ ...e2, website: "" })); }} placeholder="https://..." dir="ltr" />
                  </FieldGroup>
                </div>

                {(form.email || form.phone || form.website) && (
                  <Card className="rounded-2xl bg-muted/30">
                    <CardContent className="p-4">
                      <p className="text-[12px] font-semibold text-muted-foreground uppercase mb-3">{isAr ? "معاينة سريعة" : "Quick Preview"}</p>
                      <div className="flex flex-wrap gap-3">
                        {form.email && <a href={`mailto:${form.email}`} className="flex items-center gap-1.5 text-xs text-primary hover:underline"><Mail className="h-3.5 w-3.5" />{form.email}</a>}
                        {form.phone && <a href={`tel:${form.phone}`} className="flex items-center gap-1.5 text-xs text-primary hover:underline"><Phone className="h-3.5 w-3.5" />{form.phone}</a>}
                        {form.website && <a href={form.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-primary hover:underline"><Globe className="h-3.5 w-3.5" />{form.website.replace(/^https?:\/\//, "")}</a>}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* ═══ Location Tab ═══ */}
              <TabsContent value="location" className="space-y-6 mt-0">
                <SectionHeader icon={MapPin} title={isAr ? "الموقع والعنوان" : "Location & Address"} desc={isAr ? "العنوان التفصيلي والعنوان الوطني السعودي" : "Detailed address & Saudi National Address"} />

                <BilingualField
                  labelAr="الدولة بالعربية" labelEn="Country (EN)"
                  valueAr={form.country_ar} valueEn={form.country}
                  onChangeAr={v => setForm(f => ({ ...f, country_ar: v }))}
                  onChangeEn={v => setForm(f => ({ ...f, country: v }))}
                  translateField={d.translateField} context={d.translateCtx}
                  placeholder_ar="المملكة العربية السعودية" placeholder_en="Saudi Arabia"
                />
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div className="md:col-span-2">
                    <FieldGroup label={isAr ? "المدينة بالعربية" : "City (AR)"}>
                      <Input value={form.city_ar} onChange={e => setForm(f => ({ ...f, city_ar: e.target.value }))} dir="rtl" placeholder="الرياض" />
                    </FieldGroup>
                  </div>
                  <div className="md:col-span-2">
                    <FieldGroup label={isAr ? "المدينة (EN)" : "City (EN)"}>
                      <Input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} dir="ltr" placeholder="Riyadh" />
                    </FieldGroup>
                  </div>
                  <FieldGroup label={isAr ? "رمز الدولة" : "Code"}>
                    <Input value={form.country_code} onChange={e => setForm(f => ({ ...f, country_code: e.target.value.toUpperCase() }))} maxLength={2} placeholder="SA" dir="ltr" />
                  </FieldGroup>
                </div>

                <Separator />

                <div>
                  <h4 className="text-xs font-semibold mb-3 flex items-center gap-2">
                    <MapPinned className="h-3.5 w-3.5 text-primary" />
                    {isAr ? "العنوان التفصيلي" : "Detailed Address"}
                  </h4>
                  <BilingualField
                    labelAr="الحي بالعربية" labelEn="District (EN)"
                    valueAr={form.district_ar} valueEn={form.district}
                    onChangeAr={v => setForm(f => ({ ...f, district_ar: v }))}
                    onChangeEn={v => setForm(f => ({ ...f, district: v }))}
                    translateField={d.translateField} context={d.translateCtx}
                    placeholder_ar="حي العليا" placeholder_en="Al Olaya"
                  />
                  <div className="mt-4">
                    <BilingualField
                      labelAr="الشارع بالعربية" labelEn="Street (EN)"
                      valueAr={form.street_ar} valueEn={form.street}
                      onChangeAr={v => setForm(f => ({ ...f, street_ar: v }))}
                      onChangeEn={v => setForm(f => ({ ...f, street: v }))}
                      translateField={d.translateField} context={d.translateCtx}
                      placeholder_ar="شارع الملك فهد" placeholder_en="King Fahd Road"
                    />
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    <FieldGroup label={isAr ? "رقم المبنى" : "Building No."}>
                      <Input value={form.building_number} onChange={e => setForm(f => ({ ...f, building_number: e.target.value }))} dir="ltr" placeholder="8228" />
                    </FieldGroup>
                    <FieldGroup label={isAr ? "الرقم الإضافي" : "Additional No."}>
                      <Input value={form.additional_number} onChange={e => setForm(f => ({ ...f, additional_number: e.target.value }))} dir="ltr" placeholder="2121" />
                    </FieldGroup>
                    <FieldGroup label={isAr ? "رقم الوحدة" : "Unit No."}>
                      <Input value={form.unit_number} onChange={e => setForm(f => ({ ...f, unit_number: e.target.value }))} dir="ltr" placeholder="101" />
                    </FieldGroup>
                    <FieldGroup label={isAr ? "الرمز البريدي" : "Postal Code"}>
                      <Input value={form.postal_code} onChange={e => setForm(f => ({ ...f, postal_code: e.target.value }))} dir="ltr" placeholder="12345" />
                    </FieldGroup>
                  </div>
                  <div className="mt-4">
                    <BilingualField
                      labelAr="العنوان الكامل بالعربية" labelEn="Full Address (EN)"
                      valueAr={form.address_ar} valueEn={form.address}
                      onChangeAr={v => setForm(f => ({ ...f, address_ar: v }))}
                      onChangeEn={v => setForm(f => ({ ...f, address: v }))}
                      translateField={d.translateField} context={d.translateCtx}
                    />
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="text-xs font-semibold mb-3 flex items-center gap-2">
                    <Navigation className="h-3.5 w-3.5 text-primary" />
                    {isAr ? "العنوان الوطني السعودي" : "Saudi National Address"}
                  </h4>
                  <FieldGroup label={isAr ? "العنوان المختصر" : "Short Address"} hint={isAr ? "مثال: RAAA1234" : "e.g. RAAA1234"} className="mb-4">
                    <Input value={form.short_address} onChange={e => setForm(f => ({ ...f, short_address: e.target.value.toUpperCase() }))} dir="ltr" placeholder="RAAA1234" className="font-mono" />
                  </FieldGroup>
                  <BilingualField
                    labelAr="العنوان الوطني بالعربية" labelEn="National Address (EN)"
                    valueAr={form.national_address_ar} valueEn={form.national_address}
                    onChangeAr={v => setForm(f => ({ ...f, national_address_ar: v }))}
                    onChangeEn={v => setForm(f => ({ ...f, national_address: v }))}
                    translateField={d.translateField} context={d.translateCtx}
                  />
                </div>

                <Separator />

                <div>
                  <h4 className="text-xs font-semibold mb-3 flex items-center gap-2">
                    <Globe className="h-3.5 w-3.5 text-primary" />
                    {isAr ? "الإحداثيات والخريطة" : "GPS & Map"}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FieldGroup label={isAr ? "خط العرض" : "Latitude"}>
                      <Input value={form.latitude} onChange={e => setForm(f => ({ ...f, latitude: e.target.value }))} dir="ltr" placeholder="24.7136" />
                    </FieldGroup>
                    <FieldGroup label={isAr ? "خط الطول" : "Longitude"}>
                      <Input value={form.longitude} onChange={e => setForm(f => ({ ...f, longitude: e.target.value }))} dir="ltr" placeholder="46.6753" />
                    </FieldGroup>
                    <FieldGroup label={isAr ? "رابط خرائط جوجل" : "Google Maps URL"}>
                      <Input value={form.google_maps_url} onChange={e => setForm(f => ({ ...f, google_maps_url: e.target.value }))} dir="ltr" placeholder="https://maps.google.com/..." />
                    </FieldGroup>
                  </div>
                  {form.latitude && form.longitude && (
                    <a href={`https://www.google.com/maps?q=${form.latitude},${form.longitude}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2">
                      <ExternalLink className="h-3 w-3" />{isAr ? "فتح في خرائط جوجل" : "Open in Google Maps"}
                    </a>
                  )}
                </div>
              </TabsContent>

              {/* ═══ Team Tab ═══ */}
              <TabsContent value="team" className="space-y-6 mt-0">
                <SectionHeader
                  icon={Users}
                  title={isAr ? "جهات الاتصال الرئيسية" : "Key Contacts"}
                  desc={isAr ? "أعضاء الفريق وجهات الاتصال" : "Team members & contact persons"}
                  actions={<Button type="button" variant="outline" size="sm" className="h-7 text-xs gap-1 rounded-lg" onClick={d.addContact}><Plus className="h-3 w-3" />{isAr ? "إضافة" : "Add"}</Button>}
                />
                {form.key_contacts.length === 0 ? (
                  <Card className="rounded-2xl border-dashed">
                    <CardContent className="p-8 text-center">
                      <Users className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground mb-3">{isAr ? "لا توجد جهات اتصال بعد" : "No contacts added yet"}</p>
                      <Button type="button" variant="outline" size="sm" className="gap-1 text-xs rounded-lg" onClick={d.addContact}>
                        <Plus className="h-3 w-3" />{isAr ? "إضافة جهة اتصال" : "Add Contact"}
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {form.key_contacts.map((c, i) => (
                      <Card key={i} className="rounded-2xl hover:shadow-sm transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Users className="h-3.5 w-3.5 text-primary" />
                              </div>
                              <span className="text-xs font-medium">{c.name || c.name_ar || `${isAr ? "جهة اتصال" : "Contact"} ${i + 1}`}</span>
                              {c.role && <Badge variant="outline" className="text-[12px] h-4">{c.role}</Badge>}
                            </div>
                            <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive rounded-lg" onClick={() => d.removeContact(i)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            <FieldGroup label={isAr ? "الاسم بالعربية" : "Name (AR)"}>
                              <Input value={c.name_ar} onChange={e => d.updateContact(i, "name_ar", e.target.value)} dir="rtl" className="h-9" />
                            </FieldGroup>
                            <FieldGroup label={isAr ? "الاسم (EN)" : "Name (EN)"}>
                              <Input value={c.name} onChange={e => d.updateContact(i, "name", e.target.value)} className="h-9" />
                            </FieldGroup>
                            <FieldGroup label={isAr ? "المنصب بالعربية" : "Role (AR)"}>
                              <Input value={c.role_ar} onChange={e => d.updateContact(i, "role_ar", e.target.value)} dir="rtl" className="h-9" />
                            </FieldGroup>
                            <FieldGroup label={isAr ? "المنصب (EN)" : "Role (EN)"}>
                              <Input value={c.role} onChange={e => d.updateContact(i, "role", e.target.value)} className="h-9" placeholder="Director" />
                            </FieldGroup>
                            <FieldGroup label={isAr ? "البريد" : "Email"}>
                              <Input value={c.email} onChange={e => d.updateContact(i, "email", e.target.value)} type="email" className="h-9" dir="ltr" />
                            </FieldGroup>
                            <FieldGroup label={isAr ? "الهاتف" : "Phone"}>
                              <Input value={c.phone} onChange={e => d.updateContact(i, "phone", e.target.value)} dir="ltr" className="h-9" />
                            </FieldGroup>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* ═══ Details Tab ═══ */}
              <TabsContent value="details" className="space-y-6 mt-0">
                <SectionHeader icon={Briefcase} title={isAr ? "التفاصيل والخدمات" : "Details & Services"} desc={isAr ? "التسجيل والترخيص والخدمات" : "Registration, licensing & services"} />

                <Card className="rounded-2xl">
                  <CardContent className="p-4 space-y-4">
                    <h4 className="text-xs font-semibold flex items-center gap-2">
                      <FileCheck className="h-3.5 w-3.5 text-primary" />
                      {isAr ? "البيانات القانونية والتسجيل" : "Legal & Registration"}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <FieldGroup label={isAr ? "سنة التأسيس" : "Founded Year"} error={formErrors.founded_year}>
                        <Input value={form.founded_year} onChange={e => { setForm(f => ({ ...f, founded_year: e.target.value })); setFormErrors(e2 => ({ ...e2, founded_year: "" })); }} type="number" placeholder="2010" dir="ltr" />
                      </FieldGroup>
                      <FieldGroup label={isAr ? "رقم السجل التجاري" : "Commercial Registration"}>
                        <Input value={form.registration_number} onChange={e => setForm(f => ({ ...f, registration_number: e.target.value }))} placeholder="1010XXXXXX" dir="ltr" className="font-mono" />
                      </FieldGroup>
                      <FieldGroup label={isAr ? "رقم الترخيص" : "License Number"}>
                        <Input value={form.license_number} onChange={e => setForm(f => ({ ...f, license_number: e.target.value }))} placeholder="XXXXXX" dir="ltr" className="font-mono" />
                      </FieldGroup>
                      <FieldGroup label={isAr ? "الرقم الضريبي (VAT)" : "VAT Number"}>
                        <Input value={form.vat_number} onChange={e => setForm(f => ({ ...f, vat_number: e.target.value }))} placeholder="3XXXXXXXXXX003" dir="ltr" className="font-mono" />
                      </FieldGroup>
                    </div>
                    {form.founded_year && (
                      <p className="text-[12px] text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {isAr ? `تأسست منذ ${new Date().getFullYear() - parseInt(form.founded_year)} سنة` : `Established ${new Date().getFullYear() - parseInt(form.founded_year)} years ago`}
                      </p>
                    )}
                  </CardContent>
                </Card>

                <Card className="rounded-2xl">
                  <CardContent className="p-4 space-y-4">
                    <h4 className="text-xs font-semibold flex items-center gap-2">
                      <Briefcase className="h-3.5 w-3.5 text-primary" />
                      {isAr ? "الخدمات والقطاعات" : "Services & Sectors"}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FieldGroup label={isAr ? "الخدمات المقدمة" : "Services Offered"} hint={isAr ? "مفصولة بفاصلة" : "Comma-separated"}>
                        <Textarea value={form.services} onChange={e => setForm(f => ({ ...f, services: e.target.value }))} placeholder={isAr ? "تنظيم معارض، إدارة مؤتمرات، تدريب..." : "Exhibition management, Conference organizing, Training..."} rows={3} />
                      </FieldGroup>
                      <FieldGroup label={isAr ? "القطاعات المستهدفة" : "Targeted Sectors"} hint={isAr ? "مفصولة بفاصلة" : "Comma-separated"}>
                        <Textarea value={form.targeted_sectors} onChange={e => setForm(f => ({ ...f, targeted_sectors: e.target.value }))} placeholder={isAr ? "أغذية ومشروبات، ضيافة، سياحة..." : "Food & Beverage, Hospitality, Tourism..."} rows={3} />
                      </FieldGroup>
                    </div>
                    {(form.services || form.targeted_sectors) && (
                      <div className="pt-2">
                        <p className="text-[12px] font-semibold text-muted-foreground uppercase mb-2">{isAr ? "العلامات" : "Tags Preview"}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {form.services.split(",").filter(Boolean).map((s, i) => (
                            <Badge key={`s-${i}`} variant="secondary" className="text-[12px]">{s.trim()}</Badge>
                          ))}
                          {form.targeted_sectors.split(",").filter(Boolean).map((s, i) => (
                            <Badge key={`t-${i}`} variant="outline" className="text-[12px]">{s.trim()}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ═══ Social Tab ═══ */}
              <TabsContent value="social" className="space-y-6 mt-0">
                <SectionHeader icon={Globe} title={isAr ? "حسابات التواصل الاجتماعي" : "Social Media Profiles"} desc={isAr ? "جميع حسابات التواصل الاجتماعي" : "All social media links"} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    { key: "social_twitter", label: "Twitter / X", icon: Twitter, ph: "https://twitter.com/..." },
                    { key: "social_facebook", label: "Facebook", icon: Facebook, ph: "https://facebook.com/..." },
                    { key: "social_linkedin", label: "LinkedIn", icon: Linkedin, ph: "https://linkedin.com/..." },
                    { key: "social_instagram", label: "Instagram", icon: Instagram, ph: "https://instagram.com/..." },
                    { key: "social_youtube", label: "YouTube", icon: Youtube, ph: "https://youtube.com/..." },
                    { key: "social_tiktok", label: "TikTok", icon: Globe, ph: "https://tiktok.com/@..." },
                    { key: "social_whatsapp", label: "WhatsApp", icon: MessageCircle, ph: "+966..." },
                    { key: "social_snapchat", label: "Snapchat", icon: Globe, ph: "username" },
                  ].map(s => {
                    const val = form[s.key as keyof OrganizerForm] as string;
                    return (
                      <Card key={s.key} className={cn("rounded-xl transition-all", val ? "border-primary/20 bg-primary/[0.02]" : "")}>
                        <CardContent className="p-3 flex items-center gap-3">
                          <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0", val ? "bg-primary/10" : "bg-muted")}>
                            <s.icon className={cn("h-4 w-4", val ? "text-primary" : "text-muted-foreground")} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <Label className="text-[12px] font-medium text-muted-foreground">{s.label}</Label>
                            <Input
                              value={val}
                              onChange={e => setForm(f => ({ ...f, [s.key]: e.target.value }))}
                              placeholder={s.ph} dir="ltr" className="h-8 text-xs mt-1"
                            />
                          </div>
                          {val && <CheckCircle2 className="h-4 w-4 text-chart-2 shrink-0" />}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
                <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
                  <Progress value={(d.socialProfiles / 8) * 100} className="h-1.5 w-20" />
                  {d.socialProfiles}/8 {isAr ? "حسابات مرتبطة" : "profiles linked"}
                </div>
              </TabsContent>

              {/* ═══ Settings Tab ═══ */}
              <TabsContent value="settings" className="space-y-6 mt-0">
                <SectionHeader icon={Shield} title={isAr ? "الإعدادات والحالة" : "Settings & Status"} desc={isAr ? "الحالة والتوثيق والتمييز" : "Status, verification & featuring"} />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="rounded-2xl hover:shadow-sm transition-shadow">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center">
                          <Activity className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <Label className="text-xs font-medium">{isAr ? "الحالة" : "Status"}</Label>
                          <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                            <SelectTrigger className="h-8 w-28 mt-1 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active" className="text-xs">{isAr ? "نشط" : "Active"}</SelectItem>
                              <SelectItem value="pending" className="text-xs">{isAr ? "قيد المراجعة" : "Pending"}</SelectItem>
                              <SelectItem value="inactive" className="text-xs">{isAr ? "غير نشط" : "Inactive"}</SelectItem>
                              <SelectItem value="suspended" className="text-xs">{isAr ? "معلق" : "Suspended"}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="rounded-2xl hover:shadow-sm transition-shadow">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center", form.is_verified ? "bg-primary/10" : "bg-muted")}>
                          <CheckCircle2 className={cn("h-4 w-4", form.is_verified ? "text-primary" : "text-muted-foreground")} />
                        </div>
                        <div>
                          <Label className="text-xs font-medium">{isAr ? "موثق" : "Verified"}</Label>
                          <p className="text-[12px] text-muted-foreground">{isAr ? "جهة موثقة رسمياً" : "Officially verified"}</p>
                        </div>
                      </div>
                      <Switch checked={form.is_verified} onCheckedChange={v => setForm(f => ({ ...f, is_verified: v }))} />
                    </CardContent>
                  </Card>
                  <Card className="rounded-2xl hover:shadow-sm transition-shadow">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center", form.is_featured ? "bg-amber-500/10" : "bg-muted")}>
                          <Star className={cn("h-4 w-4", form.is_featured ? "text-amber-500" : "text-muted-foreground")} />
                        </div>
                        <div>
                          <Label className="text-xs font-medium">{isAr ? "مميز" : "Featured"}</Label>
                          <p className="text-[12px] text-muted-foreground">{isAr ? "يظهر في الواجهة" : "Appears prominently"}</p>
                        </div>
                      </div>
                      <Switch checked={form.is_featured} onCheckedChange={v => setForm(f => ({ ...f, is_featured: v }))} />
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* ═══ Exhibitions Tab ═══ */}
              <TabsContent value="exhibitions" className="space-y-6 mt-0">
                <SectionHeader icon={Calendar} title={isAr ? "المعارض والمسابقات" : "Events & Competitions"} desc={isAr ? "جميع المعارض والمسابقات المرتبطة" : "All linked exhibitions & competitions"} />

                {!organizerId ? (
                  <Card className="rounded-2xl border-dashed">
                    <CardContent className="p-8 text-center">
                      <Calendar className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground">{isAr ? "احفظ المنظم أولاً" : "Save organizer first"}</p>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    {d.linkedCompetitions && d.linkedCompetitions.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold mb-3 flex items-center gap-2">
                          <BarChart3 className="h-3.5 w-3.5 text-primary" />
                          {isAr ? "المسابقات" : "Competitions"} <Badge variant="outline" className="text-[12px] h-4">{d.linkedCompetitions.length}</Badge>
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {d.linkedCompetitions.map(comp => (
                            <Link key={comp.id} to={`/competitions/${comp.slug || comp.id}`} target="_blank" className="block">
                              <Card className="rounded-xl hover:shadow-sm transition-all group">
                                <CardContent className="p-3 flex items-center gap-3">
                                  {comp.cover_image_url ? (
                                    <img src={comp.cover_image_url} alt="" className="h-10 w-10 rounded-lg object-cover border shrink-0" loading="lazy" />
                                  ) : (
                                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                      <BarChart3 className="h-4 w-4 text-primary" />
                                    </div>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium truncate">{isAr ? (comp.title_ar || comp.title) : comp.title}</p>
                                    <div className="flex items-center gap-1.5">
                                      <Badge variant="outline" className="text-[12px] h-3.5 capitalize">{comp.status}</Badge>
                                      {comp.edition_year && <span className="text-[12px] text-muted-foreground">{comp.edition_year}</span>}
                                    </div>
                                  </div>
                                  <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                                </CardContent>
                              </Card>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {d.exhibitionGroups.length > 0 ? (
                      <div className="space-y-3">
                        <h4 className="text-xs font-semibold flex items-center gap-2">
                          <Calendar className="h-3.5 w-3.5 text-primary" />
                          {isAr ? "المعارض والمؤتمرات" : "Exhibitions & Conferences"} <Badge variant="outline" className="text-[12px] h-4">{d.linkedExhibitions?.length || 0}</Badge>
                        </h4>
                        {d.exhibitionGroups.map(group => {
                          const isExpanded = d.expandedGroup === group.baseName;
                          return (
                            <Card key={group.baseName} className="rounded-2xl overflow-hidden hover:shadow-sm transition-all">
                              <CardContent className="p-0">
                                <button type="button" onClick={() => d.setExpandedGroup(isExpanded ? null : group.baseName)}
                                  className="w-full flex items-center gap-3 p-4 text-start hover:bg-muted/30 transition-colors">
                                  {group.coverImage ? (
                                    <img src={group.coverImage} alt="" className="h-12 w-12 rounded-xl object-cover border shrink-0" loading="lazy" />
                                  ) : (
                                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                      <Calendar className="h-5 w-5 text-primary" />
                                    </div>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold truncate">{isAr ? group.baseNameAr : group.baseName}</p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                      <Badge variant="outline" className="text-[12px] h-4">{group.editions.length} {isAr ? "نسخة" : "editions"}</Badge>
                                      {group.editions[0]?.edition_year && <span className="text-[12px] text-muted-foreground">{group.editions[group.editions.length - 1]?.edition_year} — {group.editions[0].edition_year}</span>}
                                    </div>
                                  </div>
                                  <ChevronRight className={cn("h-4 w-4 text-muted-foreground transition-transform shrink-0", isExpanded && "rotate-90")} />
                                </button>
                                {isExpanded && (
                                  <div className="border-t border-border/40 px-4 py-3 bg-muted/20">
                                    <div className="space-y-1.5">
                                      {group.editions.map(ed => (
                                        <Link key={ed.id} to={`/exhibitions/${ed.slug || ed.id}`} target="_blank" className="block">
                                          <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-background transition-colors group/ed">
                                            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                              <span className="text-xs font-bold text-primary">{ed.edition_year || "—"}</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                              <p className="text-xs font-medium truncate">{isAr ? (ed.title_ar || ed.title) : ed.title}</p>
                                              {ed.edition_number && (
                                                <span className="text-[12px] text-muted-foreground">
                                                  {isAr ? `النسخة ${ed.edition_number}` : `Edition #${ed.edition_number}`}
                                                </span>
                                              )}
                                            </div>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                              <Badge variant={ed.status === "active" ? "default" : ed.status === "completed" ? "secondary" : "outline"} className="text-[12px] h-3.5 capitalize">{ed.status}</Badge>
                                              {ed.start_date && <span className="text-[12px] text-muted-foreground">{new Date(ed.start_date).toLocaleDateString()}</span>}
                                              {ed.view_count ? <span className="text-[12px] text-muted-foreground flex items-center gap-0.5"><Eye className="h-2.5 w-2.5" />{ed.view_count}</span> : null}
                                            </div>
                                            <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover/ed:opacity-100 transition-opacity shrink-0" />
                                          </div>
                                        </Link>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    ) : (
                      <Card className="rounded-2xl border-dashed">
                        <CardContent className="p-8 text-center">
                          <BarChart3 className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                          <p className="text-xs text-muted-foreground">{isAr ? "لا توجد معارض مرتبطة" : "No linked exhibitions"}</p>
                        </CardContent>
                      </Card>
                    )}
                  </>
                )}
              </TabsContent>

              {/* ═══ Analytics Tab ═══ */}
              <TabsContent value="analytics" className="space-y-6 mt-0">
                <SectionHeader
                  icon={TrendingUp}
                  title={isAr ? "التحليلات والأداء" : "Analytics & Performance"}
                  desc={isAr ? "إحصائيات تفصيلية حول أداء المنظم" : "Detailed performance metrics and insights"}
                  actions={organizerId ? (
                    <Button type="button" variant="outline" size="sm" className="h-7 text-xs gap-1 rounded-lg" onClick={() => d.refreshStatsMutation.mutate()} disabled={d.refreshStatsMutation.isPending}>
                      {d.refreshStatsMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                      {isAr ? "تحديث" : "Refresh"}
                    </Button>
                  ) : undefined}
                />
                {!organizerId ? (
                  <Card className="rounded-2xl border-dashed">
                    <CardContent className="p-8 text-center">
                      <TrendingUp className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground">{isAr ? "احفظ المنظم أولاً لعرض التحليلات" : "Save organizer first to view analytics"}</p>
                    </CardContent>
                  </Card>
                ) : orgData && (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        { label: isAr ? "المعارض" : "Total Events", value: orgData.total_exhibitions || 0, icon: Calendar, color: "text-primary", bg: "bg-primary/10" },
                        { label: isAr ? "المشاهدات" : "Total Views", value: (orgData.total_views || 0).toLocaleString(), icon: Eye, color: "text-chart-2", bg: "bg-chart-2/10" },
                        { label: isAr ? "المتابعون" : "Followers", value: orgData.follower_count || 0, icon: Users, color: "text-purple-600", bg: "bg-purple-600/10" },
                        { label: isAr ? "التقييم" : "Avg Rating", value: orgData.average_rating || "—", icon: Star, color: "text-amber-600", bg: "bg-amber-600/10" },
                      ].map(s => (
                        <Card key={s.label} className="rounded-2xl group hover:shadow-md transition-all">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3 mb-2">
                              <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center shrink-0", s.bg)}>
                                <s.icon className={cn("h-4 w-4", s.color)} />
                              </div>
                              <p className="text-[12px] text-muted-foreground">{s.label}</p>
                            </div>
                            <p className="text-2xl font-bold">{s.value}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    <Card className="rounded-2xl">
                      <CardContent className="p-4 space-y-4">
                        <h4 className="text-sm font-semibold flex items-center gap-2">
                          <Activity className="h-4 w-4 text-primary" />
                          {isAr ? "مؤشرات المشاركة" : "Engagement Metrics"}
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {[
                            { label: isAr ? "متوسط المشاهدات / معرض" : "Avg Views/Event", value: orgData.total_exhibitions > 0 ? Math.round((orgData.total_views || 0) / orgData.total_exhibitions).toLocaleString() : "—" },
                            { label: isAr ? "نسبة المتابعة" : "Follow Rate", value: orgData.total_views > 0 ? `${((orgData.follower_count || 0) / orgData.total_views * 100).toFixed(1)}%` : "—" },
                            { label: isAr ? "سنوات الخبرة" : "Years Active", value: form.founded_year ? `${new Date().getFullYear() - parseInt(form.founded_year)}` : "—" },
                            { label: isAr ? "حسابات التواصل" : "Social Profiles", value: d.socialProfiles },
                          ].map(m => (
                            <div key={m.label} className="rounded-xl bg-muted/40 p-3">
                              <p className="text-[12px] text-muted-foreground mb-1">{m.label}</p>
                              <p className="text-lg font-bold">{m.value}</p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="rounded-2xl">
                      <CardContent className="p-4 space-y-4">
                        <h4 className="text-sm font-semibold flex items-center gap-2">
                          <Zap className="h-4 w-4 text-primary" />
                          {isAr ? "صحة الملف الشخصي" : "Profile Health"}
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {[
                            { label: isAr ? "الاسم ثنائي اللغة" : "Bilingual Name", ok: !!(form.name && form.name_ar) },
                            { label: isAr ? "الوصف ثنائي اللغة" : "Bilingual Description", ok: !!(form.description && form.description_ar) },
                            { label: isAr ? "الشعار" : "Logo Uploaded", ok: !!form.logo_url },
                            { label: isAr ? "صورة الغلاف" : "Cover Image", ok: !!form.cover_image_url },
                            { label: isAr ? "معلومات التواصل" : "Contact Info", ok: !!(form.email && form.phone) },
                            { label: isAr ? "الموقع" : "Location Set", ok: !!(form.city && form.country) },
                            { label: isAr ? "الموقع الإلكتروني" : "Website", ok: !!form.website },
                            { label: isAr ? "حسابات اجتماعية (3+)" : "Social Media (3+)", ok: d.socialProfiles >= 3 },
                            { label: isAr ? "معرض الصور" : "Photo Gallery", ok: form.gallery_urls.length > 0 },
                            { label: isAr ? "فريق العمل" : "Team Contacts", ok: form.key_contacts.length > 0 },
                          ].map(item => (
                            <div key={item.label} className={cn("flex items-center gap-2.5 p-2 rounded-lg", item.ok ? "bg-chart-2/5" : "bg-muted/30")}>
                              <div className={cn("h-5 w-5 rounded-full flex items-center justify-center shrink-0", item.ok ? "bg-chart-2/20" : "bg-muted")}>
                                {item.ok ? <CheckCircle2 className="h-3 w-3 text-chart-2" /> : <div className="h-2 w-2 rounded-full bg-muted-foreground/30" />}
                              </div>
                              <span className={cn("text-xs", item.ok ? "text-foreground" : "text-muted-foreground")}>{item.label}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="rounded-2xl">
                      <CardContent className="p-4 space-y-3">
                        <h4 className="text-sm font-semibold flex items-center gap-2">
                          <History className="h-4 w-4 text-primary" />
                          {isAr ? "السجل الزمني" : "Timeline"}
                        </h4>
                        <div className="space-y-2">
                          {[
                            { label: isAr ? "تاريخ الإنشاء" : "Created", value: orgData.created_at ? new Date(orgData.created_at).toLocaleDateString(isAr ? "ar-SA" : "en-US", { year: "numeric", month: "long", day: "numeric" }) : "—" },
                            { label: isAr ? "آخر تحديث" : "Last Updated", value: orgData.updated_at ? new Date(orgData.updated_at).toLocaleDateString(isAr ? "ar-SA" : "en-US", { year: "numeric", month: "long", day: "numeric" }) : "—" },
                            { label: isAr ? "سنة التأسيس" : "Founded", value: form.founded_year || "—" },
                          ].map(t => (
                            <div key={t.label} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                              <span className="text-xs text-muted-foreground">{t.label}</span>
                              <span className="text-xs font-medium">{t.value}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}
              </TabsContent>

              {/* ═══ Notes Tab ═══ */}
              <TabsContent value="notes" className="space-y-6 mt-0">
                <SectionHeader icon={StickyNote} title={isAr ? "ملاحظات إدارية" : "Admin Notes"} desc={isAr ? "ملاحظات داخلية وبيانات وصفية" : "Internal notes & record metadata"} />
                <FieldGroup label={isAr ? "ملاحظات خاصة" : "Private Notes"} hint={isAr ? "مرئية فقط لفريق الإدارة" : "Only visible to admin team"}>
                  <Textarea value={form.admin_notes} onChange={e => setForm(f => ({ ...f, admin_notes: e.target.value }))} rows={5} placeholder={isAr ? "ملاحظات داخلية للفريق..." : "Internal team notes..."} />
                </FieldGroup>
                {organizerId && orgData && (
                  <Card className="rounded-2xl">
                    <CardContent className="p-4">
                      <p className="text-[12px] font-semibold text-muted-foreground uppercase mb-3">{isAr ? "معلومات السجل" : "Record Info"}</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                          { label: "ID", value: organizerId.slice(0, 8) + "...", copyable: organizerId },
                          { label: isAr ? "رقم المنظم" : "Number", value: orgData.organizer_number || "—" },
                          { label: isAr ? "تاريخ الإنشاء" : "Created", value: orgData.created_at ? new Date(orgData.created_at).toLocaleDateString(isAr ? "ar-SA" : "en-US") : "—" },
                          { label: isAr ? "آخر حفظ" : "Last Saved", value: d.lastSaved ? d.lastSaved.toLocaleTimeString(isAr ? "ar-SA" : "en-US") : "—" },
                        ].map(m => (
                          <div key={m.label} className="rounded-xl bg-muted/40 p-3 group">
                            <p className="text-[12px] text-muted-foreground">{m.label}</p>
                            <div className="flex items-center gap-1 mt-0.5">
                              <p className="text-xs font-medium font-mono truncate">{m.value}</p>
                              {"copyable" in m && m.copyable && (
                                <button type="button" onClick={() => { navigator.clipboard.writeText(m.copyable as string).then(null, () => {}); toast.info("Copied!"); }}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Copy className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* ── Tab Navigation Footer ── */}
              <div className="flex items-center justify-between pt-6 mt-6 border-t border-border/40">
                <Button variant="outline" size="sm" className="gap-1.5 rounded-xl" onClick={d.goPrevTab} disabled={d.currentTabIdx === 0}>
                  <ChevronLeft className="h-3.5 w-3.5" />
                  <span className="text-xs">{d.currentTabIdx > 0 ? (isAr ? TABS[d.currentTabIdx - 1].ar : TABS[d.currentTabIdx - 1].en) : (isAr ? "السابق" : "Previous")}</span>
                </Button>
                <span className="text-[12px] text-muted-foreground">{d.currentTabIdx + 1} / {TABS.length}</span>
                <Button variant="outline" size="sm" className="gap-1.5 rounded-xl" onClick={d.goNextTab} disabled={d.currentTabIdx === TABS.length - 1}>
                  <span className="text-xs">{d.currentTabIdx < TABS.length - 1 ? (isAr ? TABS[d.currentTabIdx + 1].ar : TABS[d.currentTabIdx + 1].en) : (isAr ? "التالي" : "Next")}</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </Tabs>
        </div>
      </div>

      {/* Discard confirmation */}
      <ConfirmDialog
        open={d.showDiscardConfirm}
        onOpenChange={d.setShowDiscardConfirm}
        title={isAr ? "تجاهل التغييرات؟" : "Discard changes?"}
        description={isAr ? "لديك تغييرات غير محفوظة. هل تريد تجاهلها؟" : "You have unsaved changes. Discard them?"}
        confirmLabel={isAr ? "تجاهل" : "Discard"}
        cancelLabel={isAr ? "البقاء" : "Stay"}
        onConfirm={d.handleDiscard}
        variant="destructive"
      />
    </div>
  );
}
