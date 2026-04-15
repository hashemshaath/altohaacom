import { memo } from "react";
import { SectionHeader, FieldGroup, EmptyHint } from "@/components/admin/exhibition/ExhibitionFormHelpers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EntityFormGuard } from "@/components/admin/EntityFormGuard";
import { AITextOptimizer } from "@/components/admin/AITextOptimizer";
import { OrganizerSearchSelector } from "@/components/admin/OrganizerSearchSelector";
import { VenueSearchSelector } from "@/components/admin/VenueSearchSelector";
import { ExhibitionMediaLibrary } from "@/components/admin/ExhibitionMediaLibrary";
import { ExhibitionSocialLinksEditor } from "@/components/admin/ExhibitionSocialLinksEditor";
import { ExhibitionOfficialsPanel } from "@/components/admin/ExhibitionOfficialsPanel";
import { ExhibitionDocumentsPanel } from "@/components/admin/ExhibitionDocumentsPanel";
import { ExhibitionSponsorsPanel } from "@/components/admin/ExhibitionSponsorsPanel";
import { ExhibitionCompetitionsPanel } from "@/components/admin/ExhibitionCompetitionsPanel";
import {
  Landmark, Calendar, MapPin, Building, Ticket, Tag, Globe, Save, X,
  Loader2, Trophy, GraduationCap, Mic, Image, Users, FileText, Layers,
  ChevronLeft, CheckCircle2, Info, Link as LinkIcon, Eye, CircleDot, Award,
  Clock, Star, Sparkles, ExternalLink, Hash, AlertTriangle, ArrowUpRight,
  ImageIcon, History, Activity, Camera, Upload, Palette, StickyNote,
  BarChart3, Copy, Pencil, type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MS_PER_DAY } from "@/lib/constants";
import { useExhibitionEditForm, statusOptions, typeOptions } from "./exhibition/useExhibitionEditForm";

interface SectionDef {
  id: string;
  icon: LucideIcon;
  en: string;
  ar: string;
  descEn: string;
  descAr: string;
  fields: string[];
}

const SECTIONS: SectionDef[] = [
  { id: "basic", icon: Landmark, en: "Basic Info", ar: "المعلومات الأساسية", descEn: "Title, description & series", descAr: "العنوان والوصف والسلسلة", fields: ["title", "title_ar", "description", "type"] },
  { id: "images", icon: Camera, en: "Images", ar: "الصور", descEn: "Cover, logo & display image", descAr: "الغلاف والشعار وصورة العرض", fields: ["cover_image_url"] },
  { id: "datetime", icon: Calendar, en: "Date & Schedule", ar: "التاريخ والجدول", descEn: "Timing & event content", descAr: "التوقيت ومحتوى الفعالية", fields: ["start_date", "end_date"] },
  { id: "location", icon: MapPin, en: "Location", ar: "الموقع", descEn: "Venue & address", descAr: "المقر والعنوان", fields: ["venue", "city", "country"] },
  { id: "organizer", icon: Building, en: "Organizer", ar: "الجهة المنظمة", descEn: "Organizer details", descAr: "بيانات المنظم", fields: ["organizer_name"] },
  { id: "tickets", icon: Ticket, en: "Tickets & Pricing", ar: "التذاكر والأسعار", descEn: "Entry & capacity", descAr: "الدخول والسعة", fields: ["is_free"] },
  { id: "links", icon: LinkIcon, en: "Links & Social", ar: "الروابط والتواصل", descEn: "URLs & social media", descAr: "الروابط ووسائل التواصل", fields: ["registration_url", "website_url"] },
  { id: "sponsors", icon: Award, en: "Sponsors & Partners", ar: "الرعاة والشركاء", descEn: "Manage sponsors", descAr: "إدارة الرعاة", fields: [] },
  { id: "competitions", icon: Trophy, en: "Competitions", ar: "المسابقات", descEn: "Linked competitions", descAr: "المسابقات المرتبطة", fields: [] },
  { id: "media", icon: FileText, en: "Media Library", ar: "مكتبة الوسائط", descEn: "Files & documents", descAr: "الملفات والمستندات", fields: [] },
  { id: "editions", icon: History, en: "Previous Editions", ar: "النسخ السابقة", descEn: "Edition history", descAr: "تاريخ النسخ", fields: [] },
  { id: "team", icon: Users, en: "Team & Officials", ar: "الفريق والمسؤولون", descEn: "Staff & officials", descAr: "الطاقم والمسؤولون", fields: [] },
  { id: "notes", icon: StickyNote, en: "Notes & Activity", ar: "الملاحظات والنشاط", descEn: "Internal notes & log", descAr: "ملاحظات داخلية وسجل", fields: [] },
];

const TYPE_ICONS: Record<string, LucideIcon> = {
  Landmark, Mic, Star, GraduationCap, Sparkles, Building, Trophy,
};

interface ExhibitionEditFormProps {
  exhibition?: any;
  onClose: () => void;
}

