export type HeroTemplate = {
  id: string;
  label: string;
  description: string;
  previewGradient: string;
  textAlign: string;
  defaultPosition: string;
};

export const HERO_TEMPLATES: HeroTemplate[] = [
  {
    id: "classic",
    label: "Classic",
    description: "Full-bleed image with text at bottom left. Timeless editorial style.",
    previewGradient: "linear-gradient(to right, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)",
    textAlign: "text-start",
    defaultPosition: "bottom-left",
  },
  {
    id: "centered",
    label: "Centered",
    description: "Text centered over image with a radial dark overlay. Cinematic feel.",
    previewGradient: "radial-gradient(ellipse at center, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.5) 100%)",
    textAlign: "text-center",
    defaultPosition: "center",
  },
  {
    id: "split",
    label: "Split Panel",
    description: "50/50 split: frosted-glass content panel on left, full image on right.",
    previewGradient: "linear-gradient(to right, rgba(0,0,0,0.9) 50%, rgba(0,0,0,0) 50%)",
    textAlign: "text-start",
    defaultPosition: "center-left",
  },
  {
    id: "editorial",
    label: "Editorial",
    description: "Magazine style: bold oversized text bottom-center with horizontal rule.",
    previewGradient: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.1) 100%)",
    textAlign: "text-center",
    defaultPosition: "bottom-center",
  },
  {
    id: "minimal",
    label: "Minimal",
    description: "Light frosted bar at bottom with brief title and CTA. Clean & modern.",
    previewGradient: "linear-gradient(to top, rgba(255,255,255,0.15) 0%, transparent 40%)",
    textAlign: "text-start",
    defaultPosition: "bottom-left",
  },
];

export const templateLabels: Record<string, string> = Object.fromEntries(
  HERO_TEMPLATES.map(t => [t.id, t.label])
);
