import { memo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Plus, Loader2, Eye, Layout, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { HERO_TEMPLATES } from "./heroTemplates";
import { useHeroSlideAdmin } from "./useHeroSlideAdmin";
import { HeroSlideCardHeader } from "./HeroSlideCardHeader";
import { HeroSlideEditor } from "./HeroSlideEditor";
import { HeroSlidePreviewModal } from "./HeroSlidePreviewModal";

// Re-export for backwards compatibility
export type { HeroSlide } from "./heroSlideConstants";

export const HeroSlideAdmin = memo(function HeroSlideAdmin() {
  const h = useHeroSlideAdmin();

  if (h.isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Top action bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="secondary" className="gap-1">
            <Layers className="h-3 w-3" />{h.slides.length} {h.isAr ? "شريحة" : "slides"}
          </Badge>
          <Badge variant="outline" className="text-emerald-600 border-emerald-200 gap-1">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            {h.slides.filter(s => s.is_active).length} {h.isAr ? "نشطة" : "active"}
          </Badge>
          {Object.keys(h.localSlides).length > 0 && (
            <Badge variant="outline" className="text-amber-600 border-amber-200 gap-1">
              {Object.keys(h.localSlides).length} {h.isAr ? "غير محفوظة" : "unsaved"}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm" variant="outline"
            className={cn("gap-1.5 text-xs", h.livePreview && "border-primary/40 bg-primary/5 text-primary")}
            onClick={() => h.setLivePreview(v => !v)}
          >
            <Eye className="h-3.5 w-3.5" />{h.isAr ? "معاينة مباشرة" : "Live Preview"}
          </Button>
          <Button size="sm" onClick={() => h.create.mutate(undefined)} disabled={h.create.isPending} className="gap-1.5">
            {h.create.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
            {h.isAr ? "إضافة شريحة" : "Add Slide"}
          </Button>
        </div>
      </div>

      {/* Quick-add template picker */}
      <div className="rounded-xl border border-border/50 bg-muted/20 p-3">
        <p className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground mb-2.5">
          {h.isAr ? "إضافة سريعة بقالب" : "Quick-add by template"}
        </p>
        <div className="flex flex-wrap gap-2">
          {HERO_TEMPLATES.map(tpl => (
            <button
              key={tpl.id}
              onClick={() => h.create.mutate(tpl.id)}
              disabled={h.create.isPending}
              className="flex items-center gap-1.5 rounded-xl border border-border/50 bg-card px-3 py-1.5 text-xs font-medium hover:border-primary/40 hover:bg-primary/5 hover:text-primary transition-all"
            >
              <Plus className="h-3 w-3" />{tpl.label}
            </button>
          ))}
        </div>
      </div>

      {/* Slide list */}
      <div className="space-y-3">
        {h.slides.map((rawSlide, idx) => {
          const slide = h.getSlide(rawSlide);
          const isOpen = h.expanded === slide.id;
          const isDirty = !!h.localSlides[slide.id];

          return (
            <Card
              key={slide.id}
              className={cn(
                "border-border/50 transition-all duration-200",
                isOpen && "shadow-lg border-primary/30 ring-1 ring-primary/10",
                !slide.is_active && "opacity-60"
              )}
              draggable
              onDragStart={() => { h.dragId.current = slide.id; }}
              onDragOver={e => e.preventDefault()}
              onDrop={() => {
                if (h.dragId.current && h.dragId.current !== slide.id) {
                  const fromIdx = h.slides.findIndex(s => s.id === h.dragId.current);
                  h.reorder.mutate({ id: h.slides[fromIdx].id, newOrder: slide.sort_order });
                  h.reorder.mutate({ id: slide.id, newOrder: h.slides[fromIdx].sort_order });
                  h.dragId.current = null;
                }
              }}
            >
              <HeroSlideCardHeader
                slide={slide}
                rawSlide={rawSlide}
                idx={idx}
                total={h.slides.length}
                isOpen={isOpen}
                isDirty={isDirty}
                isAr={h.isAr}
                onExpand={() => h.setExpanded(isOpen ? null : slide.id)}
                onPreview={() => h.setPreviewSlide(h.getSlide(rawSlide))}
                onMoveUp={() => h.moveSlide(slide.id, "up")}
                onMoveDown={() => h.moveSlide(slide.id, "down")}
                onToggleActive={() => h.toggleActive.mutate({ id: slide.id, is_active: !slide.is_active })}
                onDuplicate={() => h.duplicate.mutate(h.getSlide(rawSlide))}
                duplicating={h.duplicate.isPending}
              />

              {isOpen && (
                <HeroSlideEditor
                  slide={slide}
                  rawSlide={rawSlide}
                  isDirty={isDirty}
                  isAr={h.isAr}
                  livePreview={h.livePreview}
                  previewDevice={h.previewDevice}
                  setPreviewDevice={h.setPreviewDevice}
                  update={h.update}
                  onSave={() => h.handleSave(rawSlide)}
                  onDelete={() => { if (confirm(h.isAr ? "حذف هذه الشريحة؟" : "Delete this slide?")) h.remove.mutate(slide.id); }}
                  onDuplicate={() => h.duplicate.mutate(h.getSlide(rawSlide))}
                  onFullPreview={() => h.setPreviewSlide(h.getSlide(rawSlide))}
                  saving={h.save.isPending}
                  duplicating={h.duplicate.isPending}
                />
              )}
            </Card>
          );
        })}

        {h.slides.length === 0 && (
          <div className="rounded-2xl border-2 border-dashed border-border/50 py-16 text-center">
            <Layout className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">{h.isAr ? "لا توجد شرائح بعد" : "No slides yet"}</p>
            <p className="text-xs text-muted-foreground/60 mt-1">{h.isAr ? "أضف شريحتك الأولى للبدء" : "Add your first slide to get started"}</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {HERO_TEMPLATES.map(tpl => (
                <Button key={tpl.id} size="sm" variant="outline" onClick={() => h.create.mutate(tpl.id)} disabled={h.create.isPending}>
                  <Plus className="h-3.5 w-3.5 me-1" />{tpl.label}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Full-screen preview modal */}
      {h.previewSlide && (
        <HeroSlidePreviewModal
          slide={h.previewSlide}
          isAr={h.isAr}
          previewDevice={h.previewDevice}
          setPreviewDevice={h.setPreviewDevice}
          onClose={() => h.setPreviewSlide(null)}
        />
      )}
    </div>
  );
});
