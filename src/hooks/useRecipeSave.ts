import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { handleSupabaseError } from "@/lib/supabaseErrorHandler";

export function useRecipeSave(recipeId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user || !recipeId) return;
    let cancelled = false;

    const checkSaved = async () => {
      const { data } = await supabase
        .from("recipe_saves")
        .select("id")
        .eq("user_id", user.id)
        .eq("recipe_id", recipeId)
        .maybeSingle();
      if (!cancelled) setIsSaved(!!data);
    };

    checkSaved();
    return () => { cancelled = true; };
  }, [user?.id, recipeId]);

  const toggle = useCallback(async () => {
    if (!user || loading) return;
    setLoading(true);
    try {
      if (isSaved) {
        const { error } = await supabase.from("recipe_saves").delete().eq("user_id", user.id).eq("recipe_id", recipeId);
        if (error) throw handleSupabaseError(error);
        setIsSaved(false);
      } else {
        const { error } = await supabase.from("recipe_saves").insert({ user_id: user.id, recipe_id: recipeId });
        if (error) throw handleSupabaseError(error);
        setIsSaved(true);
      }
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
    } catch (err) {
      if (import.meta.env.DEV) console.error("[useRecipeSave]", err);
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