export const ExhibitionEditForm = memo(function ExhibitionEditForm({ exhibition, onClose }: ExhibitionEditFormProps) {
  const d = useExhibitionEditForm(exhibition, onClose);
  const { isAr, t, form, updateField, editingId } = d;

  const typeIcon = d.currentType ? TYPE_ICONS[d.currentType.iconName] : undefined;

  return (
    <TooltipProvider>
    <div className="flex flex-col h-[calc(100vh-8rem)] rounded-2xl border border-border/60 bg-card overflow-hidden shadow-[var(--shadow-md)]">
      {/* ═══ Top Bar ═══ */}
      <div className="flex items-center justify-between gap-3 border-b bg-gradient-to-r from-card to-muted/20 px-4 py-2.5 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 rounded-xl" onClick={onClose}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">{t("Back to list", "العودة للقائمة")}</TooltipContent>
          </Tooltip>

          {form.cover_image_url && (
            <div className="hidden sm:block h-9 w-14 rounded-lg overflow-hidden border border-border/40 shrink-0">
              <img loading="lazy" decoding="async" src={form.cover_image_url} alt={form.title || "Exhibition cover"} className="h-full w-full object-cover" />
            </div>
          )}

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold truncate">
                {editingId ? (form.title || t("Edit Exhibition", "تعديل الفعالية")) : t("New Exhibition", "فعالية جديدة")}
              </h2>
              {d.editionYear && (
                <Badge variant="outline" className="text-xs h-5 px-1.5 shrink-0 font-mono">{d.editionYear}</Badge>
              )}
              {form.is_featured && (
                <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500 shrink-0" />
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {d.currentType && typeIcon && (
                <span className="flex items-center gap-1">
                  {(() => { const Icon = typeIcon; return <Icon className="h-2.5 w-2.5" />; })()}
                  {isAr ? d.currentType.ar : d.currentType.en}
                </span>
              )}
              {form.city && (
                <>
                  <span>·</span>
                  <span className="flex items-center gap-0.5">
                    <MapPin className="h-2.5 w-2.5" />
                    {form.city}
                  </span>
                </>
              )}
              {d.lastSaved && (
                <>
                  <span>·</span>
                  <span className="flex items-center gap-0.5">
                    <Clock className="h-2.5 w-2.5" />
                    {t("Saved", "محفوظ")} {d.lastSaved.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="hidden sm:flex items-center gap-1.5 rounded-xl bg-muted/50 px-2.5 py-1.5 cursor-default">
                <div className="relative h-5 w-5">
                  <svg className="h-5 w-5 -rotate-90" viewBox="0 0 20 20">
                    <circle cx="10" cy="10" r="8" fill="none" stroke="hsl(var(--muted))" strokeWidth="2.5" />
                    <circle cx="10" cy="10" r="8" fill="none" stroke={d.completeness === 100 ? "hsl(var(--chart-2))" : "hsl(var(--primary))"} strokeWidth="2.5" strokeDasharray={`${d.completeness * 0.5} 100`} strokeLinecap="round" className="transition-all duration-500" />
                  </svg>
                </div>
                <span className="text-xs font-bold tabular-nums">{d.completeness}%</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>{t("Form completeness", "اكتمال النموذج")}</TooltipContent>
          </Tooltip>

          {d.daysUntilStart !== null && d.daysUntilStart > 0 && d.daysUntilStart <= 90 && (
            <Badge variant="outline" className="hidden lg:flex text-xs h-6 gap-1 font-medium">
              <Clock className="h-3 w-3" />
              {d.daysUntilStart} {t("days", "يوم")}
            </Badge>
          )}

          <Select value={form.status || "draft"} onValueChange={v => updateField("status", v)}>
            <SelectTrigger className="h-8 w-[130px] text-xs gap-1.5">
              <span className={cn("h-2 w-2 rounded-full shrink-0", d.currentStatus?.color || "bg-muted-foreground")} />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>
                  <span className="flex items-center gap-2">
                    <span className={cn("h-2 w-2 rounded-full", opt.color)} />
                    {isAr ? opt.ar : opt.en}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Separator orientation="vertical" className="h-6" />

          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={onClose}>
            <X className="me-1 h-3 w-3" />
            {t("Cancel", "إلغاء")}
          </Button>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                className="h-8 text-xs"
                onClick={() => d.saveMutation.mutate()}
                disabled={d.saveMutation.isPending || !form.title || !form.start_date || !form.end_date || d.editionFieldsDisabled}
              >
                {d.saveMutation.isPending ? <Loader2 className="me-1 h-3 w-3 animate-spin" /> : <Save className="me-1 h-3 w-3" />}
                {editingId ? t("Save", "حفظ") : t("Create", "إنشاء")}
              </Button>
            </TooltipTrigger>
            <TooltipContent>⌘S</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* ═══ Body: Sidebar + Content ═══ */}
      <div className="flex flex-1 min-h-0">
        {/* ── Sidebar Navigation ── */}
        <nav aria-label="Exhibition form sections" className="hidden md:flex w-56 shrink-0 flex-col border-e bg-muted/10">
          {form.cover_image_url && (
            <div className="relative h-28 w-full overflow-hidden border-b">
              <img loading="lazy" decoding="async" src={form.cover_image_url} alt={isAr ? "صورة غلاف المعرض" : "Exhibition cover"} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-2 start-2.5 end-2.5">
                <p className="text-xs text-white/90 font-medium truncate">{form.title || t("Untitled", "بدون عنوان")}</p>
                {d.editionYear && <p className="text-xs text-white/70">{t("Edition", "النسخة")} {d.editionYear}</p>}
              </div>
            </div>
          )}

          <ScrollArea className="flex-1 py-2 px-2">
            {SECTIONS.map((sec) => {
              const status = d.getSectionStatus(sec.id);
              const isActive = d.activeSection === sec.id;
              const dotColor = status === "complete" ? "bg-chart-2" : status === "partial" ? "bg-chart-4" : "bg-muted-foreground/20";
              return (
                <button
                  key={sec.id}
                  onClick={() => d.scrollToSection(sec.id)}
                  className={cn(
                    "w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-start transition-all duration-200 mb-0.5 group/nav",
                    isActive
                      ? "bg-primary/10 text-primary shadow-sm"
                      : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                  )}
                >
                  <div className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-lg shrink-0 transition-colors",
                    isActive ? "bg-primary/15" : "bg-muted/40 group-hover/nav:bg-muted/60"
                  )}>
                    <sec.icon className="h-3 w-3" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-medium block truncate">{isAr ? sec.ar : sec.en}</span>
                    <span className={cn("text-xs block truncate transition-colors", isActive ? "text-primary/60" : "text-muted-foreground/50")}>{isAr ? sec.descAr : sec.descEn}</span>
                  </div>
                  <span className={cn("h-2 w-2 rounded-full shrink-0 transition-colors", dotColor)} />
                </button>
              );
            })}
          </ScrollArea>

          <div className="px-3 py-2 border-t space-y-1.5">
            {editingId && exhibition?.slug && (
              <Button variant="ghost" size="sm" className="w-full justify-start text-xs gap-2 h-8" asChild>
                <a href={`/exhibitions/${exhibition.slug}`} target="_blank" rel="noopener noreferrer">
                  <Eye className="h-3.5 w-3.5" />
                  {t("Preview", "معاينة")}
                  <ExternalLink className="h-2.5 w-2.5 ms-auto text-muted-foreground" />
                </a>
              </Button>
            )}
            <div className="text-xs text-muted-foreground/50 text-center">
              ⌘S {t("to save", "للحفظ")}
            </div>
          </div>
        </nav>

        {/* ── Scrollable Content ── */}
        <div ref={d.scrollContainerRef} className="flex-1 overflow-y-auto scroll-smooth bg-muted/5">
          <div className="max-w-3xl mx-auto py-5 px-4 sm:px-6 space-y-1">

            <EntityFormGuard
              entity={{ name: (form.title as string) || "", name_ar: (form.title_ar as string) || "", website: (form.website_url as string) || "", city: (form.city as string) || "", country: (form.country as string) || "" }}
              tables={["exhibitions", "organizers", "companies"]}
              excludeId={editingId || undefined}
              translationFields={[
                { en: (form.title as string) || null, ar: (form.title_ar as string) || null, key: "title" },
                { en: (form.description as string) || null, ar: (form.description_ar as string) || null, key: "description" },
              ]}
              translationContext="exhibition / food event / trade show"
              onTranslated={(u) => d.setForm(f => ({ ...f, ...u }))}
            />

            {/* ═══ Section: Basic Info ═══ */}
            <section
              ref={(el: HTMLDivElement | null) => { d.sectionRefs.current["basic"] = el; }}
              data-section="basic"
              className="rounded-2xl border border-border/40 bg-card p-5 space-y-5 shadow-sm"
            >
              <SectionHeader icon={Landmark} title={t("Basic Info", "المعلومات الأساسية")} desc={t("Title, description, series & edition", "العنوان والوصف والسلسلة والنسخة")} status={d.getSectionStatus("basic")} />

              {/* Series & Edition */}
              <div className="rounded-xl border border-primary/10 bg-gradient-to-br from-primary/[0.02] to-transparent p-4 space-y-3">
                <p className="text-xs font-semibold text-primary/80 flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5" />
                  {t("Event Series & Edition", "سلسلة الفعالية والإصدار")}
                </p>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <Label className="text-xs">{t("Event Series", "سلسلة الفعاليات")}</Label>
                    <Select value={d.selectedSeriesId || "none"} onValueChange={v => {
                      const sid = v === "none" ? null : v;
                      d.setSelectedSeriesId(sid);
                      if (sid && !editingId) {
                        const series = d.seriesList?.find(s => s.id === sid);
                        if (series) {
                          if (series.default_venue) updateField("venue", series.default_venue);
                          if (series.default_venue_ar) updateField("venue_ar", series.default_venue_ar);
                          if (series.default_city) updateField("city", series.default_city);
                          if (series.default_country) updateField("country", series.default_country);
                          if (series.default_organizer_name) updateField("organizer_name", series.default_organizer_name);
                          if (series.default_organizer_name_ar) updateField("organizer_name_ar", series.default_organizer_name_ar);
                          if (series.default_organizer_email) updateField("organizer_email", series.default_organizer_email);
                          if (series.cover_image_url) updateField("cover_image_url", series.cover_image_url);
                          if (series.tags) d.setTagsInput(series.tags.join(", "));
                        }
                      }
                    }}>
                      <SelectTrigger className="h-9"><SelectValue placeholder={t("No series", "بدون سلسلة")} /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">{t("No series (standalone)", "بدون سلسلة (مستقل)")}</SelectItem>
                        {d.seriesList?.map(s => (
                          <SelectItem key={s.id} value={s.id}>{isAr && s.name_ar ? s.name_ar : s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">{t("Edition Year", "سنة الإصدار")}</Label>
                    <Select value={d.editionYear ? String(d.editionYear) : "none"} onValueChange={v => {
                      const yr = v === "none" ? null : parseInt(v);
                      d.setEditionYear(yr);
                    }}>
                      <SelectTrigger className={cn("h-9 transition-all", d.editionHasData && "border-chart-2/60 bg-chart-2/5 text-chart-2 ring-1 ring-chart-2/20")}><SelectValue placeholder={t("Select year", "اختر السنة")} /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">{t("Not set", "غير محدد")}</SelectItem>
                        {(() => {
                          const currentYear = new Date().getFullYear();
                          const years: number[] = [];
                          for (let y = currentYear + 5; y >= currentYear - 20; y--) years.push(y);
                          return years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>);
                        })()}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">{t("Edition Number", "رقم الإصدار")}</Label>
                    <Select disabled={d.editionFieldsDisabled} value={d.editionNumber ? String(d.editionNumber) : "none"} onValueChange={v => d.setEditionNumber(v === "none" ? null : parseInt(v))}>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder={t("Select edition", "اختر الإصدار")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">{t("Not set", "غير محدد")}</SelectItem>
                        {Array.from({ length: 50 }, (_, i) => i + 1).map(n => {
                          const ordinalEn = n === 1 ? "1st" : n === 2 ? "2nd" : n === 3 ? "3rd" : `${n}th`;
                          const ordinalAr = ["الأولى","الثانية","الثالثة","الرابعة","الخامسة","السادسة","السابعة","الثامنة","التاسعة","العاشرة",
                            "الحادية عشرة","الثانية عشرة","الثالثة عشرة","الرابعة عشرة","الخامسة عشرة","السادسة عشرة","السابعة عشرة","الثامنة عشرة","التاسعة عشرة","العشرون",
                            "الحادية والعشرون","الثانية والعشرون","الثالثة والعشرون","الرابعة والعشرون","الخامسة والعشرون","السادسة والعشرون","السابعة والعشرون","الثامنة والعشرون","التاسعة والعشرون","الثلاثون",
                            "الحادية والثلاثون","الثانية والثلاثون","الثالثة والثلاثون","الرابعة والثلاثون","الخامسة والثلاثون","السادسة والثلاثون","السابعة والثلاثون","الثامنة والثلاثون","التاسعة والثلاثون","الأربعون",
                            "الحادية والأربعون","الثانية والأربعون","الثالثة والأربعون","الرابعة والأربعون","الخامسة والأربعون","السادسة والأربعون","السابعة والأربعون","الثامنة والأربعون","التاسعة والأربعون","الخمسون"
                          ][n - 1] || `${n}`;
                          return (
                            <SelectItem key={n} value={String(n)}>
                              {isAr ? `النسخة ${ordinalAr}` : `${ordinalEn} Edition`}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Edition status feedback */}
                {d.selectedSeriesId && d.editionYear && (
                  <div className="mt-2">
                    {d.editionLoading ? (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        {t("Checking edition...", "جارِ التحقق من النسخة...")}
                      </div>
                    ) : d.existingEdition ? (
                      <div className="flex items-center gap-3 rounded-xl border border-chart-2/20 bg-chart-2/5 p-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-chart-2/10 shrink-0">
                          <CheckCircle2 className="h-4 w-4 text-chart-2" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-chart-2">
                            {t("Edition loaded", "تم تحميل النسخة")}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {isAr && d.existingEdition.title_ar ? d.existingEdition.title_ar : d.existingEdition.title}
                            {" · "}{t("Edition", "النسخة")} #{d.existingEdition.edition_number || "?"}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs h-5">{d.existingEdition.status}</Badge>
                      </div>
                    ) : !d.editionConfirmed ? (
                      <div className="flex items-center gap-3 rounded-xl border border-chart-4/20 bg-chart-4/5 p-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-chart-4/10 shrink-0">
                          <AlertTriangle className="h-4 w-4 text-chart-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-chart-4">{t("New edition", "نسخة جديدة")}</p>
                          <p className="text-xs text-muted-foreground">
                            {t("No data found for", "لم يتم العثور على بيانات لعام")} {d.editionYear}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          className="h-7 text-xs px-3 gap-1.5"
                          onClick={() => { d.setEditionResolved(true); d.setEditionConfirmed(true); }}
                        >
                          <Sparkles className="h-3 w-3" />
                          {t(`Add ${d.editionYear} Edition`, `إضافة نسخة ${d.editionYear}`)}
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-xs text-chart-2">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {t("New edition confirmed", "تم تأكيد النسخة الجديدة")}
                        <Badge variant="outline" className="text-xs h-5 ms-auto">{d.editionYear}</Badge>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Lock overlay */}
              {d.formLocked && (
                <div className="rounded-xl border border-chart-4/20 bg-chart-4/5 p-5 text-center space-y-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-chart-4/10 mx-auto">
                    <Layers className="h-5 w-5 text-chart-4" />
                  </div>
                  <p className="text-sm font-semibold">{t("Select an edition year to continue", "اختر سنة الإصدار للمتابعة")}</p>
                  <p className="text-xs text-muted-foreground">{t("Choose a year above to load or create an edition", "اختر سنة أعلاه لتحميل أو إنشاء نسخة")}</p>
                </div>
              )}

              {/* Title */}
              <div className={cn("grid gap-4 sm:grid-cols-2", d.formLocked && "opacity-40 pointer-events-none")}>
                <FieldGroup label={t("Title (English)", "العنوان (إنجليزي)")} required aiSlot={<AITextOptimizer text={form.title || ""} lang="en" onOptimized={v => updateField("title", v)} onTranslated={v => updateField("title_ar", v)} />}>
                  <Input className="h-9" value={form.title || ""} onChange={e => updateField("title", e.target.value)} placeholder={t("Exhibition title", "عنوان المعرض")} />
                </FieldGroup>
                <FieldGroup label={t("Title (Arabic)", "العنوان (عربي)")} aiSlot={<AITextOptimizer text={form.title_ar || ""} lang="ar" onOptimized={v => updateField("title_ar", v)} onTranslated={v => updateField("title", v)} />}>
                  <Input className="h-9" value={form.title_ar || ""} onChange={e => updateField("title_ar", e.target.value)} dir="rtl" />
                </FieldGroup>
              </div>

              <div className={cn(d.formLocked && "opacity-40 pointer-events-none", "space-y-4")}>
                <FieldGroup label={t("URL Slug", "الرابط المختصر")} hint={form.slug ? `/${form.slug}` : undefined}>
                  <Input className="h-9 font-mono text-xs max-w-md" value={form.slug || ""} onChange={e => updateField("slug", e.target.value)} placeholder="auto-generated-from-title" startIcon={<Hash className="h-3 w-3" />} />
                </FieldGroup>

                <div className="grid gap-4 sm:grid-cols-2">
                  <FieldGroup label={t("Description (EN)", "الوصف (إنجليزي)")} aiSlot={<AITextOptimizer text={form.description || ""} lang="en" onOptimized={v => updateField("description", v)} onTranslated={v => updateField("description_ar", v)} />}>
                    <Textarea className="min-h-[100px] text-sm" value={form.description || ""} onChange={e => updateField("description", e.target.value)} />
                  </FieldGroup>
                  <FieldGroup label={t("Description (AR)", "الوصف (عربي)")} aiSlot={<AITextOptimizer text={form.description_ar || ""} lang="ar" onOptimized={v => updateField("description_ar", v)} onTranslated={v => updateField("description", v)} />}>
                    <Textarea className="min-h-[100px] text-sm" value={form.description_ar || ""} onChange={e => updateField("description_ar", e.target.value)} dir="rtl" />
                  </FieldGroup>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <FieldGroup label={t("Tags", "الوسوم")} hint={t("Comma-separated", "مفصولة بفاصلة")}>
                    <Input className="h-9" value={d.tagsInput} onChange={e => d.setTagsInput(e.target.value)} placeholder="food, beverages" startIcon={<Tag className="h-3 w-3" />} />
                  </FieldGroup>
                  <FieldGroup label={t("Target Audience", "الجمهور المستهدف")} hint={t("Comma-separated", "مفصولة بفاصلة")}>
                    <Input className="h-9" value={d.audienceInput} onChange={e => d.setAudienceInput(e.target.value)} placeholder="Chefs, Owners" startIcon={<Users className="h-3 w-3" />} />
                  </FieldGroup>
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <Switch checked={form.is_featured || false} onCheckedChange={v => updateField("is_featured", v)} />
                  <Label className="text-xs flex items-center gap-1.5">
                    <Star className="h-3 w-3 text-amber-500" />
                    {t("Featured Event", "فعالية مميزة")}
                  </Label>
                </div>
              </div>
            </section>

            {/* ═══ Section: Images ═══ */}
            <section
              ref={(el: HTMLDivElement | null) => { d.sectionRefs.current["images"] = el; }}
              data-section="images"
              className="rounded-2xl border border-border/40 bg-card p-5 space-y-5 shadow-sm"
            >
              <SectionHeader icon={Camera} title={t("Images", "الصور")} desc={t("Cover image, logo & display image", "صورة الغلاف والشعار وصورة العرض")} status={d.getSectionStatus("images")} />

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <FieldGroup label={t("Cover Image", "صورة الغلاف")}>
                    <Input className="h-9" value={form.cover_image_url || ""} onChange={e => updateField("cover_image_url", e.target.value)} placeholder="https://..." startIcon={<Image className="h-3 w-3" />} />
                  </FieldGroup>
                  {form.cover_image_url ? (
                    <div className="relative h-32 rounded-xl overflow-hidden border border-border/40 group">
                      <img loading="lazy" decoding="async" src={form.cover_image_url} alt={form.title || "Exhibition cover"} className="h-full w-full object-cover" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg bg-black/50 text-primary-foreground opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => updateField("cover_image_url", "")}>
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <Badge className="absolute bottom-1.5 start-1.5 text-xs h-4 bg-black/60 text-primary-foreground border-0">{t("Cover", "غلاف")}</Badge>
                    </div>
                  ) : (
                    <div className="h-32 rounded-xl border-2 border-dashed border-border/40 flex flex-col items-center justify-center text-muted-foreground/40">
                      <Image className="h-6 w-6 mb-1" />
                      <span className="text-xs">{t("No cover image", "لا توجد صورة غلاف")}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <FieldGroup label={t("Logo", "الشعار")}>
                    <Input className="h-9" value={d.logoUrl} onChange={e => d.setLogoUrl(e.target.value)} placeholder="https://..." startIcon={<Palette className="h-3 w-3" />} />
                  </FieldGroup>
                  {d.logoUrl ? (
                    <div className="relative h-32 rounded-xl overflow-hidden border border-border/40 bg-muted/10 flex items-center justify-center group">
                      <img loading="lazy" decoding="async" src={d.logoUrl} alt={form.title ? `${form.title} logo` : "Exhibition logo"} className="max-h-24 max-w-full object-contain" />
                      <Button variant="ghost" size="icon" className="absolute top-1.5 end-1.5 h-6 w-6 rounded-lg bg-black/50 text-primary-foreground opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => d.setLogoUrl("")}>
                        <X className="h-3 w-3" />
                      </Button>
                      <Badge className="absolute bottom-1.5 start-1.5 text-xs h-4 bg-black/60 text-primary-foreground border-0">{t("Logo", "شعار")}</Badge>
                    </div>
                  ) : (
                    <div className="h-32 rounded-xl border-2 border-dashed border-border/40 flex flex-col items-center justify-center text-muted-foreground/40">
                      <Palette className="h-6 w-6 mb-1" />
                      <span className="text-xs">{t("No logo", "لا يوجد شعار")}</span>
                    </div>
                  )}
                </div>
              </div>

              {(form.cover_image_url || d.logoUrl) && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground rounded-lg bg-muted/20 px-3 py-1.5 w-fit">
                  <CheckCircle2 className="h-3 w-3 text-chart-2" />
                  {[form.cover_image_url && t("Cover", "غلاف"), d.logoUrl && t("Logo", "شعار")].filter(Boolean).join(" · ")} {t("uploaded", "مرفوعة")}
                </div>
              )}
            </section>

            <div className={cn(d.formLocked && "opacity-40 pointer-events-none select-none", "space-y-1")}>

            {/* ═══ Section: Date & Schedule ═══ */}
            <section
              ref={(el: HTMLDivElement | null) => { d.sectionRefs.current["datetime"] = el; }}
              data-section="datetime"
              className="rounded-2xl border border-border/40 bg-card p-5 space-y-5 shadow-sm"
            >
              <SectionHeader icon={Calendar} title={t("Date & Schedule", "التاريخ والجدول")} desc={t("Event timing, type & content categories", "التوقيت ونوع الفعالية وفئات المحتوى")} status={d.getSectionStatus("datetime")} />

              <div className="grid gap-4 sm:grid-cols-3">
                <FieldGroup label={t("Type", "النوع")}>
                  <Select value={form.type || "exhibition"} onValueChange={v => updateField("type", v)}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {typeOptions.map(opt => {
                        const Icon = TYPE_ICONS[opt.iconName];
                        return (
                          <SelectItem key={opt.value} value={opt.value}>
                            <span className="flex items-center gap-2">
                              {Icon && <Icon className="h-3 w-3 text-muted-foreground" />}
                              {isAr ? opt.ar : opt.en}
                            </span>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </FieldGroup>
                <FieldGroup label={t("Currency", "العملة")}>
                  <Select value={d.currency} onValueChange={d.setCurrency}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {d.countries?.filter(c => c.currency_code).map(c => (
                        <SelectItem key={c.code} value={c.currency_code!}>{c.currency_code}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FieldGroup>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <FieldGroup label={t("Start Date", "تاريخ البدء")} required>
                  <Input className="h-9" type="datetime-local" value={form.start_date || ""} onChange={e => updateField("start_date", e.target.value)} />
                </FieldGroup>
                <FieldGroup label={t("End Date", "تاريخ الانتهاء")} required>
                  <Input className="h-9" type="datetime-local" value={form.end_date || ""} onChange={e => updateField("end_date", e.target.value)} />
                </FieldGroup>
                <FieldGroup label={t("Registration Deadline", "آخر موعد للتسجيل")}>
                  <Input className="h-9" type="datetime-local" value={(form as Record<string, unknown>).registration_deadline as string || ""} onChange={e => updateField("registration_deadline", e.target.value)} />
                </FieldGroup>
              </div>

              {form.start_date && form.end_date && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground rounded-lg bg-muted/30 px-3 py-1.5 w-fit">
                  <Clock className="h-3 w-3" />
                  {(() => {
                    const days = Math.ceil((new Date(form.end_date).getTime() - new Date(form.start_date).getTime()) / MS_PER_DAY);
                    return days > 0 ? `${days} ${t("day(s)", "يوم")}` : t("Same day", "نفس اليوم");
                  })()}
                </div>
              )}

              <div className="rounded-xl border border-border/30 bg-muted/20 p-4">
                <p className="text-xs font-semibold text-muted-foreground mb-3 flex items-center gap-1.5">
                  <Sparkles className="h-3 w-3" />
                  {t("Event Content", "محتوى الفعالية")}
                </p>
                <div className="flex flex-wrap gap-3">
                  {[
                    { checked: d.includesCompetitions, onChange: d.setIncludesCompetitions, icon: Trophy, color: "text-chart-4", label: t("Competitions", "مسابقات") },
                    { checked: d.includesTraining, onChange: d.setIncludesTraining, icon: GraduationCap, color: "text-chart-2", label: t("Training / Workshops", "تدريب / ورش عمل") },
                    { checked: d.includesSeminars, onChange: d.setIncludesSeminars, icon: Mic, color: "text-chart-1", label: t("Seminars / Talks", "ندوات / محاضرات") },
                  ].map((item, i) => (
                    <label key={i} className={cn("flex items-center gap-2.5 cursor-pointer rounded-xl border px-3 py-2 transition-all", item.checked ? "border-primary/20 bg-primary/5" : "border-transparent hover:bg-muted/40")}>
                      <Checkbox checked={item.checked} onCheckedChange={(v) => item.onChange(!!v)} />
                      <item.icon className={cn("h-4 w-4", item.color)} />
                      <span className="text-xs font-medium">{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </section>

            {/* ═══ Section: Location ═══ */}
            <section
              ref={(el: HTMLDivElement | null) => { d.sectionRefs.current["location"] = el; }}
              data-section="location"
              className="rounded-2xl border border-border/40 bg-card p-5 space-y-5 shadow-sm"
            >
              <SectionHeader icon={MapPin} title={t("Location & Venue", "الموقع والمقر")} desc={t("Physical or virtual event location", "موقع الحدث الفعلي أو الافتراضي")} status={d.getSectionStatus("location")} />

              <div className="flex items-center gap-3 rounded-xl bg-muted/20 px-3 py-2">
                <Switch checked={form.is_virtual || false} onCheckedChange={v => updateField("is_virtual", v)} />
                <Label className="flex items-center gap-1.5 text-xs font-medium">
                  <Globe className="h-3.5 w-3.5 text-primary" />
                  {t("Virtual Event", "حدث افتراضي")}
                </Label>
              </div>

              {form.is_virtual ? (
                <FieldGroup label={t("Virtual Event Link", "رابط الحدث الافتراضي")}>
                  <Input className="h-9 max-w-md" value={form.virtual_link || ""} onChange={e => updateField("virtual_link", e.target.value)} placeholder="https://zoom.us/..." startIcon={<LinkIcon className="h-3 w-3" />} />
                </FieldGroup>
              ) : (
                <>
                  {(() => {
                    const currentYear = new Date().getFullYear();
                    const canAssignVenue = !d.editionYear || (d.editionYear >= currentYear && d.editionYear <= currentYear + 1);
                    return (
                      <div className={cn(!canAssignVenue && "opacity-50 pointer-events-none")}>
                        <VenueSearchSelector
                          value={d.selectedVenue}
                          onChange={d.setSelectedVenue}
                          onVenueSelected={(v) => {
                            updateField("venue", v.name);
                            updateField("venue_ar", v.nameAr || "");
                            if (v.city) updateField("city", v.city);
                            if (v.country) updateField("country", v.country);
                            if (v.mapUrl) updateField("map_url", v.mapUrl);
                          }}
                          isAr={isAr}
                          disabled={!canAssignVenue}
                        />
                        {!canAssignVenue && (
                          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <Info className="h-3 w-3" />
                            {t("Venue can only be assigned for current or next year", "يمكن تعيين المقر فقط للسنة الحالية أو القادمة")}
                          </p>
                        )}
                      </div>
                    );
                  })()}

                  <div className="rounded-xl border border-border/30 bg-muted/10 p-4 space-y-3 mt-2">
                    <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                      <MapPin className="h-3 w-3" />
                      {t("Location Details", "تفاصيل الموقع")}
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <FieldGroup label={t("Venue (EN)", "المكان (EN)")} aiSlot={<AITextOptimizer text={form.venue || ""} lang="en" onTranslated={v => updateField("venue_ar", v)} compact />}>
                        <Input className="h-9" value={form.venue || ""} onChange={e => updateField("venue", e.target.value)} />
                      </FieldGroup>
                      <FieldGroup label={t("Venue (AR)", "المكان (AR)")} aiSlot={<AITextOptimizer text={form.venue_ar || ""} lang="ar" onTranslated={v => updateField("venue", v)} compact />}>
                        <Input className="h-9" value={form.venue_ar || ""} onChange={e => updateField("venue_ar", e.target.value)} dir="rtl" />
                      </FieldGroup>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <FieldGroup label={t("City", "المدينة")}>
                        <Input className="h-9" value={form.city || ""} onChange={e => updateField("city", e.target.value)} />
                      </FieldGroup>
                      <FieldGroup label={t("Country", "الدولة")}>
                        <Input className="h-9" value={form.country || ""} onChange={e => updateField("country", e.target.value)} />
                      </FieldGroup>
                    </div>
                    <FieldGroup label={t("Map URL", "رابط الخريطة")}>
                      <Input className="h-9" value={form.map_url || ""} onChange={e => updateField("map_url", e.target.value)} placeholder="https://maps.google.com/..." startIcon={<MapPin className="h-3 w-3" />} />
                    </FieldGroup>
                    {form.map_url && (
                      <a href={form.map_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-medium">
                        <ArrowUpRight className="h-3 w-3" />
                        {t("View on Map", "عرض على الخريطة")}
                      </a>
                    )}
                  </div>
                </>
              )}
            </section>

            {/* ═══ Section: Organizer ═══ */}
            <section
              ref={(el: HTMLDivElement | null) => { d.sectionRefs.current["organizer"] = el; }}
              data-section="organizer"
              className="rounded-2xl border border-border/40 bg-card p-5 space-y-5 shadow-sm"
            >
              <SectionHeader icon={Building} title={t("Organizer", "الجهة المنظمة")} desc={t("Managing organization details", "بيانات الجهة المنظمة")} status={d.getSectionStatus("organizer")} />

              <OrganizerSearchSelector
                value={d.organizer}
                onChange={(val) => {
                  d.setOrganizer(val);
                  if (val) {
                    updateField("organizer_name", val.name);
                    updateField("organizer_name_ar", val.nameAr);
                    updateField("organizer_email", val.email || "");
                    updateField("organizer_phone", val.phone || "");
                    updateField("organizer_website", val.website || "");
                    if (val.country) {
                      const c = d.countries?.find(co => co.code === val.country || co.name === val.country);
                      if (c?.currency_code) d.setCurrency(c.currency_code);
                    }
                  } else {
                    updateField("organizer_name", "");
                    updateField("organizer_name_ar", "");
                    updateField("organizer_email", "");
                    updateField("organizer_phone", "");
                    updateField("organizer_website", "");
                  }
                }}
                label={t("Search & Select Organizer", "البحث واختيار الجهة المنظمة")}
              />

              <div className="rounded-xl border border-border/30 bg-muted/10 p-4 space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <FieldGroup label={t("Organizer Name (EN)", "اسم المنظم (EN)")}>
                    <Input className="h-9" value={form.organizer_name || ""} onChange={e => updateField("organizer_name", e.target.value)} placeholder={t("Organizer name", "اسم الجهة المنظمة")} />
                  </FieldGroup>
                  <FieldGroup label={t("Organizer Name (AR)", "اسم المنظم (AR)")}>
                    <Input className="h-9" value={form.organizer_name_ar || ""} onChange={e => updateField("organizer_name_ar", e.target.value)} dir="rtl" />
                  </FieldGroup>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <FieldGroup label={t("Email", "البريد الإلكتروني")}>
                    <Input className="h-9" type="email" value={form.organizer_email || ""} onChange={e => updateField("organizer_email", e.target.value)} />
                  </FieldGroup>
                  <FieldGroup label={t("Phone", "رقم الهاتف")}>
                    <Input className="h-9" value={form.organizer_phone || ""} onChange={e => updateField("organizer_phone", e.target.value)} />
                  </FieldGroup>
                  <FieldGroup label={t("Website", "الموقع الإلكتروني")}>
                    <Input className="h-9" value={form.organizer_website || ""} onChange={e => updateField("organizer_website", e.target.value)} placeholder="https://..." />
                  </FieldGroup>
                </div>
              </div>
            </section>

            {/* ═══ Section: Tickets ═══ */}
            <section
              ref={(el: HTMLDivElement | null) => { d.sectionRefs.current["tickets"] = el; }}
              data-section="tickets"
              className="rounded-2xl border border-border/40 bg-card p-5 space-y-5 shadow-sm"
            >
              <SectionHeader icon={Ticket} title={t("Tickets & Pricing", "التذاكر والأسعار")} desc={t("Entry pricing & capacity limits", "تسعير الدخول وحدود السعة")} status={d.getSectionStatus("tickets")} />

              <div className="flex items-center gap-3 rounded-xl bg-muted/20 px-3 py-2">
                <Switch checked={form.is_free || false} onCheckedChange={v => updateField("is_free", v)} />
                <Label className="text-xs font-medium">{t("Free Entry", "دخول مجاني")}</Label>
                {form.is_free && <Badge variant="outline" className="text-xs h-5 bg-chart-2/5 text-chart-2 border-chart-2/20">{t("Free", "مجاني")}</Badge>}
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {!form.is_free && (
                  <>
                    <FieldGroup label={t("Ticket Price (EN)", "سعر التذكرة (إنجليزي)")}>
                      <Input className="h-9" value={form.ticket_price || ""} onChange={e => updateField("ticket_price", e.target.value)} placeholder={`${d.currency} 50`} />
                    </FieldGroup>
                    <FieldGroup label={t("Ticket Price (AR)", "سعر التذكرة (عربي)")}>
                      <Input className="h-9" value={form.ticket_price_ar || ""} onChange={e => updateField("ticket_price_ar", e.target.value)} dir="rtl" />
                    </FieldGroup>
                  </>
                )}
                <FieldGroup label={t("Max Attendees", "الحد الأقصى للحضور")}>
                  <Input className="h-9" type="number" value={form.max_attendees || ""} onChange={e => updateField("max_attendees", parseInt(e.target.value) || undefined)} startIcon={<Users className="h-3 w-3" />} />
                </FieldGroup>
              </div>
            </section>

            {/* ═══ Section: Links ═══ */}
            <section
              ref={(el: HTMLDivElement | null) => { d.sectionRefs.current["links"] = el; }}
              data-section="links"
              className="rounded-2xl border border-border/40 bg-card p-5 space-y-5 shadow-sm"
            >
              <SectionHeader
                icon={LinkIcon}
                title={t("Links & Social Media", "الروابط والتواصل الاجتماعي")}
                desc={t("Registration, website & social profiles", "التسجيل والموقع وحسابات التواصل")}
                status={d.getSectionStatus("links")}
                badge={d.filledSocialLinks > 0 ? `${d.filledSocialLinks} ${t("links", "روابط")}` : undefined}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <FieldGroup label={t("Registration URL", "رابط التسجيل")}>
                  <Input className="h-9" value={form.registration_url || ""} onChange={e => updateField("registration_url", e.target.value)} placeholder="https://..." startIcon={<ExternalLink className="h-3 w-3" />} />
                </FieldGroup>
                <FieldGroup label={t("Website URL", "رابط الموقع")}>
                  <Input className="h-9" value={form.website_url || ""} onChange={e => updateField("website_url", e.target.value)} placeholder="https://..." startIcon={<Globe className="h-3 w-3" />} />
                </FieldGroup>
              </div>

              <Separator />

              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-3 flex items-center gap-1.5">
                  <Globe className="h-3 w-3" />
                  {t("Social Media & Contact Links", "روابط التواصل الاجتماعي والاتصال")}
                </p>
                <ExhibitionSocialLinksEditor value={d.socialLinks} onChange={d.setSocialLinks} isAr={isAr} />
              </div>
            </section>

            {/* ═══ Section: Sponsors & Partners ═══ */}
            <section
              ref={(el: HTMLDivElement | null) => { d.sectionRefs.current["sponsors"] = el; }}
              data-section="sponsors"
              className="rounded-2xl border border-border/40 bg-card p-5 space-y-5 shadow-sm"
            >
              <SectionHeader icon={Award} title={t("Sponsors & Partners", "الرعاة والشركاء")} desc={t("Manage event sponsors & partners", "إدارة رعاة وشركاء الفعالية")} status={editingId ? "complete" : "empty"} />
              {editingId ? (
                <ExhibitionSponsorsPanel exhibitionId={editingId} isAr={isAr} />
              ) : (
                <EmptyHint icon={Award} text={t("Save the exhibition first to manage sponsors", "احفظ الفعالية أولاً لإدارة الرعاة")} />
              )}
            </section>

            {/* ═══ Section: Competitions ═══ */}
            <section
              ref={(el: HTMLDivElement | null) => { d.sectionRefs.current["competitions"] = el; }}
              data-section="competitions"
              className="rounded-2xl border border-border/40 bg-card p-5 space-y-5 shadow-sm"
            >
              <SectionHeader icon={Trophy} title={t("Competitions", "المسابقات")} desc={t("Link & manage competitions", "ربط وإدارة المسابقات")} status={editingId ? "complete" : "empty"} />
              {editingId ? (
                <ExhibitionCompetitionsPanel exhibitionId={editingId} editionYear={d.editionYear} isAr={isAr} />
              ) : (
                <EmptyHint icon={Trophy} text={t("Save the exhibition first to link competitions", "احفظ الفعالية أولاً لربط المسابقات")} />
              )}
            </section>

            {/* ═══ Section: Media Library ═══ */}
            <section
              ref={(el: HTMLDivElement | null) => { d.sectionRefs.current["media"] = el; }}
              data-section="media"
              className="rounded-2xl border border-border/40 bg-card p-5 space-y-5 shadow-sm"
            >
              <SectionHeader icon={FileText} title={t("Media Library", "مكتبة الوسائط")} desc={t("Upload & manage files, gallery & documents", "رفع وإدارة الملفات والمعرض والمستندات")} status={d.getSectionStatus("media")} />
              {editingId ? (
                <>
                  <ExhibitionMediaLibrary
                    exhibitionId={editingId}
                    coverImageUrl={form.cover_image_url || undefined}
                    onCoverChange={url => updateField("cover_image_url", url)}
                    isAr={isAr}
                  />
                  <Separator />
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
                      <FileText className="h-3 w-3" />
                      {t("Documents & AI Knowledge Base", "المستندات وقاعدة معارف الذكاء الاصطناعي")}
                    </p>
                    <ExhibitionDocumentsPanel exhibitionId={editingId} />
                  </div>
                </>
              ) : (
                <EmptyHint icon={FileText} text={t("Save the exhibition first to upload media", "احفظ الفعالية أولاً لرفع الوسائط")} />
              )}
            </section>

            {/* ═══ Section: Previous Editions ═══ */}
            <section
              ref={(el: HTMLDivElement | null) => { d.sectionRefs.current["editions"] = el; }}
              data-section="editions"
              className="rounded-2xl border border-border/40 bg-card p-5 space-y-5 shadow-sm"
            >
              <SectionHeader icon={History} title={t("Previous Editions", "النسخ السابقة")} desc={t("Browse & manage edition history", "تصفح وإدارة تاريخ النسخ")} status={d.getSectionStatus("editions")} badge={d.previousEditions.length > 0 ? `${d.previousEditions.length}` : undefined} />
              {d.selectedSeriesId ? (
                d.previousEditions.length > 0 ? (
                  <div className="space-y-2">
                    {d.previousEditions.map((ed: any) => {
                      const isCurrent = ed.id === editingId;
                      const edStatus = statusOptions.find(s => s.value === ed.status);
                      return (
                        <div
                          key={ed.id}
                          className={cn(
                            "flex items-center gap-3 rounded-xl border p-3 transition-all cursor-pointer hover:shadow-sm",
                            isCurrent ? "border-primary/30 bg-primary/5 ring-1 ring-primary/10" : "border-border/30 hover:bg-muted/20"
                          )}
                          onClick={() => {
                            if (!isCurrent && ed.edition_year) {
                              d.setEditionYear(ed.edition_year);
                            }
                          }}
                        >
                          <div className="h-12 w-16 rounded-lg overflow-hidden border border-border/30 shrink-0 bg-muted/20">
                            {ed.cover_image_url ? (
                              <img loading="lazy" decoding="async" src={ed.cover_image_url} alt={ed.name || "Edition cover"} className="h-full w-full object-cover" />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center"><Image className="h-4 w-4 text-muted-foreground/30" /></div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-semibold truncate">{isAr && ed.title_ar ? ed.title_ar : ed.title}</p>
                              {isCurrent && <Badge className="text-xs h-4 px-1 bg-primary/10 text-primary border-0">{t("Current", "الحالية")}</Badge>}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                              <span className="font-mono font-bold">{ed.edition_year}</span>
                              {ed.edition_number && <span>· {t("Edition", "النسخة")} #{ed.edition_number}</span>}
                              {ed.city && <span>· {ed.city}</span>}
                              {ed.view_count > 0 && <span>· <Eye className="h-2.5 w-2.5 inline" /> {ed.view_count}</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Badge variant="outline" className="text-xs h-5 gap-1">
                              <span className={cn("h-1.5 w-1.5 rounded-full", edStatus?.color || "bg-muted-foreground")} />
                              {isAr ? edStatus?.ar : edStatus?.en}
                            </Badge>
                            {!isCurrent && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg">
                                    <Pencil className="h-3 w-3" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>{t("Switch to this edition", "التبديل لهذه النسخة")}</TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <EmptyHint icon={History} text={t("No previous editions found for this series", "لم يتم العثور على نسخ سابقة لهذه السلسلة")} />
                )
              ) : (
                <EmptyHint icon={History} text={t("Select an event series to view editions", "اختر سلسلة فعاليات لعرض النسخ")} />
              )}
            </section>

            {/* ═══ Section: Team ═══ */}
            <section
              ref={(el: HTMLDivElement | null) => { d.sectionRefs.current["team"] = el; }}
              data-section="team"
              className="rounded-2xl border border-border/40 bg-card p-5 space-y-5 shadow-sm"
            >
              <SectionHeader icon={Users} title={t("Team & Officials", "الفريق والمسؤولون")} desc={t("Staff assignments & roles", "تعيينات الطاقم والأدوار")} status={d.getSectionStatus("team")} />
              {editingId ? (
                <ExhibitionOfficialsPanel exhibitionId={editingId} />
              ) : (
                <EmptyHint icon={Users} text={t("Save the exhibition first to assign team members", "احفظ الفعالية أولاً لتعيين أعضاء الفريق")} />
              )}
            </section>

            {/* ═══ Section: Notes & Activity ═══ */}
            <section
              ref={(el: HTMLDivElement | null) => { d.sectionRefs.current["notes"] = el; }}
              data-section="notes"
              className="rounded-2xl border border-border/40 bg-card p-5 space-y-5 shadow-sm"
            >
              <SectionHeader icon={StickyNote} title={t("Notes & Activity", "الملاحظات والنشاط")} desc={t("Internal notes & change log", "ملاحظات داخلية وسجل التغييرات")} status={d.getSectionStatus("notes")} />

              <FieldGroup label={t("Internal Admin Notes", "ملاحظات المشرف الداخلية")} hint={t("Only visible to admins, not shown publicly", "مرئية فقط للمشرفين، لا تظهر للعامة")}>
                <Textarea
                  className="min-h-[80px] text-sm"
                  value={d.adminNotes}
                  onChange={e => d.setAdminNotes(e.target.value)}
                  placeholder={t("Add internal notes about this exhibition...", "أضف ملاحظات داخلية حول هذه الفعالية...")}
                />
              </FieldGroup>

              {editingId && (
                <div className="rounded-xl border border-border/30 bg-muted/10 p-4 space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                    <Activity className="h-3 w-3" />
                    {t("Quick Info", "معلومات سريعة")}
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: t("ID", "المعرف"), value: editingId.slice(0, 8) + "..." },
                      { label: t("Status", "الحالة"), value: isAr ? statusOptions.find(s => s.value === form.status)?.ar : statusOptions.find(s => s.value === form.status)?.en },
                      { label: t("Edition", "النسخة"), value: d.editionYear ? `${d.editionYear} #${d.editionNumber || "?"}` : "—" },
                      { label: t("Last Saved", "آخر حفظ"), value: d.lastSaved ? d.lastSaved.toLocaleDateString() : "—" },
                    ].map((item, i) => (
                      <div key={i} className="text-center rounded-lg bg-muted/20 px-2 py-2">
                        <p className="text-xs text-muted-foreground/60 uppercase tracking-wider">{item.label}</p>
                        <p className="text-xs font-semibold mt-0.5 truncate">{item.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>

            </div>{/* end formLocked wrapper */}

            <div className="h-6" />
          </div>
        </div>
      </div>
    </div>
    </TooltipProvider>
  );
});
