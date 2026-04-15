import { memo } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Briefcase, Calendar, BarChart3, Eye, ExternalLink, ChevronRight,
  Loader2, RefreshCw, TrendingUp, Users, Star, Activity, Zap, History,
  StickyNote, FileCheck, CheckCircle2, Copy, Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { SectionHeader, FieldGroup } from "./OrganizerFormHelpers";
import { toast } from "sonner";
import type { OrganizerForm } from "./useOrganizerEditForm";

interface TabProps {
  form: OrganizerForm;
  setForm: React.Dispatch<React.SetStateAction<OrganizerForm>>;
  formErrors: Record<string, string>;
  setFormErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  isAr: boolean;
  organizerId?: string | null;
  orgData: any;
  d: any;
}

// ═══ Details Tab ═══
export const DetailsTab = memo(function DetailsTab({ form, setForm, formErrors, setFormErrors, isAr }: TabProps) {
  return (
    <div className="space-y-6">
      <SectionHeader icon={Briefcase} title={isAr ? "التفاصيل والخدمات" : "Details & Services"} desc={isAr ? "التسجيل والترخيص والخدمات" : "Registration, licensing & services"} />
      <Card className="rounded-2xl">
        <CardContent className="p-4 space-y-4">
          <h4 className="text-xs font-semibold flex items-center gap-2"><FileCheck className="h-3.5 w-3.5 text-primary" />{isAr ? "البيانات القانونية والتسجيل" : "Legal & Registration"}</h4>
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
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {isAr ? `تأسست منذ ${new Date().getFullYear() - parseInt(form.founded_year)} سنة` : `Established ${new Date().getFullYear() - parseInt(form.founded_year)} years ago`}
            </p>
          )}
        </CardContent>
      </Card>
      <Card className="rounded-2xl">
        <CardContent className="p-4 space-y-4">
          <h4 className="text-xs font-semibold flex items-center gap-2"><Briefcase className="h-3.5 w-3.5 text-primary" />{isAr ? "الخدمات والقطاعات" : "Services & Sectors"}</h4>
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
              <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">{isAr ? "العلامات" : "Tags Preview"}</p>
              <div className="flex flex-wrap gap-1.5">
                {form.services.split(",").filter(Boolean).map((s, i) => <Badge key={`s-${i}`} variant="secondary" className="text-xs">{s.trim()}</Badge>)}
                {form.targeted_sectors.split(",").filter(Boolean).map((s, i) => <Badge key={`t-${i}`} variant="outline" className="text-xs">{s.trim()}</Badge>)}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
});

