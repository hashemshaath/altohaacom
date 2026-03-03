import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface HomepageBlock {
  id: string;
  title_en: string;
  title_ar: string;
  subtitle_en: string;
  subtitle_ar: string;
  description_en: string;
  description_ar: string;
  sort_order: number;
  is_visible: boolean;
  // Data
  data_source: string;
  data_filter: Record<string, any>;
  data_limit: number;
  // Display
  display_style: string;
  // Grid
  items_per_row: number;
  items_per_row_tablet: number;
  items_per_row_mobile: number;
  row_count: number;
  grid_gap: string;
  // Carousel
  carousel_autoplay: boolean;
  carousel_speed: number;
  carousel_direction: string;
  carousel_loop: boolean;
  carousel_arrows: boolean;
  carousel_dots: boolean;
  carousel_peek: boolean;
  // Cover
  cover_image_url: string;
  cover_position: string;
  cover_height: number;
  cover_overlay_opacity: number;
  cover_text_align: string;
  // Card
  card_template: string;
  card_image_ratio: string;
  card_image_position: string;
  card_show_avatar: boolean;
  card_show_badge: boolean;
  card_show_rating: boolean;
  card_show_description: boolean;
  card_show_cta: boolean;
  card_cta_text_en: string;
  card_cta_text_ar: string;
  // Item
  item_height: string;
  item_height_custom: number | null;
  // Style
  bg_color: string;
  bg_gradient: string;
  text_color: string;
  section_padding: string;
  container_width: string;
  border_style: string;
  // Animation
  animation: string;
  animation_delay: number;
  // Header
  show_section_header: boolean;
  show_view_all: boolean;
  view_all_link: string;
  show_filters: boolean;
  filter_options: string[];
  // Advanced
  custom_css: string;
  custom_config: Record<string, any>;
  created_at: string;
  updated_at: string;
}

const QUERY_KEY = ["homepage-blocks"];

export function useHomepageBlocks() {
  return useQuery<HomepageBlock[]>({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("homepage_blocks")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data || []) as unknown as HomepageBlock[];
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateHomepageBlock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (block: Partial<HomepageBlock>) => {
      const { data, error } = await supabase
        .from("homepage_blocks")
        .insert(block as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useUpdateHomepageBlock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<HomepageBlock> & { id: string }) => {
      const { error } = await supabase
        .from("homepage_blocks")
        .update(updates as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useDeleteHomepageBlock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("homepage_blocks")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useBulkUpdateHomepageBlocks() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (blocks: { id: string; sort_order: number }[]) => {
      for (const { id, sort_order } of blocks) {
        const { error } = await supabase
          .from("homepage_blocks")
          .update({ sort_order } as any)
          .eq("id", id);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export const DATA_SOURCES = [
  { value: "chefs", labelEn: "Chefs / Profiles", labelAr: "الطهاة / الملفات", icon: "👨‍🍳" },
  { value: "companies", labelEn: "Companies", labelAr: "الشركات", icon: "🏢" },
  { value: "establishments", labelEn: "Establishments", labelAr: "المنشآت", icon: "🏨" },
  { value: "competitions", labelEn: "Competitions", labelAr: "المسابقات", icon: "🏆" },
  { value: "events", labelEn: "Events / Exhibitions", labelAr: "الفعاليات / المعارض", icon: "📅" },
  { value: "articles", labelEn: "Articles / News", labelAr: "المقالات / الأخبار", icon: "📰" },
  { value: "recipes", labelEn: "Recipes", labelAr: "الوصفات", icon: "🍽️" },
  { value: "products", labelEn: "Products", labelAr: "المنتجات", icon: "📦" },
  { value: "custom", labelEn: "Custom / Manual", labelAr: "مخصص / يدوي", icon: "✏️" },
] as const;

export const SORT_OPTIONS = [
  { value: "latest", labelEn: "Latest", labelAr: "الأحدث" },
  { value: "most_viewed", labelEn: "Most Viewed", labelAr: "الأكثر مشاهدة" },
  { value: "top_rated", labelEn: "Top Rated", labelAr: "الأعلى تقييماً" },
  { value: "newly_registered", labelEn: "Newly Registered", labelAr: "المسجلين حديثاً" },
  { value: "featured", labelEn: "Featured", labelAr: "مميز" },
  { value: "trending", labelEn: "Trending", labelAr: "رائج" },
  { value: "random", labelEn: "Random", labelAr: "عشوائي" },
] as const;

export const DISPLAY_STYLES = [
  { value: "grid", labelEn: "Grid", labelAr: "شبكة", icon: "⊞" },
  { value: "carousel", labelEn: "Carousel / Slider", labelAr: "عرض دائري", icon: "↔" },
  { value: "featured_list", labelEn: "Featured + List", labelAr: "مميز + قائمة", icon: "▣" },
  { value: "cover_banner", labelEn: "Cover Banner", labelAr: "بانر غلاف", icon: "▬" },
  { value: "list", labelEn: "List", labelAr: "قائمة", icon: "≡" },
  { value: "masonry", labelEn: "Masonry", labelAr: "متداخل", icon: "▦" },
] as const;

export const CARD_TEMPLATES = [
  { value: "standard", labelEn: "Standard", labelAr: "قياسي", descEn: "Image top, text below" },
  { value: "minimal", labelEn: "Minimal", labelAr: "بسيط", descEn: "Clean, small footprint" },
  { value: "overlay", labelEn: "Overlay", labelAr: "تراكب", descEn: "Text on image" },
  { value: "horizontal", labelEn: "Horizontal", labelAr: "أفقي", descEn: "Image left, text right" },
  { value: "detailed", labelEn: "Detailed", labelAr: "مفصل", descEn: "All info shown" },
  { value: "compact", labelEn: "Compact", labelAr: "مضغوط", descEn: "Tight, minimal space" },
] as const;
