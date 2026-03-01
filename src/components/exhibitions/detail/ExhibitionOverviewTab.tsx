import { memo } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calendar, Users, Trophy, Landmark, Target, ImageIcon,
  Star, Sparkles, CheckCircle, BarChart3, Tag,
} from "lucide-react";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { differenceInDays, format, isFuture, isWithinInterval } from "date-fns";

interface Section { name?: string; name_ar?: string; description?: string; description_ar?: string; }

interface Props {
  exhibition: any;
  title: string;
  description: string | null;
  isAr: boolean;
  linkedCompetitions: any[] | undefined;
  sections: Section[];
  targetAudience: string[];
  galleryUrls: string[];
  onSetActiveTab: (tab: string) => void;
  onLightboxOpen: (i: number) => void;
}

export const ExhibitionOverviewTab = memo(function ExhibitionOverviewTab({
  exhibition, title, description, isAr, linkedCompetitions,
  sections, targetAudience, galleryUrls,
  onSetActiveTab, onLightboxOpen,
}: Props) {
  const start = new Date(exhibition.start_date);
  const end = new Date(exhibition.end_date);
  const hasCompetitions = linkedCompetitions && linkedCompetitions.length > 0;
  const hasGallery = galleryUrls.length > 0;

  const reasonsToAttend = (exhibition.reasons_to_attend as any[]) || [];
  const uniqueFeatures = (exhibition.unique_features as any[]) || [];
  const targetedSectors = (exhibition.targeted_sectors as string[]) || [];
  const categories = (exhibition.categories as string[]) || [];
  const highlights = (exhibition.highlights as any[]) || [];
  const editionStats = (exhibition.edition_stats as Record<string, any>) || {};
  const editionYear = (exhibition as any).edition_year;
  const statEntries = Object.entries(editionStats).filter(([, v]) => v != null && v !== 0 && v !== "");

  return (
    <div className="space-y-6">
      {/* Key Highlights */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { icon: Calendar, value: differenceInDays(end, start) + 1, label: isAr ? "أيام" : "Days", color: "primary" },
          { icon: Trophy, value: linkedCompetitions?.length || 0, label: isAr ? "مسابقات" : "Competitions", color: "chart-4" },
          { icon: Users, value: exhibition.max_attendees || "—", label: isAr ? "سعة" : "Capacity", color: "chart-3" },
          { icon: Landmark, value: sections.length || "—", label: isAr ? "أقسام" : "Sections", color: "accent" },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className={`rounded-xl border border-${item.color}/15 bg-gradient-to-br from-${item.color}/10 via-${item.color}/5 to-transparent p-4 text-center transition-all duration-200 hover:shadow-md hover:scale-[1.02] active:scale-[0.98]`}>
              <Icon className={`mx-auto mb-1.5 h-5 w-5 text-${item.color}`} />
              <p className="text-lg font-bold text-foreground">{typeof item.value === "number" ? <AnimatedCounter value={item.value} /> : item.value}</p>
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{item.label}</p>
            </div>
          );
        })}
      </div>

      {/* Edition Stats */}
      {statEntries.length > 0 && (
        <Card className="overflow-hidden border-primary/15">
          <div className="border-b bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-4 py-3">
            <h3 className="flex items-center gap-2 font-semibold text-sm">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10"><BarChart3 className="h-3.5 w-3.5 text-primary" /></div>
              {isAr ? `إحصائيات النسخة ${editionYear || ""}` : `Edition ${editionYear || ""} Statistics`}
            </h3>
          </div>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {statEntries.map(([key, value]) => (
                <div key={key} className="rounded-xl border p-3 text-center">
                  <p className="text-lg font-bold text-primary">{typeof value === "number" ? <AnimatedCounter value={value} /> : value}</p>
                  <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{key.replace(/_/g, " ")}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {description && (
        <Card className="border-s-[3px] border-s-primary/40">
          <CardContent className="prose prose-sm max-w-none p-4 md:p-6 dark:prose-invert">
            <p className="whitespace-pre-wrap leading-relaxed">{description}</p>
          </CardContent>
        </Card>
      )}

      {/* Reasons to Attend */}
      {reasonsToAttend.length > 0 && (
        <Card className="overflow-hidden">
          <div className="border-b bg-gradient-to-r from-chart-2/10 via-chart-2/5 to-transparent px-4 py-3">
            <h3 className="flex items-center gap-2 font-semibold text-sm">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-chart-2/10"><CheckCircle className="h-3.5 w-3.5 text-chart-2" /></div>
              {isAr ? "لماذا يجب أن تحضر؟" : "Why Attend?"}
            </h3>
          </div>
          <CardContent className="p-4">
            <div className="space-y-2.5">
              {reasonsToAttend.map((r: any, i: number) => (
                <div key={i} className="flex items-start gap-3 rounded-xl border p-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-chart-2/10 text-chart-2 text-xs font-bold">{i + 1}</div>
                  <p className="text-sm">{isAr && r.reason_ar ? r.reason_ar : r.reason}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Unique Features */}
      {uniqueFeatures.length > 0 && (
        <Card className="overflow-hidden">
          <div className="border-b bg-gradient-to-r from-chart-4/10 via-chart-4/5 to-transparent px-4 py-3">
            <h3 className="flex items-center gap-2 font-semibold text-sm">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-chart-4/10"><Sparkles className="h-3.5 w-3.5 text-chart-4" /></div>
              {isAr ? "ما يميز هذا الحدث" : "What Makes It Unique"}
            </h3>
          </div>
          <CardContent className="p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              {uniqueFeatures.map((f: any, i: number) => (
                <div key={i} className="flex items-start gap-2 rounded-xl border p-3">
                  <Sparkles className="h-4 w-4 shrink-0 text-chart-4 mt-0.5" />
                  <p className="text-sm">{isAr && f.feature_ar ? f.feature_ar : f.feature}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Targeted Sectors & Categories */}
      {(targetedSectors.length > 0 || categories.length > 0) && (
        <Card className="overflow-hidden">
          <div className="border-b bg-muted/30 px-4 py-3">
            <h3 className="flex items-center gap-2 font-semibold text-sm">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-muted/60"><Tag className="h-3.5 w-3.5 text-muted-foreground" /></div>
              {isAr ? "القطاعات والفئات المستهدفة" : "Targeted Sectors & Categories"}
            </h3>
          </div>
          <CardContent className="p-4 space-y-3">
            {targetedSectors.length > 0 && (
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-2">{isAr ? "القطاعات" : "Sectors"}</p>
                <div className="flex flex-wrap gap-2">
                  {targetedSectors.map((s) => <Badge key={s} variant="secondary" className="py-1 capitalize">{s.replace(/_/g, " ")}</Badge>)}
                </div>
              </div>
            )}
            {categories.length > 0 && (
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-2">{isAr ? "الفئات" : "Categories"}</p>
                <div className="flex flex-wrap gap-2">
                  {categories.map((c) => <Badge key={c} variant="outline" className="py-1 capitalize">{c.replace(/_/g, " ")}</Badge>)}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {sections.length > 0 && (
        <Card className="overflow-hidden">
          <div className="border-b bg-muted/30 px-4 py-3">
            <h3 className="flex items-center gap-2 font-semibold text-sm">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10"><Landmark className="h-3.5 w-3.5 text-primary" /></div>
              {isAr ? "أقسام الحدث" : "Event Sections"}
            </h3>
          </div>
          <CardContent className="p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              {sections.map((section, i) => (
                <div key={i} className="rounded-xl border p-3">
                  <p className="font-medium text-sm">{isAr && section.name_ar ? section.name_ar : section.name}</p>
                  {(section.description || section.description_ar) && (
                    <p className="mt-1 text-xs text-muted-foreground">{isAr && section.description_ar ? section.description_ar : section.description}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {hasCompetitions && (
        <Card className="overflow-hidden">
          <div className="border-b bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-4 py-3 flex items-center justify-between">
            <h3 className="flex items-center gap-2 font-semibold text-sm">
              <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-chart-4/20"><Trophy className="h-3.5 w-3.5 text-primary" /></div>
              {isAr ? "المسابقات المرتبطة" : "Linked Competitions"}
              <Badge className="ms-1 bg-primary/10 text-primary border-primary/20">{linkedCompetitions!.length}</Badge>
            </h3>
            <Button variant="ghost" size="sm" className="text-xs text-primary hover:text-primary" onClick={() => onSetActiveTab("competitions")}>{isAr ? "عرض الكل →" : "View All →"}</Button>
          </div>
          <CardContent className="p-4">
            <div className="space-y-2.5">
              {linkedCompetitions!.slice(0, 3).map((comp: any) => {
                const compTitle = isAr && comp.title_ar ? comp.title_ar : comp.title;
                const regCount = comp.competition_registrations?.length || 0;
                const compStart = new Date(comp.competition_start);
                const compEnd = new Date(comp.competition_end);
                const compIsLive = isWithinInterval(new Date(), { start: compStart, end: compEnd });
                const compIsUpcoming = isFuture(compStart);
                return (
                  <Link key={comp.id} to={`/competitions/${comp.id}`} className="flex items-center gap-3 rounded-xl border border-border/60 p-3 hover:bg-primary/5 hover:border-primary/20 transition-all group">
                    {comp.cover_image_url ? (
                      <img src={comp.cover_image_url} alt={compTitle} className="h-12 w-12 rounded-xl object-cover shrink-0 ring-1 ring-border" loading="lazy" />
                    ) : (
                      <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/10 to-chart-4/10 flex items-center justify-center shrink-0"><Trophy className="h-5 w-5 text-primary/40" /></div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">{compTitle}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-muted-foreground">{format(compStart, "MMM d, yyyy")}</span>
                        {compIsLive && <Badge className="h-4 px-1.5 text-[8px] bg-destructive text-destructive-foreground border-none">{isAr ? "مباشر" : "LIVE"}</Badge>}
                        {compIsUpcoming && <Badge variant="outline" className="h-4 px-1.5 text-[8px] border-primary/30 text-primary">{isAr ? "قادم" : "Soon"}</Badge>}
                      </div>
                    </div>
                    <div className="text-end shrink-0">
                      <p className="text-xs font-bold text-primary">{regCount}</p>
                      <p className="text-[9px] text-muted-foreground">{isAr ? "مسجل" : "entries"}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {targetAudience.length > 0 && (
        <Card className="overflow-hidden">
          <div className="border-b bg-muted/30 px-4 py-3">
            <h3 className="flex items-center gap-2 font-semibold text-sm">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-muted/60"><Target className="h-3.5 w-3.5 text-muted-foreground" /></div>
              {isAr ? "الفئة المستهدفة" : "Target Audience"}
            </h3>
          </div>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-2">
              {targetAudience.map((a) => <Badge key={a} variant="outline" className="py-1.5 capitalize">{a.replace(/_/g, " ")}</Badge>)}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Highlights */}
      {highlights.length > 0 && (
        <Card className="overflow-hidden">
          <div className="border-b bg-muted/30 px-4 py-3">
            <h3 className="flex items-center gap-2 font-semibold text-sm">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-chart-3/10"><Star className="h-3.5 w-3.5 text-chart-3" /></div>
              {isAr ? "أبرز النقاط" : "Highlights"}
            </h3>
          </div>
          <CardContent className="p-4">
            <div className="grid gap-2 sm:grid-cols-2">
              {highlights.map((h: any, i: number) => (
                <div key={i} className="flex items-center justify-between rounded-xl border p-3">
                  <span className="text-sm font-medium">{isAr && h.label_ar ? h.label_ar : h.label}</span>
                  <Badge variant="secondary">{h.value}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {hasGallery && (
        <Card className="overflow-hidden">
          <div className="border-b bg-muted/30 px-4 py-3 flex items-center justify-between">
            <h3 className="flex items-center gap-2 font-semibold text-sm">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10"><ImageIcon className="h-3.5 w-3.5 text-primary" /></div>
              {isAr ? "معرض الصور" : "Gallery"}
            </h3>
            <Button variant="ghost" size="sm" className="text-xs" onClick={() => onSetActiveTab("gallery")}>{isAr ? "عرض الكل" : "View All"}</Button>
          </div>
          <CardContent className="p-4">
            <div className="grid grid-cols-3 gap-2">
              {galleryUrls.slice(0, 6).map((url, i) => (
                <button key={i} onClick={() => onLightboxOpen(i)} className="group relative aspect-[4/3] overflow-hidden rounded-xl">
                  <img src={url} alt={`${title} ${i + 1}`} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  {i === 5 && galleryUrls.length > 6 && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white font-bold text-sm">+{galleryUrls.length - 6}</div>
                  )}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
});
