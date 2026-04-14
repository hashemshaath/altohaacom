/**
 * Shared types for the advertising admin module.
 * Derived from the Supabase schema to eliminate `any`.
 */
import type { Database } from "@/integrations/supabase/types";

export type AdCampaignRow = Database["public"]["Tables"]["ad_campaigns"]["Row"];
export type AdCreativeRow = Database["public"]["Tables"]["ad_creatives"]["Row"];
export type AdPackageRow = Database["public"]["Tables"]["ad_packages"]["Row"];
export type AdPlacementRow = Database["public"]["Tables"]["ad_placements"]["Row"];
export type AdRequestRow = Database["public"]["Tables"]["ad_requests"]["Row"];
export type AdClickRow = Database["public"]["Tables"]["ad_clicks"]["Row"];
export type AdImpressionRow = Database["public"]["Tables"]["ad_impressions"]["Row"];

/** Creative with its joined placement */
export type AdCreativeWithPlacement = AdCreativeRow & {
  ad_placements?: Pick<AdPlacementRow, "name" | "name_ar"> | null;
};

/** Campaign with optional joined company */
export type AdCampaignWithCompany = AdCampaignRow & {
  companies?: { name: string; name_ar: string | null; logo_url?: string | null } | null;
};
