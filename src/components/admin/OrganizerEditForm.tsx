import { memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { DeduplicationPanel } from "@/components/admin/DeduplicationPanel";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Building2, Save, Loader2, ChevronLeft, CheckCircle2, Image as ImageIcon,
  Mail, MapPin, Calendar, Shield, Star, ExternalLink, Languages,
  StickyNote, TrendingUp, Briefcase, Clock, Users, Undo2, Globe,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { ProgressRing, QuickNavItem } from "./organizer/OrganizerFormHelpers";
import { useOrganizerEditForm, TABS } from "./organizer/useOrganizerEditForm";
import { IdentityTab } from "./organizer/IdentityTab";
import { ImagesTab, ContactTab, LocationTab, TeamTab, SocialTab, SettingsTab } from "./organizer/OrganizerTabPanels";
import { DetailsTab, ExhibitionsTab, AnalyticsTab, NotesTab } from "./organizer/OrganizerDetailTabs";

interface OrganizerEditFormProps {
  organizerId?: string | null;
  onClose: () => void;
}

const TAB_ICONS: Record<string, LucideIcon> = {
  identity: Building2, images: ImageIcon, contact: Mail, location: MapPin,
  team: Users, details: Briefcase, social: Globe, settings: Shield,
  exhibitions: Calendar, analytics: TrendingUp, notes: StickyNote,
};

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
  const tabProps = { form, setForm, formErrors, setFormErrors, isAr, organizerId, orgData, d };

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
                {organizerId && orgData?.organizer_number && <Badge variant="outline" className="text-[12px] h-4 font-mono px-1.5">{orgData.organizer_number}</Badge>}
                <Badge variant={form.status === "active" ? "default" : form.status === "pending" ? "outline" : "secondary"} className="text-[12px] h-4 capitalize">{form.status}</Badge>
                {form.is_verified && <Badge variant="outline" className="text-[12px] h-4 px-1.5 gap-0.5 border-primary/30"><CheckCircle2 className="h-2.5 w-2.5 text-primary" />{isAr ? "موثق" : "Verified"}</Badge>}
                {form.is_featured && <Badge variant="outline" className="text-[12px] h-4 px-1.5 gap-0.5 border-amber-500/30"><Star className="h-2.5 w-2.5 text-amber-500" />{isAr ? "مميز" : "Featured"}</Badge>}
                {d.hasUnsavedChanges && <Badge variant="outline" className="text-[12px] h-4 px-1.5 border-amber-500/50 text-amber-600 animate-pulse">{isAr ? "غير محفوظ" : "Unsaved"}</Badge>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {d.lastSaved && <span className="text-[12px] text-muted-foreground hidden lg:flex items-center gap-1"><Clock className="h-3 w-3" />{d.lastSaved.toLocaleTimeString()}</span>}
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
                <Undo2 className="h-3.5 w-3.5" /><span className="hidden sm:inline text-xs">{isAr ? "تراجع" : "Discard"}</span>
              </Button>
            )}
            <Button variant="secondary" size="sm" className="gap-1.5 h-8" onClick={d.handleAutoTranslate} disabled={d.translating}>
              <Languages className="h-3.5 w-3.5" /><span className="hidden sm:inline text-xs">{d.translating ? "..." : isAr ? "ترجمة" : "Translate"}</span>
            </Button>
            <Button size="sm" onClick={d.handleSave} disabled={(!form.name && !form.name_ar) || d.saveMutation.isPending} className="gap-1.5 h-8 min-w-[72px]">
              {d.saveMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              <span className="text-xs">{isAr ? "حفظ" : "Save"}</span>
            </Button>
          </div>
        </div>
      </div>

      <DeduplicationPanel duplicates={d.duplicates} checking={d.checking} onDismiss={d.clearDuplicates} compact />

      {/* ══ Layout ══ */}
      <div className="flex gap-0 mt-0">
        {/* Side Navigation */}
        <div className={cn("shrink-0 border-e border-border/40 transition-all duration-300 hidden lg:block", d.showSideNav ? "w-48 pe-4 pt-5" : "w-0 pe-0 overflow-hidden")}>
          {d.showSideNav && (
            <nav aria-label={isAr ? "أقسام النموذج" : "Form sections"} className="sticky top-20 space-y-0.5">
              <p className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">{isAr ? "الأقسام" : "Sections"}</p>
              {TABS.map(tab => (
                <QuickNavItem key={tab.id} icon={TAB_ICONS[tab.id] || StickyNote} label={isAr ? tab.ar : tab.en} status={d.getTabStatus(tab.id)} active={d.activeTab === tab.id} onClick={() => d.setActiveTab(tab.id)} />
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
            <div className="overflow-x-auto lg:hidden -mx-4 md:-mx-6 px-4 md:px-6 pt-4">
              <TabsList className="inline-flex h-10 gap-0.5 bg-muted/50 p-1 rounded-xl w-max">
                {TABS.map(tab => {
                  const status = d.getTabStatus(tab.id);
                  const TabIcon = TAB_ICONS[tab.id] || StickyNote;
                  return (
                    <TabsTrigger key={tab.id} value={tab.id} className="gap-1.5 text-xs px-3 rounded-lg data-[state=active]:shadow-sm relative">
                      <div className={cn("h-1.5 w-1.5 rounded-full shrink-0", status === "complete" ? "bg-chart-2" : status === "partial" ? "bg-amber-500" : "bg-muted-foreground/30")} />
                      <TabIcon className="h-3.5 w-3.5 shrink-0" />
                      <span className="hidden sm:inline">{isAr ? tab.ar : tab.en}</span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </div>

            <div className="mt-5 pb-16">
              <TabsContent value="identity" className="mt-0"><IdentityTab {...tabProps} translateField={d.translateField} translateCtx={d.translateCtx} /></TabsContent>
              <TabsContent value="images" className="mt-0"><ImagesTab {...tabProps} /></TabsContent>
              <TabsContent value="contact" className="mt-0"><ContactTab {...tabProps} /></TabsContent>
              <TabsContent value="location" className="mt-0"><LocationTab {...tabProps} /></TabsContent>
              <TabsContent value="team" className="mt-0"><TeamTab {...tabProps} /></TabsContent>
              <TabsContent value="details" className="mt-0"><DetailsTab {...tabProps} /></TabsContent>
              <TabsContent value="social" className="mt-0"><SocialTab {...tabProps} /></TabsContent>
              <TabsContent value="settings" className="mt-0"><SettingsTab {...tabProps} /></TabsContent>
              <TabsContent value="exhibitions" className="mt-0"><ExhibitionsTab {...tabProps} /></TabsContent>
              <TabsContent value="analytics" className="mt-0"><AnalyticsTab {...tabProps} /></TabsContent>
              <TabsContent value="notes" className="mt-0"><NotesTab {...tabProps} /></TabsContent>
            </div>
          </Tabs>
        </div>
      </div>

      <ConfirmDialog
        open={d.showDiscardConfirm}
        onOpenChange={d.setShowDiscardConfirm}
        title={isAr ? "تجاهل التغييرات؟" : "Discard changes?"}
        description={isAr ? "لديك تغييرات غير محفوظة. هل تريد التراجع؟" : "You have unsaved changes. Are you sure you want to discard them?"}
        confirmLabel={isAr ? "تجاهل" : "Discard"}
        cancelLabel={isAr ? "إلغاء" : "Cancel"}
        variant="destructive"
        onConfirm={() => { d.setShowDiscardConfirm(false); onClose(); }}
      />
    </div>
  );
}
