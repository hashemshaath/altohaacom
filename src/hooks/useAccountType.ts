import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { CACHE } from "@/lib/queryConfig";
import { handleSupabaseError } from "@/lib/supabaseErrorHandler";

type AccountType = Database["public"]["Enums"]["account_type"];

export function useAccountType() {
  const { user } = useAuth();

  const { data: accountType = "fan", ...rest } = useQuery({
    queryKey: ["accountType", user?.id],
    queryFn: async (): Promise<AccountType> => {
      if (!user?.id) return "fan";
      const { data, error } = await supabase
        .from("profiles")
        .select("account_type")
        .eq("user_id", user.id)
        .single();
      if (error) throw handleSupabaseError(error);
      return (data?.account_type as AccountType) || "professional";
    },
    enabled: !!user?.id,
    ...CACHE.long,
  });

  return {
    accountType,
    isFan: accountType === "fan",
    isProfessional: accountType === "professional",
    ...rest,
  };
}
