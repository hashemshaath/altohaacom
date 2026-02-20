import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { HeroSlide } from "./HeroSlideAdmin";

function buildGradient(slide: HeroSlide): string {
  const color = slide.overlay_color || "#000000";
  const opacity = (slide.overlay_opacity || 50) / 100;

  // Parse hex to rgba
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  const rgba = `rgba(${r},${g},${b},${opacity})`;
  const rgba0 = `rgba(${r},${g},${b},0)`;

  switch (slide.gradient_direction) {
    case "to-left":    return `linear-gradient(to left, ${rgba}, ${rgba0})`;
    case "to-top":     return `linear-gradient(to top, ${rgba}, ${rgba0})`;
    case "to-bottom":  return `linear-gradient(to bottom, ${rgba}, ${rgba0})`;
    case "radial":     return `radial-gradient(ellipse at center, ${rgba} 0%, ${rgba0} 70%)`;
    case "diagonal":   return `linear-gradient(135deg, ${rgba} 0%, ${rgba0} 60%)`;
    default:           return `linear-gradient(to right, ${rgba}, ${rgba0})`;
  }
}

function getHeightStyle(slide: HeroSlide): React.CSSProperties {
  if (slide.height_preset === "viewport") return { height: "100vh" };
  if (slide.height_preset === "custom" && slide.custom_height) return { height: `${slide.custom_height}px` };
  const presets: Record<string, number> = { compact: 360, medium: 520, large: 680, cinematic: 800 };
  return { height: `${presets[slide.height_preset] || 520}px` };
}

function getImageStyle(slide: HeroSlide): React.CSSProperties {
  return {
    objectFit: (slide.object_fit || "cover") as React.CSSProperties["objectFit"],
    objectPosition: slide.object_position || "center",
  };
}

type TextPosition = {
  outer: string;
  inner: string;
};

function getPositionClasses(pos: string): TextPosition {
  const map: Record<string, TextPosition> = {
    "bottom-left":   { outer: "items-end pb-10 sm:pb-14",  inner: "text-start" },
    "bottom-center": { outer: "items-end pb-10 sm:pb-14",  inner: "text-center mx-auto" },
    "bottom-right":  { outer: "items-end pb-10 sm:pb-14",  inner: "text-end ms-auto" },
    "center":        { outer: "items-center",               inner: "text-center mx-auto" },
    "center-left":   { outer: "items-center",               inner: "text-start" },
    "top-left":      { outer: "items-start pt-10 sm:pt-14", inner: "text-start" },
  };
  return map[pos] || map["bottom-left"];
}

