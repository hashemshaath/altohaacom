import { useState, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { QUERY_LIMIT_MEDIUM } from "@/lib/constants";
import { HERO_TEMPLATES } from "./heroTemplates";
import { type HeroSlide, defaultSlide } from "./heroSlideConstants";
import { handleSupabaseError } from "@/lib/supabaseErrorHandler";

export function useHeroSlideAdmin() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [expanded, setExpanded] = useState<string | null>(null);
  const [previewSlide, setPreviewSlide] = useState<HeroSlide | null>(null);
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [localSlides, setLocalSlides] = useState<Record<string, HeroSlide>>({});
  const [livePreview, setLivePreview] = useState(true);
  const dragId = useRef<string | null>(null);

  const { data: slides = [], isLoading } = useQuery<HeroSlide[]>({
    queryKey: ["hero-slides-admin"],
    queryFn: async () => {
      const { data, error } = await supabase.from("hero_slides").select("id, title, title_ar, subtitle, subtitle_ar, image_url, link_url, link_label, link_label_ar, sort_order, is_active, template, text_position, overlay_opacity, overlay_color, height_preset, custom_height, badge_text, badge_text_ar, cta_secondary_label, cta_secondary_label_ar, cta_secondary_url, text_color, accent_color, gradient_direction, autoplay_interval, animation_effect, object_fit, object_position").order("sort_order").limit(QUERY_LIMIT_MEDIUM);
      if (error) throw handleSupabaseError(error);
      return (data || []) as HeroSlide[];
    },
  });

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ["hero-slides-admin"] });
    qc.invalidateQueries({ queryKey: ["hero-slides"] });
  };

  const getSlide = useCallback((s: HeroSlide): HeroSlide => localSlides[s.id] ?? s, [localSlides]);

  const update = useCallback((id: string, field: keyof HeroSlide, value: unknown) => {
    setLocalSlides(prev => ({
      ...prev,
      [id]: { ...(prev[id] ?? slides.find(s => s.id === id)!), [field]: value },
    }));
  }, [slides]);

  const save = useMutation({
    mutationFn: async (slide: HeroSlide) => {
      const { id, ...rest } = slide;
      const { error } = await supabase.from("hero_slides").update({ ...rest, updated_at: new Date().toISOString() }).eq("id", id);
      if (error) throw handleSupabaseError(error);
    },
    onSuccess: (_, slide) => {
      invalidateAll();
      setLocalSlides(prev => { const n = { ...prev }; delete n[slide.id]; return n; });
      toast({ title: isAr ? "تم الحفظ ✓" : "Saved ✓" });
    },
    onError: () => toast({ title: isAr ? "خطأ في الحفظ" : "Save failed", variant: "destructive" }),
  });

  const create = useMutation({
    mutationFn: async (template?: string) => {
      const tpl = HERO_TEMPLATES.find(t => t.id === template) ?? HERO_TEMPLATES[0];
      const { error } = await supabase.from("hero_slides").insert({
        ...defaultSlide,
        title: "New Slide",
        title_ar: "شريحة جديدة",
        image_url: "https://images.unsplash.com/photo-1466637574441-749b8f19452f?w=1600&q=80",
        sort_order: slides.length,
        template: tpl.id,
        text_position: tpl.defaultPosition,
        created_by: user?.id,
      });
      if (error) throw handleSupabaseError(error);
    },
    onSuccess: () => { invalidateAll(); toast({ title: isAr ? "تمت الإضافة" : "Slide created" }); },
  });

  const duplicate = useMutation({
    mutationFn: async (slide: HeroSlide) => {
      const { id, sort_order, ...rest } = slide;
      const { error } = await supabase.from("hero_slides").insert({
        ...rest,
        title: `${rest.title} (Copy)`,
        title_ar: rest.title_ar ? `${rest.title_ar} (نسخة)` : null,
        sort_order: slides.length,
        created_by: user?.id,
      });
      if (error) throw handleSupabaseError(error);
    },
    onSuccess: () => { invalidateAll(); toast({ title: isAr ? "تم النسخ" : "Duplicated" }); },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("hero_slides").delete().eq("id", id);
      if (error) throw handleSupabaseError(error);
    },
    onSuccess: () => invalidateAll(),
  });

  const reorder = useMutation({
    mutationFn: async ({ id, newOrder }: { id: string; newOrder: number }) => {
      const { error } = await supabase.from("hero_slides").update({ sort_order: newOrder }).eq("id", id);
      if (error) throw handleSupabaseError(error);
    },
    onSuccess: () => invalidateAll(),
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("hero_slides").update({ is_active }).eq("id", id);
      if (error) throw handleSupabaseError(error);
    },
    onSuccess: () => invalidateAll(),
  });

  const moveSlide = useCallback((id: string, dir: "up" | "down") => {
    const idx = slides.findIndex(s => s.id === id);
    const target = dir === "up" ? idx - 1 : idx + 1;
    if (target < 0 || target >= slides.length) return;
    reorder.mutate({ id: slides[idx].id, newOrder: slides[target].sort_order });
    reorder.mutate({ id: slides[target].id, newOrder: slides[idx].sort_order });
  }, [slides, reorder]);

  const handleSave = useCallback((slide: HeroSlide) => save.mutate(getSlide(slide)), [save, getSlide]);

  return {
    isAr, slides, isLoading, expanded, setExpanded,
    previewSlide, setPreviewSlide, previewDevice, setPreviewDevice,
    localSlides, livePreview, setLivePreview, dragId,
    getSlide, update, save, create, duplicate, remove, reorder, toggleActive,
    moveSlide, handleSave,
  };
}
