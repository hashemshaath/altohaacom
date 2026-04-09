import type { ExtraSettings } from "@/lib/socialLinksConstants";
import type { UseMutationResult } from "@tanstack/react-query";

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

/** Typed visitor stats returned from the analytics query */
export interface VisitorStats {
  countries: Record<string, number>;
  devices: Record<string, number>;
  browsers: Record<string, number>;
  referrers: Record<string, number>;
  total: number;
  recent7d: number;
  dailyVisits: { date: string; visits: number }[];
}

/** Typed click analytics returned from the analytics query */
export interface ClickAnalytics {
  heatmap: number[][];
  bestHour: number;
  bestDay: number;
  dailyClicks: { date: string; clicks: number }[];
  hourlyAgg: number[];
  total: number;
  linkDaily: Record<string, Record<string, number>>;
}

/** Bio notification shape */
export interface BioNotification {
  id: string;
  title: string;
  title_ar: string | null;
  body: string | null;
  body_ar: string | null;
  type: string;
  is_read: boolean;
  created_at: string;
  metadata: Record<string, unknown> | null;
}

/** Generic mutation result used in LinksTab props */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ItemMutation<TInput = any, TResult = any> = UseMutationResult<TResult, Error, TInput>;