// ─────────────────────────────────────────────
// TEMPLATE: Classic
// ─────────────────────────────────────────────
function ClassicTemplate({ slide }: { slide: HeroSlide }) {
  const pos = getPositionClasses(slide.text_position);
  return (
    <section className="relative overflow-hidden" style={getHeightStyle(slide)}>
      <img src={slide.image_url} alt={slide.title} className="absolute inset-0 h-full w-full scale-105" style={getImageStyle(slide)} />
      <div className="absolute inset-0" style={{ background: buildGradient(slide) }} />
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background/70 to-transparent" />
      <div className={cn("absolute inset-0 flex", pos.outer)}>
        <div className="container">
          <div className={cn("max-w-xl", pos.inner)}>
            {slide.badge_text && (
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5 text-white" />
                <span className="text-xs font-medium text-white">{slide.badge_text}</span>
              </div>
            )}
            <h1 className="font-serif text-2xl font-bold text-white drop-shadow-lg sm:text-4xl md:text-5xl leading-tight">{slide.title}</h1>
            {slide.subtitle && <p className="mt-2 text-sm text-white/80 leading-relaxed sm:text-base line-clamp-2">{slide.subtitle}</p>}
            <div className="mt-5 flex flex-wrap gap-3" style={{ justifyContent: pos.inner.includes("center") ? "center" : pos.inner.includes("end") ? "flex-end" : "flex-start" }}>
              {slide.link_url && slide.link_label && (
                <Button size="sm" className="shadow-lg shadow-primary/30 px-6 sm:text-sm" asChild>
                  <Link to={slide.link_url}>{slide.link_label} <ArrowRight className="ms-1.5 h-3.5 w-3.5" /></Link>
                </Button>
              )}
              {slide.cta_secondary_url && slide.cta_secondary_label && (
                <Button size="sm" variant="outline" className="border-white/30 bg-white/10 text-white hover:bg-white/20 px-6 backdrop-blur-sm" asChild>
                  <Link to={slide.cta_secondary_url}>{slide.cta_secondary_label}</Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
// TEMPLATE: Centered
// ─────────────────────────────────────────────
function CenteredTemplate({ slide }: { slide: HeroSlide }) {
  return (
    <section className="relative flex items-center justify-center overflow-hidden" style={getHeightStyle(slide)}>
      <img src={slide.image_url} alt={slide.title} className="absolute inset-0 h-full w-full scale-105" style={getImageStyle(slide)} />
      <div className="absolute inset-0" style={{ background: buildGradient(slide) }} />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.4)_0%,transparent_70%)]" />
      <div className="relative z-10 container text-center max-w-3xl px-6">
        {slide.badge_text && (
          <Badge className="mb-4 px-4 py-1.5 text-xs uppercase tracking-widest bg-primary/90 text-primary-foreground">
            {slide.badge_text}
          </Badge>
        )}
        <h1 className="font-serif text-3xl font-bold text-white drop-shadow-xl sm:text-5xl md:text-6xl leading-tight">
          {slide.title}
        </h1>
        {slide.subtitle && (
          <p className="mt-4 text-base text-white/75 leading-relaxed sm:text-lg max-w-xl mx-auto">{slide.subtitle}</p>
        )}
        <div className="mt-8 flex flex-wrap gap-3 justify-center">
          {slide.link_url && slide.link_label && (
            <Button size="lg" className="shadow-xl shadow-primary/30 px-8" asChild>
              <Link to={slide.link_url}>{slide.link_label} <ArrowRight className="ms-2 h-4 w-4" /></Link>
            </Button>
          )}
          {slide.cta_secondary_url && slide.cta_secondary_label && (
            <Button size="lg" variant="outline" className="border-white/30 bg-white/10 text-white hover:bg-white/20 px-8 backdrop-blur-sm" asChild>
              <Link to={slide.cta_secondary_url}>{slide.cta_secondary_label}</Link>
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
// TEMPLATE: Split Panel
// ─────────────────────────────────────────────
function SplitTemplate({ slide }: { slide: HeroSlide }) {
  return (
    <section className="relative overflow-hidden" style={getHeightStyle(slide)}>
      <img src={slide.image_url} alt={slide.title} className="absolute inset-0 h-full w-full" style={getImageStyle(slide)} />
      {/* Frosted panel */}
      <div className="absolute inset-y-0 start-0 w-full sm:w-[55%] flex items-center"
        style={{ background: buildGradient(slide) }}>
        <div className="px-8 sm:px-12 md:px-16 max-w-lg">
          {slide.badge_text && (
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5 text-white" />
              <span className="text-xs font-medium text-white">{slide.badge_text}</span>
            </div>
          )}
          <h1 className="font-serif text-2xl font-bold text-white sm:text-4xl md:text-5xl leading-tight">{slide.title}</h1>
          {slide.subtitle && <p className="mt-3 text-sm text-white/80 leading-relaxed sm:text-base">{slide.subtitle}</p>}
          <div className="mt-3 h-0.5 w-12 bg-primary rounded" />
          <div className="mt-6 flex flex-wrap gap-3">
            {slide.link_url && slide.link_label && (
              <Button size="sm" className="shadow-lg shadow-primary/30 px-6" asChild>
                <Link to={slide.link_url}>{slide.link_label} <ArrowRight className="ms-1.5 h-3.5 w-3.5" /></Link>
              </Button>
            )}
            {slide.cta_secondary_url && slide.cta_secondary_label && (
              <Button size="sm" variant="ghost" className="text-white hover:bg-white/15 px-4" asChild>
                <Link to={slide.cta_secondary_url}>{slide.cta_secondary_label}</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
// TEMPLATE: Editorial
// ─────────────────────────────────────────────
function EditorialTemplate({ slide }: { slide: HeroSlide }) {
  return (
    <section className="relative overflow-hidden" style={getHeightStyle(slide)}>
      <img src={slide.image_url} alt={slide.title} className="absolute inset-0 h-full w-full scale-[1.03]" style={getImageStyle(slide)} />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/10" />
      <div className="absolute inset-x-0 bottom-0 z-10 pb-10 sm:pb-14">
        <div className="container text-center">
          {slide.badge_text && (
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-primary">{slide.badge_text}</p>
          )}
          <div className="mx-auto mb-3 h-px w-16 bg-white/30" />
          <h1 className="font-serif text-3xl font-bold text-white drop-shadow-2xl sm:text-5xl md:text-6xl lg:text-7xl leading-none tracking-tight">
            {slide.title}
          </h1>
          {slide.subtitle && (
            <p className="mt-3 text-sm text-white/70 sm:text-base max-w-lg mx-auto">{slide.subtitle}</p>
          )}
          <div className="mt-6 flex flex-wrap gap-3 justify-center">
            {slide.link_url && slide.link_label && (
              <Button size="lg" className="shadow-xl shadow-primary/30 px-10 rounded-full" asChild>
                <Link to={slide.link_url}>{slide.link_label}</Link>
              </Button>
            )}
            {slide.cta_secondary_url && slide.cta_secondary_label && (
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/15 px-10 rounded-full" asChild>
                <Link to={slide.cta_secondary_url}>{slide.cta_secondary_label}</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
// TEMPLATE: Minimal
// ─────────────────────────────────────────────
function MinimalTemplate({ slide }: { slide: HeroSlide }) {
  return (
    <section className="relative overflow-hidden" style={getHeightStyle(slide)}>
      <img src={slide.image_url} alt={slide.title} className="absolute inset-0 h-full w-full" style={getImageStyle(slide)} />
      <div className="absolute inset-0" style={{ background: buildGradient(slide) }} />
      {/* Frosted bottom bar */}
      <div className="absolute inset-x-0 bottom-0 backdrop-blur-md bg-background/70 border-t border-border/20 px-6 py-4 sm:py-5">
        <div className="container flex items-center justify-between gap-4">
          <div className="min-w-0">
            {slide.badge_text && (
              <Badge variant="secondary" className="mb-1.5 text-[10px]">{slide.badge_text}</Badge>
            )}
            <h1 className="font-semibold text-foreground text-base sm:text-xl md:text-2xl truncate">{slide.title}</h1>
            {slide.subtitle && (
              <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-sm">{slide.subtitle}</p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {slide.link_url && slide.link_label && (
              <Button size="sm" className="px-5" asChild>
                <Link to={slide.link_url}>{slide.link_label} <ArrowRight className="ms-1.5 h-3.5 w-3.5" /></Link>
              </Button>
            )}
            {slide.cta_secondary_url && slide.cta_secondary_label && (
              <Button size="sm" variant="outline" className="px-5 hidden sm:flex" asChild>
                <Link to={slide.cta_secondary_url}>{slide.cta_secondary_label}</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
// Router
// ─────────────────────────────────────────────
export function HeroSlidePreview({ slide }: { slide: HeroSlide }) {
  switch (slide.template) {
    case "centered":  return <CenteredTemplate slide={slide} />;
    case "split":     return <SplitTemplate slide={slide} />;
    case "editorial": return <EditorialTemplate slide={slide} />;
    case "minimal":   return <MinimalTemplate slide={slide} />;
    default:          return <ClassicTemplate slide={slide} />;
  }
}
