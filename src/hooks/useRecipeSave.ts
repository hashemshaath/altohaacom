import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";

export function useRecipeSave(recipeId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user || !recipeId) return;
    supabase
      .from("recipe_saves")
      .select("id")
      .eq("user_id", user.id)
      .eq("recipe_id", recipeId)
      .maybeSingle()
      .then(({ data }) => setIsSaved(!!data));
  }, [user?.id, recipeId]);

  const toggle = useCallback(async () => {
    if (!user || loading) return;
    setLoading(true);
    try {
      if (isSaved) {
        await supabase.from("recipe_saves").delete().eq("user_id", user.id).eq("recipe_id", recipeId);
        setIsSaved(false);
      } else {
        await supabase.from("recipe_saves").insert({ user_id: user.id, recipe_id: recipeId });
        setIsSaved(true);
      }
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
    } finally {
      setLoading(false);
    }
  }, [user, recipeId, isSaved, loading, queryClient]);

  const trackShare = useCallback(async (method: string = "link") => {
    await supabase.from("recipe_shares").insert({
      user_id: user?.id || null,
      recipe_id: recipeId,
      share_method: method,
    });
  }, [user?.id, recipeId]);

  return { isSaved, toggle, loading, trackShare };
}
