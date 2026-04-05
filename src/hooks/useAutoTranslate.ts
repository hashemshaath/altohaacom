import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook to auto-translate fields after entity save.
 * Translates missing bilingual fields (en↔ar) using the smart-translate edge function.
 */
export function useAutoTranslate() {
  const translateField = useCallback(async (text: string, from: "en" | "ar", to: "en" | "ar", context?: string): Promise<string | null> => {
    if (!text?.trim()) return null;
    try {
      const { data, error } = await supabase.functions.invoke("smart-translate", {
        body: { text, from, to, context: context || "culinary/food industry/exhibitions/events/organizers" },
      });
      if (error) throw error;
      return data?.translated || null;
    } catch {
      return null;
    }
  }, []);

  /**
   * Auto-fill missing translations for a record.
   * Takes an object with en/ar field pairs and fills in missing ones.
   */
  const autoTranslateFields = useCallback(async (
    fields: { en: string | null; ar: string | null; key: string }[],
    context?: string
  ): Promise<Record<string, string>> => {
    const updates: Record<string, string> = {};
    const promises = fields.map(async (f) => {
      if (f.en && !f.ar) {
        const translated = await translateField(f.en, "en", "ar", context);
        if (translated) updates[`${f.key}_ar`] = translated;
      } else if (f.ar && !f.en) {
        const translated = await translateField(f.ar, "ar", "en", context);
        if (translated) updates[f.key] = translated;
      }
    });
    await Promise.allSettled(promises);
    return updates;
  }, [translateField]);

  return { translateField, autoTranslateFields };
}
