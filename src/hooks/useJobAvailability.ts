import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useJobAvailability(profileUserId?: string | null) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["job-availability", profileUserId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("is_open_to_work, job_availability_visibility, preferred_job_types, preferred_work_locations, salary_range_min, salary_range_max, salary_currency, work_availability_note, work_availability_note_ar, willing_to_relocate")
        .eq("user_id", profileUserId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!profileUserId,
  });
}

/** Check if the open_to_work badge should be visible to the current viewer */
export function useCanSeeOpenToWork(profileUserId?: string | null, visibility?: string | null, isFollowing?: boolean) {
  const { user } = useAuth();
  
  if (!visibility || visibility === "private") {
    // Only visible to self
    return user?.id === profileUserId;
  }
  if (visibility === "connections") {
    return user?.id === profileUserId || !!isFollowing;
  }
  // public
  return true;
}
