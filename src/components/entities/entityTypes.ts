/**
 * Shared types for entity components (leadership, members, competitions).
 * Eliminates `as any` for joined Supabase relations.
 */
import type { Database } from "@/integrations/supabase/types";

type EntityPositionRow = Database["public"]["Tables"]["entity_positions"]["Row"];

/** Profile shape returned from `profiles:user_id(...)` join */
export interface JoinedProfile {
  id: string;
  user_id?: string;
  full_name: string | null;
  full_name_ar: string | null;
  avatar_url: string | null;
  experience_level: string | null;
  username?: string | null;
}

/** Entity position with joined profile */
export type EntityPositionWithProfile = EntityPositionRow & {
  profiles: JoinedProfile | null;
};

/** Competition join shape from entity_competition_participations */
export interface JoinedCompetition {
  id: string;
  title: string;
  title_ar: string | null;
  status: string | null;
  cover_image_url: string | null;
  competition_start: string | null;
}
