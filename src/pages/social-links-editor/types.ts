import type { ExtraSettings } from "@/lib/socialLinksConstants";

export interface PageForm {
  page_title: string;
  page_title_ar: string;
  bio: string;
  bio_ar: string;
  theme: string;
  button_style: string;
  button_color: string;
  text_color: string;
  background_color: string;
  show_avatar: boolean;
  show_social_icons: boolean;
  is_published: boolean;
  background_image_url: string;
  font_family: string;
}

export interface EditorProfile {
  username?: string | null;
  avatar_url?: string | null;
  full_name?: string | null;
  full_name_ar?: string | null;
  display_name?: string | null;
  display_name_ar?: string | null;
  bio?: string | null;
  bio_ar?: string | null;
  instagram?: string | null;
  twitter?: string | null;
  facebook?: string | null;
  linkedin?: string | null;
  youtube?: string | null;
  tiktok?: string | null;
  snapchat?: string | null;
  website?: string | null;
  phone?: string | null;
  phone2?: string | null;
  whatsapp?: string | null;
  country_code?: string | null;
  job_title?: string | null;
  job_title_ar?: string | null;
}

export interface LinkItem {
  id: string;
  title: string;
  title_ar?: string | null;
  url: string;
  icon?: string | null;
  link_type?: string | null;
  sort_order: number;
  is_active?: boolean | null;
  click_count?: number | null;
  thumbnail_url?: string | null;
  scheduled_start?: string | null;
  scheduled_end?: string | null;
  page_tab?: string | null;
  ab_enabled?: boolean | null;
  ab_variant_title?: string | null;
  ab_variant_title_ar?: string | null;
  ab_variant_icon?: string | null;
  ab_variant_click_count?: number | null;
}

export interface EditorSharedProps {
  form: PageForm;
  updateForm: (updates: Partial<PageForm>) => void;
  extra: ExtraSettings;
  updateExtra: (updates: Partial<ExtraSettings>) => void;
  profile: EditorProfile | null | undefined;
  isAr: boolean;
}
