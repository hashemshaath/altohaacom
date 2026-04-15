
export type HeroSlide = {
  id: string;
  title: string;
  title_ar: string | null;
  subtitle: string | null;
  subtitle_ar: string | null;
  image_url: string;
  link_url: string | null;
  link_label: string | null;
  link_label_ar: string | null;
  sort_order: number;
  is_active: boolean;
  template: string;
  text_position: string;
  overlay_opacity: number;
  overlay_color: string;
  height_preset: string;
  custom_height: number | null;
  badge_text: string | null;
  badge_text_ar: string | null;
  cta_secondary_label: string | null;
  cta_secondary_label_ar: string | null;
  cta_secondary_url: string | null;
  text_color: string;
  accent_color: string;
  gradient_direction: string;
  autoplay_interval: number;
  animation_effect: string;
  object_fit: string;
  object_position: string;
};

export const defaultSlide: Omit<HeroSlide, "id" | "sort_order"> = {
  title: "",
  title_ar: "",
  subtitle: "",
  subtitle_ar: "",
  image_url: "",
  link_url: "",
  link_label: "",
  link_label_ar: "",
  is_active: true,
  template: "classic",
  text_position: "bottom-left",
  overlay_opacity: 50,
  overlay_color: "#000000",
  height_preset: "medium",
  custom_height: null,
  badge_text: "",
  badge_text_ar: "",
  cta_secondary_label: "",
  cta_secondary_label_ar: "",
  cta_secondary_url: "",
  text_color: "#ffffff",
  accent_color: "primary",
  gradient_direction: "to-right",
  autoplay_interval: 6000,
  animation_effect: "fade",
  object_fit: "cover",
  object_position: "center",
};

export const HEIGHT_PRESETS: Record<string, { label: string; px: number; desc: string; icon: string }> = {
  compact:   { label: "Compact",       px: 360, desc: "360px – Blog / Banner",     icon: "▬" },
  medium:    { label: "Medium",        px: 520, desc: "520px – Standard Hero",      icon: "▭" },
  large:     { label: "Large",         px: 680, desc: "680px – Full Impact",        icon: "▯" },
  cinematic: { label: "Cinematic",     px: 800, desc: "800px – Editorial",          icon: "⬜" },
  viewport:  { label: "Full Viewport", px: 0,   desc: "100vh – Immersive",          icon: "⛶" },
  custom:    { label: "Custom",        px: 0,   desc: "Set your own height",        icon: "✎" },
};

export const TEXT_POSITIONS = [
  { value: "bottom-left",   label: "↙ Bottom Left" },
  { value: "bottom-center", label: "↓ Bottom Center" },
  { value: "bottom-right",  label: "↘ Bottom Right" },
  { value: "center",        label: "⊕ Center" },
  { value: "center-left",   label: "← Center Left" },
  { value: "top-left",      label: "↖ Top Left" },
];

export const GRADIENT_DIRECTIONS = [
  { value: "to-right",  label: "Left → Right" },
  { value: "to-left",   label: "Right → Left" },
  { value: "to-top",    label: "Bottom → Top" },
  { value: "to-bottom", label: "Top → Bottom" },
  { value: "radial",    label: "Radial (center out)" },
  { value: "diagonal",  label: "Diagonal ↘" },
];

export const ANIMATION_EFFECTS = [
  { value: "fade",      label: "Fade",        desc: "Smooth crossfade" },
  { value: "slide",     label: "Slide",       desc: "Horizontal slide" },
  { value: "zoom",      label: "Zoom In",     desc: "Ken Burns effect" },
  { value: "blur",      label: "Blur In",     desc: "Defocus to focus" },
  { value: "none",      label: "None",        desc: "Instant switch" },
];

export const OBJECT_POSITIONS = [
  { value: "center",        label: "Center" },
  { value: "top",           label: "Top" },
  { value: "bottom",        label: "Bottom" },
  { value: "left",          label: "Left" },
  { value: "right",         label: "Right" },
  { value: "center top",    label: "Center Top" },
  { value: "center bottom", label: "Center Bottom" },
];

export const OVERLAY_PRESETS = [
  { label: "Dark",     color: "#000000", opacity: 55 },
  { label: "Navy",     color: "#0a1628", opacity: 65 },
  { label: "Warm",     color: "#2d1a0a", opacity: 60 },
  { label: "Emerald",  color: "#0a2818", opacity: 60 },
  { label: "Crimson",  color: "#2d0a0a", opacity: 60 },
  { label: "Purple",   color: "#1a0a2d", opacity: 60 },
  { label: "Light",    color: "#ffffff", opacity: 20 },
  { label: "None",     color: "#000000", opacity: 0  },
];