// ═══ Exhibitions Tab ═══
export const ExhibitionsTab = memo(function ExhibitionsTab({ isAr, organizerId, d }: TabProps) {
  if (!organizerId) {
    return (
      <div className="space-y-6">
        <SectionHeader icon={Calendar} title={isAr ? "المعارض والمسابقات" : "Events & Competitions"} desc={isAr ? "جميع المعارض والمسابقات المرتبطة" : "All linked exhibitions & competitions"} />
        <Card className="rounded-2xl border-dashed"><CardContent className="p-8 text-center"><Calendar className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" /><p className="text-xs text-muted-foreground">{isAr ? "احفظ المنظم أولاً" : "Save organizer first"}</p></CardContent></Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SectionHeader icon={Calendar} title={isAr ? "المعارض والمسابقات" : "Events & Competitions"} desc={isAr ? "جميع المعارض والمسابقات المرتبطة" : "All linked exhibitions & competitions"} />

      {d.linkedCompetitions && d.linkedCompetitions.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold mb-3 flex items-center gap-2"><BarChart3 className="h-3.5 w-3.5 text-primary" />{isAr ? "المسابقات" : "Competitions"} <Badge variant="outline" className="text-xs h-4">{d.linkedCompetitions.length}</Badge></h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {d.linkedCompetitions.map((comp: any) => (
              <Link key={comp.id} to={`/competitions/${comp.slug || comp.id}`} target="_blank" className="block">
                <Card className="rounded-xl hover:shadow-sm transition-all group">
                  <CardContent className="p-3 flex items-center gap-3">
                    {comp.cover_image_url ? <img src={comp.cover_image_url} alt="" className="h-10 w-10 rounded-lg object-cover border shrink-0" loading="lazy" /> : <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><BarChart3 className="h-4 w-4 text-primary" /></div>}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{isAr ? (comp.title_ar || comp.title) : comp.title}</p>
                      <div className="flex items-center gap-1.5"><Badge variant="outline" className="text-xs h-3.5 capitalize">{comp.status}</Badge>{comp.edition_year && <span className="text-xs text-muted-foreground">{comp.edition_year}</span>}</div>
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
          <h4 className="text-xs font-semibold flex items-center gap-2"><Calendar className="h-3.5 w-3.5 text-primary" />{isAr ? "المعارض والمؤتمرات" : "Exhibitions & Conferences"} <Badge variant="outline" className="text-xs h-4">{d.linkedExhibitions?.length || 0}</Badge></h4>
          {d.exhibitionGroups.map((group: any) => {
            const isExpanded = d.expandedGroup === group.baseName;
            return (
              <Card key={group.baseName} className="rounded-2xl overflow-hidden hover:shadow-sm transition-all">
                <CardContent className="p-0">
                  <button type="button" onClick={() => d.setExpandedGroup(isExpanded ? null : group.baseName)} className="w-full flex items-center gap-3 p-4 text-start hover:bg-muted/30 transition-colors">
                    {group.coverImage ? <img src={group.coverImage} alt="" className="h-12 w-12 rounded-xl object-cover border shrink-0" loading="lazy" /> : <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0"><Calendar className="h-5 w-5 text-primary" /></div>}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{isAr ? group.baseNameAr : group.baseName}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="outline" className="text-xs h-4">{group.editions.length} {isAr ? "نسخة" : "editions"}</Badge>
                        {group.editions[0]?.edition_year && <span className="text-xs text-muted-foreground">{group.editions[group.editions.length - 1]?.edition_year} — {group.editions[0].edition_year}</span>}
                      </div>
                    </div>
                    <ChevronRight className={cn("h-4 w-4 text-muted-foreground transition-transform shrink-0", isExpanded && "rotate-90")} />
                  </button>
                  {isExpanded && (
                    <div className="border-t border-border/40 px-4 py-3 bg-muted/20">
                      <div className="space-y-1.5">
                        {group.editions.map((ed: any) => (
                          <Link key={ed.id} to={`/exhibitions/${ed.slug || ed.id}`} target="_blank" className="block">
                            <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-background transition-colors group/ed">
                              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><span className="text-xs font-bold text-primary">{ed.edition_year || "—"}</span></div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium truncate">{isAr ? (ed.title_ar || ed.title) : ed.title}</p>
                                {ed.edition_number && <span className="text-xs text-muted-foreground">{isAr ? `النسخة ${ed.edition_number}` : `Edition #${ed.edition_number}`}</span>}
                              </div>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <Badge variant={ed.status === "active" ? "default" : ed.status === "completed" ? "secondary" : "outline"} className="text-xs h-3.5 capitalize">{ed.status}</Badge>
                                {ed.start_date && <span className="text-xs text-muted-foreground">{new Date(ed.start_date).toLocaleDateString()}</span>}
                                {ed.view_count ? <span className="text-xs text-muted-foreground flex items-center gap-0.5"><Eye className="h-2.5 w-2.5" />{ed.view_count}</span> : null}
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
        <Card className="rounded-2xl border-dashed"><CardContent className="p-8 text-center"><BarChart3 className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" /><p className="text-xs text-muted-foreground">{isAr ? "لا توجد معارض مرتبطة" : "No linked exhibitions"}</p></CardContent></Card>
      )}
    </div>
  );
});

// ═══ Analytics Tab ═══
export const AnalyticsTab = memo(function AnalyticsTab({ form, isAr, organizerId, orgData, d }: TabProps) {
  if (!organizerId) {
    return (
      <div className="space-y-6">
        <SectionHeader icon={TrendingUp} title={isAr ? "التحليلات والأداء" : "Analytics & Performance"} desc={isAr ? "إحصائيات تفصيلية حول أداء المنظم" : "Detailed performance metrics and insights"} />
        <Card className="rounded-2xl border-dashed"><CardContent className="p-8 text-center"><TrendingUp className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" /><p className="text-xs text-muted-foreground">{isAr ? "احفظ المنظم أولاً لعرض التحليلات" : "Save organizer first to view analytics"}</p></CardContent></Card>
      </div>
    );
  }

  if (!orgData) return null;

  return (
    <div className="space-y-6">
      <SectionHeader icon={TrendingUp} title={isAr ? "التحليلات والأداء" : "Analytics & Performance"} desc={isAr ? "إحصائيات تفصيلية حول أداء المنظم" : "Detailed performance metrics and insights"}
        actions={<Button type="button" variant="outline" size="sm" className="h-7 text-xs gap-1 rounded-lg" onClick={() => d.refreshStatsMutation.mutate()} disabled={d.refreshStatsMutation.isPending}>{d.refreshStatsMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}{isAr ? "تحديث" : "Refresh"}</Button>}
      />

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
                <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center shrink-0", s.bg)}><s.icon className={cn("h-4 w-4", s.color)} /></div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
              <p className="text-2xl font-bold">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="rounded-2xl">
        <CardContent className="p-4 space-y-4">
          <h4 className="text-sm font-semibold flex items-center gap-2"><Activity className="h-4 w-4 text-primary" />{isAr ? "مؤشرات المشاركة" : "Engagement Metrics"}</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: isAr ? "متوسط المشاهدات / معرض" : "Avg Views/Event", value: orgData.total_exhibitions > 0 ? Math.round((orgData.total_views || 0) / orgData.total_exhibitions).toLocaleString() : "—" },
              { label: isAr ? "نسبة المتابعة" : "Follow Rate", value: orgData.total_views > 0 ? `${((orgData.follower_count || 0) / orgData.total_views * 100).toFixed(1)}%` : "—" },
              { label: isAr ? "سنوات الخبرة" : "Years Active", value: form.founded_year ? `${new Date().getFullYear() - parseInt(form.founded_year)}` : "—" },
              { label: isAr ? "حسابات التواصل" : "Social Profiles", value: d.socialProfiles },
            ].map(m => (
              <div key={m.label} className="rounded-xl bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground mb-1">{m.label}</p>
                <p className="text-lg font-bold">{m.value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardContent className="p-4 space-y-4">
          <h4 className="text-sm font-semibold flex items-center gap-2"><Zap className="h-4 w-4 text-primary" />{isAr ? "صحة الملف الشخصي" : "Profile Health"}</h4>
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
          <h4 className="text-sm font-semibold flex items-center gap-2"><History className="h-4 w-4 text-primary" />{isAr ? "السجل الزمني" : "Timeline"}</h4>
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
    </div>
  );
});

// ═══ Notes Tab ═══
export const NotesTab = memo(function NotesTab({ form, setForm, isAr, organizerId, orgData, d }: TabProps) {
  return (
    <div className="space-y-6">
      <SectionHeader icon={StickyNote} title={isAr ? "ملاحظات إدارية" : "Admin Notes"} desc={isAr ? "ملاحظات داخلية وبيانات وصفية" : "Internal notes & record metadata"} />
      <FieldGroup label={isAr ? "ملاحظات خاصة" : "Private Notes"} hint={isAr ? "مرئية فقط لفريق الإدارة" : "Only visible to admin team"}>
        <Textarea value={form.admin_notes} onChange={e => setForm(f => ({ ...f, admin_notes: e.target.value }))} rows={5} placeholder={isAr ? "ملاحظات داخلية للفريق..." : "Internal team notes..."} />
      </FieldGroup>
      {organizerId && orgData && (
        <Card className="rounded-2xl">
          <CardContent className="p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase mb-3">{isAr ? "معلومات السجل" : "Record Info"}</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "ID", value: organizerId.slice(0, 8) + "...", copyable: organizerId },
                { label: isAr ? "رقم المنظم" : "Number", value: orgData.organizer_number || "—" },
                { label: isAr ? "تاريخ الإنشاء" : "Created", value: orgData.created_at ? new Date(orgData.created_at).toLocaleDateString(isAr ? "ar-SA" : "en-US") : "—" },
                { label: isAr ? "آخر حفظ" : "Last Saved", value: d.lastSaved ? d.lastSaved.toLocaleTimeString(isAr ? "ar-SA" : "en-US") : "—" },
              ].map(r => (
                <div key={r.label} className="rounded-xl bg-muted/40 p-3">
                  <p className="text-xs text-muted-foreground mb-1">{r.label}</p>
                  <div className="flex items-center gap-1">
                    <p className="text-xs font-mono font-medium truncate">{r.value}</p>
                    {"copyable" in r && r.copyable && (
                      <button type="button" className="text-muted-foreground hover:text-foreground transition-colors" onClick={() => { navigator.clipboard.writeText(r.copyable as string); toast.success(isAr ? "تم النسخ" : "Copied"); }}>
                        <Copy className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
});
